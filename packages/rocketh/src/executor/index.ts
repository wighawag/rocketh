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
} from '@rocketh/core/types';
import {
	withEnvironment,
	resolveConfig,
	resolveExecutionParams,
	createEnvironment,
	logger,
	getEnvironmentName,
	getChainIdForEnvironment,
	createExecutor,
	setupDeployScripts,
} from '@rocketh/core';
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

export function setup<
	Extensions extends Record<string, (env: Environment<any, any, any>) => any> = {},
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(extensions: Extensions) {
	const {deployScript} = setupDeployScripts<Extensions, NamedAccounts, Data, Deployments, Extra>(extensions);
	const {loadAndExecuteDeployments} = setupEnvironment<Extensions, NamedAccounts, Data, Deployments, Extra>(extensions);
	return {deployScript, loadAndExecuteDeployments};
}

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

const deploymentStoreFactory = createFSDeploymentStoreFactory();
const promptExecutor: PromptExecutor = async (request: {type: 'confirm'; name: string; message: string}) => {
	const answer = await prompts<string>(request);
	return {
		proceed: answer.proceed,
	};
};
const executor = createExecutor(deploymentStoreFactory, promptExecutor);

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
