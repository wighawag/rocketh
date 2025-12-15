import fs from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';
import {formatEther} from 'viem';
import {
	type Environment,
	type ExecutionParams,
	type ResolvedExecutionParams,
	type UnknownDeployments,
	type UnresolvedNetworkSpecificData,
	type UnresolvedUnknownNamedAccounts,
	type DeployScriptModule,
	type EnhancedEnvironment,
	type ResolvedUserConfig,
	type ConfigOverrides,
	type UserConfig,
	withEnvironment,
	EIP1193ProviderWithoutEvents,
	getChainByName,
	resolveConfig,
	resolveExecutionParams,
	createEnvironment,
	getRoughGasPriceEstimate,
	spin,
} from '@rocketh/core';
import {logger, setLogLevel} from '@rocketh/core/dist/internal/logging.js';
import {traverseMultipleDirectory} from '../utils/fs.js';
import {createFSDeploymentStoreFactory} from '../environment/deployment-store.js';

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
export function setupEnvironment<
	Extensions extends Record<string, (env: Environment<any, any, any>) => any> = {},
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(extensions: Extensions) {
	async function loadAndExecuteDeploymentsWithExtensions<
		Extra extends Record<string, unknown> = Record<string, unknown>,
		ArgumentsType = undefined
	>(
		executionParams: ExecutionParams<Extra>,
		args?: ArgumentsType
	): Promise<EnhancedEnvironment<NamedAccounts, Data, UnknownDeployments, Extensions>> {
		const env = await loadAndExecuteDeployments<NamedAccounts, Data, ArgumentsType, Extra>(executionParams, args);
		return enhanceEnvIfNeeded(env, extensions);
	}

	async function loadEnvironmentWithExtensions(
		executionParams: ExecutionParams<Extra>
	): Promise<EnhancedEnvironment<NamedAccounts, Data, UnknownDeployments, Extensions>> {
		const env = await loadEnvironment<NamedAccounts, Data, Extra>(executionParams);
		return enhanceEnvIfNeeded(env, extensions);
	}

	return {
		loadAndExecuteDeployments: loadAndExecuteDeploymentsWithExtensions,
		loadEnvironment: loadEnvironmentWithExtensions,
	};
}

export function enhanceEnvIfNeeded<
	Extensions extends Record<string, (env: Environment<any, any, any>) => any> = {},
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(
	env: Environment,
	extensions: Extensions
): EnhancedEnvironment<NamedAccounts, Data, UnknownDeployments, Extensions, Extra> {
	// Use the original env object as the base
	const enhancedEnv = env as EnhancedEnvironment<NamedAccounts, Data, UnknownDeployments, Extensions, Extra>;

	// Only create curried functions for extensions not already present in env
	for (const key in extensions) {
		if (!Object.prototype.hasOwnProperty.call(env, key)) {
			// Create curried function only for this specific extension
			const singleExtension: Record<string, unknown> = {};
			singleExtension[key] = (extensions as any)[key];
			const curriedFunction = withEnvironment(env, singleExtension as any);
			(enhancedEnv as any)[key] = (curriedFunction as any)[key];
		}
	}
	return enhancedEnv;
}

export async function readConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData
>(): Promise<UserConfig> {
	type ConfigFile = UserConfig<NamedAccounts, Data>;
	let configFile: ConfigFile | undefined;

	let tsVersion: string | undefined;
	let jsVersion: string | undefined;

	if (typeof process !== 'undefined') {
		const listOfFileToTryForTS = [
			path.join(process.cwd(), 'rocketh.ts'),
			path.join(process.cwd(), 'rocketh', 'config.ts'),
		];
		for (const filepath of listOfFileToTryForTS) {
			if (fs.existsSync(filepath)) {
				tsVersion = `file://${filepath}`;
				break;
			}
		}
		const listOfFileToTryForJS = [
			path.join(process.cwd(), 'rocketh.js'),
			path.join(process.cwd(), 'rocketh', 'config.s'),
		];
		for (const filepath of listOfFileToTryForJS) {
			if (fs.existsSync(filepath)) {
				jsVersion = `file://${filepath}`;
				break;
			}
		}
	}
	const existingConfigs = [tsVersion, jsVersion].filter(Boolean).length;

	// console.log({tsFilePath, tsVersionExists, existingConfigs});

	// Throw error if multiple config files exist
	if (existingConfigs > 1) {
		throw new Error('Multiple configuration files found. Please use only one of: rocketh.ts, rocketh.js');
	}
	if (tsVersion) {
		const moduleLoaded = await import(tsVersion);
		configFile = moduleLoaded.config;
		// console.log({tsVersionExists: configFile});
		// if ((configFile as any).default) {
		// 	configFile = (configFile as any).default as ConfigFile;
		// 	if ((configFile as any).default) {
		// 		logger.warn(`double default...`);
		// 		configFile = (configFile as any).default as ConfigFile;
		// 	}
		// }
	} else if (jsVersion) {
		const moduleLoaded = await import(jsVersion);
		configFile = moduleLoaded.config;
	}

	return configFile || {};
}

export async function readAndResolveConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData
>(overrides?: ConfigOverrides): Promise<ResolvedUserConfig<NamedAccounts, Data>> {
	const configFile = await readConfig();
	return resolveConfig(configFile, overrides);
}

export async function getChainIdForEnvironment(
	config: ResolvedUserConfig,
	environmentName: string,
	provider?: EIP1193ProviderWithoutEvents
) {
	if (config?.environments?.[environmentName]?.chain) {
		const chainAsNumber =
			typeof config.environments[environmentName].chain === 'number'
				? config.environments[environmentName].chain
				: parseInt(config.environments[environmentName].chain);
		if (!isNaN(chainAsNumber)) {
			return chainAsNumber;
		}
		const chainFound = getChainByName(config.environments[environmentName].chain as string);
		if (chainFound) {
			return chainFound.id;
		} else {
			throw new Error(`environment ${environmentName} chain id cannot be found, specify it in the rocketh config`);
		}
	} else {
		const chainFound = getChainByName(environmentName);
		if (chainFound) {
			return chainFound.id;
		} else {
			if (provider) {
				const chainIdAsHex = await provider.request({method: 'eth_chainId'});
				return Number(chainIdAsHex);
			} else {
				throw new Error(`environment ${environmentName} chain id cannot be found, specify it in the rocketh config`);
			}
		}
	}
}

function getEnvironmentName(executionParams: ExecutionParams): {name: string; fork: boolean} {
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

const deploymentStoreFactory = createFSDeploymentStoreFactory();

export async function loadEnvironment<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(executionParams: ExecutionParams<Extra>): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
	const userConfig = await readAndResolveConfig<NamedAccounts, Data>(executionParams.config);
	const {name: environmentName, fork} = getEnvironmentName(executionParams);
	const chainId = await getChainIdForEnvironment(userConfig, environmentName, executionParams.provider);
	const resolvedExecutionParams = resolveExecutionParams(userConfig, executionParams, chainId);
	// console.log(JSON.stringify(resolvedConfig, null, 2));
	const {external, internal} = await createEnvironment<NamedAccounts, Data, UnknownDeployments>(
		userConfig,
		resolvedExecutionParams,
		deploymentStoreFactory
	);
	return external;
}

export async function loadAndExecuteDeployments<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	ArgumentsType = undefined,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(
	executionParams: ExecutionParams<Extra>,
	args?: ArgumentsType
): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
	const userConfig = await readAndResolveConfig<NamedAccounts, Data>(executionParams.config);
	const {name: environmentName, fork} = getEnvironmentName(executionParams);
	const chainId = await getChainIdForEnvironment(userConfig, environmentName, executionParams.provider);
	const resolvedExecutionParams = resolveExecutionParams(userConfig, executionParams, chainId);
	// console.log(JSON.stringify(options, null, 2));
	// console.log(JSON.stringify(resolvedConfig, null, 2));
	return _executeDeployScripts<NamedAccounts, Data, ArgumentsType>(userConfig, resolvedExecutionParams, args);
}

export async function executeDeployScripts<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	ArgumentsType = undefined,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(
	userConfig: UserConfig,
	executionParams?: ExecutionParams<Extra>,
	args?: ArgumentsType
): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
	executionParams = executionParams || {};
	const resolveduserConfig = resolveConfig<NamedAccounts, Data>(userConfig, executionParams.config);
	const {name: environmentName, fork} = getEnvironmentName(executionParams);
	const chainId = await getChainIdForEnvironment(resolveduserConfig, environmentName, executionParams.provider);
	const resolvedExecutionParams = resolveExecutionParams(resolveduserConfig, executionParams, chainId);
	return _executeDeployScripts<NamedAccounts, Data, ArgumentsType>(resolveduserConfig, resolvedExecutionParams, args);
}

async function _executeDeployScripts<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	ArgumentsType = undefined
>(
	userConfig: ResolvedUserConfig<NamedAccounts, Data>,
	resolvedExecutionParams: ResolvedExecutionParams,
	args?: ArgumentsType
): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
	setLogLevel(typeof resolvedExecutionParams.logLevel === 'undefined' ? 0 : resolvedExecutionParams.logLevel);

	let filepaths;
	filepaths = traverseMultipleDirectory(resolvedExecutionParams.scripts);
	filepaths = filepaths
		.filter((v) => !path.basename(v).startsWith('_'))
		.sort((a: string, b: string) => {
			if (a < b) {
				return -1;
			}
			if (a > b) {
				return 1;
			}
			return 0;
		});

	const scriptModuleByFilePath: {[filename: string]: DeployScriptModule<NamedAccounts, Data, ArgumentsType>} = {};
	const scriptPathBags: {[tag: string]: string[]} = {};
	const scriptFilePaths: string[] = [];

	for (const filepath of filepaths) {
		const scriptFilePath = path.resolve(filepath);
		let scriptModule: DeployScriptModule<NamedAccounts, Data, ArgumentsType>;
		try {
			scriptModule = await import(`file://${scriptFilePath}`);

			// console.log({
			// 	scriptFilePath,
			// 	scriptModule,
			// });
			if ((scriptModule as any).default) {
				scriptModule = (scriptModule as any).default as DeployScriptModule<NamedAccounts, Data, ArgumentsType>;
				if ((scriptModule as any).default) {
					logger.warn(`double default...`);
					scriptModule = (scriptModule as any).default as DeployScriptModule<NamedAccounts, Data, ArgumentsType>;
				}
			}
			scriptModuleByFilePath[scriptFilePath] = scriptModule;
		} catch (e) {
			logger.error(`could not import ${filepath}`);
			throw e;
		}

		let scriptTags = scriptModule.tags;
		if (scriptTags !== undefined) {
			if (typeof scriptTags === 'string') {
				scriptTags = [scriptTags];
			}
			for (const tag of scriptTags) {
				if (tag.indexOf(',') >= 0) {
					throw new Error('Tag cannot contains commas');
				}
				const bag = scriptPathBags[tag] || [];
				scriptPathBags[tag] = bag;
				bag.push(scriptFilePath);
			}
		}

		if (resolvedExecutionParams.tags !== undefined && resolvedExecutionParams.tags.length > 0) {
			let found = false;
			if (scriptTags !== undefined) {
				for (const tagToFind of resolvedExecutionParams.tags) {
					for (const tag of scriptTags) {
						if (tag === tagToFind) {
							scriptFilePaths.push(scriptFilePath);
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
			scriptFilePaths.push(scriptFilePath);
		}
	}

	const {internal, external} = await createEnvironment<NamedAccounts, Data, UnknownDeployments>(
		userConfig,
		resolvedExecutionParams,
		deploymentStoreFactory
	);

	await internal.recoverTransactionsIfAny();

	const scriptsRegisteredToRun: {[filename: string]: boolean} = {};
	const scriptsToRun: Array<{
		func: DeployScriptModule<NamedAccounts, Data, ArgumentsType>;
		filePath: string;
	}> = [];
	const scriptsToRunAtTheEnd: Array<{
		func: DeployScriptModule<NamedAccounts, Data, ArgumentsType>;
		filePath: string;
	}> = [];
	function recurseDependencies(scriptFilePath: string) {
		if (scriptsRegisteredToRun[scriptFilePath]) {
			return;
		}
		const scriptModule = scriptModuleByFilePath[scriptFilePath];
		if (scriptModule.dependencies) {
			for (const dependency of scriptModule.dependencies) {
				const scriptFilePathsToAdd = scriptPathBags[dependency];
				if (scriptFilePathsToAdd) {
					for (const scriptFilenameToAdd of scriptFilePathsToAdd) {
						recurseDependencies(scriptFilenameToAdd);
					}
				}
			}
		}
		if (!scriptsRegisteredToRun[scriptFilePath]) {
			if (scriptModule.runAtTheEnd) {
				scriptsToRunAtTheEnd.push({
					filePath: scriptFilePath,
					func: scriptModule,
				});
			} else {
				scriptsToRun.push({
					filePath: scriptFilePath,
					func: scriptModule,
				});
			}
			scriptsRegisteredToRun[scriptFilePath] = true;
		}
	}
	for (const scriptFilePath of scriptFilePaths) {
		recurseDependencies(scriptFilePath);
	}

	if (resolvedExecutionParams.askBeforeProceeding) {
		console.log(
			`Network: ${external.name} \n \t Chain: ${external.network.chain.name} \n \t Tags: ${Object.keys(
				external.tags
			).join(',')}`
		);
		const gasPriceEstimate = await getRoughGasPriceEstimate(external.network.provider);
		const prompt = await prompts({
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
			process.exit();
		}
	}

	for (const deployScript of scriptsToRun.concat(scriptsToRunAtTheEnd)) {
		const filename = path.basename(deployScript.filePath);
		const relativeFilepath = path.relative('.', deployScript.filePath);
		if (deployScript.func.id && external.hasMigrationBeenDone(deployScript.func.id)) {
			logger.info(`skipping ${filename} as migrations already executed and complete`);
			continue;
		}
		let skip = false;
		const spinner = spin(`- Executing ${filename}`);
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
						`${deployScript.filePath} return true to not be executed again, but does not provide an id. the script function needs to have the field "id" to be set`
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
