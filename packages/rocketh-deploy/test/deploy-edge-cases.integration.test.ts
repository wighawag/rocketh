/**
 * Integration tests for @rocketh/deploy - deterministic redeploy, anonymous deploy,
 * salt normalization, and unknown deterministic type.
 *
 * The existing deploy tests cover basic deploy, deterministic deploy, create3,
 * skipIfAlreadyDeployed, alwaysOverride, strictBytecodeMatch, and library linking.
 * These tests cover the remaining edge cases in the deterministic-deploy path and the
 * anonymous (name='') deploy path.
 */

import {describe, it, expect} from 'vitest';
import {deploy} from '../src/index.js';
import {
	createTestEnvironment,
	createMockArtifact,
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
} from '@rocketh/test-utils';
import type {Abi} from 'abitype';

const ABI = [
	{type: 'constructor', inputs: [{type: 'uint256', name: 'v'}], stateMutability: 'nonpayable'},
	{type: 'function', name: 'getValue', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
] as const satisfies Abi;

/** Unique contract addresses per tx. */
function uniqueReceipts() {
	let counter = 0;
	return {
		eth_getTransactionReceipt: () => {
			counter++;
			const addr = ('0x' + counter.toString(16).padStart(40, 'a')) as `0x${string}`;
			return {
				contractAddress: addr,
				status: '0x1',
				blockNumber: '0x1',
				blockHash: `0x${'b'.repeat(64)}`,
				transactionHash: `0x${'c'.repeat(64)}`,
				gasUsed: '0x5208',
			};
		},
	};
}

/** Per-address eth_getCode: returns non-0x for specific addresses, 0x for others. */
function perAddressCode(deployedAddresses: Set<string>) {
	return {
		eth_getCode: (params?: unknown[]) => {
			const addr = (params?.[0] as string)?.toLowerCase();
			return deployedAddresses.has(addr) ? '0x60806040' : '0x';
		},
	};
}

/**
 * Per-address eth_getCode returning a CHOSEN runtime code, for the create3 checks below.
 *
 * `perAddressCode` above answers with an arbitrary non-empty string, which is all the
 * create2 path needs (it only asks whether an address is occupied). create3 asks a second
 * question (whether the code sitting there is OURS), so these tests have to control the
 * exact bytes.
 */
function perAddressRuntimeCode(codeByAddress: Map<string, `0x${string}`>) {
	return {
		eth_getCode: (params?: unknown[]) => {
			const addr = (params?.[0] as string)?.toLowerCase();
			return codeByAddress.get(addr) || '0x';
		},
	};
}

describe('@rocketh/deploy - deterministic redeploy', () => {
	it('reuses an already-deployed deterministic contract and returns newlyDeployed: false', async () => {
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			providerConfig: {responses: uniqueReceipts()},
		});
		const _deploy = deploy(env);
		const artifact = createMockArtifact('Token', ABI);

		// First deploy: normal deterministic
		const first = await _deploy(
			'Token',
			{account: 'deployer', artifact, args: [42n]},
			{
				deterministic: {type: 'create2', salt: ('0x' + 'ab'.repeat(32)) as `0x${string}`},
			},
		);
		expect(first.newlyDeployed).toBe(true);

		// Second deploy: the same code is already at the expected address
		// We need the eth_getCode to return non-0x for the expected address
		const deployed = new Set([first.address.toLowerCase()]);
		const {env: env2} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			deploymentStore: (await import('@rocketh/test-utils')).createMapDeploymentStore(),
			providerConfig: {responses: {...uniqueReceipts(), ...perAddressCode(deployed)}},
		});

		const second = await deploy(env2)(
			'Token',
			{account: 'deployer', artifact, args: [42n]},
			{
				deterministic: {type: 'create2', salt: ('0x' + 'ab'.repeat(32)) as `0x${string}`},
			},
		);

		expect(second.newlyDeployed).toBe(false);
		expect(second.address).toBe(first.address);
	});

	it('returns without saving for an anonymous (name=empty) already-deployed deterministic contract', async () => {
		const deployed = new Set<string>();
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			providerConfig: {responses: uniqueReceipts()},
		});
		const _deploy = deploy(env);
		const artifact = createMockArtifact('Anon', ABI);

		// First: deploy anonymously to find the expected address
		const first = await _deploy(
			'',
			{account: 'deployer', artifact, args: [1n]},
			{
				deterministic: {type: 'create2', salt: ('0x' + 'cd'.repeat(32)) as `0x${string}`},
			},
		);
		expect(first.address).toBeDefined();

		// Now mark the address as deployed
		deployed.add(first.address.toLowerCase());

		const {env: env2} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			providerConfig: {responses: {...uniqueReceipts(), ...perAddressCode(deployed)}},
		});

		const result = await deploy(env2)(
			'',
			{account: 'deployer', artifact, args: [1n]},
			{
				deterministic: {type: 'create2', salt: ('0x' + 'cd'.repeat(32)) as `0x${string}`},
			},
		);

		expect(result.newlyDeployed).toBe(false);
		expect(result.address).toBe(first.address);
	});

	/**
	 * A create3 address is derived from the DEPLOYER and the SALT alone, never from the
	 * bytecode, which is the whole point of create3 (the address survives a code change).
	 * So, unlike create2, finding code at the expected address does not by itself prove the
	 * code is the contract we were asked to deploy, and the deploy path checks.
	 *
	 * This pair pins both halves of that check. It matters most on the RECOVERY path: a
	 * clone with no `deployments/` folder, or a reset, where the local record is gone but
	 * the chain still has the contract. That is exactly when an idempotent re-run has to
	 * recognise its own deployment instead of failing.
	 */
	it('reuses an already-deployed create3 contract when the on-chain runtime code is ours', async () => {
		const artifact = createMockArtifact('Create3Token', ABI);
		const salt = ('0x' + 'ef'.repeat(32)) as `0x${string}`;

		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			providerConfig: {responses: uniqueReceipts()},
		});
		const first = await deploy(env)(
			'Create3Token',
			{account: 'deployer', artifact, args: [42n]},
			{deterministic: {type: 'create3', salt}},
		);
		expect(first.newlyDeployed).toBe(true);

		// Second run, fresh store (the local record is gone), with the contract's own runtime
		//  code at the address create3 computes.
		const codeByAddress = new Map<string, `0x${string}`>([
			[first.address.toLowerCase(), artifact.deployedBytecode as `0x${string}`],
		]);
		const {env: env2} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			deploymentStore: (await import('@rocketh/test-utils')).createMapDeploymentStore(),
			providerConfig: {responses: {...uniqueReceipts(), ...perAddressRuntimeCode(codeByAddress)}},
		});

		const second = await deploy(env2)(
			'Create3Token',
			{account: 'deployer', artifact, args: [42n]},
			{deterministic: {type: 'create3', salt}},
		);

		expect(second.newlyDeployed).toBe(false);
		expect(second.address).toBe(first.address);
	});

	it('refuses a create3 address already holding a DIFFERENT contract', async () => {
		const artifact = createMockArtifact('Create3Token', ABI);
		const salt = ('0x' + 'fe'.repeat(32)) as `0x${string}`;

		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			providerConfig: {responses: uniqueReceipts()},
		});
		const first = await deploy(env)(
			'Create3Token',
			{account: 'deployer', artifact, args: [42n]},
			{deterministic: {type: 'create3', salt}},
		);

		// Same deployer, same salt, but some other contract got there first: the salt was
		//  reused across two contracts, which create3 cannot distinguish by address.
		const codeByAddress = new Map<string, `0x${string}`>([[first.address.toLowerCase(), '0xdeadbeef']]);
		const {env: env2} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			deploymentStore: (await import('@rocketh/test-utils')).createMapDeploymentStore(),
			providerConfig: {responses: {...uniqueReceipts(), ...perAddressRuntimeCode(codeByAddress)}},
		});

		await expect(
			deploy(env2)(
				'Create3Token',
				{account: 'deployer', artifact, args: [42n]},
				{deterministic: {type: 'create3', salt}},
			),
		).rejects.toThrow(/already holds code that is not "Create3Token"/);
	});

	it('throws for an unknown deterministic type', async () => {
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
		});
		const _deploy = deploy(env);

		await expect(
			_deploy(
				'Token',
				{account: 'deployer', artifact: createMockArtifact('Token', ABI), args: [1n]},
				{
					deterministic: {type: 'create4' as any, salt: ('0x' + '00'.repeat(32)) as `0x${string}`},
				},
			),
		).rejects.toThrow(/unknown deterministic type/);
	});
});

describe('@rocketh/deploy - salt normalization', () => {
	it('deterministic: true uses zeroHash as the salt', async () => {
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			providerConfig: {responses: uniqueReceipts()},
		});
		const _deploy = deploy(env);
		const artifact = createMockArtifact('Token', ABI);

		const result1 = await _deploy(
			'Token1',
			{account: 'deployer', artifact, args: [1n]},
			{
				deterministic: true,
			},
		);
		expect(result1.address).toBeDefined();
	});

	it('a short salt is left-padded to 32 bytes', async () => {
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			providerConfig: {responses: uniqueReceipts()},
		});
		const _deploy = deploy(env);
		const artifact = createMockArtifact('Token', ABI);

		// Short salt: 0x1234 (2 bytes). Should be padded to 32 bytes: 0x000...1234
		const resultShort = await _deploy(
			'TokenShort',
			{account: 'deployer', artifact, args: [1n]},
			{
				deterministic: {type: 'create2', salt: '0x1234' as `0x${string}`},
			},
		);

		// Same salt padded should produce the same address
		const resultPadded = await _deploy(
			'TokenPadded',
			{account: 'deployer', artifact, args: [1n]},
			{
				deterministic: {type: 'create2', salt: ('0x' + '0'.repeat(60) + '1234') as `0x${string}`},
			},
		);

		expect(resultShort.address).toBe(resultPadded.address);
	});

	it('deterministic: {type: "create2"} with no salt uses zeroHash', async () => {
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			providerConfig: {responses: uniqueReceipts()},
		});
		const _deploy = deploy(env);
		const artifact = createMockArtifact('Token', ABI);

		const result = await _deploy(
			'TokenNoSalt',
			{account: 'deployer', artifact, args: [1n]},
			{
				deterministic: {type: 'create2'},
			},
		);
		expect(result.address).toBeDefined();
	});
});

describe('@rocketh/deploy - anonymous deploy (name=empty)', () => {
	it('does not save a deployment with an empty name', async () => {
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			providerConfig: {responses: uniqueReceipts()},
		});
		const _deploy = deploy(env);

		const result = await _deploy('', {account: 'deployer', artifact: createMockArtifact('Anon', ABI), args: [1n]});

		expect(result.address).toBeDefined();
		expect(env.getOrNull('')).toBeNull();
	});
});
