import {Abi, AbiEvent, AbiFunction} from 'abitype';
import {toEventHash, toFunctionSelector} from 'viem';

export function sigsFromABI(abi: Abi): `0x${string}`[] {
	return abi.filter((fragment) => fragment.type === 'function').map((fragment) => toFunctionSelector(fragment));
}

export function filterABI(abi: Abi, excludeSighashes: Set<string>): any[] {
	return abi.filter((fragment) => fragment.type !== 'function' || !excludeSighashes.has(toFunctionSelector(fragment)));
}

export function mergeABIs<TAbi extends Abi = Abi>(
	abis: Abi[],
	options: {check: boolean; skipSupportsInterface: boolean},
): TAbi {
	if (abis.length === 0) {
		return [] as unknown as TAbi;
	}
	const result: Abi = structuredClone(abis[0]);

	for (let i = 1; i < abis.length; i++) {
		const abi = abis[i];
		for (const fragment of abi) {
			const newFragment = fragment;
			// TODO constructor special handling ?
			const foundSameSig = result.find((v) => {
				const existingFragment = v;
				if (v.type !== fragment.type) {
					return false;
				}
				if (!existingFragment) {
					return (v as any).name === (fragment as any).name; // TODO fallback and receive handling
				}

				if (existingFragment.type === 'constructor' || newFragment.type === 'constructor') {
					return (existingFragment as any).name === (newFragment as any).name;
				}

				if (newFragment.type === 'function') {
					return toFunctionSelector(existingFragment as AbiFunction) === toFunctionSelector(newFragment);
				} else if (newFragment.type === 'event') {
					return toEventHash(existingFragment as AbiEvent) === toEventHash(newFragment as AbiEvent);
				} else {
					return (v as any).name === (fragment as any).name; // TODO fallback and receive handling
				}
			});
			if (foundSameSig) {
				if (options.check && !(options.skipSupportsInterface && (fragment as any).name === 'supportsInterface')) {
					if (fragment.type === 'function') {
						throw new Error(
							`function "${fragment.name}" will shadow "${
								(foundSameSig as any).name
							}". Please update code to avoid conflict.`,
						);
					}
				}
			} else {
				(result as any).push(fragment);
			}
		}
	}

	return result as unknown as TAbi;
}

/**
 * Whether the stored record already describes the diamond we are about to record.
 *
 * The record is written whenever the chain agrees with the declared facet set,
 * however it got there, which includes runs where rocketh cut nothing at all. Since
 * `env.save` bumps `numDeployments` and rewrites the file, and that counter means
 * "how many times the recorded deployment CHANGED", it must tick for a cut rocketh
 * is only now observing and must NOT tick for a re-run that changed nothing.
 *
 * BOTH the facet snapshot AND the ABI are compared, and the facets are the reason
 * this is not just an ABI check: replacing a facet with a new build of the SAME
 * contract changes the addresses while leaving the merged ABI byte-identical. An
 * ABI-only comparison would call that unchanged and leave the record naming facet
 * addresses the diamond no longer uses.
 *
 * Compared as order-sensitive JSON: both sides are produced by the same code over
 * the same inputs in the same order, so a genuine no-op reproduces identical output.
 * A missing stored value counts as different, and so does a comparison that throws:
 * a redundant save is recoverable, a skipped one is the bug this exists to fix.
 */
export function sameDiamondRecord(
	stored: {abi?: unknown; facets?: unknown} | null | undefined,
	candidate: {abi: unknown; facets: unknown},
): boolean {
	if (!stored || !stored.abi || !stored.facets) {
		return false;
	}
	try {
		return (
			JSON.stringify(stored.facets) === JSON.stringify(candidate.facets) &&
			JSON.stringify(stored.abi) === JSON.stringify(candidate.abi)
		);
	} catch {
		return false;
	}
}
