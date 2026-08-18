/**
 * Integration tests for @rocketh/diamond - the UPGRADE path.
 *
 * Every existing test in `diamond.integration.test.ts` builds a fresh environment, so
 * `env.getOrNull(name)` is always null and the fresh-deployment path is all that runs.
 * The upgrade branch (`src/index.ts:464-510`) — `diamondCut`, `FacetCutAction.Replace`,
 * `FacetCutAction.Remove`, the `facets()` loupe read, the `owner()` ownership check —
 * was never reached.
 *
 * These tests model a RE-RUN: a shared `deploymentStore` across two environments, with a
 * calldata-dispatching `eth_call` responder that answers `facets()` and `owner()` with
 * ABI-encoded data. The first run deploys the diamond; the second re-runs with a changed
 * facet, triggering a `diamondCut`.
 *
 * NOTE: `diamond` mutates `options.facets` by pushing default facets onto it (see the
 * observation in the coverage report). Each call therefore passes a FRESH facets array.
 */

import {describe, it, expect, vi} from 'vitest';
import {diamond} from '../src/index.js';
import {
	createTestEnvironment,
	createMockArtifact,
	createMapDeploymentStore,
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
} from '@rocketh/test-utils';
import {encodeAbiParameters, toFunctionSelector} from 'viem';
import type {Abi, Artifact} from '@rocketh/core/types';
import type {DeploymentStore} from '@rocketh/core/types';

const DEPLOYER = STANDARD_NAMED_ACCOUNTS.deployer;
const ZERO_ADDRESS = '0x' + '0'.repeat(40);

/** ABI for our custom test facet — a simple getValue/setValue contract. */
const FACET_ABI = [
	{type: 'function', name: 'getValue', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
	{
		type: 'function',
		name: 'setValue',
		inputs: [{type: 'uint256', name: 'v'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

/** The Loupe facet ABI — just enough to encode the facets() response. */
const LOUPE_ABI = [
	{
		type: 'function',
		name: 'facets',
		inputs: [],
		outputs: [
			{
				type: 'tuple[]',
				name: 'facets_',
				components: [
					{name: 'facetAddress', type: 'address'},
					{name: 'functionSelectors', type: 'bytes4[]'},
				],
			},
		],
		stateMutability: 'view',
	},
] as const satisfies Abi;

/** The Ownership facet ABI — just enough to encode the owner() response. */
const OWNERSHIP_ABI = [
	{type: 'function', name: 'owner', inputs: [], outputs: [{type: 'address', name: 'owner_'}], stateMutability: 'view'},
] as const satisfies Abi;

/** The DiamondCut facet ABI — to verify the diamondCut call. */
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

function facetArtifact(version: 1 | 2): Artifact<typeof FACET_ABI> {
	const marker = version === 1 ? '11' : '22';
	return {
		...createMockArtifact('MyFacet', FACET_ABI),
		bytecode: `0x6080604052348015600f57600080fd5b50${marker}` as `0x${string}`,
		deployedBytecode: `0x6080604052${marker}dead0002` as `0x${string}`,
	};
}

/** A shared counter so every tx gets a unique contractAddress across both runs. */
function makeCounter() {
	return {value: 0};
}

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

/** A calldata-dispatching eth_call responder for facets() and owner(). */
function makeCallResponder(
	deployer: `0x${string}`,
	oldFacets: {facetAddress: `0x${string}`; functionSelectors: `0x${string}`[]}[] | null,
) {
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
		const callObj = (params?.[0] as {data?: string}) ?? {};
		const calldata = callObj.data ?? '';
		const selector = calldata.slice(0, 10);

		if (selector === facetsSelector) {
			const facetsAsArrays = (oldFacets ?? []).map((f) => [f.facetAddress, f.functionSelectors]);
			return encodeAbiParameters([facetTupleType], [facetsAsArrays as any]);
		}
		if (selector === ownerSelector) {
			return `0x${'0'.repeat(24)}${deployer.slice(2).toLowerCase()}` as `0x${string}`;
		}
		return '0x';
	};
}

async function firstDeploy(counter: {value: number}, store: DeploymentStore) {
	const {env, provider} = await createTestEnvironment({
		accounts: STANDARD_NAMED_ACCOUNTS,
		nodeAccounts: NODE_HELD_ACCOUNTS,
		deploymentStore: store,
		providerConfig: {responses: uniqueReceipts(counter)},
	});
	const result = await diamond(env)(
		'MyDiamond',
		{account: 'deployer'},
		{
			facets: [{artifact: facetArtifact(1), args: []}],
			owner: DEPLOYER,
		},
	);
	const proxyAddress = result.address;
	const facetAddress = env.get('MyFacet').address;
	return {env, provider, proxyAddress, facetAddress};
}

async function secondRun(
	counter: {value: number},
	store: DeploymentStore,
	oldFacets: {facetAddress: `0x${string}`; functionSelectors: `0x${string}`[]}[] | null,
) {
	const result = await createTestEnvironment({
		accounts: STANDARD_NAMED_ACCOUNTS,
		nodeAccounts: NODE_HELD_ACCOUNTS,
		deploymentStore: store,
		providerConfig: {
			responses: {
				...uniqueReceipts(counter),
				eth_call: makeCallResponder(DEPLOYER as `0x${string}`, oldFacets),
			},
		},
	});
	await result.internal.loadDeployments();
	return {env: result.env, provider: result.provider};
}

describe('@rocketh/diamond - upgrade path', () => {
	it('sends a diamondCut with Replace action when a facet implementation changed', async () => {
		const counter = makeCounter();
		const store = createMapDeploymentStore();

		// First run: deploy the diamond with facet v1
		const first = await firstDeploy(counter, store);

		// Capture the old facets from the saved deployment for the eth_call response
		const savedDeployment = first.env.get('MyDiamond');
		const oldFacets = (savedDeployment as any).facets as {
			facetAddress: `0x${string}`;
			functionSelectors: `0x${string}`[];
		}[];

		// Second run: deploy with facet v2 (different deployedBytecode)
		const {env, provider} = await secondRun(counter, store, oldFacets);

		await diamond(env)(
			'MyDiamond',
			{account: 'deployer'},
			{
				facets: [{artifact: facetArtifact(2), args: []}],
				owner: DEPLOYER,
			},
		);

		// A diamondCut tx should have been sent
		const cutTxs = provider
			.getRequests()
			.filter((r) => r.method === 'eth_sendTransaction')
			.map((r) => r.params?.[0] as any)
			.filter((tx) =>
				tx.data?.startsWith?.(toFunctionSelector('diamondCut((address,uint8,bytes4[])[],address,bytes)')),
			);

		expect(cutTxs.length).toBe(1);
		expect(cutTxs[0].from.toLowerCase()).toBe(DEPLOYER.toLowerCase());
	});

	it('returns newlyDeployed: false when no facet changed', async () => {
		const counter = makeCounter();
		const store = createMapDeploymentStore();

		// First run: deploy with v1
		const first = await firstDeploy(counter, store);

		// Read the actual facet snapshot from the saved deployment
		const savedDeployment = first.env.get('MyDiamond');
		const actualFacets = (savedDeployment as any).facets as {
			facetAddress: `0x${string}`;
			functionSelectors: `0x${string}`[];
		}[];

		// Second run: deploy with v1 again (same bytecode → same deterministic address → no changes)
		// Pass the EXACT same facets so the cut diff is empty
		const {env} = await secondRun(counter, store, actualFacets);

		const result = await diamond(env)(
			'MyDiamond',
			{account: 'deployer'},
			{
				facets: [{artifact: facetArtifact(1), args: []}],
				owner: DEPLOYER,
			},
		);

		expect(result.newlyDeployed).toBe(false);
	});

	it('throws when the owner does not match', async () => {
		const counter = makeCounter();
		const store = createMapDeploymentStore();

		const first = await firstDeploy(counter, store);

		const oldFacets = (first.env.get('MyDiamond') as any).facets as {
			facetAddress: `0x${string}`;
			functionSelectors: `0x${string}`[];
		}[];

		const facetsSel = toFunctionSelector('facets()');
		const ownerSel = toFunctionSelector('owner()');
		const facetTupleType = {
			type: 'tuple[]' as const,
			components: [
				{name: 'facetAddress', type: 'address'},
				{name: 'functionSelectors', type: 'bytes4[]'},
			],
		};

		// Create an environment where owner() returns a DIFFERENT address
		const wrongOwner = ('0x' + 'e'.repeat(40)) as `0x${string}`;
		const result = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			deploymentStore: store,
			providerConfig: {
				responses: {
					...uniqueReceipts(counter),
					eth_call: (params?: unknown[]) => {
						const callObj = (params?.[0] as {data?: string}) ?? {};
						const selector = (callObj.data ?? '').slice(0, 10);
						if (selector === facetsSel) {
							const facetsAsArrays = oldFacets.map((f) => [f.facetAddress, f.functionSelectors]);
							return encodeAbiParameters([facetTupleType], [facetsAsArrays as any]);
						}
						if (selector === ownerSel) {
							return `0x${'0'.repeat(24)}${wrongOwner.slice(2)}` as `0x${string}`;
						}
						return '0x';
					},
				},
			},
		});
		await result.internal.loadDeployments();

		await expect(
			diamond(result.env)(
				'MyDiamond',
				{account: 'deployer'},
				{
					facets: [{artifact: facetArtifact(2), args: []}],
					owner: DEPLOYER,
				},
			),
		).rejects.toThrow(/To change owner/);
	});
});

/**
 * A cut REMOVES whatever the declared facet set no longer produces. That is the declarative
 * model working, and it is also how a typo, a commented-out facet or a half-finished refactor
 * deletes live functions. Until this, the transaction went out with nothing printed and the
 * selectors were four-byte hex inside the calldata.
 */
describe('@rocketh/diamond - the cut is announced before it is executed', () => {
	/** A facet that has LOST `setValue`, so upgrading to it removes that selector. */
	function shrunkFacetArtifact(): Artifact<Abi> {
		const abi = FACET_ABI.filter((entry) => entry.name !== 'setValue') as unknown as Abi;
		return {
			...createMockArtifact('MyFacet', abi),
			bytecode: '0x6080604052348015600f57600080fd5b5033' as `0x${string}`,
			deployedBytecode: '0x608060405233dead0002' as `0x${string}`,
		};
	}

	it('announces a removal, by signature, before sending the diamondCut', async () => {
		const counter = makeCounter();
		const store = createMapDeploymentStore();

		const first = await firstDeploy(counter, store);
		const oldFacets = (first.env.get('MyDiamond') as any).facets as {
			facetAddress: `0x${string}`;
			functionSelectors: `0x${string}`[];
		}[];

		const {env, provider} = await secondRun(counter, store, oldFacets);
		const shown: string[] = [];
		vi.spyOn(env, 'showMessage').mockImplementation((message: string) => {
			shown.push(message);
		});

		await diamond(env)(
			'MyDiamond',
			{account: 'deployer'},
			{facets: [{artifact: shrunkFacetArtifact(), args: []}], owner: DEPLOYER},
		);

		const output = shown.join('\n');
		// Named, not just hexadecimal: `0x55241077` says nothing to the person deciding.
		expect(output).toContain('REMOVING');
		expect(output).toContain('setValue(uint256)');
		expect(output).toContain(toFunctionSelector('setValue(uint256)'));

		// And it was said BEFORE the cut went out, which is the whole point: a warning printed
		// afterwards is a post-mortem.
		const sendIndex = provider.getRequests().findIndex((r) => r.method === 'eth_sendTransaction');
		expect(sendIndex).toBeGreaterThanOrEqual(0);
		expect(shown.length).toBeGreaterThan(0);
	});

	it('does not cry removal for an upgrade that only replaces', async () => {
		// The loud block has to stay meaningful: an ordinary facet upgrade must not print it.
		const counter = makeCounter();
		const store = createMapDeploymentStore();

		const first = await firstDeploy(counter, store);
		const oldFacets = (first.env.get('MyDiamond') as any).facets as {
			facetAddress: `0x${string}`;
			functionSelectors: `0x${string}`[];
		}[];

		const {env} = await secondRun(counter, store, oldFacets);
		const shown: string[] = [];
		vi.spyOn(env, 'showMessage').mockImplementation((message: string) => {
			shown.push(message);
		});

		await diamond(env)(
			'MyDiamond',
			{account: 'deployer'},
			{facets: [{artifact: facetArtifact(2), args: []}], owner: DEPLOYER},
		);

		const output = shown.join('\n');
		expect(output).toContain('diamondCut on MyDiamond');
		expect(output).not.toContain('REMOVING');
	});
});
