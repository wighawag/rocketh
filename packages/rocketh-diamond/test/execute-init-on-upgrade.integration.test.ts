/**
 * Integration tests for @rocketh/diamond - `execute` as `{init, onUpgrade}`.
 *
 * The FLAT `execute` (a single call) is made on the first deploy AND again on every later
 * cut that changes something, with the same method and args. That is right for a call that
 * is safe to repeat, and wrong for a one-time initializer, which would re-fire on every
 * later cut. The EXPLICIT form says which event a call belongs to:
 *
 * ```ts
 * await diamond(env)('MyDiamond', {account: 'deployer'}, {
 *   facets: [{artifact: MyFacet}],
 *   execute: {
 *     init: {type: 'facet', functionName: 'initialize', args: [42n]}, // first deploy only
 *     onUpgrade: {type: 'artifact', artifact: Migration, functionName: 'migrate', args: []}, // later cuts only
 *   },
 * });
 * ```
 *
 * Neither form ever makes a call on a run that cuts nothing: deploy scripts are re-run and
 * must stay idempotent.
 *
 * Runs are modelled as in `upgrade.integration.test.ts`: a shared deployment store across
 * environments, with an `eth_call` responder answering the loupe's `facets()` and `owner()`.
 */

import {describe, it, expect} from 'vitest';
import {diamond} from '../src/index.js';
import type {DiamondCall, DiamondDeployOptions} from '../src/types.js';
import {
	createTestEnvironment,
	createMockArtifact,
	createMapDeploymentStore,
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
} from '@rocketh/test-utils';
import {decodeFunctionData, encodeAbiParameters, encodeFunctionData, toFunctionSelector} from 'viem';
import type {Abi, Artifact} from '@rocketh/core/types';
import type {DeploymentStore} from '@rocketh/core/types';

const DEPLOYER = STANDARD_NAMED_ACCOUNTS.deployer as `0x${string}`;

/** A facet carrying both a one-time initializer and an upgrade hook. */
const FACET_ABI = [
	{type: 'function', name: 'getValue', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
	{
		type: 'function',
		name: 'initialize',
		inputs: [{type: 'uint256', name: 'v'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'onUpgrade',
		inputs: [{type: 'uint256', name: 'v'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

/** A standalone migration contract, for the `{type: 'artifact'}` target. */
const MIGRATION_ABI = [
	{
		type: 'function',
		name: 'migrate',
		inputs: [{type: 'uint256', name: 'v'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

const DIAMOND_CUT_ABI = [
	{
		type: 'function',
		name: 'diamondCut',
		inputs: [
			{
				type: 'tuple[]',
				name: '_diamondCut',
				components: [
					{name: 'facetAddress', type: 'address'},
					{name: 'action', type: 'uint8'},
					{name: 'functionSelectors', type: 'bytes4[]'},
				],
			},
			{name: '_init', type: 'address'},
			{name: '_calldata', type: 'bytes'},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

type FacetSnapshot = {facetAddress: `0x${string}`; functionSelectors: `0x${string}`[]}[];

/**
 * Two builds of one facet. The trailing `0002` reads as a 2-byte CBOR metadata length, so the
 * redeploy comparison strips only `dead` and still sees the `11` / `22` marker differ.
 */
function facetArtifact(version: 1 | 2): Artifact<typeof FACET_ABI> {
	const marker = version === 1 ? '11' : '22';
	return {
		...createMockArtifact('MyFacet', FACET_ABI),
		bytecode: `0x6080604052348015600f57600080fd5b50${marker}` as `0x${string}`,
		deployedBytecode: `0x6080604052${marker}dead0002` as `0x${string}`,
	};
}

const migrationArtifact = createMockArtifact('Migration', MIGRATION_ABI);

const initCalldata = (v: bigint) => encodeFunctionData({abi: FACET_ABI, functionName: 'initialize', args: [v]});
const onUpgradeCalldata = (v: bigint) => encodeFunctionData({abi: FACET_ABI, functionName: 'onUpgrade', args: [v]});
const migrateCalldata = (v: bigint) => encodeFunctionData({abi: MIGRATION_ABI, functionName: 'migrate', args: [v]});

function uniqueReceipts(counter: {value: number}) {
	return {
		eth_getTransactionReceipt: () => {
			counter.value++;
			const addr = ('0x' + counter.value.toString(16).padStart(40, 'a')) as `0x${string}`;
			return {
				contractAddress: addr,
				status: '0x1',
				blockNumber: '0x1',
				blockHash: `0x${'b'.repeat(64)}`,
				transactionHash: `0x${'c'.repeat(64)}`,
				gasUsed: '0x5208',
			};
		},
	};
}

function makeCallResponder(oldFacets: FacetSnapshot) {
	const facetsSelector = toFunctionSelector('facets()');
	const ownerSelector = toFunctionSelector('owner()');
	const facetTupleType = {
		type: 'tuple[]' as const,
		components: [
			{name: 'facetAddress', type: 'address'},
			{name: 'functionSelectors', type: 'bytes4[]'},
		],
	};
	return (params?: unknown[]) => {
		const calldata = ((params?.[0] as {data?: string}) ?? {}).data ?? '';
		const selector = calldata.slice(0, 10);
		if (selector === facetsSelector) {
			const facetsAsArrays = oldFacets.map((f) => [f.facetAddress, f.functionSelectors]);
			return encodeAbiParameters([facetTupleType], [facetsAsArrays as any]);
		}
		if (selector === ownerSelector) {
			return `0x${'0'.repeat(24)}${DEPLOYER.slice(2).toLowerCase()}` as `0x${string}`;
		}
		return '0x';
	};
}

/** The data of every transaction sent during a run. */
function sentData(provider: {getRequests(): {method: string; params?: unknown[]}[]}): string[] {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendTransaction')
		.map((r) => ((r.params?.[0] as {data?: string}) ?? {}).data ?? '');
}

/** The `diamondCut` transactions of a run, decoded. */
function sentCuts(provider: {getRequests(): {method: string; params?: unknown[]}[]}) {
	const cutSelector = toFunctionSelector('diamondCut((address,uint8,bytes4[])[],address,bytes)');
	return sentData(provider)
		.filter((data) => data.startsWith(cutSelector))
		.map((data) => decodeFunctionData({abi: DIAMOND_CUT_ABI, data: data as `0x${string}`}).args);
}

/** A run of the deploy script, against the shared store. `onChainFacets` is what the loupe reports. */
async function run(
	counter: {value: number},
	store: DeploymentStore,
	onChainFacets: FacetSnapshot | null,
	facetVersion: 1 | 2,
	execute: DiamondDeployOptions['execute'],
) {
	const created = await createTestEnvironment({
		accounts: STANDARD_NAMED_ACCOUNTS,
		nodeAccounts: NODE_HELD_ACCOUNTS,
		deploymentStore: store,
		providerConfig: {
			responses: {
				...uniqueReceipts(counter),
				...(onChainFacets ? {eth_call: makeCallResponder(onChainFacets)} : {}),
			},
		},
	});
	if (onChainFacets) {
		await created.internal.loadDeployments();
	}
	const result = await diamond(created.env)(
		'MyDiamond',
		{account: 'deployer'},
		{facets: [{artifact: facetArtifact(facetVersion), args: []}], owner: DEPLOYER, execute},
	);
	const facets = (created.env.get('MyDiamond') as unknown as {facets: FacetSnapshot}).facets;
	return {env: created.env, provider: created.provider, result, facets};
}

describe('@rocketh/diamond - execute: {init, onUpgrade}', () => {
	const explicit = {
		init: {type: 'facet', functionName: 'initialize', args: [42n]},
		onUpgrade: {type: 'facet', functionName: 'onUpgrade', args: [7n]},
	} as const satisfies DiamondDeployOptions['execute'];

	it('runs `init` on the first deploy, and NOT `onUpgrade`', async () => {
		const counter = {value: 0};
		const first = await run(counter, createMapDeploymentStore(), null, 1, explicit);

		const data = sentData(first.provider).join('');
		// The init call rides the diamond constructor's initializations.
		expect(data).toContain(initCalldata(42n).slice(2));
		expect(data).not.toContain(onUpgradeCalldata(7n).slice(2));
	});

	it('runs `onUpgrade` on a later changing cut, and NOT `init`', async () => {
		const counter = {value: 0};
		const store = createMapDeploymentStore();
		const first = await run(counter, store, null, 1, explicit);

		const second = await run(counter, store, first.facets, 2, explicit);

		const cuts = sentCuts(second.provider);
		expect(cuts.length).toBe(1);
		const [, initAddress, calldata] = cuts[0];
		expect(calldata).toBe(onUpgradeCalldata(7n));
		// Called on the facet that carries it, which is the v2 facet just cut in.
		expect(initAddress.toLowerCase()).toBe(second.env.get('MyFacet').address.toLowerCase());
		expect(sentData(second.provider).join('')).not.toContain(initCalldata(42n).slice(2));
	});

	it('runs neither on a re-run that changes nothing', async () => {
		const counter = {value: 0};
		const store = createMapDeploymentStore();
		const first = await run(counter, store, null, 1, explicit);

		const again = await run(counter, store, first.facets, 1, explicit);

		expect(again.result.newlyDeployed).toBe(false);
		expect(sentCuts(again.provider).length).toBe(0);
		const data = sentData(again.provider).join('');
		expect(data).not.toContain(initCalldata(42n).slice(2));
		expect(data).not.toContain(onUpgradeCalldata(7n).slice(2));
	});

	it('lets `init` and `onUpgrade` name different functions on different kinds of target', async () => {
		/**
		 * `init` calls a facet function, `onUpgrade` a standalone migration contract. The
		 * facet lookup runs for the call that was SELECTED, so the migration's `migrate` need
		 * not exist on any facet, and the facet's `initialize` is not looked for on upgrade.
		 */
		const mixedTargets: DiamondDeployOptions['execute'] = {
			init: {type: 'facet', functionName: 'initialize', args: [1n]},
			onUpgrade: {type: 'artifact', artifact: migrationArtifact, functionName: 'migrate', args: [2n]},
		};
		const counter = {value: 0};
		const store = createMapDeploymentStore();
		const first = await run(counter, store, null, 1, mixedTargets);
		expect(sentData(first.provider).join('')).toContain(initCalldata(1n).slice(2));
		expect(sentData(first.provider).join('')).not.toContain(migrateCalldata(2n).slice(2));

		const second = await run(counter, store, first.facets, 2, mixedTargets);
		const cuts = sentCuts(second.provider);
		expect(cuts.length).toBe(1);
		const [, initAddress, calldata] = cuts[0];
		expect(calldata).toBe(migrateCalldata(2n));
		// Delegatecalled into the migration contract, not into the facet.
		expect(initAddress.toLowerCase()).not.toBe(second.env.get('MyFacet').address.toLowerCase());
		expect(initAddress).not.toBe('0x0000000000000000000000000000000000000000');
	});

	it('also works the other way round: `init` on an artifact, `onUpgrade` on a facet', async () => {
		const swapped: DiamondDeployOptions['execute'] = {
			init: {type: 'artifact', artifact: migrationArtifact, functionName: 'migrate', args: [3n]},
			onUpgrade: {type: 'facet', functionName: 'onUpgrade', args: [4n]},
		};
		const counter = {value: 0};
		const store = createMapDeploymentStore();
		const first = await run(counter, store, null, 1, swapped);
		expect(sentData(first.provider).join('')).toContain(migrateCalldata(3n).slice(2));

		const second = await run(counter, store, first.facets, 2, swapped);
		const cuts = sentCuts(second.provider);
		expect(cuts.length).toBe(1);
		expect(cuts[0][2]).toBe(onUpgradeCalldata(4n));
	});

	it('makes no call on an upgrade when only `init` is given', async () => {
		const counter = {value: 0};
		const store = createMapDeploymentStore();
		const initOnly: DiamondDeployOptions['execute'] = {init: explicit.init};
		const first = await run(counter, store, null, 1, initOnly);

		const second = await run(counter, store, first.facets, 2, initOnly);
		const cuts = sentCuts(second.provider);
		expect(cuts.length).toBe(1);
		// The cut still happens, with no init call attached.
		expect(cuts[0][1]).toBe('0x0000000000000000000000000000000000000000');
		expect(cuts[0][2]).toBe('0x');
	});

	it('keeps the flat form: the same call on the first deploy AND on a later changing cut', async () => {
		const flat: DiamondCall = {type: 'facet', functionName: 'initialize', args: [9n]};
		const counter = {value: 0};
		const store = createMapDeploymentStore();
		const first = await run(counter, store, null, 1, flat);
		expect(sentData(first.provider).join('')).toContain(initCalldata(9n).slice(2));

		const second = await run(counter, store, first.facets, 2, flat);
		const cuts = sentCuts(second.provider);
		expect(cuts.length).toBe(1);
		expect(cuts[0][2]).toBe(initCalldata(9n));

		// ...and still nothing on a run that cuts nothing.
		const again = await run(counter, store, second.facets, 2, flat);
		expect(sentCuts(again.provider).length).toBe(0);
	});

	it('refuses a value mixing the flat form with `init` / `onUpgrade`', async () => {
		/**
		 * Mixing would leave one of the two calls silently ignored, whichever the code
		 * happened to read first. Built as a variable so TypeScript's excess-property check
		 * (which only applies to literals) does not stop it first, as it would not in a
		 * script assembling options at run time.
		 */
		const mixed = {
			type: 'facet',
			functionName: 'initialize',
			args: [1n],
			onUpgrade: {type: 'facet', functionName: 'onUpgrade', args: [2n]},
		};
		await expect(run({value: 0}, createMapDeploymentStore(), null, 1, mixed as DiamondCall)).rejects.toThrow(
			/mixes the flat form/,
		);
	});
});
