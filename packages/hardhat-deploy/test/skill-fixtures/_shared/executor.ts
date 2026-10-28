/**
 * SHARED by every skill's fixtures: the EXECUTOR DRIVER, standing in for what `rocketh deploy`
 * or `hardhat deploy` does with a project's `deploy/` folder. Not part of any miniature project.
 *
 * A real run builds `loadAndExecuteDeploymentsFromFiles` with `@rocketh/node`'s
 * `setupEnvironmentFromFiles(extensions)`, which reads `rocketh/config.ts`, imports every script
 * under `deploy/` from disk and writes deployments to disk. This hands the SAME scripts,
 * statically imported by the test, to the SAME executor `@rocketh/node` drives (`createExecutor`
 * from `rocketh`), over an in-memory store, exactly as `migration-pairs/rocketh/environment.ts`
 * does. What differs is only how the scripts and the config are found; tag selection,
 * dependencies, the run-once `id` rule, the unknown-signer policy and the extensions on the
 * returned environment are production code.
 *
 * Pass the same `deploymentStore` to two runs and the second is a RE-RUN of the first: it reads
 * the records and the run-once ids the first one saved.
 */

import {createExecutor, enhanceEnvIfNeeded} from 'rocketh';
import type {
	DeploymentStore,
	EIP1193CoreProvider,
	ModuleObject,
	PromptExecutor,
	UnknownSignerPolicy,
	UnresolvedNetworkSpecificData,
	UnresolvedUnknownNamedAccounts,
	UserConfig,
} from 'rocketh/types';
import {createMapDeploymentStore, createMockPromptExecutor} from '@rocketh/test-utils';

/** What `rocketh/config.ts`'s `extensions` may hold: what `enhanceEnvIfNeeded` accepts. */
type ExtensionsShape = Parameters<typeof enhanceEnvIfNeeded>[1];

export type ExecuteScriptsParams<
	Extensions extends ExtensionsShape,
	Accounts extends UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData,
> = {
	/** The fixture's `rocketh/config.ts`: its `config` and its `extensions`. */
	config: UserConfig<Accounts, Data>;
	extensions: Extensions;
	/**
	 * Every script of the fixture's `deploy/`, keyed by file name, as `@rocketh/node` would list
	 * them: the executor orders by key, then by `dependencies`.
	 */
	scripts: Record<string, unknown>;
	/** The node: the `provider` of `createNode` (`./node.ts`). */
	provider: EIP1193CoreProvider;
	tags?: string[];
	/** The environment name, `memory` by default (a dev chain). */
	environment?: string;
	deploymentStore?: DeploymentStore;
	/**
	 * Whether the run asks the node to impersonate an account it does not hold (rocketh's default
	 * is on for a fork run only). The node decides whether it succeeds (`createNode`'s `impersonable`).
	 */
	autoImpersonate?: boolean;
	/** The run's unknown-signer policy (`--on-unknown-signer`); config and then `auto` decide otherwise. */
	onUnknownSigner?: UnknownSignerPolicy;
	/**
	 * What the run can ask a human. The default answers nothing and has no text prompt, which is
	 * a run without a terminal: under `auto` an unsignable `from` then throws `UnknownSignerError`.
	 */
	promptExecutor?: PromptExecutor;
};

/** One run of the fixture's deploy scripts through rocketh's real executor. */
export async function executeScripts<
	Extensions extends ExtensionsShape,
	Accounts extends UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData,
>(params: ExecuteScriptsParams<Extensions, Accounts, Data>) {
	const modules = Object.entries(params.scripts).map(([id, module]) => ({id, module})) as unknown as ModuleObject<
		Accounts,
		Data
	>[];
	const env = await createExecutor(
		params.deploymentStore ?? createMapDeploymentStore(),
		params.promptExecutor ?? createMockPromptExecutor(),
	).resolveConfigAndExecuteDeployScriptModules<Accounts, Data>(modules, params.config as UserConfig, {
		provider: params.provider,
		environment: params.environment ?? 'memory',
		tags: params.tags,
		onUnknownSigner: params.onUnknownSigner,
		autoImpersonate: params.autoImpersonate,
		saveDeployments: true,
		reportGasUse: false,
	});
	return enhanceEnvIfNeeded<Extensions, Accounts, Data>(env, params.extensions);
}
