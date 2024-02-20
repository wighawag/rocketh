import {Abi} from 'abitype';
import {EIP1193DATA, EIP1193TransactionData} from 'eip-1193';
import type {
	Artifact,
	DeploymentConstruction,
	Deployment,
	Environment,
	PendingDeployment,
	PartialDeployment,
	PendingExecution,
	NamedSigner,
} from 'rocketh';
import {extendEnvironment} from 'rocketh';
import {
	Chain,
	ContractFunctionArgs,
	ContractFunctionName,
	DecodeFunctionResultReturnType,
	EncodeDeployDataParameters,
	ReadContractParameters,
	WriteContractParameters,
	decodeFunctionResult,
	encodeFunctionData,
	keccak256,
} from 'viem';
import {DeployContractParameters, encodeDeployData} from 'viem';
import {logs} from 'named-logs';
import {ContractConstructorArgs} from 'viem/_types/types/contract';

const logger = logs('rocketh-deploy');

declare module 'rocketh' {
	interface Environment {
		deploy: DeployFunction;
		execute: ExecuteFunction;
		read: ReadFunction;
		executeByName: ExecuteFunctionByName;
		readByName: ReadFunctionByName;
	}
}

export type DeployFunction = <TAbi extends Abi, TChain extends Chain = Chain>(
	name: string,
	args: DeploymentConstruction<TAbi>,
	options?: DeployOptions
) => Promise<Deployment<TAbi>>;

export type ExecuteFunction = <
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
	TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'nonpayable' | 'payable',
		TFunctionName
	>
>(
	deployment: Deployment<TAbi>,
	args: Omit<WriteContractParameters<TAbi, TFunctionName, TArgs>, 'address' | 'abi' | 'account' | 'nonce' | 'chain'> & {
		account: string;
	}
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
	args: Omit<WriteContractParameters<TAbi, TFunctionName, TArgs>, 'address' | 'abi' | 'account' | 'nonce' | 'chain'> & {
		account: string;
	}
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
	deployment: Deployment<TAbi>,
	args: Omit<ReadContractParameters<TAbi, TFunctionName, TArgs>, 'address' | 'abi' | 'account' | 'nonce'> & {
		account?: string;
	}
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
	args: Omit<ReadContractParameters<TAbi, TFunctionName, TArgs>, 'address' | 'abi' | 'account' | 'nonce'> & {
		account?: string;
	}
) => Promise<DecodeFunctionResultReturnType<TAbi, TFunctionName>>;

export type DeployOptions = {linkedData?: any; deterministic?: boolean | `0x${string}`} & (
	| {
			skipIfAlreadyDeployed?: boolean;
	  }
	| {
			alwaysOverride?: boolean;
	  }
);

async function broadcastTransaction(
	env: Environment,
	signer: NamedSigner,
	params: [EIP1193TransactionData]
): Promise<`0x${string}`> {
	if (signer.type === 'wallet' || signer.type === 'remote') {
		return signer.signer.request({
			method: 'eth_sendTransaction',
			params,
		});
	} else {
		const rawTx = await signer.signer.request({
			method: 'eth_signTransaction',
			params,
		});

		return env.network.provider.request({
			method: 'eth_sendRawTransaction',
			params: [rawTx],
		});
	}
}

extendEnvironment((env: Environment) => {
	async function execute<
		TAbi extends Abi,
		TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
		TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
			TAbi,
			'nonpayable' | 'payable',
			TFunctionName
		>
	>(
		deployment: Deployment<TAbi>,
		args: Omit<
			WriteContractParameters<TAbi, TFunctionName, TArgs>,
			'address' | 'abi' | 'account' | 'nonce' | 'chain'
		> & {
			account: string;
		}
	) {
		const {account, ...viemArgs} = args;
		let address: `0x${string}`;
		if (account.startsWith('0x')) {
			address = account as `0x${string}`;
		} else {
			if (env.accounts) {
				address = env.accounts[account];
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

		let txHash: `0x${string}`;
		if (signer.type === 'wallet' || signer.type === 'remote') {
			txHash = await signer.signer.request({
				method: 'eth_sendTransaction',
				params: [
					{
						to: deployment.address,
						type: '0x2',
						from: address,
						chainId: `0x${env.network.chain.id.toString(16)}` as `0x${string}`,
						data: calldata,
						gas: viemArgs.gas && (`0x${viemArgs.gas.toString(16)}` as `0x${string}`),
						// gasPrice: viemArgs.gasPrice && `0x${viemArgs.gasPrice.toString(16)}` as `0x${string}`,
						maxFeePerGas: viemArgs.maxFeePerGas && (`0x${viemArgs.maxFeePerGas.toString(16)}` as `0x${string}`),
						maxPriorityFeePerGas:
							viemArgs.maxPriorityFeePerGas && (`0x${viemArgs.maxPriorityFeePerGas.toString(16)}` as `0x${string}`),
						// value: `0x${viemArgs.value?.toString(16)}` as `0x${string}`,
						// nonce: viemArgs.nonce && (`0x${viemArgs.nonce.toString(16)}` as `0x${string}`),
					},
				],
			});
		} else {
			const rawTx = await signer.signer.request({
				method: 'eth_signTransaction',
				params: [
					{
						to: deployment.address,
						type: '0x2',
						from: address,
						chainId: `0x${env.network.chain.id.toString(16)}` as `0x${string}`,
						data: calldata,
						gas: viemArgs.gas && (`0x${viemArgs.gas.toString(16)}` as `0x${string}`),
						// gasPrice: viemArgs.gasPrice && `0x${viemArgs.gasPrice.toString(16)}` as `0x${string}`,
						maxFeePerGas: viemArgs.maxFeePerGas && (`0x${viemArgs.maxFeePerGas.toString(16)}` as `0x${string}`),
						maxPriorityFeePerGas:
							viemArgs.maxPriorityFeePerGas && (`0x${viemArgs.maxPriorityFeePerGas.toString(16)}` as `0x${string}`),
						// value: `0x${viemArgs.value?.toString(16)}` as `0x${string}`,
						// nonce: viemArgs.nonce && (`0x${viemArgs.nonce.toString(16)}` as `0x${string}`),
					},
				],
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
		await env.savePendingExecution(pendingExecution);
		return txHash;
	}

	async function executeByName<
		TAbi extends Abi,
		TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
		TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
			TAbi,
			'nonpayable' | 'payable',
			TFunctionName
		>
	>(
		name: string,
		args: Omit<
			WriteContractParameters<TAbi, TFunctionName, TArgs>,
			'address' | 'abi' | 'account' | 'nonce' | 'chain'
		> & {
			account: string;
		}
	) {
		const deployment = env.get(name) as Deployment<TAbi>;
		if (!deployment) {
			throw new Error(`no deployment named ${name}`);
		}

		return execute(deployment, args);
	}

	async function read<
		TAbi extends Abi,
		TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
		TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
			TAbi,
			'pure' | 'view',
			TFunctionName
		>
	>(
		deployment: Deployment<TAbi>,
		args: Omit<ReadContractParameters<TAbi, TFunctionName, TArgs>, 'address' | 'abi' | 'account' | 'nonce'> & {
			account?: string;
		}
	): Promise<DecodeFunctionResultReturnType<TAbi, TFunctionName>> {
		const {account, ...viemArgs} = args;
		let address: `0x${string}` | undefined;
		if (account) {
			if (account.startsWith('0x')) {
				address = account as `0x${string}`;
			} else {
				if (env.accounts) {
					address = env.accounts[account];
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
			],
		})) as `0x${string}`;

		const parsed = decodeFunctionResult<TAbi, TFunctionName>({
			abi,
			functionName: viemArgs.functionName,
			data: result,
			args: viemArgs.args,
		} as any);

		return parsed as DecodeFunctionResultReturnType<TAbi, TFunctionName>;
	}

	async function readByName<
		TAbi extends Abi,
		TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
		TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
			TAbi,
			'pure' | 'view',
			TFunctionName
		>
	>(
		name: string,
		args: Omit<ReadContractParameters<TAbi, TFunctionName, TArgs>, 'address' | 'abi' | 'account' | 'nonce'> & {
			account?: string;
		}
	): Promise<DecodeFunctionResultReturnType<TAbi, TFunctionName>> {
		const deployment = env.get(name) as Deployment<TAbi>;
		if (!deployment) {
			throw new Error(`no deployment named ${name}`);
		}

		return read(deployment, args);
	}
	async function deploy<TAbi extends Abi>(
		name: string,
		args: DeploymentConstruction<TAbi>,
		options?: DeployOptions
	): Promise<Deployment<TAbi>> {
		const skipIfAlreadyDeployed = options && 'skipIfAlreadyDeployed' in options && options.skipIfAlreadyDeployed;
		const allwaysOverride = options && 'allwaysOverride' in options && options.allwaysOverride;

		if (allwaysOverride && skipIfAlreadyDeployed) {
			throw new Error(`conflicting options: "allwaysOverride" and "skipIfAlreadyDeployed"`);
		}

		const existingDeployment = env.get(name);
		if (existingDeployment && skipIfAlreadyDeployed) {
			logger.info(`deployment for ${name} at ${existingDeployment.address}, skipIfAlreadyDeployed: true => we skip`);
			return existingDeployment as Deployment<TAbi>;
		}

		const {account, artifact, ...viemArgs} = args;
		let address: `0x${string}`;
		if (account.startsWith('0x')) {
			address = account as `0x${string}`;
		} else {
			if (env.accounts) {
				address = env.accounts[account];
				if (!address) {
					throw new Error(`no address for ${account}`);
				}
			} else {
				throw new Error(`no accounts setup, cannot get address for ${account}`);
			}
		}

		// TODO throw specific error if artifact not found
		const artifactToUse = (typeof artifact === 'string' ? env.artifacts[artifact] : artifact) as Artifact<TAbi>;

		const bytecode = artifactToUse.bytecode;
		const abi = artifactToUse.abi;

		const argsToUse = {
			...viemArgs,
			account,
			abi,
			bytecode,
		};

		const calldata = encodeDeployData(argsToUse as any); // TODO any
		const argsData = `0x${calldata.replace(bytecode, '')}` as `0x${string}`;

		if (existingDeployment) {
			logger.info(`existing deployment for ${name} at ${existingDeployment.address}`);
		}

		if (existingDeployment && !allwaysOverride) {
			const previousBytecode = existingDeployment.bytecode;
			const previousArgsData = existingDeployment.argsData;
			// we assume cbor encoding of hash at the end
			// TODO option to remove it, can parse metadata but would rather avoid this here
			const last2Bytes = previousBytecode.slice(-4);
			const cborLength = parseInt(last2Bytes, 16);
			const previousBytecodeWithoutCBOR = previousBytecode.slice(0, -cborLength * 2);
			const newBytecodeWithoutCBOR = bytecode.slice(0, -cborLength * 2);
			if (previousBytecodeWithoutCBOR === newBytecodeWithoutCBOR && previousArgsData === argsData) {
				return existingDeployment as Deployment<TAbi>;
			} else {
				// logger.info(`-------------- WITHOUT CBOR---------------------`);
				// logger.info(previousBytecodeWithoutCBOR);
				// logger.info(newBytecodeWithoutCBOR);
				// logger.info(`-----------------------------------`);
				// logger.info(`-------------- ARGS DATA ---------------------`);
				// logger.info(previousArgsData);
				// logger.info(argsData);
				// logger.info(`-----------------------------------`);
			}
		}

		const partialDeployment: PartialDeployment<TAbi> = {
			...artifactToUse,
			argsData,
			linkedData: options?.linkedData,
		};

		const signer = env.addressSigners[address];

		const chainId = `0x${env.network.chain.id.toString(16)}` as `0x${string}`;
		const maxFeePerGas = viemArgs.maxFeePerGas && (`0x${viemArgs.maxFeePerGas.toString(16)}` as `0x${string}`);
		const maxPriorityFeePerGas =
			viemArgs.maxPriorityFeePerGas && (`0x${viemArgs.maxPriorityFeePerGas.toString(16)}` as `0x${string}`);

		const params: [EIP1193TransactionData] = [
			{
				type: '0x2',
				from: address,
				chainId,
				data: calldata,
				gas: viemArgs.gas && (`0x${viemArgs.gas.toString(16)}` as `0x${string}`),
				maxFeePerGas,
				maxPriorityFeePerGas,
				// gasPrice: viemArgs.gasPrice && `0x${viemArgs.gasPrice.toString(16)}` as `0x${string}`,
				// value: `0x${viemArgs.value?.toString(16)}` as `0x${string}`,
				// nonce: viemArgs.nonce && (`0x${viemArgs.nonce.toString(16)}` as `0x${string}`),
			},
		];

		let expectedAddress: `0x${string}` | undefined = undefined;
		if (options?.deterministic) {
			// TODO make these configurable
			const deterministicFactoryAddress = `0x4e59b44847b379578588920ca78fbf26c0b4956c`;
			const deterministicFactoryDeployerAddress = `0x3fab184622dc19b6109349b94811493bf2a45362`;
			const factoryDeploymentData = `0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf31ba02222222222222222222222222222222222222222222222222222222222222222a02222222222222222222222222222222222222222222222222222222222222222`;

			const code = await env.network.provider.request({
				method: 'eth_getCode',
				params: [deterministicFactoryAddress, 'latest'],
			});
			if (code === '0x') {
				const balanceHexString = await env.network.provider.request({
					method: 'eth_getBalance',
					params: [deterministicFactoryDeployerAddress, 'latest'],
				});
				const balance = BigInt(balanceHexString);
				if (balance < 10000000000000000n) {
					const need = 10000000000000000n - balance;
					const balanceToSend = `0x${need.toString(16)}` as `0x${string}`;
					const txHash = await broadcastTransaction(env, signer, [
						{
							type: '0x2',
							chainId,
							from: address,
							to: deterministicFactoryDeployerAddress,
							value: balanceToSend,
							gas: `0x${BigInt(21000).toString(16)}`,
							maxFeePerGas,
							maxPriorityFeePerGas,
						},
					]);
					await env.savePendingExecution({
						type: 'execution', // TODO different type ?
						transaction: {hash: txHash, origin: address},
					});
				}

				const txHash = await env.network.provider.request({
					method: 'eth_sendRawTransaction',
					params: [factoryDeploymentData],
				});
				await env.savePendingExecution({
					type: 'execution', // TODO different type ?
					transaction: {hash: txHash, origin: address},
				});
			}

			// prepending the salt
			const salt = (
				typeof options.deterministic === 'string'
					? `0x${options.deterministic.slice(2).padStart(64, '0')}`
					: '0x0000000000000000000000000000000000000000000000000000000000000000'
			) as `0x${string}`;

			const bytecode = params[0].data || '0x';

			expectedAddress = ('0x' +
				keccak256(`0xff${deterministicFactoryAddress.slice(2)}${salt.slice(2)}${keccak256(bytecode).slice(2)}`).slice(
					-40
				)) as `0x${string}`;

			const codeAlreadyDeployed = await env.network.provider.request({
				method: 'eth_getCode',
				params: [expectedAddress, 'latest'],
			});

			if (codeAlreadyDeployed !== '0x') {
				env.showMessage(`contract was already deterministically deployed at ${expectedAddress}`);
				return env.save(name, {
					address: expectedAddress,
					...partialDeployment,
				});
			}

			params[0].data = (salt + (bytecode.slice(2) || '')) as `0x${string}`;
			params[0].to = deterministicFactoryAddress;
		}

		const txHash = await broadcastTransaction(env, signer, params);

		const pendingDeployment: PendingDeployment<TAbi> = {
			type: 'deployment',
			expectedAddress,
			partialDeployment,
			transaction: {hash: txHash, origin: address},
			name,
			// TODO we should have the nonce, except for wallet like metamask where it is not usre you get the nonce you start with
		};
		return env.savePendingDeployment(pendingDeployment);
	}

	env.deploy = deploy;
	env.execute = execute;
	env.executeByName = executeByName;
	env.read = read;
	env.readByName = readByName;
	return env;
});
