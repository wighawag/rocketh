/**
 * Integration tests: transactions sent AS an impersonated account (a Safe, on a fork rehearsal).
 *
 * Two behaviours of the environment, exercised through `execute` / `tx`:
 *
 * 1. An account declared by ADDRESS is impersonated, whatever the node lists. anvil lists an
 *    address it has impersonated in `eth_accounts`, and keeps listing it, so on a node an earlier
 *    run impersonated a Safe through, the Safe used to come out as `node`. When auto-impersonation
 *    is on, rocketh now impersonates every named account the config declares by address and
 *    classifies it `impersonated`, so a batch consumer filtering on `signability === 'impersonated'`
 *    still gets the Safe's transactions. An account declared by INDEX is the node's own and stays
 *    `node`.
 *
 * 2. `fundImpersonatedAccounts` pays an impersonated sender's gas. Impersonation makes the Safe
 *    the PAYER, which it never is for real, and a Safe usually holds no ETH. With the setting on,
 *    rocketh lends the account exactly the most the transaction can cost in gas (its gas limit
 *    times its max fee per gas, both filled by rocketh) and, once it is mined, sets the balance to
 *    what it would be had the account paid no gas. Value the transaction sends is NOT lent.
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
/** A node-held account written out by ADDRESS rather than by index. */
const NODE_ACCOUNT_BY_ADDRESS = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' as `0x${string}`;
const CONTRACT_ADDRESS = ('0x' + 'a'.repeat(40)) as `0x${string}`;
const RECIPIENT = ('0x' + 'b'.repeat(40)) as `0x${string}`;

/** What the harness's mock receipt reports: 21000 gas at 1 gwei. */
const GAS_PAID = 21000n * 1_000_000_000n;

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
	impersonation?: 'succeed' | 'fail';
	safeBalance?: bigint;
	executionParams?: Partial<ExecutionParams>;
	config?: Partial<UserConfig>;
}) {
	const balances = new Map<string, bigint>([[SAFE, options.safeBalance ?? 0n]]);
	const setBalanceCalls: {address: string; balance: bigint}[] = [];
	const balanceOf = (address: string) => balances.get(address.toLowerCase()) ?? 10n ** 22n;

	const {env, provider} = await createTestEnvironment({
		// the deployer by INDEX (the node's own account), the Safe by ADDRESS
		accounts: {
			deployer: 0,
			admin: SAFE,
			byAddress: NODE_ACCOUNT_BY_ADDRESS,
			// a per-network map whose entry for this network is an address
			perNetwork: {default: 1, memory: NODE_ACCOUNT_BY_ADDRESS},
		},
		nodeAccounts: options.nodeAccounts,
		impersonation: options.impersonation,
		config: options.config,
		executionParams: {autoImpersonate: true, ...options.executionParams},
		providerConfig: {
			responses: {
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
	/** What a transaction sent by `from` could cost in gas at most, as it was sent to the node. */
	const maxGasCostOf = (from: string) => {
		const sent = provider
			.getRequests()
			.filter((r) => r.method === 'eth_sendTransaction')
			.map((r) => r.params?.[0] as {from: string; gas?: string; maxFeePerGas?: string})
			.filter((t) => t.from.toLowerCase() === from)
			.at(-1)!;
		return BigInt(sent.gas!) * BigInt(sent.maxFeePerGas!);
	};
	return {env, provider, deployment, setBalanceCalls, balanceOf, maxGasCostOf};
}

describe('@rocketh/read-execute - transactions sent as an impersonated account', () => {
	describe('an account declared by address is impersonated', () => {
		it('classifies a Safe the node lists in eth_accounts as impersonated, not node', async () => {
			/**
			 * What anvil looks like after an earlier rehearsal: the Safe is in `eth_accounts`.
			 */
			const {env} = await setup({nodeAccounts: [DEPLOYER, SAFE]});

			expect(env.addressSignability[SAFE]).toBe('impersonated');
			// declared by index: the node's own account
			expect(env.addressSignability[DEPLOYER]).toBe('node');
		});

		it('re-impersonates it, so its transactions are captured as impersonated', async () => {
			const {env, provider, deployment} = await setup({nodeAccounts: [DEPLOYER, SAFE], safeBalance: 10n ** 18n});

			await execute(env)(deployment, {account: 'admin', functionName: 'setValue', args: [1n]});

			expect(provider.getRequests().some((r) => r.method === 'hardhat_impersonateAccount')).toBe(true);
			expect(env.capturedTransactions.at(-1)).toMatchObject({from: SAFE, signability: 'impersonated'});
		});

		it('decides from the declaration, never from code: no eth_getCode is asked', async () => {
			const {provider} = await setup({nodeAccounts: [DEPLOYER, SAFE]});

			expect(provider.getRequests().some((r) => r.method === 'eth_getCode')).toBe(false);
		});

		it('labels a node account written out by address impersonated too, and it still signs', async () => {
			/**
			 * The one visible change: an account the node really holds, declared by its address
			 * rather than by index, is impersonated while auto-impersonation is on. Declare the
			 * node's own accounts by index to keep them `node`.
			 */
			const {env} = await setup({nodeAccounts: [DEPLOYER, NODE_ACCOUNT_BY_ADDRESS]});

			expect(env.addressSignability[NODE_ACCOUNT_BY_ADDRESS]).toBe('impersonated');
			await tx(env)({account: 'byAddress', to: RECIPIENT, value: 1n});
			expect(env.capturedTransactions.at(-1)).toMatchObject({from: NODE_ACCOUNT_BY_ADDRESS});
		});

		it('reads the declaration this network uses from a per-network map', async () => {
			const {env} = await setup({nodeAccounts: [DEPLOYER, NODE_ACCOUNT_BY_ADDRESS]});

			expect(env.namedAccounts.perNetwork.toLowerCase()).toBe(NODE_ACCOUNT_BY_ADDRESS);
			expect(env.addressSignability[NODE_ACCOUNT_BY_ADDRESS]).toBe('impersonated');
		});

		it('falls back to node when impersonation fails for an account the node lists', async () => {
			const {env} = await setup({nodeAccounts: [DEPLOYER, NODE_ACCOUNT_BY_ADDRESS], impersonation: 'fail'});

			expect(env.addressSignability[NODE_ACCOUNT_BY_ADDRESS]).toBe('node');
		});

		it('leaves the node list as the answer when auto-impersonation is off', async () => {
			const {env} = await setup({
				nodeAccounts: [DEPLOYER, SAFE],
				executionParams: {autoImpersonate: false},
			});

			expect(env.addressSignability[SAFE]).toBe('node');
		});
	});

	describe('fundImpersonatedAccounts', () => {
		it('without it, an impersonated Safe holding no ETH cannot pay for its transaction', async () => {
			const {env} = await setup({nodeAccounts: [DEPLOYER]});

			await expect(tx(env)({account: 'admin', to: RECIPIENT, value: 0n})).rejects.toThrow(/Insufficient funds/);
		});

		it('lends the gas and takes it back: the Safe ends where it would have, had it paid no gas', async () => {
			const {env, setBalanceCalls, balanceOf, maxGasCostOf} = await setup({
				nodeAccounts: [DEPLOYER],
				executionParams: {fundImpersonatedAccounts: true},
			});

			await tx(env)({account: 'admin', to: RECIPIENT, value: 0n});

			// the loan is exactly the most this transaction could cost in gas, nothing more
			expect(setBalanceCalls).toEqual([
				{address: SAFE, balance: maxGasCostOf(SAFE)},
				{address: SAFE, balance: 0n},
			]);
			expect(balanceOf(SAFE)).toBe(0n);
		});

		it('lends gas limit times gas price for a legacy transaction, and leaves the nonce to the node', async () => {
			const {env, provider, setBalanceCalls, balanceOf} = await setup({
				nodeAccounts: [DEPLOYER],
				executionParams: {fundImpersonatedAccounts: true},
				config: {chains: {31337: {transactionType: 'legacy'}}},
			});

			await tx(env)({account: 'admin', to: RECIPIENT, value: 0n});

			const sent = provider
				.getRequests()
				.filter((r) => r.method === 'eth_sendTransaction')
				.map((r) => r.params?.[0] as {type: string; gas: string; gasPrice: string; nonce?: string})
				.at(-1)!;
			expect(sent.type).toBe('0x0');
			expect(setBalanceCalls[0].balance).toBe(BigInt(sent.gas) * BigInt(sent.gasPrice));
			expect(sent.nonce).toBeUndefined();
			expect(provider.getRequests().some((r) => r.method === 'eth_getTransactionCount')).toBe(false);
			expect(balanceOf(SAFE)).toBe(0n);
		});

		it('lends no value: a Safe sending ETH it does not have fails, as it would for real', async () => {
			const {env, balanceOf} = await setup({
				nodeAccounts: [DEPLOYER],
				executionParams: {fundImpersonatedAccounts: true},
			});

			await expect(tx(env)({account: 'admin', to: RECIPIENT, value: 10n ** 18n})).rejects.toThrow(/Insufficient funds/);
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

		it('works the same for a Safe the node lists in eth_accounts', async () => {
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

		it('reaches a fork run through whenForked, the usual way to turn it on', async () => {
			/**
			 * `whenForked` applies only when the run is a fork, so a plain run of the same
			 * environment pays as it would for real.
			 */
			const {env, balanceOf} = await setup({
				nodeAccounts: [DEPLOYER],
				executionParams: {environment: {fork: 'memory'}},
				config: {environments: {memory: {chain: 31337, whenForked: {fundImpersonatedAccounts: true}}}},
			});
			expect(env.network.fork).toBeDefined();

			await tx(env)({account: 'admin', to: RECIPIENT, value: 0n});

			expect(balanceOf(SAFE)).toBe(0n);
		});

		it('is not reached by whenForked on a run that is not a fork', async () => {
			const {env, provider} = await setup({
				nodeAccounts: [DEPLOYER],
				safeBalance: 10n ** 18n,
				config: {environments: {memory: {chain: 31337, whenForked: {fundImpersonatedAccounts: true}}}},
			});

			await tx(env)({account: 'admin', to: RECIPIENT, value: 0n});

			expect(provider.getRequests().some((r) => r.method === 'hardhat_setBalance')).toBe(false);
		});

		it('a run-level false wins over the chain config', async () => {
			const {env, provider} = await setup({
				nodeAccounts: [DEPLOYER],
				safeBalance: 10n ** 18n,
				executionParams: {fundImpersonatedAccounts: false},
				config: {chains: {31337: {fundImpersonatedAccounts: true}}},
			});

			await tx(env)({account: 'admin', to: RECIPIENT, value: 0n});

			expect(provider.getRequests().some((r) => r.method === 'hardhat_setBalance')).toBe(false);
		});

		it('settles a transaction that reverted: its gas was paid all the same', async () => {
			const {env, provider, balanceOf} = await setup({
				nodeAccounts: [DEPLOYER],
				executionParams: {fundImpersonatedAccounts: true},
			});
			provider.setResponse('eth_getTransactionReceipt', (params?: unknown[]) => ({
				contractAddress: null,
				status: '0x0',
				transactionHash: params?.[0],
				blockHash: ('0x' + 'b'.repeat(64)) as `0x${string}`,
				blockNumber: '0x1',
				transactionIndex: '0x0',
				gasUsed: '0x5208',
				effectiveGasPrice: '0x3b9aca00',
				logs: [],
				from: SAFE,
			}));

			await expect(tx(env)({account: 'admin', to: RECIPIENT, value: 0n})).rejects.toThrow();

			expect(balanceOf(SAFE)).toBe(0n);
		});

		it('can be set per chain', async () => {
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

			expect(setBalanceCalls.map((c) => c.balance)).toEqual([setBalanceCalls[0].balance, 0n]);
			expect(setBalanceCalls[0].balance).toBeGreaterThan(0n);
			expect(balanceOf(SAFE)).toBe(0n);
		});

		it('is off unless asked for: nothing is lent by default', async () => {
			const {env, provider} = await setup({nodeAccounts: [DEPLOYER], safeBalance: 10n ** 18n});

			await tx(env)({account: 'admin', to: RECIPIENT, value: 0n});

			expect(provider.getRequests().some((r) => r.method === 'hardhat_setBalance')).toBe(false);
		});
	});
});
