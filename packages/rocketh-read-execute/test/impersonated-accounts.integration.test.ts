/**
 * Integration tests: transactions sent AS an impersonated account (a Safe, on a fork rehearsal).
 *
 * Two behaviours of the environment, exercised through `execute` / `tx`:
 *
 * 1. A CONTRACT is never classified as node-held. anvil lists an address it has impersonated in
 *    `eth_accounts`, and keeps listing it, so on a node an earlier run impersonated a Safe through,
 *    the Safe used to come out as `node`. When auto-impersonation is on, a named account the node
 *    lists but which has contract code is impersonated and classified `impersonated`, so a batch
 *    consumer filtering on `signability === 'impersonated'` still gets the Safe's transactions.
 *
 * 2. `fundImpersonatedAccounts` pays an impersonated sender's gas. Impersonation makes the Safe
 *    the PAYER, which it never is for real, and a Safe usually holds no ETH. With the setting on,
 *    rocketh lends the account ETH just before the transaction and, once it is mined, sets the
 *    balance to what it would be had the account paid no gas.
 *
 * ```typescript
 * export const config = {
 * 	accounts: {deployer: {default: 0}, admin: {default: 1, sepolia: '0x<your Safe>'}},
 * 	environments: {
 * 		sepolia: {chain: 11155111, whenForked: {fundImpersonatedAccounts: true}},
 * 	},
 * 	data: {},
 * } as const satisfies UserConfig;
 * ```
 */

import {describe, it, expect} from 'vitest';
import type {Abi} from 'abitype';
import {execute, tx} from '../src/index.js';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';
import type {ExecutionParams, UserConfig} from '@rocketh/core/types';

const DEPLOYER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;
const SAFE = '0x04b9daee7f474c02953fa442aa754b0e6facd672' as `0x${string}`;
/** An EOA whose key the node holds, carrying an EIP-7702 delegation: code, but node-held. */
const DELEGATED_EOA = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' as `0x${string}`;
const CONTRACT_ADDRESS = ('0x' + 'a'.repeat(40)) as `0x${string}`;
const RECIPIENT = ('0x' + 'b'.repeat(40)) as `0x${string}`;

const SAFE_CODE = '0x608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e';
const DELEGATION_CODE = ('0xef0100' + 'c'.repeat(40)) as `0x${string}`;

/** What the harness's mock receipt reports: 21000 gas at 1 gwei. */
const GAS_PAID = 21000n * 1_000_000_000n;
const LOAN = 10n ** 21n;

const ABI = [
	{
		type: 'function',
		name: 'setValue',
		inputs: [{type: 'uint256', name: 'value'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

/**
 * A node that remembers balances, set by `hardhat_setBalance` and spent by
 * `eth_sendTransaction` (value plus the gas the mock receipt reports), so the test can read
 * what the account would hold on a real fork.
 */
async function setup(options: {
	nodeAccounts: `0x${string}`[];
	safeBalance?: bigint;
	executionParams?: Partial<ExecutionParams>;
	config?: Partial<UserConfig>;
}) {
	const balances = new Map<string, bigint>([[SAFE, options.safeBalance ?? 0n]]);
	const setBalanceCalls: {address: string; balance: bigint}[] = [];
	const balanceOf = (address: string) => balances.get(address.toLowerCase()) ?? 10n ** 22n;

	const {env, provider} = await createTestEnvironment({
		accounts: {deployer: DEPLOYER, admin: SAFE, delegated: DELEGATED_EOA},
		nodeAccounts: options.nodeAccounts,
		config: options.config,
		executionParams: {autoImpersonate: true, ...options.executionParams},
		providerConfig: {
			responses: {
				eth_getCode: (params?: unknown[]) => {
					const address = String(params?.[0]).toLowerCase();
					if (address === SAFE) return SAFE_CODE;
					if (address === DELEGATED_EOA) return DELEGATION_CODE;
					return '0x';
				},
				eth_getBalance: (params?: unknown[]) => `0x${balanceOf(String(params?.[0])).toString(16)}`,
				hardhat_setBalance: (params?: unknown[]) => {
					const address = String(params?.[0]).toLowerCase();
					const balance = BigInt(String(params?.[1]));
					setBalanceCalls.push({address, balance});
					balances.set(address, balance);
					return null;
				},
				eth_sendTransaction: (params?: unknown[]) => {
					const transaction = params?.[0] as {from: string; value?: string};
					const from = transaction.from.toLowerCase();
					const spent = BigInt(transaction.value ?? '0x0') + GAS_PAID;
					if (balanceOf(from) < spent) {
						throw new Error('Insufficient funds for gas * price + value');
					}
					balances.set(from, balanceOf(from) - spent);
					return ('0x' + 'c'.repeat(63) + (setBalanceCalls.length % 10).toString()) as `0x${string}`;
				},
			},
		},
	});
	const deployment = await env.save('TestContract', {
		address: CONTRACT_ADDRESS,
		...createMockArtifact('TestContract', ABI),
		argsData: '0x',
	});
	return {env, provider, deployment, setBalanceCalls, balanceOf};
}

describe('@rocketh/read-execute - transactions sent as an impersonated account', () => {
	describe('a contract is never node-held', () => {
		it('classifies a Safe the node lists in eth_accounts as impersonated, not node', async () => {
			/**
			 * What anvil looks like after an earlier rehearsal: the Safe is in `eth_accounts`.
			 */
			const {env} = await setup({nodeAccounts: [DEPLOYER, SAFE, DELEGATED_EOA]});

			expect(env.addressSignability[SAFE]).toBe('impersonated');
			expect(env.addressSignability[DEPLOYER]).toBe('node');
			// an EIP-7702 delegation is code on an EOA the node may hold the key for
			expect(env.addressSignability[DELEGATED_EOA]).toBe('node');
		});

		it('re-impersonates it, so its transactions are captured as impersonated', async () => {
			const {env, provider, deployment} = await setup({nodeAccounts: [DEPLOYER, SAFE], safeBalance: 10n ** 18n});

			await execute(env)(deployment, {account: 'admin', functionName: 'setValue', args: [1n]});

			expect(provider.getRequests().some((r) => r.method === 'hardhat_impersonateAccount')).toBe(true);
			expect(env.capturedTransactions.at(-1)).toMatchObject({from: SAFE, signability: 'impersonated'});
		});

		it('asks for code only when auto-impersonation is on, and then changes nothing for EOAs', async () => {
			const {env, provider} = await setup({
				nodeAccounts: [DEPLOYER, SAFE],
				executionParams: {autoImpersonate: false},
			});

			expect(provider.getRequests().some((r) => r.method === 'eth_getCode')).toBe(false);
			// with impersonation off, the node's list is all there is to go on
			expect(env.addressSignability[SAFE]).toBe('node');
		});
	});

	describe('fundImpersonatedAccounts', () => {
		it('without it, an impersonated Safe holding no ETH cannot pay for its transaction', async () => {
			const {env} = await setup({nodeAccounts: [DEPLOYER]});

			await expect(tx(env)({account: 'admin', to: RECIPIENT, value: 0n})).rejects.toThrow(/Insufficient funds/);
		});

		it('lends the gas and takes it back: the Safe ends where it would have, had it paid no gas', async () => {
			const {env, setBalanceCalls, balanceOf} = await setup({
				nodeAccounts: [DEPLOYER],
				executionParams: {fundImpersonatedAccounts: true},
			});

			await tx(env)({account: 'admin', to: RECIPIENT, value: 0n});

			expect(setBalanceCalls).toEqual([
				{address: SAFE, balance: LOAN},
				{address: SAFE, balance: 0n},
			]);
			expect(balanceOf(SAFE)).toBe(0n);
		});

		it('keeps what the transaction itself moved: value sent stays spent', async () => {
			const {env, balanceOf} = await setup({
				nodeAccounts: [DEPLOYER],
				safeBalance: 5n * 10n ** 17n,
				executionParams: {fundImpersonatedAccounts: true},
			});

			await tx(env)({account: 'admin', to: RECIPIENT, value: 10n ** 17n});

			expect(balanceOf(SAFE)).toBe(4n * 10n ** 17n);
		});

		it('works the same for a Safe re-impersonated from eth_accounts', async () => {
			const {env, deployment, balanceOf} = await setup({
				nodeAccounts: [DEPLOYER, SAFE],
				executionParams: {fundImpersonatedAccounts: true},
			});

			await execute(env)(deployment, {account: 'admin', functionName: 'setValue', args: [1n]});

			expect(balanceOf(SAFE)).toBe(0n);
		});

		it('never touches an account rocketh did not impersonate', async () => {
			const {env, setBalanceCalls} = await setup({
				nodeAccounts: [DEPLOYER],
				executionParams: {fundImpersonatedAccounts: true},
			});

			await tx(env)({account: 'deployer', to: RECIPIENT, value: 1n});

			expect(setBalanceCalls).toEqual([]);
		});

		it('can be set per chain, which is how a fork-only setting reaches it through whenForked', async () => {
			const {env, balanceOf} = await setup({
				nodeAccounts: [DEPLOYER],
				config: {chains: {31337: {fundImpersonatedAccounts: true}}},
			});

			await tx(env)({account: 'admin', to: RECIPIENT, value: 0n});

			expect(balanceOf(SAFE)).toBe(0n);
		});

		it('gives the loan back when the node refuses the transaction', async () => {
			const {env, provider, setBalanceCalls, balanceOf} = await setup({
				nodeAccounts: [DEPLOYER],
				executionParams: {fundImpersonatedAccounts: true},
			});
			provider.setResponse('eth_sendTransaction', () => {
				throw new Error('execution reverted');
			});

			await expect(tx(env)({account: 'admin', to: RECIPIENT, value: 0n})).rejects.toThrow(/execution reverted/);

			expect(setBalanceCalls.map((c) => c.balance)).toEqual([LOAN, 0n]);
			expect(balanceOf(SAFE)).toBe(0n);
		});

		it('is off unless asked for: nothing is lent by default', async () => {
			const {env, provider} = await setup({nodeAccounts: [DEPLOYER], safeBalance: 10n ** 18n});

			await tx(env)({account: 'admin', to: RECIPIENT, value: 0n});

			expect(provider.getRequests().some((r) => r.method === 'hardhat_setBalance')).toBe(false);
		});
	});
});
