import fs from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';
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
	type PromptExecutor,
} from 'rocketh/types';
import {
	enhanceEnvIfNeeded,
	resolveConfig,
	resolveExecutionParams,
	createEnvironment,
	logger,
	getEnvironmentName,
	getChainIdForEnvironment,
	createExecutor,
	setupDeployScripts,
	loadDeployments,
	loadEnvironment,
} from 'rocketh';
import {traverseMultipleDirectory} from '../utils/fs.js';
import {createFSDeploymentStore} from '../environment/deployment-store.js';

export function setupEnvironmentFromFiles<
	Extensions extends Record<string, (env: Environment<any, any, any>) => any> = {},
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(extensions: Extensions) {
	async function loadAndExecuteDeploymentsWithExtensions<
		Extra extends Record<string, unknown> = Record<string, unknown>,
		ArgumentsType = undefined
	>(
		executionParams: ExecutionParams<Extra>,
		args?: ArgumentsType
	): Promise<EnhancedEnvironment<NamedAccounts, Data, UnknownDeployments, Extensions>> {
		const env = await loadAndExecuteDeploymentsFromFiles<NamedAccounts, Data, ArgumentsType, Extra>(
			executionParams,
			args
		);
		return enhanceEnvIfNeeded(env, extensions);
	}

	async function loadEnvironmentWithExtensions(
		executionParams: ExecutionParams<Extra>
	): Promise<EnhancedEnvironment<NamedAccounts, Data, UnknownDeployments, Extensions>> {
		const env = await loadEnvironmentFromFiles<NamedAccounts, Data, Extra>(executionParams);
		return enhanceEnvIfNeeded(env, extensions);
	}

	return {
		loadAndExecuteDeploymentsFromFiles: loadAndExecuteDeploymentsWithExtensions,
		loadEnvironmentFromFiles: loadEnvironmentWithExtensions,
	};
}

export async function readConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData
>(): Promise<UserConfig<NamedAccounts, Data>> {
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

const deploymentStore = createFSDeploymentStore();
const promptExecutor: PromptExecutor = async (request: {type: 'confirm'; name: string; message: string}) => {
	const answer = await prompts<string>(request);
	return {
		proceed: answer.proceed,
	};
};
const executor = createExecutor(deploymentStore, promptExecutor);

export function loadDeploymentsFromFiles(
	deploymentsPath: string,
	networkName: string,
	onlyABIAndAddress?: boolean,
	expectedChain?: {chainId: string; genesisHash?: `0x${string}`; deleteDeploymentsIfDifferentGenesisHash?: boolean}
): Promise<{
	deployments: UnknownDeployments;
	migrations: Record<string, number>;
	chainId?: string;
	genesisHash?: `0x${string}`;
}> {
	return loadDeployments(deploymentStore, deploymentsPath, networkName, onlyABIAndAddress, expectedChain);
}

export async function loadEnvironmentFromFiles<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(executionParams: ExecutionParams<Extra>): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
	const config = await readConfig<NamedAccounts, Data>();
	return loadEnvironment(config, executionParams, deploymentStore);
}

export async function loadAndExecuteDeploymentsFromFiles<
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

	return _executeDeployScriptsFromFiles<NamedAccounts, Data, ArgumentsType>(userConfig, resolvedExecutionParams, args);
}

export async function executeDeployScriptsFromFiles<
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
	return _executeDeployScriptsFromFiles<NamedAccounts, Data, ArgumentsType>(
		resolveduserConfig,
		resolvedExecutionParams,
		args
	);
}

async function _executeDeployScriptsFromFiles<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	ArgumentsType = undefined
>(
	userConfig: ResolvedUserConfig<NamedAccounts, Data>,
	resolvedExecutionParams: ResolvedExecutionParams,
	args?: ArgumentsType
): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
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

	const moduleObjects: {id: string; module: DeployScriptModule<NamedAccounts, Data, ArgumentsType>}[] = [];
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
			moduleObjects.push({id: scriptFilePath, module: scriptModule});
		} catch (e) {
			logger.error(`could not import ${filepath}`);
			throw e;
		}
	}

	return executor.executeDeployScriptModules<NamedAccounts, Data, ArgumentsType>(
		moduleObjects,
		userConfig,
		resolvedExecutionParams,
		args
	);
}
