/**
 * Integration tests for @rocketh/diamond - diamondContractArgs placeholder substitution.
 *
 * The diamond constructor takes args with placeholders that the deployer substitutes:
 * {owner}, {facetCuts}, {initializations}, {erc165}, {init}, {initAddress}, {initData}.
 * The default template is ['{owner}', '{facetCuts}', '{initializations}']. These tests
 * cover the placeholder substitution, the conflict throw, and the missing-{facetCuts}
 * throw — all previously uncovered.
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
import type {Abi} from 'abitype';

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

describe('@rocketh/diamond - diamondContractArgs placeholders', () => {
	it('throws when {facetCuts} is missing from the args template', async () => {
		const {env} = await setup();

		await expect(
			diamond(env)(
				'MyDiamond',
				{account: 'deployer'},
				{
					facets: [{artifact: createExampleArtifact('MyFacet', 0), args: []}],
					diamondContractArgs: ['{owner}'], // no {facetCuts}
				},
			),
		).rejects.toThrow(/diamond constructor needs a \{facetCuts\} argument/);
	});

	it('throws when {initializations} coexists with {init}', async () => {
		const {env} = await setup();

		await expect(
			diamond(env)(
				'MyDiamond',
				{account: 'deployer'},
				{
					facets: [{artifact: createExampleArtifact('MyFacet', 0), args: []}],
					diamondContractArgs: ['{owner}', '{facetCuts}', '{initializations}', '{init}'],
				},
			),
		).rejects.toThrow(/\{initializations\} found but also/);
	});

	it('throws when {initializations} coexists with {erc165}', async () => {
		const {env} = await setup();

		await expect(
			diamond(env)(
				'MyDiamond',
				{account: 'deployer'},
				{
					facets: [{artifact: createExampleArtifact('MyFacet', 0), args: []}],
					diamondContractArgs: ['{owner}', '{facetCuts}', '{initializations}', '{erc165}'],
				},
			),
		).rejects.toThrow(/\{initializations\} found but also/);
	});

	it('throws when {initializations} coexists with {initData}', async () => {
		const {env} = await setup();

		await expect(
			diamond(env)(
				'MyDiamond',
				{account: 'deployer'},
				{
					facets: [{artifact: createExampleArtifact('MyFacet', 0), args: []}],
					diamondContractArgs: ['{owner}', '{facetCuts}', '{initializations}', '{initData}'],
				},
			),
		).rejects.toThrow(/\{initializations\} found but also/);
	});

	it('throws when execute is set but {init}/{initData} is missing from the template', async () => {
		const {env} = await setup();
		const initArtifact = createMockArtifact('DiamondInit', INIT_ABI);

		// execute is set but the template has neither {init} nor {initData} nor {initializations}
		await expect(
			diamond(env)(
				'MyDiamond',
				{account: 'deployer'},
				{
					facets: [{artifact: createExampleArtifact('MyFacet', 0), args: []}],
					execute: {
						type: 'artifact',
						artifact: initArtifact,
						functionName: 'initialize',
						args: [42n],
					},
					diamondContractArgs: ['{owner}', '{facetCuts}'], // no {init} or {initData}
				},
			),
		).rejects.toThrow(/no \{init\} or \{initData\}/);
	});
});
