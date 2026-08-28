/**
 * Where auto-impersonation gets its value when NOBODY set one: a fork turns it ON, everything
 * else leaves it off.
 *
 * Impersonation is what makes an account rocketh cannot sign for executable on a node that
 * supports it, so it is the only reason a Safe-owned step runs at all during a fork rehearsal
 * (`docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md`). A fork with it off
 * stops at the first privileged call, which is the opposite of what someone forking mainnet wants
 * to see.
 *
 * What does NOT move is the precedence, and above all the explicit `false`: turning impersonation
 * off for a run is the supported way to exercise the unknown-signer deferral path on a fork, and
 * the `@rocketh/unknown-signer` scenarios are built on exactly that spelling. So the order stays
 * execution param > chain config (of the SIMULATED network) > fork-aware default, and only the
 * last term changed.
 *
 * The capability/policy boundary of `docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md`
 * is untouched here: `autoImpersonate` is a NODE CAPABILITY resolved BEFORE the seam, and giving it
 * a fork-aware default gives `onUnknownSigner` no new value and does not touch the seam.
 *
 * Every test is DISCRIMINATING by construction: each one either contrasts two runs that differ in
 * exactly one thing (fork vs not, param set vs not), or configures the two chain buckets to
 * DISAGREE so the assertion says which one arrived. A test that merely asserted a fork run has
 * impersonation on with nothing else configured would still pass if the whole precedence chain
 * regressed to a hardcoded `true`.
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

const DEPLOYER = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' as `0x${string}`;
/** The Safe: a named account declared as a bare address, which no node holds a key for. */
const SAFE = '0x1111111111111111111111111111111111111111' as `0x${string}`;
const GENESIS_HASH = ('0x' + '0'.repeat(64)) as `0x${string}`;

const LOCAL_RPC_URL = 'http://127.0.0.1:8545';
const MAINNET_RPC_URL = 'https://mainnet.example.invalid/production';

const chainInfo = (id: number, name: string, rpcUrl: string): ChainInfo => ({
	id,
	name,
	nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
	rpcUrls: {default: {http: [rpcUrl]}},
	chainType: 'default',
});

/** The user's LOCALHOST dev node entry. Fully described, so no test can see a stray notice. */
const localChain: ChainUserConfig = {
	rpcUrl: LOCAL_RPC_URL,
	info: chainInfo(31337, 'localhost', LOCAL_RPC_URL),
	tags: ['local'],
};

/** The forked network, described but SILENT about impersonation: the case the default is for. */
const mainnetChain: ChainUserConfig = {
	rpcUrl: MAINNET_RPC_URL,
	info: chainInfo(1, 'mainnet', MAINNET_RPC_URL),
	tags: ['mainnet'],
};

const baseConfig: UserConfig = {
	accounts: {deployer: DEPLOYER, admin: SAFE},
	defaultPollingInterval: 0.001,
};

/** Both buckets present, NEITHER mentioning impersonation. */
const bothBuckets: UserConfig = {...baseConfig, chains: {31337: localChain, 1: mainnetChain}};

function withChains(chains: UserConfig['chains']): UserConfig {
	return {...baseConfig, chains};
}

/** A node reporting `chainId` (the CONNECTED chain), whatever the run simulates. */
function mockProvider(chainId: number, options?: {accounts?: `0x${string}`[]; calls?: string[]}) {
	return {
		request: (async (args: {method: string; params?: unknown}) => {
			options?.calls?.push(args.method);
			switch (args.method) {
				case 'eth_chainId':
					return `0x${chainId.toString(16)}`;
				case 'eth_accounts':
					return options?.accounts ?? [];
				case 'eth_getBlockByNumber':
					return {number: '0x0', hash: GENESIS_HASH};
				case 'hardhat_impersonateAccount':
					return null;
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

/** Resolve the params the way a run does: `computedChainId` is the id the PROVIDER reported. */
function resolve(options: {
	config?: UserConfig;
	environment: ExecutionParams['environment'];
	computedChainId: number;
	autoImpersonate?: boolean;
}) {
	return resolveExecutionParams(
		resolveConfig(options.config ?? bothBuckets),
		{
			environment: options.environment,
			provider: mockProvider(options.computedChainId),
			autoImpersonate: options.autoImpersonate,
		},
		options.computedChainId,
	);
}

describe('a fork defaults auto-impersonation ON', () => {
	/**
	 * The headline, and the contrast that makes it discriminating: the SAME configuration, run
	 * once as a fork of mainnet and once as a plain run on the local node, differs only in the
	 * fork-ness and differs in the answer.
	 */
	it('turns it on for a fork and leaves a non-fork run off, from the same configuration', () => {
		const forked = resolve({environment: {fork: 'mainnet', chainId: 1}, computedChainId: 31337});
		const notForked = resolve({environment: 'localhost', computedChainId: 31337});

		expect(forked.environment.autoImpersonate).toBe(true);
		expect(notForked.environment.autoImpersonate).toBe(false);
	});

	/**
	 * The trap this task exists to avoid. A chain entry that simply does not MENTION
	 * impersonation must not be read as `false`: `chains[1]` above is fully described and silent
	 * on the subject, and a resolution that defaults the chain term to `false` before the
	 * fork-aware one makes that term dead code, so this is the test that fails when the default is
	 * merely appended to the existing chain.
	 */
	it('turns it on when the forked network HAS a chain entry that says nothing about impersonation', () => {
		const resolved = resolve({environment: {fork: 'mainnet', chainId: 1}, computedChainId: 31337});

		// the entry was really consulted: its tags arrived
		expect(resolved.environment.tags).toEqual(['mainnet']);
		expect(resolved.environment.autoImpersonate).toBe(true);
	});

	/** With no `chains` entry for the forked network at all, the same answer for the same reason. */
	it('turns it on when the forked network has no chain configuration at all', () => {
		const resolved = resolve({
			config: withChains({31337: localChain}),
			environment: {fork: 'mainnet', chainId: 1},
			computedChainId: 31337,
		});

		expect(resolved.environment.autoImpersonate).toBe(true);
	});

	/**
	 * ADR 0006: `autoImpersonate` is a node CAPABILITY resolved before the seam, `onUnknownSigner`
	 * is the POLICY afterwards. Defaulting the capability for a fork gives the policy no new
	 * value, so the policy is still the built-in `'auto'`.
	 */
	it('gives the unknown-signer POLICY no new value', () => {
		const resolved = resolve({environment: {fork: 'mainnet', chainId: 1}, computedChainId: 31337});

		expect(resolved.environment.autoImpersonate).toBe(true);
		expect(resolved.environment.onUnknownSigner).toBe('auto');
	});
});

describe('an explicit value still wins on a fork', () => {
	/**
	 * The one that must never regress: `autoImpersonate: false` for the run is how the deferral
	 * path is exercised on a fork (ADR 0006), and the `@rocketh/unknown-signer` scenarios build
	 * their Safe with exactly this spelling. Contrasted with the identical run without the param,
	 * which is on.
	 */
	it('honours a run-level false, so the deferral path stays exercisable there', () => {
		const off = resolve({environment: {fork: 'mainnet', chainId: 1}, computedChainId: 31337, autoImpersonate: false});
		const byDefault = resolve({environment: {fork: 'mainnet', chainId: 1}, computedChainId: 31337});

		expect(off.environment.autoImpersonate).toBe(false);
		expect(byDefault.environment.autoImpersonate).toBe(true);
	});

	/**
	 * A `false` on the SIMULATED network's chain configuration wins too, and the local bucket says
	 * the opposite so the assertion names which bucket was read (the configuration split of ADR
	 * 0014: semantics come from the network being simulated).
	 */
	it('honours a false on the forked network chain configuration, over the local bucket', () => {
		const resolved = resolve({
			config: withChains({
				31337: {...localChain, autoImpersonate: true},
				1: {...mainnetChain, autoImpersonate: false},
			}),
			environment: {fork: 'mainnet', chainId: 1},
			computedChainId: 31337,
		});

		expect(resolved.environment.autoImpersonate).toBe(false);
	});

	/**
	 * The mirror image, and the criterion that was NOT met before the configuration split: a user
	 * who switches impersonation on for the network they are forking now actually gets it, because
	 * the run reads that network's bucket rather than the local node's.
	 */
	it('honours a true on the forked network chain configuration, over a local false', () => {
		const resolved = resolve({
			config: withChains({
				31337: {...localChain, autoImpersonate: false},
				1: {...mainnetChain, autoImpersonate: true},
			}),
			environment: {fork: 'mainnet', chainId: 1},
			computedChainId: 31337,
		});

		expect(resolved.environment.autoImpersonate).toBe(true);
	});

	/** The run parameter outranks the chain configuration on a fork, exactly as off one. */
	it('lets a run-level true win over a forked-network false', () => {
		const resolved = resolve({
			config: withChains({31337: localChain, 1: {...mainnetChain, autoImpersonate: false}}),
			environment: {fork: 'mainnet', chainId: 1},
			computedChainId: 31337,
			autoImpersonate: true,
		});

		expect(resolved.environment.autoImpersonate).toBe(true);
	});

	/**
	 * The environment-override layer sits on top of both buckets, so a user who says `false` there
	 * still gets `false` on a fork.
	 */
	it('honours a false from the environment overrides', () => {
		const resolved = resolve({
			config: {
				...bothBuckets,
				environments: {mainnet: {chain: 1, overrides: {autoImpersonate: false}}},
			},
			environment: {fork: 'mainnet'},
			computedChainId: 31337,
		});

		expect(resolved.environment.autoImpersonate).toBe(false);
	});
});

describe('a non-fork run is untouched', () => {
	/** Off a fork, silence still means off. */
	it('stays off when nothing is configured', () => {
		const resolved = resolve({environment: 'localhost', computedChainId: 31337});

		expect(resolved.environment.autoImpersonate).toBe(false);
	});

	/** And a chain-level `true` is still honoured off a fork. */
	it('is on when the chain configuration asks for it', () => {
		const resolved = resolve({
			config: withChains({31337: {...localChain, autoImpersonate: true}}),
			environment: 'localhost',
			computedChainId: 31337,
		});

		expect(resolved.environment.autoImpersonate).toBe(true);
	});

	/** A plain named run on the network itself is likewise off unless it says otherwise. */
	it('stays off on a plain named run on the network being simulated elsewhere', () => {
		const resolved = resolve({environment: 'mainnet', computedChainId: 1});

		expect(resolved.environment.autoImpersonate).toBe(false);
	});
});

describe('what the default is FOR', () => {
	/**
	 * The user-visible point, asserted on the classification the unknown-signer seam actually
	 * keys off (ADR 0006): a named Safe that no node holds is `impersonated` on a fork, so its
	 * step EXECUTES, and `unsignable` on the same setup off a fork, where it defers. Nothing here
	 * configures impersonation.
	 */
	async function buildEnvironment(environment: ExecutionParams['environment']) {
		const calls: string[] = [];
		const env = await loadEnvironmentFromStore(
			bothBuckets,
			{
				provider: mockProvider(31337, {accounts: [], calls}),
				environment,
				saveDeployments: false,
				promptExecutor,
			},
			emptyStore(),
		);
		return {env, calls};
	}

	it('makes a Safe-owned step executable on a fork, and still deferred off one', async () => {
		const forked = await buildEnvironment({fork: 'mainnet', chainId: 1});
		const notForked = await buildEnvironment('localhost');

		expect(forked.env.addressSignability[SAFE]).toBe('impersonated');
		expect(forked.calls).toContain('hardhat_impersonateAccount');

		expect(notForked.env.addressSignability[SAFE]).toBe('unsignable');
		expect(notForked.calls).not.toContain('hardhat_impersonateAccount');
	});
});
