import type {Chain} from 'viem/chains';
import chains from 'viem/chains';
import * as extraChains from './extra-chains';

export type ChainType = 'zksync' | 'op-stack' | 'celo' | 'default';

const chainTypesByNames: {[chainExportName: string]: ChainType} = {
	base: 'op-stack',
	baseGoerli: 'op-stack',
	baseSepolia: 'op-stack',
	optimism: 'op-stack',
	optimismGoerli: 'op-stack',
	optimismSepolia: 'op-stack',
	pgn: 'op-stack',
	pgnTestnet: 'op-stack',
	zora: 'op-stack',
	zoraSepolia: 'op-stack',
	zoraTestnet: 'op-stack',
	ancient8: 'op-stack',
	ancient8Sepolia: 'op-stack',
	celoAlfajores: 'celo',
	celo: 'celo',
	zkSync: 'zksync',
	zkSyncTestnet: 'zksync',
	zkSyncSepoliaTestnet: 'zksync',
};

export const chainTypes: {[chainId: string]: ChainType} = {};

export const chainById: {[chainId: string]: Chain} = {};
const allChains = (chains as any).default || chains;
for (const key of Object.keys(allChains)) {
	const chain = (allChains as any)[key] as Chain;
	const chainId = chain.id.toString();
	const specificChainType = chainTypesByNames[key];
	if (specificChainType) {
		chainTypes[chainId] = specificChainType;
	}
	chainById[chainId] = chain;
}

const moreChains = extraChains;
for (const key of Object.keys(moreChains)) {
	const chain = (moreChains as any)[key] as Chain;
	const chainId = chain.id.toString();
	const specificChainType = chainTypesByNames[key];
	if (specificChainType) {
		chainTypes[chainId] = specificChainType;
	}
	chainById[chainId] = chain;
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
