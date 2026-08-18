/**
 * What a diamond upgrade is about to do, in words, BEFORE it does it.
 *
 * A diamond cut is declarative: rocketh compares the selectors the diamond currently serves
 * against the ones the declared facet set produces, and whatever is on chain but not declared
 * goes into a Remove. That is the model working as designed, and it is also the model's sharp
 * edge, because the same mechanism turns a typo, a commented-out facet or a half-finished
 * refactor into the removal of live functions. The worst case is removing the only path to
 * upgrade, which makes the diamond permanently immutable.
 *
 * The cut used to be executed with nothing printed: the transaction went out and the
 * selectors were four-byte hex in the calldata. This prints the plan first, with REMOVALS in
 * their own block rather than mixed in with additions, since scanning a combined list is how
 * a removal gets missed.
 *
 * SELECTORS ARE RESOLVED TO SIGNATURES where possible. `Remove 0x1f931c1c` tells a reader
 * nothing; `Remove diamondCut(...)` tells them to stop. The names come from the ABI the
 * DEPLOYMENT already has, so a removed function (absent from the new ABI by definition) is
 * still named.
 */

import type {Abi} from 'abitype';
import {toFunctionSelector, toFunctionSignature} from 'viem';

import {FacetCut, FacetCutAction} from './types.js';

/** Map every function selector an ABI defines to its human signature. */
export function selectorSignatures(abis: Abi[]): Map<`0x${string}`, string> {
	const signatures = new Map<`0x${string}`, string>();
	for (const abi of abis) {
		for (const fragment of abi) {
			if (fragment.type !== 'function') continue;
			try {
				signatures.set(toFunctionSelector(fragment), toFunctionSignature(fragment));
			} catch {
				// A fragment viem cannot render is not worth failing a deployment over: the
				//  selector still prints, just without its name.
			}
		}
	}
	return signatures;
}

function describeSelector(selector: `0x${string}`, signatures: Map<`0x${string}`, string>): string {
	const signature = signatures.get(selector);
	return signature ? `${selector}  ${signature}` : `${selector}  (unknown signature)`;
}

/**
 * The human-readable plan for a set of cuts, or `undefined` when there is nothing to say.
 *
 * Returns a string rather than printing, so the caller owns the channel and a test can assert
 * the content without capturing output.
 */
export function formatDiamondCutPlan(
	name: string,
	facetCuts: FacetCut[],
	signatures: Map<`0x${string}`, string>,
): string | undefined {
	if (facetCuts.length === 0) {
		return undefined;
	}

	const added: string[] = [];
	const replaced: string[] = [];
	const removed: string[] = [];

	for (const cut of facetCuts) {
		for (const selector of cut.functionSelectors) {
			const described = describeSelector(selector, signatures);
			switch (cut.action) {
				case FacetCutAction.Add:
					added.push(`    ${described}  ->  ${cut.facetAddress}`);
					break;
				case FacetCutAction.Replace:
					replaced.push(`    ${described}  ->  ${cut.facetAddress}`);
					break;
				case FacetCutAction.Remove:
					removed.push(`    ${described}`);
					break;
			}
		}
	}

	const lines: string[] = [`  diamondCut on ${name}:`];

	// REMOVALS FIRST, and separately. They are the destructive half, and a reader who stops
	//  after the first block has still seen the part that cannot be undone by re-running.
	if (removed.length > 0) {
		lines.push(`  REMOVING ${removed.length} function${removed.length === 1 ? '' : 's'} from the diamond:`);
		lines.push(...removed);
		lines.push(
			`  A removed function stops existing at this address. If any of the above was not meant to go,`,
			`  stop now: check that every facet you expect is in \`facets\`, since anything the declared set`,
			`  does not produce is removed by design.`,
		);
	}
	if (added.length > 0) {
		lines.push(`  adding ${added.length} function${added.length === 1 ? '' : 's'}:`);
		lines.push(...added);
	}
	if (replaced.length > 0) {
		lines.push(`  replacing ${replaced.length} function${replaced.length === 1 ? '' : 's'}:`);
		lines.push(...replaced);
	}

	return lines.join('\n');
}
