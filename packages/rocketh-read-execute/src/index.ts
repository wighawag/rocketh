import {Abi} from 'abitype';
import {EIP1193DATA, EIP1193TransactionData, EIP1193TransactionReceipt} from 'eip-1193';
import type {Artifact, Environment, MinimalDeployment, PendingExecution} from '@rocketh/core/types';
import type {
	ContractFunctionArgs,
	ContractFunctionName,
	DecodeFunctionResultReturnType,
	ReadContractParameters,
	TransactionRequestEIP1559,
	WriteContractParameters,
} from 'viem';
// export type so viem is not needed for inference
export type {
	ContractFunctionArgs,
	ContractFunctionName,
	DecodeFunctionResultReturnType,
	ReadContractParameters,
	TransactionRequestEIP1559,
	WriteContractParameters,
};
import {decodeFunctionResult, encodeFunctionData} from 'viem';
import {logs} from 'named-logs';

const logger = logs('@rocketh/read-execute');

type TransactionData = Omit<TransactionRequestEIP1559, 'from' | 'nonce'> & {account: string};

export type ExecuteFunction = <
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
	TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'nonpayable' | 'payable',
		TFunctionName
	>
>(
	deployment: MinimalDeployment<TAbi>,
	args: ExecutionArgs<TAbi, TFunctionName, TArgs>
) => Promise<EIP1193DATA>;

export type ExecuteFunctionByName = <
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
	TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'nonpayable' | 'payable',
		TFunctionName
	>
>(
	name: string,
	args: ExecutionArgs<TAbi, TFunctionName, TArgs>
) => Promise<EIP1193DATA>;

export type ReadFunction = <
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
	TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'pure' | 'view',
		TFunctionName
	>
>(
	deployment: MinimalDeployment<TAbi>,
	args: ReadingArgs<TAbi, TFunctionName, TArgs>
) => Promise<DecodeFunctionResultReturnType<TAbi, TFunctionName>>;

export type ReadFunctionByName = <
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
	TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'pure' | 'view',
		TFunctionName
	>
>(
	name: string,
	args: ReadingArgs<TAbi, TFunctionName, TArgs>
) => Promise<DecodeFunctionResultReturnType<TAbi, TFunctionName>>;

export type TxFunction = (tx: TransactionData, options?: {message?: string}) => Promise<EIP1193DATA>;

export type ExecutionArgs<
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
	TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'nonpayable' | 'payable',
		TFunctionName
	>
> = Omit<WriteContractParameters<TAbi, TFunctionName, TArgs>, 'address' | 'abi' | 'account' | 'nonce' | 'chain'> & {
	account: string;
	message?: string;
};

export type ReadingArgs<
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
	TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'pure' | 'view',
		TFunctionName
	>
> = Omit<ReadContractParameters<TAbi, TFunctionName, TArgs>, 'address' | 'abi' | 'account' | 'nonce'> & {
	account?: string;
};

export function execute(
	env: Environment
): <
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
	TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'nonpayable' | 'payable',
		TFunctionName
	>
>(
	deployment: MinimalDeployment<TAbi>,
	args: ExecutionArgs<TAbi, TFunctionName, TArgs>
) => Promise<EIP1193TransactionReceipt> {
	return async <
		TAbi extends Abi,
		TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
		TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
			TAbi,
			'nonpayable' | 'payable',
			TFunctionName
		>
	>(
		deployment: MinimalDeployment<TAbi>,
		args: ExecutionArgs<TAbi, TFunctionName, TArgs>
	) => {
		const {account, ...viemArgs} = args;
		let address: `0x${string}`;
		if (account.startsWith('0x')) {
			address = account as `0x${string}`;
		} else {
			if (env.namedAccounts) {
				address = env.namedAccounts[account];
				if (!address) {
					throw new Error(`no address for ${account}`);
				}
			} else {
				throw new Error(`no accounts setup, cannot get address for ${account}`);
			}
		}

		const artifactToUse = deployment as unknown as Artifact<TAbi>;
		const abi = artifactToUse.abi;
		const calldata = encodeFunctionData<TAbi, TFunctionName>({
			abi,
			functionName: viemArgs.functionName,
			args: viemArgs.args,
		} as any);

		const signer = env.addressSigners[address];

		if (!signer) {
			throw new Error(`cannot get signer for ${address}`);
		}

		const txParam: EIP1193TransactionData = {
			to: deployment.address,
			type: '0x2',
			from: address,
			chainId: `0x${env.network.chain.id.toString(16)}` as `0x${string}`,
			data: calldata,
			gas: viemArgs.gas && (`0x${viemArgs.gas.toString(16)}` as `0x${string}`),
			// gasPrice: viemArgs.gasPrice && `0x${viemArgs.gasPrice.toString(16)}` as `0x${string}`,
			maxFeePerGas: viemArgs.maxFeePerGas ? (`0x${viemArgs.maxFeePerGas.toString(16)}` as `0x${string}`) : undefined,
			maxPriorityFeePerGas: viemArgs.maxPriorityFeePerGas
				? (`0x${viemArgs.maxPriorityFeePerGas.toString(16)}` as `0x${string}`)
				: undefined,
			accessList: viemArgs.accessList as any, // TODO
			// nonce: viemArgs.nonce ? (`0x${viemArgs.nonce.toString(16)}` as `0x${string}`) : undefined,
		};
		if (viemArgs.value) {
			txParam.value = `0x${viemArgs.value?.toString(16)}` as `0x${string}`;
		}

		let txHash: `0x${string}`;
		if (signer.type === 'wallet' || signer.type === 'remote') {
			txHash = await signer.signer.request({
				method: 'eth_sendTransaction',
				params: [txParam] as any, // TODO fix eip-1193 ?,,
			});
		} else {
			const rawTx = await signer.signer.request({
				method: 'eth_signTransaction',
				params: [txParam],
			});

			txHash = await env.network.provider.request({
				method: 'eth_sendRawTransaction',
				params: [rawTx],
			});
		}

		if (env.tags['auto-mine']) {
			await (env.network.provider as any).request({method: 'evm_mine', params: []});
		}

		const pendingExecution: PendingExecution = {
			type: 'execution',
			transaction: {hash: txHash, origin: address},
			// description, // TODO
			// TODO we should have the nonce, except for wallet like metamask where it is not usre you get the nonce you start with
		};
		const receipt = await env.savePendingExecution(pendingExecution, args.message);
		return receipt;
	};
}

export function executeByName(
	env: Environment
): <
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
	TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'nonpayable' | 'payable',
		TFunctionName
	>
>(
	name: string,
	args: ExecutionArgs<TAbi, TFunctionName, TArgs>
) => Promise<EIP1193TransactionReceipt> {
	return async <
		TAbi extends Abi,
		TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
		TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
			TAbi,
			'nonpayable' | 'payable',
			TFunctionName
		>
	>(
		name: string,
		args: ExecutionArgs<TAbi, TFunctionName, TArgs>
	) => {
		const deployment = env.getOrNull<TAbi>(name);
		if (!deployment) {
			throw new Error(`no deployment named ${name}`);
		}

		return execute(env)(deployment, args);
	};
}

export function read(
	env: Environment
): <
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
	TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'pure' | 'view',
		TFunctionName
	>
>(
	deployment: MinimalDeployment<TAbi>,
	args: ReadingArgs<TAbi, TFunctionName, TArgs>
) => Promise<DecodeFunctionResultReturnType<TAbi, TFunctionName>> {
	return async <
		TAbi extends Abi,
		TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
		TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
			TAbi,
			'pure' | 'view',
			TFunctionName
		>
	>(
		deployment: MinimalDeployment<TAbi>,
		args: ReadingArgs<TAbi, TFunctionName, TArgs>
	) => {
		const {account, ...viemArgs} = args;
		let address: `0x${string}` | undefined;
		if (account) {
			if (account.startsWith('0x')) {
				address = account as `0x${string}`;
			} else {
				if (env.namedAccounts) {
					address = env.namedAccounts[account];
					if (!address) {
						throw new Error(`no address for ${account}`);
					}
				} else {
					throw new Error(`no accounts setup, cannot get address for ${account}`);
				}
			}
		}

		const artifactToUse = deployment as unknown as Artifact<TAbi>;
		const abi = artifactToUse.abi;
		const calldata = encodeFunctionData<TAbi, TFunctionName>({
			abi,
			functionName: viemArgs.functionName,
			args: viemArgs.args,
		} as any);

		const result: `0x${string}` = (await env.network.provider.request({
			method: 'eth_call',
			params: [
				{
					to: deployment.address,
					type: '0x2',
					from: address,
					chainId: `0x${env.network.chain.id.toString(16)}` as `0x${string}`,
					data: calldata,
					// value: `0x${viemArgs.value?.toString(16)}` as `0x${string}`,
				},
			] as any, // TODO fix eip-1193 ?,,
		})) as `0x${string}`;

		const parsed = decodeFunctionResult<TAbi, TFunctionName>({
			abi,
			functionName: viemArgs.functionName,
			data: result,
			args: viemArgs.args,
		} as any);

		return parsed as DecodeFunctionResultReturnType<TAbi, TFunctionName>;
	};
}

export function readByName(
	env: Environment
): <
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
	TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'pure' | 'view',
		TFunctionName
	>
>(
	name: string,
	args: ReadingArgs<TAbi, TFunctionName, TArgs>
) => Promise<DecodeFunctionResultReturnType<TAbi, TFunctionName>> {
	return async <
		TAbi extends Abi,
		TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
		TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
			TAbi,
			'pure' | 'view',
			TFunctionName
		>
	>(
		name: string,
		args: ReadingArgs<TAbi, TFunctionName, TArgs>
	) => {
		const deployment = env.getOrNull<TAbi>(name);
		if (!deployment) {
			throw new Error(`no deployment named ${name}`);
		}

		return read(env)(deployment, args);
	};
}

export function tx(env: Environment): (txData: TransactionData, options?: {message?: string}) => Promise<EIP1193DATA> {
	return async (txData: TransactionData, options?: {message?: string}) => {
		const {account, ...viemArgs} = txData;
		let address: `0x${string}`;
		if (account.startsWith('0x')) {
			address = account as `0x${string}`;
		} else {
			if (env.namedAccounts) {
				address = env.namedAccounts[account];
				if (!address) {
					throw new Error(`no address for ${account}`);
				}
			} else {
				throw new Error(`no accounts setup, cannot get address for ${account}`);
			}
		}

		const signer = env.addressSigners[address];

		const txParam: EIP1193TransactionData = {
			type: '0x2',
			to: txData.to || undefined,
			from: address,
			chainId: `0x${env.network.chain.id.toString(16)}` as `0x${string}`,
			data: txData.data,
			gas: viemArgs.gas ? (`0x${viemArgs.gas.toString(16)}` as `0x${string}`) : undefined,
			maxFeePerGas: viemArgs.maxFeePerGas ? (`0x${viemArgs.maxFeePerGas.toString(16)}` as `0x${string}`) : undefined,
			maxPriorityFeePerGas: viemArgs.maxPriorityFeePerGas
				? (`0x${viemArgs.maxPriorityFeePerGas.toString(16)}` as `0x${string}`)
				: undefined,
			// nonce: viemArgs.nonce ? (`0x${viemArgs.nonce.toString(16)}` as `0x${string}`) : undefined,
			accessList: viemArgs.accessList as any, // TODO check
		};
		if (viemArgs.value) {
			txParam.value = `0x${viemArgs.value?.toString(16)}` as `0x${string}`;
		}

		let txHash: `0x${string}`;
		if (signer.type === 'wallet' || signer.type === 'remote') {
			txHash = await signer.signer.request({
				method: 'eth_sendTransaction',
				params: [txParam] as any, // TODO fix eip-1193 ?,,
			});
		} else {
			const rawTx = await signer.signer.request({
				method: 'eth_signTransaction',
				params: [txParam],
			});

			txHash = await env.network.provider.request({
				method: 'eth_sendRawTransaction',
				params: [rawTx],
			});
		}

		const pendingExecution: PendingExecution = {
			type: 'execution',
			transaction: {hash: txHash, origin: address},
			// description, // TODO
			// TODO we should have the nonce, except for wallet like metamask where it is not usre you get the nonce you start with
		};
		await env.savePendingExecution(pendingExecution, options?.message);
		return txHash;
	};
}
