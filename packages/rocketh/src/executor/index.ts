import {traverseMultipleDirectory} from '../utils/fs.js';
import path from 'node:path';
import fs from 'node:fs';
import type {
	Config,
	Environment,
	ResolvedConfig,
	UnknownDeployments,
	UnresolvedNetworkSpecificData,
	UnresolvedUnknownNamedAccounts,
} from '../environment/types.js';
import {createEnvironment, SignerProtocolFunction} from '../environment/index.js';
import {DeployScriptFunction, DeployScriptModule, EnhancedDeployScriptFunction, EnhancedEnvironment} from './types.js';
import {withEnvironment} from '../utils/curry.js';
import {logger, setLogLevel, spin} from '../internal/logging.js';
import {EIP1193GenericRequestProvider, EIP1193ProviderWithoutEvents} from 'eip-1193';
import {getRoughGasPriceEstimate} from '../utils/eth.js';
import prompts from 'prompts';
import {formatEther} from 'viem';
import {tsImport} from 'tsx/esm/api';

/**
 * Setup function that creates the execute function for deploy scripts. It allow to specify a set of functions that will be available in the environment.
 *
 * @param functions - An object of utility functions that expect Environment as their first parameter
 * @returns An execute function that provides an enhanced environment with curried functions
 *
 * @example
 * ```typescript
 * const functions = {
 *   deploy: (env: Environment, contractName: string, args: any[]) => Promise<void>,
 *   verify: (env: Environment, address: string) => Promise<boolean>
 * };
 *
 * const execute = setup(functions);
 *
 * export default execute(async (env, args) => {
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
	Functions extends Record<string, (env: Environment<any, any, any>, ...args: any[]) => any> = {},
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(functions: Functions) {
	return function enhancedExecute<ArgumentsType = undefined>(
		callback: EnhancedDeployScriptFunction<NamedAccounts, Data, ArgumentsType, Deployments, Functions>,
		options: {tags?: string[]; dependencies?: string[]; id?: string; runAtTheEnd?: boolean}
	): DeployScriptModule<NamedAccounts, Data, ArgumentsType, Deployments, Extra> {
		const scriptModule: DeployScriptModule<NamedAccounts, Data, ArgumentsType, Deployments, Extra> = (
			env: Environment<NamedAccounts, Data, Deployments, Extra>,
			args?: ArgumentsType
		) => {
			// Create the enhanced environment by combining the original environment with curried functions
			const curriedFunctions = withEnvironment(env, functions);
			const enhancedEnv = Object.assign(
				Object.create(Object.getPrototypeOf(env)),
				env,
				curriedFunctions
			) as EnhancedEnvironment<NamedAccounts, Data, Deployments, Functions, Extra>;

			return callback(enhancedEnv, args);
		};

		scriptModule.tags = options.tags;
		scriptModule.dependencies = options.dependencies;
		scriptModule.id = options.id;
		scriptModule.runAtTheEnd = options.runAtTheEnd;

		return scriptModule;
	};
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

export type ConfigOptions<Extra extends Record<string, unknown> = Record<string, unknown>> = {
	network?: string | {fork: string};
	deployments?: string;
	scripts?: string | string[];
	tags?: string;
	logLevel?: number;
	provider?: EIP1193ProviderWithoutEvents | EIP1193GenericRequestProvider | UntypedEIP1193Provider;
	ignoreMissingRPC?: boolean;
	saveDeployments?: boolean;
	askBeforeProceeding?: boolean;
	reportGasUse?: boolean;
	extra?: Extra;
};

export type DeterministicDeploymentInfo = {
	factory: `0x${string}`;
	deployer: `0x${string}`;
	funding: string;
	signedTx: `0x${string}`;
};
type Networks = {
	[name: string]: {
		rpcUrl?: string;
		tags?: string[];
		deterministicDeployment?: DeterministicDeploymentInfo;
		scripts?: string | string[];
		publicInfo?: {
			name: string;
			nativeCurrency: {
				name: string;
				symbol: string;
				decimals: number;
			};
			rpcUrls: {
				default: {
					http: string[];
				};
			};
			chainType?: string;
		};
	};
};
export type UserConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData
> = {
	networks?: Networks;
	deployments?: string;
	scripts?: string | string[];
	accounts?: NamedAccounts;
	data?: Data;
	signerProtocols?: Record<string, SignerProtocolFunction>;
};

export function transformUserConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(configFile: UserConfig<NamedAccounts, Data> | undefined, options: ConfigOptions<Extra>) {
	if (configFile) {
		if (!options.deployments && configFile.deployments) {
			options.deployments = configFile.deployments;
		}
		if (!options.scripts && configFile.scripts) {
			options.scripts = configFile.scripts;
		}
	}

	const fromEnv = process.env['ETH_NODE_URI_' + options.network];
	const fork = typeof options.network !== 'string';
	let networkName = 'memory';
	if (options.network) {
		if (typeof options.network === 'string') {
			networkName = options.network;
		} else if ('fork' in options.network) {
			networkName = options.network.fork;
		}
	}

	let defaultTags: string[] = [];

	let networkTags: string[] =
		(configFile?.networks && (configFile?.networks[networkName]?.tags || configFile?.networks['default']?.tags)) ||
		defaultTags;

	let networkScripts: string | string[] | undefined =
		(configFile?.networks &&
			(configFile?.networks[networkName]?.scripts || configFile?.networks['default']?.scripts)) ||
		undefined;

	// no default for publicInfo
	const publicInfo = configFile?.networks ? configFile?.networks[networkName]?.publicInfo : undefined;
	const deterministicDeployment = configFile?.networks?.[networkName]?.deterministicDeployment;
	if (!options.provider) {
		let nodeUrl: string;
		if (typeof fromEnv === 'string') {
			nodeUrl = fromEnv;
		} else {
			if (configFile) {
				const network = configFile.networks && configFile.networks[networkName];
				if (network && network.rpcUrl) {
					nodeUrl = network.rpcUrl;
				} else {
					if (options?.ignoreMissingRPC) {
						nodeUrl = '';
					} else {
						if (options.network === 'localhost') {
							nodeUrl = 'http://127.0.0.1:8545';
						} else {
							console.error(`network "${options.network}" is not configured. Please add it to the rocketh.js/ts file`);
							process.exit(1);
						}
					}
				}
			} else {
				if (options?.ignoreMissingRPC) {
					nodeUrl = '';
				} else {
					if (options.network === 'localhost') {
						nodeUrl = 'http://127.0.0.1:8545';
					} else {
						console.error(`network "${options.network}" is not configured. Please add it to the rocketh.js/ts file`);
						process.exit(1);
					}
				}
			}
		}

		return {
			network: {
				nodeUrl,
				name: networkName,
				tags: networkTags,
				fork,
				deterministicDeployment,
				scripts: networkScripts,
				publicInfo,
			},
			deployments: options.deployments,
			saveDeployments: options.saveDeployments,
			scripts: options.scripts,
			data: configFile?.data,
			tags: typeof options.tags === 'undefined' ? undefined : options.tags.split(','),
			logLevel: options.logLevel,
			askBeforeProceeding: options.askBeforeProceeding,
			reportGasUse: options.reportGasUse,
			accounts: configFile?.accounts,
			signerProtocols: configFile?.signerProtocols,
		};
	} else {
		return {
			network: {
				provider: options.provider as EIP1193ProviderWithoutEvents,
				name: networkName,
				tags: networkTags,
				fork,
				deterministicDeployment,
				scripts: networkScripts,
				publicInfo,
			},
			deployments: options.deployments,
			saveDeployments: options.saveDeployments,
			scripts: options.scripts,
			data: configFile?.data,
			tags: typeof options.tags === 'undefined' ? undefined : options.tags.split(','),
			logLevel: options.logLevel,
			askBeforeProceeding: options.askBeforeProceeding,
			reportGasUse: options.reportGasUse,
			accounts: configFile?.accounts,
			signerProtocols: configFile?.signerProtocols,
		};
	}
}

export async function readConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(options: ConfigOptions<Extra>): Promise<Config<NamedAccounts, Data>> {
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

	return transformUserConfig(configFile, options);
}

export async function readAndResolveConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(options: ConfigOptions<Extra>): Promise<ResolvedConfig<NamedAccounts, Data>> {
	return resolveConfig<NamedAccounts, Data>(await readConfig<NamedAccounts, Data>(options));
}

export function resolveConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData
>(config: Config<NamedAccounts, Data>): ResolvedConfig<NamedAccounts, Data> {
	let deterministicDeployment: DeterministicDeploymentInfo = config.network.deterministicDeployment || {
		factory: '0x4e59b44847b379578588920ca78fbf26c0b4956c',
		deployer: '0x3fab184622dc19b6109349b94811493bf2a45362',
		funding: '10000000000000000',
		signedTx:
			'0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf31ba02222222222222222222222222222222222222222222222222222222222222222a02222222222222222222222222222222222222222222222222222222222222222',
	};

	let scripts = ['deploy'];
	if (config.scripts) {
		if (typeof config.scripts === 'string') {
			scripts = [config.scripts];
		} else {
			scripts = config.scripts;
		}
	}

	if (config.network.scripts) {
		if (typeof config.network.scripts === 'string') {
			scripts = [config.network.scripts];
		} else {
			scripts = config.network.scripts;
		}
	}
	const resolvedConfig: ResolvedConfig<NamedAccounts, Data> = {
		...config,
		network: {...config.network, deterministicDeployment},
		deployments: config.deployments || 'deployments',
		scripts,
		tags: config.tags || [],
		networkTags: config.networkTags || [],
		saveDeployments: config.saveDeployments,
		accounts: config.accounts || ({} as NamedAccounts),
		data: config.data || ({} as Data),
		signerProtocols: config.signerProtocols || {},
		extra: config.extra || {},
	};
	return resolvedConfig;
}

export async function loadEnvironment<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(options: ConfigOptions<Extra>): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
	const resolvedConfig = await readAndResolveConfig<NamedAccounts, Data>(options);
	// console.log(JSON.stringify(resolvedConfig, null, 2));
	const {external, internal} = await createEnvironment(resolvedConfig);
	return external;
}

export async function loadAndExecuteDeployments<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	ArgumentsType = undefined,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(options: ConfigOptions<Extra>, args?: ArgumentsType): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
	const resolvedConfig = await readAndResolveConfig<NamedAccounts, Data>(options);
	// console.log(JSON.stringify(options, null, 2));
	// console.log(JSON.stringify(resolvedConfig, null, 2));
	return executeDeployScripts<NamedAccounts, Data, ArgumentsType>(resolvedConfig, args);
}

export async function executeDeployScripts<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	ArgumentsType = undefined
>(
	config: ResolvedConfig<NamedAccounts, Data>,
	args?: ArgumentsType
): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
	setLogLevel(typeof config.logLevel === 'undefined' ? 0 : config.logLevel);

	let filepaths;
	filepaths = traverseMultipleDirectory(config.scripts);
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

		if (config.tags !== undefined && config.tags.length > 0) {
			let found = false;
			if (scriptTags !== undefined) {
				for (const tagToFind of config.tags) {
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

	const {internal, external} = await createEnvironment(config);

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

	if (config.askBeforeProceeding) {
		console.log(
			`Network: ${external.network.name} \n \t Chain: ${external.network.chain.name} \n \t Tags: ${Object.keys(
				external.network.tags
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

	if (config.reportGasUse) {
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
