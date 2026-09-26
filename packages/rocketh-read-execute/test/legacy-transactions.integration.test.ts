/**
 * Integration tests for @rocketh/read-execute - `execute` and `tx` on a chain without EIP-1559
 *
 * The same rule as `@rocketh/deploy` (see its `legacy-transactions.integration.test.ts`):
 *
 * - `gasPrice` (or `type: 'legacy'`) on the call sends a legacy (type 0) transaction carrying it.
 * - `transactionType: 'legacy'` on the chain makes a call with no fee option legacy too.
 * - `gasPrice` together with an EIP-1559 fee field is refused, naming both.
 * - A chain left at the default sends exactly what it sent before.
 *
 * ```typescript
 * await execute(registry, {account: 'deployer', functionName: 'setValue', args: [42n], gasPrice: 2_000_000_000n});
 * await tx({account: 'deployer', to: recipient, value: 1n, gasPrice: 2_000_000_000n});
 * ```
 *
 * Both signer routes are covered: `eth_sendTransaction` for a node-held account, and the raw
 * transaction a `privateKey` account signed locally, read back with viem's `parseTransaction`.
 */

import {describe, it, expect} from 'vitest';
import {parseTransaction} from 'viem';
import type {Abi} from 'abitype';
import {execute, tx} from '../src/index.js';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';
import type {UserConfig} from '@rocketh/core/types';

const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;
/** anvil's account #1, as a `privateKey:` protocol string so the account signs LOCALLY. */
const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const CONTRACT_ADDRESS = ('0x' + 'a'.repeat(40)) as `0x${string}`;
const RECIPIENT = ('0x' + 'b'.repeat(40)) as `0x${string}`;

const ABI = [
	{
		type: 'function',
		name: 'setValue',
		inputs: [{type: 'uint256', name: 'value'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

const LEGACY_CHAIN: Partial<UserConfig> = {chains: {31337: {transactionType: 'legacy'}}};

async function setup(options: {signer: 'node' | 'local'; config?: Partial<UserConfig>}) {
	const {env, provider} = await createTestEnvironment(
		options.signer === 'node'
			? {accounts: {deployer: NODE_ACCOUNT}, nodeAccounts: [NODE_ACCOUNT], config: options.config}
			: {accounts: {deployer: `privateKey:${PRIVATE_KEY}`}, config: options.config},
	);
	const deployment = await env.save('TestContract', {
		address: CONTRACT_ADDRESS,
		...createMockArtifact('TestContract', ABI),
		argsData: '0x',
	});
	return {env, provider, deployment};
}

type TestProvider = Awaited<ReturnType<typeof setup>>['provider'];

function sentTransactions(provider: TestProvider): Record<string, unknown>[] {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendTransaction')
		.map((r) => r.params?.[0] as Record<string, unknown>);
}

function sentRawTransactions(provider: TestProvider) {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendRawTransaction')
		.map((r) => parseTransaction(r.params?.[0] as `0x${string}`));
}

function dispatchCount(provider: TestProvider): number {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendTransaction' || r.method === 'eth_sendRawTransaction').length;
}

describe('@rocketh/read-execute - chains without EIP-1559', () => {
	describe('execute', () => {
		it('sends a legacy transaction carrying gasPrice through a node-held account', async () => {
			const {env, provider, deployment} = await setup({signer: 'node'});

			await execute(env)(deployment, {
				account: 'deployer',
				functionName: 'setValue',
				args: [42n],
				gasPrice: 2_000_000_000n,
			});

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent.type).toBe('0x0');
			expect(sent.gasPrice).toBe('0x77359400');
			expect('maxFeePerGas' in sent).toBe(false);
			expect('accessList' in sent).toBe(false);
		});

		it('sends a legacy transaction carrying gasPrice through a locally signing account', async () => {
			const {env, provider, deployment} = await setup({signer: 'local'});

			await execute(env)(deployment, {
				account: 'deployer',
				functionName: 'setValue',
				args: [42n],
				gasPrice: 2_000_000_000n,
			});

			const signed = sentRawTransactions(provider).at(-1)!;
			expect(signed.type).toBe('legacy');
			// EIP-155: signed for the connected chain (31337), so it cannot be replayed on another one
			expect(signed.chainId).toBe(31337);
			expect(signed.gasPrice).toBe(2_000_000_000n);
			expect(signed.to).toBe(CONTRACT_ADDRESS);
		});

		it('sends type "legacy" as a legacy transaction', async () => {
			const {env, provider, deployment} = await setup({signer: 'node'});

			await execute(env)(deployment, {account: 'deployer', functionName: 'setValue', args: [42n], type: 'legacy'});

			expect(sentTransactions(provider).at(-1)?.type).toBe('0x0');
		});

		it('refuses gasPrice together with maxFeePerGas, naming both', async () => {
			const {env, provider, deployment} = await setup({signer: 'node'});

			await expect(
				execute(env)(deployment, {
					account: 'deployer',
					functionName: 'setValue',
					args: [42n],
					gasPrice: 1n,
					maxFeePerGas: 2n,
				} as never),
			).rejects.toThrow(/execute "setValue": "gasPrice" cannot be combined with "maxFeePerGas"/);
			expect(dispatchCount(provider)).toBe(0);
		});

		it('refuses an accessList on a legacy transaction instead of dropping it', async () => {
			const {env, provider, deployment} = await setup({signer: 'node', config: LEGACY_CHAIN});

			await expect(
				execute(env)(deployment, {account: 'deployer', functionName: 'setValue', args: [42n], accessList: []}),
			).rejects.toThrow(/"accessList" is not supported on a legacy \(type 0\) transaction/);
			expect(dispatchCount(provider)).toBe(0);
		});

		it('sends a fee-option-free call as legacy on a chain declared legacy, through both signer routes', async () => {
			const node = await setup({signer: 'node', config: LEGACY_CHAIN});
			await execute(node.env)(node.deployment, {account: 'deployer', functionName: 'setValue', args: [42n]});
			const sent = sentTransactions(node.provider).at(-1)!;
			expect(sent.type).toBe('0x0');
			expect(sent.gasPrice).toBeUndefined();

			const local = await setup({signer: 'local', config: LEGACY_CHAIN});
			await execute(local.env)(local.deployment, {account: 'deployer', functionName: 'setValue', args: [42n]});
			const signed = sentRawTransactions(local.provider).at(-1)!;
			expect(signed.type).toBe('legacy');
			// EIP-155: signed for the connected chain (31337), so it cannot be replayed on another one
			expect(signed.chainId).toBe(31337);
			// filled from `eth_gasPrice` before signing, since a local signer has no node to ask
			expect(signed.gasPrice).toBe(1_000_000_000n);
		});

		it('sends exactly what it sent before on a chain left at the default', async () => {
			const {env, provider, deployment} = await setup({signer: 'node'});

			await execute(env)(deployment, {account: 'deployer', functionName: 'setValue', args: [42n], gas: 100n});

			const sent = sentTransactions(provider).at(-1)!;
			expect(Object.keys(sent).sort()).toEqual(
				[
					'accessList',
					'chainId',
					'data',
					'from',
					'gas',
					'maxFeePerGas',
					'maxPriorityFeePerGas',
					'nonce',
					'to',
					'type',
				].sort(),
			);
			expect(sent).toMatchObject({
				type: '0x2',
				to: CONTRACT_ADDRESS,
				from: NODE_ACCOUNT,
				chainId: '0x7a69',
				gas: '0x64',
				maxFeePerGas: undefined,
				maxPriorityFeePerGas: undefined,
				accessList: undefined,
				nonce: undefined,
			});
		});
	});

	describe('tx', () => {
		it('sends a legacy transaction carrying gasPrice through a node-held account', async () => {
			const {env, provider} = await setup({signer: 'node'});

			await tx(env)({account: 'deployer', to: RECIPIENT, value: 1n, gasPrice: 2_000_000_000n});

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent.type).toBe('0x0');
			expect(sent.gasPrice).toBe('0x77359400');
			expect('maxFeePerGas' in sent).toBe(false);
		});

		it('sends a legacy transaction carrying gasPrice through a locally signing account', async () => {
			const {env, provider} = await setup({signer: 'local'});

			await tx(env)({account: 'deployer', to: RECIPIENT, value: 1n, gasPrice: 2_000_000_000n});

			const signed = sentRawTransactions(provider).at(-1)!;
			expect(signed.type).toBe('legacy');
			// EIP-155: signed for the connected chain (31337), so it cannot be replayed on another one
			expect(signed.chainId).toBe(31337);
			expect(signed.gasPrice).toBe(2_000_000_000n);
			expect(signed.value).toBe(1n);
		});

		it('refuses gasPrice together with maxPriorityFeePerGas, naming both', async () => {
			const {env, provider} = await setup({signer: 'node'});

			await expect(
				tx(env)({account: 'deployer', to: RECIPIENT, gasPrice: 1n, maxPriorityFeePerGas: 2n} as never),
			).rejects.toThrow(/tx: "gasPrice" cannot be combined with "maxPriorityFeePerGas"/);
			expect(dispatchCount(provider)).toBe(0);
		});

		it('sends a fee-option-free transaction as legacy on a chain declared legacy', async () => {
			const {env, provider} = await setup({signer: 'node', config: LEGACY_CHAIN});

			await tx(env)({account: 'deployer', to: RECIPIENT, value: 1n});

			expect(sentTransactions(provider).at(-1)?.type).toBe('0x0');
		});

		it('sends exactly what it sent before on a chain left at the default', async () => {
			const {env, provider} = await setup({signer: 'node'});

			await tx(env)({account: 'deployer', to: RECIPIENT, value: 1n, maxFeePerGas: 9n});

			const sent = sentTransactions(provider).at(-1)!;
			expect(Object.keys(sent).sort()).toEqual(
				[
					'accessList',
					'chainId',
					'data',
					'from',
					'gas',
					'maxFeePerGas',
					'maxPriorityFeePerGas',
					'to',
					'type',
					'value',
				].sort(),
			);
			expect(sent).toMatchObject({
				type: '0x2',
				to: RECIPIENT,
				from: NODE_ACCOUNT,
				chainId: '0x7a69',
				value: '0x1',
				maxFeePerGas: '0x9',
				maxPriorityFeePerGas: undefined,
			});
		});
	});
});
