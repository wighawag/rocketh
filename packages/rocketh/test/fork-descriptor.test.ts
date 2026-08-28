/**
 * The fork DESCRIPTOR: `env.network.fork` says WHICH network the run simulates,
 * instead of "the environment argument was not a string".
 *
 * The model these tests pin is `docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md`:
 * a fork run IS the forked network for deployment RECORDS and is NOT that network for chain
 * IDENTITY. So the descriptor names the SIMULATED network (and carries its chain id when that is
 * KNOWN rather than guessed), while the provider keeps reporting the CONNECTED chain.
 *
 * Like the other tests in this folder these do NOT use `@rocketh/test-utils` (nx cycle) and build
 * a REAL environment locally, through `loadEnvironmentFromStore`, which is also the path
 * hardhat-deploy takes.
 */

import {describe, it, expect, vi} from 'vitest';
import {getEnvironmentName, loadEnvironmentFromStore, resolveConfig} from '../src/executor/index.js';
import type {DeploymentStore, ExecutionParams, PromptExecutor, UserConfig} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

const ACCOUNT = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' as `0x${string}`;
const GENESIS_HASH = ('0x' + '0'.repeat(64)) as `0x${string}`;
const CONTRACT_ADDRESS = '0xabc0000000000000000000000000000000000000';

/** A node reporting `chainId` (the CONNECTED chain), whatever the run simulates. */
function mockProvider(chainId: number): EIP1193ProviderWithoutEvents {
	return {
		request: (async (args: {method: string; params?: unknown}) => {
			switch (args.method) {
				case 'eth_chainId':
					return `0x${chainId.toString(16)}`;
				case 'eth_accounts':
					return [ACCOUNT];
				case 'eth_getBlockByNumber':
					return {number: '0x0', hash: GENESIS_HASH};
				default:
					throw new Error(`mock: ${args.method}`);
			}
		}) as any,
	} as EIP1193ProviderWithoutEvents;
}

/**
 * A store already holding deployments RECORDED on another chain, which is exactly what a fork
 * of that network reads: the folder is keyed by the environment NAME and its `.chain` marker
 * belongs to the simulated chain, not to the fork node.
 */
function storeWithRecordsFromChain(chainId: number): DeploymentStore {
	const files: Record<string, string> = {
		'.chain': JSON.stringify({chainId: '' + chainId, genesisHash: GENESIS_HASH}),
		'MyContract.json': JSON.stringify({address: CONTRACT_ADDRESS, abi: []}),
	};
	return {
		listFiles: vi.fn(async (_f: unknown, _e: unknown, filter?: (name: string) => boolean) =>
			Object.keys(files).filter((name) => (filter ? filter(name) : true)),
		),
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
	} as DeploymentStore;
}

const promptExecutor: PromptExecutor = {
	async prompt() {
		return {proceed: true};
	},
	exit() {},
};

const baseConfig: UserConfig = {
	accounts: {deployer: ACCOUNT},
	defaultPollingInterval: 0.001,
};

async function loadEnv(options: {
	environment: ExecutionParams['environment'];
	config?: UserConfig;
	connectedChainId?: number;
	store?: DeploymentStore;
}) {
	return loadEnvironmentFromStore(
		options.config ?? baseConfig,
		{
			provider: mockProvider(options.connectedChainId ?? 31337),
			environment: options.environment,
			saveDeployments: false,
			promptExecutor,
		},
		options.store ?? storeWithRecordsFromChain(31337),
	);
}

describe('the fork descriptor names the SIMULATED network', () => {
	/**
	 * The headline: a run told it is a fork of `mainnet` reports that through the environment,
	 * so a script or a tool can branch on "this is a fork of mainnet".
	 */
	it('reports WHICH network is forked', async () => {
		const env = await loadEnv({environment: {fork: 'mainnet'}});
		expect(env.network.fork?.networkName).toBe('mainnet');
	});

	/**
	 * Source 1 of the simulated chain id: supplied by whoever built the fork input. That is the
	 * reliable one, because the caller (hardhat-deploy) has the forked network's own config.
	 */
	it('carries the chain id the CALLER supplied', async () => {
		const env = await loadEnv({environment: {fork: 'mainnet', chainId: 1}});
		expect(env.network.fork).toEqual({networkName: 'mainnet', chainId: 1});
	});

	/** Source 2: the forked network's declared environment entry. */
	it('falls back to the chain id DECLARED for the forked network', async () => {
		const env = await loadEnv({
			environment: {fork: 'mainnet'},
			config: {...baseConfig, environments: {mainnet: {chain: 1}}},
		});
		expect(env.network.fork?.chainId).toBe(1);
	});

	/** Precedence, discriminating: the caller knows better than the configuration file. */
	it('prefers the supplied chain id over the declared one', async () => {
		const env = await loadEnv({
			environment: {fork: 'sepolia', chainId: 11155111},
			config: {...baseConfig, environments: {sepolia: {chain: 999}}},
		});
		expect(env.network.fork?.chainId).toBe(11155111);
	});

	/**
	 * The honesty rule (ADR 0014, and ADR 0012's instinct): with neither source the descriptor
	 * NAMES the network and asserts nothing about its id. It must NOT borrow the id the run
	 * computed from the provider, which under hardhat is the local engine's 31337 and would be a
	 * lie told to every later consumer.
	 */
	it('has NO chain id when neither source exists, and does not borrow the provider one', async () => {
		const env = await loadEnv({environment: {fork: 'mainnet'}, connectedChainId: 31337});
		expect(env.network.fork?.networkName).toBe('mainnet');
		expect(env.network.fork?.chainId).toBeUndefined();
		// the CONNECTED chain is still the node's, and is reported as it is today
		expect(env.network.chain.id).toBe(31337);
	});
});

describe('what is NOT a fork', () => {
	/** The bug this task exists for: an ordinary in-memory run was flagged as a fork. */
	it('a run with no environment is not a fork', async () => {
		const env = await loadEnv({environment: undefined});
		expect(env.network.fork).toBeUndefined();
	});

	it('a plain named environment is not a fork', async () => {
		const env = await loadEnv({environment: 'mainnet'});
		expect(env.network.fork).toBeUndefined();
	});

	/** Every current consumer is a truthiness test, so the falsy-when-absent property is load-bearing. */
	it('keeps `if (env.network.fork)` reading naturally', async () => {
		const forked = await loadEnv({environment: {fork: 'mainnet'}});
		const notForked = await loadEnv({environment: 'sepolia'});
		expect(Boolean(forked.network.fork)).toBe(true);
		expect(Boolean(notForked.network.fork)).toBe(false);
	});
});

describe('the one behaviour the flag exists for: records still load on a fork', () => {
	/**
	 * The whole point of forking mainnet: READ mainnet's deployment records even though the node
	 * is not mainnet. `context.fork` skips the chain-identity check at load time, and this is the
	 * only behavioural consumer of the flag.
	 */
	it('loads the forked network records although the node reports another chain', async () => {
		const env = await loadEnv({
			environment: {fork: 'mainnet'},
			connectedChainId: 31337,
			store: storeWithRecordsFromChain(1),
		});
		expect(env.deployments['MyContract'].address).toBe(CONTRACT_ADDRESS);
	});

	/**
	 * The discriminating half: without the fork input the very same records are refused, so the
	 * test above cannot pass by the check having been dropped for everyone.
	 */
	it('still refuses those records on a NON-fork run of the same environment', async () => {
		await expect(
			loadEnv({environment: 'mainnet', connectedChainId: 31337, store: storeWithRecordsFromChain(1)}),
		).rejects.toThrow(/different chainId/);
	});
});

describe('getEnvironmentName', () => {
	/** The derivation itself, at the unit level: only the fork input produces a descriptor. */
	it('builds the descriptor from the fork input alone', () => {
		expect(getEnvironmentName({environment: {fork: 'mainnet'}})).toEqual({
			name: 'mainnet',
			fork: {networkName: 'mainnet'},
		});
		expect(getEnvironmentName({environment: {fork: 'mainnet', chainId: 1}})).toEqual({
			name: 'mainnet',
			fork: {networkName: 'mainnet', chainId: 1},
		});
	});

	it('does not invent a descriptor for a string or a missing environment', () => {
		expect(getEnvironmentName({environment: 'sepolia'}).fork).toBeUndefined();
		expect(getEnvironmentName({}).fork).toBeUndefined();
	});
});
