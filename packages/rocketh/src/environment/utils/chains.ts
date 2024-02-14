import type {Chain} from 'viem/chains';
import * as allChains from 'viem/chains';

export const chainById: {[chainId: string]: Chain} = {};
for (const key of Object.keys(allChains)) {
	const chain = (allChains as any)[key] as Chain;
	chainById[chain.id.toString()] = chain;
}

export function getChain(id: string): Chain {
	const chain = chainById[id];
	if (!chain) {
		return {
			id: parseInt(id),
			name: 'unkwown',
			// TODO
			nativeCurrency: {
				name: 'Unknown Currency',
				symbol: 'UNKNOWN',
				decimals: 18,
			},
			rpcUrls: {
				default: {
					http: [],
				},
			},
		};
	}
	return chain;
}
