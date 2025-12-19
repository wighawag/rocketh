import {toJSONCompatibleLinkedData} from '@rocketh/core/json';
import {Abi} from 'abitype';
import {EIP1193TransactionData} from 'eip-1193';
import {logs} from 'named-logs';
import type {
	DeploymentConstruction,
	Deployment,
	Environment,
	PartialDeployment,
	PendingDeployment,
	Signer,
	LinkedDataProvided,
} from '@rocketh/core/types';
import {
	Address,
	Chain,
	encodeDeployData,
	encodeFunctionData,
	encodePacked,
	getCreate2Address,
	keccak256,
	parseAbi,
	zeroHash,
} from 'viem';

const logger = logs('@rocketh/deploy');

export type DeployResult<TAbi extends Abi> = Deployment<TAbi> & {newlyDeployed: boolean};

export type DeployFunction = <TAbi extends Abi, TChain extends Chain = Chain>(
	name: string,
	args: DeploymentConstruction<TAbi>,
	options?: DeployOptions
) => Promise<DeployResult<TAbi>>;

export type DeployOptions = {
	linkedData?: LinkedDataProvided;
	deterministic?:
		| boolean
		| `0x${string}`
		| {
				type: 'create2' | 'create3';
				salt?: `0x${string}`;
		  };
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
		const tx = signer.signer.request({
			method: 'eth_sendTransaction',
			params: params as any, // TODO fix eip-1193 ?,
		});

		if (env.tags['auto-mine']) {
			await (env.network.provider as any).request({method: 'evm_mine', params: []});
		}

		return tx;
	} else {
		const rawTx = await signer.signer.request({
			method: 'eth_signTransaction',
			params,
		});

		const tx = env.network.provider.request({
			method: 'eth_sendRawTransaction',
			params: [rawTx],
		});

		if (env.tags['auto-mine']) {
			await (env.network.provider as any).request({method: 'evm_mine', params: []});
		}

		return tx;
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

type FactoryParams = {
	chainId: `0x${string}`;
	address: `0x${string}`;
	maxFeePerGas: `0x${string}` | undefined;
	maxPriorityFeePerGas: `0x${string}` | undefined;
};
async function getCreate2Factory(env: Environment, signer: Signer, params: FactoryParams) {
	const deploymentInfo =
		'create2' in env.network.deterministicDeployment
			? env.network.deterministicDeployment.create2
			: 'factory' in env.network.deterministicDeployment
			? env.network.deterministicDeployment
			: undefined;
	if (!deploymentInfo) throw new Error('create2 deterministic deployment info not found');

	const factoryAddress = deploymentInfo.factory;
	const factoryDeployerAddress = deploymentInfo.deployer;
	const factoryDeploymentData = deploymentInfo.signedTx;
	const funding = BigInt(deploymentInfo.funding);
	const code = await env.network.provider.request({
		method: 'eth_getCode',
		params: [factoryAddress, 'latest'],
	});
	if (code === '0x') {
		const balanceHexString = await env.network.provider.request({
			method: 'eth_getBalance',
			params: [factoryDeployerAddress, 'latest'],
		});
		const balance = BigInt(balanceHexString);
		if (balance < funding) {
			const need = funding - balance;
			const balanceToSend = `0x${need.toString(16)}` as `0x${string}`;
			const txHash = await broadcastTransaction(env, signer, [
				{
					type: '0x2',
					chainId: params.chainId,
					from: params.address,
					to: factoryDeployerAddress,
					value: balanceToSend,
					gas: `0x${BigInt(21000).toString(16)}`,
					maxFeePerGas: params.maxFeePerGas,
					maxPriorityFeePerGas: params.maxPriorityFeePerGas,
				},
			]);
			await env.savePendingExecution(
				{
					type: 'execution', // TODO different type ?
					transaction: {hash: txHash, origin: params.address},
				},
				`  - Broadcasting Create 2 Factory Funding tx:\n      {hash}\n      {transaction}`
			);
		}

		const txHash = await env.network.provider.request({
			method: 'eth_sendRawTransaction',
			params: [factoryDeploymentData],
		});
		await env.savePendingExecution(
			{
				type: 'execution', // TODO different type ?
				transaction: {hash: txHash, origin: params.address},
			},
			`  - Deploying Create 2 Factory:\n      {hash}\n      {transaction}`
		);
	}

	return {
		getExpectedAddress: ({salt, bytecode}: {salt: `0x${string}`; bytecode: `0x${string}`}): `0x${string}` =>
			getCreate2Address({
				bytecode,
				from: factoryAddress,
				salt,
			}),
		encodeData: ({salt, bytecode}: {salt: `0x${string}`; bytecode: `0x${string}`}): `0x${string}` =>
			(salt + (bytecode.slice(2) || '')) as `0x${string}`,
		factoryAddress,
	};
}

async function getCreate3Factory(env: Environment, signer: Signer, params: FactoryParams) {
	const deploymentInfo =
		'create3' in env.network.deterministicDeployment ? env.network.deterministicDeployment.create3 : undefined;
	if (!deploymentInfo) throw new Error('create3 deterministic deployment info not found');

	const factoryAddress = deploymentInfo.factory;
	const factoryBytecode = deploymentInfo.bytecode;
	const proxyBytecode = deploymentInfo.proxyBytecode;
	const code = await env.network.provider.request({
		method: 'eth_getCode',
		params: [factoryAddress, 'latest'],
	});
	if (code === '0x') {
		const create2 = await getCreate2Factory(env, signer, params);
		const salt = deploymentInfo.salt || zeroHash;
		const expectedAddress = create2.getExpectedAddress({salt, bytecode: factoryBytecode});
		if (expectedAddress.toLowerCase() !== factoryAddress.toLowerCase())
			throw new Error(`create3 factory at ${factoryAddress} is not the expected address ${expectedAddress}`);

		const txHash = await broadcastTransaction(env, signer, [
			{
				type: '0x2',
				chainId: params.chainId,
				from: params.address,
				to: create2.factoryAddress,
				data: create2.encodeData({salt, bytecode: factoryBytecode}),
				maxFeePerGas: params.maxFeePerGas,
				maxPriorityFeePerGas: params.maxPriorityFeePerGas,
			},
		]);
		await env.savePendingExecution(
			{
				type: 'execution', // TODO different type ?
				transaction: {hash: txHash, origin: params.address},
			},
			`  - Deploying Create 3 Factory:\n      {hash}\n      {transaction}`
		);
	}

	return {
		getExpectedAddress: ({salt}: {salt: `0x${string}`}): `0x${string}` => {
			const namespacedSalt = keccak256(encodePacked(['address', 'bytes32'], [params.address, salt]));

			const proxyAddress = getCreate2Address({
				from: factoryAddress,
				salt: namespacedSalt,
				bytecode: proxyBytecode,
			});

			// This follows the RLP encoding rules for contract addresses created by CREATE
			// prefix ++ address ++ nonce, where:
			// prefix = 0xd6 (0xc0 + 0x16), where 0x16 is length of: 0x94 ++ address ++ 0x01
			// 0x94 = 0x80 + 0x14 (0x14 is the length of an address)
			const rlpEncodedData = encodePacked(
				['bytes1', 'bytes1', 'address', 'bytes1'],
				['0xd6', '0x94', proxyAddress, '0x01']
			);

			return `0x${keccak256(rlpEncodedData).slice(26)}`;
		},
		encodeData: ({salt, bytecode}: {salt: `0x${string}`; bytecode: `0x${string}`}): `0x${string}` =>
			encodeFunctionData({
				abi: parseAbi(['function deployDeterministic(bytes memory,bytes32) external returns (address)']),
				args: [bytecode, salt],
			}),
		factoryAddress,
	};
}

export function deploy(env: Environment): <TAbi extends Abi>(
	name: string, // '' allow to not save it
	args: DeploymentConstruction<TAbi>,
	options?: DeployOptions
) => Promise<DeployResult<TAbi>> {
	return async <TAbi extends Abi>(name: string, args: DeploymentConstruction<TAbi>, options?: DeployOptions) => {
		const nameToDisplay = name || '<no name>';
		const skipIfAlreadyDeployed = options && 'skipIfAlreadyDeployed' in options && options.skipIfAlreadyDeployed;
		const allwaysOverride = options && 'allwaysOverride' in options && options.allwaysOverride;

		if (allwaysOverride && skipIfAlreadyDeployed) {
			throw new Error(`conflicting options: "allwaysOverride" and "skipIfAlreadyDeployed"`);
		}

		const existingDeployment = name && env.getOrNull(name);
		if (existingDeployment && skipIfAlreadyDeployed) {
			logger.info(
				`deployment for ${nameToDisplay} at ${existingDeployment.address}, skipIfAlreadyDeployed: true => we skip`
			);
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
		const artifactToUse = artifact;

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
			logger.info(`existing deployment for ${nameToDisplay} at ${existingDeployment.address}`);
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
			linkedData: toJSONCompatibleLinkedData(options?.linkedData),
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
			const [deterministicType, salt] = (() => {
				const normalizeSalt = (salt: `0x${string}` | boolean | undefined): `0x${string}` =>
					typeof salt === 'string' ? `0x${salt.slice(2).padStart(64, '0')}` : zeroHash;
				if (typeof options.deterministic !== 'object')
					return ['create2', normalizeSalt(options.deterministic)] as const;
				if (options.deterministic.type === 'create2')
					return ['create2', normalizeSalt(options.deterministic.salt)] as const;
				if (options.deterministic.type === 'create3')
					return ['create3', normalizeSalt(options.deterministic.salt)] as const;
				throw new Error(`unknown deterministic type: ${options.deterministic.type}`);
			})();

			const bytecode = params[0].data || '0x';

			const factoryParams = {chainId, address, maxFeePerGas, maxPriorityFeePerGas};
			const create =
				deterministicType === 'create2'
					? await getCreate2Factory(env, signer, factoryParams)
					: await getCreate3Factory(env, signer, factoryParams);

			expectedAddress = create.getExpectedAddress({salt, bytecode});

			const codeAlreadyDeployed = await env.network.provider.request({
				method: 'eth_getCode',
				params: [expectedAddress, 'latest'],
			});

			if (codeAlreadyDeployed !== '0x') {
				if (deterministicType === 'create3' && codeAlreadyDeployed !== bytecode)
					throw new Error(`code already deployed at ${expectedAddress} but is not the expected bytecode`);
				env.showMessage(`contract was already deterministically deployed at ${expectedAddress}`);
				if (name) {
					const deployment = await env.save(
						name,
						{
							address: expectedAddress,
							...partialDeployment,
						},
						{doNotCountAsNewDeployment: true}
					);
					return {...(deployment as Deployment<TAbi>), newlyDeployed: false};
				} else {
					return {address: expectedAddress, ...partialDeployment, newlyDeployed: false};
				}
			}

			params[0].data = create.encodeData({salt, bytecode});
			params[0].to = create.factoryAddress;
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
		const deployment = await env.savePendingDeployment(
			pendingDeployment,
			`  - Deploying {name} ${
				options?.deterministic ? '(deterministically)' : ''
			} with tx:\n      {hash}\n      {transaction}`
		);
		return {...(deployment as Deployment<TAbi>), newlyDeployed: true};
	};
}
