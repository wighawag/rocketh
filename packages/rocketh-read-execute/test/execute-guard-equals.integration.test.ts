/**
 * Integration tests for @rocketh/read-execute - `equals`, output selection, and the
 * comparison rule keyed off the ABI TYPE.
 *
 * `satisfied` stays the primary form (`docs/adr/0013-the-execute-guard-is-a-declared-read.md`),
 * because real topologies include conditions no equality can state. But the commonest
 * guard by far is "the value on chain is already the value I want", and writing that as a
 * predicate makes the author spell out a comparison that rocketh can do better than they
 * can: the read is DECLARED against a typed ABI, so the comparison can be keyed off what
 * the value MEANS rather than off what JavaScript's `===` does with it.
 *
 * The rule, from ADR 0013:
 *
 * - `address` and `bytesN` fold case (a checksummed address and a lowercased one are the
 *   SAME address; the casing of a hex word carries no meaning)
 * - `string` does NOT (it is user data, where two names differing in case are two names)
 * - a bigint never coerces against a number
 * - arrays and tuples compare elementwise under the same per-type rule
 *
 * Keying off the ABI type is the whole point: an `address`, a `bytes32` and a Solidity
 * `string` all arrive as a JavaScript string, so an implementation keyed off `typeof`
 * cannot tell them apart and is guaranteed to be wrong for one of them.
 *
 * These tests run against `createTestEnvironment`, a REAL rocketh environment wired to a
 * mock EIP-1193 provider, which is not an EVM: every guard test cans its own `eth_call`
 * answer, ABI-encoded exactly as a node would return it.
 */

import {describe, it, expect} from 'vitest';
import {execute, evaluateGuard} from '../src/index.js';
import {valuesEqualForAbiType} from '../src/abi-comparison.js';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';
import type {Environment, MinimalDeployment} from '@rocketh/core/types';
import type {Abi, AbiParameter} from 'abitype';
import {encodeAbiParameters} from 'viem';

const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;
const REGISTRY_ADDRESS = ('0x' + 'a'.repeat(40)) as `0x${string}`;
const ACCESS_MANAGER_ADDRESS = ('0x' + 'b'.repeat(40)) as `0x${string}`;
const TOKEN_ADDRESS = ('0x' + 'e'.repeat(40)) as `0x${string}`;

/**
 * A real address with letters in it, in both spellings. viem's decoder always returns the
 * CHECKSUMMED form, whatever the node sent, which is precisely why an author's lowercased
 * constant has to match it.
 */
const IMPLEMENTATION_CHECKSUMMED = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`;
const IMPLEMENTATION_LOWERCASE = IMPLEMENTATION_CHECKSUMMED.toLowerCase() as `0x${string}`;

/** OZ `AccessControl` role identifiers are `keccak256("...")`, quoted in either casing. */
const ADMIN_ROLE_LOWERCASE = ('0x' + 'ab'.repeat(32)) as `0x${string}`;
const ADMIN_ROLE_UPPERCASE = ('0x' + 'AB'.repeat(32)) as `0x${string}`;

/** The contract being CALLED, an Aave-V3-shaped registry that owns the proxies it configures. */
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
	{
		type: 'function',
		name: 'getFlashBorrowers',
		inputs: [],
		outputs: [{type: 'address[]'}],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'getReserveConfig',
		inputs: [],
		outputs: [
			{
				type: 'tuple',
				components: [
					{type: 'address', name: 'treasury'},
					{type: 'string', name: 'label'},
					{type: 'uint256', name: 'cap'},
				],
			},
		],
		stateMutability: 'view',
	},
] as const satisfies Abi;

/**
 * The TUPLE topology, and the reason output selection exists.
 *
 * `hasRole(uint64 roleId, address account) returns (bool isMember, uint32 executionDelay)`,
 * read from OpenZeppelin's `contracts/access/manager/AccessManager.sol` at
 * `OpenZeppelin/openzeppelin-contracts@master` (header: last updated v5.7.0), 2026-08-27.
 * The return carries membership AND the execution delay that turns a call into a
 * schedule-then-execute, so asserting the whole return would force the author to also
 * state a delay they do not care about.
 */
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

/** An ERC20 that is also an OZ `AccessControl`, which is where the `string` / `bytes32` / `uint256` cases live. */
const TOKEN_ABI = [
	{
		type: 'function',
		name: 'symbol',
		inputs: [],
		outputs: [{type: 'string'}],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'totalSupply',
		inputs: [],
		outputs: [{type: 'uint256'}],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'getRoleAdmin',
		inputs: [{type: 'bytes32', name: 'role'}],
		outputs: [{type: 'bytes32'}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

const OPERATOR_ROLE = 42n;
const OPERATOR = ('0x' + 'f'.repeat(40)) as `0x${string}`;

/** ABI-encode a return value exactly as a node would put it on the wire. */
function returns(params: readonly AbiParameter[], values: readonly unknown[]): `0x${string}` {
	return encodeAbiParameters(params as never, values as never);
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
	const accessManager = await env.save('AccessManager', {
		address: ACCESS_MANAGER_ADDRESS,
		...createMockArtifact('AccessManager', ACCESS_MANAGER_ABI),
		argsData: '0x',
	});
	const token = await env.save('Token', {
		address: TOKEN_ADDRESS,
		...createMockArtifact('Token', TOKEN_ABI),
		argsData: '0x',
	});
	return {env, provider, registry, accessManager, token};
}

function broadcasts(provider: {getRequests: () => Array<{method: string}>}) {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendTransaction' || r.method === 'eth_sendRawTransaction');
}

describe('@rocketh/read-execute - the execute guard: equals and output selection', () => {
	describe('equals, sugar over satisfied', () => {
		it('SKIPS the call when the value read equals the value given', async () => {
			/**
			 * Example: the commonest guard there is, written as one line. The registry already
			 * points at the implementation this call would set, so the call is not needed.
			 */
			const {env, provider, registry} = await setup();

			provider.setResponse('eth_call', returns([{type: 'address'}], [IMPLEMENTATION_CHECKSUMMED]));

			const result = await execute(env)(registry, {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [IMPLEMENTATION_CHECKSUMMED],
				guard: {
					kind: 'call',
					functionName: 'getPoolImpl',
					equals: IMPLEMENTATION_CHECKSUMMED,
				},
			});

			expect(result.outcome).toBe('skipped');
			expect(broadcasts(provider)).toHaveLength(0);
		});

		it('EXECUTES when it does not', async () => {
			const {env, provider, registry} = await setup();

			provider.setResponse('eth_call', returns([{type: 'address'}], [('0x' + '1'.repeat(40)) as `0x${string}`]));

			const result = await execute(env)(registry, {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [IMPLEMENTATION_CHECKSUMMED],
				guard: {
					kind: 'call',
					functionName: 'getPoolImpl',
					equals: IMPLEMENTATION_CHECKSUMMED,
				},
			});

			expect(result.outcome).toBe('sent');
			expect(broadcasts(provider)).toHaveLength(1);
		});
	});

	describe('the comparison rule, keyed off the ABI type', () => {
		it('matches an address across checksum casing, in BOTH directions', async () => {
			/**
			 * Example: the failure this rule exists to prevent. An address that came back from a
			 * node and an address that came out of a deployment record routinely differ by
			 * checksum casing alone; `@rocketh/proxy` lowercases both sides before comparing an
			 * implementation address for exactly that reason. A guard that got this wrong would
			 * re-send an upgrade that already happened, which is the double-execution loss the
			 * guard exists to prevent (ADR 0012).
			 *
			 * Through a `call` guard only ONE direction is reachable, because viem's decoder
			 * always returns the CHECKSUMMED form whatever the node sent: the author's
			 * lowercased constant against a checksummed read. The other direction is pinned
			 * directly against the comparison below, since it IS reachable from a raw word (the
			 * `storage` kind decodes one itself) and a rule that folded only one side would be
			 * a rule that folded nothing.
			 */
			const {env, provider, registry} = await setup();

			provider.setResponse('eth_call', returns([{type: 'address'}], [IMPLEMENTATION_CHECKSUMMED]));

			const result = await execute(env)(registry, {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [IMPLEMENTATION_CHECKSUMMED],
				guard: {
					kind: 'call',
					functionName: 'getPoolImpl',
					// the author quotes the address in lowercase, the chain answers checksummed
					equals: IMPLEMENTATION_LOWERCASE,
				},
			});

			expect(result.outcome).toBe('skipped');
			expect(broadcasts(provider)).toHaveLength(0);

			const addressParam = {type: 'address'} as const satisfies AbiParameter;
			// lowercase read, checksummed expected
			expect(valuesEqualForAbiType(addressParam, IMPLEMENTATION_LOWERCASE, IMPLEMENTATION_CHECKSUMMED)).toBe(true);
			// checksummed read, lowercase expected
			expect(valuesEqualForAbiType(addressParam, IMPLEMENTATION_CHECKSUMMED, IMPLEMENTATION_LOWERCASE)).toBe(true);
			// still two DIFFERENT addresses are two different addresses
			expect(
				valuesEqualForAbiType(addressParam, IMPLEMENTATION_CHECKSUMMED, ('0x' + '1'.repeat(40)) as `0x${string}`),
			).toBe(false);
		});

		it('matches an upper-case bytes32 role identifier against a lower-case read value', async () => {
			/**
			 * Example: role identifiers, salts and operation ids are `bytes32`, i.e. hex words
			 * whose casing carries no meaning at all. A node hands them back lowercased; an
			 * author may well have pasted one from a block explorer in upper case.
			 */
			const {env, provider, registry, token} = await setup();

			provider.setResponse('eth_call', returns([{type: 'bytes32'}], [ADMIN_ROLE_LOWERCASE]));

			const result = await execute(env)(registry, {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [IMPLEMENTATION_CHECKSUMMED],
				guard: {
					kind: 'call',
					on: token,
					functionName: 'getRoleAdmin',
					args: [ADMIN_ROLE_UPPERCASE],
					equals: ADMIN_ROLE_UPPERCASE,
				},
			});

			expect(result.outcome).toBe('skipped');
			expect(broadcasts(provider)).toHaveLength(0);
		});

		it('does NOT match two strings differing only in case', async () => {
			/**
			 * Example: the assertion a naive "lowercase everything" implementation passes
			 * WRONGLY. A Solidity `string` is user data, so `Rocketh` and `rocketh` are two
			 * different symbols and the call is still needed. Note that the value arrives as a
			 * JavaScript string here exactly as the address and the `bytes32` above did: only
			 * the ABI type tells them apart.
			 */
			const {env, provider, registry, token} = await setup();

			provider.setResponse('eth_call', returns([{type: 'string'}], ['Rocketh']));

			const result = await execute(env)(registry, {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [IMPLEMENTATION_CHECKSUMMED],
				guard: {
					kind: 'call',
					on: token,
					functionName: 'symbol',
					equals: 'rocketh',
				},
			});

			expect(result.outcome).toBe('sent');
			expect(broadcasts(provider)).toHaveLength(1);
		});

		it('does NOT match a bigint against a number of the same magnitude', async () => {
			/**
			 * Example: a `uint256` decodes to a bigint, and `42n` is not `42`. The type already
			 * refuses the number, so this pins the RUNTIME behaviour for a caller who defeated
			 * the type (a value read from JSON, an `any` at the call site): the guard reports
			 * "not satisfied" rather than coercing, because a guard that coerced would be
			 * deciding what the author meant.
			 */
			const {env, provider, token} = await setup();

			provider.setResponse('eth_call', returns([{type: 'uint256'}], [42n]));

			const evaluation = await evaluateGuard(env)({
				kind: 'call',
				on: token,
				functionName: 'totalSupply',
				equals: 42 as unknown as bigint,
			});

			expect(evaluation.value).toBe(42n);
			expect(evaluation.satisfied).toBe(false);
		});

		it('compares a multi-output return elementwise, under the per-type rule', async () => {
			/**
			 * Example: a function with SEVERAL outputs decodes to an array (viem unwraps only a
			 * single output), so `equals` compares it position by position, each position under
			 * the rule for ITS OWN ABI type.
			 */
			const {env, provider, accessManager} = await setup();

			provider.setResponse('eth_call', returns([{type: 'bool'}, {type: 'uint32'}], [true, 0]));

			const _evaluate = evaluateGuard(env);
			const guard = {
				kind: 'call',
				on: accessManager,
				functionName: 'hasRole',
				args: [OPERATOR_ROLE, OPERATOR],
			} as const;

			expect((await _evaluate({...guard, equals: [true, 0]})).satisfied).toBe(true);
			expect((await _evaluate({...guard, equals: [true, 3600]})).satisfied).toBe(false);
			expect((await _evaluate({...guard, equals: [false, 0]})).satisfied).toBe(false);
		});

		it('compares an ARRAY return deeply, folding case per ELEMENT', async () => {
			/**
			 * Example: an `address[]` is a single output, so viem hands it over unwrapped, and
			 * the per-type rule applies to each ELEMENT rather than to the array. The author's
			 * lowercased list therefore matches the checksummed one the decoder produced, which
			 * a `JSON.stringify` or an `every(===)` comparison would not.
			 */
			const {env, provider, registry} = await setup();

			const others = [('0x' + '1'.repeat(40)) as `0x${string}`, ('0x' + '2'.repeat(40)) as `0x${string}`];
			provider.setResponse('eth_call', returns([{type: 'address[]'}], [[IMPLEMENTATION_CHECKSUMMED, ...others]]));

			const _evaluate = evaluateGuard(env);
			const guard = {kind: 'call', on: registry, functionName: 'getFlashBorrowers'} as const;

			expect((await _evaluate({...guard, equals: [IMPLEMENTATION_LOWERCASE, ...others]})).satisfied).toBe(true);
			// a DIFFERENT member, and a shorter list, are both still different
			expect((await _evaluate({...guard, equals: [IMPLEMENTATION_LOWERCASE, others[0], others[0]]})).satisfied).toBe(
				false,
			);
			expect((await _evaluate({...guard, equals: [IMPLEMENTATION_LOWERCASE, others[0]]})).satisfied).toBe(false);
		});

		it('compares a STRUCT return deeply, each component under its OWN rule', async () => {
			/**
			 * Example: the case that proves the rule is per-COMPONENT and not per-value. A struct
			 * carrying an `address`, a `string` and a `uint256` decodes to an object whose three
			 * fields are two JavaScript strings and a bigint, and each one is judged by the ABI
			 * type declared for it: the treasury folds case, the label does not.
			 */
			const {env, provider, registry} = await setup();

			const config = {
				type: 'tuple',
				components: [
					{type: 'address', name: 'treasury'},
					{type: 'string', name: 'label'},
					{type: 'uint256', name: 'cap'},
				],
			} as const satisfies AbiParameter;
			provider.setResponse('eth_call', returns([config], [[IMPLEMENTATION_CHECKSUMMED, 'Main', 1000n]]));

			const _evaluate = evaluateGuard(env);
			const guard = {kind: 'call', on: registry, functionName: 'getReserveConfig'} as const;

			// the address folds
			expect(
				(await _evaluate({...guard, equals: {treasury: IMPLEMENTATION_LOWERCASE, label: 'Main', cap: 1000n}}))
					.satisfied,
			).toBe(true);
			// the label does NOT
			expect(
				(await _evaluate({...guard, equals: {treasury: IMPLEMENTATION_LOWERCASE, label: 'main', cap: 1000n}}))
					.satisfied,
			).toBe(false);
			// and the bigint still does not coerce
			expect(
				(
					await _evaluate({
						...guard,
						equals: {treasury: IMPLEMENTATION_LOWERCASE, label: 'Main', cap: 1000 as unknown as bigint},
					})
				).satisfied,
			).toBe(false);
		});
	});

	describe('selecting one output', () => {
		it('selects by NAME, and that is what equals compares', async () => {
			/**
			 * Example: the topology the spec was validated against. `hasRole` answers two
			 * questions at once, membership and the execution delay, and this guard only asks
			 * the first. Asserting the whole return would force the author to also state a
			 * delay they neither know nor care about.
			 */
			const {env, provider, registry, accessManager} = await setup();

			provider.setResponse('eth_call', returns([{type: 'bool'}, {type: 'uint32'}], [true, 3600]));

			const result = await execute(env)(registry, {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [IMPLEMENTATION_CHECKSUMMED],
				guard: {
					kind: 'call',
					on: accessManager,
					functionName: 'hasRole',
					args: [OPERATOR_ROLE, OPERATOR],
					output: 'isMember',
					equals: true,
				},
			});

			// the delay is 3600, and it is irrelevant: only membership was asserted
			expect(result.outcome).toBe('skipped');
			expect(broadcasts(provider)).toHaveLength(0);
		});

		it('selects by POSITION as well', async () => {
			const {env, provider, accessManager} = await setup();

			provider.setResponse('eth_call', returns([{type: 'bool'}, {type: 'uint32'}], [true, 3600]));

			const evaluation = await evaluateGuard(env)({
				kind: 'call',
				on: accessManager,
				functionName: 'hasRole',
				args: [OPERATOR_ROLE, OPERATOR],
				output: 1,
				equals: 3600,
			});

			expect(evaluation.satisfied).toBe(true);
			expect(evaluation.selected).toBe(3600);
		});

		it('gives the SELECTED value to `satisfied` too, not just to `equals`', async () => {
			/**
			 * Example: selection is not a feature of `equals`, it is a feature of the guard. A
			 * predicate that needs a component gets the component, so it does not have to
			 * destructure the return itself.
			 */
			const {env, provider, accessManager} = await setup();

			provider.setResponse('eth_call', returns([{type: 'bool'}, {type: 'uint32'}], [true, 3600]));

			const evaluation = await evaluateGuard(env)({
				kind: 'call',
				on: accessManager,
				functionName: 'hasRole',
				args: [OPERATOR_ROLE, OPERATOR],
				output: 'executionDelay',
				// the call needs scheduling ahead of time unless the delay is already gone
				satisfied: (delay) => delay === 0,
			});

			expect(evaluation.selected).toBe(3600);
			expect(evaluation.satisfied).toBe(false);
		});

		it('accepts a selection on a SINGLE-output function, where it is the identity', async () => {
			/**
			 * Selection is only MEANINGFUL when there are several outputs, because viem unwraps
			 * a single one before the guard ever sees it. Naming that single output is
			 * nevertheless accepted and selects the same value, so an author who spells out
			 * what they are asserting is not punished for it.
			 */
			const {env, provider, registry} = await setup();

			provider.setResponse('eth_call', returns([{type: 'address'}], [IMPLEMENTATION_CHECKSUMMED]));

			const evaluation = await evaluateGuard(env)(
				{
					kind: 'call',
					functionName: 'getPoolImpl',
					output: 0,
					equals: IMPLEMENTATION_LOWERCASE,
				},
				registry,
			);

			expect(evaluation.satisfied).toBe(true);
			expect(evaluation.selected).toBe(IMPLEMENTATION_CHECKSUMMED);
		});
	});

	describe('the evaluation record', () => {
		it('reports the whole value read, the selected value, and what it was compared against', async () => {
			/**
			 * Example: a skipped step must be legible. A user reading "skipped" has to be able
			 * to see all three: what came back, which part of it was asserted, and what it was
			 * held against.
			 */
			const {env, provider, registry, accessManager} = await setup();

			provider.setResponse('eth_call', returns([{type: 'bool'}, {type: 'uint32'}], [true, 3600]));

			const result = await execute(env)(registry, {
				account: 'governance',
				functionName: 'setPoolImpl',
				args: [IMPLEMENTATION_CHECKSUMMED],
				guard: {
					kind: 'call',
					on: accessManager,
					functionName: 'hasRole',
					args: [OPERATOR_ROLE, OPERATOR],
					output: 'isMember',
					equals: true,
				},
			});

			expect(result.evaluation).toEqual({
				kind: 'call',
				target: ACCESS_MANAGER_ADDRESS,
				functionName: 'hasRole',
				args: [OPERATOR_ROLE, OPERATOR],
				value: [true, 3600],
				output: 'isMember',
				selected: true,
				expected: true,
				satisfied: true,
			});
		});

		it('reports no selection and no expected value when the guard used a bare predicate', async () => {
			const {env, provider, token} = await setup();

			provider.setResponse('eth_call', returns([{type: 'string'}], ['Rocketh']));

			const evaluation = await evaluateGuard(env)({
				kind: 'call',
				on: token,
				functionName: 'symbol',
				satisfied: (symbol) => symbol.startsWith('R'),
			});

			expect(evaluation).toEqual({
				kind: 'call',
				target: TOKEN_ADDRESS,
				functionName: 'symbol',
				args: [],
				value: 'Rocketh',
				satisfied: true,
			});
			expect('selected' in evaluation).toBe(false);
			expect('expected' in evaluation).toBe(false);
		});
	});
});

// ============================================================================
// Type-level assertions
//
// Enforced by `pnpm typecheck`, which type-checks `test/` alongside `src/`. They are
// never CALLED: their whole content is the compile-time claim.
// ============================================================================

type IsExactly<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/**
 * A selected output is typed against the read function's ABI OUTPUTS: the selected value's
 * type follows the selector, whether it was spelled as a name or as a position.
 */
async function _pinSelectedValueIsTypedFromTheAbi(
	env: Environment,
	accessManager: MinimalDeployment<typeof ACCESS_MANAGER_ABI>,
) {
	await evaluateGuard(env)({
		kind: 'call',
		on: accessManager,
		functionName: 'hasRole',
		args: [OPERATOR_ROLE, OPERATOR],
		output: 'executionDelay',
		satisfied: (delay) => {
			// uint32 -> number, not bigint, and not the whole tuple
			const _pin: IsExactly<typeof delay, number> = true;
			return _pin && delay === 0;
		},
	});

	await evaluateGuard(env)({
		kind: 'call',
		on: accessManager,
		functionName: 'hasRole',
		args: [OPERATOR_ROLE, OPERATOR],
		output: 0,
		satisfied: (isMember) => {
			const _pin: IsExactly<typeof isMember, boolean> = true;
			return _pin && isMember;
		},
	});
}

/** Naming an output that does not exist is a COMPILE error, not a runtime surprise. */
async function _pinAnUnknownOutputIsRefused(
	env: Environment,
	accessManager: MinimalDeployment<typeof ACCESS_MANAGER_ABI>,
) {
	await evaluateGuard(env)({
		kind: 'call',
		on: accessManager,
		functionName: 'hasRole',
		args: [OPERATOR_ROLE, OPERATOR],
		// @ts-expect-error `isMemebr` is not an output of `hasRole`
		output: 'isMemebr',
		equals: true,
	});

	await evaluateGuard(env)({
		kind: 'call',
		on: accessManager,
		functionName: 'hasRole',
		args: [OPERATOR_ROLE, OPERATOR],
		// @ts-expect-error `hasRole` declares two outputs, so there is no position 2
		output: 2,
		equals: true,
	});
}

/** `equals` is typed against the SELECTED value, so the wrong shape is refused. */
async function _pinEqualsIsTypedAgainstTheSelectedValue(
	env: Environment,
	accessManager: MinimalDeployment<typeof ACCESS_MANAGER_ABI>,
	token: MinimalDeployment<typeof TOKEN_ABI>,
) {
	// @ts-expect-error the execution delay is a uint32, not a bool
	await evaluateGuard(env)({
		kind: 'call',
		on: accessManager,
		functionName: 'hasRole',
		args: [OPERATOR_ROLE, OPERATOR],
		output: 'executionDelay',
		equals: true,
	});

	await evaluateGuard(env)({
		kind: 'call',
		on: token,
		functionName: 'totalSupply',
		// @ts-expect-error a uint256 decodes to a bigint, and a number never coerces against one
		equals: 42,
	});

	// with no selection, `equals` is the WHOLE decoded return: a tuple for several outputs
	await evaluateGuard(env)({
		kind: 'call',
		on: accessManager,
		functionName: 'hasRole',
		args: [OPERATOR_ROLE, OPERATOR],
		equals: [true, 0],
	});
}

/** `equals` and `satisfied` are two spellings of one verdict, so stating both is refused. */
async function _pinEqualsAndSatisfiedAreMutuallyExclusive(
	env: Environment,
	token: MinimalDeployment<typeof TOKEN_ABI>,
) {
	// @ts-expect-error a guard states its verdict once, as `equals` OR as `satisfied`
	await evaluateGuard(env)({
		kind: 'call',
		on: token,
		functionName: 'symbol',
		equals: 'ROC',
		satisfied: (symbol: string) => symbol === 'ROC',
	});
}
