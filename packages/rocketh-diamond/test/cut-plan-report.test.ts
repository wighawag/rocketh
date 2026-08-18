/**
 * What the user is told before a diamond cut executes.
 *
 * The selector diff is DECLARATIVE: anything the declared facet set does not produce is
 * removed. That is the model working, and it is also how a typo or a commented-out facet
 * deletes live functions, up to and including the only route to a future upgrade. The cut
 * used to execute with nothing printed at all.
 *
 * These tests pin the two properties that make the output worth printing: removals are
 * SEPARATE from additions (a combined list is how a removal gets missed) and selectors are
 * resolved to SIGNATURES (`0x1f931c1c` tells a reader nothing; `diamondCut(...)` tells them
 * to stop).
 */

import {describe, it, expect} from 'vitest';
import {toFunctionSelector} from 'viem';
import type {Abi} from 'abitype';

import {formatDiamondCutPlan, selectorSignatures} from '../src/report.js';
import {FacetCutAction, type FacetCut} from '../src/types.js';

const FACET = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const;

const NEW_ABI = [
	{type: 'function', name: 'setValue', inputs: [{type: 'uint256'}], outputs: [], stateMutability: 'nonpayable'},
] as const satisfies Abi;

/** What the diamond serves today, including the cut function an upgrade depends on. */
const OLD_ABI = [
	{type: 'function', name: 'legacyMint', inputs: [{type: 'address'}], outputs: [], stateMutability: 'nonpayable'},
	{
		type: 'function',
		name: 'diamondCut',
		inputs: [
			{
				type: 'tuple[]',
				components: [{type: 'address'}, {type: 'uint8'}, {type: 'bytes4[]'}],
			},
			{type: 'address'},
			{type: 'bytes'},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

const SET_VALUE = toFunctionSelector('setValue(uint256)');
const LEGACY_MINT = toFunctionSelector('legacyMint(address)');
const DIAMOND_CUT = toFunctionSelector('diamondCut((address,uint8,bytes4[])[],address,bytes)');

const signatures = selectorSignatures([NEW_ABI as unknown as Abi, OLD_ABI as unknown as Abi]);

function plan(cuts: FacetCut[]): string {
	const output = formatDiamondCutPlan('MyDiamond', cuts, signatures);
	expect(output).toBeDefined();
	return output!;
}

describe('@rocketh/diamond - the cut plan shown before executing', () => {
	it('says nothing when there is nothing to do', () => {
		// No cut, no output: the run should not print a heading for an empty plan.
		expect(formatDiamondCutPlan('MyDiamond', [], signatures)).toBeUndefined();
	});

	it('names removed functions by signature, not just by selector', () => {
		const output = plan([
			{
				facetAddress: '0x0000000000000000000000000000000000000000',
				functionSelectors: [LEGACY_MINT],
				action: FacetCutAction.Remove,
			},
		]);

		expect(output).toContain('legacyMint(address)');
		expect(output).toContain(LEGACY_MINT);
	});

	it('names a removal even though it is absent from the new ABI', () => {
		// The point of feeding BOTH ABIs: what is leaving is, by definition, no longer in the
		// merged new ABI, so a new-ABI-only lookup would print bare hex for exactly the lines
		// that matter most.
		const removedOnlyKnownToOldAbi = selectorSignatures([NEW_ABI as unknown as Abi]);
		expect(
			formatDiamondCutPlan(
				'MyDiamond',
				[
					{
						facetAddress: '0x0000000000000000000000000000000000000000',
						functionSelectors: [DIAMOND_CUT],
						action: FacetCutAction.Remove,
					},
				],
				removedOnlyKnownToOldAbi,
			),
		).toContain('(unknown signature)');

		expect(
			plan([
				{
					facetAddress: '0x0000000000000000000000000000000000000000',
					functionSelectors: [DIAMOND_CUT],
					action: FacetCutAction.Remove,
				},
			]),
		).toContain('diamondCut((address,uint8,bytes4[])[],address,bytes)');
	});

	it('puts removals in their own block, ahead of additions', () => {
		const output = plan([
			{
				facetAddress: '0x0000000000000000000000000000000000000000',
				functionSelectors: [LEGACY_MINT],
				action: FacetCutAction.Remove,
			},
			{facetAddress: FACET, functionSelectors: [SET_VALUE], action: FacetCutAction.Add},
		]);

		const removingAt = output.indexOf('REMOVING');
		const addingAt = output.indexOf('adding');
		expect(removingAt).toBeGreaterThanOrEqual(0);
		expect(addingAt).toBeGreaterThan(removingAt);

		// And the removal is not buried in the additions list: the two are separate sections.
		const removalSection = output.slice(removingAt, addingAt);
		expect(removalSection).toContain('legacyMint(address)');
		expect(removalSection).not.toContain('setValue(uint256)');
	});

	it('warns that a removal is by design, since that is what makes it dangerous', () => {
		// A user staring at an unexpected removal needs to know WHERE it came from: the declared
		// facet set, not a bug.
		const output = plan([
			{
				facetAddress: '0x0000000000000000000000000000000000000000',
				functionSelectors: [DIAMOND_CUT],
				action: FacetCutAction.Remove,
			},
		]);

		expect(output).toContain('stop now');
		expect(output).toContain('`facets`');
	});

	it('says nothing about removals when there are none', () => {
		// The loud block must stay meaningful: an upgrade that only adds should not print a
		// removal heading with an empty list under it.
		const output = plan([{facetAddress: FACET, functionSelectors: [SET_VALUE], action: FacetCutAction.Add}]);

		expect(output).not.toContain('REMOVING');
		expect(output).toContain('adding 1 function');
		expect(output).toContain('setValue(uint256)');
		expect(output).toContain(FACET);
	});

	it('counts in singular and plural', () => {
		const one = plan([
			{
				facetAddress: '0x0000000000000000000000000000000000000000',
				functionSelectors: [LEGACY_MINT],
				action: FacetCutAction.Remove,
			},
		]);
		const two = plan([
			{
				facetAddress: '0x0000000000000000000000000000000000000000',
				functionSelectors: [LEGACY_MINT, DIAMOND_CUT],
				action: FacetCutAction.Remove,
			},
		]);

		expect(one).toContain('REMOVING 1 function from');
		expect(two).toContain('REMOVING 2 functions from');
	});
});
