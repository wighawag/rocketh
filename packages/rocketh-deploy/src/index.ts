import {Abi} from 'abitype';
import type {
	Artifact,
	DeploymentConstruction,
	Deployment,
	Environment,
	PendingDeployment,
	PartialDeployment,
} from 'rocketh';
import {extendEnvironment} from 'rocketh';
import {Chain} from 'viem';
import {DeployContractParameters, encodeDeployData} from 'viem/contract';

declare module 'rocketh' {
	interface Environment {
		deploy: DeployFunction;
	}
}

export type DeployFunction = <TAbi extends Abi, TChain extends Chain = Chain>(
	name: string,
	args: DeploymentConstruction<TAbi, TChain>
) => Promise<Deployment<TAbi>>;

export type DeployOptions =
	| {
			skipIfAlreadyDeployed?: boolean;
	  }
	| {
			alwaysOverride?: boolean;
	  };

extendEnvironment((env: Environment) => {
	async function deploy<TAbi extends Abi, TChain extends Chain = Chain>(
		name: string,
		args: DeploymentConstruction<TAbi>,
		options?: DeployOptions
	) {
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
						nonce: viemArgs.nonce && (`0x${viemArgs.nonce.toString(16)}` as `0x${string}`),
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
						nonce: viemArgs.nonce && (`0x${viemArgs.nonce.toString(16)}` as `0x${string}`),
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
		const pendingDeployment: PendingDeployment<TAbi> = {...args, partialDeployment, txHash};
		return env.saveWhilePending(name, pendingDeployment);
	}

	env.deploy = deploy;
	return env;
});
