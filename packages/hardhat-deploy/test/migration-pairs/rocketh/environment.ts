/**
 * STAND-IN for a real project's `rocketh/environment.ts`, and the one file of this miniature
 * project that is NOT what a user writes.
 *
 * A real project builds `loadAndExecuteDeploymentsFromFiles` with `@rocketh/node`'s
 * `setupEnvironmentFromFiles(extensions)`, which reads `rocketh/config.ts` and imports every
 * script under `deploy/` from disk, and writes deployments to disk. This one hands the same
 * scripts, statically imported, to the SAME executor `@rocketh/node` drives (`createExecutor`
 * from `rocketh`), over an in-memory store. What differs is only how the scripts and the config
 * are found, which no v1 translation touches; tag selection, dependencies, the run-once `id`
 * rule and the extensions on the returned environment are production code.
 */

import {createExecutor, enhanceEnvIfNeeded} from 'rocketh';
import type {DeploymentStore, EIP1193ProviderWithoutEvents, ModuleObject} from 'rocketh/types';
import {createMapDeploymentStore, createMockPromptExecutor} from '@rocketh/test-utils';

import {type Accounts, type Data, type Extensions, config, extensions} from './config.js';

import token from '../deploy/01_token.js';
import calculator from '../deploy/02_calculator.js';
import registry from '../deploy/03_registry.js';
import proxyErc173 from '../deploy/04a_proxy_erc173.js';
import proxyErc173WithReceive from '../deploy/04b_proxy_erc173_with_receive.js';
import proxyUups from '../deploy/04c_proxy_uups.js';
import proxyTransparent from '../deploy/04d_proxy_transparent.js';
import proxyOptimizedTransparent from '../deploy/04e_proxy_optimized_transparent.js';
import vault from '../deploy/05_vault.js';
import treasury from '../deploy/06a_treasury.js';
import treasuryUpgrade from '../deploy/06b_treasury_upgrade.js';
import diamond from '../deploy/07a_diamond.js';
import greeter from '../deploy/08_greeter.js';
import seedDeployerBalance from '../deploy/09_seed_deployer_balance.js';
import faucet from '../deploy/10_faucet.js';

/**
 * Every script of `deploy/`, in filename order, as `@rocketh/node` would list them.
 * `07b_diamond_with_new_facet.ts` is left out: it is `07a` after an edit, not a second script.
 */
export const scripts = {
	'01_token.ts': token,
	'02_calculator.ts': calculator,
	'03_registry.ts': registry,
	'04a_proxy_erc173.ts': proxyErc173,
	'04b_proxy_erc173_with_receive.ts': proxyErc173WithReceive,
	'04c_proxy_uups.ts': proxyUups,
	'04d_proxy_transparent.ts': proxyTransparent,
	'04e_proxy_optimized_transparent.ts': proxyOptimizedTransparent,
	'05_vault.ts': vault,
	'06a_treasury.ts': treasury,
	'06b_treasury_upgrade.ts': treasuryUpgrade,
	'07a_diamond.ts': diamond,
	'08_greeter.ts': greeter,
	'09_seed_deployer_balance.ts': seedDeployerBalance,
	'10_faucet.ts': faucet,
};

export async function loadAndExecuteDeploymentsFromFiles(params: {
	provider: EIP1193ProviderWithoutEvents;
	tags?: string[];
	environment?: string;
	/** Test hook: the same store twice is the same deployment folder on a second run. */
	deploymentStore?: DeploymentStore;
}) {
	const {deploymentStore, ...executionParams} = params;
	const modules = Object.entries(scripts).map(([id, module]) => ({id, module})) as unknown as ModuleObject<
		Accounts,
		Data
	>[];
	const env = await createExecutor(
		deploymentStore ?? createMapDeploymentStore(),
		createMockPromptExecutor(),
	).resolveConfigAndExecuteDeployScriptModules<Accounts, Data>(modules, config, {
		environment: 'memory',
		saveDeployments: true,
		reportGasUse: false,
		...executionParams,
	});
	return enhanceEnvIfNeeded<Extensions, Accounts, Data>(env, extensions);
}
