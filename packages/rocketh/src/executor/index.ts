import {EIP1193GenericRequestProvider, EIP1193ProviderWithoutEvents} from 'eip-1193';
import fs from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';
import {tsImport as tsImport_} from 'tsx/esm/api';
import {formatEther} from 'viem';
import type {
	Environment,
	ExecutionParams,
	JSONTypePlusBigInt,
	ResolvedExecutionParams,
	UnknownDeployments,
	UnresolvedNetworkSpecificData,
	UnresolvedUnknownNamedAccounts,
} from '../environment/types.js';
import {createEnvironment, SignerProtocolFunction} from '../environment/index.js';
import {
	ChainInfo,
	DeployScriptFunction,
	DeployScriptModule,
	EnhancedDeployScriptFunction,
	EnhancedEnvironment,
} from './types.js';
import {withEnvironment} from '../utils/extensions.js';
import {logger, setLogLevel, spin} from '../internal/logging.js';
import {getRoughGasPriceEstimate} from '../utils/eth.js';
import {traverseMultipleDirectory} from '../utils/fs.js';
import {getChainByName, getChainConfig} from '../environment/utils/chains.js';
import {JSONRPCHTTPProvider} from 'eip-1193-jsonrpc-provider';

// @ts-ignore
const tsImport = (path: string, opts: any) => (typeof Bun !== 'undefined' ? import(path) : tsImport_(path, opts));

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
export function setup<
	Extensions extends Record<string, (env: Environment<any, any, any>) => any> = {},
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(extensions: Extensions) {
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
		deployScript: enhancedExecute,
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

export type NamedAccountExecuteFunction<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData
> = <ArgumentsType = undefined, Deployments extends UnknownDeployments = UnknownDeployments>(
	callback: DeployScriptFunction<NamedAccounts, Data, ArgumentsType, Deployments>,
	options: {tags?: string[]; dependencies?: string[]; id?: string}
) => DeployScriptModule<NamedAccounts, Data, ArgumentsType, Deployments>;

export interface UntypedRequestArguments {
	readonly method: string;
	readonly params?: readonly unknown[] | object;
}
export type UntypedEIP1193Provider = {
	request(requestArguments: UntypedRequestArguments): Promise<unknown>;
};

export type ConfigOverrides = {
	deployments?: string;
	scripts?: string | string[];
};

export type Create2DeterministicDeploymentInfo = {
	factory: `0x${string}`;
	deployer: `0x${string}`;
	funding: string;
	signedTx: `0x${string}`;
};

export type Create3DeterministicDeploymentInfo = {
	salt?: `0x${string}`;
	factory: `0x${string}`;
	bytecode: `0x${string}`;
	proxyBytecode: `0x${string}`;
};

export type DeterministicDeploymentInfo =
	| Create2DeterministicDeploymentInfo
	| {
			create2?: Create2DeterministicDeploymentInfo;
			create3?: Create3DeterministicDeploymentInfo;
	  };

export type ChainUserConfig = {
	rpcUrl?: string;
	tags?: string[];
	deterministicDeployment?: DeterministicDeploymentInfo;
	info?: ChainInfo;
	pollingInterval?: number;
	properties?: Record<string, JSONTypePlusBigInt>;
};

export type ChainConfig = {
	rpcUrl: string;
	tags: string[];
	deterministicDeployment: DeterministicDeploymentInfo;
	info: ChainInfo;
	pollingInterval: number;
	properties: Record<string, JSONTypePlusBigInt>;
};

export type DeploymentTargetConfig = {
	chainId: number;
	scripts?: string | string[];
	overrides: Omit<ChainUserConfig, 'info'>;
};

export type Chains = {
	[idOrName: number | string]: ChainUserConfig;
};
export type UserConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData
> = {
	targets?: {[name: string]: DeploymentTargetConfig};
	chains?: Chains;
	deployments?: string;
	scripts?: string | string[];
	accounts?: NamedAccounts;
	data?: Data;
	signerProtocols?: Record<string, SignerProtocolFunction>;
	defaultPollingInterval?: number;
};

export type ResolvedUserConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData
> = UserConfig & {
	deployments: string;
	scripts: string[];
	defaultPollingInterval: number;
};

export async function readConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData
>(overrides: ConfigOverrides): Promise<ResolvedUserConfig<NamedAccounts, Data>> {
	type ConfigFile = UserConfig<NamedAccounts, Data>;
	let configFile: ConfigFile | undefined;

	let tsVersion: string | undefined;
	let jsVersion: string | undefined;

	if (typeof process !== 'undefined') {
		// TODO more sophisticated config file finding mechanism (look up parents, etc..)
		const tsFilePath = path.join(process.cwd(), 'rocketh.ts');
		const jsFilePath = path.join(process.cwd(), 'rocketh.js');

		tsVersion = fs.existsSync(tsFilePath) ? `file://${tsFilePath}` : undefined;
		jsVersion = fs.existsSync(jsFilePath) ? `file://${jsFilePath}` : undefined;
	}
	const existingConfigs = [tsVersion, jsVersion].filter(Boolean).length;

	// console.log({tsFilePath, tsVersionExists, existingConfigs});

	// Throw error if multiple config files exist
	if (existingConfigs > 1) {
		throw new Error('Multiple configuration files found. Please use only one of: rocketh.ts, rocketh.js');
	}
	if (tsVersion) {
		const moduleLoaded = await tsImport(tsVersion, import.meta.url);
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
		const moduleLoaded = await tsImport(jsVersion, import.meta.url);
		configFile = moduleLoaded.config;
	}

	const config = {
		deployments: 'deployments',
		defaultPollingInterval: 1,
		...configFile,
		scripts: configFile?.scripts
			? typeof configFile.scripts === 'string'
				? [configFile.scripts]
				: configFile.scripts
			: ['deploy'],
	};

	for (const key of Object.keys(overrides)) {
		if ((overrides as any)[key] !== undefined) {
			(config as any)[key] = (overrides as any)[key];
		}
	}

	return config;
}

export async function getChainIdForTarget(
	config: ResolvedUserConfig,
	targetName: string,
	provider?: EIP1193ProviderWithoutEvents
) {
	if (config?.targets?.[targetName]?.chainId) {
		return config.targets[targetName].chainId;
	} else {
		const chainFound = getChainByName(targetName);
		if (chainFound) {
			return chainFound.id;
		} else {
			if (provider) {
				const chainIdAsHex = await provider.request({method: 'eth_chainId'});
				return Number(chainIdAsHex);
			} else {
				throw new Error(`target ${targetName} chain id cannot be found, specify it in the rocketh config`);
			}
		}
	}
}

function getTargetName(targetProvided?: string | {fork: string}) {
	let targetName = 'memory';
	if (targetProvided) {
		if (typeof targetProvided === 'string') {
			targetName = targetProvided;
		} else if ('fork' in targetProvided) {
			targetName = targetProvided.fork;
		}
	}
	return targetName;
}

export function resolveExecutionParams<Extra extends Record<string, unknown> = Record<string, unknown>>(
	config: ResolvedUserConfig,
	executionParameters: ExecutionParams<Extra>,
	chainId: number
): ResolvedExecutionParams<Extra> {
	const targetProvided = executionParameters.target || (executionParameters as any).network; // fallback on network
	const fork = typeof targetProvided !== 'string';
	let targetName = getTargetName(targetProvided);

	let chainConfig: ChainConfig = getChainConfig(chainId, config);

	let chainInfo = chainConfig.info;
	const targetConfig = config?.targets?.[targetName];
	const actualChainConfig = targetConfig?.overrides
		? {
				...chainConfig,
				...targetConfig.overrides,
				properties: {
					...chainConfig?.properties,
					...targetConfig.overrides.properties,
				},
		  }
		: chainConfig;

	if (actualChainConfig?.properties) {
		chainInfo = {...chainInfo, properties: actualChainConfig.properties};
	}

	// let targetTags: string[] = actualChainConfig.tags.concat(targetConfig?.tags); // TODO
	const targetTags = actualChainConfig.tags;

	let scripts = ['deploy'];
	if (config.scripts) {
		if (typeof config.scripts === 'string') {
			scripts = [config.scripts];
		} else {
			scripts = config.scripts;
		}
	}

	if (targetConfig?.scripts) {
		if (typeof targetConfig.scripts === 'string') {
			scripts = [targetConfig.scripts];
		} else {
			scripts = targetConfig.scripts;
		}
	}

	const provider =
		executionParameters.provider || (new JSONRPCHTTPProvider(actualChainConfig.rpcUrl) as EIP1193ProviderWithoutEvents);

	let saveDeployments = executionParameters.saveDeployments;

	if (saveDeployments === undefined) {
		if (!executionParameters.provider) {
			saveDeployments = true;
		} else {
			if (targetName === 'memory' || targetName === 'hardhat' || targetName === 'default') {
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
		logLevel: executionParameters.logLevel || 0, // TODO
		pollingInterval: actualChainConfig.pollingInterval,
		reportGasUse: executionParameters.reportGasUse || false,
		saveDeployments,
		tags: executionParameters.tags || [],
		target: {
			name: targetName,
			tags: targetTags,
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
>(executionParams: ExecutionParams<Extra>): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
	const userConfig = await readConfig<NamedAccounts, Data>(executionParams.config);
	const chainId = await getChainIdForTarget(
		userConfig,
		getTargetName(executionParams.target),
		executionParams.provider
	);
	const resolvedExecutionParams = resolveExecutionParams(userConfig, executionParams, chainId);
	// console.log(JSON.stringify(resolvedConfig, null, 2));
	const {external, internal} = await createEnvironment<NamedAccounts, Data, UnknownDeployments>(
		userConfig,
		resolvedExecutionParams
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
	const userConfig = await readConfig<NamedAccounts, Data>(executionParams.config);
	const chainId = await getChainIdForTarget(
		userConfig,
		getTargetName(executionParams.target),
		executionParams.provider
	);
	const resolvedExecutionParams = resolveExecutionParams(userConfig, executionParams, chainId);
	// console.log(JSON.stringify(options, null, 2));
	// console.log(JSON.stringify(resolvedConfig, null, 2));
	return executeDeployScripts<NamedAccounts, Data, ArgumentsType>(userConfig, resolvedExecutionParams, args);
}

export async function executeDeployScripts<
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
			scriptModule = await tsImport(`file://${scriptFilePath}`, import.meta.url);

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
		resolvedExecutionParams
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
