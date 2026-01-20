import {logs} from 'named-logs';
import type {Abi, Deployment, Environment} from '@rocketh/core/types';
import {
	createPublicClient,
	createWalletClient,
	custom,
	PublicClient,
	WalletClient,
	getContract as getViemContract,
	Address,
	GetContractReturnType,
	Transport,
	Chain,
	Account,
	Client,
	CustomTransport,
} from 'viem';

const logger = logs('@rocketh/viem');

type KeyedClient<
	transport extends Transport = Transport,
	// chain extends Chain | undefined = Chain | undefined,
	// account extends Account | undefined = Account | undefined
> = {
	public: Client<transport, Chain>;
	wallet: Client<transport, Chain, Account>;
};

type ReadonlyKeyedClient<transport extends Transport = Transport> = {
	public: Client<transport, Chain>;
};

export type ViemWritableContract<TAbi extends Abi> = GetContractReturnType<TAbi, KeyedClient<CustomTransport>, Address>;
export type ViemContract<TAbi extends Abi> = GetContractReturnType<TAbi, ReadonlyKeyedClient<CustomTransport>, Address>;

export type ViemHandle = {
	walletClient: WalletClient;
	publicClient: PublicClient;
	getContract<TAbi extends Abi>(name: string | Deployment<TAbi>): ViemContract<TAbi>;
	getWritableContract<TAbi extends Abi>(name: string | Deployment<TAbi>): ViemWritableContract<TAbi>;
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
		getWritableContract<TAbi extends Abi>(
			name: string | Deployment<TAbi>,
			options?: {
				account?: `0x${string}`;
			},
		) {
			const deployment = typeof name === 'string' ? env.get<TAbi>(name) : name;
			let contractWalletClient: WalletClient<Transport> = walletClient;
			if (options?.account) {
				contractWalletClient = createWalletClient({
					chain: env.network.chain,
					transport: custom(env.network.provider),
					account: options.account,
				});
			}
			const contract = getViemContract({
				address: deployment.address,
				abi: deployment.abi,
				client: {public: publicClient, wallet: contractWalletClient},
			}) as ViemWritableContract<TAbi>;
			return contract;
		},
		getContract<TAbi extends Abi>(name: string | Deployment<TAbi>) {
			const deployment = typeof name === 'string' ? env.get<TAbi>(name) : name;
			return getViemContract({
				address: deployment.address,
				abi: deployment.abi,
				client: {public: publicClient},
			}) as ViemContract<TAbi>;
		},
	};
}
