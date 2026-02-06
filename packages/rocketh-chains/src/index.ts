import * as chains from 'viem/chains';
import {kebabCase} from 'change-case';
import type {
	ChainConfig,
	ChainInfo,
	ChainUserConfig,
	Create2DeterministicDeploymentInfo,
	Create3DeterministicDeploymentInfo,
	ResolvedUserConfig,
} from '@rocketh/core/types';

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

const chainTypes: {[chainId: string]: ChainType} = {};

const chainById: {[chainId: string]: ChainInfo[]} = {};
const allChains: {[chainExportName: string]: ChainInfo} = {...((chains as any).default || chains)};
allChains['localhost'] = {...allChains['hardhat'], name: 'localhost'};

for (const key of Object.keys(allChains)) {
	const chain = (allChains as any)[key] as ChainInfo;
	const chainId = chain.id.toString();
	const specificChainType = chainTypesByNames[key];
	if (specificChainType) {
		chainTypes[chainId] = specificChainType;
	}
	const list = (chainById[chainId] = chainById[chainId] || []);
	list.push({...chain, chainType: specificChainType});
}

export const chainByCanonicalName: {[canonicalName: string]: ChainInfo} = {};
for (const key of Object.keys(allChains)) {
	const chain = (allChains as any)[key] as ChainInfo;
	const canonicalName = kebabCase(chain.name);
	chainByCanonicalName[canonicalName] = chain;
}

function getChainsById(id: string | number): ChainInfo[] | undefined {
	const chains = chainById['' + id];

	return chains;
}

export function getDefaultChainInfoByName(name: string): ChainInfo | undefined {
	const chain = chainByCanonicalName[name];
	return chain;
}

// function getCanonicalNameFromChainId(id: string | number): string | undefined {
// 	let defaultChainInfo: ChainInfo | undefined;
// 	const defaultChainInfos = getChainsById(id);
// 	if (defaultChainInfos && defaultChainInfos.length > 1) {
// 		console.error(
// 			`chainId ${id} refers to different chain, please specific it by name or provide the chainConfig yourself`
// 		);
// 	} else {
// 		defaultChainInfo = defaultChainInfos ? defaultChainInfos[0] : undefined;
// 	}
// 	const canonicalName = defaultChainInfo ? kebabCase(defaultChainInfo.name) : undefined;
// 	return canonicalName;
// }

export function getDefaultChainInfoFromChainId(
	id: string | number,
): {success: true; chainInfo: ChainInfo} | {success: false; error?: string} {
	let defaultChainInfo: ChainInfo | undefined;
	const defaultChainInfos = getChainsById(id);
	if (defaultChainInfos && defaultChainInfos.length > 1) {
		return {
			success: false,
			error: `chainId ${id} refers to different chains, please specify it by name or provide the chainConfig yourself`,
		};
	} else {
		defaultChainInfo = defaultChainInfos ? defaultChainInfos[0] : undefined;
	}
	return defaultChainInfo ? {success: true, chainInfo: defaultChainInfo} : {success: false};
}
