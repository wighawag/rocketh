/**
 * Integration tests for @rocketh/deploy - deploying to a chain without EIP-1559
 *
 * Some chains reject EIP-1559 (type 2) transactions outright. rocketh reaches them two ways:
 *
 * - PER CALL: pass `gasPrice` (or `type: 'legacy'`) and the deployment goes out as a legacy
 *   (type 0) transaction carrying it.
 * - PER CHAIN: declare `transactionType: 'legacy'` on the chain in `rocketh/config.ts`, and a
 *   script written without any fee option runs unchanged on it, including the transactions
 *   rocketh builds itself to bootstrap deterministic deployment.
 *
 * ```typescript
 * export const config = {
 * 	chains: {
 * 		424242: {transactionType: 'legacy'},
 * 	},
 * } as const satisfies UserConfig;
 * ```
 *
 * `gasPrice` together with an EIP-1559 fee field is refused at the call, never resolved one way
 * or the other. On a chain left at the default (`'eip1559'`), what is sent is exactly what was
 * sent before this existed.
 *
 * Both signer routes are covered: a node-held (`remote`) account goes through
 * `eth_sendTransaction` and the node signs, a `privateKey` (`signerOnly`) account is signed
 * locally and sent raw, which is read back here with viem's `parseTransaction`.
 */

import {describe, it, expect} from 'vitest';
import {parseTransaction} from 'viem';
import type {Abi} from 'abitype';
import {deploy} from '../src/index.js';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';
import type {UserConfig} from '@rocketh/core/types';

/** An address the mock node lists in `eth_accounts`, so the deployer is node-held. */
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

type TestProvider = Awaited<ReturnType<typeof createTestEnvironment>>['provider'];

/** Every transaction object handed to `eth_sendTransaction`, in order. */
function sentTransactions(provider: TestProvider): Record<string, unknown>[] {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendTransaction')
		.map((r) => r.params?.[0] as Record<string, unknown>);
}

/** Every raw transaction handed to `eth_sendRawTransaction`, parsed back. */
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

async function nodeHeld(config?: Partial<UserConfig>, responses?: Record<string, unknown>) {
	const {env, provider} = await createTestEnvironment({
		accounts: {deployer: NODE_DEPLOYER},
		nodeAccounts: [NODE_DEPLOYER],
		config,
		providerConfig: responses ? {responses} : undefined,
	});
	return {_deploy: deploy(env), provider};
}

async function localSigner(config?: Partial<UserConfig>) {
	const {env, provider} = await createTestEnvironment({
		accounts: {deployer: `privateKey:${PRIVATE_KEY}`},
		config,
	});
	return {_deploy: deploy(env), provider};
}

describe('@rocketh/deploy - chains without EIP-1559', () => {
	describe('gasPrice on the call', () => {
		it('sends a legacy transaction carrying it through a node-held account', async () => {
			/**
			 * Example: one deployment priced the legacy way.
			 *
			 * ```typescript
			 * await deploy('Registry', {account: 'deployer', artifact: Registry, args: [], gasPrice: 2_000_000_000n});
			 * ```
			 */
			const {_deploy, provider} = await nodeHeld();

			await _deploy('Priced', {
				account: 'deployer',
				artifact: createMockArtifact('Priced'),
				args: [42n],
				gasPrice: 2_000_000_000n,
			});

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent.type).toBe('0x0');
			expect(sent.gasPrice).toBe('0x77359400');
			expect(sent.maxFeePerGas).toBeUndefined();
			expect(sent.maxPriorityFeePerGas).toBeUndefined();
		});

		it('sends a legacy transaction carrying it through a locally signing account', async () => {
			const {_deploy, provider} = await localSigner();

			await _deploy('Priced', {
				account: 'deployer',
				artifact: createMockArtifact('Priced'),
				args: [42n],
				gasPrice: 2_000_000_000n,
			});

			const signed = sentRawTransactions(provider).at(-1)!;
			expect(signed.type).toBe('legacy');
			expect(signed.gasPrice).toBe(2_000_000_000n);
		});

		it('refuses gasPrice together with maxFeePerGas, naming both', async () => {
			const {_deploy, provider} = await nodeHeld();

			await expect(
				_deploy('Mixed', {
					account: 'deployer',
					artifact: createMockArtifact('Mixed'),
					args: [42n],
					gasPrice: 1n,
					maxFeePerGas: 2n,
				} as never),
			).rejects.toThrow(/deploy "Mixed": "gasPrice" cannot be combined with "maxFeePerGas"/);
			expect(dispatchCount(provider)).toBe(0);
		});

		it('refuses gasPrice together with maxPriorityFeePerGas, naming both', async () => {
			const {_deploy, provider} = await nodeHeld();

			await expect(
				_deploy('Mixed', {
					account: 'deployer',
					artifact: createMockArtifact('Mixed'),
					args: [42n],
					gasPrice: 1n,
					maxPriorityFeePerGas: 2n,
				} as never),
			).rejects.toThrow(/"gasPrice" cannot be combined with "maxPriorityFeePerGas"/);
			expect(dispatchCount(provider)).toBe(0);
		});

		it('refuses gasPrice with type "eip1559"', async () => {
			const {_deploy, provider} = await nodeHeld();

			await expect(
				_deploy('Mixed', {
					account: 'deployer',
					artifact: createMockArtifact('Mixed'),
					args: [42n],
					gasPrice: 1n,
					type: 'eip1559',
				} as never),
			).rejects.toThrow(/"gasPrice" cannot be combined with "type: eip1559"/);
			expect(dispatchCount(provider)).toBe(0);
		});
	});

	describe('a chain declared legacy', () => {
		it('deploys a fee-option-free script as a legacy transaction through a node-held account', async () => {
			/**
			 * The node fills the gas price, as it fills the fees of an EIP-1559 transaction today.
			 */
			const {_deploy, provider} = await nodeHeld(LEGACY_CHAIN);

			await _deploy('Plain', {account: 'deployer', artifact: createMockArtifact('Plain'), args: [42n]});

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent.type).toBe('0x0');
			expect(sent.gasPrice).toBeUndefined();
			expect(sent.maxFeePerGas).toBeUndefined();
		});

		it('deploys a fee-option-free script as a legacy transaction through a locally signing account', async () => {
			/**
			 * A local signer has no node to ask, so rocketh fills the gas price from `eth_gasPrice`
			 * before signing, and never asks for `eth_feeHistory`.
			 */
			const {_deploy, provider} = await localSigner(LEGACY_CHAIN);

			await _deploy('Plain', {account: 'deployer', artifact: createMockArtifact('Plain'), args: [42n]});

			const signed = sentRawTransactions(provider).at(-1)!;
			expect(signed.type).toBe('legacy');
			expect(signed.gasPrice).toBe(1_000_000_000n);
			expect(provider.getRequests().some((r) => r.method === 'eth_feeHistory')).toBe(false);
		});

		it('still honours an explicit EIP-1559 fee on the call', async () => {
			/**
			 * The chain setting is a DEFAULT: a call that states EIP-1559 fees is sent as EIP-1559.
			 */
			const {_deploy, provider} = await nodeHeld(LEGACY_CHAIN);

			await _deploy('Explicit', {
				account: 'deployer',
				artifact: createMockArtifact('Explicit'),
				args: [42n],
				maxFeePerGas: 3n,
			});

			const sent = sentTransactions(provider).at(-1)!;
			expect(sent.type).toBe('0x2');
			expect(sent.maxFeePerGas).toBe('0x3');
		});

		it('bootstraps the create2 factory with legacy transactions', async () => {
			/**
			 * With no factory on chain and an unfunded factory deployer, rocketh sends three
			 * transactions: the funding transfer and the deployment through the factory, which it
			 * builds, and the factory's own pre-signed deployment, which it only relays. The
			 * canonical pre-signed one is ALREADY legacy (Nick's method), so the two rocketh builds
			 * are what the chain setting has to reach.
			 */
			const {_deploy, provider} = await nodeHeld(LEGACY_CHAIN, {eth_getBalance: '0x0'});

			await _deploy(
				'Token',
				{account: 'deployer', artifact: createMockArtifact('Token', ABI), args: [1n]},
				{deterministic: {type: 'create2', salt: SALT}},
			);

			const sent = sentTransactions(provider);
			expect(sent).toHaveLength(2);
			expect(sent[0].to).toBe(CREATE2_FACTORY_DEPLOYER);
			expect(sent.map((t) => t.type)).toEqual(['0x0', '0x0']);
			const relayed = sentRawTransactions(provider);
			expect(relayed).toHaveLength(1);
			expect(relayed[0].type).toBe('legacy');
		});

		it('bootstraps the create3 factory with legacy transactions', async () => {
			const {_deploy, provider} = await nodeHeld(LEGACY_CHAIN, {eth_getBalance: '0x0'});

			await _deploy(
				'Token',
				{account: 'deployer', artifact: createMockArtifact('Token', ABI), args: [1n]},
				{deterministic: {type: 'create3', salt: SALT}},
			);

			const sent = sentTransactions(provider);
			// funding, create3 factory through create2, then the deployment through create3
			expect(sent).toHaveLength(3);
			expect(sent.map((t) => t.type)).toEqual(['0x0', '0x0', '0x0']);
			expect((sent[2].to as string).toLowerCase()).toBe(CREATE3_FACTORY);
		});

		it('puts a per-call gasPrice on the bootstrap transactions too', async () => {
			const {_deploy, provider} = await nodeHeld(undefined, {eth_getBalance: '0x0'});

			await _deploy(
				'Token',
				{account: 'deployer', artifact: createMockArtifact('Token', ABI), args: [1n], gasPrice: 5n},
				{deterministic: {type: 'create2', salt: SALT}},
			);

			const sent = sentTransactions(provider);
			expect(sent.map((t) => [t.type, t.gasPrice])).toEqual([
				['0x0', '0x5'],
				['0x0', '0x5'],
			]);
		});
	});

	describe('a chain left at the default', () => {
		it('sends exactly what it sent before: EIP-1559, fees left to the node', async () => {
			/**
			 * Pinned on the full provider requests, bootstrap included, so a change to the default
			 * path cannot hide behind the legacy one.
			 */
			const {_deploy, provider} = await nodeHeld(undefined, {eth_getBalance: '0x0'});

			await _deploy(
				'Token',
				{account: 'deployer', artifact: createMockArtifact('Token', ABI), args: [1n], maxPriorityFeePerGas: 7n},
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
				maxPriorityFeePerGas: '0x7',
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
				maxPriorityFeePerGas: '0x7',
				nonce: undefined,
			});
			expect(sent.some((t) => 'gasPrice' in t)).toBe(false);
		});
	});
});
