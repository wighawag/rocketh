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
	options: {check: boolean; skipSupportsInterface: boolean}
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
					return (v as any).name === (fragment as any).name; // TODO fallback and receive hanlding
				}

				if (existingFragment.type === 'constructor' || newFragment.type === 'constructor') {
					return (existingFragment as any).name === (newFragment as any).name;
				}

				if (newFragment.type === 'function') {
					return toFunctionSelector(existingFragment as AbiFunction) === toFunctionSelector(newFragment);
				} else if (newFragment.type === 'event') {
					return toEventHash(existingFragment as AbiEvent) === toEventHash(newFragment as AbiEvent);
				} else {
					return (v as any).name === (fragment as any).name; // TODO fallback and receive hanlding
				}
			});
			if (foundSameSig) {
				if (options.check && !(options.skipSupportsInterface && (fragment as any).name === 'supportsInterface')) {
					if (fragment.type === 'function') {
						throw new Error(
							`function "${fragment.name}" will shadow "${
								(foundSameSig as any).name
							}". Please update code to avoid conflict.`
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
