import {deployScript} from '../rocketh/deploy.js';
import {recordPending} from '../demo/pending.js';
import {targetArtifact} from '../demo/target.js';

/**
 * SCENARIO 2: N proxies behind ONE multisig-owned ProxyAdmin.
 *
 * The question this answers: does a run over many proxies surface exactly N deferred
 * upgrades, all `from` the multisig, none dropped and none duplicated?
 *
 * ONE WRAPPER CAPTURES ONE TRANSACTION. The `UnknownSignerError` unwinds the action it
 * was thrown inside, so everything after the deferred call IN THAT ACTION is skipped.
 * Wrapping all three upgrades in a single `catchUnknownSigner` would therefore surface
 * the FIRST one and silently skip the other two. That is why the loop below wraps each
 * proxy separately, and it is the single most important thing to copy from this file.
 *
 * Run it:
 *   pnpm deploy:dev localhost --tags scenario-multi
 *   REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-multi
 */
const MARKETS = ['Alpha', 'Beta', 'Gamma'] as const;

export default deployScript(
	async ({deployViaProxy, catchUnknownSigner, get, namedAccounts}) => {
		const {deployer} = namedAccounts;
		const multisig = get('Multisig');

		// All three proxies share ONE ProxyAdmin, which is what makes this a single
		//  governance surface: one owner, three upgrade calls.
		const proxyContract = {
			type: 'SharedAdminOptimizedTransparentProxy',
			proxyAdminName: 'SharedProxyAdmin',
		} as const;

		const deferred = [];
		for (const market of MARKETS) {
			// One wrapper PER proxy. See the note above.
			deferred.push(
				await catchUnknownSigner(() =>
					deployViaProxy(
						`Registry${market}`,
						{
							account: deployer,
							artifact: targetArtifact(),
							args: [`${market.toLowerCase()}:`],
						},
						{owner: multisig.address, proxyContract},
					),
				),
			);
		}

		// Expect three transactions on the upgrade run, all with the same `from` (the
		//  multisig) and the same `to` (the shared ProxyAdmin), differing only in the
		//  proxy address inside `data`. They may be executed in any order: unlike
		//  scenario 003, these upgrades are independent of each other.
		recordPending('scenario-multi', deferred);
	},
	{tags: ['scenario-multi'], dependencies: ['governance']},
);
