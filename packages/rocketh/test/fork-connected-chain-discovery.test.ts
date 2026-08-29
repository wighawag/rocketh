/**
 * A fork run that nobody handed a provider finds out which chain it is TALKING TO by asking the
 * node, instead of throwing before it ever dials.
 *
 * The value resolved here is the CONNECTED chain (`docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md`):
 * the id every transaction declares, which a node rejects a mismatch on. The SIMULATED chain,
 * what the run is a fork OF, keeps coming from the fork input or `environments[<name>].chain`,
 * and nothing here may move it.
 *
 * Why this is possible only on a fork, and why the guard is a necessity rather than a style
 * choice: a fork's endpoint is known WITHOUT the chain id (it is `whenForked.rpcUrl` else the
 * conventional local endpoint), while off a fork the endpoint comes from `chains[<id>]`, so
 * asking the node first would be circular there.
 *
 * The network boundary is the only thing faked below: `fetch` is stubbed, so the real
 * `JSONRPCHTTPProvider` runs and every assertion about WHICH endpoint was dialled is made on the
 * url the production code actually asked for.
 *
 * Like the other tests in this folder these do NOT use `@rocketh/test-utils` (nx cycle) and go
 * through the real `getChainIdForEnvironment` / `resolveExecutionParams`.
 */

import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {
	CONVENTIONAL_LOCAL_RPC_URL,
	getChainIdForEnvironment,
	resolveConfig,
	resolveExecutionParams,
} from '../src/executor/index.js';
import type {ChainInfo, ExecutionParams, UserConfig} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

const ACCOUNT = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' as `0x${string}`;

/** Deliberately a PUBLIC endpoint: no fork run may dial it, discovery included. */
const MAINNET_RPC_URL = 'https://mainnet.example.invalid/production';
/** The user's own dev node, on a port of their choosing: not where the fork listens. */
const DEV_NODE_RPC_URL = 'http://127.0.0.1:9999';
/** Where the fork actually listens when it is not on the conventional port. */
const FORK_RPC_URL = 'http://127.0.0.1:8546';

const chainInfo = (id: number, name: string, rpcUrl: string): ChainInfo => ({
	id,
	name,
	nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
	rpcUrls: {default: {http: [rpcUrl]}},
	chainType: 'default',
});

/** mainnet described, plus the user's own dev node: neither may supply a fork's endpoint. */
const baseConfig: UserConfig = {
	accounts: {deployer: ACCOUNT},
	defaultPollingInterval: 0.001,
	chains: {
		1: {
			rpcUrl: MAINNET_RPC_URL,
			info: chainInfo(1, 'mainnet', MAINNET_RPC_URL),
			tags: ['mainnet', 'production'],
			confirmationsRequired: 5,
		},
		31337: {rpcUrl: DEV_NODE_RPC_URL, info: chainInfo(31337, 'localhost', DEV_NODE_RPC_URL), tags: ['local']},
	},
};

type Dial = {url: string; method: string};

/** Every url the code under test dialled, in order, with the JSON-RPC method it asked for. */
let dials: Dial[];

function stubNode(answer: {chainId: number} | {result: string} | {unreachable: true}) {
	vi.stubGlobal('fetch', async (url: string | URL, init: {body: string}) => {
		const request = JSON.parse(init.body) as {id: number; method: string};
		dials.push({url: String(url), method: request.method});
		if ('unreachable' in answer) {
			// what `fetch` does for a refused connection, which is the case this simulates
			throw new TypeError('fetch failed');
		}
		const result = 'chainId' in answer ? `0x${answer.chainId.toString(16)}` : answer.result;
		return new Response(JSON.stringify({jsonrpc: '2.0', id: request.id, result}), {
			status: 200,
			headers: {'content-type': 'application/json'},
		});
	});
}

function mockProvider(chainId: number): EIP1193ProviderWithoutEvents {
	return {
		request: (async (args: {method: string}) => {
			if (args.method === 'eth_chainId') {
				return `0x${chainId.toString(16)}`;
			}
			throw new Error(`mock: ${args.method}`);
		}) as any,
	} as EIP1193ProviderWithoutEvents;
}

function endpointOf(provider: unknown): string {
	return (provider as {endpoint: string}).endpoint;
}

/** Resolve a chain id the way a run does, from a USER config. */
function chainIdOf(config: UserConfig, executionParams: ExecutionParams, environmentName = 'mainnet') {
	return getChainIdForEnvironment(resolveConfig(config), environmentName, executionParams);
}

beforeEach(() => {
	dials = [];
	// a chain nobody described warns, and these tests describe only what they are about; the
	// warning itself is pinned where it belongs, in `chains.test.ts`.
	vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('a fork run with no provider asks the node which chain it is connected to', () => {
	/**
	 * The headline. Before this, the only source was `environments[<name>].chain` and a run with
	 * nothing declared threw `Could not find chainId ... (no provider)` without ever dialling.
	 */
	it('resolves the chain id from the node with nothing declared at all', async () => {
		stubNode({chainId: 1});

		const chainId = await chainIdOf({accounts: {deployer: ACCOUNT}}, {environment: {fork: 'mainnet'}});

		expect(chainId).toBe(1);
		expect(dials).toEqual([{url: CONVENTIONAL_LOCAL_RPC_URL, method: 'eth_chainId'}]);
	});

	/**
	 * The zero-configuration path end to end, which is what `anvil --fork-url <mainnet>` gives a
	 * user: the node reports the forked network's own id, so the forked network's settings are
	 * found with no `environments` entry whatsoever.
	 */
	it('resolves the forked network settings with no environments entry at all', async () => {
		stubNode({chainId: 1});

		const config = resolveConfig(baseConfig);
		const executionParams: ExecutionParams = {environment: {fork: 'mainnet'}};
		const chainId = await getChainIdForEnvironment(config, 'mainnet', executionParams);
		const resolved = resolveExecutionParams(config, executionParams, chainId);

		expect(chainId).toBe(1);
		// the SIMULATED network's settings, not the dev node's
		expect(resolved.environment.tags).toEqual(['mainnet', 'production']);
		expect(resolved.environment.confirmationsRequired).toBe(5);
		// ...while the connection stays local, and the transactions declare the node's id
		expect(endpointOf(resolved.provider)).toBe(CONVENTIONAL_LOCAL_RPC_URL);
		expect(resolved.chain.id).toBe(1);
	});

	/**
	 * What `documentation/fork-runs/index.md` already promises: an entry may exist ONLY to say
	 * where a fork listens, without declaring a chain the user is not otherwise using.
	 */
	it('accepts an environment entry that carries only the fork layer', async () => {
		stubNode({chainId: 1});

		const config = {
			...baseConfig,
			environments: {mainnet: {whenForked: {rpcUrl: FORK_RPC_URL}}},
		} as const satisfies UserConfig;

		const chainId = await chainIdOf(config, {environment: {fork: 'mainnet'}});

		expect(chainId).toBe(1);
		expect(dials[0]?.url).toBe(FORK_RPC_URL);
	});
});

describe('the node WINS over the declared id', () => {
	/**
	 * The crux, and the regression this task must not cause. The docs tell a hardhat user to
	 * declare `chain: 1` so the SIMULATED network's settings are found, so the declared id is
	 * routinely the simulated one. Preferring it would put 1 into the `chainId` of every
	 * transaction built against a node reporting 31337, and the node would reject them.
	 */
	it('adopts the node id even when a different one is declared', async () => {
		stubNode({chainId: 31337});

		const config = {...baseConfig, environments: {mainnet: {chain: 1}}};
		const chainId = await chainIdOf(config, {environment: {fork: 'mainnet'}});

		expect(chainId).toBe(31337);
	});

	/**
	 * ...and the other identity is untouched: the hardhat shape signs for 31337 while still
	 * rehearsing with mainnet's settings, which is exactly the split ADR 0014 records.
	 */
	it('leaves the SIMULATED chain coming from the declared value', async () => {
		stubNode({chainId: 31337});

		const config = resolveConfig({...baseConfig, environments: {mainnet: {chain: 1}}});
		const executionParams: ExecutionParams = {environment: {fork: 'mainnet'}};
		const chainId = await getChainIdForEnvironment(config, 'mainnet', executionParams);
		const resolved = resolveExecutionParams(config, executionParams, chainId);

		expect(resolved.environment.fork).toEqual({networkName: 'mainnet', chainId: 1});
		expect(resolved.environment.tags).toEqual(['mainnet', 'production']);
		expect(resolved.chain.id).toBe(31337);
	});

	/** The fork input's own `chainId` still names the simulated chain, ahead of anything else. */
	it('leaves a supplied fork chainId naming the simulated chain', async () => {
		stubNode({chainId: 31337});

		const config = resolveConfig(baseConfig);
		const executionParams: ExecutionParams = {environment: {fork: 'mainnet', chainId: 1}};
		const chainId = await getChainIdForEnvironment(config, 'mainnet', executionParams);
		const resolved = resolveExecutionParams(config, executionParams, chainId);

		expect(chainId).toBe(31337);
		expect(resolved.environment.fork).toEqual({networkName: 'mainnet', chainId: 1});
	});
});

describe('discovery dials the SAME endpoint the run then connects to', () => {
	/**
	 * The reason the endpoint is resolved in ONE place. Two independent computations could drift
	 * and the run would ask one node which chain it is and then talk to another, which would be
	 * invisible right up until it signed for the wrong chain.
	 */
	it('dials the fork layer endpoint, on a non-conventional port', async () => {
		stubNode({chainId: 1});

		const config = resolveConfig({...baseConfig, environments: {mainnet: {whenForked: {rpcUrl: FORK_RPC_URL}}}});
		const executionParams: ExecutionParams = {environment: {fork: 'mainnet'}};
		const chainId = await getChainIdForEnvironment(config, 'mainnet', executionParams);
		const resolved = resolveExecutionParams(config, executionParams, chainId);

		expect(dials[0]?.url).toBe(endpointOf(resolved.provider));
		expect(dials[0]?.url).toBe(FORK_RPC_URL);
	});

	/**
	 * The withholding of `overrides.rpcUrl` on a fork is inherited by discovery for free, because
	 * it asks the same function. `environments.mainnet.overrides.rpcUrl` is how you reach the REAL
	 * mainnet, and a discovery dial to it would leak the rehearsal to production.
	 */
	it('never dials the endpoint of the network being simulated', async () => {
		stubNode({chainId: 1});

		const config = resolveConfig({
			...baseConfig,
			environments: {mainnet: {chain: 1, overrides: {rpcUrl: MAINNET_RPC_URL}}},
		});
		const executionParams: ExecutionParams = {environment: {fork: 'mainnet'}};
		const chainId = await getChainIdForEnvironment(config, 'mainnet', executionParams);
		const resolved = resolveExecutionParams(config, executionParams, chainId);

		expect(dials.map((dial) => dial.url)).toEqual([CONVENTIONAL_LOCAL_RPC_URL]);
		expect(endpointOf(resolved.provider)).toBe(CONVENTIONAL_LOCAL_RPC_URL);
	});
});

describe('discovery is scoped to forks, by necessity', () => {
	/**
	 * Off a fork the endpoint comes from `chains[<id>]`, so asking the node which chain it is
	 * would require knowing which node to ask: the question is genuinely circular there, and this
	 * pins that nothing was loosened. The existing error is still what a user gets.
	 */
	it('still throws for a provider-less NON-fork run with nothing declared, without dialling', async () => {
		stubNode({chainId: 1});

		await expect(chainIdOf(baseConfig, {environment: 'mainnet'})).rejects.toThrow(
			'Could not find chainId for environment named "mainnet" (no provider)',
		);
		expect(dials).toEqual([]);
	});

	/** And a declared id off a fork is still taken at its word, with no node consulted. */
	it('still takes the declared id for a provider-less NON-fork run', async () => {
		stubNode({chainId: 31337});

		const chainId = await chainIdOf({...baseConfig, environments: {mainnet: {chain: 1}}}, {environment: 'mainnet'});

		expect(chainId).toBe(1);
		expect(dials).toEqual([]);
	});
});

describe('a fork run whose node cannot be reached', () => {
	/**
	 * It FAILS rather than falling back to the declared id: falling back is what would silently
	 * produce a run signing for the simulated chain. The message names the endpoint, because
	 * "connection refused" without an address is the least actionable error there is.
	 */
	it('fails with a message naming the endpoint it tried', async () => {
		stubNode({unreachable: true});

		await expect(chainIdOf(baseConfig, {environment: {fork: 'mainnet'}})).rejects.toThrow(CONVENTIONAL_LOCAL_RPC_URL);
	});

	/** Naming the endpoint means the CONFIGURED one, which is the one worth reporting. */
	it('names the fork layer endpoint when one is declared', async () => {
		stubNode({unreachable: true});

		const config = {...baseConfig, environments: {mainnet: {chain: 1, whenForked: {rpcUrl: FORK_RPC_URL}}}};

		await expect(chainIdOf(config, {environment: {fork: 'mainnet'}})).rejects.toThrow(FORK_RPC_URL);
	});

	/** A node that answers something that is not a chain id is the same kind of failure. */
	it('fails on an answer that is not a chain id, naming the endpoint', async () => {
		stubNode({result: '0x0'});

		await expect(chainIdOf(baseConfig, {environment: {fork: 'mainnet'}})).rejects.toThrow(CONVENTIONAL_LOCAL_RPC_URL);
	});
});

describe('a run that DOES supply a provider is unaffected', () => {
	/** hardhat-deploy's path: the provider answers, exactly as before, and nothing is dialled. */
	it('asks the supplied provider on a fork', async () => {
		stubNode({chainId: 1});

		const chainId = await chainIdOf({...baseConfig, environments: {mainnet: {chain: 1}}}, {
			environment: {fork: 'mainnet'},
			provider: mockProvider(31337),
		} as ExecutionParams);

		expect(chainId).toBe(31337);
		expect(dials).toEqual([]);
	});

	/** Even where a fork endpoint is configured: a provider always wins over an rpc url. */
	it('asks the supplied provider even when the fork layer names an endpoint', async () => {
		stubNode({chainId: 1});

		const config = {...baseConfig, environments: {mainnet: {whenForked: {rpcUrl: FORK_RPC_URL}}}};
		const chainId = await chainIdOf(config, {
			environment: {fork: 'mainnet'},
			provider: mockProvider(31337),
		} as ExecutionParams);

		expect(chainId).toBe(31337);
		expect(dials).toEqual([]);
	});
});
