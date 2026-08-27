/**
 * Integration tests for @rocketh/read-execute - the `execute` state guard (`kind: 'storage'`).
 *
 * A storage guard reads a raw SLOT instead of calling a function. That is not an
 * optimisation and not an OpenZeppelin quirk: an OZ transparent proxy exposes NO getter
 * for its implementation, so the effect of the commonest privileged call there is
 * (upgrade a proxy through its ProxyAdmin, from an owner that is usually a Safe) is
 * observable ONLY in the EIP-1967 implementation slot. A call-only guard could not
 * express it at all (`docs/adr/0013-the-execute-guard-is-a-declared-read.md`).
 *
 * The two topologies below are the evidence that this is a SHAPE rather than one
 * library's quirk. They come from completely different contract designs, OpenZeppelin's
 * `ProxyAdmin` and Aave V3's `PoolAddressesProvider`
 * (`work/notes/findings/governance-upgrade-topologies-in-the-wild.md`), and they arrive
 * at the same place: the transaction goes to one contract, and the only thing that can
 * confirm it landed is a slot on ANOTHER.
 *
 * A slot carries no ABI, so the guard declares how to read the word with `as`, from a
 * closed set (`address`, `bytes32`, `uint256`, `bool`). That declaration does two jobs:
 * it decodes the word, and it supplies the type the comparison rule keys off, so an
 * address read out of a slot folds case exactly as one returned from a getter does.
 *
 * These tests run against `createTestEnvironment`, a REAL rocketh environment wired to a
 * mock EIP-1193 provider. That provider is not an EVM and has no `eth_getStorageAt`
 * default at all, so the tests keep their own slot map and answer from it. That is also
 * how "the Safe executed the upgrade between two runs" is modelled: the test moves the
 * slot by hand, the style of
 * `packages/rocketh-unknown-signer/test/scenarios.integration.test.ts`.
 */

import {describe, it, expect} from 'vitest';
import {execute, evaluateGuard} from '../src/index.js';
import type {StorageGuard} from '../src/index.js';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';
import type {Environment, MinimalDeployment} from '@rocketh/core/types';
import type {Abi} from 'abitype';
import {getAddress} from 'viem';

const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;

const PROXY_ADDRESS = ('0x' + '11'.repeat(20)) as `0x${string}`;
const PROXY_ADMIN_ADDRESS = ('0x' + '22'.repeat(20)) as `0x${string}`;
const REGISTRY_ADDRESS = ('0x' + '33'.repeat(20)) as `0x${string}`;
const CURRENT_IMPLEMENTATION = ('0x' + 'ee'.repeat(20)) as `0x${string}`;

/**
 * The implementation being upgraded TO, in its CHECKSUMMED spelling.
 *
 * A slot holds it lowercased (the EVM has no notion of checksum casing), so this constant
 * and the word that comes back off the chain differ in case and MUST still compare equal.
 * That is the whole reason the declared interpretation feeds the comparison rule.
 */
const NEXT_IMPLEMENTATION = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`;

/**
 * The EIP-1967 IMPLEMENTATION slot: `bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)`.
 *
 * Standardised precisely so tooling can find a proxy's implementation without the proxy
 * exposing a getter. The same constant `@rocketh/proxy` reads.
 *
 * @see https://eips.ethereum.org/EIPS/eip-1967
 */
const EIP1967_IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc' as const;

/** An arbitrary slot for the non-address interpretations, since those need no standard. */
const SOME_SLOT = ('0x' + '0'.repeat(63) + '7') as `0x${string}`;

/**
 * OpenZeppelin's `ProxyAdmin`: the contract that HOLDS the upgrade right for a transparent
 * proxy. `upgradeAndCall` is `onlyOwner`, and that owner is usually a Safe.
 */
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
	{
		type: 'function',
		name: 'owner',
		inputs: [],
		outputs: [{type: 'address'}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

/**
 * The transparent proxy itself, and the point of the whole kind: its ABI is EMPTY.
 *
 * A transparent proxy routes every non-admin call to the implementation, so it deliberately
 * exposes no `implementation()` getter to call. There is literally nothing here for a
 * `kind: 'call'` guard to name, which is why the union needed a second member.
 */
const PROXY_ABI = [] as const satisfies Abi;

/**
 * Aave V3's `PoolAddressesProvider`, the SAME shape reached from a different design.
 *
 * `setPoolImpl(address)` is `onlyOwner` and delegates to `_updateImpl`, which calls
 * `upgradeToAndCall` on the proxy it owns. Its own getter, `getPool()`, returns the
 * PROXY's address, which does not change when the implementation behind it does, so a
 * guard reading the registry observes nothing at all.
 *
 * Read from `src/contracts/protocol/configuration/PoolAddressesProvider.sol`
 * (aave-dao/aave-v3-origin) via `work/notes/findings/governance-upgrade-topologies-in-the-wild.md`.
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
		name: 'getPool',
		inputs: [],
		outputs: [{type: 'address'}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

// ============================================================================
// Harness
// ============================================================================

const ZERO_WORD = ('0x' + '0'.repeat(64)) as `0x${string}`;
const ZERO_ADDRESS = ('0x' + '0'.repeat(40)) as `0x${string}`;

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

/**
 * The contract storage the mock provider serves through `eth_getStorageAt`, keyed by
 * ADDRESS and SLOT, because the whole point of these topologies is that the slot being
 * read belongs to a different contract than the one being called.
 *
 * The mock executes nothing, so a test that models "the privileged call happened out of
 * band" writes the slot itself, exactly as the unknown-signer scenario suite does.
 */
function createStorage() {
	const slots = new Map<string, `0x${string}`>();
	const keyOf = (address: string, slot: string) => `${address.toLowerCase()}:${slot.toLowerCase()}`;
	return {
		set(address: `0x${string}`, slot: `0x${string}`, value: `0x${string}` | bigint | boolean) {
			slots.set(keyOf(address, slot), word(value));
		},
		/** Write a word VERBATIM, for the cases where its exact bytes are the subject. */
		setWord(address: `0x${string}`, slot: `0x${string}`, rawWord: `0x${string}`) {
			slots.set(keyOf(address, slot), rawWord);
		},
		respondToGetStorageAt(params?: unknown[]) {
			const [address, slot] = params as [string, string];
			return slots.get(keyOf(address, slot)) ?? ZERO_WORD;
		},
	};
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
	const registry = await env.save('PoolAddressesProvider', {
		address: REGISTRY_ADDRESS,
		...createMockArtifact('PoolAddressesProvider', REGISTRY_ABI),
		argsData: '0x',
	});
	return {env, provider, storage, proxy, proxyAdmin, registry};
}

function broadcasts(provider: {getRequests: () => Array<{method: string}>}) {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendTransaction' || r.method === 'eth_sendRawTransaction');
}

function storageReads(provider: {getRequests: () => Array<{method: string; params?: unknown[]}>}) {
	return provider.getRequests().filter((r) => r.method === 'eth_getStorageAt');
}

describe('@rocketh/read-execute - the execute guard, kind: storage', () => {
	describe('The ProxyAdmin topology: call one contract, read a slot on another', () => {
		it('SKIPS the upgrade when the proxy already points at the new implementation', async () => {
			/**
			 * Example: upgrading a transparent proxy. The transaction goes to the ProxyAdmin,
			 * which is the contract that holds the right; the effect lands in the PROXY's
			 * EIP-1967 implementation slot, and the proxy has no getter to ask.
			 *
			 * Here the upgrade already happened (the Safe executed it out of band), so the
			 * slot already holds the new implementation and the call is not needed.
			 */
			const {env, provider, storage, proxy, proxyAdmin} = await setup();
			storage.set(PROXY_ADDRESS, EIP1967_IMPLEMENTATION_SLOT, NEXT_IMPLEMENTATION);

			const result = await execute(env)(proxyAdmin, {
				account: 'governance',
				functionName: 'upgradeAndCall',
				args: [PROXY_ADDRESS, NEXT_IMPLEMENTATION, '0x'],
				guard: {
					kind: 'storage',
					on: proxy,
					slot: EIP1967_IMPLEMENTATION_SLOT,
					as: 'address',
					equals: NEXT_IMPLEMENTATION,
				},
			});

			expect(result.outcome).toBe('skipped');

			// the read went to the PROXY; the transaction, had it been needed, to the ADMIN
			expect(storageReads(provider)).toHaveLength(1);
			expect((storageReads(provider)[0].params as unknown[])[0]).toBe(PROXY_ADDRESS);
			expect(broadcasts(provider)).toHaveLength(0);
		});

		it('EXECUTES against the admin while READING the proxy, and converges once the slot moves', async () => {
			/**
			 * Example: the same script run twice, unedited.
			 *
			 * Run 1: the slot still holds the old implementation, so the upgrade is still
			 * needed and the transaction goes to the ProxyAdmin. Out of band the upgrade
			 * happens (here the test moves the slot, which is what a Safe executing it looks
			 * like from rocketh's side). Run 2: the guard reads the new implementation, is
			 * satisfied, and nothing is sent a second time.
			 */
			const {env, provider, storage, proxy, proxyAdmin} = await setup();
			storage.set(PROXY_ADDRESS, EIP1967_IMPLEMENTATION_SLOT, CURRENT_IMPLEMENTATION);

			const script = () =>
				execute(env)(proxyAdmin, {
					account: 'governance',
					functionName: 'upgradeAndCall',
					args: [PROXY_ADDRESS, NEXT_IMPLEMENTATION, '0x'],
					guard: {
						kind: 'storage' as const,
						on: proxy,
						slot: EIP1967_IMPLEMENTATION_SLOT,
						as: 'address' as const,
						equals: NEXT_IMPLEMENTATION,
					},
				});

			const firstRun = await script();
			expect(firstRun.outcome).toBe('sent');
			expect(broadcasts(provider)).toHaveLength(1);
			const sent = provider.getRequests().find((r) => r.method === 'eth_sendTransaction') as any;
			expect(sent.params[0].to).toBe(PROXY_ADMIN_ADDRESS);

			// the upgrade is executed out of band, with no rocketh involvement
			storage.set(PROXY_ADDRESS, EIP1967_IMPLEMENTATION_SLOT, NEXT_IMPLEMENTATION);

			const secondRun = await script();
			expect(secondRun.outcome).toBe('skipped');
			expect(broadcasts(provider)).toHaveLength(1); // still one: nothing new was sent
		});
	});

	describe("The registry topology: the registry's own getter observes nothing", () => {
		it('reads the slot on the proxy BEHIND the registry, because getPool() cannot tell', async () => {
			/**
			 * Example: Aave V3. `setPoolImpl` goes to the `PoolAddressesProvider`, which owns
			 * the pool proxy and upgrades it. The registry's own getter, `getPool()`, returns
			 * the PROXY address, which is the same before and after the upgrade: a guard
			 * reading it is satisfied on a run where the work is still needed, and would skip
			 * a required upgrade.
			 *
			 * The observable effect is one level down, in the proxy's implementation slot, and
			 * it is reached from a contract design that has no ProxyAdmin at all. Same shape,
			 * different design, which is the evidence that this kind is not an OZ quirk.
			 */
			const {env, provider, storage, proxy, registry} = await setup();
			storage.set(PROXY_ADDRESS, EIP1967_IMPLEMENTATION_SLOT, CURRENT_IMPLEMENTATION);
			// `getPool()` returns the proxy's address, whatever is behind it
			provider.setResponse('eth_call', word(PROXY_ADDRESS));

			const _evaluate = evaluateGuard(env);
			const registryGuard = {
				kind: 'call',
				on: registry,
				functionName: 'getPool',
				equals: PROXY_ADDRESS,
			} as const;
			const slotGuard = {
				kind: 'storage',
				on: proxy,
				slot: EIP1967_IMPLEMENTATION_SLOT,
				as: 'address',
				equals: NEXT_IMPLEMENTATION,
			} as const;

			// BEFORE: the registry already says "satisfied", although nothing has happened
			expect((await _evaluate(registryGuard)).satisfied).toBe(true);
			expect((await _evaluate(slotGuard)).satisfied).toBe(false);

			const result = await execute(env)(registry, {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [NEXT_IMPLEMENTATION],
				guard: slotGuard,
			});
			expect(result.outcome).toBe('sent');
			const sent = provider.getRequests().find((r) => r.method === 'eth_sendTransaction') as any;
			expect(sent.params[0].to).toBe(REGISTRY_ADDRESS);

			// AFTER: the registry says exactly the same thing it said before; only the slot moved
			storage.set(PROXY_ADDRESS, EIP1967_IMPLEMENTATION_SLOT, NEXT_IMPLEMENTATION);
			expect((await _evaluate(registryGuard)).satisfied).toBe(true);
			expect((await _evaluate(slotGuard)).satisfied).toBe(true);
		});
	});

	describe('The declared interpretation', () => {
		it('decodes an address out of the LOW 20 bytes, checksummed as a getter would return it', async () => {
			const {env, storage, proxy} = await setup();
			storage.set(PROXY_ADDRESS, EIP1967_IMPLEMENTATION_SLOT, CURRENT_IMPLEMENTATION);

			const evaluation = await evaluateGuard(env)({
				kind: 'storage',
				on: proxy,
				slot: EIP1967_IMPLEMENTATION_SLOT,
				as: 'address',
				equals: NEXT_IMPLEMENTATION,
			});

			expect(evaluation.value).toBe(getAddress(CURRENT_IMPLEMENTATION));
			expect(evaluation.satisfied).toBe(false);
		});

		it('folds case for an address, exactly as an address returned from a getter does', async () => {
			/**
			 * Example: the trap this rule exists for. A slot holds an address LOWERCASED,
			 * because the EVM has no notion of checksum casing, while the author's script
			 * quotes the checksummed spelling their explorer showed them. Comparing those two
			 * strings with `===` fails, so a guard would report "not satisfied" and re-send an
			 * upgrade that already happened, which is the double-execution loss the guard
			 * exists to prevent.
			 */
			const {env, storage, proxy} = await setup();
			storage.setWord(
				PROXY_ADDRESS,
				EIP1967_IMPLEMENTATION_SLOT,
				word(NEXT_IMPLEMENTATION.toLowerCase() as `0x${string}`),
			);

			const evaluation = await evaluateGuard(env)({
				kind: 'storage',
				on: proxy,
				slot: EIP1967_IMPLEMENTATION_SLOT,
				as: 'address',
				// the CHECKSUMMED spelling, against a lowercase word
				equals: NEXT_IMPLEMENTATION,
			});

			expect(evaluation.satisfied).toBe(true);
		});

		it('decodes a bytes32, a uint256 and a bool', async () => {
			/**
			 * Example: the rest of the closed set. A `bytes32` is the word itself (a role
			 * identifier, a salt, a merkle root), a `uint256` is the number it encodes, and a
			 * `bool` is a flag such as "initialised" or "paused".
			 */
			const {env, storage, proxy} = await setup();
			const root = ('0x' + 'ab'.repeat(32)) as `0x${string}`;
			storage.setWord(PROXY_ADDRESS, SOME_SLOT, root);

			const asBytes32 = await evaluateGuard(env)({
				kind: 'storage',
				on: proxy,
				slot: SOME_SLOT,
				as: 'bytes32',
				// a hex word's casing carries no meaning either, so this folds too
				equals: ('0x' + 'AB'.repeat(32)) as `0x${string}`,
			});
			expect(asBytes32.value).toBe(root);
			expect(asBytes32.satisfied).toBe(true);

			storage.set(PROXY_ADDRESS, SOME_SLOT, 42n);
			const asUint = await evaluateGuard(env)({
				kind: 'storage',
				on: proxy,
				slot: SOME_SLOT,
				as: 'uint256',
				equals: 42n,
			});
			expect(asUint.value).toBe(42n);
			expect(asUint.satisfied).toBe(true);

			storage.set(PROXY_ADDRESS, SOME_SLOT, true);
			const asBool = await evaluateGuard(env)({
				kind: 'storage',
				on: proxy,
				slot: SOME_SLOT,
				as: 'bool',
				satisfied: (initialised) => initialised,
			});
			expect(asBool.value).toBe(true);
			expect(asBool.satisfied).toBe(true);
		});

		it('reads an EMPTY slot as the zero value of the declared interpretation', async () => {
			/**
			 * Example: the ordinary "not done yet" state. A slot that was never written reads
			 * as a zero word, which is the zero address, `false` or `0n` depending on how the
			 * guard declared it. Nothing special happens: the guard is simply not satisfied.
			 */
			const {env, proxy} = await setup();

			const evaluation = await evaluateGuard(env)({
				kind: 'storage',
				on: proxy,
				slot: EIP1967_IMPLEMENTATION_SLOT,
				as: 'address',
				equals: NEXT_IMPLEMENTATION,
			});

			expect(evaluation.value).toBe(ZERO_ADDRESS);
			expect(evaluation.satisfied).toBe(false);
		});

		it('REFUSES a word that does not fit the declared interpretation, rather than guessing', async () => {
			/**
			 * Example: a `bool` guard pointed at a slot holding `2`. Solidity writes 0 or 1, so
			 * a word that is neither means the declaration is wrong, most often because the
			 * slot is PACKED and holds several variables, which a whole-word interpretation
			 * cannot read. Answering `true` because the word is non-zero would be a guess, and
			 * a guard that cannot produce a verdict must fail the run rather than be mistaken
			 * for "not satisfied" (ADR 0013).
			 */
			const {env, storage, proxy} = await setup();
			storage.setWord(PROXY_ADDRESS, SOME_SLOT, word(2n));

			await expect(
				evaluateGuard(env)({
					kind: 'storage',
					on: proxy,
					slot: SOME_SLOT,
					as: 'bool',
					equals: true,
				}),
			).rejects.toThrow(/bool/i);
		});
	});

	describe('The evaluation record', () => {
		it('carries the slot, the raw word and the decoded value, on both paths', async () => {
			/**
			 * Example: a skipped step has no transaction and no receipt to point at, so the
			 * evaluation is the only evidence of why nothing happened. For a slot read that
			 * means all three of: which slot was read and on which contract, the raw 32-byte
			 * word that came back, and what that word was decoded to, since the word alone is
			 * not what the author wrote in their script.
			 */
			const {env, storage, proxy, proxyAdmin} = await setup();
			storage.set(PROXY_ADDRESS, EIP1967_IMPLEMENTATION_SLOT, CURRENT_IMPLEMENTATION);

			const guard = {
				kind: 'storage' as const,
				on: proxy,
				slot: EIP1967_IMPLEMENTATION_SLOT,
				as: 'address' as const,
				equals: NEXT_IMPLEMENTATION,
			};

			const sent = await execute(env)(proxyAdmin, {
				account: 'governance',
				functionName: 'upgradeAndCall',
				args: [PROXY_ADDRESS, NEXT_IMPLEMENTATION, '0x'],
				guard,
			});
			expect(sent.outcome).toBe('sent');
			expect(sent.evaluation).toEqual({
				kind: 'storage',
				target: PROXY_ADDRESS,
				slot: EIP1967_IMPLEMENTATION_SLOT,
				word: word(CURRENT_IMPLEMENTATION),
				as: 'address',
				value: getAddress(CURRENT_IMPLEMENTATION),
				expected: NEXT_IMPLEMENTATION,
				satisfied: false,
			});

			storage.set(PROXY_ADDRESS, EIP1967_IMPLEMENTATION_SLOT, NEXT_IMPLEMENTATION);
			const skipped = await execute(env)(proxyAdmin, {
				account: 'governance',
				functionName: 'upgradeAndCall',
				args: [PROXY_ADDRESS, NEXT_IMPLEMENTATION, '0x'],
				guard,
			});
			expect(skipped.outcome).toBe('skipped');
			expect(skipped.evaluation).toEqual({
				kind: 'storage',
				target: PROXY_ADDRESS,
				slot: EIP1967_IMPLEMENTATION_SLOT,
				word: word(NEXT_IMPLEMENTATION),
				as: 'address',
				value: NEXT_IMPLEMENTATION,
				expected: NEXT_IMPLEMENTATION,
				satisfied: true,
			});
		});

		it('omits `expected` when the verdict is a predicate, so the record claims nothing it was not given', async () => {
			const {env, storage, proxy} = await setup();
			storage.set(PROXY_ADDRESS, SOME_SLOT, 7n);

			const evaluation = await evaluateGuard(env)({
				kind: 'storage',
				on: proxy,
				slot: SOME_SLOT,
				as: 'uint256',
				satisfied: (version) => version >= 7n,
			});

			expect(evaluation).toEqual({
				kind: 'storage',
				target: PROXY_ADDRESS,
				slot: SOME_SLOT,
				word: word(7n),
				as: 'uint256',
				value: 7n,
				satisfied: true,
			});
			expect('expected' in evaluation).toBe(false);
		});
	});

	describe('The target', () => {
		it('defaults to the contract being executed when the guard names none', async () => {
			/**
			 * Example: a contract whose own privileged call lands in its own storage, an
			 * `initialised` flag or a version counter. The guard names no `on`, so it reads
			 * the contract being executed. It is the minority case here (the effect of a
			 * privileged call is usually observable elsewhere), but it is the same defaulting
			 * rule the call kind uses.
			 */
			const {env, provider, storage, registry} = await setup();
			storage.set(REGISTRY_ADDRESS, SOME_SLOT, true);

			const result = await execute(env)(registry, {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [NEXT_IMPLEMENTATION],
				guard: {
					kind: 'storage',
					slot: SOME_SLOT,
					as: 'bool',
					equals: true,
				},
			});

			expect(result.outcome).toBe('skipped');
			expect((storageReads(provider)[0].params as unknown[])[0]).toBe(REGISTRY_ADDRESS);
			expect(broadcasts(provider)).toHaveLength(0);
		});

		it('is evaluable standalone, and refuses to guess a target when there is none', async () => {
			/**
			 * Example: what a later collector needs, to compute the set of still-pending
			 * privileged actions without executing any of them. With no `on` and no default
			 * target there is nothing to read, and that is an error rather than a guess.
			 */
			const {env, storage, proxy} = await setup();
			storage.set(PROXY_ADDRESS, EIP1967_IMPLEMENTATION_SLOT, NEXT_IMPLEMENTATION);

			const evaluation = await evaluateGuard(env)(
				{
					kind: 'storage',
					slot: EIP1967_IMPLEMENTATION_SLOT,
					as: 'address',
					equals: NEXT_IMPLEMENTATION,
				},
				proxy,
			);
			expect(evaluation.satisfied).toBe(true);
			expect(evaluation.target).toBe(PROXY_ADDRESS);

			await expect(
				evaluateGuard(env)({
					kind: 'storage',
					slot: EIP1967_IMPLEMENTATION_SLOT,
					as: 'address',
					equals: NEXT_IMPLEMENTATION,
				}),
			).rejects.toThrow(/no target/i);
		});
	});
});

// ============================================================================
// Type-level assertions
//
// These are enforced by `pnpm typecheck`, which type-checks `test/` alongside `src/`
// (see CONTEXT.md, "Tests are type-checked and formatted, same as src"). They are never
// CALLED: their whole content is the compile-time claim.
// ============================================================================

type IsExactly<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/**
 * The DECLARED interpretation types the decoded value, both where the verdict judges it
 * and where the evaluation reports it. That is the second job the declaration does: a
 * slot has no ABI to supply the type, so the guard supplies it.
 */
async function _pinTheInterpretationTypesTheValue(
	env: Environment,
	proxyAdmin: MinimalDeployment<typeof PROXY_ADMIN_ABI>,
	proxy: MinimalDeployment<typeof PROXY_ABI>,
) {
	const asAddress = await execute(env)(proxyAdmin, {
		account: 'governance',
		functionName: 'upgradeAndCall',
		args: [PROXY_ADDRESS, NEXT_IMPLEMENTATION, '0x'],
		guard: {
			kind: 'storage',
			on: proxy,
			slot: EIP1967_IMPLEMENTATION_SLOT,
			as: 'address',
			satisfied: (implementation) => {
				const _pinAddress: IsExactly<typeof implementation, `0x${string}`> = true;
				return _pinAddress;
			},
		},
	});
	const _pinEvaluated: IsExactly<typeof asAddress.evaluation.value, `0x${string}`> = true;

	await execute(env)(proxyAdmin, {
		account: 'governance',
		functionName: 'upgradeAndCall',
		args: [PROXY_ADDRESS, NEXT_IMPLEMENTATION, '0x'],
		guard: {
			kind: 'storage',
			on: proxy,
			slot: SOME_SLOT,
			as: 'uint256',
			satisfied: (version) => {
				const _pinBigint: IsExactly<typeof version, bigint> = true;
				return _pinBigint;
			},
		},
	});

	await execute(env)(proxyAdmin, {
		account: 'governance',
		functionName: 'upgradeAndCall',
		args: [PROXY_ADDRESS, NEXT_IMPLEMENTATION, '0x'],
		guard: {
			kind: 'storage',
			on: proxy,
			slot: SOME_SLOT,
			as: 'bool',
			satisfied: (initialised) => {
				const _pinBoolean: IsExactly<typeof initialised, boolean> = true;
				return _pinBoolean;
			},
		},
	});

	return _pinEvaluated;
}

/**
 * The interpretation is a CLOSED set, and it is NOT optional: a slot carries no ABI, so
 * there is nothing to fall back to and nothing to guess. A fifth member can be added
 * later without breaking anything, but an open string cannot be accepted.
 */
async function _pinTheInterpretationIsClosedAndRequired(
	env: Environment,
	proxyAdmin: MinimalDeployment<typeof PROXY_ADMIN_ABI>,
	proxy: MinimalDeployment<typeof PROXY_ABI>,
) {
	await execute(env)(proxyAdmin, {
		account: 'governance',
		functionName: 'upgradeAndCall',
		args: [PROXY_ADDRESS, NEXT_IMPLEMENTATION, '0x'],
		// @ts-expect-error `uint128` is not one of the four declared interpretations
		guard: {kind: 'storage', on: proxy, slot: SOME_SLOT, as: 'uint128', equals: 1n},
	});

	await execute(env)(proxyAdmin, {
		account: 'governance',
		functionName: 'upgradeAndCall',
		args: [PROXY_ADDRESS, NEXT_IMPLEMENTATION, '0x'],
		// @ts-expect-error a storage guard that does not say how to read the word is refused
		guard: {kind: 'storage', on: proxy, slot: SOME_SLOT, equals: NEXT_IMPLEMENTATION},
	});

	await execute(env)(proxyAdmin, {
		account: 'governance',
		functionName: 'upgradeAndCall',
		args: [PROXY_ADDRESS, NEXT_IMPLEMENTATION, '0x'],
		// @ts-expect-error and one that names no slot has nothing to read
		guard: {kind: 'storage', on: proxy, as: 'address', equals: NEXT_IMPLEMENTATION},
	});
}

/**
 * `equals` is typed by the declared interpretation, so a `uint256` slot cannot be compared
 * against a number: a bigint never coerces against one, and the guard would silently
 * report "not satisfied" for ever.
 */
async function _pinEqualsIsTypedByTheInterpretation(
	env: Environment,
	proxyAdmin: MinimalDeployment<typeof PROXY_ADMIN_ABI>,
	proxy: MinimalDeployment<typeof PROXY_ABI>,
) {
	await execute(env)(proxyAdmin, {
		account: 'governance',
		functionName: 'upgradeAndCall',
		args: [PROXY_ADDRESS, NEXT_IMPLEMENTATION, '0x'],
		// @ts-expect-error a `uint256` word decodes to a bigint, not to a number
		guard: {kind: 'storage', on: proxy, slot: SOME_SLOT, as: 'uint256', equals: 42},
	});

	await execute(env)(proxyAdmin, {
		account: 'governance',
		functionName: 'upgradeAndCall',
		args: [PROXY_ADDRESS, NEXT_IMPLEMENTATION, '0x'],
		// @ts-expect-error a slot declares no outputs, so there is nothing to select
		guard: {kind: 'storage', on: proxy, slot: SOME_SLOT, as: 'uint256', output: 0, equals: 42n},
	});
}

/**
 * A guard that MIGHT be there cannot have a return type decided at compile time, exactly
 * as for the call kind: the storage member does not reopen that hole.
 */
async function _pinAPossiblyAbsentStorageGuardIsRefused(
	env: Environment,
	proxyAdmin: MinimalDeployment<typeof PROXY_ADMIN_ABI>,
	maybeGuard: StorageGuard<typeof PROXY_ABI, 'address'> | undefined,
) {
	await execute(env)(proxyAdmin, {
		account: 'governance',
		functionName: 'upgradeAndCall',
		args: [PROXY_ADDRESS, NEXT_IMPLEMENTATION, '0x'],
		// @ts-expect-error no call signature matches: `guard` is present-or-not
		guard: maybeGuard,
	});
}
