import type {Chain} from 'viem/chains';
import * as chains from 'viem/chains';
import {ResolvedConfig} from '../types.js';
import {kebabCase} from 'change-case';
import {ChainInfo} from '../../executor/types.js';

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

export const chainById: {[chainId: string]: ChainInfo} = {};
export const allChains = {...((chains as any).default || chains)};
allChains['localhost'] = allChains['hardhat'];

for (const key of Object.keys(allChains)) {
	const chain = (allChains as any)[key] as ChainInfo;
	const chainId = chain.id.toString();
	const specificChainType = chainTypesByNames[key];
	if (specificChainType) {
		chainTypes[chainId] = specificChainType;
	}
	chainById[chainId] = chain;
}

export const chainByCanonicalName: {[canonicalName: string]: ChainInfo} = {};
for (const key of Object.keys(allChains)) {
	const chain = (allChains as any)[key] as ChainInfo;
	const canonicalName = kebabCase(chain.name);
	chainByCanonicalName[canonicalName] = chain;
}

export function getChain(id: string | number): ChainInfo | undefined {
	const chain = chainById['' + id];

	return chain;
}

export function getChainByName(name: string): ChainInfo | undefined {
	const chain = chainByCanonicalName[name];
	return chain;
}

export function getChainWithConfig(id: string, config: ResolvedConfig): ChainInfo {
	if (config.target.chainInfo) {
		return config.target.chainInfo;
	}

	const chain = getChain(id);
	if (chain) {
		return chain;
	}
	console.error(`network ${config.target.name} has no public info`);
	let nodeUrl: string | undefined;
	if (!('nodeUrl' in config.target)) {
		console.error(`no nodeUrl found either for ${config.target.name}`);
	} else {
		nodeUrl = config.target.nodeUrl;
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
		chainType: 'default',
	};
}
