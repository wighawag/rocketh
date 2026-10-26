/**
 * Integration tests for @rocketh/read-execute - `execute` and `tx` under run-level fee defaults
 *
 * The same rule as `@rocketh/deploy` (see its `run-level-fees.integration.test.ts`): a run started
 * with `--gas-price`, `--max-fee-per-gas` / `--max-priority-fee-per-gas` (or the same keys on
 * `ExecutionParams`) applies them to every call that states no fee option of its own, and a call
 * stating ANY of `type`, `gasPrice`, `maxFeePerGas`, `maxPriorityFeePerGas` decides its whole fee
 * set instead.
 *
 * ```typescript
 * // run with --gas-price 2000000000
 * await execute(registry, {account: 'deployer', functionName: 'setValue', args: [42n]}); // legacy, 2 gwei
 * await tx({account: 'deployer', to: recipient, value: 1n, maxFeePerGas: 9n}); // its own fees: EIP-1559
 * ```
 */

import {describe, it, expect} from 'vitest';
import {parseTransaction} from 'viem';
import type {Abi} from 'abitype';
import {execute, tx} from '../src/index.js';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';
import type {ExecutionParams, UserConfig} from '@rocketh/core/types';

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

type RunFees = Pick<ExecutionParams, 'gasPrice' | 'maxFeePerGas' | 'maxPriorityFeePerGas'>;

async function setup(options: {signer: 'node' | 'local'; runFees: RunFees; config?: Partial<UserConfig>}) {
	const {env, provider} = await createTestEnvironment(
		options.signer === 'node'
			? {
					accounts: {deployer: NODE_ACCOUNT},
					nodeAccounts: [NODE_ACCOUNT],
					config: options.config,
					executionParams: options.runFees,
				}
			: {accounts: {deployer: `privateKey:${PRIVATE_KEY}`}, config: options.config, executionParams: options.runFees},
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

describe('@rocketh/read-execute - run-level fee defaults', () => {
	describe('execute', () => {
		it('a call without fee options gets the run-level gasPrice: legacy, through a node-held account', async () => {
			const {env, provider, deployment} = await setup({signer: 'node', runFees: {gasPrice: 2_000_000_000n}});

			await execute(env)(deployment, {account: 'deployer', functionName: 'setValue', args: [42n]});

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent.type).toBe('0x0');
			expect(sent.gasPrice).toBe('0x77359400');
			expect('maxFeePerGas' in sent).toBe(false);
			expect('accessList' in sent).toBe(false);
		});

		it('a call without fee options gets the run-level gasPrice through a locally signing account', async () => {
			const {env, provider, deployment} = await setup({signer: 'local', runFees: {gasPrice: 2_000_000_000n}});

			await execute(env)(deployment, {account: 'deployer', functionName: 'setValue', args: [42n]});

			const signed = sentRawTransactions(provider).at(-1)!;
			expect(signed.type).toBe('legacy');
			expect(signed.gasPrice).toBe(2_000_000_000n);
			expect(signed.to).toBe(CONTRACT_ADDRESS);
		});

		it('run-level EIP-1559 values send EIP-1559 on a chain declared legacy', async () => {
			const {env, provider, deployment} = await setup({
				signer: 'node',
				runFees: {maxFeePerGas: 30n, maxPriorityFeePerGas: 7n},
				config: LEGACY_CHAIN,
			});

			await execute(env)(deployment, {account: 'deployer', functionName: 'setValue', args: [42n]});

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent).toMatchObject({type: '0x2', maxFeePerGas: '0x1e', maxPriorityFeePerGas: '0x7'});
		});

		it('a call with its own fee options ignores the run-level values', async () => {
			const {env, provider, deployment} = await setup({signer: 'node', runFees: {gasPrice: 9n}});

			await execute(env)(deployment, {
				account: 'deployer',
				functionName: 'setValue',
				args: [42n],
				maxPriorityFeePerGas: 2n,
			});

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent).toMatchObject({type: '0x2', maxFeePerGas: undefined, maxPriorityFeePerGas: '0x2'});
			expect('gasPrice' in sent).toBe(false);
		});

		it('refuses an accessList on a call the run-level gasPrice makes legacy, saying why', async () => {
			/**
			 * The call stated no FEE option (an access list is not one), so the run-level `gasPrice`
			 * applies, and a legacy transaction cannot carry an access list: refused rather than
			 * dropped. Giving the call `type: 'eip1559'` takes it out of the run-level values.
			 */
			const {env, provider, deployment} = await setup({signer: 'node', runFees: {gasPrice: 9n}});

			await expect(
				execute(env)(deployment, {
					account: 'deployer',
					functionName: 'setValue',
					args: [42n],
					accessList: [],
				}),
			).rejects.toThrow(
				/execute "setValue": "accessList" is not supported .* the run-level "gasPrice" makes this call legacy/,
			);
			expect(dispatchCount(provider)).toBe(0);

			await execute(env)(deployment, {
				account: 'deployer',
				functionName: 'setValue',
				args: [42n],
				accessList: [],
				type: 'eip1559',
			});
			expect(sentTransactions(provider).at(-1)!.type).toBe('0x2');
		});
	});

	describe('tx', () => {
		it('a call without fee options gets the run-level gasPrice, through a node-held account', async () => {
			const {env, provider} = await setup({signer: 'node', runFees: {gasPrice: 5n}});

			await tx(env)({account: 'deployer', to: RECIPIENT, value: 1n});

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent).toMatchObject({type: '0x0', gasPrice: '0x5', to: RECIPIENT});
		});

		it('a call without fee options gets the run-level maxFeePerGas alone, through a locally signing account', async () => {
			const {env, provider} = await setup({signer: 'local', runFees: {maxFeePerGas: 3_000_000_000n}});

			await tx(env)({account: 'deployer', to: RECIPIENT, value: 1n});

			const signed = sentRawTransactions(provider).at(-1)!;
			expect(signed.type).toBe('eip1559');
			expect(signed.maxFeePerGas).toBe(3_000_000_000n);
		});

		it('a call with its own gasPrice ignores the run-level EIP-1559 values', async () => {
			const {env, provider} = await setup({signer: 'node', runFees: {maxFeePerGas: 30n, maxPriorityFeePerGas: 7n}});

			await tx(env)({account: 'deployer', to: RECIPIENT, value: 1n, gasPrice: 4n});

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent).toMatchObject({type: '0x0', gasPrice: '0x4'});
			expect('maxFeePerGas' in sent).toBe(false);
		});
	});

	describe('a run that sets none of the three', () => {
		it('sends exactly what it sent before', async () => {
			const {env, provider, deployment} = await setup({signer: 'node', runFees: {}});

			await execute(env)(deployment, {account: 'deployer', functionName: 'setValue', args: [42n]});
			await tx(env)({account: 'deployer', to: RECIPIENT, value: 1n});

			const [executed, sentTx] = sentTransactions(provider);
			expect(executed).toMatchObject({type: '0x2', maxFeePerGas: undefined, maxPriorityFeePerGas: undefined});
			expect(sentTx).toMatchObject({type: '0x2', maxFeePerGas: undefined, maxPriorityFeePerGas: undefined});
			expect([executed, sentTx].some((t) => 'gasPrice' in t)).toBe(false);
		});
	});
});
