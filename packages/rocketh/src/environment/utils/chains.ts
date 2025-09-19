import * as chains from 'viem/chains';
import {kebabCase} from 'change-case';
import {
	ChainConfig,
	ChainInfo,
	ChainUserConfig,
	Create2DeterministicDeploymentInfo,
	Create3DeterministicDeploymentInfo,
	ResolvedUserConfig,
} from '../../types.js';

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
export const allChains: {[chainExportName: string]: ChainInfo} = {...((chains as any).default || chains)};
allChains['localhost'] = allChains['hardhat'];

for (const key of Object.keys(allChains)) {
	const chain = (allChains as any)[key] as ChainInfo;
	const chainId = chain.id.toString();
	const specificChainType = chainTypesByNames[key];
	if (specificChainType) {
		chainTypes[chainId] = specificChainType;
	}
	chainById[chainId] = {...chain, chainType: specificChainType};
}

export const chainByCanonicalName: {[canonicalName: string]: ChainInfo} = {};
for (const key of Object.keys(chainById)) {
	const chain = (chainById as any)[key] as ChainInfo;
	const canonicalName = kebabCase(chain.name);
	chainByCanonicalName[canonicalName] = chain;
}

export function getChainById(id: string | number): ChainInfo | undefined {
	const chain = chainById['' + id];

	return chain;
}

export function getChainByName(name: string): ChainInfo | undefined {
	const chain = chainByCanonicalName[name];
	return chain;
}

export function getChainConfig(id: number, config: ResolvedUserConfig): ChainConfig {
	const defaultChainInfo = getChainById(id);
	const canonicalName = defaultChainInfo ? kebabCase(defaultChainInfo.name) : undefined;
	if (canonicalName) {
		if (config.chains?.[id] && config.chains?.[canonicalName]) {
			throw new Error(
				`chain should be configured by chainId or name but not both, remove either ${id} or ${canonicalName}`
			);
		}
	}

	let chainConfig: ChainUserConfig | undefined = config.chains?.[id];
	if (!chainConfig && canonicalName) {
		chainConfig = config.chains?.[canonicalName];
	}
	if (!chainConfig) {
		chainConfig = {info: defaultChainInfo};
	}

	let chainInfo = chainConfig?.info || defaultChainInfo;

	let rpcUrl = process.env['ETH_NODE_URI_' + id];
	if (canonicalName) {
		const fromEnv = process.env['ETH_NODE_URI_' + canonicalName];
		if (fromEnv) {
			rpcUrl = fromEnv;
		}
	}

	if (!rpcUrl) {
		rpcUrl = chainConfig.rpcUrl;
	}

	if (!rpcUrl) {
		rpcUrl = chainConfig.info?.rpcUrls.default.http[0];
	}

	if (!rpcUrl) {
		if (id === 31337 || id === 1337) {
			rpcUrl = 'http://127.0.0.1:8545';
		}
	}

	if (!chainInfo) {
		if (!rpcUrl) {
			throw new Error(`no chain info found for chain with id ${id}`);
		} else {
			console.error(`chain with id ${id} has no public info`);
		}

		chainInfo = {
			id,
			name: 'unkwown',
			nativeCurrency: {
				name: 'Unknown Currency',
				symbol: 'UNKNOWN',
				decimals: 18,
			},
			rpcUrls: {
				default: {
					http: [rpcUrl],
				},
			},
			chainType: 'default',
		};
	}

	const create2Info = {
		factory: '0x4e59b44847b379578588920ca78fbf26c0b4956c',
		deployer: '0x3fab184622dc19b6109349b94811493bf2a45362',
		funding: '10000000000000000',
		signedTx:
			'0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf31ba02222222222222222222222222222222222222222222222222222222222222222a02222222222222222222222222222222222222222222222222222222222222222',
	} as const;
	const create3Info = {
		factory: '0x000000000004d4f168daE7DB3C610F408eE22F57',
		salt: '0x5361109ca02853ca8e22046b7125306d9ec4ae4cdecc393c567b6be861df3db6',
		bytecode:
			'0x6080604052348015600f57600080fd5b506103ca8061001f6000396000f3fe6080604052600436106100295760003560e01c8063360d0fad1461002e5780639881d19514610077575b600080fd5b34801561003a57600080fd5b5061004e610049366004610228565b61008a565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b61004e61008536600461029c565b6100ee565b6040517fffffffffffffffffffffffffffffffffffffffff000000000000000000000000606084901b166020820152603481018290526000906054016040516020818303038152906040528051906020012091506100e78261014c565b9392505050565b6040517fffffffffffffffffffffffffffffffffffffffff0000000000000000000000003360601b166020820152603481018290526000906054016040516020818303038152906040528051906020012091506100e734848461015e565b600061015882306101ce565b92915050565b60006f67363d3d37363d34f03d5260086018f3600052816010806000f58061018e5763301164256000526004601cfd5b8060145261d69460005260016034536017601e20915060008085516020870188855af1823b026101c65763301164256000526004601cfd5b509392505050565b60006040518260005260ff600b53836020527f21c35dbe1b344a2488cf3321d6ce542f8e9f305544ff09e4993a62319a497c1f6040526055600b20601452806040525061d694600052600160345350506017601e20919050565b6000806040838503121561023b57600080fd5b823573ffffffffffffffffffffffffffffffffffffffff8116811461025f57600080fd5b946020939093013593505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600080604083850312156102af57600080fd5b823567ffffffffffffffff8111156102c657600080fd5b8301601f810185136102d757600080fd5b803567ffffffffffffffff8111156102f1576102f161026d565b6040517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0603f7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f8501160116810181811067ffffffffffffffff8211171561035d5761035d61026d565b60405281815282820160200187101561037557600080fd5b816020840160208301376000602092820183015296940135945050505056fea264697066735822122059dcc5dc6453397d13ff28021e28472a80a45bbd97f3135f69bd2650773aeb0164736f6c634300081a0033',
		proxyBytecode: '0x67363d3d37363d34f03d5260086018f3',
	} as const;

	const pollingInterval = chainConfig.pollingInterval || config.defaultPollingInterval;

	let deterministicDeployment: {
		create2: Create2DeterministicDeploymentInfo;
		create3: Create3DeterministicDeploymentInfo;
	} = {
		create2: (() => {
			if (!chainConfig.deterministicDeployment) return create2Info;
			if (!('create3' in chainConfig.deterministicDeployment) && !('create2' in chainConfig.deterministicDeployment))
				return create2Info;
			return chainConfig.deterministicDeployment.create2 || create2Info;
		})(),
		create3:
			chainConfig.deterministicDeployment &&
			'create3' in chainConfig.deterministicDeployment &&
			chainConfig.deterministicDeployment.create3
				? chainConfig.deterministicDeployment.create3
				: create3Info,
	};

	const defaultTags: string[] = [];
	if (chainInfo.testnet) {
		defaultTags.push('testnet');
	}

	return {
		info: {...chainInfo},
		deterministicDeployment,
		pollingInterval,
		properties: chainConfig.properties || {},
		rpcUrl: rpcUrl || chainInfo.rpcUrls.default.http[0],
		tags: chainConfig.tags || [...defaultTags],
	};
}
