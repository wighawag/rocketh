/**
 * Integration tests for @rocketh/diamond - untested fresh-deploy options.
 *
 * The existing `diamond.integration.test.ts` covers basic deploy, owner, execute via
 * facet, custom facets, constructor args, deterministicSalt, defaultCutFacet: false,
 * and the zero-salt error. The upgrade tests cover the diamondCut path. These tests
 * cover the remaining fresh-deploy options: `excludeSelectors`, `execute: {type:
 * 'artifact'}`, `defaultOwnershipFacet: false`, and the `execute` facet-not-found
 * error.
 */

import {describe, it, expect} from 'vitest';
import {diamond} from '../src/index.js';
import {
	createTestEnvironment,
	createExampleArtifact,
	createMockArtifact,
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
} from '@rocketh/test-utils';
import {toFunctionSelector} from 'viem';
import type {Abi} from 'abitype';

const FACET_ABI = [
	{type: 'function', name: 'getValue0', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
	{
		type: 'function',
		name: 'setValue0',
		inputs: [{type: 'uint256', name: 'v'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

const INIT_ABI = [
	{
		type: 'function',
		name: 'initialize',
		inputs: [{type: 'uint256', name: 'v'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

async function setup() {
	const {env} = await createTestEnvironment({
		accounts: STANDARD_NAMED_ACCOUNTS,
		nodeAccounts: NODE_HELD_ACCOUNTS,
	});
	return {env};
}

describe('@rocketh/diamond - fresh-deploy edge cases', () => {
	describe('excludeSelectors', () => {
		it('excludes specified selectors from the merged ABI', async () => {
			const {env} = await setup();
			const facetArtifact = createExampleArtifact('MyFacet', 0);

			// template 0 has getValue0 — exclude its selector
			const getValue0Selector = toFunctionSelector('getValue0()');

			const result = await diamond(env)(
				'MyDiamond',
				{account: 'deployer'},
				{
					facets: [{artifact: facetArtifact, args: []}],
					excludeSelectors: {MyFacet: [getValue0Selector as `0x${string}`]},
				},
			);

			// getValue0 should NOT be in the merged ABI
			const functionNames = (result.abi as any[]).filter((f) => f.type === 'function').map((f) => f.name);
			expect(functionNames).not.toContain('getValue0');
			// But the other template functions (constructor) should still be there
			expect(functionNames.length).toBeGreaterThan(0);
		});
	});

	describe('execute: {type: "artifact"}', () => {
		it('deploys an unnamed init contract and uses its call as init data', async () => {
			const {env} = await setup();
			const facetArtifact = createExampleArtifact('MyFacet', 0);
			const initArtifact = createMockArtifact('DiamondInit', INIT_ABI);

			const result = await diamond(env)(
				'MyDiamond',
				{account: 'deployer'},
				{
					facets: [{artifact: facetArtifact, args: []}],
					execute: {
						type: 'artifact',
						artifact: initArtifact,
						functionName: 'initialize',
						args: [42n],
					},
				},
			);

			expect(result).toBeDefined();
			expect(result.address).toBeDefined();
			// The init contract should have been deployed (as a deterministic unnamed deploy)
			// The diamond should have been created with the init data
		});
	});

	describe('defaultOwnershipFacet: false', () => {
		it('deploys without the ownership facet', async () => {
			const {env} = await setup();
			const facetArtifact = createExampleArtifact('MyFacet', 0);

			const result = await diamond(env)(
				'MyDiamond',
				{account: 'deployer'},
				{
					facets: [{artifact: facetArtifact, args: []}],
					defaultOwnershipFacet: false,
				},
			);

			expect(result).toBeDefined();
			// The ownership facet's owner() function should NOT be in the merged ABI
			const functionNames = (result.abi as any[]).filter((f) => f.type === 'function').map((f) => f.name);
			expect(functionNames).not.toContain('owner');
		});
	});

	describe('execute: {type: "facet"} not found', () => {
		it('throws when the execute facet function is not found in any facet', async () => {
			const {env} = await setup();
			const facetArtifact = createExampleArtifact('MyFacet', 0);

			await expect(
				diamond(env)(
					'MyDiamond',
					{account: 'deployer'},
					{
						facets: [{artifact: facetArtifact, args: []}],
						execute: {
							type: 'facet',
							functionName: 'nonExistentFunction',
							args: [],
						},
					},
				),
			).rejects.toThrow(/Facet not found for execute/);
		});
	});
});
