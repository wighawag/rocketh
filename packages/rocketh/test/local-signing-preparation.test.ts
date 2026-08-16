/**
 * Tests for the fields rocketh fills in BEFORE a locally-signed transaction is signed, and for
 * the two provider-tolerance behaviours that came with it.
 *
 * These deliberately assert on the PAYLOAD handed to `eth_signTransaction`, not merely that the
 * run completed. A mock that answers `eth_estimateGas` makes a broken implementation look
 * healthy: the transaction is still signed, just with no gas limit, and only a real node
 * refuses it. So every assertion here reads what the signer was actually given.
 *
 * The line under test: rocketh prepares for a `signerOnly` account (nobody else can, since a
 * local signer has no provider) and deliberately does NOT prepare for `remote` / `wallet`,
 * where the node or wallet is authoritative. That is the same split viem makes between its
 * `local` and `json-rpc` accounts.
 */

import {describe, it, expect, vi} from 'vitest';

import {resolveConfig, getChainIdForEnvironment, resolveExecutionParams} from '../src/executor/index.js';
import {createEnvironment} from '../src/environment/index.js';
import {privateKey} from '@rocketh/signer';
import type {DeploymentStore, UserConfig} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
const TX_HASH = `0x${'11'.repeat(32)}` as `0x${string}`;
const GENESIS_HASH = `0x${'42'.padStart(64, '0')}` as `0x${string}`;

type Call = {method: string; params?: unknown};

function createMockProvider(options?: {
	accounts?: string[];
	failAccounts?: boolean;
	txByHash?: Record<string, unknown> | null;
}) {
	const calls: Call[] = [];
	const provider = {
		request: vi.fn(async (args: {method: string; params?: unknown}) => {
			calls.push({method: args.method, params: args.params});
			switch (args.method) {
				case 'eth_chainId':
					return '0x7a69';
				case 'eth_accounts':
					if (options?.failAccounts) {
						throw new Error('the method eth_accounts does not exist');
					}
					return options?.accounts ?? [];
				case 'eth_getBlockByNumber':
					return {number: '0x0', hash: GENESIS_HASH};
				case 'eth_getTransactionCount':
					return '0x7';
				case 'eth_estimateGas':
					return '0xabcd';
				case 'eth_gasPrice':
					return '0x3b9aca00';
				case 'eth_feeHistory':
					return {
						oldestBlock: '0x1',
						baseFeePerGas: ['0x64', '0x64'],
						gasUsedRatio: [0.5],
						reward: [['0xa', '0xa', '0xa']],
					};
				case 'eth_signTransaction':
					return '0xf86b';
				case 'eth_sendRawTransaction':
				case 'eth_sendTransaction':
					return TX_HASH;
				case 'eth_getTransactionByHash':
					return options && 'txByHash' in options ? options.txByHash : null;
				case 'eth_getTransactionReceipt':
					return {
						transactionHash: TX_HASH,
						blockHash: `0x${'01'.repeat(32)}`,
						blockNumber: '0x1',
						transactionIndex: '0x0',
						contractAddress: `0x${'ab'.repeat(20)}`,
						status: '0x1',
						logs: [],
					};
				case 'eth_blockNumber':
					return '0x1';
				default:
					throw new Error(`mock provider: unsupported method ${args.method}`);
			}
		}) as unknown as EIP1193ProviderWithoutEvents['request'],
	};
	return {provider: provider as EIP1193ProviderWithoutEvents, calls};
}

function createInMemoryStore(): DeploymentStore {
	const files: Record<string, string> = {};
	return {
		listFiles: vi.fn(async () => Object.keys(files)),
		deleteAll: vi.fn(async () => {}),
		hasFile: vi.fn(async (_f, _e, name) => files[name] !== undefined),
		writeFile: vi.fn(async (_f, _e, name, content) => {
			files[name] = content;
		}),
		writeFileWithChainInfo: vi.fn(async (_i, _f, _e, name, content) => {
			files[name] = content;
		}),
		readFile: vi.fn(async (_f, _e, name) => files[name]),
		deleteFile: vi.fn(async (_f, _e, name) => {
			delete files[name];
		}),
	};
}

/**
 * The real `privateKey` protocol, wrapped to record what it is asked to sign.
 *
 * The payload never reaches the node provider (that is the whole point of local signing: the
 * node only ever sees `eth_sendRawTransaction`), so the only place to observe what rocketh
 * prepared is the signer itself.
 */
function recordingPrivateKey(captured: {tx?: Record<string, `0x${string}`>}) {
	return async (protocolString: string) => {
		const real = await privateKey(protocolString);
		return {
			...real,
			signer: {
				...real.signer,
				request: (async (args: {method: string; params?: unknown}) => {
					if (args.method === 'eth_signTransaction') {
						captured.tx = (args.params as [Record<string, `0x${string}`>])[0];
					}
					return real.signer.request(args as never);
				}) as typeof real.signer.request,
			},
		};
	};
}

async function buildEnvironment(options: {
	accounts: UserConfig['accounts'];
	nodeAccounts?: string[];
	failAccounts?: boolean;
	txByHash?: Record<string, unknown> | null;
}) {
	const {provider, calls} = createMockProvider({
		accounts: options.nodeAccounts,
		failAccounts: options.failAccounts,
		...('txByHash' in options ? {txByHash: options.txByHash} : {}),
	});
	const captured: {tx?: Record<string, `0x${string}`>} = {};
	const userConfig: UserConfig = {
		accounts: options.accounts,
		signerProtocols: {privateKey: recordingPrivateKey(captured) as typeof privateKey},
		defaultPollingInterval: 0.001,
	};
	const config = resolveConfig(userConfig);
	const executionParams = {provider, environment: 'memory', saveDeployments: false};
	const chainId = await getChainIdForEnvironment(config, 'memory', executionParams);
	const resolved = resolveExecutionParams(config, executionParams, chainId);
	const {external: env} = await createEnvironment(config, resolved, createInMemoryStore());
	const signedPayload = () => {
		if (!captured.tx) {
			throw new Error(`nothing was signed locally; node saw: ${calls.map((c) => c.method).join(', ')}`);
		}
		return captured.tx;
	};
	return {env, calls, signedPayload};
}

describe('preparing a locally-signed transaction', () => {
	it('fills nonce, gas and 1559 fees before signing', async () => {
		const {env, signedPayload} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}});
		const from = env.resolveAccount('deployer');

		await env.broadcastExecution(
			{type: 'object', data: {type: '0x2', chainId: '0x7a69', from, to: `0x${'cd'.repeat(20)}`, data: '0x'}},
			{message: 'x'},
		);

		const signed = signedPayload();
		// Every one of these was previously absent, which a local signer turns into 0. A node
		// then refuses the transaction with "intrinsic gas too low: have 0".
		expect(signed.nonce).toBe('0x7');
		expect(signed.gas).toBe('0xabcd');
		expect(signed.maxFeePerGas).toBeDefined();
		expect(signed.maxPriorityFeePerGas).toBeDefined();
		expect(BigInt(signed.maxFeePerGas)).toBeGreaterThan(0n);
	});

	it('never lets the priority fee exceed the cap it pairs with', async () => {
		// Including when the caller supplied only the cap: an estimated priority fee above a
		// caller-supplied maxFeePerGas is an invalid pair that the node rejects.
		const {env, signedPayload} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}});
		const from = env.resolveAccount('deployer');

		await env.broadcastExecution(
			{
				type: 'object',
				data: {
					type: '0x2',
					chainId: '0x7a69',
					from,
					to: `0x${'cd'.repeat(20)}`,
					data: '0x',
					maxFeePerGas: '0x5', // below the mock's estimated priority fee of 0xa
				},
			},
			{message: 'x'},
		);

		const signed = signedPayload();
		expect(signed.maxFeePerGas).toBe('0x5');
		expect(BigInt(signed.maxPriorityFeePerGas)).toBeLessThanOrEqual(BigInt(signed.maxFeePerGas));
	});

	it('raises the cap it fills to cover a caller-supplied priority fee', async () => {
		// The mirror of the clamp above, and the same invalid pair seen from the other side: a
		// caller who names a high priority fee and leaves the cap to us must not get a cap below
		// it. viem avoids this by construction (`maxFeePerGas = base * multiplier + priority`).
		const {env, signedPayload} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}});
		const from = env.resolveAccount('deployer');
		const highPriority = '0xf4240'; // 1,000,000, far above the mock's estimate

		await env.broadcastExecution(
			{
				type: 'object',
				data: {
					type: '0x2',
					chainId: '0x7a69',
					from,
					to: `0x${'cd'.repeat(20)}`,
					data: '0x',
					maxPriorityFeePerGas: highPriority,
				},
			},
			{message: 'x'},
		);

		const signed = signedPayload();
		expect(signed.maxPriorityFeePerGas).toBe(highPriority);
		expect(BigInt(signed.maxFeePerGas)).toBeGreaterThanOrEqual(BigInt(highPriority));
	});

	it('leaves headroom above the next block base fee, so a missed block does not strand the tx', async () => {
		// The mock reports base 0x64 and priority 0xa. With no headroom the cap would be exactly
		// 0x6e (110), unmineable the moment the base fee steps up (max +12.5% per block) while
		// rocketh polls for a receipt that can never arrive.
		const {env, signedPayload} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}});
		const from = env.resolveAccount('deployer');

		await env.broadcastExecution(
			{type: 'object', data: {type: '0x2', chainId: '0x7a69', from, to: `0x${'cd'.repeat(20)}`, data: '0x'}},
			{message: 'x'},
		);

		const signed = signedPayload();
		expect(BigInt(signed.maxFeePerGas)).toBeGreaterThan(0x64n + 0x0an);
		// The headroom is on the BASE fee only; the tip is what the estimator said.
		expect(signed.maxPriorityFeePerGas).toBe('0xa');
	});

	it('fills gasPrice, not 1559 fees, for a legacy transaction', async () => {
		// Every rocketh-internal caller builds `type: '0x2'`, so this branch is reachable only
		// through a caller that asks for a legacy transaction: exactly the path most likely to
		// rot unnoticed.
		const {env, calls, signedPayload} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}});
		const from = env.resolveAccount('deployer');

		await env.broadcastExecution(
			{type: 'object', data: {type: '0x0', from, to: `0x${'cd'.repeat(20)}`, data: '0x'}},
			{message: 'x'},
		);

		const signed = signedPayload();
		expect(signed.gasPrice).toBe('0x3b9aca00');
		expect(signed.maxFeePerGas).toBeUndefined();
		expect(signed.gas).toBe('0xabcd');
		expect(signed.nonce).toBe('0x7');
		// A legacy transaction has no use for the 1559 estimator.
		expect(calls.map((c) => c.method)).not.toContain('eth_feeHistory');
	});

	it('respects values the caller supplied and does not query for them', async () => {
		const {env, calls, signedPayload} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}});
		const from = env.resolveAccount('deployer');

		await env.broadcastExecution(
			{
				type: 'object',
				data: {
					type: '0x2',
					chainId: '0x7a69',
					from,
					to: `0x${'cd'.repeat(20)}`,
					data: '0x',
					gas: '0x5208',
					nonce: '0x2',
					maxFeePerGas: '0x64',
					maxPriorityFeePerGas: '0x1',
				},
			},
			{message: 'x'},
		);

		const signed = signedPayload();
		expect(signed.gas).toBe('0x5208');
		expect(signed.nonce).toBe('0x2');
		expect(signed.maxFeePerGas).toBe('0x64');
		// Nothing was asked of the node, because nothing was missing.
		expect(calls.map((c) => c.method)).not.toContain('eth_estimateGas');
		expect(calls.map((c) => c.method)).not.toContain('eth_getTransactionCount');
	});

	it('prepares NOTHING for a node-held (remote) account, leaving the node authoritative', async () => {
		const {env, calls} = await buildEnvironment({
			accounts: {deployer: NODE_ACCOUNT as `0x${string}`},
			nodeAccounts: [NODE_ACCOUNT],
		});
		const from = env.resolveAccount('deployer');

		await env.broadcastExecution(
			{type: 'object', data: {type: '0x2', chainId: '0x7a69', from, to: `0x${'cd'.repeat(20)}`, data: '0x'}},
			{message: 'x'},
		);

		const methods = calls.map((c) => c.method);
		expect(methods).toContain('eth_sendTransaction');
		// The node fills what the caller omitted; asking on its behalf would override a wallet's
		// own estimate and take it out of the user's hands.
		expect(methods).not.toContain('eth_estimateGas');
		expect(methods).not.toContain('eth_getTransactionCount');
		expect(methods).not.toContain('eth_signTransaction');
	});
});

describe('a provider that does not implement eth_accounts', () => {
	it('is usable when every named account carries its own signing material', async () => {
		const {env} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}, failAccounts: true});

		// The environment built at all, which is the point: this used to throw during setup.
		expect(env.addressSigners[env.resolveAccount('deployer')].type).toBe('signerOnly');
	});

	it('gives an index-based account the same diagnosis when the node just lists nothing', async () => {
		// A public RPC endpoint that answers `eth_accounts` with `[]` is, to the user, the same
		// situation as one that rejects the call, so it gets the same actionable message rather
		// than the generic "cannot get account".
		await expect(buildEnvironment({accounts: {deployer: 0}, nodeAccounts: []})).rejects.toThrow(
			/lists 0 account\(s\).*privateKey:0x/s,
		);
	});

	it('re-raises the original failure, with its cause, for an INDEX-based account', async () => {
		await expect(buildEnvironment({accounts: {deployer: 0}, failAccounts: true})).rejects.toThrow(
			/named account "deployer" is configured as index 0/,
		);

		await expect(buildEnvironment({accounts: {deployer: 0}, failAccounts: true})).rejects.toMatchObject({
			cause: expect.objectContaining({message: expect.stringContaining('eth_accounts')}),
		});
	});
});

describe('reporting a transaction whose fee fields are null', () => {
	it('does not crash when the node returns maxFeePerGas: null on a legacy transaction', async () => {
		// geth OMITS the 1559 fields on a legacy transaction; other nodes send them as `null`.
		// Branching on key presence sent the second kind down the 1559 path, where `BigInt(null)`
		// threw and took down the run from a purely cosmetic log line.
		const {env} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY},
			txByHash: {
				hash: TX_HASH,
				type: '0x0',
				gasPrice: '0x3b9aca00',
				maxFeePerGas: null,
				maxPriorityFeePerGas: null,
			},
		});
		const from = env.resolveAccount('deployer');

		await expect(
			env.broadcastExecution(
				{type: 'object', data: {type: '0x2', chainId: '0x7a69', from, to: `0x${'cd'.repeat(20)}`, data: '0x'}},
				{message: '  tx: {hash}\n      {transaction}'},
			),
		).resolves.toBeDefined();
	});
});
