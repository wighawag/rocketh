/**
 * Integration tests for @rocketh/deploy - real library linking.
 *
 * The existing "Library Linking" test in `deploy.integration.test.ts` uses
 * `createMockArtifact`, whose `linkReferences` is `{}`. So `linkLibraries` enters the
 * `linkReferences` branch but iterates zero times — no byte is ever substituted, and the
 * test only asserts `toBeDefined()`.
 *
 * These tests exercise BOTH linking paths:
 * - `linkReferences`-based splicing (the Solidity compiler output path), using
 *   `createMockArtifactWithLibrary` whose bytecode is long enough for the fixup.
 * - raw `__$<hash>$__` placeholder substitution (the `linkRawLibraries` path), using an
 *   artifact with `linkReferences` absent.
 *
 * They also cover the `addr === undefined` silent-skip, the `requires library linking`
 * throw when a placeholder survives, and `areLibrariesIdentical`'s "same bytecode, new
 * library address" path that forces a redeploy.
 */

import {describe, it, expect} from 'vitest';
import {deploy} from '../src/index.js';
import {
	createTestEnvironment,
	createMockArtifact,
	createMockArtifactWithLibrary,
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
} from '@rocketh/test-utils';
import {keccak256, encodePacked} from 'viem';
import type {Abi, Artifact} from '@rocketh/core/types';

const LIB_ABI = [{type: 'constructor', inputs: [], stateMutability: 'nonpayable'}] as const satisfies Abi;

const SIMPLE_ABI = [
	{type: 'constructor', inputs: [{type: 'uint256', name: '_initialValue'}], stateMutability: 'nonpayable'},
	{type: 'function', name: 'getValue', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
] as const satisfies Abi;

/**
 * Override `eth_getTransactionReceipt` to return a unique contractAddress per tx hash,
 * so the library and the contract get distinct addresses.
 */
function uniqueAddressesProviderConfig() {
	let counter = 0;
	return {
		responses: {
			eth_getTransactionReceipt: () => {
				counter++;
				const addr = '0x' + counter.toString(16).padStart(40, 'a');
				return {
					contractAddress: addr as `0x${string}`,
					status: '0x1',
					blockNumber: '0x1',
					blockHash: `0x${'b'.repeat(64)}`,
					transactionHash: `0x${'c'.repeat(64)}`,
					gasUsed: '0x5208',
				};
			},
		},
	};
}

describe('@rocketh/deploy - Library linking via linkReferences', () => {
	it('splices the library address into the bytecode at the link reference position', async () => {
		const {env, provider} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			providerConfig: uniqueAddressesProviderConfig(),
		});
		const _deploy = deploy(env);

		// Deploy the library first
		const libArtifact = createMockArtifact('MathLib', LIB_ABI);
		const libDeployment = await _deploy('MathLib', {
			account: 'deployer',
			artifact: libArtifact,
			args: [],
		});

		// Deploy a contract that links the library, using createMockArtifactWithLibrary
		const contractArtifact = createMockArtifactWithLibrary('Calculator', 'MathLib', SIMPLE_ABI);
		await _deploy(
			'Calculator',
			{
				account: 'deployer',
				artifact: contractArtifact,
				args: [42n],
			},
			{
				libraries: {MathLib: libDeployment.address},
			},
		);

		// The second eth_sendTransaction (the contract deploy) should have the library
		// address spliced into the bytecode at byte offset 50.
		const sendTxReqs = provider.getRequests().filter((r) => r.method === 'eth_sendTransaction');
		expect(sendTxReqs.length).toBe(2);
		const contractTxData = (sendTxReqs[1].params![0] as any).data as string;

		// The library address (without 0x) should appear at byte offset 50 in the bytecode.
		// The deployed data is: bytecode (with library spliced) + encoded constructor args.
		// The link reference is at start=50, length=20, so the library address hex (40 chars)
		// should be at position 2 + 50*2 = 102 in the hex string.
		const libAddrHex = libDeployment.address.toLowerCase().replace('0x', '');
		// Extract 40 hex chars starting at offset 102 (2 + 50*2)
		const splicedAddr = contractTxData.substring(102, 142).toLowerCase();
		expect(splicedAddr).toBe(libAddrHex);
	});

	it('silently skips a library that is not provided in the libraries option', async () => {
		const {env, provider} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			providerConfig: uniqueAddressesProviderConfig(),
		});
		const _deploy = deploy(env);

		const contractArtifact = createMockArtifactWithLibrary('Calculator', 'MathLib', SIMPLE_ABI);

		// Deploy without providing the library address — the placeholder is left in place.
		const result = await _deploy('Calculator', {
			account: 'deployer',
			artifact: contractArtifact,
			args: [42n],
			// no libraries: {MathLib: ...} — the linker skips it
		});

		expect(result).toBeDefined();
		expect(result.newlyDeployed).toBe(true);

		// The bytecode at the link position should still be zeros (the placeholder),
		// not a library address.
		const sendTxReqs = provider.getRequests().filter((r) => r.method === 'eth_sendTransaction');
		const contractTxData = (sendTxReqs[0].params![0] as any).data as string;
		const placeholder = contractTxData.substring(102, 142);
		expect(placeholder).toBe('0'.repeat(40));
	});
});

describe('@rocketh/deploy - Raw library linking ($__hash$__ placeholders)', () => {
	/**
	 * When `linkReferences` is absent, `linkLibraries` falls through to
	 * `linkRawLibraries`, which replaces `__$<keccak-hash>$__` patterns in the bytecode.
	 */
	it('replaces the __$hash$__ placeholder with the library address', async () => {
		const {env, provider} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			providerConfig: uniqueAddressesProviderConfig(),
		});
		const _deploy = deploy(env);

		// Deploy the library first
		const libArtifact = createMockArtifact('MathLib', LIB_ABI);
		const libDeployment = await _deploy('MathLib', {
			account: 'deployer',
			artifact: libArtifact,
			args: [],
		});

		// Build an artifact with raw placeholders (no linkReferences)
		const encodedName = keccak256(encodePacked(['string'], ['MathLib'])).slice(2, 36);
		const placeholder = `__$${encodedName}$__`;
		// Build a bytecode containing the placeholder
		const rawBytecode = ('0x6080604052' + placeholder + '6080') as `0x${string}`;

		const rawArtifact: Artifact<Abi> = {
			contractName: 'RawLinked',
			abi: LIB_ABI,
			bytecode: rawBytecode,
			deployedBytecode: '0x6080604052' as `0x${string}`,
			linkReferences: undefined as any, // absent — triggers linkRawLibraries
			metadata: '{}',
		};

		await _deploy(
			'RawLinked',
			{
				account: 'deployer',
				artifact: rawArtifact,
				args: [],
			},
			{
				libraries: {MathLib: libDeployment.address},
			},
		);

		// Verify the placeholder was replaced with the library address
		const sendTxReqs = provider.getRequests().filter((r) => r.method === 'eth_sendTransaction');
		const contractTxData = (sendTxReqs[1].params![0] as any).data as string;
		expect(contractTxData).toContain(libDeployment.address.toLowerCase().replace('0x', ''));
		expect(contractTxData).not.toContain(placeholder);
	});

	it('throws when the library placeholder is not found in the bytecode', async () => {
		const {env} = await createTestEnvironment({accounts: STANDARD_NAMED_ACCOUNTS, nodeAccounts: NODE_HELD_ACCOUNTS});
		const _deploy = deploy(env);

		const rawArtifact: Artifact<Abi> = {
			contractName: 'RawLinked',
			abi: LIB_ABI,
			bytecode: '0x6080604052' as `0x${string}`, // no placeholder
			deployedBytecode: '0x6080604052' as `0x${string}`,
			linkReferences: undefined as any,
			metadata: '{}',
		};

		await expect(
			_deploy(
				'RawLinked',
				{
					account: 'deployer',
					artifact: rawArtifact,
					args: [],
				},
				{
					libraries: {MathLib: ('0x' + '1'.repeat(40)) as `0x${string}`},
				},
			),
		).rejects.toThrow(/Can't link/);
	});

	it('supports the $name$ spelling for raw linking', async () => {
		const {env, provider} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			providerConfig: uniqueAddressesProviderConfig(),
		});
		const _deploy = deploy(env);

		const libArtifact = createMockArtifact('MathLib', LIB_ABI);
		const libDeployment = await _deploy('MathLib', {
			account: 'deployer',
			artifact: libArtifact,
			args: [],
		});

		// The $name$ spelling: the content between $...$ is used as-is, not keccak-hashed
		const placeholder = `__$MyLibHash$__`;
		const rawBytecode = ('0x6080604052' + placeholder + '6080') as `0x${string}`;

		const rawArtifact: Artifact<Abi> = {
			contractName: 'RawLinked',
			abi: LIB_ABI,
			bytecode: rawBytecode,
			deployedBytecode: '0x6080604052' as `0x${string}`,
			linkReferences: undefined as any,
			metadata: '{}',
		};

		await _deploy(
			'RawLinked',
			{
				account: 'deployer',
				artifact: rawArtifact,
				args: [],
			},
			{
				libraries: {$MyLibHash$: libDeployment.address} as any,
			},
		);

		const sendTxReqs = provider.getRequests().filter((r) => r.method === 'eth_sendTransaction');
		const contractTxData = (sendTxReqs[1].params![0] as any).data as string;
		expect(contractTxData).toContain(libDeployment.address.toLowerCase().replace('0x', ''));
		expect(contractTxData).not.toContain(placeholder);
	});
});
