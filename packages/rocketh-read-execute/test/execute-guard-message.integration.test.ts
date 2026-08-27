/**
 * Integration tests for @rocketh/read-execute - what a SKIPPED guarded step tells the user.
 *
 * Silence is the failure mode this covers. A guarded step whose condition is already
 * satisfied produces no transaction, no receipt and no output at all, so a run where the
 * guard is subtly wrong looks EXACTLY like a run where the work was genuinely already
 * done. Anyone debugging "why did my upgrade not happen" reads the run output, and the
 * answer has to be in it.
 *
 * So a skip says, on ONE line: which step was skipped, which contract was read and how (a
 * view function plus its arguments, or a slot plus how the word was interpreted), the
 * value that came back, the selected component where one was selected, and what it was
 * compared against. That is the payoff of the guard being a DECLARED read rather than an
 * opaque predicate: a closure would have left nothing to name and nothing to show
 * (`docs/adr/0013-the-execute-guard-is-a-declared-read.md`).
 *
 * The line goes through `env.showMessage`, rocketh's user-message channel, the same one
 * `catchUnknownSigner` prints its deferred transaction through, never to `console`
 * directly (`docs/adr/0009-user-facing-notices-stay-on-console.md`).
 *
 * The assertions below are on the TEXT, not on "something was said": the message IS the
 * deliverable here, so a test that only counted calls would let the content rot.
 */

import {describe, it, expect, vi} from 'vitest';
import {execute, executeByName, evaluateGuard} from '../src/index.js';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';
import type {Environment} from '@rocketh/core/types';
import type {Abi, AbiParameter} from 'abitype';
import {encodeAbiParameters} from 'viem';

const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;

const REGISTRY_ADDRESS = ('0x' + 'a'.repeat(40)) as `0x${string}`;
const ACCESS_MANAGER_ADDRESS = ('0x' + 'b'.repeat(40)) as `0x${string}`;
const PROXY_ADDRESS = ('0x' + '11'.repeat(20)) as `0x${string}`;
const PROXY_ADMIN_ADDRESS = ('0x' + '22'.repeat(20)) as `0x${string}`;

/** The implementation being upgraded to, checksummed as an author would paste it. */
const IMPLEMENTATION = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`;
const OTHER_IMPLEMENTATION = ('0x' + 'ee'.repeat(20)) as `0x${string}`;

/** The EIP-1967 implementation slot, the same constant `@rocketh/proxy` reads. */
const EIP1967_IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc' as const;

const OPERATOR_ROLE = 42n;
const OPERATOR = ('0x' + 'f'.repeat(40)) as `0x${string}`;

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

/** `hasRole(uint64,address) returns (bool isMember, uint32 executionDelay)`, OZ `AccessManager`. */
const ACCESS_MANAGER_ABI = [
	{
		type: 'function',
		name: 'hasRole',
		inputs: [
			{type: 'uint64', name: 'roleId'},
			{type: 'address', name: 'account'},
		],
		outputs: [
			{type: 'bool', name: 'isMember'},
			{type: 'uint32', name: 'executionDelay'},
		],
		stateMutability: 'view',
	},
] as const satisfies Abi;

const PROXY_ADMIN_ABI = [
	{
		type: 'function',
		name: 'upgradeAndCall',
		inputs: [
			{type: 'address', name: 'proxy'},
			{type: 'address', name: 'implementation'},
			{type: 'bytes', name: 'data'},
		],
		outputs: [],
		stateMutability: 'payable',
	},
] as const satisfies Abi;

/** A transparent proxy has no getter to call, which is why the storage kind exists. */
const PROXY_ABI = [] as const satisfies Abi;

// ============================================================================
// Harness
// ============================================================================

const ZERO_WORD = ('0x' + '0'.repeat(64)) as `0x${string}`;

/** ABI-encode a return value exactly as a node would put it on the wire. */
function returns(params: readonly AbiParameter[], values: readonly unknown[]): `0x${string}` {
	return encodeAbiParameters(params as never, values as never);
}

/** Left-pad a value into the 32-byte word the EVM would store it in. */
function word(value: `0x${string}` | bigint | boolean): `0x${string}` {
	const digits =
		typeof value === 'boolean'
			? value
				? '1'
				: '0'
			: typeof value === 'bigint'
				? value.toString(16)
				: value.slice(2).toLowerCase();
	return ('0x' + digits.padStart(64, '0')) as `0x${string}`;
}

function createStorage() {
	const slots = new Map<string, `0x${string}`>();
	const keyOf = (address: string, slot: string) => `${address.toLowerCase()}:${slot.toLowerCase()}`;
	return {
		set(address: `0x${string}`, slot: `0x${string}`, value: `0x${string}` | bigint | boolean) {
			slots.set(keyOf(address, slot), word(value));
		},
		respondToGetStorageAt(params?: unknown[]) {
			const [address, slot] = params as [string, string];
			return slots.get(keyOf(address, slot)) ?? ZERO_WORD;
		},
	};
}

/** Capture what the run told the user, the way the unknown-signer suite does. */
function capturePrinted(env: Environment): {messages: string[]; printed: () => string} {
	const messages: string[] = [];
	vi.spyOn(env, 'showMessage').mockImplementation((message: string) => {
		messages.push(message);
	});
	return {messages, printed: () => messages.join('\n')};
}

async function setup() {
	const storage = createStorage();
	const {env, provider} = await createTestEnvironment({
		accounts: {governance: NODE_ACCOUNT},
		nodeAccounts: [NODE_ACCOUNT],
		providerConfig: {
			responses: {eth_getStorageAt: (params?: unknown[]) => storage.respondToGetStorageAt(params)},
		},
	});
	const registry = await env.save('Registry', {
		address: REGISTRY_ADDRESS,
		...createMockArtifact('Registry', REGISTRY_ABI),
		argsData: '0x',
	});
	const accessManager = await env.save('AccessManager', {
		address: ACCESS_MANAGER_ADDRESS,
		...createMockArtifact('AccessManager', ACCESS_MANAGER_ABI),
		argsData: '0x',
	});
	const proxy = await env.save('Proxy', {
		address: PROXY_ADDRESS,
		...createMockArtifact('Proxy', PROXY_ABI),
		argsData: '0x',
	});
	const proxyAdmin = await env.save('ProxyAdmin', {
		address: PROXY_ADMIN_ADDRESS,
		...createMockArtifact('ProxyAdmin', PROXY_ADMIN_ABI),
		argsData: '0x',
	});
	const printed = capturePrinted(env);
	return {env, provider, storage, registry, accessManager, proxy, proxyAdmin, ...printed};
}

describe('@rocketh/read-execute - a skipped guarded step explains itself', () => {
	describe('kind: call', () => {
		it('names the step, the read, the value and what it was compared against, on one line', async () => {
			/**
			 * Example: the commonest guard there is. The registry already points at the
			 * implementation this call would set, so nothing is sent, and the ONLY trace the
			 * run leaves of that decision is this line.
			 */
			const {env, provider, registry, messages} = await setup();
			provider.setResponse('eth_call', returns([{type: 'address'}], [IMPLEMENTATION]));

			const result = await execute(env)(registry, {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [IMPLEMENTATION],
				guard: {kind: 'call', functionName: 'getPoolImpl', equals: IMPLEMENTATION},
			});

			expect(result.outcome).toBe('skipped');
			expect(messages).toEqual([
				`skipped setPoolImpl: the guard on "getPoolImpl" of ${REGISTRY_ADDRESS} read ${IMPLEMENTATION}, expected ${IMPLEMENTATION}`,
			]);
		});

		it('shows the ARGUMENTS the read was made with, since a guard on hasRole(x) is not one on hasRole(y)', async () => {
			/**
			 * Example: a role check. `hasRole` is meaningless without saying WHOSE role on
			 * WHICH id, so the arguments are part of "what rocketh looked at".
			 *
			 * This one also SELECTS: the read returns membership AND an execution delay, and
			 * only membership was asserted. The line therefore shows the whole value that came
			 * back as well as the component the verdict actually judged, so a reader can see
			 * that the delay was not part of the decision.
			 */
			const {env, provider, registry, accessManager, messages} = await setup();
			provider.setResponse('eth_call', returns([{type: 'bool'}, {type: 'uint32'}], [true, 3600]));

			const result = await execute(env)(registry, {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [IMPLEMENTATION],
				guard: {
					kind: 'call',
					on: accessManager,
					functionName: 'hasRole',
					args: [OPERATOR_ROLE, OPERATOR],
					output: 'isMember',
					equals: true,
				},
			});

			expect(result.outcome).toBe('skipped');
			expect(messages).toEqual([
				`skipped setPoolImpl: the guard on "hasRole" of ${ACCESS_MANAGER_ADDRESS} with args (42, ${OPERATOR}) ` +
					`read [true,3600], output "isMember" is true, expected true`,
			]);
		});

		it('names a selection made by POSITION as the position it was written as', async () => {
			const {env, provider, registry, accessManager, messages} = await setup();
			provider.setResponse('eth_call', returns([{type: 'bool'}, {type: 'uint32'}], [true, 3600]));

			await execute(env)(registry, {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [IMPLEMENTATION],
				guard: {
					kind: 'call',
					on: accessManager,
					functionName: 'hasRole',
					args: [OPERATOR_ROLE, OPERATOR],
					output: 1,
					equals: 3600,
				},
			});

			expect(messages[0]).toContain('output #1 is 3600, expected 3600');
		});

		it('says a PREDICATE accepted the value, rather than inventing an expected value it was never given', async () => {
			/**
			 * Example: the negation topology (needed UNLESS the operation reached its terminal
			 * state), which no equality can express. There is no expected value to show, so
			 * the line says what did the accepting instead of leaving the reader to wonder
			 * whether an expectation was dropped.
			 */
			const {env, provider, registry, messages} = await setup();
			provider.setResponse('eth_call', returns([{type: 'address'}], [IMPLEMENTATION]));

			await execute(env)(registry, {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [IMPLEMENTATION],
				guard: {
					kind: 'call',
					functionName: 'getPoolImpl',
					satisfied: (current) => current !== OTHER_IMPLEMENTATION,
				},
			});

			expect(messages).toEqual([
				`skipped setPoolImpl: the guard on "getPoolImpl" of ${REGISTRY_ADDRESS} read ${IMPLEMENTATION}, ` +
					`accepted by its satisfied() predicate`,
			]);
		});

		it('reports the same way through executeByName', async () => {
			const {env, provider, messages} = await setup();
			provider.setResponse('eth_call', returns([{type: 'address'}], [IMPLEMENTATION]));

			await executeByName(env)('Registry', {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [IMPLEMENTATION],
				guard: {kind: 'call', functionName: 'getPoolImpl', equals: IMPLEMENTATION},
			});

			expect(messages[0]).toContain(`skipped setPoolImpl: the guard on "getPoolImpl" of ${REGISTRY_ADDRESS}`);
		});
	});

	describe('kind: storage', () => {
		it('shows the DECODED value, not only the raw word, because the word is not what the author wrote', async () => {
			/**
			 * Example: upgrading a transparent proxy through its ProxyAdmin. The word in the
			 * slot is a left-padded, lowercased 32 bytes; what the author wrote in their script
			 * is a checksummed address. Printing the word alone would make the reader decode it
			 * by hand to check the guard did the right thing, so the line shows the decoded
			 * value under the interpretation that was declared.
			 */
			const {env, storage, proxy, proxyAdmin, messages} = await setup();
			storage.set(PROXY_ADDRESS, EIP1967_IMPLEMENTATION_SLOT, IMPLEMENTATION);

			const result = await execute(env)(proxyAdmin, {
				account: 'governance',
				functionName: 'upgradeAndCall',
				args: [PROXY_ADDRESS, IMPLEMENTATION, '0x'],
				guard: {
					kind: 'storage',
					on: proxy,
					slot: EIP1967_IMPLEMENTATION_SLOT,
					as: 'address',
					equals: IMPLEMENTATION,
				},
			});

			expect(result.outcome).toBe('skipped');
			expect(messages).toEqual([
				`skipped upgradeAndCall: the guard on slot ${EIP1967_IMPLEMENTATION_SLOT} of ${PROXY_ADDRESS} ` +
					`read the address ${IMPLEMENTATION}, expected ${IMPLEMENTATION}`,
			]);
			// the read went to the PROXY, and the line says so: the contract being CALLED is the
			//  admin, which is exactly the confusion this message exists to remove
			expect(messages[0]).not.toContain(PROXY_ADMIN_ADDRESS);
		});

		it('names the declared interpretation for the non-address words too', async () => {
			const {env, storage, proxy, proxyAdmin, messages} = await setup();
			const versionSlot = ('0x' + '0'.repeat(63) + '7') as `0x${string}`;
			storage.set(PROXY_ADDRESS, versionSlot, 2n);

			await execute(env)(proxyAdmin, {
				account: 'governance',
				functionName: 'upgradeAndCall',
				args: [PROXY_ADDRESS, IMPLEMENTATION, '0x'],
				guard: {kind: 'storage', on: proxy, slot: versionSlot, as: 'uint256', equals: 2n},
			});

			expect(messages[0]).toContain('read the uint256 2, expected 2');
		});
	});

	describe('how loud it is', () => {
		it('says NOTHING when the call is still needed, because the transaction is its own evidence', async () => {
			/**
			 * The judgement call, stated as a test. A skip must be visible because it is the
			 * case with no other trace; a proceed already leaves a transaction behind, and a
			 * deploy script may hold dozens of guarded steps. So the guard is silent on the
			 * path that sends.
			 */
			const {env, provider, registry, messages} = await setup();
			provider.setResponse('eth_call', returns([{type: 'address'}], [OTHER_IMPLEMENTATION]));

			const result = await execute(env)(registry, {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [IMPLEMENTATION],
				guard: {kind: 'call', functionName: 'getPoolImpl', equals: IMPLEMENTATION},
			});

			expect(result.outcome).toBe('sent');
			expect(messages).toEqual([]);
		});

		it('says nothing at all for an UNGUARDED call, which is every call written before guards existed', async () => {
			const {env, registry, messages} = await setup();

			await execute(env)(registry, {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [IMPLEMENTATION],
			});

			expect(messages).toEqual([]);
		});

		it('stays to ONE line per skipped step, and uses no em dash', async () => {
			/**
			 * Both halves are load-bearing. A script with dozens of guarded steps turns a
			 * paragraph per step into a wall that buries the run, and the em dash is a
			 * repo-wide rule that message text has to keep.
			 */
			const {env, provider, storage, registry, accessManager, proxy, proxyAdmin, messages} = await setup();
			provider.setResponse('eth_call', returns([{type: 'bool'}, {type: 'uint32'}], [true, 3600]));
			storage.set(PROXY_ADDRESS, EIP1967_IMPLEMENTATION_SLOT, IMPLEMENTATION);

			await execute(env)(registry, {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [IMPLEMENTATION],
				guard: {
					kind: 'call',
					on: accessManager,
					functionName: 'hasRole',
					args: [OPERATOR_ROLE, OPERATOR],
					output: 'isMember',
					equals: true,
				},
			});
			await execute(env)(proxyAdmin, {
				account: 'governance',
				functionName: 'upgradeAndCall',
				args: [PROXY_ADDRESS, IMPLEMENTATION, '0x'],
				guard: {
					kind: 'storage',
					on: proxy,
					slot: EIP1967_IMPLEMENTATION_SLOT,
					as: 'address',
					equals: IMPLEMENTATION,
				},
			});

			expect(messages).toHaveLength(2);
			for (const message of messages) {
				expect(message).not.toContain('\n');
				expect(message).not.toContain('\u2014');
			}
		});

		it('is the EXECUTE step that reports, not the evaluator: a standalone evaluation tells nobody anything', async () => {
			/**
			 * Example: what a later collector does, computing the set of still-pending
			 * privileged actions without executing any of them. It evaluates many guards and
			 * reports its own summary; an evaluator that printed a "skipped" line per guard
			 * would be claiming a step was skipped when no step was ever attempted.
			 */
			const {env, provider, registry, messages} = await setup();
			provider.setResponse('eth_call', returns([{type: 'address'}], [IMPLEMENTATION]));

			const evaluation = await evaluateGuard(env)({
				kind: 'call',
				on: registry,
				functionName: 'getPoolImpl',
				equals: IMPLEMENTATION,
			});

			expect(evaluation.satisfied).toBe(true);
			expect(messages).toEqual([]);
		});
	});

	describe('where the content comes from', () => {
		it('reports the evaluation record itself, so the line and the returned record cannot disagree', async () => {
			/**
			 * The content is READ OFF the record the evaluator produced, never re-derived at
			 * the message site from the guard the user wrote. Re-deriving it would create two
			 * answers to "what did rocketh read", and the one the user sees would be the one
			 * nothing tests against the chain.
			 */
			const {env, storage, proxy, proxyAdmin, messages} = await setup();
			storage.set(PROXY_ADDRESS, EIP1967_IMPLEMENTATION_SLOT, IMPLEMENTATION);

			const result = await execute(env)(proxyAdmin, {
				account: 'governance',
				functionName: 'upgradeAndCall',
				args: [PROXY_ADDRESS, IMPLEMENTATION, '0x'],
				guard: {
					kind: 'storage',
					on: proxy,
					slot: EIP1967_IMPLEMENTATION_SLOT,
					as: 'address',
					// the LOWERCASED spelling, which the record checksums on the way in
					equals: IMPLEMENTATION.toLowerCase() as `0x${string}`,
				},
			});

			if (result.outcome !== 'skipped') throw new Error('expected the step to be skipped');
			const {evaluation} = result;
			expect(messages[0]).toContain(evaluation.target);
			expect(messages[0]).toContain(evaluation.slot);
			expect(messages[0]).toContain(evaluation.value);
			// `expected` is quoted as the author wrote it, lowercased, which is the record's own
			//  content: the comparison folded the case, and the message does not hide that it did
			expect(messages[0]).toContain(`expected ${IMPLEMENTATION.toLowerCase()}`);
		});
	});
});
