/**
 * Where a fork states what makes it DIFFERENT from the network it forks: a `whenForked` sub-key
 * on that network's own environment entry.
 *
 * The model is `docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md`. A fork of
 * mainnet is configured LIKE mainnet and states only what genuinely differs, which in practice is
 * the local endpoint above all. Two things are being pinned here and they pull in opposite
 * directions:
 *
 * - the fork layer APPLIES, on top of the forked network's chain config and on top of that
 *   environment's existing `overrides`, most specific last.
 * - declaring it does NOT put a run into fork mode. A run is a fork because of how it was
 *   INVOKED, so a plain `-e mainnet` run of an environment that carries a `whenForked` key must
 *   come out exactly as it did before the key existed.
 *
 * The local endpoint no longer comes from `chains[31337]`, which is where a user configures their
 * own dev node: a chain the fork run is not on has no business naming the port the fork listens
 * on. With nothing declared the run falls back to the CONVENTIONAL local endpoint, which is where
 * both anvil and `hardhat node` listen, so the zero-configuration case is unchanged.
 *
 * Like the other tests in this folder these do NOT use `@rocketh/test-utils` (nx cycle) and go
 * through the real `resolveExecutionParams` / `loadEnvironmentFromStore`.
 */

import {describe, it, expect, vi} from 'vitest';
import {CONVENTIONAL_LOCAL_RPC_URL, resolveConfig, resolveExecutionParams} from '../src/executor/index.js';
import type {ChainInfo, ChainUserConfig, ExecutionParams, UserConfig} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

const ACCOUNT = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' as `0x${string}`;

/** Deliberately a PUBLIC endpoint: no fork run may ever end up pointed at it. */
const MAINNET_RPC_URL = 'https://mainnet.example.invalid/production';
/** The user's own dev node, deliberately NOT on the conventional port: it must not leak. */
const DEV_NODE_RPC_URL = 'http://127.0.0.1:9999';
/** Where the fork actually listens, said by the fork layer and nowhere else. */
const FORK_RPC_URL = 'http://127.0.0.1:8546';

const create2Info = (factory: `0x${string}`) =>
	({
		factory,
		deployer: '0x3fab184622dc19b6109349b94811493bf2a45362',
		funding: '10000000000000000',
		signedTx: '0xdeadbeef',
	}) as const;

const MAINNET_FACTORY = '0x2222222222222222222222222222222222222222';

/** Both buckets are FULLY described, so the only console output a test can see is a NEW one. */
const chainInfo = (id: number, name: string, rpcUrl: string): ChainInfo => ({
	id,
	name,
	nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
	rpcUrls: {default: {http: [rpcUrl]}},
	chainType: 'default',
});

/** The user's LOCALHOST dev node entry, on a port of their own choosing. */
const localChain: ChainUserConfig = {
	rpcUrl: DEV_NODE_RPC_URL,
	info: chainInfo(31337, 'localhost', DEV_NODE_RPC_URL),
	tags: ['local'],
	autoMine: true,
	confirmationsRequired: 1,
};

/** The network being simulated. */
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
	chains: {31337: localChain, 1: mainnetChain},
};

/**
 * The three layers, each saying something the one below it also says, so every assertion below
 * names WHICH layer arrived rather than merely that a value did.
 */
const threeLayers: UserConfig = {
	...baseConfig,
	environments: {
		mainnet: {
			chain: 1,
			overrides: {tags: ['rehearsal'], confirmationsRequired: 2, onUnknownSigner: 'throw'},
			whenForked: {rpcUrl: FORK_RPC_URL, autoImpersonate: true, tags: ['fork'], confirmationsRequired: 9},
		},
	},
};

function mockProvider(chainId: number): EIP1193ProviderWithoutEvents {
	return {
		request: (async (args: {method: string}) => {
			switch (args.method) {
				case 'eth_chainId':
					return `0x${chainId.toString(16)}`;
				case 'eth_accounts':
					return [ACCOUNT];
				default:
					throw new Error(`mock: ${args.method}`);
			}
		}) as any,
	} as EIP1193ProviderWithoutEvents;
}

/**
 * Resolve the params the way a run does: `computedChainId` is the id the run COMPUTED from the
 * node, i.e. the CONNECTED chain's. No provider is passed, so the endpoint the run would dial is
 * observable on the built provider.
 */
function resolve(options: {config?: UserConfig; environment: ExecutionParams['environment']; computedChainId: number}) {
	return resolveExecutionParams(
		resolveConfig(options.config ?? threeLayers),
		{environment: options.environment},
		options.computedChainId,
	);
}

function endpointOf(provider: unknown): string {
	return (provider as {endpoint: string}).endpoint;
}

describe('a fork states only what differs, in `whenForked`', () => {
	/**
	 * The headline: a fork of mainnet is configured like mainnet, and the handful of things that
	 * are true only of the fork are stated once, in the fork's own layer.
	 */
	it('applies the fork layer on a fork run', () => {
		const resolved = resolve({environment: {fork: 'mainnet'}, computedChainId: 31337});

		expect(endpointOf(resolved.provider)).toBe(FORK_RPC_URL);
		expect(resolved.environment.autoImpersonate).toBe(true);
		expect(resolved.environment.tags).toEqual(['fork']);
	});

	/**
	 * Declaring it must be CHEAP. Nothing in a typical project declares an `environments` section
	 * at all, and saying where a fork listens is the first reason to, so an entry that carries
	 * NOTHING but `whenForked` has to be valid — at the type level as much as at runtime, which is
	 * what the `satisfies` here pins.
	 */
	it('accepts an environment entry that exists only to carry the fork layer', () => {
		const config = {
			...baseConfig,
			environments: {mainnet: {whenForked: {rpcUrl: FORK_RPC_URL}}},
		} as const satisfies UserConfig;

		const resolved = resolveExecutionParams(resolveConfig(config), {environment: {fork: 'mainnet'}}, 31337);

		expect(endpointOf(resolved.provider)).toBe(FORK_RPC_URL);
	});
});

describe('the layering order', () => {
	/**
	 * The forked network's chain config, then that environment's `overrides`, then the fork layer,
	 * most specific winning. Each of the three is pinned by a field the layers ABOVE it are silent
	 * about, so the order is observed rather than assumed.
	 */
	it('goes chain config, then environment overrides, then the fork layer', () => {
		const resolved = resolve({environment: {fork: 'mainnet'}, computedChainId: 31337});

		// said by all three: the fork layer wins
		expect(resolved.environment.confirmationsRequired).toBe(9);
		// said by the chain config and the overrides: the overrides win
		expect(resolved.environment.onUnknownSigner).toBe('throw');
		// said only by the forked network's chain config: it still arrives
		expect(resolved.environment.autoMine).toBe(false);
		expect((resolved.environment.deterministicDeployment as {create2: {factory: string}}).create2.factory).toBe(
			MAINNET_FACTORY,
		);
	});
});

describe('declaring a fork layer is NOT a mode switch', () => {
	/**
	 * The trap this key is named against: a `whenForked` key reads like "this environment can be
	 * forked", and if its presence were the switch, a user who described their fork once would
	 * find every later run forked. A plain `-e mainnet` run of the very environment that carries
	 * the key must come out as though the key were not there.
	 */
	it('ignores the fork layer on a non-fork run of the same environment', () => {
		const resolved = resolve({environment: 'mainnet', computedChainId: 1});

		expect(endpointOf(resolved.provider)).toBe(MAINNET_RPC_URL);
		expect(endpointOf(resolved.provider)).not.toBe(FORK_RPC_URL);
		expect(resolved.environment.tags).toEqual(['rehearsal']);
		expect(resolved.environment.confirmationsRequired).toBe(2);
		expect(resolved.environment.autoImpersonate).toBe(false);
	});

	/** And the run is not a fork, which is the same statement made where consumers read it. */
	it('leaves the run a non-fork', () => {
		const resolved = resolve({environment: 'mainnet', computedChainId: 1});

		expect(resolved.environment.fork).toBeUndefined();
	});
});

describe('the zero-configuration path', () => {
	/**
	 * The endpoint a fork dials with nothing declared is the CONVENTIONAL local one, which is
	 * where anvil and `hardhat node` both listen. It is no longer read from `chains[31337]`: that
	 * bucket is where the user describes their own dev node, and a dev node on a port of their
	 * choosing is not where the fork of another network is listening.
	 */
	it('connects to the conventional local endpoint rather than to the dev-node bucket', () => {
		const resolved = resolve({config: baseConfig, environment: {fork: 'mainnet'}, computedChainId: 31337});

		expect(endpointOf(resolved.provider)).toBe(CONVENTIONAL_LOCAL_RPC_URL);
		expect(endpointOf(resolved.provider)).not.toBe(DEV_NODE_RPC_URL);
	});

	/** Nothing configured at all is the commonest case of all, and it must not need a chain entry. */
	it('connects to the conventional local endpoint with no chain configuration whatsoever', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			const resolved = resolve({
				config: {accounts: {deployer: ACCOUNT}},
				environment: {fork: 'mainnet'},
				computedChainId: 31337,
			});

			expect(endpointOf(resolved.provider)).toBe(CONVENTIONAL_LOCAL_RPC_URL);
		} finally {
			warn.mockRestore();
		}
	});
});

describe('what this must NOT change', () => {
	/**
	 * The conventional endpoint is a FORK rule, not a global one: a plain run against the local
	 * dev node still dials exactly the endpoint that node's own bucket names.
	 */
	it('leaves a non-fork run on the local chain dialling its own configured endpoint', () => {
		const resolved = resolve({config: baseConfig, environment: 'localhost', computedChainId: 31337});

		expect(endpointOf(resolved.provider)).toBe(DEV_NODE_RPC_URL);
	});

	/**
	 * An environment declared the way every existing configuration declares one, with no fork
	 * layer at all, resolves exactly as before on a fork run: the forked network's settings under
	 * that environment's overrides.
	 */
	it('leaves an environment with no fork layer resolving as before', () => {
		const resolved = resolve({
			config: {
				...baseConfig,
				environments: {mainnet: {chain: 1, overrides: {tags: ['rehearsal'], confirmationsRequired: 2}}},
			},
			environment: {fork: 'mainnet'},
			computedChainId: 31337,
		});

		expect(resolved.environment.tags).toEqual(['rehearsal']);
		expect(resolved.environment.confirmationsRequired).toBe(2);
		expect(resolved.environment.onUnknownSigner).toBe('ask');
	});
});
