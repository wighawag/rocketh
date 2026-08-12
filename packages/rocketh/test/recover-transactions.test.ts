/**
 * Tests for `recoverTransactionsIfAny` — the interrupted-deploy recovery path.
 *
 * When a deploy is interrupted (network failure, Ctrl-C, OOM), pending transactions
 * are written to `.pending_transactions.json` in the deployment store. On the next run,
 * `recoverTransactionsIfAny` reads them back, waits for each receipt, saves the
 * deployment, and cleans up the pending file. If this is broken, users silently lose
 * deployment state.
 *
 * Like the other tests in this folder, these do NOT use `@rocketh/test-utils` (that
 * would close an nx project-graph cycle). They build a REAL environment against a
 * small local mock provider and an in-memory store.
 */

import {describe, it, expect, vi} from 'vitest';
import {createEnvironment} from '../src/environment/index.js';
import {resolveConfig, getChainIdForEnvironment, resolveExecutionParams} from '../src/executor/index.js';
import {privateKey} from '@rocketh/signer';
import type {DeploymentStore, PromptExecutor, UserConfig} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const GENESIS_HASH = ('0x' + '0'.repeat(64)) as `0x${string}`;
const TX_HASH = ('0x' + '1'.repeat(64)) as `0x${string}`;
const CONTRACT_ADDRESS = ('0x' + 'c'.repeat(40)) as `0x${string}`;

function mockProvider(extra?: Record<string, (params?: unknown[]) => unknown>): EIP1193ProviderWithoutEvents {
	return {
		request: (async (args: {method: string; params?: unknown}) => {
			switch (args.method) {
				case 'eth_chainId':
					return '0x7a69';
				case 'eth_accounts':
					return [];
				case 'eth_getBlockByNumber':
					return {number: '0x0', hash: GENESIS_HASH};
				case 'eth_feeHistory':
					return {
						oldestBlock: '0x1',
						baseFeePerGas: ['0x1', '0x1'],
						gasUsedRatio: [0.5],
						reward: [['0x1', '0x1', '0x1']],
					};
				case 'eth_getTransactionReceipt': {
					if (extra?.eth_getTransactionReceipt) return extra.eth_getTransactionReceipt(args.params as unknown[]);
					return {
						contractAddress: CONTRACT_ADDRESS,
						status: '0x1',
						blockNumber: '0x1',
						blockHash: '0x' + 'b'.repeat(64),
						transactionHash: TX_HASH,
						transactionIndex: '0x0',
						gasUsed: '0x5208',
					};
				}
				case 'eth_getTransactionByHash': {
					if (extra?.eth_getTransactionByHash) return extra.eth_getTransactionByHash(args.params as unknown[]);
					return {hash: TX_HASH, nonce: '0x1', from: '0x' + 'd'.repeat(40)};
				}
				case 'eth_blockNumber':
					return '0xa';
				default:
					throw new Error(`mock: ${args.method}`);
			}
		}) as any,
	} as EIP1193ProviderWithoutEvents;
}

function createInMemoryStore(files: Record<string, string> = {}): DeploymentStore {
	return {
		listFiles: vi.fn(async () => Object.keys(files)),
		deleteAll: vi.fn(async () => {
			for (const key of Object.keys(files)) delete files[key];
		}),
		hasFile: vi.fn(async (_f, _e, name) => files[name] !== undefined),
		writeFile: vi.fn(async (_f, _e, name, content) => {
			files[name] = content;
		}),
		writeFileWithChainInfo: vi.fn(async (_info, _f, _e, name, content) => {
			files[name] = content;
		}),
		readFile: vi.fn(async (_f, _e, name) => files[name] ?? ''),
		deleteFile: vi.fn(async (_f, _e, name) => {
			delete files[name];
		}),
	};
}

const promptExecutor: PromptExecutor = {
	async prompt() {
		return {proceed: true};
	},
	exit() {},
};

const userConfig: UserConfig = {
	accounts: {deployer: PRIVATE_KEY},
	signerProtocols: {privateKey},
	defaultPollingInterval: 0.001,
};

async function buildEnvironment(
	saveDeployments: boolean,
	store: DeploymentStore,
	providerExtra?: Record<string, (params?: unknown[]) => unknown>,
) {
	const provider = mockProvider(providerExtra);
	const config = resolveConfig(userConfig);
	const executionParams = {provider, environment: 'memory', saveDeployments, promptExecutor};
	const chainId = await getChainIdForEnvironment(config, 'memory', executionParams);
	const resolved = resolveExecutionParams(config, executionParams, chainId);
	const {internal, external} = await createEnvironment(config, resolved, store);
	return {internal, env: external};
}

const PENDING_DEPLOYMENT = {
	type: 'deployment' as const,
	name: 'Token',
	transaction: {hash: TX_HASH},
	partialDeployment: {
		abi: [{type: 'function', name: 'getValue', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'}],
		bytecode: '0x6080' as `0x${string}`,
		deployedBytecode: '0x6080' as `0x${string}`,
		argsData: '0x' as `0x${string}`,
		linkReferences: {},
	},
};

const PENDING_EXECUTION = {
	type: 'execution' as const,
	transaction: {hash: TX_HASH},
};

describe('recoverTransactionsIfAny - deployment recovery', () => {
	it('recovers a pending deployment: waits for receipt, saves deployment, cleans up', async () => {
		const files: Record<string, string> = {
			'.chain': JSON.stringify({chainId: '31337', genesisHash: GENESIS_HASH}),
			'.pending_transactions.json': JSON.stringify([PENDING_DEPLOYMENT]),
		};
		const store = createInMemoryStore(files);

		const {internal, env} = await buildEnvironment(true, store);

		await internal.recoverTransactionsIfAny();

		const deployment = env.getOrNull('Token');
		expect(deployment).toBeDefined();
		expect(deployment!.address).toBe(CONTRACT_ADDRESS);
		expect(deployment!.abi).toBeDefined();

		// The pending file should be cleaned up
		expect(files['.pending_transactions.json']).toBeUndefined();
	});

	it('does nothing when saveDeployments is false', async () => {
		const files: Record<string, string> = {
			'.pending_transactions.json': JSON.stringify([PENDING_DEPLOYMENT]),
		};
		const store = createInMemoryStore(files);

		const {internal, env} = await buildEnvironment(false, store);

		await internal.recoverTransactionsIfAny();

		expect(env.getOrNull('Token')).toBeNull();
		expect(files['.pending_transactions.json']).toBeDefined();
	});

	it('does nothing when there are no pending transactions', async () => {
		const files: Record<string, string> = {
			'.chain': JSON.stringify({chainId: '31337', genesisHash: GENESIS_HASH}),
		};
		const store = createInMemoryStore(files);

		const {internal} = await buildEnvironment(true, store);

		await internal.recoverTransactionsIfAny();
	});

	it('handles a missing .pending_transactions.json gracefully', async () => {
		const files: Record<string, string> = {};
		const store = createInMemoryStore(files);

		const {internal} = await buildEnvironment(true, store);

		// Should not throw — the catch block handles the missing file
		await internal.recoverTransactionsIfAny();
	});
});

describe('recoverTransactionsIfAny - execution recovery', () => {
	it('recovers a pending execution: fetches tx, waits for receipt, cleans up', async () => {
		const files: Record<string, string> = {
			'.pending_transactions.json': JSON.stringify([PENDING_EXECUTION]),
		};
		const store = createInMemoryStore(files);

		const {internal} = await buildEnvironment(true, store);

		await internal.recoverTransactionsIfAny();

		expect(files['.pending_transactions.json']).toBeUndefined();
	});
});

describe('recoverTransactionsIfAny - multiple pending transactions', () => {
	it('recovers multiple pending deployments in order and cleans up', async () => {
		const TX_HASH_2 = ('0x' + '2'.repeat(64)) as `0x${string}`;
		const ADDRESS_2 = ('0x' + 'e'.repeat(40)) as `0x${string}`;

		const files: Record<string, string> = {
			'.pending_transactions.json': JSON.stringify([
				PENDING_DEPLOYMENT,
				{
					type: 'deployment' as const,
					name: 'Vault',
					transaction: {hash: TX_HASH_2},
					partialDeployment: {
						abi: [],
						bytecode: '0x' as `0x${string}`,
						deployedBytecode: '0x' as `0x${string}`,
						argsData: '0x' as `0x${string}`,
						linkReferences: {},
					},
				},
			]),
		};
		const store = createInMemoryStore(files);

		const {internal, env} = await buildEnvironment(true, store, {
			eth_getTransactionReceipt: (params?: unknown[]) => {
				const hash = (params?.[0] as string) ?? TX_HASH;
				return {
					contractAddress: hash === TX_HASH ? CONTRACT_ADDRESS : ADDRESS_2,
					status: '0x1',
					blockNumber: '0x1',
					blockHash: '0x' + 'b'.repeat(64),
					transactionHash: hash,
					transactionIndex: '0x0',
					gasUsed: '0x5208',
				};
			},
			eth_getTransactionByHash: (params?: unknown[]) => ({
				hash: (params?.[0] as string) ?? TX_HASH,
				nonce: '0x1',
				from: '0x' + 'd'.repeat(40),
			}),
		});

		await internal.recoverTransactionsIfAny();

		expect(env.getOrNull('Token')).toBeDefined();
		expect(env.getOrNull('Vault')).toBeDefined();
		expect(env.getOrNull('Token')!.address).toBe(CONTRACT_ADDRESS);
		expect(env.getOrNull('Vault')!.address).toBe(ADDRESS_2);
		expect(files['.pending_transactions.json']).toBeUndefined();
	});
});
