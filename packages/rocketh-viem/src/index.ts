import {logs} from 'named-logs';
import type {Abi, Environment} from 'rocketh';
import {
	createPublicClient,
	createWalletClient,
	custom,
	PublicClient,
	WalletClient,
	getContract as getViemContract,
	Address,
	GetContractReturnType,
} from 'viem';

const logger = logs('@rocketh/viem');

export type ViemHandle = {
	walletClient: WalletClient;
	publicClient: PublicClient;
	// TODO any ?
	getContract<TAbi extends Abi>(name: string): GetContractReturnType<TAbi, any, Address>;
};

export function viem(env: Environment): ViemHandle {
	const walletClient = createWalletClient({
		chain: env.network.chain,
		transport: custom(env.network.provider),
	});

	const publicClient = createPublicClient({
		chain: env.network.chain,
		transport: custom(env.network.provider),
	});

	return {
		walletClient,
		publicClient,
		getContract<TAbi extends Abi>(name: string) {
			const deployment = env.get<TAbi>(name);
			return getViemContract({
				address: deployment.address,
				abi: deployment.abi,
				client: {public: publicClient, wallet: walletClient},
			}) as GetContractReturnType<TAbi, any, Address>;
		},
	};
}
