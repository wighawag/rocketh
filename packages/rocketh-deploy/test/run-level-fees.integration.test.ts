/**
 * Integration tests for @rocketh/deploy - run-level fee defaults
 *
 * A deploy command can set the fees of EVERY transaction its run builds, without editing a script:
 *
 * ```bash
 * rocketh -e mainnet --gas-price 2000000000                 # legacy (type 0), 2 gwei
 * rocketh -e mainnet --max-fee-per-gas 30000000000 --max-priority-fee-per-gas 1000000000
 * npx hardhat deploy --network mainnet --gas-price 2000000000
 * ```
 *
 * or programmatically, through `ExecutionParams`:
 *
 * ```typescript
 * await loadAndExecuteDeploymentsFromFiles({environment: 'mainnet', gasPrice: 2_000_000_000n});
 * ```
 *
 * Precedence, highest first:
 *
 * 1. the call's own fee options: a call stating ANY of `type`, `gasPrice`, `maxFeePerGas`,
 *    `maxPriorityFeePerGas` decides its whole fee set, and none of the run-level values apply to it;
 * 2. the run-level values, applied exactly as if the call had passed them: a run-level `gasPrice`
 *    sends legacy on any chain, a run-level EIP-1559 value sends EIP-1559 even on a chain declared
 *    `transactionType: 'legacy'`;
 * 3. the chain's `transactionType` default.
 *
 * A run-level `gasPrice` together with `maxFeePerGas` or `maxPriorityFeePerGas` is refused at
 * startup, before any transaction, as is a value that is not a non-negative integer.
 *
 * Both signer routes are covered: a node-held (`remote`) account through `eth_sendTransaction`,
 * and a `privateKey` (`signerOnly`) account signed locally and sent raw, read back here with
 * viem's `parseTransaction`.
 */

import {describe, it, expect} from 'vitest';
import {parseTransaction} from 'viem';
import type {Abi} from 'abitype';
import {deploy} from '../src/index.js';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';
import type {ExecutionParams, UserConfig} from '@rocketh/core/types';

const NODE_DEPLOYER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;
/** anvil's account #1, as a `privateKey:` protocol string so the account signs LOCALLY. */
const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

const CREATE2_FACTORY_DEPLOYER = '0x3fab184622dc19b6109349b94811493bf2a45362';
const CREATE3_FACTORY = '0x000000000004d4f168dae7db3c610f408ee22f57';
const SALT = ('0x' + '11'.repeat(32)) as `0x${string}`;

const ABI = [
	{type: 'constructor', inputs: [{type: 'uint256', name: 'v'}], stateMutability: 'nonpayable'},
] as const satisfies Abi;

const LEGACY_CHAIN: Partial<UserConfig> = {chains: {31337: {transactionType: 'legacy'}}};

type RunFees = Pick<ExecutionParams, 'gasPrice' | 'maxFeePerGas' | 'maxPriorityFeePerGas'>;
type TestProvider = Awaited<ReturnType<typeof createTestEnvironment>>['provider'];

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

async function nodeHeld(
	runFees: RunFees,
	options?: {config?: Partial<UserConfig>; responses?: Record<string, unknown>},
) {
	const {env, provider} = await createTestEnvironment({
		accounts: {deployer: NODE_DEPLOYER},
		nodeAccounts: [NODE_DEPLOYER],
		config: options?.config,
		executionParams: runFees,
		providerConfig: options?.responses ? {responses: options.responses} : undefined,
	});
	return {env, _deploy: deploy(env), provider};
}

async function localSigner(runFees: RunFees, config?: Partial<UserConfig>) {
	const {env, provider} = await createTestEnvironment({
		accounts: {deployer: `privateKey:${PRIVATE_KEY}`},
		config,
		executionParams: runFees,
	});
	return {env, _deploy: deploy(env), provider};
}

function plain(name: string) {
	return {account: 'deployer', artifact: createMockArtifact(name), args: [42n]} as const;
}

describe('@rocketh/deploy - run-level fee defaults', () => {
	describe('each value on its own', () => {
		it('a run-level gasPrice sends legacy on a default (EIP-1559) chain, through a node-held account', async () => {
			/**
			 * Exactly as if the call had passed `gasPrice: 2_000_000_000n` itself.
			 */
			const {_deploy, provider, env} = await nodeHeld({gasPrice: 2_000_000_000n});
			expect(env.network.gasPrice).toBe(2_000_000_000n);

			await _deploy('Plain', plain('Plain'));

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent.type).toBe('0x0');
			expect(sent.gasPrice).toBe('0x77359400');
			expect('maxFeePerGas' in sent).toBe(false);
			expect('maxPriorityFeePerGas' in sent).toBe(false);
		});

		it('a run-level gasPrice sends legacy through a locally signing account', async () => {
			const {_deploy, provider} = await localSigner({gasPrice: 2_000_000_000n});

			await _deploy('Plain', plain('Plain'));

			const signed = sentRawTransactions(provider).at(-1)!;
			expect(signed.type).toBe('legacy');
			expect(signed.chainId).toBe(31337);
			expect(signed.gasPrice).toBe(2_000_000_000n);
			// the price was given, so nothing asked the node for one
			expect(provider.getRequests().some((r) => r.method === 'eth_gasPrice')).toBe(false);
		});

		it('a run-level maxFeePerGas alone sends EIP-1559 with that cap, the priority fee left to the node', async () => {
			const {_deploy, provider} = await nodeHeld({maxFeePerGas: 30n});

			await _deploy('Plain', plain('Plain'));

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent.type).toBe('0x2');
			expect(sent.maxFeePerGas).toBe('0x1e');
			expect(sent.maxPriorityFeePerGas).toBeUndefined();
			expect('gasPrice' in sent).toBe(false);
		});

		it('a run-level maxPriorityFeePerGas alone sends EIP-1559 with that tip, the cap left to the node', async () => {
			const {_deploy, provider} = await nodeHeld({maxPriorityFeePerGas: 7n});

			await _deploy('Plain', plain('Plain'));

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent.type).toBe('0x2');
			expect(sent.maxFeePerGas).toBeUndefined();
			expect(sent.maxPriorityFeePerGas).toBe('0x7');
		});

		it('a run-level maxPriorityFeePerGas alone, through a locally signing account, is the tip it signs', async () => {
			/**
			 * A local signer fills the missing cap itself (from `eth_feeHistory`), around the tip it
			 * was given.
			 */
			const {_deploy, provider} = await localSigner({maxPriorityFeePerGas: 7n});

			await _deploy('Plain', plain('Plain'));

			const signed = sentRawTransactions(provider).at(-1)!;
			expect(signed.type).toBe('eip1559');
			expect(signed.maxPriorityFeePerGas).toBe(7n);
		});
	});

	describe('the two EIP-1559 values together', () => {
		it('sends both, through a node-held account', async () => {
			const {_deploy, provider} = await nodeHeld({maxFeePerGas: 30n, maxPriorityFeePerGas: 7n});

			await _deploy('Plain', plain('Plain'));

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent).toMatchObject({type: '0x2', maxFeePerGas: '0x1e', maxPriorityFeePerGas: '0x7'});
		});

		it('signs both, through a locally signing account, without asking the node for fees', async () => {
			const {_deploy, provider} = await localSigner({maxFeePerGas: 30n, maxPriorityFeePerGas: 7n});

			await _deploy('Plain', plain('Plain'));

			const signed = sentRawTransactions(provider).at(-1)!;
			expect(signed.type).toBe('eip1559');
			expect(signed.maxFeePerGas).toBe(30n);
			expect(signed.maxPriorityFeePerGas).toBe(7n);
			expect(provider.getRequests().some((r) => r.method === 'eth_feeHistory')).toBe(false);
		});

		it('sends EIP-1559 even on a chain declared legacy, like the per-call fields', async () => {
			const {_deploy, provider} = await nodeHeld({maxFeePerGas: 30n, maxPriorityFeePerGas: 7n}, {config: LEGACY_CHAIN});

			await _deploy('Plain', plain('Plain'));

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent).toMatchObject({type: '0x2', maxFeePerGas: '0x1e', maxPriorityFeePerGas: '0x7'});
		});

		it('sends EIP-1559 on a chain declared legacy through a locally signing account', async () => {
			const {_deploy, provider} = await localSigner({maxFeePerGas: 30n}, LEGACY_CHAIN);

			await _deploy('Plain', plain('Plain'));

			const signed = sentRawTransactions(provider).at(-1)!;
			expect(signed.type).toBe('eip1559');
			expect(signed.maxFeePerGas).toBe(30n);
		});
	});

	describe('precedence: the call decides its whole fee set', () => {
		it('a call with its own gasPrice ignores the run-level EIP-1559 values', async () => {
			const {_deploy, provider} = await nodeHeld({maxFeePerGas: 30n, maxPriorityFeePerGas: 7n});

			await _deploy('Own', {...plain('Own'), gasPrice: 5n});

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent.type).toBe('0x0');
			expect(sent.gasPrice).toBe('0x5');
			expect('maxFeePerGas' in sent).toBe(false);
		});

		it('a call with ONE EIP-1559 field gets no run-level value merged into the other', async () => {
			/**
			 * Not a per-field merge: the call stated a fee, so the run-level `maxFeePerGas` does not
			 * fill its cap. The node (or a local signer) does.
			 */
			const {_deploy, provider} = await nodeHeld({maxFeePerGas: 30n, maxPriorityFeePerGas: 7n});

			await _deploy('Own', {...plain('Own'), maxPriorityFeePerGas: 2n});

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent).toMatchObject({type: '0x2', maxFeePerGas: undefined, maxPriorityFeePerGas: '0x2'});
		});

		it('a call with `type: eip1559` ignores a run-level gasPrice', async () => {
			const {_deploy, provider} = await nodeHeld({gasPrice: 9n});

			await _deploy('Own', {...plain('Own'), type: 'eip1559'});

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent).toMatchObject({type: '0x2', maxFeePerGas: undefined, maxPriorityFeePerGas: undefined});
			expect('gasPrice' in sent).toBe(false);
		});

		it('a call without fee options in the same run gets the run-level values', async () => {
			const {_deploy, provider} = await nodeHeld({gasPrice: 9n});

			await _deploy('Own', {...plain('Own'), type: 'eip1559'});
			await _deploy('Plain', plain('Plain'));

			const [own, plainTx] = sentTransactions(provider);
			expect(own.type).toBe('0x2');
			expect(plainTx).toMatchObject({type: '0x0', gasPrice: '0x9'});
		});
	});

	describe('factory bootstrap transactions inherit the run-level values', () => {
		it('the create2 funding transfer and the deployment through the factory carry the run-level gasPrice', async () => {
			/**
			 * No factory on chain and an unfunded factory deployer: rocketh funds it and relays the
			 * canonical pre-signed factory deployment (legacy already), then deploys through it.
			 */
			const {_deploy, provider} = await nodeHeld({gasPrice: 5n}, {responses: {eth_getBalance: '0x0'}});

			await _deploy(
				'Token',
				{account: 'deployer', artifact: createMockArtifact('Token', ABI), args: [1n]},
				{deterministic: {type: 'create2', salt: SALT}},
			);

			const sent = sentTransactions(provider);
			expect(sent).toHaveLength(2);
			expect(sent[0].to).toBe(CREATE2_FACTORY_DEPLOYER);
			expect(sent.map((t) => [t.type, t.gasPrice])).toEqual([
				['0x0', '0x5'],
				['0x0', '0x5'],
			]);
		});

		it('the create3 bootstrap carries the run-level EIP-1559 values, through a locally signing account', async () => {
			const {env, provider} = await createTestEnvironment({
				accounts: {deployer: `privateKey:${PRIVATE_KEY}`},
				executionParams: {maxFeePerGas: 30n, maxPriorityFeePerGas: 7n},
				providerConfig: {responses: {eth_getBalance: '0x0'}},
			});

			await deploy(env)(
				'Token',
				{account: 'deployer', artifact: createMockArtifact('Token', ABI), args: [1n]},
				{deterministic: {type: 'create3', salt: SALT}},
			);

			const signed = sentRawTransactions(provider);
			// the relayed canonical create2 factory deployment, then funding, create3 factory, deployment
			const built = signed.filter((t) => t.type === 'eip1559');
			expect(built).toHaveLength(3);
			for (const t of built) {
				expect(t.maxFeePerGas).toBe(30n);
				expect(t.maxPriorityFeePerGas).toBe(7n);
			}
			expect(built[2].to?.toLowerCase()).toBe(CREATE3_FACTORY);
		});
	});

	describe('refused at startup', () => {
		it('refuses a run-level gasPrice with maxFeePerGas, naming both, before any transaction', async () => {
			await expect(nodeHeld({gasPrice: 1n, maxFeePerGas: 2n})).rejects.toThrow(
				'run-level fees: "gasPrice" cannot be combined with "maxFeePerGas"',
			);
		});

		it('refuses a run-level gasPrice with both EIP-1559 values, naming all three', async () => {
			await expect(nodeHeld({gasPrice: 1n, maxFeePerGas: 2n, maxPriorityFeePerGas: 3n})).rejects.toThrow(
				'"gasPrice" cannot be combined with "maxFeePerGas" and "maxPriorityFeePerGas"',
			);
		});

		it('refuses a value that is not a non-negative integer', async () => {
			await expect(nodeHeld({maxPriorityFeePerGas: -1n})).rejects.toThrow(
				'run-level fee "maxPriorityFeePerGas" must be a non-negative integer amount in wei (a bigint), got -1.',
			);
			// a JavaScript caller can hand over anything; a number is refused, not coerced
			await expect(nodeHeld({gasPrice: 1.5 as unknown as bigint})).rejects.toThrow(
				'run-level fee "gasPrice" must be a non-negative integer amount in wei (a bigint), got 1.5.',
			);
		});
	});

	describe('a run that sets none of the three', () => {
		it('sends exactly what it sent before: EIP-1559, fees left to the node, bootstrap included', async () => {
			/**
			 * The same assertions as the default-chain case of `legacy-transactions.integration.test.ts`,
			 * on the full provider requests, with the run-level keys explicitly `undefined` as a
			 * programmatic caller may pass them.
			 */
			const {_deploy, provider, env} = await nodeHeld(
				{gasPrice: undefined, maxFeePerGas: undefined, maxPriorityFeePerGas: undefined},
				{responses: {eth_getBalance: '0x0'}},
			);
			expect('gasPrice' in env.network).toBe(false);
			expect('maxFeePerGas' in env.network).toBe(false);
			expect('maxPriorityFeePerGas' in env.network).toBe(false);

			await _deploy(
				'Token',
				{account: 'deployer', artifact: createMockArtifact('Token', ABI), args: [1n]},
				{deterministic: {type: 'create2', salt: SALT}},
			);

			const sent = sentTransactions(provider);
			expect(sent).toHaveLength(2);
			expect(Object.keys(sent[0]).sort()).toEqual(
				['chainId', 'from', 'gas', 'maxFeePerGas', 'maxPriorityFeePerGas', 'to', 'type', 'value'].sort(),
			);
			expect(sent[0]).toMatchObject({
				type: '0x2',
				chainId: '0x7a69',
				from: NODE_DEPLOYER,
				to: CREATE2_FACTORY_DEPLOYER,
				gas: '0x5208',
				maxFeePerGas: undefined,
				maxPriorityFeePerGas: undefined,
			});
			expect(Object.keys(sent[1]).sort()).toEqual(
				['chainId', 'data', 'from', 'gas', 'maxFeePerGas', 'maxPriorityFeePerGas', 'nonce', 'to', 'type'].sort(),
			);
			expect(sent[1]).toMatchObject({
				type: '0x2',
				chainId: '0x7a69',
				from: NODE_DEPLOYER,
				gas: undefined,
				maxFeePerGas: undefined,
				maxPriorityFeePerGas: undefined,
				nonce: undefined,
			});
			expect(sent.some((t) => 'gasPrice' in t)).toBe(false);
		});

		it('still follows the chain default on a chain declared legacy', async () => {
			const {_deploy, provider} = await nodeHeld({}, {config: LEGACY_CHAIN});

			await _deploy('Plain', plain('Plain'));

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent.type).toBe('0x0');
			expect(sent.gasPrice).toBeUndefined();
		});
	});
});
