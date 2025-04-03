import type {Chain} from 'viem/chains';
import * as chains from 'viem/chains';
import {ResolvedConfig} from '../types.js';

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

export function getChain(id: string): Chain | undefined {
	const chain = chainById[id];

	return chain;
}

export function getChainWithConfig(id: string, config: ResolvedConfig): Chain {
	const chain = getChain(id);

	if (!chain) {
		if (config.network.publicInfo) {
			return {
				id: parseInt(id),
				...config.network.publicInfo,
			};
		}
		console.error(`network ${config.network.name} has no public info`);
		let nodeUrl: string | undefined;
		if (!config.network.nodeUrl) {
			console.error(`no nodeUrl found either for ${config.network.name}`);
		} else {
			nodeUrl = config.network.nodeUrl;
		}
		return {
			id: parseInt(id),
			name: 'unkwown',
			nativeCurrency: {
				name: 'Unknown Currency',
				symbol: 'UNKNOWN',
				decimals: 18,
			},
			rpcUrls: {
				default: {
					http: nodeUrl ? [nodeUrl] : [],
				},
			},
		};
	}
	return chain;
}
