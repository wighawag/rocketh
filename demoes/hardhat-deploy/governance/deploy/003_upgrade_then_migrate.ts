import {deployScript, artifacts} from '../rocketh/deploy.js';
import {recordPending} from '../demo/pending.js';
import {targetArtifact} from '../demo/target.js';

/**
 * SCENARIO 3: an upgrade followed by a dependent call from the same owner.
 *
 * Real upgrades rarely stop at `upgrade()`. There is usually a follow-up: repoint a
 * registrar, run a migration, flip a flag. When that follow-up has the SAME unsignable
 * `from`, it defers too, and the operator receives an ORDERED list of two transactions.
 *
 * The order is load-bearing, and here it is enforced on chain rather than merely
 * described: `Registrar.setRegistry` refuses any version that is not exactly the next
 * one, so replaying the pair out of order (or twice) reverts instead of quietly
 * producing a wrong state.
 *
 * Run it:
 *   pnpm deploy:dev localhost --tags scenario-ordered
 *   REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-ordered
 */
export default deployScript(
	async ({
		deploy,
		deployViaProxy,
		execute,
		read,
		catchUnknownSigner,
		get,
		namedAccounts,
	}) => {
		const {deployer} = namedAccounts;
		const multisig = get('Multisig');
		const prefix = 'ordered:';

		// Governance owns the registrar from birth. Deploying it is signable.
		const registrar = await deploy('Registrar', {
			account: deployer,
			artifact: artifacts.Registrar,
			args: [multisig.address],
		});

		// STEP 1: converge the proxy on the target implementation.
		const deferredUpgrade = await catchUnknownSigner(() =>
			deployViaProxy(
				'OrderedRegistry',
				{account: deployer, artifact: targetArtifact(), args: [prefix]},
				{
					owner: multisig.address,
					proxyContract: {
						type: 'SharedAdminOptimizedTransparentProxy',
						proxyAdminName: 'OrderedProxyAdmin',
					},
				},
			),
		);

		// STEP 2: point the registrar at the implementation the proxy should run.
		//
		//  Guarded by an on-chain read, which is what makes the whole loop idempotent:
		//  rocketh persists nothing between runs, so "have I already done this?" can
		//  only ever be answered by asking the chain. Re-running before governance acts
		//  produces the same transactions; re-running after produces none.
		const implementation = get('OrderedRegistry_Implementation');
		const currentTarget = await read(registrar, {functionName: 'registry'});

		let deferredMigration = null;
		if (currentTarget.toLowerCase() !== implementation.address.toLowerCase()) {
			const currentVersion = await read(registrar, {functionName: 'version'});
			deferredMigration = await catchUnknownSigner(() =>
				execute(registrar, {
					account: multisig.address,
					functionName: 'setRegistry',
					args: [implementation.address, currentVersion + 1n],
				}),
			);
		}

		// The array order IS the execution order, and `act-as-governance` replays it in
		//  order for exactly that reason. Note what happens if you execute step 2 first:
		//  the registrar ends up naming an implementation the proxy is not yet running.
		recordPending('scenario-ordered', [deferredUpgrade, deferredMigration]);
	},
	{tags: ['scenario-ordered'], dependencies: ['governance']},
);
