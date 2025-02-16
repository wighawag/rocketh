import {HardhatRuntimeEnvironment} from '@ignored/hardhat-vnext/types/hre';
import {Environment, ProvidedContext, UnknownArtifacts, UnresolvedUnknownNamedAccounts, loadEnvironment} from 'rocketh';

export async function loadEnvironmentFromHardhat<
	Artifacts extends UnknownArtifacts = UnknownArtifacts,
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts
>(
	{hre, context}: {hre: HardhatRuntimeEnvironment; context?: ProvidedContext<Artifacts, NamedAccounts>},
	options?: {
		useChainIdOfForkedNetwork?: boolean;
	}
): Promise<Environment> {
	const connection = await hre.network.connect();
	let provider: any = connection.provider;
	let network: string | {fork: string} = connection.networkName;
	let forkChainId: number | undefined;
	const fork = process.env.HARDHAT_FORK as string | undefined;
	if (fork) {
		if (options?.useChainIdOfForkedNetwork) {
			const forkNetworkConfig = hre.config.networks[fork];

			if (forkNetworkConfig.type === 'edr') {
				forkChainId = forkNetworkConfig.chainId;
			} else if (forkNetworkConfig.chainId) {
				forkChainId = forkNetworkConfig.chainId;
			} else {
				if ('url' in forkNetworkConfig) {
					const url = await forkNetworkConfig.url.getUrl();
					const response = await fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							jsonrpc: '2.0',
							id: 1,
							method: 'eth_chainId',
							params: [],
						}),
					});
					const json = (await response.json()) as {result: string};
					forkChainId = Number(json.result);
				} else {
					throw new Error(`cannot fetch chainId`);
				}
			}
		}

		network = {
			fork,
		};
	}

	if (forkChainId) {
		const originalProvider = provider;
		const chainId = forkChainId;
		async function request(args: {method: string; params?: string[]}): Promise<any> {
			if (args.method === 'eth_chainId') {
				return `0x${chainId.toString(16)}`;
			}
			return originalProvider.request(args);
		}
		provider = new Proxy(originalProvider, {
			get: function (target, property, receiver) {
				switch (property) {
					case 'request':
						return request;
					default:
						return originalProvider[property];
				}
			},
		});
	}

	return loadEnvironment(
		{
			provider,
			network,
		},
		context || {artifacts: {} as any} // TODO
	);
}
