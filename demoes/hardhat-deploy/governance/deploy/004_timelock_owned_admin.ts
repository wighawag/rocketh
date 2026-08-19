import {keccak256, toHex, zeroHash} from 'viem';
import {deployScript, artifacts} from '../rocketh/deploy.js';
import {recordPending} from '../demo/pending.js';
import {targetArtifact, targetVersion} from '../demo/target.js';

/**
 * SCENARIO 4: a ProxyAdmin owned by a TIMELOCK. THE KNOWN GAP.
 *
 * Governance is multisig -> Timelock -> ProxyAdmin -> proxy. rocketh reads the
 * ProxyAdmin's on-chain owner and uses it as `from`, so what comes back is:
 *
 *     {from: <the timelock>, to: <the proxy admin>, data: upgrade(proxy, impl)}
 *
 * That is an accurate statement of intent and an IMPOSSIBLE transaction. Nobody can
 * send a transaction from a timelock. The transactions an operator can actually send
 * are two, separated by the timelock's delay:
 *
 *     1. timelock.schedule(target, 0, data, predecessor, salt, delay)   <- from the multisig
 *     2. timelock.execute(target, 0, data, predecessor, salt)           <- after the delay
 *
 * Until `unsignable-routes` lands, that translation is the user's job.
 * This script does it by hand, deliberately and visibly, so the demo shows both the
 * gap and the shape of the fix. Note what the hand-written version has to get right:
 *
 *   - a DETERMINISTIC salt, so a re-run derives the SAME operation id. Get this wrong
 *     and you schedule a second operation you can never match to the first.
 *   - THREE on-chain states, not two: not scheduled / scheduled but not ready / done.
 *     A design that can only express one transaction cannot express this.
 *
 * Run it:
 *   pnpm deploy:dev localhost --tags scenario-timelock
 *   REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-timelock
 *   pnpm act-as-governance scenario-timelock     # sends the schedule()
 *   # wait out the delay (60s in this demo)
 *   REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-timelock
 *   pnpm act-as-governance scenario-timelock     # sends the execute()
 */
export default deployScript(
	async ({
		deployViaProxy,
		execute,
		read,
		catchUnknownSigner,
		get,
		namedAccounts,
		showMessage,
	}) => {
		const {deployer} = namedAccounts;
		const multisig = get('Multisig');
		// Typed, because every `read`/`execute` below names a function on it and an
		//  untyped `get` would widen the ABI to `Abi` and lose the argument checking.
		const timelock = get<typeof artifacts.GovernanceTimelock.abi>('Timelock');
		const prefix = 'timelocked:';

		const deferred = await catchUnknownSigner(
			() =>
				deployViaProxy(
					'TimelockedRegistry',
					{account: deployer, artifact: targetArtifact(), args: [prefix]},
					{
						owner: timelock.address,
						proxyContract: {
							type: 'SharedAdminOptimizedTransparentProxy',
							proxyAdminName: 'TimelockProxyAdmin',
						},
					},
				),
			// Suppressed: the printed block would tell the operator to send a
			//  transaction from the timelock, which is exactly the misleading advice
			//  this scenario exists to demonstrate. We print the real pair instead.
			{log: false},
		);

		if (!deferred) {
			showMessage(
				'[scenario-timelock] the proxy already runs the target implementation. Nothing to do.',
			);
			recordPending('scenario-timelock', []);
			return;
		}

		// ---------------------------------------------------------------------------
		// The hand-written call-through translation.
		// ---------------------------------------------------------------------------
		const target = deferred.to as `0x${string}`;
		const payload = deferred.data as `0x${string}`;

		// Deterministic, so a re-run derives the same operation id. A random salt here
		//  would be a very bad afternoon: the scheduled operation could never be found
		//  again, and the delay would have to be waited out a second time.
		//
		//  It is keyed by the TARGET VERSION, because a second upgrade later must be a
		//  DIFFERENT timelock operation. Salting by proxy name alone would collide with
		//  the already-executed one and `schedule` would revert.
		const salt = keccak256(
			toHex(`rocketh-demo:TimelockedRegistry:v${targetVersion()}`),
		);
		const predecessor = zeroHash;

		const operationId = await read(timelock, {
			functionName: 'hashOperation',
			args: [target, 0n, payload, predecessor, salt],
		});

		const isScheduled = await read(timelock, {
			functionName: 'isOperation',
			args: [operationId],
		});
		const isReady = await read(timelock, {
			functionName: 'isOperationReady',
			args: [operationId],
		});

		if (!isScheduled) {
			// State 1 of 3, nothing scheduled yet. Ask governance to schedule.
			const minDelay = await read(timelock, {functionName: 'getMinDelay'});
			const deferredSchedule = await catchUnknownSigner(() =>
				execute(timelock, {
					account: multisig.address,
					functionName: 'schedule',
					args: [target, 0n, payload, predecessor, salt, minDelay],
				}),
			);
			recordPending('scenario-timelock', [deferredSchedule]);
			return;
		}

		if (!isReady) {
			// State 2 of 3, scheduled but the delay has not elapsed. Handing the operator
			//  the `schedule` call again here would make them send a duplicate that
			//  reverts. Surfacing NOTHING is the correct answer, and saying so is the
			//  useful one.
			showMessage(
				`[scenario-timelock] operation ${operationId} is scheduled and waiting out the timelock delay. ` +
					`Nothing to execute yet: re-run once it has elapsed.`,
			);
			recordPending('scenario-timelock', []);
			return;
		}

		// State 3 of 3, ready. Ask governance to execute.
		const deferredExecute = await catchUnknownSigner(() =>
			execute(timelock, {
				account: multisig.address,
				functionName: 'execute',
				args: [target, 0n, payload, predecessor, salt],
			}),
		);
		recordPending('scenario-timelock', [deferredExecute]);
	},
	{tags: ['scenario-timelock'], dependencies: ['governance']},
);
