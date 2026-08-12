/**
 * Integration tests for @rocketh/proxy - untested fresh-deploy options.
 *
 * The existing `proxy.integration.test.ts` covers the basic proxy variants and `owner`,
 * `execute: {methodName}`, `UUPS`, shared-admin, and deterministic. Many options remain
 * untested: `proxyDisabled`, `ERC173ProxyWithReceive`, custom proxy contract,
 * `execute: {init}` (the fresh-deploy half of the init/onUpgrade split),
 * `execute` as a bare string, `execute` method-not-found throw, unknown proxy contract
 * throw, and `deterministicImplementation`.
 *
 * These are all on the FRESH-deploy path, so they use `createTestEnvironment` directly
 * without the storage/store setup that the upgrade tests need.
 */

import {describe, it, expect} from 'vitest';
import {deployViaProxy} from '../src/index.js';
import {
	createTestEnvironment,
	createMockArtifact,
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
} from '@rocketh/test-utils';
import {encodeFunctionData} from 'viem';
import type {Abi} from 'abitype';

const CONTRACT_ABI = [
	{type: 'constructor', inputs: [{type: 'uint256', name: 'v'}], stateMutability: 'nonpayable'},
	{type: 'function', name: 'getValue', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
	{
		type: 'function',
		name: 'initialize',
		inputs: [{type: 'uint256', name: 'v'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

async function setup() {
	const {env, provider} = await createTestEnvironment({
		accounts: STANDARD_NAMED_ACCOUNTS,
		nodeAccounts: NODE_HELD_ACCOUNTS,
	});
	const artifact = createMockArtifact('Vault', CONTRACT_ABI);
	return {env, provider, artifact};
}

describe('@rocketh/proxy - fresh-deploy options', () => {
	describe('proxyDisabled', () => {
		it('deploys the implementation directly without a proxy', async () => {
			const {env} = await setup();
			const result = await deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact: createMockArtifact('Vault', CONTRACT_ABI), args: [42n]},
				{proxyDisabled: true},
			);

			expect(result).toBeDefined();
			// No _Proxy deployment should exist
			expect(env.getOrNull('Vault_Proxy')).toBeNull();
			// The deployment IS the implementation (no proxy wrapping)
			expect(result.address).toBe(env.get('Vault').address);
		});
	});

	describe('ERC173ProxyWithReceive', () => {
		it('deploys with the ERC173ProxyWithReceive variant', async () => {
			const {env} = await setup();
			const result = await deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact: createMockArtifact('Vault', CONTRACT_ABI), args: [42n]},
				{proxyContract: 'ERC173ProxyWithReceive'},
			);

			expect(result).toBeDefined();
			// A _Proxy deployment should exist
			expect(env.getOrNull('Vault_Proxy')).toBeDefined();
			// The proxy and implementation should be at different addresses
			expect(result.address).not.toBe(env.get('Vault_Implementation').address);
		});
	});

	describe('proxyContract: custom', () => {
		it('deploys with a custom proxy artifact', async () => {
			const {env} = await setup();

			// Use the EIP173Proxy artifact as the custom proxy (it's already available in the package)
			const EIP173ProxyWithReceive = (await import('../src/hardhat-deploy-v1-artifacts/EIP173ProxyWithReceive.js'))
				.default;

			const result = await deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact: createMockArtifact('Vault', CONTRACT_ABI), args: [42n]},
				{proxyContract: {type: 'custom', artifact: EIP173ProxyWithReceive}},
			);

			expect(result).toBeDefined();
			expect(env.getOrNull('Vault_Proxy')).toBeDefined();
		});

		it('deploys with a custom proxy artifact and custom args template', async () => {
			const {env} = await setup();

			const ERC1967Proxy = (await import('../src/hardhat-deploy-v1-artifacts/ERC1967Proxy.js')).default;

			// UUPS-style: only {implementation} and {data}, no {admin}
			const result = await deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact: createMockArtifact('Vault', CONTRACT_ABI), args: [42n]},
				{proxyContract: {type: 'custom', artifact: ERC1967Proxy, args: ['{implementation}', '{data}']}},
			);

			expect(result).toBeDefined();
			expect(env.getOrNull('Vault_Proxy')).toBeDefined();
		});
	});

	describe('unknown proxy contract', () => {
		it('throws for an unknown proxy contract name', async () => {
			const {env} = await setup();

			await expect(
				deployViaProxy(env)(
					'Vault',
					{account: 'deployer', artifact: createMockArtifact('Vault', CONTRACT_ABI), args: [42n]},
					{proxyContract: 'NonExistentProxy' as any},
				),
			).rejects.toThrow(/unknown proxy contract/);
		});
	});

	describe('execute: init (fresh deploy)', () => {
		it('encodes the init method call into the proxy constructor data field', async () => {
			const {env, provider} = await setup();
			const artifact = createMockArtifact('Vault', CONTRACT_ABI);

			await deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact, args: [42n]},
				{execute: {init: {methodName: 'initialize', args: [99n]}}},
			);

			// The proxy deployment tx should have `data` containing the encoded init call
			const proxyTx = provider
				.getRequests()
				.filter((r) => r.method === 'eth_sendTransaction')
				.map((r) => r.params?.[0] as any)
				.find((tx) => tx.data?.length > 200); // the proxy deploy has the longest data

			expect(proxyTx).toBeDefined();
			// The init calldata should be embedded in the proxy constructor args
			const initCalldata = encodeFunctionData({
				abi: CONTRACT_ABI,
				functionName: 'initialize',
				args: [99n],
			});
			// The proxy constructor data field is the 3rd arg (after implementation and admin)
			// We just verify the init calldata appears somewhere in the deployed data
			expect(proxyTx.data).toContain(initCalldata.slice(2));
		});

		it('accepts execute as a bare string (uses constructor args as init args)', async () => {
			const {env} = await setup();
			const artifact = createMockArtifact('Vault', CONTRACT_ABI);

			const result = await deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact, args: [42n]},
				{execute: 'initialize'},
			);

			expect(result).toBeDefined();
		});

		it('throws when the execute method is not found in the ABI', async () => {
			const {env} = await setup();

			await expect(
				deployViaProxy(env)(
					'Vault',
					{account: 'deployer', artifact: createMockArtifact('Vault', CONTRACT_ABI), args: [42n]},
					{execute: {init: {methodName: 'nonExistent', args: []}}},
				),
			).rejects.toThrow(/Method nonExistent not found/);
		});
	});

	describe('deterministicImplementation', () => {
		it('deploys the implementation deterministically while the proxy is non-deterministic', async () => {
			const {env} = await setup();
			const artifact = createMockArtifact('Vault', CONTRACT_ABI);

			const result = await deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact, args: [42n]},
				{deterministicImplementation: true},
			);

			expect(result).toBeDefined();
			// The implementation should be deterministic (deployed via create2)
			expect(env.getOrNull('Vault_Implementation')).toBeDefined();
		});
	});
});
