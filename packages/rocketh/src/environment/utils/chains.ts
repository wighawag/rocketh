import type {Chain} from 'viem/chains';
import chains from 'viem/chains';

export const chainById: {[chainId: string]: Chain} = {};
const allChains = (chains as any).default || chains;
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
