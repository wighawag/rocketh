import {EIP1193GenericRequestProvider, EIP1193ProviderWithoutEvents} from 'eip-1193';
import fs from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';
import {tsImport as tsImport_} from 'tsx/esm/api';
import {formatEther} from 'viem';
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
import {withEnvironment} from '../utils/extensions.js';
import {logger, setLogLevel, spin} from '../internal/logging.js';
import {getRoughGasPriceEstimate} from '../utils/eth.js';
import {traverseMultipleDirectory} from '../utils/fs.js';

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

	async function loadAndExecuteDeploymentsWithExtensions<ArgumentsType = undefined>(
		options: ConfigOptions<Extra>,
		args?: ArgumentsType
	): Promise<EnhancedEnvironment<NamedAccounts, Data, UnknownDeployments, Extensions>> {
		const env = await loadAndExecuteDeployments<NamedAccounts, Data, ArgumentsType, Extra>(options, args);
		return enhanceEnvIfNeeded(env, extensions);
	}

	async function loadEnvironmentWithExtensions(
		options: ConfigOptions<Extra>
	): Promise<EnhancedEnvironment<NamedAccounts, Data, UnknownDeployments, Extensions>> {
		const env = await loadEnvironment<NamedAccounts, Data, Extra>(options);
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
		pollingInterval?: number;
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
	defaultPollingInterval?: number;
};

export function transformUserConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(configFile: UserConfig<NamedAccounts, Data> | undefined, options: ConfigOptions<Extra>): Config<NamedAccounts, Data> {
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
	const defaultPollingInterval = configFile?.defaultPollingInterval;
	const pollingInterval = configFile?.networks?.[networkName]?.pollingInterval;
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
				pollingInterval,
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
			extra: options.extra,
			defaultPollingInterval,
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
				pollingInterval,
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
			extra: options.extra,
			defaultPollingInterval,
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
	const create2Info = {
		factory: '0x4e59b44847b379578588920ca78fbf26c0b4956c',
		deployer: '0x3fab184622dc19b6109349b94811493bf2a45362',
		funding: '10000000000000000',
		signedTx:
			'0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf31ba02222222222222222222222222222222222222222222222222222222222222222a02222222222222222222222222222222222222222222222222222222222222222',
	} as const;
	const create3Info = {
		factory: '0x000000000004d4f168daE7DB3C610F408eE22F57',
		salt: '0x5361109ca02853ca8e22046b7125306d9ec4ae4cdecc393c567b6be861df3db6',
		bytecode:
			'0x6080604052348015600f57600080fd5b506103ca8061001f6000396000f3fe6080604052600436106100295760003560e01c8063360d0fad1461002e5780639881d19514610077575b600080fd5b34801561003a57600080fd5b5061004e610049366004610228565b61008a565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b61004e61008536600461029c565b6100ee565b6040517fffffffffffffffffffffffffffffffffffffffff000000000000000000000000606084901b166020820152603481018290526000906054016040516020818303038152906040528051906020012091506100e78261014c565b9392505050565b6040517fffffffffffffffffffffffffffffffffffffffff0000000000000000000000003360601b166020820152603481018290526000906054016040516020818303038152906040528051906020012091506100e734848461015e565b600061015882306101ce565b92915050565b60006f67363d3d37363d34f03d5260086018f3600052816010806000f58061018e5763301164256000526004601cfd5b8060145261d69460005260016034536017601e20915060008085516020870188855af1823b026101c65763301164256000526004601cfd5b509392505050565b60006040518260005260ff600b53836020527f21c35dbe1b344a2488cf3321d6ce542f8e9f305544ff09e4993a62319a497c1f6040526055600b20601452806040525061d694600052600160345350506017601e20919050565b6000806040838503121561023b57600080fd5b823573ffffffffffffffffffffffffffffffffffffffff8116811461025f57600080fd5b946020939093013593505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600080604083850312156102af57600080fd5b823567ffffffffffffffff8111156102c657600080fd5b8301601f810185136102d757600080fd5b803567ffffffffffffffff8111156102f1576102f161026d565b6040517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0603f7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f8501160116810181811067ffffffffffffffff8211171561035d5761035d61026d565b60405281815282820160200187101561037557600080fd5b816020840160208301376000602092820183015296940135945050505056fea264697066735822122059dcc5dc6453397d13ff28021e28472a80a45bbd97f3135f69bd2650773aeb0164736f6c634300081a0033',
		proxyBytecode: '0x67363d3d37363d34f03d5260086018f3',
	} as const;

	const defaultPollingInterval = config.defaultPollingInterval || 1;
	const networkPollingInterval = config.network.pollingInterval || defaultPollingInterval;

	let deterministicDeployment: {
		create2: Create2DeterministicDeploymentInfo;
		create3: Create3DeterministicDeploymentInfo;
	} = {
		create2: (() => {
			if (!config.network.deterministicDeployment) return create2Info;
			if (
				!('create3' in config.network.deterministicDeployment) &&
				!('create2' in config.network.deterministicDeployment)
			)
				return create2Info;
			return config.network.deterministicDeployment.create2 || create2Info;
		})(),
		create3:
			config.network.deterministicDeployment &&
			'create3' in config.network.deterministicDeployment &&
			config.network.deterministicDeployment.create3
				? config.network.deterministicDeployment.create3
				: create3Info,
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
		network: {...config.network, deterministicDeployment, pollingInterval: networkPollingInterval},
		deployments: config.deployments || 'deployments',
		scripts,
		tags: config.tags || [],
		networkTags: config.networkTags || [],
		saveDeployments: config.saveDeployments,
		accounts: config.accounts || ({} as NamedAccounts),
		data: config.data || ({} as Data),
		signerProtocols: config.signerProtocols || {},
		extra: config.extra || {},
		defaultPollingInterval,
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
