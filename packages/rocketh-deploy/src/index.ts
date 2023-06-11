import {Abi} from 'abitype';
import {EIP1193DATA} from 'eip-1193';
import type {
	Artifact,
	DeploymentConstruction,
	Deployment,
	Environment,
	PendingDeployment,
	PartialDeployment,
	PendingExecution,
} from 'rocketh';
import {extendEnvironment} from 'rocketh';
import {Chain, WriteContractParameters, encodeFunctionData} from 'viem';
import {DeployContractParameters, encodeDeployData} from 'viem/contract';

declare module 'rocketh' {
	interface Environment {
		deploy: DeployFunction;
		execute: ExecuteFunction;
	}
}

export type DeployFunction = <TAbi extends Abi, TChain extends Chain = Chain>(
	name: string,
	args: DeploymentConstruction<TAbi, TChain>
) => Promise<Deployment<TAbi>>;

export type ExecuteFunction = <TAbi extends Abi, TFunctionName extends string, TChain extends Chain = Chain>(
	name: string,
	args: Omit<WriteContractParameters<TAbi, TFunctionName, TChain>, 'address' | 'abi' | 'account' | 'nonce'> & {
		account: string;
	}
) => Promise<EIP1193DATA>;

export type DeployOptions =
	| {
			skipIfAlreadyDeployed?: boolean;
	  }
	| {
			alwaysOverride?: boolean;
	  };

extendEnvironment((env: Environment) => {
	async function execute<TAbi extends Abi, TFunctionName extends string, TChain extends Chain = Chain>(
		name: string,
		args: Omit<WriteContractParameters<TAbi, TFunctionName, TChain>, 'address' | 'abi' | 'account' | 'nonce'> & {
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

		const deployment = env.get(name);
		if (!deployment) {
			throw new Error(`no deployment named ${name}`);
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
						chainId: `0x${parseInt(env.network.chainId).toString(16)}` as `0x${string}`,
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
						chainId: `0x${parseInt(env.network.chainId).toString(16)}` as `0x${string}`,
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
			txHash,
			// description, // TODO
			txOrigin: address,
			// TODO we should have the nonce, except for wallet like metamask where it is not usre you get the nonce you start with
		};
		await env.savePendingExecution(pendingExecution);
		return txHash;
	}

	async function deploy<TAbi extends Abi, TChain extends Chain = Chain>(
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

		const argsToUse: DeployContractParameters<TAbi, TChain> = {
			...viemArgs,
			account,
			abi,
			bytecode,
		} as unknown as DeployContractParameters<TAbi, TChain>; // TODO why casting necessary here

		const calldata = encodeDeployData(argsToUse);
		const argsData = `0x${calldata.replace(bytecode, '')}` as `0x${string}`;

		if (existingDeployment && !allwaysOverride) {
			if (existingDeployment.bytecode + existingDeployment.argsData.slice(2) === calldata) {
				return existingDeployment as Deployment<TAbi>;
			}
		}

		const signer = env.addressSigners[address];

		let txHash: `0x${string}`;
		if (signer.type === 'wallet' || signer.type === 'remote') {
			txHash = await signer.signer.request({
				method: 'eth_sendTransaction',
				params: [
					{
						type: '0x2',
						from: address,
						chainId: `0x${parseInt(env.network.chainId).toString(16)}` as `0x${string}`,
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
						type: '0x2',
						from: address,
						chainId: `0x${parseInt(env.network.chainId).toString(16)}` as `0x${string}`,
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

		const partialDeployment: PartialDeployment<TAbi> = {
			...artifactToUse,
			argsData,
		};
		const pendingDeployment: PendingDeployment<TAbi> = {
			type: 'deployment',
			partialDeployment,
			txHash,
			name,
			txOrigin: address,
			// TODO we should have the nonce, except for wallet like metamask where it is not usre you get the nonce you start with
		};
		return env.savePendingDeployment(pendingDeployment);
	}

	env.deploy = deploy;
	env.execute = execute;
	return env;
});
