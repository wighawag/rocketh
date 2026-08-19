import {deployScript} from '../rocketh/deploy.js';
import {recordPending} from '../demo/pending.js';
import {targetArtifact} from '../demo/target.js';

/**
 * The two ProxyAdmin functions this scenario touches.
 *
 * `@rocketh/proxy` vendors the ProxyAdmin artifact but does not re-export its ABI as
 * TypeScript, and `read` / `execute` accept a MINIMAL deployment (`{address, abi}`), so
 * naming the two functions here is enough and avoids reaching into another package's
 * internals for a type.
 */
const PROXY_ADMIN_ABI = [
	{
		type: 'function',
		name: 'owner',
		inputs: [],
		outputs: [{name: '', type: 'address'}],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'transferOwnership',
		inputs: [{name: 'newOwner', type: 'address'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const;

/**
 * SCENARIO 5: the deployer-to-governance handoff. THE OTHER KNOWN GAP.
 *
 * Every protocol does this exactly once per deployment and cannot rehearse it: the
 * ProxyAdmin starts owned by the deploy key and ends owned by governance. Aave V4's
 * orchestration ends on precisely this step (transferring `DEFAULT_ADMIN` from the
 * deployer), so it is a real lifecycle stage, not a hypothetical.
 *
 * THE SHARP EDGE. `deployViaProxy`'s `owner` option is not a WISH, it is an ASSERTION
 * about the current on-chain owner. Change it from `deployer` to `multisig` in your
 * script without performing the transfer first and rocketh does not defer a
 * `transferOwnership` for you: it throws
 *
 *     To change owner/admin, you need to call transferOwnership on <ProxyAdminName>
 *
 * which is a plain `Error`, NOT an `UnknownSignerError`, so `catchUnknownSigner`
 * rethrows it and the run stops. Making that case defer instead is out of scope for
 * the demo and noted in `work/specs/proposed/unsignable-routes.md`.
 *
 * THE PATTERN THAT WORKS, shown below: declare the owner you CURRENTLY have, perform
 * the transfer as its own step, and let subsequent runs pick up the new owner.
 *
 * Run it:
 *   pnpm deploy:dev localhost --tags scenario-handoff
 *   REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-handoff
 */
export default deployScript(
	async ({
		deployViaProxy,
		execute,
		read,
		catchUnknownSigner,
		get,
		getOrNull,
		namedAccounts,
		showMessage,
	}) => {
		const {deployer} = namedAccounts;
		const multisig = get('Multisig');
		const prefix = 'handoff:';

		const proxyAdminName = 'HandoffProxyAdmin';

		// Declare the CURRENT owner, not the desired one. On the very first run there is
		//  no admin yet, so the deployer creates it and owns it; on every later run we
		//  ask the chain who owns it now. Hardcoding `deployer` here would break every
		//  run after the handoff, and hardcoding `multisig` would break the first.
		const existingAdmin = getOrNull(proxyAdminName);
		const currentOwner = existingAdmin
			? await read(
					{address: existingAdmin.address, abi: PROXY_ADMIN_ABI},
					{functionName: 'owner'},
				)
			: deployer;

		// Converge the proxy, under whoever owns the admin right now. Before the handoff
		//  that is the deployer, so this broadcasts; after it, the multisig, so it defers.
		//  The line does not change.
		const deferredUpgrade = await catchUnknownSigner(() =>
			deployViaProxy(
				'HandoffRegistry',
				{account: deployer, artifact: targetArtifact(), args: [prefix]},
				{
					owner: currentOwner,
					proxyContract: {
						type: 'SharedAdminOptimizedTransparentProxy',
						proxyAdminName,
					},
				},
			),
		);

		// THE HANDOFF, performed as its own explicit step AFTER the proxy work, so a run
		//  that both upgrades and hands over does the upgrade under the owner that is
		//  still in place rather than asserting one that is not.
		//
		//  While the deployer still owns the admin this is an ordinary signable call: it
		//  broadcasts, and `catchUnknownSigner` returns `null`. Wrapping a call that
		//  turns out to be signable is HARMLESS, and that is worth seeing: the wrapper
		//  forces the throw path only for a `from` rocketh cannot sign for. It never
		//  turns a signable account into a deferral, and it never defeats impersonation.
		//
		//  The SECOND time a project does this (multisig -> timelock, say) the very same
		//  line defers instead of broadcasting. The script does not change.
		let deferredHandoff = null;
		if (currentOwner.toLowerCase() !== multisig.address.toLowerCase()) {
			const admin = get(proxyAdminName);
			showMessage(
				`[scenario-handoff] handing ${proxyAdminName} from ${currentOwner} to the multisig`,
			);
			deferredHandoff = await catchUnknownSigner(() =>
				execute(
					{address: admin.address, abi: PROXY_ADMIN_ABI},
					{
						account: currentOwner,
						functionName: 'transferOwnership',
						args: [multisig.address],
					},
				),
			);
		}

		recordPending('scenario-handoff', [deferredUpgrade, deferredHandoff]);
	},
	{tags: ['scenario-handoff'], dependencies: ['governance']},
);
