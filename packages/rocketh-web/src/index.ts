import type {
	ModuleObject,
	DeploymentStore,
	Environment,
	ExecutionParams,
	PromptExecutor,
	UnknownDeployments,
	UnresolvedNetworkSpecificData,
	UnresolvedUnknownNamedAccounts,
	UserConfig,
	EnhancedEnvironment,
} from 'rocketh/types';
import {
	createExecutor,
	enhanceEnvIfNeeded,
	getChainIdForEnvironment,
	getEnvironmentName,
	loadDeployments,
	loadEnvironment,
	resolveConfig,
	resolveExecutionParams,
} from 'rocketh';
import {createEmptyDeploymentStore} from './deployment-store.js';

const deploymentStore: DeploymentStore = createEmptyDeploymentStore();

const promptExecutor: PromptExecutor = async () => {
	return {
		proceed: true,
	};
};

const executor = createExecutor(deploymentStore, promptExecutor);

export function loadDeploymentsFromIndexedDB(
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

async function loadAndExecuteDeployments<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	ArgumentsType = undefined,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(
	moduleObjects: ModuleObject<NamedAccounts, Data, ArgumentsType>[],
	config: UserConfig<NamedAccounts, Data>,
	executionParams: ExecutionParams<Extra>,
	args?: ArgumentsType
): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
	const userConfig = await resolveConfig<NamedAccounts, Data>(config, executionParams.config);
	const {name: environmentName, fork} = getEnvironmentName(executionParams);
	const chainId = await getChainIdForEnvironment(userConfig, environmentName, executionParams.provider);
	const resolvedExecutionParams = resolveExecutionParams(userConfig, executionParams, chainId);
	// console.log(JSON.stringify(options, null, 2));
	// console.log(JSON.stringify(resolvedConfig, null, 2));

	return executor.executeDeployScriptModules(moduleObjects, userConfig, resolvedExecutionParams, args);
}

export function setupEnvironment<
	Extensions extends Record<string, (env: Environment<any, any, any>) => any> = {},
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Extra extends Record<string, unknown> = Record<string, unknown>
>(config: UserConfig<NamedAccounts, Data>, extensions: Extensions) {
	async function loadAndExecuteDeploymentsWithExtensions<
		Extra extends Record<string, unknown> = Record<string, unknown>,
		ArgumentsType = undefined
	>(
		moduleObjects: ModuleObject<NamedAccounts, Data, ArgumentsType>[],
		executionParams: ExecutionParams<Extra>,
		args?: ArgumentsType
	): Promise<EnhancedEnvironment<NamedAccounts, Data, UnknownDeployments, Extensions>> {
		const env = await loadAndExecuteDeployments<NamedAccounts, Data, ArgumentsType, Extra>(
			moduleObjects,
			config,
			executionParams,
			args
		);
		return enhanceEnvIfNeeded(env, extensions);
	}

	async function loadEnvironmentWithExtensions(
		executionParams: ExecutionParams<Extra>
	): Promise<EnhancedEnvironment<NamedAccounts, Data, UnknownDeployments, Extensions>> {
		const env = await loadEnvironment<NamedAccounts, Data, Extra>(config, executionParams, deploymentStore);
		return enhanceEnvIfNeeded(env, extensions);
	}

	return {
		loadAndExecuteDeploymentsFromModules: loadAndExecuteDeploymentsWithExtensions,
		loadEnvironment: loadEnvironmentWithExtensions,
	};
}
