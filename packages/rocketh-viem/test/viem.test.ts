/**
 * Integration tests for @rocketh/viem - the viem handle built from a rocketh environment.
 *
 * `viem(env)` builds a wallet/public client pair from `env.network.chain` and
 * `env.network.provider`, plus `getContract` / `getWritableContract` helpers that resolve
 * deployments through the environment. These tests use `createTestEnvironment` so the
 * clients run against the mock EIP-1193 provider.
 */

import {describe, it, expect} from 'vitest';
import {viem} from '../src/index.js';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';

const CONTRACT_ADDRESS = ('0x' + 'a'.repeat(40)) as `0x${string}`;
const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;

describe('@rocketh/viem - viem handle', () => {
	it('builds public and wallet clients from the environment', async () => {
		const {env} = await createTestEnvironment({accounts: {deployer: NODE_ACCOUNT}, nodeAccounts: [NODE_ACCOUNT]});
		const handle = viem(env);

		expect(handle.publicClient).toBeDefined();
		expect(handle.walletClient).toBeDefined();
		expect(handle.publicClient.chain?.id).toBe(31337);
	});

	it('getContract resolves a deployment by name', async () => {
		const {env} = await createTestEnvironment();
		const artifact = createMockArtifact('TestContract');
		await env.save('TestContract', {address: CONTRACT_ADDRESS, ...artifact, argsData: '0x'});

		const handle = viem(env);
		const contract = handle.getContract('TestContract');

		expect(contract.address).toBe(CONTRACT_ADDRESS);
	});

	it('getContract accepts a Deployment object directly', async () => {
		const {env} = await createTestEnvironment();
		const artifact = createMockArtifact('TestContract');
		const deployment = await env.save('TestContract', {address: CONTRACT_ADDRESS, ...artifact, argsData: '0x'});

		const handle = viem(env);
		const contract = handle.getContract(deployment);

		expect(contract.address).toBe(CONTRACT_ADDRESS);
	});

	it('getWritableContract creates a distinct wallet client when an account is provided', async () => {
		const {env, provider} = await createTestEnvironment({
			accounts: {deployer: NODE_ACCOUNT},
			nodeAccounts: [NODE_ACCOUNT],
		});
		const artifact = createMockArtifact('TestContract');
		await env.save('TestContract', {address: CONTRACT_ADDRESS, ...artifact, argsData: '0x'});

		const handle = viem(env);
		const contract = handle.getWritableContract('TestContract', {account: NODE_ACCOUNT});

		expect(contract.address).toBe(CONTRACT_ADDRESS);
		// A read through the public client should hit eth_call
		const calls = provider.getRequests().filter((r) => r.method === 'eth_call');
		expect(calls.length).toBe(0); // no calls yet
	});

	it('a read via getContract dispatches eth_call through the mock provider', async () => {
		const {env, provider} = await createTestEnvironment();
		const artifact = createMockArtifact('TestContract');
		await env.save('TestContract', {address: CONTRACT_ADDRESS, ...artifact, argsData: '0x'});

		provider.setResponse('eth_call', '0x000000000000000000000000000000000000000000000000000000000000002a');

		const handle = viem(env);
		const contract = handle.getContract('TestContract');

		const result = await contract.read.getValue();
		expect(result).toBe(42n);

		const calls = provider.getRequests().filter((r) => r.method === 'eth_call');
		expect(calls.length).toBeGreaterThan(0);
		expect((calls[0].params![0] as any).to).toBe(CONTRACT_ADDRESS);
	});
});
