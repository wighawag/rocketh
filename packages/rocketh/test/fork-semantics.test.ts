/**
 * Where a fork run takes its DEPLOYMENT SEMANTICS from: the network it SIMULATES, never the local
 * node it is CONNECTED to.
 *
 * The model is `docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md`. One
 * chain-config lookup used to answer two unrelated questions from the connected side, and only
 * ONE of the two was wrong:
 *
 * - the CONNECTED chain (the local fork node) supplies the PROVIDER, which is what makes a fork
 *   run talk to the fork instead of to production. That half must not move.
 * - the SIMULATED chain (the forked network) supplies the deployment semantics and policy:
 *   deterministic deployment, the unknown-signer policy, auto-impersonation, the confirmation
 *   count, auto-mining and the environment TAGS.
 *
 * So every test here is DISCRIMINATING by construction: the two buckets are configured
 * DIFFERENTLY, and each assertion says which one arrived. A test asserting only that a fork run
 * has tags would pass before and after the change and would be worth nothing.
 *
 * Like the other tests in this folder these do NOT use `@rocketh/test-utils` (nx cycle) and build
 * a REAL environment locally, through `loadEnvironmentFromStore`, which is also the path
 * hardhat-deploy takes.
 */

import {describe, it, expect, vi} from 'vitest';
import {resolveConfig, resolveExecutionParams, loadEnvironmentFromStore} from '../src/executor/index.js';
import type {
	ChainInfo,
	ChainUserConfig,
	DeploymentStore,
	ExecutionParams,
	PromptExecutor,
	UserConfig,
} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

const ACCOUNT = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' as `0x${string}`;
const GENESIS_HASH = ('0x' + '0'.repeat(64)) as `0x${string}`;

const LOCAL_RPC_URL = 'http://127.0.0.1:8545';
/** Deliberately a PUBLIC endpoint: no fork run may ever end up pointed at it. */
const MAINNET_RPC_URL = 'https://mainnet.example.invalid/production';

const create2Info = (factory: `0x${string}`) =>
	({
		factory,
		deployer: '0x3fab184622dc19b6109349b94811493bf2a45362',
		funding: '10000000000000000',
		signedTx: '0xdeadbeef',
	}) as const;

const LOCAL_FACTORY = '0x1111111111111111111111111111111111111111';
const MAINNET_FACTORY = '0x2222222222222222222222222222222222222222';

/** Both buckets are FULLY described, so the only console output a test can see is a NEW one. */
const chainInfo = (id: number, name: string, rpcUrl: string): ChainInfo => ({
	id,
	name,
	nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
	rpcUrls: {default: {http: [rpcUrl]}},
	chainType: 'default',
});

/** The user's LOCALHOST dev node entry: this is what used to leak into a fork of mainnet. */
const localChain: ChainUserConfig = {
	rpcUrl: LOCAL_RPC_URL,
	info: chainInfo(31337, 'localhost', LOCAL_RPC_URL),
	tags: ['local'],
	autoMine: true,
	autoImpersonate: true,
	confirmationsRequired: 1,
	onUnknownSigner: 'throw',
	deterministicDeployment: {create2: create2Info(LOCAL_FACTORY)},
};

/** The network being simulated: every value differs from the local one, so nothing is ambiguous. */
const mainnetChain: ChainUserConfig = {
	rpcUrl: MAINNET_RPC_URL,
	info: chainInfo(1, 'mainnet', MAINNET_RPC_URL),
	tags: ['mainnet', 'production'],
	autoMine: false,
	autoImpersonate: false,
	confirmationsRequired: 5,
	onUnknownSigner: 'ask',
	deterministicDeployment: {create2: create2Info(MAINNET_FACTORY)},
};

const baseConfig: UserConfig = {
	accounts: {deployer: ACCOUNT},
	defaultPollingInterval: 0.001,
};

const bothBuckets: UserConfig = {
	...baseConfig,
	chains: {31337: localChain, 1: mainnetChain},
};

/** The create2 factory tells the two buckets apart without asserting on a whole object. */
function factoryOf(deterministicDeployment: unknown): string | undefined {
	const info = deterministicDeployment as {create2?: {factory?: string}; factory?: string};
	return info?.create2?.factory ?? info?.factory;
}

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

function emptyStore(): DeploymentStore {
	const files: Record<string, string> = {};
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

/**
 * Resolve the params the way a run does: `chainId` is the id the run COMPUTED from the provider,
 * i.e. the connected node's.
 */
function resolve(options: {
	config?: UserConfig;
	environment: ExecutionParams['environment'];
	computedChainId: number;
	provider?: EIP1193ProviderWithoutEvents;
}) {
	return resolveExecutionParams(
		resolveConfig(options.config ?? bothBuckets),
		{environment: options.environment, provider: options.provider},
		options.computedChainId,
	);
}

describe('a fork adopts the SIMULATED network configuration', () => {
	/**
	 * The headline, and the one a user feels: rehearsing on a fork of mainnet applies MAINNET's
	 * settings, although the run is connected to a local node whose own bucket says the opposite
	 * for every one of them.
	 */
	it('takes semantics and policy from the forked network, not from the local bucket', () => {
		const resolved = resolve({
			environment: {fork: 'mainnet', chainId: 1},
			computedChainId: 31337,
			provider: mockProvider(31337),
		});

		expect(resolved.environment.tags).toEqual(['mainnet', 'production']);
		expect(resolved.environment.onUnknownSigner).toBe('ask');
		expect(resolved.environment.autoImpersonate).toBe(false);
		expect(resolved.environment.autoMine).toBe(false);
		expect(resolved.environment.confirmationsRequired).toBe(5);
		expect(factoryOf(resolved.environment.deterministicDeployment)).toBe(MAINNET_FACTORY);
	});

	/**
	 * TAGS are the sharpest edge: deploy scripts BRANCH on them, so a `local` tag applied during
	 * what the user believes is a mainnet rehearsal makes a script take the local shortcut. This
	 * asserts on the tag map the deploy scripts actually read.
	 */
	it('gives deploy scripts the forked network tags, and never the local one', async () => {
		const env = await loadEnvironmentFromStore(
			{...bothBuckets, environments: {mainnet: {chain: 1}}},
			{
				provider: mockProvider(31337),
				environment: {fork: 'mainnet'},
				saveDeployments: false,
				promptExecutor,
			},
			emptyStore(),
		);

		expect(env.tags['mainnet']).toBe(true);
		expect(env.tags['local']).toBeUndefined();
	});
});

describe('the CONNECTION still comes from the local side', () => {
	/**
	 * The half that was already right and is easy to delete by accident. `chains[31337]` supplies
	 * the rpc url, so a fork run talks to the fork; sending the WHOLE lookup to the forked network
	 * would connect it to production mainnet.
	 */
	it('builds the provider from the local chain rpc url, not the forked network one', () => {
		const resolved = resolve({environment: {fork: 'mainnet', chainId: 1}, computedChainId: 31337});

		expect((resolved.provider as unknown as {endpoint: string}).endpoint).toBe(LOCAL_RPC_URL);
		expect((resolved.provider as unknown as {endpoint: string}).endpoint).not.toBe(MAINNET_RPC_URL);
	});

	/**
	 * The CONNECTED chain identity is the third consumer of that one lookup and it does NOT move
	 * here: `env.network.chain.id` is what `execute` and `tx` put in a transaction's `chainId`, and
	 * a node rejects a mismatch. Pinned with a SIMULATED id that differs from the provider's, which
	 * is exactly the combination that would break if the info followed the semantics.
	 */
	it('leaves env.network.chain on the connected side even when the simulated id differs', async () => {
		const env = await loadEnvironmentFromStore(
			bothBuckets,
			{
				provider: mockProvider(31337),
				environment: {fork: 'mainnet', chainId: 1},
				saveDeployments: false,
				promptExecutor,
			},
			emptyStore(),
		);

		expect(env.network.chain.id).toBe(31337);
		expect(env.network.fork).toEqual({networkName: 'mainnet', chainId: 1});
	});
});

describe('with NOTHING declared', () => {
	/**
	 * The zero-configuration path, and the one most users are on: with no fork chain id supplied
	 * and no `environments` entry, the lookup key is the id the run computed. anvil forking
	 * mainnet reports 1 BECAUSE it is forking mainnet, so `chains[1]` is found with nothing
	 * declared at all.
	 */
	it('resolves the forked network settings when the node reports the forked chain id', () => {
		const resolved = resolve({environment: {fork: 'mainnet'}, computedChainId: 1, provider: mockProvider(1)});

		expect(resolved.environment.tags).toEqual(['mainnet', 'production']);
		expect(resolved.environment.confirmationsRequired).toBe(5);
	});

	/**
	 * The other tool: hardhat reports 31337 while simulating mainnet, so the fallback lands on
	 * exactly today's behaviour. No notice, no degraded mode, no new state.
	 */
	it('behaves exactly as before when the node reports a local engine id', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			const resolved = resolve({environment: {fork: 'mainnet'}, computedChainId: 31337, provider: mockProvider(31337)});

			expect(resolved.environment.tags).toEqual(['local']);
			expect(resolved.environment.confirmationsRequired).toBe(1);
			expect(warn).not.toHaveBeenCalled();
		} finally {
			warn.mockRestore();
		}
	});

	/**
	 * When the forked network has NO chain entry, the run gets the built-in DEFAULTS rather than
	 * the local node's configuration. An absence is the right answer here: the previous behaviour
	 * applied a DIFFERENT configuration, which is worse than a missing one.
	 */
	it('falls back to the built-in defaults when the forked network has no chain config, not to the local bucket', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			const resolved = resolve({
				config: {...baseConfig, chains: {31337: localChain}},
				environment: {fork: 'mainnet', chainId: 1},
				computedChainId: 31337,
			});

			expect(resolved.environment.tags).toEqual([]);
			expect(resolved.environment.autoMine).toBe(false);
			// the impersonation default is FORK-AWARE rather than built-in `false`, which is what makes
			// a Safe-owned step execute during a rehearsal; owned by
			// `fork-autoimpersonate-default.test.ts`
			expect(resolved.environment.autoImpersonate).toBe(true);
			expect(resolved.environment.confirmationsRequired).toBeUndefined();
			// `'auto'` is the built-in policy default, resolved here rather than by the chain bucket
			expect(resolved.environment.onUnknownSigner).toBe('auto');
			// and the connection is still the local one
			expect((resolved.provider as unknown as {endpoint: string}).endpoint).toBe(LOCAL_RPC_URL);
			// an undescribed SIMULATED network is not a misconfiguration: nothing is said about it
			expect(warn).not.toHaveBeenCalled();
		} finally {
			warn.mockRestore();
		}
	});
});

describe('what this must NOT change', () => {
	/** A non-fork run reads the bucket of the chain it is on, exactly as it always has. */
	it('leaves a non-fork run alone', () => {
		const resolved = resolve({environment: 'localhost', computedChainId: 31337, provider: mockProvider(31337)});

		expect(resolved.environment.tags).toEqual(['local']);
		expect(resolved.environment.onUnknownSigner).toBe('throw');
		expect(resolved.environment.confirmationsRequired).toBe(1);
		expect(factoryOf(resolved.environment.deterministicDeployment)).toBe(LOCAL_FACTORY);
	});

	/** A non-fork run against the forked network itself is likewise untouched. */
	it('leaves a plain named run on the network itself alone', () => {
		const resolved = resolve({environment: 'mainnet', computedChainId: 1, provider: mockProvider(1)});

		expect(resolved.environment.tags).toEqual(['mainnet', 'production']);
		expect(resolved.environment.onUnknownSigner).toBe('ask');
	});

	/**
	 * The environment-level override layer already ran on fork runs, because the environment NAME
	 * is the forked network's. This task slid a different bucket UNDER it, so the user's overrides
	 * must still win.
	 */
	it('keeps the environment overrides winning on top of the forked network settings', () => {
		const resolved = resolve({
			config: {
				...bothBuckets,
				environments: {mainnet: {chain: 1, overrides: {tags: ['rehearsal'], confirmationsRequired: 2}}},
			},
			environment: {fork: 'mainnet'},
			computedChainId: 31337,
			provider: mockProvider(31337),
		});

		expect(resolved.environment.tags).toEqual(['rehearsal']);
		expect(resolved.environment.confirmationsRequired).toBe(2);
		// the un-overridden ones still come from the forked network
		expect(resolved.environment.onUnknownSigner).toBe('ask');
	});
});
