import {
	ChainConfig,
	ChainInfo,
	Create2DeterministicDeploymentInfo,
	Create3DeterministicDeploymentInfo,
	EIP1193ProviderWithoutEvents,
	ResolvedUserConfig,
} from '../types.js';

/** Chain ids that are considered ephemeral/dev (resettable) by convention. */
const KNOWN_DEV_CHAIN_IDS = new Set([1337, 31337]);

/**
 * The DEPLOYMENT SEMANTICS and policy half of a chain's configuration: what a run DOES, as
 * opposed to what it CONNECTS to (the rpc url / provider) or what it IS (`info`, whose id every
 * transaction declares).
 *
 * It is a half rather than the whole because a FORK run answers those questions from two
 * different chains: the semantics come from the network being SIMULATED and the connection from
 * the local node it is CONNECTED to (`docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md`).
 */
export type ChainSemantics = Pick<
	ChainConfig,
	'tags' | 'deterministicDeployment' | 'autoImpersonate' | 'onUnknownSigner' | 'autoMine' | 'confirmationsRequired'
>;

/**
 * Read a chain's deployment semantics and policy, defaulted.
 *
 * Deliberately SILENT and total: it neither warns nor throws for a chain nobody described, unlike
 * `getChainConfigFromUserConfig`, which must produce an `info` and a way to reach a node and says
 * so when it cannot. A fork of a network with no `chains` entry gets these built-in defaults, and
 * that absence is not a misconfiguration worth a notice: it is strictly better than the previous
 * behaviour, which applied the LOCAL node's configuration to a rehearsal of another network.
 */
export function getChainSemanticsFromUserConfig(config: ResolvedUserConfig, id: number): ChainSemantics {
	const chainConfig = config.chains?.[id];

	const defaultCreate2Info = {
		factory: '0x4e59b44847b379578588920ca78fbf26c0b4956c',
		deployer: '0x3fab184622dc19b6109349b94811493bf2a45362',
		funding: '10000000000000000',
		signedTx:
			'0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf31ba02222222222222222222222222222222222222222222222222222222222222222a02222222222222222222222222222222222222222222222222222222222222222',
	} as const;
	const defaultCreate3Info = {
		factory: '0x000000000004d4f168daE7DB3C610F408eE22F57',
		salt: '0x5361109ca02853ca8e22046b7125306d9ec4ae4cdecc393c567b6be861df3db6',
		bytecode:
			'0x6080604052348015600f57600080fd5b506103ca8061001f6000396000f3fe6080604052600436106100295760003560e01c8063360d0fad1461002e5780639881d19514610077575b600080fd5b34801561003a57600080fd5b5061004e610049366004610228565b61008a565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b61004e61008536600461029c565b6100ee565b6040517fffffffffffffffffffffffffffffffffffffffff000000000000000000000000606084901b166020820152603481018290526000906054016040516020818303038152906040528051906020012091506100e78261014c565b9392505050565b6040517fffffffffffffffffffffffffffffffffffffffff0000000000000000000000003360601b166020820152603481018290526000906054016040516020818303038152906040528051906020012091506100e734848461015e565b600061015882306101ce565b92915050565b60006f67363d3d37363d34f03d5260086018f3600052816010806000f58061018e5763301164256000526004601cfd5b8060145261d69460005260016034536017601e20915060008085516020870188855af1823b026101c65763301164256000526004601cfd5b509392505050565b60006040518260005260ff600b53836020527f21c35dbe1b344a2488cf3321d6ce542f8e9f305544ff09e4993a62319a497c1f6040526055600b20601452806040525061d694600052600160345350506017601e20919050565b6000806040838503121561023b57600080fd5b823573ffffffffffffffffffffffffffffffffffffffff8116811461025f57600080fd5b946020939093013593505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600080604083850312156102af57600080fd5b823567ffffffffffffffff8111156102c657600080fd5b8301601f810185136102d757600080fd5b803567ffffffffffffffff8111156102f1576102f161026d565b6040517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0603f7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f8501160116810181811067ffffffffffffffff8211171561035d5761035d61026d565b60405281815282820160200187101561037557600080fd5b816020840160208301376000602092820183015296940135945050505056fea264697066735822122059dcc5dc6453397d13ff28021e28472a80a45bbd97f3135f69bd2650773aeb0164736f6c634300081a0033',
		proxyBytecode: '0x67363d3d37363d34f03d5260086018f3',
	} as const;

	const deterministicDeployment: {
		create2: Create2DeterministicDeploymentInfo;
		create3: Create3DeterministicDeploymentInfo;
	} = {
		create2: (() => {
			const deterministicDeployment = chainConfig?.deterministicDeployment;
			if (!deterministicDeployment) {
				return defaultCreate2Info;
			}

			return 'create2' in deterministicDeployment && deterministicDeployment.create2
				? deterministicDeployment.create2
				: !('create2' in deterministicDeployment) && !('create3' in deterministicDeployment)
					? (deterministicDeployment as Create2DeterministicDeploymentInfo)
					: defaultCreate2Info;
		})(),
		create3:
			chainConfig?.deterministicDeployment &&
			'create3' in chainConfig.deterministicDeployment &&
			chainConfig.deterministicDeployment.create3
				? chainConfig.deterministicDeployment.create3
				: defaultCreate3Info,
	};

	const defaultTags: string[] = [];
	if (chainConfig?.info?.testnet) {
		defaultTags.push('testnet');
	}

	return {
		deterministicDeployment,
		tags: chainConfig?.tags || defaultTags,
		autoImpersonate: chainConfig?.autoImpersonate || false,
		// passed through UNDEFAULTED: the `'auto'` default lives in `resolveExecutionParams`
		onUnknownSigner: chainConfig?.onUnknownSigner,
		autoMine: chainConfig?.autoMine || false,
		confirmationsRequired: chainConfig?.confirmationsRequired,
	};
}

export function getChainConfigFromUserConfig(
	config: ResolvedUserConfig,
	id: number,
	provider?: EIP1193ProviderWithoutEvents,
): ChainConfig {
	const chainConfig = config.chains?.[id];

	const semantics = getChainSemanticsFromUserConfig(config, id);

	const pollingInterval = chainConfig?.pollingInterval || config.defaultPollingInterval;

	const properties = chainConfig?.properties || config.defaultChainProperties || {};

	// WARN, not error: the very next lines build `defaultChainInfo` and the run carries on, so
	// this is a handled and expected condition (any chain nobody described). It stayed at error
	// severity long enough for a docs widget that captures the console to paint a red failure
	// line through a completely successful deploy.
	//
	// It stays on `console` rather than moving to the `named-logs` logger used elsewhere in this
	// package: `logs()` returns a permanent no-op unless something has hooked a factory FIRST,
	// and only the `@rocketh/node` CLI and `hardhat-deploy` do. Routing this through the logger
	// would delete the message for every browser and programmatic consumer, which is exactly who
	// reaches this branch. See `docs/adr/0009-user-facing-notices-stay-on-console.md`.
	if (!chainConfig?.info) {
		console.warn(
			`chain with id ${id}${chainConfig ? ' has a chain config but' : ''} has no public info: ` +
				`falling back to placeholder metadata (name 'unknown', symbol 'UNKNOWN')`,
		);
	}

	const rpcUrl = chainConfig?.rpcUrl || chainConfig?.info?.rpcUrls.default.http[0];

	const defaultChainInfo: ChainInfo = {
		id: id,
		name: 'unknown',
		nativeCurrency: {
			name: 'Unknown Currency',
			symbol: 'UNKNOWN',
			decimals: 18,
		},
		rpcUrls: {
			default: {
				http: rpcUrl ? [rpcUrl] : [],
			},
		},
		chainType: 'default',
	};

	if (provider) {
		return {
			...semantics,
			info: chainConfig?.info || defaultChainInfo,
			pollingInterval,
			properties,
			provider,
			deleteDeploymentsIfDifferentGenesisHash:
				chainConfig?.deleteDeploymentsIfDifferentGenesisHash ?? KNOWN_DEV_CHAIN_IDS.has(id),
		};
	} else if (rpcUrl) {
		return {
			...semantics,
			info: chainConfig?.info || defaultChainInfo,
			pollingInterval,
			properties,
			rpcUrl: rpcUrl,
			deleteDeploymentsIfDifferentGenesisHash:
				chainConfig?.deleteDeploymentsIfDifferentGenesisHash ?? KNOWN_DEV_CHAIN_IDS.has(id),
		};
	} else {
		throw new Error(`chain with id ${id} has no rpc url provided nor any provider to use`);
	}
}
