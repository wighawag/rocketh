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
	ChainConfig,
	DeploymentStoreFactory,
} from '../types.js';
import {withEnvironment} from '../utils/extensions.js';
import {getChainByName, getChainConfig} from '../environment/utils/chains.js';
import {JSONRPCHTTPProvider} from 'eip-1193-jsonrpc-provider';
import {createEnvironment} from '../environment/index.js';

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

export function resolveExecutionParams<Extra extends Record<string, unknown> = Record<string, unknown>>(
	config: ResolvedUserConfig,
	executionParameters: ExecutionParams<Extra>,
	chainId: number
): ResolvedExecutionParams<Extra> {
	const {name: environmentName, fork} = getEnvironmentName(executionParameters);

	// TODO fork chainId resolution option to keep the network being used
	let chainConfig: ChainConfig = getChainConfig(fork ? 31337 : chainId, config);

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

	const provider =
		executionParameters.provider || (new JSONRPCHTTPProvider(actualChainConfig.rpcUrl) as EIP1193ProviderWithoutEvents);

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
		logLevel: executionParameters.logLevel || 0, // TODO
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
	config: UserConfig,
	executionParams: ExecutionParams<Extra>,
	deploymentStoreFactory: DeploymentStoreFactory
): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
	const userConfig = await resolveConfig<NamedAccounts, Data>(config, executionParams.config);
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
