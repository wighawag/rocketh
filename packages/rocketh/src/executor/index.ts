import {traverseMultipleDirectory} from '../utils/fs.js';
import path from 'node:path';
import fs from 'node:fs';
import type {
	Config,
	Environment,
	ResolvedConfig,
	ResolvedNamedAccounts,
	UnknownArtifacts,
	UnknownDeployments,
	UnresolvedUnknownNamedAccounts,
} from '../environment/types.js';
import {createEnvironment} from '../environment/index.js';
import {DeployScriptFunction, DeployScriptModule} from './types.js';
import {logger, setLogLevel, spin} from '../internal/logging.js';
import {EIP1193GenericRequestProvider, EIP1193ProviderWithoutEvents} from 'eip-1193';
import {getRoughGasPriceEstimate} from '../utils/eth.js';
import prompts from 'prompts';
import {formatEther} from 'viem';
import {tsImport} from 'tsx/esm/api';

export function execute<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	ArgumentsType = undefined,
	Deployments extends UnknownDeployments = UnknownDeployments
>(
	callback: DeployScriptFunction<ResolvedNamedAccounts<NamedAccounts>, ArgumentsType, Deployments>,
	options: {tags?: string[]; dependencies?: string[]; id?: string}
): DeployScriptModule<NamedAccounts, ArgumentsType, Deployments> {
	const scriptModule: DeployScriptModule<NamedAccounts, ArgumentsType, Deployments> = (
		env: Environment<ResolvedNamedAccounts<NamedAccounts>, Deployments>,
		args?: ArgumentsType
	) => callback(env, args);
	scriptModule.tags = options.tags;
	scriptModule.dependencies = options.dependencies;
	scriptModule.id = options.id;
	// TODO runAtTheEnd ?
	return scriptModule;
}

export type NamedAccountExecuteFunction<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts
> = <ArgumentsType = undefined, Deployments extends UnknownDeployments = UnknownDeployments>(
	callback: DeployScriptFunction<ResolvedNamedAccounts<NamedAccounts>, ArgumentsType, Deployments>,
	options: {tags?: string[]; dependencies?: string[]; id?: string}
) => DeployScriptModule<NamedAccounts, ArgumentsType, Deployments>;

export interface UntypedRequestArguments {
	readonly method: string;
	readonly params?: readonly unknown[] | object;
}
export type UntypedEIP1193Provider = {
	request(requestArguments: UntypedRequestArguments): Promise<unknown>;
};

export type ConfigOptions = {
	network?: string | {fork: string};
	deployments?: string;
	scripts?: string;
	tags?: string;
	logLevel?: number;
	provider?: EIP1193ProviderWithoutEvents | EIP1193GenericRequestProvider | UntypedEIP1193Provider;
	ignoreMissingRPC?: boolean;
	saveDeployments?: boolean;
	askBeforeProceeding?: boolean;
	reportGasUse?: boolean;
};

export type DeterministicDeploymentInfo = {
	factory: `0x${string}`;
	deployer: `0x${string}`;
	funding: string;
	signedTx: `0x${string}`;
};
type Networks = {[name: string]: {rpcUrl?: string; tags?: string[]}};
export type UserConfig<NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts> = {
	networks?: Networks;
	deployments?: string;
	scripts?: string;
	accounts?: NamedAccounts;
	deterministicDeployment?:
		| {
				[network: string]: DeterministicDeploymentInfo;
		  }
		| ((network: string) => DeterministicDeploymentInfo | undefined);
};

export async function readConfig<NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts>(
	options: ConfigOptions
): Promise<Config<NamedAccounts>> {
	type ConfigFile = UserConfig<NamedAccounts>;
	let configFile: ConfigFile | undefined;

	// TODO more sophisticated config file finding mechanism (look up parents, etc..)
	const tsFilePath = path.join(process.cwd(), 'rocketh.ts');
	const jsFilePath = path.join(process.cwd(), 'rocketh.js');

	const tsVersionExists = fs.existsSync(tsFilePath);
	const jsVersionExists = fs.existsSync(jsFilePath);
	const existingConfigs = [tsVersionExists, jsVersionExists].filter(Boolean).length;

	// console.log({tsFilePath, tsVersionExists, existingConfigs});

	// Throw error if multiple config files exist
	if (existingConfigs > 1) {
		throw new Error('Multiple configuration files found. Please use only one of: rocketh.ts, rocketh.js');
	}
	if (tsVersionExists) {
		const moduleLoaded = await tsImport(tsFilePath, import.meta.url);
		configFile = moduleLoaded.config;
		// console.log({tsVersionExists: configFile});
		// if ((configFile as any).default) {
		// 	configFile = (configFile as any).default as ConfigFile;
		// 	if ((configFile as any).default) {
		// 		logger.warn(`double default...`);
		// 		configFile = (configFile as any).default as ConfigFile;
		// 	}
		// }
	} else if (jsVersionExists) {
		const moduleLoaded = await tsImport(jsFilePath, import.meta.url);
		configFile = moduleLoaded.config;
	}

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
							console.error(`network "${options.network}" is not configured. Please add it to the rocketh.json file`);
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
						console.error(`network "${options.network}" is not configured. Please add it to the rocketh.json file`);
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
			},
			deployments: options.deployments,
			saveDeployments: options.saveDeployments,
			scripts: options.scripts,
			tags: typeof options.tags === 'undefined' ? undefined : options.tags.split(','),
			logLevel: options.logLevel,
			askBeforeProceeding: options.askBeforeProceeding,
			reportGasUse: options.reportGasUse,
			accounts: configFile?.accounts,
		};
	} else {
		return {
			network: {
				provider: options.provider as EIP1193ProviderWithoutEvents,
				name: networkName,
				tags: networkTags,
				fork,
			},
			deployments: options.deployments,
			saveDeployments: options.saveDeployments,
			scripts: options.scripts,
			tags: typeof options.tags === 'undefined' ? undefined : options.tags.split(','),
			logLevel: options.logLevel,
			askBeforeProceeding: options.askBeforeProceeding,
			reportGasUse: options.reportGasUse,
			accounts: configFile?.accounts,
		};
	}
}

export async function readAndResolveConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts
>(options: ConfigOptions): Promise<ResolvedConfig<NamedAccounts>> {
	return resolveConfig<NamedAccounts>(await readConfig<NamedAccounts>(options));
}

export function resolveConfig<NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts>(
	config: Config<NamedAccounts>
): ResolvedConfig<NamedAccounts> {
	let deterministicDeployment: DeterministicDeploymentInfo = {
		factory: '0x4e59b44847b379578588920ca78fbf26c0b4956c',
		deployer: '0x3fab184622dc19b6109349b94811493bf2a45362',
		funding: '10000000000000000',
		signedTx:
			'0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf31ba02222222222222222222222222222222222222222222222222222222222222222a02222222222222222222222222222222222222222222222222222222222222222',
	};
	const resolvedConfig: ResolvedConfig<NamedAccounts> = {
		...config,
		network: {...config.network, deterministicDeployment},
		deployments: config.deployments || 'deployments',
		scripts: config.scripts || 'deploy',
		tags: config.tags || [],
		networkTags: config.networkTags || [],
		saveDeployments: config.saveDeployments,
		accounts: config.accounts || ({} as NamedAccounts),
	};
	return resolvedConfig;
}

export async function loadEnvironment<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts
>(options: ConfigOptions): Promise<Environment<NamedAccounts, UnknownDeployments>> {
	const resolvedConfig = await readAndResolveConfig<NamedAccounts>(options);
	// console.log(JSON.stringify(resolvedConfig, null, 2));
	const {external, internal} = await createEnvironment(resolvedConfig);
	return external;
}

export async function loadAndExecuteDeployments<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	ArgumentsType = undefined
>(options: ConfigOptions, args?: ArgumentsType): Promise<Environment<NamedAccounts, UnknownDeployments>> {
	const resolvedConfig = await readAndResolveConfig<NamedAccounts>(options);
	// console.log(JSON.stringify(options, null, 2));
	// console.log(JSON.stringify(resolvedConfig, null, 2));
	return executeDeployScripts<NamedAccounts, ArgumentsType>(resolvedConfig, args);
}

export async function executeDeployScripts<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	ArgumentsType = undefined
>(
	config: ResolvedConfig<NamedAccounts>,
	args?: ArgumentsType
): Promise<Environment<NamedAccounts, UnknownDeployments>> {
	setLogLevel(typeof config.logLevel === 'undefined' ? 0 : config.logLevel);

	let filepaths;
	filepaths = traverseMultipleDirectory([config.scripts]);
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

	const scriptModuleByFilePath: {[filename: string]: DeployScriptModule<NamedAccounts, ArgumentsType>} = {};
	const scriptPathBags: {[tag: string]: string[]} = {};
	const scriptFilePaths: string[] = [];

	for (const filepath of filepaths) {
		const scriptFilePath = path.resolve(filepath);
		let scriptModule: DeployScriptModule<NamedAccounts, ArgumentsType>;
		try {
			scriptModule = await tsImport(scriptFilePath, import.meta.url);

			// console.log({
			// 	scriptFilePath,
			// 	scriptModule,
			// });
			if ((scriptModule as any).default) {
				scriptModule = (scriptModule as any).default as DeployScriptModule<NamedAccounts, ArgumentsType>;
				if ((scriptModule as any).default) {
					logger.warn(`double default...`);
					scriptModule = (scriptModule as any).default as DeployScriptModule<NamedAccounts, ArgumentsType>;
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
		func: DeployScriptModule<NamedAccounts, ArgumentsType>;
		filePath: string;
	}> = [];
	const scriptsToRunAtTheEnd: Array<{
		func: DeployScriptModule<NamedAccounts, ArgumentsType>;
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
			).join("',")}`
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
