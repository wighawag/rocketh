import {EIP1193ProviderWithoutEvents} from 'eip-1193';

import type {
	Environment,
	ExecutionParams,
	ResolvedExecutionParams,
	UnknownDeployments,
	UnresolvedNetworkSpecificData,
	UnresolvedUnknownNamedAccounts,
	DeployScriptModule,
	EnhancedDeployScriptFunction,
	EnhancedEnvironment,
	ResolvedUserConfig,
	ConfigOverrides,
	UserConfig,
	PromptExecutor,
	DeploymentStore,
	ModuleObject,
} from '@rocketh/core/types';
import {withEnvironment} from '@rocketh/core/environment';
import {
	getChainConfigFromUserConfigAndDefaultChainInfo,
	getDefaultChainInfoByName,
	getDefaultChainInfoFromChainId,
} from '../environment/chains.js';
import {JSONRPCHTTPProvider} from 'eip-1193-jsonrpc-provider';
import {createEnvironment} from '../environment/index.js';
import {getRoughGasPriceEstimate} from '../utils/eth.js';
import {formatEther} from 'viem';
import {logger, spin} from '../internal/logging.js';

/**
 * Setup function that creates the execute function for deploy scripts. It allow to specify a set of functions that will be available in the environment.
 *
 * @param functions - An object of utility functions that expect Environment as their first parameter
 * @returns An execute function that provides an enhanced environment with curried functions
 *
 * @example
 * ```typescript
 * const functions = {
 *   deploy: (env: Environment) => ((contractName: string, args: any[]) => Promise<void>),
 *   verify: (env: Environment) => ((address: string) => Promise<boolean>)
 * };
 *
 * const {deployScript} = setup(functions);
 *
 * export default deployScript(async (env, args) => {
 *   // env now includes both the original environment AND the curried functions
 *   await env.deploy('MyContract', []); // No need to pass env
 *   await env.verify('0x123...'); // No need to pass env
 *
 *   // Original environment properties are still available
 *   console.log(env.network.name);
 *   const deployment = env.get('MyContract');
 * }, { tags: ['deploy'] });
 * ```
 */
export function setupDeployScripts<
	Extensions extends Record<string, (env: Environment<any, any, any>) => any> = {},
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(
	extensions: Extensions
): {
	deployScript<ArgumentsType = undefined>(
		callback: EnhancedDeployScriptFunction<NamedAccounts, Data, ArgumentsType, Deployments, Extensions>,
		options: {tags?: string[]; dependencies?: string[]; id?: string; runAtTheEnd?: boolean}
	): DeployScriptModule<NamedAccounts, Data, ArgumentsType, Deployments, Extra>;
} {
	function enhancedExecute<ArgumentsType = undefined>(
		callback: EnhancedDeployScriptFunction<NamedAccounts, Data, ArgumentsType, Deployments, Extensions>,
		options: {tags?: string[]; dependencies?: string[]; id?: string; runAtTheEnd?: boolean}
	): DeployScriptModule<NamedAccounts, Data, ArgumentsType, Deployments, Extra> {
		const scriptModule: DeployScriptModule<NamedAccounts, Data, ArgumentsType, Deployments, Extra> = (
			env: Environment<NamedAccounts, Data, Deployments, Extra>,
			args?: ArgumentsType
		) => {
			// Create the enhanced environment by combining the original environment with extensions
			const curriedFunctions = withEnvironment(env, extensions);
			const enhancedEnv = Object.assign(
				Object.create(Object.getPrototypeOf(env)),
				env,
				curriedFunctions
			) as EnhancedEnvironment<NamedAccounts, Data, Deployments, Extensions, Extra>;

			return callback(enhancedEnv, args);
		};

		scriptModule.tags = options.tags;
		scriptModule.dependencies = options.dependencies;
		scriptModule.id = options.id;
		scriptModule.runAtTheEnd = options.runAtTheEnd;

		return scriptModule;
	}

	return {
		deployScript: enhancedExecute,
	};
}

export function resolveConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData
>(configFile: UserConfig, overrides?: ConfigOverrides): ResolvedUserConfig<NamedAccounts, Data> {
	const config = {
		deployments: 'deployments',
		defaultPollingInterval: 1,
		...configFile,
		scripts: configFile?.scripts
			? typeof configFile.scripts === 'string'
				? [configFile.scripts]
				: configFile.scripts.length == 0
				? ['deploy']
				: configFile.scripts
			: ['deploy'],
	};

	if (overrides) {
		for (const key of Object.keys(overrides)) {
			if ((overrides as any)[key] !== undefined) {
				(config as any)[key] = (overrides as any)[key];
			}
		}
	}

	return config;
}

export async function getChainIdForEnvironment(
	config: ResolvedUserConfig,
	environmentName: string,
	provider?: EIP1193ProviderWithoutEvents
) {
	let chainId: number;
	const chainIdFromProvider = provider ? Number(await provider.request({method: 'eth_chainId'})) : undefined;
	if (config?.environments?.[environmentName]?.chain) {
		const chainAsNumber =
			typeof config.environments[environmentName].chain === 'number'
				? config.environments[environmentName].chain
				: parseInt(config.environments[environmentName].chain);
		if (!isNaN(chainAsNumber)) {
			chainId = chainAsNumber;
		} else {
			const chainFound = getDefaultChainInfoByName(config.environments[environmentName].chain as string);
			if (chainFound) {
				chainId = chainFound.id;
			} else {
				throw new Error(`environment ${environmentName} chain id cannot be found, specify it in the rocketh config`);
			}
		}
	} else {
		const chainFound = getDefaultChainInfoByName(environmentName);
		if (chainFound) {
			chainId = chainFound.id;
		} else {
			if (chainIdFromProvider) {
				chainId = chainIdFromProvider;
			} else {
				throw new Error(`environment ${environmentName} chain id cannot be found, specify it in the rocketh config`);
			}
		}
	}
	if (chainIdFromProvider && chainIdFromProvider != chainId) {
		console.warn(
			`provider give a different chainId (${chainIdFromProvider}) than the one expected for environment named "${environmentName}" (${chainId})`
		);
	}
	return chainIdFromProvider || chainId;
}

export function getEnvironmentName(executionParams: ExecutionParams): {name: string; fork: boolean} {
	const environmentProvided = executionParams.environment || (executionParams as any).network;
	let environmentName = 'memory';
	if (environmentProvided) {
		if (typeof environmentProvided === 'string') {
			environmentName = environmentProvided;
		} else if ('fork' in environmentProvided) {
			environmentName = environmentProvided.fork;
		}
	}
	const fork = typeof environmentProvided !== 'string';
	return {name: environmentName, fork};
}

export function resolveExecutionParams<Extra extends Record<string, unknown> = Record<string, unknown>>(
	config: ResolvedUserConfig,
	executionParameters: ExecutionParams<Extra>,
	chainId: number
): ResolvedExecutionParams<Extra> {
	const {name: environmentName, fork} = getEnvironmentName(executionParameters);

	// TODO fork chainId resolution option to keep the network being used
	const idToFetch = fork ? 31337 : chainId;
	let chainInfoFound = getDefaultChainInfoByName(environmentName);
	if (!chainInfoFound) {
		// console.log(`could not find chainInfo by name = "${environmentName}"`);
		chainInfoFound = getDefaultChainInfoFromChainId(idToFetch);
		if (!chainInfoFound) {
			// console.log(`could not find chainInfo by chainId = "${idToFetch}"`);
		}
	}

	const defaultChainInfo = chainInfoFound;
	const chainConfig = getChainConfigFromUserConfigAndDefaultChainInfo(config, {
		id: idToFetch,
		chainInfo: defaultChainInfo,
		canonicalName: environmentName,
		doNotRequireRpcURL: !!executionParameters.provider,
	});

	let chainInfo = chainConfig.info;
	const environmentConfig = config?.environments?.[environmentName];
	const actualChainConfig = environmentConfig?.overrides
		? {
				...chainConfig,
				...environmentConfig.overrides,
				properties: {
					...chainConfig?.properties,
					...environmentConfig.overrides.properties,
				},
		  }
		: chainConfig;

	if (actualChainConfig?.properties) {
		chainInfo = {...chainInfo, properties: actualChainConfig.properties};
	}

	// let environmentTags: string[] = actualChainConfig.tags.concat(environmentConfig?.tags); // TODO
	const environmentTags = actualChainConfig.tags;

	let scripts = ['deploy'];
	if (config.scripts) {
		if (typeof config.scripts === 'string') {
			scripts = [config.scripts];
		} else {
			scripts = [...config.scripts];
		}
	}

	if (environmentConfig?.scripts) {
		if (typeof environmentConfig.scripts === 'string') {
			scripts = [environmentConfig.scripts];
		} else {
			scripts = [...environmentConfig.scripts];
		}
	}

	// here we force type actualChainConfig.rpcUrl! as string
	// as if provider was not available
	// getChainConfigFromUserConfigAndDefaultChainInfo would throw
	const provider =
		executionParameters.provider ||
		(new JSONRPCHTTPProvider(actualChainConfig.rpcUrl!) as EIP1193ProviderWithoutEvents);

	let saveDeployments = executionParameters.saveDeployments;

	if (saveDeployments === undefined) {
		if (!executionParameters.provider) {
			saveDeployments = true;
		} else {
			if (environmentName === 'memory' || environmentName === 'hardhat' || environmentName === 'default') {
				// networkTags['memory'] = true;
				saveDeployments = false;
			} else {
				saveDeployments = true;
			}
		}
	}

	return {
		askBeforeProceeding: executionParameters.askBeforeProceeding || false,
		chain: chainInfo,
		pollingInterval: actualChainConfig.pollingInterval,
		reportGasUse: executionParameters.reportGasUse || false,
		saveDeployments,
		tags: executionParameters.tags || [],
		environment: {
			name: environmentName,
			tags: environmentTags,
			fork,
			deterministicDeployment: actualChainConfig.deterministicDeployment,
		},
		extra: executionParameters.extra,
		provider,
		scripts,
	};
}

export async function loadEnvironment<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(
	config: UserConfig<NamedAccounts, Data>,
	executionParams: ExecutionParams<Extra>,
	deploymentStore: DeploymentStore
): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
	const userConfig = resolveConfig<NamedAccounts, Data>(config, executionParams.config);
	const {name: environmentName, fork} = getEnvironmentName(executionParams);
	const chainId = await getChainIdForEnvironment(userConfig, environmentName, executionParams.provider);
	const resolvedExecutionParams = resolveExecutionParams(userConfig, executionParams, chainId);
	// console.log(JSON.stringify(resolvedConfig, null, 2));
	const {external, internal} = await createEnvironment<NamedAccounts, Data, UnknownDeployments>(
		userConfig,
		resolvedExecutionParams,
		deploymentStore
	);
	return external;
}

export function createExecutor(deploymentStore: DeploymentStore, promptExecutor: PromptExecutor) {
	async function resolveConfigAndExecuteDeployScriptModules<
		NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
		Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
		ArgumentsType = undefined,
		Extra extends Record<string, unknown> = Record<string, unknown>
	>(
		moduleObjects: ModuleObject<NamedAccounts, Data, ArgumentsType>[],
		userConfig: UserConfig,
		executionParams?: ExecutionParams<Extra>,
		args?: ArgumentsType
	): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
		executionParams = executionParams || {};
		const resolveduserConfig = resolveConfig<NamedAccounts, Data>(userConfig, executionParams.config);
		const {name: environmentName, fork} = getEnvironmentName(executionParams);
		const chainId = await getChainIdForEnvironment(resolveduserConfig, environmentName, executionParams.provider);
		const resolvedExecutionParams = resolveExecutionParams(resolveduserConfig, executionParams, chainId);
		return executeDeployScriptModules<NamedAccounts, Data, ArgumentsType>(
			moduleObjects,
			resolveduserConfig,
			resolvedExecutionParams,
			args
		);
	}

	async function executeDeployScriptModules<
		NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
		Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
		ArgumentsType = undefined
	>(
		moduleObjects: ModuleObject<NamedAccounts, Data, ArgumentsType>[],
		userConfig: ResolvedUserConfig<NamedAccounts, Data>,
		resolvedExecutionParams: ResolvedExecutionParams,
		args?: ArgumentsType
	): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
		const scriptModuleById: {[id: string]: DeployScriptModule<NamedAccounts, Data, ArgumentsType>} = {};
		const scriptIdBags: {[tag: string]: string[]} = {};
		const ids: string[] = [];

		for (const moduleObject of moduleObjects) {
			const id = moduleObject.id;
			let scriptModule = moduleObject.module;
			scriptModuleById[id] = scriptModule;

			let scriptTags = scriptModule.tags;
			if (scriptTags !== undefined) {
				if (typeof scriptTags === 'string') {
					scriptTags = [scriptTags];
				}
				for (const tag of scriptTags) {
					if (tag.indexOf(',') >= 0) {
						throw new Error('Tag cannot contains commas');
					}
					const bag = scriptIdBags[tag] || [];
					scriptIdBags[tag] = bag;
					bag.push(id);
				}
			}

			if (resolvedExecutionParams.tags !== undefined && resolvedExecutionParams.tags.length > 0) {
				let found = false;
				if (scriptTags !== undefined) {
					for (const tagToFind of resolvedExecutionParams.tags) {
						for (const tag of scriptTags) {
							if (tag === tagToFind) {
								ids.push(id);
								found = true;
								break;
							}
						}
						if (found) {
							break;
						}
					}
				}
			} else {
				ids.push(id);
			}
		}

		const {internal, external} = await createEnvironment<NamedAccounts, Data, UnknownDeployments>(
			userConfig,
			resolvedExecutionParams,
			deploymentStore
		);

		await internal.recoverTransactionsIfAny();

		const scriptsRegisteredToRun: {[filename: string]: boolean} = {};
		const scriptsToRun: Array<{
			func: DeployScriptModule<NamedAccounts, Data, ArgumentsType>;
			id: string;
		}> = [];
		const scriptsToRunAtTheEnd: Array<{
			func: DeployScriptModule<NamedAccounts, Data, ArgumentsType>;
			id: string;
		}> = [];
		function recurseDependencies(id: string) {
			if (scriptsRegisteredToRun[id]) {
				return;
			}
			const scriptModule = scriptModuleById[id];
			if (scriptModule.dependencies) {
				for (const dependency of scriptModule.dependencies) {
					const scriptFilePathsToAdd = scriptIdBags[dependency];
					if (scriptFilePathsToAdd) {
						for (const scriptFilenameToAdd of scriptFilePathsToAdd) {
							recurseDependencies(scriptFilenameToAdd);
						}
					}
				}
			}
			if (!scriptsRegisteredToRun[id]) {
				if (scriptModule.runAtTheEnd) {
					scriptsToRunAtTheEnd.push({
						id: id,
						func: scriptModule,
					});
				} else {
					scriptsToRun.push({
						id: id,
						func: scriptModule,
					});
				}
				scriptsRegisteredToRun[id] = true;
			}
		}
		for (const id of ids) {
			recurseDependencies(id);
		}

		// TODO store in the execution context
		const gasPriceEstimate = await getRoughGasPriceEstimate(external.network.provider);
		if (resolvedExecutionParams.askBeforeProceeding) {
			console.log(
				`Network: ${external.name} \n \t Chain: ${external.network.chain.name} \n \t Tags: ${Object.keys(
					external.tags
				).join(',')}`
			);

			const prompt = await promptExecutor.prompt({
				type: 'confirm',
				name: 'proceed',
				message: `gas price is currently in this range:
slow: ${formatEther(gasPriceEstimate.slow.maxFeePerGas)} (priority: ${formatEther(
					gasPriceEstimate.slow.maxPriorityFeePerGas
				)})
average: ${formatEther(gasPriceEstimate.average.maxFeePerGas)} (priority: ${formatEther(
					gasPriceEstimate.average.maxPriorityFeePerGas
				)})
fast: ${formatEther(gasPriceEstimate.fast.maxFeePerGas)} (priority: ${formatEther(
					gasPriceEstimate.fast.maxPriorityFeePerGas
				)})

Do you want to proceed (note that gas price can change for each tx)`,
			});

			if (!prompt.proceed) {
				promptExecutor.exit();
			}
		}

		for (const deployScript of scriptsToRun.concat(scriptsToRunAtTheEnd)) {
			if (deployScript.func.id && external.hasMigrationBeenDone(deployScript.func.id)) {
				logger.info(`skipping ${deployScript.id} as migrations already executed and complete`);
				continue;
			}
			let skip = false;
			const spinner = spin(`- Executing ${deployScript.id}`);
			// if (deployScript.func.skip) {
			// 	const spinner = spin(`  - skip?()`);
			// 	try {
			// 		skip = await deployScript.func.skip(external, args);
			// 		spinner.succeed(skip ? `skipping ${filename}` : undefined);
			// 	} catch (e) {
			// 		spinner.fail();
			// 		throw e;
			// 	}
			// }
			if (!skip) {
				let result;

				try {
					result = await deployScript.func(external, args);
					spinner.succeed(`\n`);
				} catch (e) {
					spinner.fail();
					throw e;
				}
				if (result && typeof result === 'boolean') {
					if (!deployScript.func.id) {
						throw new Error(
							`${deployScript.id} return true to not be executed again, but does not provide an id. the script function needs to have the field "id" to be set`
						);
					}
					internal.recordMigration(deployScript.func.id);
				}
			}
		}

		if (resolvedExecutionParams.reportGasUse) {
			const provider = external.network.provider;
			const transactionHashes = provider.transactionHashes;

			let totalGasUsed = 0;
			for (const hash of transactionHashes) {
				const transactionReceipt = await provider.request({method: 'eth_getTransactionReceipt', params: [hash]});
				if (transactionReceipt) {
					const gasUsed = Number(transactionReceipt.gasUsed);
					totalGasUsed += gasUsed;
				}
			}

			console.log({totalGasUsed});
		}

		return external;
	}

	return {
		executeDeployScriptModules,
		resolveConfigAndExecuteDeployScriptModules,
	};
}
