import {Abi} from 'abitype';
import {EIP1193TransactionData} from 'eip-1193';
import type {
	Artifact,
	DeploymentConstruction,
	Deployment,
	Environment,
	PendingDeployment,
	PartialDeployment,
	Signer,
} from 'rocketh';
import {extendEnvironment} from 'rocketh';
import {Address, Chain, encodePacked, keccak256} from 'viem';
import {encodeDeployData} from 'viem';
import {logs} from 'named-logs';

const logger = logs('@rocketh/deploy');

declare module 'rocketh' {
	interface Environment {
		deploy: DeployFunction;
	}
}

export type DeployFunction = <TAbi extends Abi, TChain extends Chain = Chain>(
	name: string,
	args: DeploymentConstruction<TAbi>,
	options?: DeployOptions
) => Promise<Deployment<TAbi> & {newlyDeployed: boolean}>;

export type DeployOptions = {
	linkedData?: any;
	deterministic?: boolean | `0x${string}`;
	libraries?: {[name: string]: Address};
} & (
	| {
			skipIfAlreadyDeployed?: boolean;
	  }
	| {
			alwaysOverride?: boolean;
	  }
);

async function broadcastTransaction(
	env: Environment,
	signer: Signer,
	params: [EIP1193TransactionData]
): Promise<`0x${string}`> {
	if (signer.type === 'wallet' || signer.type === 'remote') {
		return signer.signer.request({
			method: 'eth_sendTransaction',
			params: params as any, // TODO fix eip-1193 ?,
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

function linkRawLibrary(bytecode: string, libraryName: string, libraryAddress: string): string {
	const address = libraryAddress.replace('0x', '');
	let encodedLibraryName;
	if (libraryName.startsWith('$') && libraryName.endsWith('$')) {
		encodedLibraryName = libraryName.slice(1, libraryName.length - 1);
	} else {
		encodedLibraryName = keccak256(encodePacked(['string'], [libraryName])).slice(2, 36);
	}
	const pattern = new RegExp(`_+\\$${encodedLibraryName}\\$_+`, 'g');
	if (!pattern.exec(bytecode)) {
		throw new Error(`Can't link '${libraryName}' (${encodedLibraryName}) in \n----\n ${bytecode}\n----\n`);
	}
	return bytecode.replace(pattern, address);
}

function linkRawLibraries(bytecode: string, libraries: {[libraryName: string]: Address}): string {
	for (const libName of Object.keys(libraries)) {
		const libAddress = libraries[libName];
		bytecode = linkRawLibrary(bytecode, libName, libAddress);
	}
	return bytecode;
}

function linkLibraries(
	artifact: {
		bytecode: string;
		linkReferences?: {
			[libraryFileName: string]: {
				[libraryName: string]: Array<{length: number; start: number}>;
			};
		};
	},
	libraries?: {[libraryName: string]: Address}
) {
	let bytecode = artifact.bytecode;

	if (libraries) {
		if (artifact.linkReferences) {
			for (const [fileName, fileReferences] of Object.entries(artifact.linkReferences)) {
				for (const [libName, fixups] of Object.entries(fileReferences)) {
					const addr = libraries[libName];
					if (addr === undefined) {
						continue;
					}

					for (const fixup of fixups) {
						bytecode =
							bytecode.substring(0, 2 + fixup.start * 2) +
							addr.substring(2) +
							bytecode.substring(2 + (fixup.start + fixup.length) * 2);
					}
				}
			}
		} else {
			bytecode = linkRawLibraries(bytecode, libraries);
		}
	}

	// TODO return libraries object with path name <filepath.sol>:<name> for names

	return bytecode;
}

extendEnvironment((env: Environment) => {
	async function deploy<TAbi extends Abi>(
		name: string, // '' allow to not save it
		args: DeploymentConstruction<TAbi>,
		options?: DeployOptions
	): Promise<Deployment<TAbi> & {newlyDeployed: boolean}> {
		const skipIfAlreadyDeployed = options && 'skipIfAlreadyDeployed' in options && options.skipIfAlreadyDeployed;
		const allwaysOverride = options && 'allwaysOverride' in options && options.allwaysOverride;

		if (allwaysOverride && skipIfAlreadyDeployed) {
			throw new Error(`conflicting options: "allwaysOverride" and "skipIfAlreadyDeployed"`);
		}

		const existingDeployment = name && env.getOrNull(name);
		if (existingDeployment && skipIfAlreadyDeployed) {
			logger.info(`deployment for ${name} at ${existingDeployment.address}, skipIfAlreadyDeployed: true => we skip`);
			return {...(existingDeployment as Deployment<TAbi>), newlyDeployed: false};
		}

		const {account, artifact, ...viemArgs} = args;
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

		// TODO throw specific error if artifact not found
		const artifactToUse = (typeof artifact === 'string' ? env.artifacts[artifact] : artifact) as Artifact<TAbi>;

		const bytecode = linkLibraries(artifactToUse, options?.libraries);

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
				return {...(existingDeployment as Deployment<TAbi>), newlyDeployed: false};
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
				if (name) {
					const deployment = await env.save(name, {
						address: expectedAddress,
						...partialDeployment,
					});
					return {...(deployment as Deployment<TAbi>), newlyDeployed: false};
				} else {
					return {address: expectedAddress, ...partialDeployment, newlyDeployed: false};
				}
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
		const deployment = await env.savePendingDeployment(pendingDeployment);
		return {...(deployment as Deployment<TAbi>), newlyDeployed: true};
	}

	env.deploy = deploy;
	return env;
});
