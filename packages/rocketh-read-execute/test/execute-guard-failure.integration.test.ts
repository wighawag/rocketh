/**
 * Integration tests for @rocketh/read-execute - a guard that cannot produce a VERDICT is FATAL.
 *
 * The asymmetry these tests pin is the whole reason a guard is safe to rely on: an error
 * while EVALUATING a guard is not evidence that the call is still needed. A guard whose
 * read reverts, whose target holds no code, whose slot cannot be decoded or whose own
 * `satisfied` predicate throws has told us NOTHING, and treating that silence as "not
 * satisfied" would hand the operator a privileged transaction they may already have
 * executed out of band. rocketh cannot observe an out-of-band execution, so the
 * chain-derived guard is the only thing that makes a re-run converge
 * (`docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md`); a guard that fails OPEN
 * removes that, silently, because the run then looks exactly like a run where the step is
 * genuinely still needed. Failing loudly costs a re-run and a fixed script; failing open
 * costs a duplicated mint, transfer or nonce-bearing governance action.
 *
 * Every assertion about "nothing was executed" is made from the RECORDED PROVIDER REQUESTS
 * rather than from a return value, because on a throwing path there is no return value to
 * inspect: the absence of `eth_sendTransaction` / `eth_sendRawTransaction` is the evidence.
 *
 * The empty-return case is tested at its END STATE, after the retry `read` performs for a
 * known deployment is EXHAUSTED, and the number of attempts is read off
 * `env.context.retry` rather than written down here. A test that asserted the first attempt
 * would start lying the day the retry policy is tuned.
 */

import {describe, it, expect} from 'vitest';
import {execute, evaluateGuard} from '../src/index.js';
import {GuardEvaluationError} from '../src/errors.js';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';
import type {Abi} from 'abitype';
import type {MinimalDeployment} from '@rocketh/core/types';

const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;
const REGISTRY_ADDRESS = ('0x' + 'a'.repeat(40)) as `0x${string}`;
const TIMELOCK_ADDRESS = ('0x' + 'b'.repeat(40)) as `0x${string}`;
const NEW_IMPLEMENTATION = ('0x' + 'c'.repeat(40)) as `0x${string}`;
const PROXY_ADDRESS = ('0x' + 'e'.repeat(40)) as `0x${string}`;

/** An address rocketh knows nothing about: no deployment was ever saved for it. */
const NOT_DEPLOYED_ADDRESS = ('0x' + 'f'.repeat(40)) as `0x${string}`;

const EIP1967_IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc' as const;
const SOME_SLOT = ('0x' + '0'.repeat(63) + '7') as `0x${string}`;

const OPERATION_ID = ('0x' + 'd'.repeat(64)) as `0x${string}`;

/** `enum OperationState {Unset, Waiting, Ready, Done}` */
const OperationState = {Unset: 0, Waiting: 1, Ready: 2, Done: 3} as const;

/** The contract being CALLED: the privileged call whose double execution is the loss. */
const REGISTRY_ABI = [
	{
		type: 'function',
		name: 'setPoolImpl',
		inputs: [{type: 'address', name: 'newPoolImpl'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

/** The contract being READ, which is a different one: OpenZeppelin's `TimelockController`. */
const TIMELOCK_ABI = [
	{
		type: 'function',
		name: 'getOperationState',
		inputs: [{type: 'bytes32', name: 'id'}],
		outputs: [{type: 'uint8'}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

/** A transparent proxy: no getter at all, which is why the storage kind exists. */
const PROXY_ABI = [] as const satisfies Abi;

/** ABI-encode a `uint8` (or an `address`) into a single 32-byte word. */
function word(value: number | bigint | `0x${string}`): `0x${string}` {
	const hex = typeof value === 'string' ? value.slice(2) : value.toString(16);
	return ('0x' + hex.padStart(64, '0')) as `0x${string}`;
}

/**
 * The retry `read` performs on an empty return is deliberately INHERITED by the guard, so
 * these tests keep it and only shorten the wait: what is under test is the state AFTER it
 * is exhausted, not how long it takes to get there.
 */
const RETRY = {maxRetries: 3, delay: 1} as const;

async function setup() {
	const {env, provider} = await createTestEnvironment({
		accounts: {governance: NODE_ACCOUNT},
		nodeAccounts: [NODE_ACCOUNT],
		config: {retry: RETRY},
	});
	const registry = await env.save('Registry', {
		address: REGISTRY_ADDRESS,
		...createMockArtifact('Registry', REGISTRY_ABI),
		argsData: '0x',
	});
	const timelock = await env.save('Timelock', {
		address: TIMELOCK_ADDRESS,
		...createMockArtifact('Timelock', TIMELOCK_ABI),
		argsData: '0x',
	});
	const proxy = await env.save('Proxy', {
		address: PROXY_ADDRESS,
		...createMockArtifact('Proxy', PROXY_ABI),
		argsData: '0x',
	});
	return {env, provider, registry, timelock, proxy};
}

function broadcasts(provider: {getRequests: () => Array<{method: string}>}) {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendTransaction' || r.method === 'eth_sendRawTransaction');
}

function callsTo(provider: {getRequests: () => Array<{method: string; params?: unknown[]}>}, method: string) {
	return provider.getRequests().filter((r) => r.method === method);
}

/**
 * Await a call that MUST fail, and hand back the error it failed with.
 *
 * `rejects.toThrow` proves only that something threw; these tests also have to look at the
 * error itself (which guard it names, what it kept of the underlying failure), and awaiting
 * the same promise twice to do both would double every recorded request.
 */
async function failureOf(run: () => Promise<unknown>): Promise<GuardEvaluationError> {
	try {
		await run();
	} catch (error) {
		return error as GuardEvaluationError;
	}
	throw new Error('expected the guard to fail the run, but the call returned normally');
}

describe('@rocketh/read-execute - a guard that cannot answer is fatal', () => {
	describe('Every way a guard can fail to produce a verdict aborts the run', () => {
		it('a guard whose read REVERTS aborts, and sends nothing', async () => {
			/**
			 * Example: the guard calls `getOperationState(id)` on a timelock that reverts on an
			 * unknown id (a mistyped operation id, or a guard pointed at the wrong contract).
			 * The revert says nothing about whether the upgrade is still needed, so the run
			 * stops instead of sending the privileged call.
			 */
			const {env, provider, registry, timelock} = await setup();
			const reverted = new Error('execution reverted: TimelockController: unknown operation');
			provider.setResponse('eth_call', () => {
				throw reverted;
			});

			const error = await failureOf(() =>
				execute(env)(registry, {
					account: 'governance',
					functionName: 'setPoolImpl',
					args: [NEW_IMPLEMENTATION],
					guard: {
						kind: 'call',
						on: timelock,
						functionName: 'getOperationState',
						args: [OPERATION_ID],
						satisfied: (state) => state === OperationState.Done,
					},
				}),
			);

			expect(error).toBeInstanceOf(GuardEvaluationError);
			expect(broadcasts(provider)).toHaveLength(0);
		});

		it('a guard whose read returns NO DATA aborts, once the inherited retry is EXHAUSTED', async () => {
			/**
			 * Example: the guard's target is not a contract, or is not deployed yet, so the call
			 * returns no data at all and there is nothing to decode.
			 *
			 * `read` RETRIES that case when the address is a known deployment, and the guard
			 * inherits the retry on purpose: a contract that is momentarily unreadable must not
			 * fail the run on the first attempt. What is asserted here is the END STATE. Every
			 * attempt was made (the count comes from the environment's own retry config, so
			 * tuning the policy re-tunes this assertion rather than invalidating it), and the
			 * exhausted read is then fatal like any other.
			 */
			const {env, provider, registry, timelock} = await setup();
			provider.setResponse('eth_call', () => '0x');

			const error = await failureOf(() =>
				execute(env)(registry, {
					account: 'governance',
					functionName: 'setPoolImpl',
					args: [NEW_IMPLEMENTATION],
					guard: {
						kind: 'call',
						on: timelock,
						functionName: 'getOperationState',
						args: [OPERATION_ID],
						satisfied: (state) => state === OperationState.Done,
					},
				}),
			);

			expect(error).toBeInstanceOf(GuardEvaluationError);
			expect(callsTo(provider, 'eth_call')).toHaveLength(env.context.retry.maxRetries + 1);
			expect(broadcasts(provider)).toHaveLength(0);
		});

		it('does NOT abort while the retry can still succeed: it is the exhausted read that is fatal', async () => {
			/**
			 * The other half of the assertion above, and what makes it discriminating. The same
			 * empty return, recovering before the retries run out, produces a verdict as usual.
			 * Without this, "aborts on an empty return" could be satisfied by a guard that never
			 * retried at all.
			 */
			const {env, provider, registry, timelock} = await setup();
			let attempt = 0;
			provider.setResponse('eth_call', () => {
				attempt++;
				return attempt <= env.context.retry.maxRetries ? '0x' : word(OperationState.Done);
			});

			const result = await execute(env)(registry, {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [NEW_IMPLEMENTATION],
				guard: {
					kind: 'call',
					on: timelock,
					functionName: 'getOperationState',
					args: [OPERATION_ID],
					satisfied: (state) => state === OperationState.Done,
				},
			});

			expect(result.outcome).toBe('skipped');
			expect(broadcasts(provider)).toHaveLength(0);
		});

		it('a guard against an address rocketh knows nothing about aborts rather than executing', async () => {
			/**
			 * Example: the guard names a raw address (not a saved deployment) that holds no code,
			 * typically because the contract it should observe has not been deployed yet. There
			 * is no known deployment to justify a retry, so the empty return is fatal at once.
			 */
			const {env, provider, registry} = await setup();
			provider.setResponse('eth_call', () => '0x');

			const notDeployed = {
				address: NOT_DEPLOYED_ADDRESS,
				abi: TIMELOCK_ABI,
			} as unknown as MinimalDeployment<typeof TIMELOCK_ABI>;

			const error = await failureOf(() =>
				execute(env)(registry, {
					account: 'governance',
					functionName: 'setPoolImpl',
					args: [NEW_IMPLEMENTATION],
					guard: {
						kind: 'call',
						on: notDeployed,
						functionName: 'getOperationState',
						args: [OPERATION_ID],
						satisfied: (state) => state === OperationState.Done,
					},
				}),
			);

			expect(error).toBeInstanceOf(GuardEvaluationError);
			expect(error.data.target).toBe(NOT_DEPLOYED_ADDRESS);
			expect(broadcasts(provider)).toHaveLength(0);
		});

		it("a guard whose own `satisfied` predicate throws aborts, and does not count as 'not satisfied'", async () => {
			/**
			 * Example: the predicate itself is broken — it reaches into a tuple component that
			 * is not there, or calls a method on an undefined value. The read succeeded, but the
			 * JUDGEMENT did not, so there is still no verdict, and the same rule applies.
			 */
			const {env, provider, registry, timelock} = await setup();
			provider.setResponse('eth_call', word(OperationState.Waiting));
			const broken = new TypeError("Cannot read properties of undefined (reading 'state')");

			const error = await failureOf(() =>
				execute(env)(registry, {
					account: 'governance',
					functionName: 'setPoolImpl',
					args: [NEW_IMPLEMENTATION],
					guard: {
						kind: 'call',
						on: timelock,
						functionName: 'getOperationState',
						args: [OPERATION_ID],
						satisfied: () => {
							throw broken;
						},
					},
				}),
			);

			expect(error).toBeInstanceOf(GuardEvaluationError);
			expect(error.cause).toBe(broken);
			expect(broadcasts(provider)).toHaveLength(0);
		});

		it('a STORAGE guard whose slot read fails aborts, and sends nothing', async () => {
			/**
			 * Example: the node refuses `eth_getStorageAt` (some public RPCs do), or errors on
			 * it. The commonest upgrade topology there is is observable ONLY in that slot, so a
			 * failure to read it is a total absence of information about whether the upgrade
			 * already landed.
			 */
			const {env, provider, registry, proxy} = await setup();
			const refused = new Error('method eth_getStorageAt is not available');
			provider.setResponse('eth_getStorageAt', () => {
				throw refused;
			});

			const error = await failureOf(() =>
				execute(env)(registry, {
					account: 'governance',
					functionName: 'setPoolImpl',
					args: [NEW_IMPLEMENTATION],
					guard: {
						kind: 'storage',
						on: proxy,
						slot: EIP1967_IMPLEMENTATION_SLOT,
						as: 'address',
						equals: NEW_IMPLEMENTATION,
					},
				}),
			);

			expect(error).toBeInstanceOf(GuardEvaluationError);
			expect(error.cause).toBe(refused);
			expect(broadcasts(provider)).toHaveLength(0);
		});

		it('a STORAGE guard whose word does not fit its declared interpretation aborts, and sends nothing', async () => {
			/**
			 * Example: a `bool` guard pointed at a PACKED slot, which holds several variables and
			 * cannot be read as one whole-word value. The decoding refuses to guess, and that
			 * refusal must abort the run rather than fall through to the privileged call.
			 */
			const {env, provider, registry, proxy} = await setup();
			provider.setResponse('eth_getStorageAt', () => word(2n));

			const error = await failureOf(() =>
				execute(env)(registry, {
					account: 'governance',
					functionName: 'setPoolImpl',
					args: [NEW_IMPLEMENTATION],
					guard: {
						kind: 'storage',
						on: proxy,
						slot: SOME_SLOT,
						as: 'bool',
						equals: true,
					},
				}),
			);

			expect(error).toBeInstanceOf(GuardEvaluationError);
			expect(broadcasts(provider)).toHaveLength(0);
		});
	});

	describe('A failing guard is never treated as UNSATISFIED', () => {
		it('sends when the guard says "not yet", and sends NOTHING when the guard cannot say', async () => {
			/**
			 * The regression pin. Both runs below use the identical script and the identical
			 * guard; only the chain's answer differs. When the guard produces the verdict "not
			 * satisfied", the call is sent, which is the behaviour a fall-through implementation
			 * would also produce. When the guard cannot produce a verdict at all, NOTHING is
			 * sent.
			 *
			 * A regression to fall-through behaviour (`catch { satisfied: false }`, anywhere on
			 * the evaluation path) would make the second half of this test broadcast the very
			 * transaction the guard exists to withhold, and this test goes red.
			 */
			const {env, provider, registry, timelock} = await setup();
			const guard = {
				kind: 'call' as const,
				on: timelock,
				functionName: 'getOperationState' as const,
				args: [OPERATION_ID] as const,
				satisfied: (state: number) => state === OperationState.Done,
			};
			const script = () =>
				execute(env)(registry, {
					account: 'governance',
					functionName: 'setPoolImpl',
					args: [NEW_IMPLEMENTATION],
					guard,
				});

			// a VERDICT of "not satisfied": the effect has not landed, so the call is still needed
			provider.setResponse('eth_call', word(OperationState.Waiting));
			const unsatisfied = await script();
			expect(unsatisfied.outcome).toBe('sent');
			expect(broadcasts(provider)).toHaveLength(1);

			// NO verdict: an error is not evidence that the call is needed
			provider.setResponse('eth_call', () => {
				throw new Error('execution reverted');
			});
			await failureOf(script);
			expect(broadcasts(provider)).toHaveLength(1); // still one: nothing new was sent
		});
	});

	describe('The surfaced error', () => {
		it('names the guard that failed and the target it read, for the call kind', async () => {
			const {env, provider, timelock} = await setup();
			provider.setResponse('eth_call', () => {
				throw new Error('execution reverted: TimelockController: unknown operation');
			});

			const error = await failureOf(() =>
				evaluateGuard(env)({
					kind: 'call',
					on: timelock,
					functionName: 'getOperationState',
					args: [OPERATION_ID],
					satisfied: (state) => state === OperationState.Done,
				}),
			);

			expect(error.name).toBe('GuardEvaluationError');
			expect(error.data.kind).toBe('call');
			expect(error.data.target).toBe(TIMELOCK_ADDRESS);
			expect(error.data.functionName).toBe('getOperationState');
			expect(error.message).toContain('getOperationState');
			expect(error.message).toContain(TIMELOCK_ADDRESS);
		});

		it('names the slot and the target it read, for the storage kind', async () => {
			const {env, provider, proxy} = await setup();
			const refused = new Error('method eth_getStorageAt is not available');
			provider.setResponse('eth_getStorageAt', () => {
				throw refused;
			});

			const error = await failureOf(() =>
				evaluateGuard(env)({
					kind: 'storage',
					on: proxy,
					slot: EIP1967_IMPLEMENTATION_SLOT,
					as: 'address',
					equals: NEW_IMPLEMENTATION,
				}),
			);

			expect(error.data.kind).toBe('storage');
			expect(error.data.target).toBe(PROXY_ADDRESS);
			expect(error.data.slot).toBe(EIP1967_IMPLEMENTATION_SLOT);
			expect(error.message).toContain(EIP1967_IMPLEMENTATION_SLOT);
			expect(error.message).toContain(PROXY_ADDRESS);
		});

		it('PRESERVES the underlying failure rather than replacing it', async () => {
			/**
			 * The underlying error is what tells the user how to fix their script, so it is kept
			 * whole on `cause` AND quoted in the message. A guard failure that reworded "the
			 * node refuses eth_getStorageAt" into "the guard failed" would leave the operator
			 * with nothing to act on.
			 */
			const {env, provider, timelock} = await setup();
			const reverted = new Error('execution reverted: TimelockController: unknown operation');
			provider.setResponse('eth_call', () => {
				throw reverted;
			});

			const error = await failureOf(() =>
				evaluateGuard(env)({
					kind: 'call',
					on: timelock,
					functionName: 'getOperationState',
					args: [OPERATION_ID],
					satisfied: (state) => state === OperationState.Done,
				}),
			);

			expect(error.cause).toBe(reverted);
			expect(error.message).toContain('execution reverted: TimelockController: unknown operation');
		});

		it('is the same error whether the guard was evaluated by `execute` or on its own', async () => {
			/**
			 * The evaluator is the ONE place a guard failure is turned into this error, so a
			 * collector computing the pending set standalone sees exactly what a deploy script
			 * sees. Two seams would be two chances for one of them to fall through.
			 */
			const {env, provider, registry, timelock} = await setup();
			provider.setResponse('eth_call', () => {
				throw new Error('execution reverted');
			});
			const guard = {
				kind: 'call' as const,
				on: timelock,
				functionName: 'getOperationState' as const,
				args: [OPERATION_ID] as const,
				satisfied: (state: number) => state === OperationState.Done,
			};

			const standalone = await failureOf(() => evaluateGuard(env)(guard));
			const throughExecute = await failureOf(() =>
				execute(env)(registry, {
					account: 'governance',
					functionName: 'setPoolImpl',
					args: [NEW_IMPLEMENTATION],
					guard,
				}),
			);

			expect(standalone.message).toBe(throughExecute.message);
			expect(broadcasts(provider)).toHaveLength(0);
		});

		it('reports a guard that states no target or no verdict as the same kind of failure', async () => {
			/**
			 * A guard that names no `on` with no default target, or that declares neither
			 * `equals` nor `satisfied`, cannot produce a verdict either. These are declaration
			 * mistakes rather than chain failures, but the consequence has to be identical:
			 * fatal, never "not satisfied".
			 */
			const {env, provider, proxy} = await setup();

			const noTarget = await failureOf(() =>
				evaluateGuard(env)({
					kind: 'storage',
					slot: EIP1967_IMPLEMENTATION_SLOT,
					as: 'address',
					equals: NEW_IMPLEMENTATION,
				}),
			);
			expect(noTarget).toBeInstanceOf(GuardEvaluationError);
			expect(noTarget.message).toMatch(/no target/i);

			const noVerdict = await failureOf(() =>
				evaluateGuard(env)({
					kind: 'storage',
					on: proxy,
					slot: EIP1967_IMPLEMENTATION_SLOT,
					as: 'address',
				} as never),
			);
			expect(noVerdict).toBeInstanceOf(GuardEvaluationError);
			expect(broadcasts(provider)).toHaveLength(0);
		});
	});
});
