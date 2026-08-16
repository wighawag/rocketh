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
} from '@rocketh/core/types';
import {
	createExecutor,
	getChainIdForEnvironment,
	getEnvironmentName,
	loadDeploymentsFromStore,
	loadEnvironmentFromStore,
	resolveConfig,
	resolveExecutionParams,
} from 'rocketh';
import {enhanceEnvIfNeeded} from '@rocketh/core/environment';
import {createVFSDeploymentStore} from './vfs-deployment-store.js';

export type * from '@rocketh/core';

export {createEmptyDeploymentStore} from './deployment-store.js';
export {createIndexedDBDeploymentStore, createVFSDeploymentStore} from './vfs-deployment-store.js';
export type {IndexedDBDeploymentStoreOptions} from './vfs-deployment-store.js';
export {createMemoryVFS, joinPath, normalizePath} from './vfs.js';
export type {VFS, VFSChange, VFSListener} from './vfs.js';
import type {VFS} from './vfs.js';
export {createIndexedDBPersistence, createMemoryPersistence, createPersistentVFS} from './persistence.js';
export type {
	CreatePersistentVFSOptions,
	IndexedDBPersistenceOptions,
	PersistedFiles,
	PersistentVFS,
	VFSPersistence,
} from './persistence.js';

// The default store keeps deployments for the lifetime of the page. It is deliberately NOT
// the discarding store (`createEmptyDeploymentStore`), which silently swallowed everything a
// deploy script saved. For deployments that survive a reload, pass
// `await createIndexedDBDeploymentStore()` to `setupEnvironment`.
const deploymentStore = createVFSDeploymentStore();

/**
 * The store used when `setupEnvironment` is given no `deploymentStore`.
 *
 * Exposed so a caller can read back what a deploy script saved, or render its `vfs`, without
 * having to construct and thread a store of its own.
 *
 * SHARED, and deliberately so: it is one instance for the page, which is what makes it
 * reachable from here at all. That means two `setupEnvironment` calls that pass no store write
 * into the SAME deployments (and so do two test files in one module registry). It did not
 * matter while the default discarded everything; now that it retains, an environment that must
 * not see another's deployments should be given its own `createVFSDeploymentStore()`.
 */
export function getDefaultDeploymentStore(): DeploymentStore & {vfs: VFS} {
	return deploymentStore;
}

const promptExecutor: PromptExecutor = {
	async prompt() {
		return {
			proceed: true,
		};
	},
	exit() {
		console.error(`not implemented`);
	},
};

const executor = createExecutor(deploymentStore, promptExecutor);

/**
 * Options for {@link setupEnvironment}.
 *
 * Supply `deploymentStore` when this environment needs its OWN storage. Without it every
 * `setupEnvironment` call in the page shares one module-level store (see
 * {@link getDefaultDeploymentStore}), which is convenient for a single app and wrong for two
 * independent environments, which would then read each other's deployments.
 *
 * Use `createVFSDeploymentStore()` for a private in-memory store, or
 * `await createIndexedDBDeploymentStore()` for one that survives a reload.
 */
export type SetupEnvironmentOptions = {
	deploymentStore?: DeploymentStore;
};

/**
 * @deprecated Misnamed: this reads the store bound to this module (in-memory by default), not
 * IndexedDB. Build the store you want and load through it instead:
 *
 * ```ts
 * import {loadDeploymentsFromStore} from 'rocketh';
 * const store = await createIndexedDBDeploymentStore();
 * const {deployments} = await loadDeploymentsFromStore(store, 'deployments', 'sepolia');
 * ```
 */
export function loadDeploymentsFromIndexedDB(
	deploymentsPath: string,
	networkName: string,
	onlyABIAndAddress?: boolean,
	expectedChain?: {chainId: string; genesisHash?: `0x${string}`; deleteDeploymentsIfDifferentGenesisHash?: boolean},
): Promise<{
	deployments: UnknownDeployments;
	migrations: Record<string, number>;
	chainId?: string;
	genesisHash?: `0x${string}`;
}> {
	return loadDeploymentsFromStore(deploymentStore, deploymentsPath, networkName, onlyABIAndAddress, expectedChain);
}

async function loadAndExecuteDeployments<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	ArgumentsType = undefined,
	Extra extends Record<string, unknown> = Record<string, unknown>,
>(
	scriptExecutor: typeof executor,
	moduleObjects: ModuleObject<NamedAccounts, Data, ArgumentsType>[],
	config: UserConfig<NamedAccounts, Data>,
	executionParams: ExecutionParams<Extra>,
	args?: ArgumentsType,
): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
	const userConfig = await resolveConfig<NamedAccounts, Data>(config, executionParams.config);
	const {name: environmentName, fork} = getEnvironmentName(executionParams);
	const chainId = await getChainIdForEnvironment(userConfig, environmentName, executionParams);
	const resolvedExecutionParams = resolveExecutionParams(userConfig, executionParams, chainId);
	// console.log(JSON.stringify(options, null, 2));
	// console.log(JSON.stringify(resolvedConfig, null, 2));

	return scriptExecutor.executeDeployScriptModules(moduleObjects, userConfig, resolvedExecutionParams, args);
}

export function setupEnvironment<
	Extensions extends Record<string, (env: Environment<any, any, any>) => any> = {},
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Extra extends Record<string, unknown> = Record<string, unknown>,
>(config: UserConfig<NamedAccounts, Data>, extensions: Extensions, options?: SetupEnvironmentOptions) {
	// A caller-supplied store needs its own executor, because the executor closes over the
	// store at construction. Without one we keep the module-level pair, so existing callers
	// (and their behaviour, no-op store included) are untouched.
	const store = options?.deploymentStore ?? deploymentStore;
	const scriptExecutor = options?.deploymentStore ? createExecutor(store, promptExecutor) : executor;

	async function loadAndExecuteDeploymentsWithExtensions<
		Extra extends Record<string, unknown> = Record<string, unknown>,
		ArgumentsType = undefined,
	>(
		moduleObjects: ModuleObject<NamedAccounts, Data, ArgumentsType>[],
		executionParams: ExecutionParams<Extra>,
		args?: ArgumentsType,
	): Promise<EnhancedEnvironment<NamedAccounts, Data, UnknownDeployments, Extensions>> {
		const env = await loadAndExecuteDeployments<NamedAccounts, Data, ArgumentsType, Extra>(
			scriptExecutor,
			moduleObjects,
			config,
			executionParams,
			args,
		);
		return enhanceEnvIfNeeded(env, extensions);
	}

	async function loadEnvironmentWithExtensions(
		executionParams: ExecutionParams<Extra>,
	): Promise<EnhancedEnvironment<NamedAccounts, Data, UnknownDeployments, Extensions>> {
		const env = await loadEnvironmentFromStore<NamedAccounts, Data, Extra>(config, executionParams, store);
		return enhanceEnvIfNeeded(env, extensions);
	}

	return {
		loadAndExecuteDeploymentsFromModules: loadAndExecuteDeploymentsWithExtensions,
		loadEnvironment: loadEnvironmentWithExtensions,
	};
}
