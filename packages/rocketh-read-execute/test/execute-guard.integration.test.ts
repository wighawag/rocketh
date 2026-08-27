/**
 * Integration tests for @rocketh/read-execute - the `execute` state guard (`kind: 'call'`).
 *
 * A guard declares the on-chain condition under which a call is still NEEDED. rocketh
 * performs the read itself (it is declared, never a closure over one, see
 * `docs/adr/0013-the-execute-guard-is-a-declared-read.md`), evaluates it BEFORE any
 * transaction is built, and reports what it read on both paths. A guard that is
 * SATISFIED means the call is no longer needed, so the call is SKIPPED: no transaction
 * is built, nothing is broadcast, and the unknown-signer seam is never consulted.
 *
 * These tests run against `createTestEnvironment`, a REAL rocketh environment wired to a
 * mock EIP-1193 provider. The provider is not an EVM, so every guard test cans its own
 * `eth_call` answer; the default (`0x`) decodes to viem's zero-data error rather than to
 * a value. The provider also records every request, which is how a SKIP is proved: the
 * assertion is the absence of `eth_sendTransaction` / `eth_sendRawTransaction` from the
 * recorded requests, not merely the shape of the return value.
 */

import {describe, it, expect} from 'vitest';
import {execute, executeByName, evaluateGuard} from '../src/index.js';
import type {CallGuard} from '../src/index.js';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';
import type {Environment, MinimalDeployment} from '@rocketh/core/types';
import type {EIP1193TransactionReceipt} from 'eip-1193';
import type {Abi} from 'abitype';

const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;
const REGISTRY_ADDRESS = ('0x' + 'a'.repeat(40)) as `0x${string}`;
const TIMELOCK_ADDRESS = ('0x' + 'b'.repeat(40)) as `0x${string}`;
const NEW_IMPLEMENTATION = ('0x' + 'c'.repeat(40)) as `0x${string}`;

/**
 * The contract being CALLED: a registry that owns the proxies it configures, the Aave V3
 * `PoolAddressesProvider` shape from `work/notes/findings/governance-upgrade-topologies-in-the-wild.md`.
 */
const REGISTRY_ABI = [
	{
		type: 'function',
		name: 'setPoolImpl',
		inputs: [{type: 'address', name: 'newPoolImpl'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'getPoolImpl',
		inputs: [],
		outputs: [{type: 'address'}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

/**
 * The contract being READ, which is a DIFFERENT one: OpenZeppelin's `TimelockController`.
 *
 * `getOperationState(id)` returns `enum OperationState {Unset, Waiting, Ready, Done}`,
 * i.e. a `uint8` over four states, verified against the contract in
 * `work/notes/findings/governance-upgrade-topologies-in-the-wild.md`. It is the NEGATION
 * fixture: the step is needed UNLESS the operation has reached its terminal state, which
 * is a condition no equality can express (`state === Done` is an equality against the
 * one state we do not act on, but the guard's question is "has it landed", and the three
 * other states are all "not yet"; see the `satisfied` predicates below).
 *
 * Driving the timelock is explicitly NOT the guard's job (that is `unsignable-routes`);
 * the guard only OBSERVES whether the effect landed.
 */
const TIMELOCK_ABI = [
	{
		type: 'function',
		name: 'getOperationState',
		inputs: [{type: 'bytes32', name: 'id'}],
		outputs: [{type: 'uint8'}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

const OPERATION_ID = ('0x' + 'd'.repeat(64)) as `0x${string}`;

/** `enum OperationState {Unset, Waiting, Ready, Done}` */
const OperationState = {Unset: 0, Waiting: 1, Ready: 2, Done: 3} as const;

/** ABI-encode a `uint8` (or an `address`) return value into a single 32-byte word. */
function word(value: number | `0x${string}`): `0x${string}` {
	const hex = typeof value === 'number' ? value.toString(16) : value.slice(2);
	return ('0x' + hex.padStart(64, '0')) as `0x${string}`;
}

async function setup() {
	const {env, provider} = await createTestEnvironment({
		accounts: {governance: NODE_ACCOUNT},
		nodeAccounts: [NODE_ACCOUNT],
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
	return {env, provider, registry, timelock};
}

function broadcasts(provider: {getRequests: () => Array<{method: string}>}) {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendTransaction' || r.method === 'eth_sendRawTransaction');
}

describe('@rocketh/read-execute - the execute guard, kind: call', () => {
	it('SKIPS the call, and broadcasts nothing, when the chain already satisfies the guard', async () => {
		/**
		 * Example: the privileged call was already made (here, out of band through a
		 * timelock), so the operation has reached `Done` and the call is not needed.
		 *
		 * The verdict is not the interesting assertion: the recorded provider requests are.
		 * A satisfied guard must never reach the broadcast choke point, so neither
		 * `eth_sendTransaction` nor `eth_sendRawTransaction` may appear.
		 */
		const {env, provider, registry, timelock} = await setup();
		const _execute = execute(env);

		provider.setResponse('eth_call', word(OperationState.Done));

		const result = await _execute(registry, {
			account: 'governance',
			functionName: 'setPoolImpl',
			args: [NEW_IMPLEMENTATION],
			guard: {
				kind: 'call',
				on: timelock,
				functionName: 'getOperationState',
				args: [OPERATION_ID],
				// the NEGATION: needed unless the operation reached its terminal state
				satisfied: (state) => state === OperationState.Done,
			},
		});

		expect(result.outcome).toBe('skipped');
		expect(broadcasts(provider)).toHaveLength(0);
	});

	it('EXECUTES, exactly as an unguarded call does, when the guard is not satisfied', async () => {
		/**
		 * Example: the operation is still `Waiting`, so the effect has not landed and the
		 * call is still needed. Nothing about the transaction changes: same target, same
		 * calldata, same receipt as the unguarded form.
		 */
		const {env, provider, registry, timelock} = await setup();
		const _execute = execute(env);

		provider.setResponse('eth_call', word(OperationState.Waiting));

		const result = await _execute(registry, {
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

		expect(result.outcome).toBe('sent');
		if (result.outcome !== 'sent') throw new Error('unreachable');
		expect(result.receipt.status).toBe('0x1');

		const sent = broadcasts(provider);
		expect(sent).toHaveLength(1);

		// the same transaction an unguarded call would have produced
		const unguarded = await createUnguardedTransaction();
		const params = (provider.getRequests().find((r) => r.method === 'eth_sendTransaction') as any).params[0];
		expect(params.to).toBe(REGISTRY_ADDRESS);
		expect(params.from).toBe(NODE_ACCOUNT);
		expect(params.data).toBe(unguarded.data);
	});

	it('reads a contract OTHER than the one being executed, which is the common case', async () => {
		/**
		 * Example: you call `setPoolImpl` on a registry and the thing you can observe is on
		 * the timelock (or, in the storage-guard sibling, on the proxy behind it). The read
		 * therefore has to go to a DIFFERENT address than the transaction.
		 */
		const {env, provider, registry, timelock} = await setup();
		const _execute = execute(env);

		provider.setResponse('eth_call', word(OperationState.Waiting));

		await _execute(registry, {
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

		const call = provider.getRequests().find((r) => r.method === 'eth_call') as any;
		expect(call.params[0].to).toBe(TIMELOCK_ADDRESS);

		const sendTx = provider.getRequests().find((r) => r.method === 'eth_sendTransaction') as any;
		expect(sendTx.params[0].to).toBe(REGISTRY_ADDRESS);
	});

	it('defaults its target to the contract being executed when it names none', async () => {
		/**
		 * Example: the effect IS observable on the contract being called, so the guard names
		 * no target and reads the executed contract. Here `getPoolImpl()` already returns the
		 * implementation the call would set.
		 */
		const {env, provider, registry} = await setup();
		const _execute = execute(env);

		provider.setResponse('eth_call', word(NEW_IMPLEMENTATION));

		const result = await _execute(registry, {
			account: 'governance',
			functionName: 'setPoolImpl',
			args: [NEW_IMPLEMENTATION],
			guard: {
				kind: 'call',
				functionName: 'getPoolImpl',
				satisfied: (current) => current.toLowerCase() === NEW_IMPLEMENTATION.toLowerCase(),
			},
		});

		expect(result.outcome).toBe('skipped');
		const call = provider.getRequests().find((r) => r.method === 'eth_call') as any;
		expect(call.params[0].to).toBe(REGISTRY_ADDRESS);
		expect(broadcasts(provider)).toHaveLength(0);
	});

	it('reports the evaluation on BOTH paths, skipped and sent', async () => {
		/**
		 * Example: a skipped step must be legible rather than mysterious, so the evaluation
		 * (what was read, from where, and the verdict) comes back on both paths.
		 */
		const {env, provider, registry, timelock} = await setup();
		const _execute = execute(env);

		let state: number = OperationState.Done;
		provider.setResponse('eth_call', () => word(state));

		const guard = {
			kind: 'call',
			on: timelock,
			functionName: 'getOperationState',
			args: [OPERATION_ID],
			satisfied: (s: number) => s === OperationState.Done,
		} as const;

		const skipped = await _execute(registry, {
			account: 'governance',
			functionName: 'setPoolImpl',
			args: [NEW_IMPLEMENTATION],
			guard,
		});
		expect(skipped.outcome).toBe('skipped');
		expect(skipped.evaluation).toEqual({
			kind: 'call',
			target: TIMELOCK_ADDRESS,
			functionName: 'getOperationState',
			args: [OPERATION_ID],
			value: OperationState.Done,
			satisfied: true,
		});

		state = OperationState.Ready;
		const sent = await _execute(registry, {
			account: 'governance',
			functionName: 'setPoolImpl',
			args: [NEW_IMPLEMENTATION],
			guard,
		});
		expect(sent.outcome).toBe('sent');
		expect(sent.evaluation).toEqual({
			kind: 'call',
			target: TIMELOCK_ADDRESS,
			functionName: 'getOperationState',
			args: [OPERATION_ID],
			value: OperationState.Ready,
			satisfied: false,
		});
	});

	it('converges: needed on the first run, skipped on the second once the effect landed', async () => {
		/**
		 * Example: the state the guard exists for. The same script runs twice, unedited. On
		 * run 1 the operation is `Waiting`, so the call is made. Between the runs the
		 * operation completes out of band (here, the canned answer moves). On run 2 the guard
		 * reads `Done`, is satisfied, and the call is skipped: the operator is not handed the
		 * same privileged transaction a second time.
		 *
		 * `Waiting` and `Ready` are BOTH "not yet", which is why this is a negation rather
		 * than an equality against a single expected value.
		 */
		const {env, provider, registry, timelock} = await setup();
		const _execute = execute(env);

		let state: number = OperationState.Waiting;
		provider.setResponse('eth_call', () => word(state));

		const script = () =>
			_execute(registry, {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [NEW_IMPLEMENTATION],
				guard: {
					kind: 'call' as const,
					on: timelock,
					functionName: 'getOperationState',
					args: [OPERATION_ID],
					satisfied: (s: number) => s === OperationState.Done,
				},
			});

		const firstRun = await script();
		expect(firstRun.outcome).toBe('sent');
		expect(broadcasts(provider)).toHaveLength(1);

		// the operation is executed out of band, with no rocketh involvement
		state = OperationState.Done;

		const secondRun = await script();
		expect(secondRun.outcome).toBe('skipped');
		expect(broadcasts(provider)).toHaveLength(1); // still one: nothing new was sent
	});

	it('is evaluable on its own, without executing anything', async () => {
		/**
		 * Example: what a later collector needs, to compute the set of still-pending
		 * privileged actions BEFORE proposing a batch. The evaluator is exported as a curried
		 * function in its own right, so the guard can be evaluated without an `execute` call
		 * anywhere near it.
		 */
		const {env, provider, timelock} = await setup();

		provider.setResponse('eth_call', word(OperationState.Ready));

		const evaluation = await evaluateGuard(env)({
			kind: 'call',
			on: timelock,
			functionName: 'getOperationState',
			args: [OPERATION_ID],
			satisfied: (state) => state === OperationState.Done,
		});

		expect(evaluation.satisfied).toBe(false);
		expect(evaluation.value).toBe(OperationState.Ready);
		expect(evaluation.target).toBe(TIMELOCK_ADDRESS);
		expect(broadcasts(provider)).toHaveLength(0);
	});

	it('accepts a default target when evaluated standalone, and refuses to guess when there is none', async () => {
		const {env, provider, registry} = await setup();

		provider.setResponse('eth_call', word(NEW_IMPLEMENTATION));

		const evaluation = await evaluateGuard(env)(
			{
				kind: 'call',
				functionName: 'getPoolImpl',
				satisfied: (current) => current.toLowerCase() === NEW_IMPLEMENTATION.toLowerCase(),
			},
			registry,
		);
		expect(evaluation.satisfied).toBe(true);

		await expect(
			evaluateGuard(env)({
				kind: 'call',
				functionName: 'getPoolImpl',
				satisfied: () => true,
			} as any),
		).rejects.toThrow(/no target/i);
	});

	it('goes THROUGH the read path, so it inherits the empty-return retry', async () => {
		/**
		 * Example: the guard's read is the SAME read `read(env)` performs, not a second
		 * encode/decode beside it, so the two cannot drift. One visible consequence is the
		 * retry `read` performs when a known deployment momentarily returns no data.
		 */
		const {env, provider, registry, timelock} = await setup();
		const _execute = execute(env);

		let callCount = 0;
		provider.setResponse('eth_call', () => {
			callCount++;
			return callCount === 1 ? '0x' : word(OperationState.Done);
		});

		const result = await _execute(registry, {
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

		expect(callCount).toBe(2);
		expect(result.outcome).toBe('skipped');
	});

	it('works the same through executeByName', async () => {
		const {env, provider, timelock} = await setup();
		const _executeByName = executeByName(env);

		provider.setResponse('eth_call', word(OperationState.Done));

		const result = await _executeByName('Registry', {
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
});

/**
 * The unguarded transaction, produced by the API exactly as it exists today, so the
 * guarded-but-unsatisfied path can be compared against it byte for byte.
 */
async function createUnguardedTransaction() {
	const {env, provider, registry} = await setup();
	await execute(env)(registry, {
		account: 'governance',
		functionName: 'setPoolImpl',
		args: [NEW_IMPLEMENTATION],
	});
	const sendTx = provider.getRequests().find((r) => r.method === 'eth_sendTransaction') as any;
	return sendTx.params[0] as {data: `0x${string}`};
}

// ============================================================================
// Type-level assertions
//
// These are enforced by `pnpm typecheck`, which type-checks `test/` alongside `src/`
// (see CONTEXT.md, "Tests are type-checked and formatted, same as src"). They are never
// CALLED: their whole content is the compile-time claim.
// ============================================================================

type IsExactly<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/**
 * An UNGUARDED call's return type is what it was before the guard existed:
 * `Promise<EIP1193TransactionReceipt>`, never widened with `undefined` and never turned
 * into the skipped-or-sent union. This is what keeps the five internal call sites in
 * `@rocketh/proxy` and `@rocketh/diamond`, and every user script in the wild, untouched.
 */
async function _pinUnguardedReturnTypeIsUnchanged(env: Environment, registry: MinimalDeployment<typeof REGISTRY_ABI>) {
	const result = await execute(env)(registry, {
		account: 'governance',
		functionName: 'setPoolImpl',
		args: [NEW_IMPLEMENTATION],
	});
	const _pin: IsExactly<typeof result, EIP1193TransactionReceipt> = true;
	return _pin;
}

async function _pinUnguardedByNameReturnTypeIsUnchanged(env: Environment) {
	const result = await executeByName(env)<typeof REGISTRY_ABI, 'setPoolImpl'>('Registry', {
		account: 'governance',
		functionName: 'setPoolImpl',
		args: [NEW_IMPLEMENTATION],
	});
	const _pin: IsExactly<typeof result, EIP1193TransactionReceipt> = true;
	return _pin;
}

/**
 * A GUARDED call returns the skipped-or-sent result, so a receipt is only reachable after
 * discriminating: there is no transaction at all on the skipped path.
 */
async function _pinGuardedReturnTypeCarriesTheEvaluation(
	env: Environment,
	registry: MinimalDeployment<typeof REGISTRY_ABI>,
	timelock: MinimalDeployment<typeof TIMELOCK_ABI>,
) {
	const result = await execute(env)(registry, {
		account: 'governance',
		functionName: 'setPoolImpl',
		args: [NEW_IMPLEMENTATION],
		guard: {
			kind: 'call',
			on: timelock,
			functionName: 'getOperationState',
			args: [OPERATION_ID],
			satisfied: (state) => {
				// the DECODED value, typed from the ABI of the contract READ (uint8 -> number)
				const _pinDecoded: IsExactly<typeof state, number> = true;
				return _pinDecoded && state === OperationState.Done;
			},
		},
	});

	// @ts-expect-error there is no receipt until the skipped/sent discrimination is made
	result.receipt;

	if (result.outcome === 'sent') {
		const _pinReceipt: IsExactly<typeof result.receipt, EIP1193TransactionReceipt> = true;
		return _pinReceipt;
	}
	const _pinValue: IsExactly<typeof result.evaluation.value, number> = true;
	return _pinValue;
}

/**
 * A guard that MIGHT be there cannot have a return type decided at compile time, so it is
 * refused rather than typed as an unguarded call, which a skipped result would violate at
 * runtime. The caller branches instead.
 */
async function _pinAPossiblyAbsentGuardIsRefused(
	env: Environment,
	registry: MinimalDeployment<typeof REGISTRY_ABI>,
	maybeGuard: CallGuard<typeof REGISTRY_ABI, 'getPoolImpl'> | undefined,
) {
	await execute(env)(registry, {
		account: 'governance',
		functionName: 'setPoolImpl',
		args: [NEW_IMPLEMENTATION],
		// @ts-expect-error neither call signature matches: `guard` is present-or-not
		guard: maybeGuard,
	});
}

/**
 * The guard's function name and arguments are typed against the ABI of the contract it
 * READS, not the one being executed, so a renamed getter is a compile error.
 */
async function _pinGuardIsTypedAgainstTheAbiItReads(
	env: Environment,
	registry: MinimalDeployment<typeof REGISTRY_ABI>,
	timelock: MinimalDeployment<typeof TIMELOCK_ABI>,
) {
	// @ts-expect-error `getOperationStatus` does not exist on the timelock ABI the guard reads
	await execute(env)(registry, {
		account: 'governance',
		functionName: 'setPoolImpl',
		args: [NEW_IMPLEMENTATION],
		guard: {
			kind: 'call',
			on: timelock,
			functionName: 'getOperationStatus',
			args: [OPERATION_ID],
			satisfied: () => true,
		},
	});

	// @ts-expect-error the operation id is a bytes32, not a number
	await execute(env)(registry, {
		account: 'governance',
		functionName: 'setPoolImpl',
		args: [NEW_IMPLEMENTATION],
		guard: {
			kind: 'call',
			on: timelock,
			functionName: 'getOperationState',
			args: [42],
			satisfied: () => true,
		},
	});
}
