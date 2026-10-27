/**
 * Integration tests for @rocketh/read-execute - unknown-signer contract enrichment.
 *
 * When a privileged call targets an account rocketh cannot sign for (the canonical
 * case: a proxy whose owner is a Safe), the seam at the broadcast choke point throws
 * an `UnknownSignerError`. These tests document the enrichment on top of that: a
 * throw that ORIGINATED from `execute` / `executeByName` carries
 * `contract: {name?, method, args, abi}`, so the printed message names the function the
 * user has to run on their Safe instead of only an address, and prints that function's ABI
 * as one JSON line for a Safe's Transaction Builder.
 *
 * They also fence the negative half: a plain `tx()`, a value transfer and a deploy
 * leave `contract` unset, because none of them has a function to name.
 *
 * These use `createTestEnvironment`, which builds a REAL rocketh environment (real
 * account resolution, real auto-impersonation, the real single `broadcastTransaction`
 * choke point) against a mock provider. They live HERE rather than in
 * `packages/rocketh/test/` because driving `execute` needs this package, and
 * `rocketh` must not depend on `@rocketh/test-utils` (that closes an nx
 * project-graph cycle).
 */

import {describe, it, expect, vi} from 'vitest';
import {execute, executeByName, tx} from '../src/index.js';
import {createTestEnvironment} from '@rocketh/test-utils';
import {UnknownSignerError} from '@rocketh/core';
import type {Abi} from 'abitype';
import type {MinimalDeployment, PartialDeployment} from '@rocketh/core/types';

/**
 * Every `named-logs` warning any package emits during this file, recorded. Installed with
 * `vi.hoisted` because `named-logs` binds each module's logger when the module LOADS, and the
 * imports above load first: this is what lets a test assert that a lookup did NOT warn, where a
 * spy on `console` would see nothing either way (no logger is hooked up in a test run).
 */
const warnings = vi.hoisted(() => {
	const recorded: string[] = [];
	(globalThis as {_logFactory?: unknown})._logFactory = (namespace: string) =>
		new Proxy(
			{},
			{
				get: (_target, method) =>
					method === 'warn'
						? (...args: unknown[]) => recorded.push(`${namespace}: ${args.map(String).join(' ')}`)
						: () => {},
			},
		);
	return recorded;
});

/** An address the mock node lists in `eth_accounts`, so it is signable. */
const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;
/** Stands in for the Safe/multisig owner: a named account the node does not hold. */
const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111' as `0x${string}`;

const PROXY_ADDRESS = ('0x' + 'a'.repeat(40)) as `0x${string}`;
const UNREGISTERED_ADDRESS = ('0x' + 'b'.repeat(40)) as `0x${string}`;
const NEW_IMPLEMENTATION = ('0x' + 'c'.repeat(40)) as `0x${string}`;

const PROXY_ABI = [
	{
		type: 'function',
		name: 'upgradeTo',
		inputs: [{type: 'address', name: 'newImplementation'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'setLimits',
		inputs: [{type: 'uint256[]', name: 'limits'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

/** Disjoint from {@link PROXY_ABI}, so both can be registered at one address. */
const IMPLEMENTATION_ABI = [
	{
		type: 'function',
		name: 'initialize',
		inputs: [{type: 'address', name: 'owner'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

/** Shared by a proxy's main record and its `_Proxy` record, so merging their ABIs conflicts. */
const OWNABLE_ABI = [
	{
		type: 'function',
		name: 'owner',
		inputs: [],
		outputs: [{type: 'address', name: ''}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

const OVERLOADED_ABI = [
	{
		type: 'function',
		name: 'setValue',
		inputs: [{type: 'uint256', name: 'value'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'setValue',
		inputs: [
			{type: 'uint256', name: 'value'},
			{type: 'string', name: 'label'},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

/**
 * A run where `safeOwner` is unsignable: the node does not list it in `eth_accounts`
 * and `autoImpersonate` is off, which is exactly the shape of story 8 in the spec.
 */
async function setup() {
	const {env, provider} = await createTestEnvironment({
		accounts: {deployer: NODE_ACCOUNT, safeOwner: SAFE_ADDRESS},
		nodeAccounts: [NODE_ACCOUNT],
		executionParams: {autoImpersonate: false},
	});
	return {env, provider};
}

async function saveProxy(env: Awaited<ReturnType<typeof setup>>['env'], name: string) {
	return env.save(name, {
		address: PROXY_ADDRESS,
		abi: PROXY_ABI,
		bytecode: '0x6080604052' as `0x${string}`,
		argsData: '0x' as `0x${string}`,
		metadata: '{}',
	});
}

/** Run `action`, expecting it to reject with an `UnknownSignerError`, and return it. */
async function expectUnknownSignerError(action: () => Promise<unknown>): Promise<UnknownSignerError> {
	const error = await action().then(
		() => undefined,
		(e) => e,
	);
	expect(error).toBeInstanceOf(UnknownSignerError);
	return error as UnknownSignerError;
}

describe('@rocketh/read-execute - UnknownSignerError contract enrichment', () => {
	it('carries {name, method, args} when the call came from execute', async () => {
		/**
		 * Example: a proxy owned by a Safe. The deployer cannot sign for the Safe, so the
		 * upgrade is surfaced instead of broadcast — and the surfaced error names the
		 * function to run: `Proxy.upgradeTo(0xcccc...)`.
		 */
		const {env} = await setup();
		const proxy = await saveProxy(env, 'Proxy');

		const error = await expectUnknownSignerError(() =>
			execute(env)(proxy, {
				account: 'safeOwner',
				functionName: 'upgradeTo',
				args: [NEW_IMPLEMENTATION],
			}),
		);

		expect(error.data.contract).toEqual({
			name: 'Proxy',
			method: 'upgradeTo',
			args: [NEW_IMPLEMENTATION],
			abi: [PROXY_ABI[0]],
		});
		expect(error.data.to?.toLowerCase()).toBe(PROXY_ADDRESS);
		expect(error.message).toContain(`Proxy.upgradeTo("${NEW_IMPLEMENTATION}")`);
	});

	it('carries the same payload through executeByName', async () => {
		const {env} = await setup();
		await saveProxy(env, 'Proxy');

		const error = await expectUnknownSignerError(() =>
			executeByName(env)('Proxy', {
				account: 'safeOwner',
				functionName: 'upgradeTo',
				args: [NEW_IMPLEMENTATION],
			}),
		);

		expect(error.data.contract).toEqual({
			name: 'Proxy',
			method: 'upgradeTo',
			args: [NEW_IMPLEMENTATION],
			abi: [PROXY_ABI[0]],
		});
	});

	it('renders nested bigint args without throwing', async () => {
		/**
		 * The args are carried VERBATIM, so a `uint256[]` argument reaches the message
		 * builder with nested bigints. Rendering the error must never throw — that would
		 * replace the very error the user needs with an opaque TypeError.
		 */
		const {env} = await setup();
		const proxy = await saveProxy(env, 'Proxy');

		const error = await expectUnknownSignerError(() =>
			execute(env)(proxy, {
				account: 'safeOwner',
				functionName: 'setLimits',
				args: [[1n, 2n]],
			}),
		);

		expect(error.data.contract).toEqual({name: 'Proxy', method: 'setLimits', args: [[1n, 2n]], abi: [PROXY_ABI[1]]});
		expect(error.message).toContain('Proxy.setLimits(');
	});

	it('leaves name absent when the target address matches no deployment', async () => {
		/**
		 * `name` is opportunistic enrichment resolved through the environment's existing
		 * `fromAddressToNamedABIOrNull`. `execute` accepts any `MinimalDeployment`
		 * (`{address, abi}`), so an address that was never saved has no name — and the
		 * message falls back to the `to` address.
		 */
		const {env} = await setup();
		const unregistered: MinimalDeployment<typeof PROXY_ABI> = {
			address: UNREGISTERED_ADDRESS,
			abi: PROXY_ABI,
		};

		const error = await expectUnknownSignerError(() =>
			execute(env)(unregistered, {
				account: 'safeOwner',
				functionName: 'upgradeTo',
				args: [NEW_IMPLEMENTATION],
			}),
		);

		// The ABI entry comes from the CALL SITE, so it is there even with no record to name.
		expect(error.data.contract).toEqual({method: 'upgradeTo', args: [NEW_IMPLEMENTATION], abi: [PROXY_ABI[0]]});
		expect(error.data.contract?.name).toBeUndefined();
		expect(error.message).toContain(`${UNREGISTERED_ADDRESS}.upgradeTo(`);
	});

	it('prefers the main record when several deployments share the address', async () => {
		// Several records can share an address (a proxy, its `_Proxy` record, an `_Implementation`
		//  record). The one shown is the main record: not suffixed `_Proxy` / `_Implementation`.
		const {env} = await setup();
		const proxy = await saveProxy(env, 'Proxy');
		await env.save('Proxy_Implementation', {
			address: PROXY_ADDRESS,
			abi: IMPLEMENTATION_ABI,
			bytecode: '0x6080604052' as `0x${string}`,
			argsData: '0x' as `0x${string}`,
			metadata: '{}',
		});

		const error = await expectUnknownSignerError(() =>
			execute(env)(proxy, {
				account: 'safeOwner',
				functionName: 'upgradeTo',
				args: [NEW_IMPLEMENTATION],
			}),
		);

		expect(error.data.contract?.name).toBe('Proxy');
	});

	it('names a record whose ABI conflicts with another one at the same address, without a warning', async () => {
		/**
		 * Two records at one address declaring the same selectors. `fromAddressToNamedABIOrNull`
		 * MERGES their ABIs and throws an `ABI conflict` here, which is why it is not what names
		 * the deployment: a NAME needs no merged ABI. The lookup the error uses merges nothing, so
		 * the address is named and nothing is logged.
		 */
		const {env} = await setup();
		const proxy = await saveProxy(env, 'Proxy');
		await saveProxy(env, 'ProxyClone'); // same address, same selectors: the merge conflicts
		expect(() => env.fromAddressToNamedABIOrNull(PROXY_ADDRESS)).toThrow(/ABI conflict/);
		warnings.length = 0;

		const error = await expectUnknownSignerError(() =>
			execute(env)(proxy, {
				account: 'safeOwner',
				functionName: 'upgradeTo',
				args: [NEW_IMPLEMENTATION],
			}),
		);

		expect(error.data.contract?.name).toBe('Proxy');
		expect(error.message).toContain(`Proxy.upgradeTo(`);
		expect(warnings).toEqual([]);
	});

	it('names a proxy after its main record, not its `_Proxy` record, and does not warn', async () => {
		/**
		 * Example: what `deployViaProxy` leaves at a proxy's address. The MAIN record
		 * (`GreetingsRegistry`, whose ABI merges the implementation's and the proxy's) and the
		 * `_Proxy` record (the proxy contract alone) share the address AND functions such as
		 * `owner()`. Merging those ABIs is an `ABI conflict`, which used to surface as a
		 * "could not resolve a deployment name" warning on every Safe-owned upgrade.
		 *
		 * The name shown is the main record's even when the `_Proxy` record was saved first:
		 * it is the name the user deployed under and the one their scripts use.
		 */
		const {env} = await setup();
		await env.save('GreetingsRegistry_Proxy', {
			address: PROXY_ADDRESS,
			abi: [...OWNABLE_ABI, ...PROXY_ABI],
			bytecode: '0x6080604052' as `0x${string}`,
			argsData: '0x' as `0x${string}`,
			metadata: '{}',
		});
		const main = await env.save('GreetingsRegistry', {
			address: PROXY_ADDRESS,
			abi: [...OWNABLE_ABI, ...PROXY_ABI, ...IMPLEMENTATION_ABI],
			bytecode: '0x6080604052' as `0x${string}`,
			argsData: '0x' as `0x${string}`,
			metadata: '{}',
		});
		expect(() => env.fromAddressToNamedABIOrNull(PROXY_ADDRESS)).toThrow(/ABI conflict/);
		warnings.length = 0;

		const error = await expectUnknownSignerError(() =>
			execute(env)(main, {
				account: 'safeOwner',
				functionName: 'upgradeTo',
				args: [NEW_IMPLEMENTATION],
			}),
		);

		expect(warnings).toEqual([]);
		expect(error.data.contract?.name).toBe('GreetingsRegistry');
		expect(error.message).toContain(`contract: GreetingsRegistry.upgradeTo("${NEW_IMPLEMENTATION}")`);
	});
});

describe("@rocketh/read-execute - the called function's ABI, ready for a Safe Transaction Builder", () => {
	it('prints the ABI of the one function called, as a single JSON line', async () => {
		/**
		 * Example: the line to paste into a Safe's Transaction Builder ("Enter ABI") when it
		 * cannot fetch the target's ABI itself. It is the ABI of THIS function only, taken from
		 * the deployment `execute` was given, so it does not depend on a lookup by address.
		 */
		const {env} = await setup();
		const proxy = await saveProxy(env, 'Proxy');

		const error = await expectUnknownSignerError(() =>
			execute(env)(proxy, {account: 'safeOwner', functionName: 'upgradeTo', args: [NEW_IMPLEMENTATION]}),
		);

		const lines = error.message.split('\n');
		const contractLine = lines.findIndex((line) => line.startsWith('  contract: '));
		expect(lines[contractLine + 1]).toBe(`  abi: ${JSON.stringify([PROXY_ABI[0]])}`);
		expect(JSON.parse(lines[contractLine + 1].slice('  abi: '.length))).toEqual([PROXY_ABI[0]]);
	});

	it('picks the overload that was actually called', async () => {
		/**
		 * `setValue(uint256)` and `setValue(uint256,string)`: the ABI line must describe the
		 * one encoded, or the Builder would decode the call against the wrong inputs. The entry
		 * is matched on the selector of the calldata `execute` produced.
		 */
		const {env} = await setup();
		const overloaded = await env.save('Overloaded', {
			address: PROXY_ADDRESS,
			abi: OVERLOADED_ABI,
			bytecode: '0x6080604052' as `0x${string}`,
			argsData: '0x' as `0x${string}`,
			metadata: '{}',
		});

		const one = await expectUnknownSignerError(() =>
			(execute(env) as any)(overloaded, {account: 'safeOwner', functionName: 'setValue', args: [1n]}),
		);
		const two = await expectUnknownSignerError(() =>
			(execute(env) as any)(overloaded, {account: 'safeOwner', functionName: 'setValue', args: [1n, 'one']}),
		);

		expect(one.data.contract?.abi).toEqual([OVERLOADED_ABI[0]]);
		expect(two.data.contract?.abi).toEqual([OVERLOADED_ABI[1]]);
		expect(two.message).toContain(`abi: ${JSON.stringify([OVERLOADED_ABI[1]])}`);
	});
});

describe('@rocketh/read-execute - non-contract paths leave contract unset', () => {
	it('a plain tx() carries no contract', async () => {
		const {env} = await setup();

		const error = await expectUnknownSignerError(() =>
			tx(env)({
				account: 'safeOwner',
				to: PROXY_ADDRESS,
				data: '0xdeadbeef',
			}),
		);

		expect(error.data.contract).toBeUndefined();
		expect(error.message).not.toContain('contract:');
		expect(error.message).not.toContain('abi:');
	});

	it('a value transfer carries no contract', async () => {
		const {env} = await setup();

		const error = await expectUnknownSignerError(() =>
			tx(env)({
				account: 'safeOwner',
				to: NODE_ACCOUNT,
				value: 1000n,
			}),
		);

		expect(error.data.contract).toBeUndefined();
		expect(error.data.value).toBe('0x3e8');
	});

	it('a deploy carries no contract', async () => {
		/**
		 * Driven through `env.broadcastDeployment` — the funnel `@rocketh/deploy` uses —
		 * because this package does not (and should not) depend on `@rocketh/deploy`.
		 * A deploy has no `to` and no function to name, so `contract` stays absent.
		 */
		const {env} = await setup();
		const partialDeployment: PartialDeployment = {
			abi: [],
			bytecode: '0x60016000',
			metadata: '{}',
			argsData: '0x',
		};

		const error = await expectUnknownSignerError(() =>
			env.broadcastDeployment(
				'NewContract',
				{
					type: 'object',
					data: {
						type: '0x2',
						from: env.resolveAccount('safeOwner'),
						data: '0x60016000',
						chainId: `0x${env.network.chain.id.toString(16)}` as `0x${string}`,
					},
				},
				partialDeployment,
			),
		);

		expect(error.data.contract).toBeUndefined();
		expect(error.data.to).toBeUndefined();
		expect(error.message).not.toContain('abi:');
	});
});
