import {toJSONCompatibleLinkedData} from '@rocketh/core';
import {Abi} from 'abitype';
import {EIP1193TransactionData} from 'eip-1193';
import {logs} from 'named-logs';
import type {
	Create2DeterministicDeploymentInfo,
	DeploymentConstruction,
	Deployment,
	Environment,
	PartialDeployment,
	LinkedDataProvided,
	Libraries,
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
	parseTransaction,
	zeroHash,
} from 'viem';

export type {Abi, Chain};

const logger = logs('@rocketh/deploy');

export type DeployResult<TAbi extends Abi> = Deployment<TAbi> & {newlyDeployed: boolean};

export type DeployFunction = <TAbi extends Abi, TChain extends Chain = Chain>(
	name: string,
	args: DeploymentConstruction<TAbi>,
	options?: DeployOptions,
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
	| {
			strictBytecodeMatch?: boolean;
	  }
);

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
	libraries?: {[libraryName: string]: Address},
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
/**
 * The create2 deterministic-deployment info for this network, however it was spelled.
 *
 * Split out so the create3 path can read the create2 FACTORY ADDRESS (a pure lookup) without
 * calling `getCreate2Factory`, which reaches the network and may broadcast.
 */
function resolveCreate2Info(env: Environment): Create2DeterministicDeploymentInfo {
	const deploymentInfo =
		'create2' in env.network.deterministicDeployment
			? env.network.deterministicDeployment.create2
			: 'factory' in env.network.deterministicDeployment
				? (env.network.deterministicDeployment as Create2DeterministicDeploymentInfo)
				: undefined;
	if (!deploymentInfo) throw new Error('create2 deterministic deployment info not found');
	return deploymentInfo;
}

/**
 * The runtime code a factory's pre-signed deployment transaction is going to leave at the
 * factory address, read out of the CREATION code it carries. It returns `undefined` when that
 * creation code is not the simple copy-and-return shape this can read.
 *
 * The canonical create2 factory's constructor is twelve bytes,
 * `PUSH1 <len> DUP1 PUSH1 <offset> PUSH1 0 CODECOPY DUP1 PUSH1 0 RETURN`, which returns a
 * fixed slice of its own creation code verbatim. That makes the deployed runtime code
 * derivable from the chain CONFIG alone, with no compiler and no hardcoded constant in this
 * repo: whatever `signedTx` the config carries is what the expectation is computed from.
 *
 * Anything else returns `undefined` and the caller skips the check rather than guessing. A
 * factory whose constructor computes its runtime code cannot be predicted without running an
 * EVM, and refusing to deploy through it would be worse than not checking.
 */
function runtimeCodeReturnedByCreationCode(creationCode: string): `0x${string}` | undefined {
	const hex = creationCode.startsWith('0x') ? creationCode.slice(2) : creationCode;
	// 60 LL 80 60 OO 60 00 39 80 60 00 F3
	const pattern = /^60([0-9a-f]{2})8060([0-9a-f]{2})600039806000f3/i;
	const match = pattern.exec(hex);
	if (!match) return undefined;
	const lengthInBytes = parseInt(match[1], 16);
	const offsetInBytes = parseInt(match[2], 16);
	const start = offsetInBytes * HEX_CHARS_PER_BYTE;
	const end = start + lengthInBytes * HEX_CHARS_PER_BYTE;
	if (end > hex.length) return undefined;
	return `0x${hex.slice(start, end)}` as `0x${string}`;
}

/**
 * Neither this helper nor {@link getCreate3Factory} ever took a signer of its own: every
 * transaction they send goes through `env.broadcastExecution`, which resolves the signer at
 * the single broadcast choke point. They used to receive a `signer` argument that was only
 * forwarded, never read, and existed purely to consume `deploy`'s own
 * `env.addressSigners[address]` lookup. That lookup is gone (see the note in `deploy` below),
 * so the parameter went with it rather than being kept alive by a lookup that exists only to
 * feed it. Both helpers are module-private, so this is not a public signature change.
 */
async function getCreate2Factory(env: Environment, params: FactoryParams) {
	const deploymentInfo = resolveCreate2Info(env);

	const factoryAddress = deploymentInfo.factory;
	const factoryDeployerAddress = deploymentInfo.deployer;
	const factoryDeploymentData = deploymentInfo.signedTx;
	const funding = BigInt(deploymentInfo.funding);
	const code = await env.network.provider.request({
		method: 'eth_getCode',
		params: [factoryAddress, 'latest'],
	});
	if (code !== '0x') {
		// AN OCCUPIED ADDRESS IS NOT PROOF OF THE RIGHT FACTORY. Every deterministic address
		//  this package computes is derived from the assumption that `factoryAddress` holds the
		//  create2 proxy described by the chain config, and until this check existed the only
		//  thing established was that SOMETHING had code there. That assumption is safe on a
		//  chain running the canonical factory and unfounded anywhere else: the factory address,
		//  the deployer and the pre-signed transaction all come from user-supplied chain config,
		//  and an L2 or a fork can have anything at a given address.
		//
		// The expectation is derived from the config's OWN `signedTx`, so this compares the
		//  config against the chain rather than against a constant baked in here.
		const expectedCode = (() => {
			try {
				const parsed = parseTransaction(factoryDeploymentData as `0x${string}`);
				return parsed.data ? runtimeCodeReturnedByCreationCode(parsed.data) : undefined;
			} catch {
				// An unparsable pre-signed transaction is a config problem, but it is not THIS
				//  function's to report: the deployment below would fail on it loudly anyway.
				return undefined;
			}
		})();
		if (expectedCode && code.toLowerCase() !== expectedCode.toLowerCase()) {
			throw new Error(
				`the create2 factory configured for chain ${env.network.chain.id} is at ${factoryAddress}, but the code there is not the factory its pre-signed deployment transaction creates ` +
					`(on chain: ${(code.length - 2) / 2} bytes, expected: ${(expectedCode.length - 2) / 2} bytes). ` +
					`Every deterministic address is computed from that factory, so deploying through this one would put contracts at addresses rocketh cannot predict. ` +
					`Check this chain's \`deterministicDeployment\` configuration.`,
			);
		}
	}
	if (code === '0x') {
		const balanceHexString = await env.network.provider.request({
			method: 'eth_getBalance',
			params: [factoryDeployerAddress, 'latest'],
		});
		const balance = BigInt(balanceHexString);
		if (balance < funding) {
			const need = funding - balance;
			const balanceToSend = `0x${need.toString(16)}` as `0x${string}`;
			await env.broadcastExecution(
				{
					type: 'object',
					data: {
						type: '0x2',
						chainId: params.chainId,
						from: params.address,
						to: factoryDeployerAddress,
						value: balanceToSend,
						gas: `0x${BigInt(21000).toString(16)}`,
						maxFeePerGas: params.maxFeePerGas,
						maxPriorityFeePerGas: params.maxPriorityFeePerGas,
					},
				},
				{
					message: `  - Broadcasting Create 2 Factory Funding tx:\n      {hash}\n      {transaction}`,
				},
			);
		}

		await env.broadcastExecution(
			{type: 'raw', from: factoryDeployerAddress, raw: factoryDeploymentData},
			{message: `  - Deploying Create 2 Factory:\n      {hash}\n      {transaction}`},
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

async function getCreate3Factory(env: Environment, params: FactoryParams) {
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
	const salt = deploymentInfo.salt || zeroHash;

	// CHECKED WHETHER OR NOT THE FACTORY IS ALREADY THERE. The create3 factory is itself
	//  deployed through the create2 factory, so its address is fully determined by the create2
	//  factory address, this salt and this bytecode, all three from chain config. This asserts
	//  the config agrees with itself.
	//
	// It used to run only on the branch that DEPLOYS the factory, which is the branch where it
	//  matters least: there, a wrong address means the deployment fails visibly. On the other
	//  branch a wrong address means rocketh sends `deployDeterministic` calls to whatever
	//  contract happens to sit at the configured address and records addresses computed from a
	//  formula that does not describe it, and it does so silently.
	//
	// The create2 factory address is read from config directly rather than through
	//  `getCreate2Factory`, which reaches the network and can broadcast: verifying a
	//  configuration must not deploy anything.
	const expectedFactoryAddress = getCreate2Address({
		from: resolveCreate2Info(env).factory,
		salt,
		bytecode: factoryBytecode,
	});
	if (expectedFactoryAddress.toLowerCase() !== factoryAddress.toLowerCase())
		throw new Error(
			`create3 factory at ${factoryAddress} is not the expected address ${expectedFactoryAddress}: ` +
				`this chain's \`deterministicDeployment.create3\` configuration names an address its own bytecode and salt do not produce.`,
		);

	if (code === '0x') {
		const create2 = await getCreate2Factory(env, params);

		await env.broadcastExecution(
			{
				type: 'object',
				data: {
					type: '0x2',
					chainId: params.chainId,
					from: params.address,
					to: create2.factoryAddress,
					data: create2.encodeData({salt, bytecode: factoryBytecode}),
					maxFeePerGas: params.maxFeePerGas,
					maxPriorityFeePerGas: params.maxPriorityFeePerGas,
				},
			},
			{message: `  - Deploying Create 3 Factory:\n      {hash}\n      {transaction}`},
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
				['0xd6', '0x94', proxyAddress, '0x01'],
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

/** Two bytes, big-endian, at the very end of the runtime bytecode. */
const CBOR_LENGTH_SUFFIX_HEX_CHARS = 4;
const HEX_CHARS_PER_BYTE = 2;

/**
 * Remove solc's trailing CBOR METADATA BLOB from a contract's DEPLOYED (runtime) bytecode,
 * returning the code without it — or `undefined` when this bytecode does not credibly end
 * in one.
 *
 * solc appends the blob to the runtime bytecode and terminates it with a two-byte
 * big-endian length of the blob, NOT counting those two bytes. So the removal is
 * `declared length + 2` bytes off the end, and the +2 matters: leaving the length suffix
 * behind makes two contracts whose metadata differ in LENGTH compare unequal on the
 * leftover suffix alone, even after their blobs are gone.
 *
 * THE LENGTH IS VALIDATED, not trusted. Any bytecode ends in SOME two bytes, and reading
 * them as a length is only meaningful when a blob that size could actually be there. A
 * short runtime bytecode (a stub, a hand-written fixture, a minimal proxy) routinely ends
 * in bytes that parse as tens of thousands, and stripping that many characters silently
 * yields an EMPTY string — at which point every such contract compares equal to every
 * other, and a genuinely changed contract is skipped as already deployed. Returning
 * `undefined` instead sends the caller to its no-metadata fallback, which compares the
 * creation bytecode it can trust.
 *
 * Creation bytecode is never used here: the blob can sit at other offsets in it.
 */
function stripCBORMetadata(deployedBytecode: string): string | undefined {
	const hex = deployedBytecode.startsWith('0x') ? deployedBytecode.slice(2) : deployedBytecode;
	const metadataHexChars = cborMetadataHexLength(hex);
	if (metadataHexChars === undefined) {
		return undefined;
	}
	return `0x${hex.slice(0, hex.length - metadataHexChars)}`;
}

/**
 * How many hex characters at the end of this runtime bytecode are the CBOR metadata blob
 * (the blob itself PLUS its two-byte length suffix), or `undefined` when there is no
 * credible blob there.
 *
 * Split out of `stripCBORMetadata` so the same validated arithmetic can be used to read the
 * blob rather than to remove it; the rules it enforces are documented on that function.
 */
function cborMetadataHexLength(bytecodeHex: string): number | undefined {
	const hex = bytecodeHex.startsWith('0x') ? bytecodeHex.slice(2) : bytecodeHex;
	if (hex.length <= CBOR_LENGTH_SUFFIX_HEX_CHARS) {
		return undefined;
	}
	const declaredLengthInBytes = parseInt(hex.slice(-CBOR_LENGTH_SUFFIX_HEX_CHARS), 16);
	if (isNaN(declaredLengthInBytes) || declaredLengthInBytes <= 0) {
		return undefined;
	}
	const metadataHexChars = declaredLengthInBytes * HEX_CHARS_PER_BYTE + CBOR_LENGTH_SUFFIX_HEX_CHARS;
	// it must leave some actual code behind, or it was never a metadata blob
	if (metadataHexChars >= hex.length) {
		return undefined;
	}
	return metadataHexChars;
}

/** The trailing CBOR metadata blob of a runtime bytecode, or `undefined` when it has none. */
function extractCBORMetadata(deployedBytecode: string): string | undefined {
	const hex = deployedBytecode.startsWith('0x') ? deployedBytecode.slice(2) : deployedBytecode;
	const metadataHexChars = cborMetadataHexLength(hex);
	if (metadataHexChars === undefined) {
		return undefined;
	}
	return hex.slice(hex.length - metadataHexChars);
}

/**
 * Is the code ALREADY ON CHAIN at an address the contract this artifact describes?
 *
 * Only create3 needs to ask. A create2 address is derived from the creation bytecode, so
 * code at the computed address can only have come from that same bytecode; a create3
 * address is derived from the DEPLOYER and the SALT alone, so the same salt used for two
 * different contracts lands both on the same address, and the second run has to notice.
 *
 * IT COMPARES RUNTIME CODE WITH RUNTIME CODE. It used to compare what `eth_getCode`
 * returned against the CREATION bytecode (`transactionData.data`), which is a different
 * artifact of a different length, so it never matched and the check threw on every
 * create3 redeploy whose local record was missing, which is precisely the recovery case it
 * exists to serve.
 *
 * THE DEFAULT COMPARISON IS THE CBOR METADATA BLOB, not the whole code, because an
 * `immutable` variable is written into the runtime code AT CONSTRUCTION: the artifact
 * carries zeros where the deployed contract carries the values, so a verbatim comparison
 * calls a contract with immutables a stranger. The metadata blob is a hash of the source
 * and the compiler settings, INCLUDING which contract in the file was compiled, so it
 * identifies the contract while ignoring the constructor's work. `strictBytecodeMatch`
 * asks for the verbatim comparison, and bytecode with no metadata blob (a stub, a
 * `--no-cbor-metadata` build) falls back to it since there is nothing else to compare.
 */
function onChainCodeIsTheArtifact(
	onChainCode: string,
	artifactDeployedBytecode: string | undefined,
	strictBytecodeMatch: boolean,
): boolean {
	if (!artifactDeployedBytecode) {
		// Nothing to compare against: an artifact with no `deployedBytecode` cannot contradict
		//  what is on chain, so it does not get to refuse it.
		return true;
	}
	if (!strictBytecodeMatch) {
		const onChainMetadata = extractCBORMetadata(onChainCode);
		const artifactMetadata = extractCBORMetadata(artifactDeployedBytecode);
		if (onChainMetadata !== undefined && artifactMetadata !== undefined) {
			return onChainMetadata === artifactMetadata;
		}
	}
	return onChainCode.toLowerCase() === artifactDeployedBytecode.toLowerCase();
}

function areLibrariesIdentical(oldLibs: Libraries, newLibs: Libraries) {
	const oldKeys = Object.keys(oldLibs || {});
	const newKeys = Object.keys(newLibs || {});

	if (oldKeys.length !== newKeys.length) {
		return false;
	}

	for (const key of newKeys) {
		const oldAddress = oldLibs[key]?.toLowerCase();
		const newAddress = newLibs[key]?.toLowerCase();

		if (oldAddress !== newAddress) {
			return false;
		}
	}

	return true;
}

export function deploy(env: Environment): <TAbi extends Abi>(
	name: string, // '' allow to not save it
	args: DeploymentConstruction<TAbi>,
	options?: DeployOptions,
) => Promise<DeployResult<TAbi>> {
	return async <TAbi extends Abi>(name: string, args: DeploymentConstruction<TAbi>, options?: DeployOptions) => {
		const nameToDisplay = name || '<no name>';
		const skipIfAlreadyDeployed = options && 'skipIfAlreadyDeployed' in options && options.skipIfAlreadyDeployed;
		const alwaysOverride = options && 'alwaysOverride' in options && options.alwaysOverride;
		const strictBytecodeMatch = options && 'strictBytecodeMatch' in options && options.strictBytecodeMatch;

		if (alwaysOverride && skipIfAlreadyDeployed) {
			throw new Error(`conflicting options: "alwaysOverride" and "skipIfAlreadyDeployed"`);
		}

		const existingDeployment = name && env.getOrNull(name);
		if (existingDeployment && skipIfAlreadyDeployed) {
			// logger.info(
			// 	`deployment for ${nameToDisplay} at ${existingDeployment.address}, skipIfAlreadyDeployed: true => we skip`,
			// );
			return {...(existingDeployment as Deployment<TAbi>), newlyDeployed: false};
		}

		const {account, artifact, ...viemArgs} = args;
		const address = env.resolveAccount(account);

		// TODO throw specific error if artifact not found
		const artifactToUse = artifact;

		const bytecode = linkLibraries(artifactToUse, options?.libraries);

		if (bytecode.indexOf('$') != -1) {
			// TODO identify which library are missing using linkReferences (if provided)
			throw new Error(`${nameToDisplay} requires library linking`);
		}

		const abi = artifactToUse.abi;

		const argsToUse = {
			...viemArgs,
			account,
			abi,
			bytecode,
		};

		const calldata = encodeDeployData(argsToUse as any); // TODO any
		const argsData = `0x${calldata.replace(bytecode, '')}` as `0x${string}`;

		// if (existingDeployment) {
		// 	logger.info(`existing deployment for ${nameToDisplay} at ${existingDeployment.address}`);
		// }

		if (existingDeployment && !alwaysOverride) {
			const previousDeployedBytecode = existingDeployment.deployedBytecode;
			const previousArgsData = existingDeployment.argsData;
			const newlyDeployedBytecode = artifactToUse.deployedBytecode;
			let bytecodeMatches: boolean;
			const previousDeployedBytecodeWithoutCBOR =
				previousDeployedBytecode && !strictBytecodeMatch ? stripCBORMetadata(previousDeployedBytecode) : undefined;
			const newlyDeployedBytecodeWithoutCBOR =
				newlyDeployedBytecode && !strictBytecodeMatch ? stripCBORMetadata(newlyDeployedBytecode) : undefined;

			if (previousDeployedBytecodeWithoutCBOR !== undefined && newlyDeployedBytecodeWithoutCBOR !== undefined) {
				// NON-STRICT MATCHING: compare the runtime bytecode with its trailing CBOR METADATA
				//  BLOB removed, so a recompile that changed only the metadata (a different absolute
				//  source path, a bumped compiler patch, an added comment) does not look like a new
				//  contract and trigger a redeploy — or, for a proxy, an UPGRADE. This is the
				//  default and ADR 0004 is why; `strictBytecodeMatch: true` compares verbatim.
				//
				// Each side is stripped by ITS OWN declared length (see `stripCBORMetadata`). Using
				//  one side's length for both was wrong whenever the two compilations produced
				//  metadata of DIFFERENT lengths, which an absolute source path alone can cause: the
				//  cut then landed at a different offset in each, leaving a fragment of one blob in
				//  the comparison and reporting a difference that does not exist.
				bytecodeMatches =
					areLibrariesIdentical(existingDeployment.libraries || {}, options?.libraries || {}) &&
					previousDeployedBytecodeWithoutCBOR === newlyDeployedBytecodeWithoutCBOR;
			} else {
				const linkedPreviousBytecode = linkLibraries(
					{bytecode: existingDeployment.bytecode, linkReferences: existingDeployment.linkReferences},
					existingDeployment.libraries,
				);
				bytecodeMatches = linkedPreviousBytecode === bytecode;
			}

			if (bytecodeMatches && previousArgsData === argsData) {
				logger.info(`reusing "${nameToDisplay}" at ${existingDeployment.address}`);
				return {...(existingDeployment as Deployment<TAbi>), newlyDeployed: false};
			}
		}

		const partialDeployment: PartialDeployment<TAbi> = {
			...artifactToUse,
			argsData,
			linkedData: toJSONCompatibleLinkedData(options?.linkedData),
			libraries: options?.libraries,
		};

		// NO SIGNER LOOKUP HERE, deliberately. `deploy` used to look up
		// `env.addressSigners[address]` and throw `cannot get signer for ${address}` at this
		// point, which short-circuited a deploy from an account rocketh cannot sign for BEFORE
		// the transaction was even built — so it never reached the single `broadcastTransaction`
		// choke point where the unknown-signer seam lives, and the user got an opaque error
		// instead of the transaction to execute on their Safe (ADR 0006).
		//
		// The check was also the wrong question. It tested for the PRESENCE of a signer entry,
		// and a named account declared as a bare address always has one
		// (`{type:'remote', signer: provider}`), so it never fired for the canonical named-Safe
		// case and fired only for an address passed literally, which has no entry at all. The
		// seam asks the right question (signability, recorded at setup) for both spellings.
		const chainId = `0x${env.network.chain.id.toString(16)}` as `0x${string}`;
		// Guarded on `!== undefined`, NOT on truthiness, and the difference is not cosmetic: `&&`
		//  returns its LEFT operand when that operand is falsy, so `0n` passed through as the bigint
		//  `0n` rather than a 0x quantity, putting a bigint on the wire where the type says
		//  `0x${string}`. `value` in the same literal below already does it this way; these now match.
		const maxFeePerGas =
			viemArgs.maxFeePerGas !== undefined ? (`0x${viemArgs.maxFeePerGas.toString(16)}` as `0x${string}`) : undefined;
		const maxPriorityFeePerGas =
			viemArgs.maxPriorityFeePerGas !== undefined
				? (`0x${viemArgs.maxPriorityFeePerGas.toString(16)}` as `0x${string}`)
				: undefined;

		const transactionData: EIP1193TransactionData = {
			type: '0x2',
			from: address,
			chainId,
			data: calldata,
			gas: viemArgs.gas !== undefined ? (`0x${viemArgs.gas.toString(16)}` as `0x${string}`) : undefined,
			maxFeePerGas,
			maxPriorityFeePerGas,
			// gasPrice: viemArgs.gasPrice && `0x${viemArgs.gasPrice.toString(16)}` as `0x${string}`,
			...(viemArgs.value !== undefined && {
				value: `0x${viemArgs.value.toString(16)}` as `0x${string}`,
			}),
			// nonce: viemArgs.nonce && (`0x${viemArgs.nonce.toString(16)}` as `0x${string}`),
		};

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

			const bytecode = transactionData.data || '0x';

			const factoryParams = {chainId, address, maxFeePerGas, maxPriorityFeePerGas};
			const create =
				deterministicType === 'create2'
					? await getCreate2Factory(env, factoryParams)
					: await getCreate3Factory(env, factoryParams);

			expectedAddress = create.getExpectedAddress({salt, bytecode});

			const codeAlreadyDeployed = await env.network.provider.request({
				method: 'eth_getCode',
				params: [expectedAddress, 'latest'],
			});

			if (!codeAlreadyDeployed) {
				throw new Error(`invalid code : ${codeAlreadyDeployed}`);
			} else if (codeAlreadyDeployed !== '0x') {
				if (
					deterministicType === 'create3' &&
					!onChainCodeIsTheArtifact(codeAlreadyDeployed, artifactToUse.deployedBytecode, !!strictBytecodeMatch)
				)
					throw new Error(
						`${expectedAddress} already holds code that is not "${nameToDisplay}" (on chain: ${(codeAlreadyDeployed.length - 2) / 2} bytes, artifact: ${((artifactToUse.deployedBytecode?.length || 2) - 2) / 2} bytes). ` +
							`A create3 address depends only on the deployer and the salt, so this salt has already been used by another contract from this account: pick a different salt, or deploy the contract that is there.`,
					);
				env.showMessage(`contract was already deterministically deployed at ${expectedAddress}`);
				if (name) {
					const deployment = await env.save(
						name,
						{
							address: expectedAddress,
							...partialDeployment,
						},
						{considerItAsFreshDeployment: true},
					);
					return {...(deployment as Deployment<TAbi>), newlyDeployed: false};
				} else {
					return {address: expectedAddress, ...partialDeployment, newlyDeployed: false};
				}
			}

			transactionData.data = create.encodeData({salt, bytecode});
			transactionData.to = create.factoryAddress;
		}

		const deployment = await env.broadcastDeployment(
			name,
			{
				type: 'object',
				data: transactionData,
			},
			partialDeployment,
			{
				message: `  - Deploying {name} ${
					options?.deterministic ? '(deterministically)' : ''
				} with tx:\n      {hash}\n      {transaction}`,
				expectedAddress,
			},
		);

		return {...(deployment as Deployment<TAbi>), newlyDeployed: true};
	};
}
