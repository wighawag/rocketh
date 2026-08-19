import {deployScript} from '../rocketh/deploy.js';
import {recordPending} from '../demo/pending.js';
import {targetArtifact} from '../demo/target.js';

/**
 * SCENARIO 1: a ProxyAdmin owned by a multisig. The shape rocketh serves well.
 *
 * ONE call, declaring the implementation this run should converge on. On the first
 * run there is no proxy yet, so this is a fresh deployment: it broadcasts from the
 * deployer and `catchUnknownSigner` returns `null`. Wrapping a call that turns out
 * to be signable is harmless, which is worth seeing here rather than being told.
 *
 * Ask for v2 and there IS a proxy, so `deployViaProxy` deploys the new
 * implementation (signable, broadcasts) and then calls `ProxyAdmin.upgrade(...)`
 * with `from` set to the on-chain admin owner, which is the multisig. THAT is the
 * call that gets caught.
 *
 * Run it:
 *   pnpm deploy:dev localhost --tags scenario-multisig
 *   REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-multisig
 *   pnpm act-as-governance scenario-multisig
 *   REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-multisig  # converges, null
 */
export default deployScript(
	async ({deployViaProxy, catchUnknownSigner, get, namedAccounts}) => {
		const {deployer} = namedAccounts;
		const multisig = get('Multisig');
		const prefix = 'governed:';

		// Note the thunk: `() => deployViaProxy(...)`, not `deployViaProxy(...)`. This
		//  is the ONE divergence from hardhat-deploy v1, and it is a compile error
		//  rather than a silent no-op if you forget it.
		const deferred = await catchUnknownSigner(() =>
			deployViaProxy(
				'Registry',
				{account: deployer, artifact: targetArtifact(), args: [prefix]},
				{
					owner: multisig.address,
					proxyContract: {
						type: 'SharedAdminOptimizedTransparentProxy',
						proxyAdminName: 'SharedProxyAdmin',
					},
				},
			),
		);

		recordPending('scenario-multisig', [deferred]);
	},
	{tags: ['scenario-multisig'], dependencies: ['governance']},
);
