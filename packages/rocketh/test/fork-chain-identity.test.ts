/**
 * The CONNECTED chain identity of a fork run: which chain id `env.network.chain` reports, and
 * when the identity check is allowed to say the provider disagrees with the configuration.
 *
 * The model is `docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md`. A fork run
 * has TWO chain identities and this file is about the second one:
 *
 * - the SIMULATED chain (the network being forked) drives the configuration lookup, the
 *   deployment records and the semantics. Pinned in `fork-semantics.test.ts`.
 * - the CONNECTED chain (whatever the NODE reports) drives `env.network.chain`, and therefore the
 *   `chainId` field of every transaction rocketh builds. A signed transaction commits to that id,
 *   so the only correct value is the one the node will accept.
 *
 * The two provider shapes are MEASURED, not assumed (`work/notes/findings/fork-node-chain-identity-behaviour.md`):
 * anvil forking mainnet reports 1, hardhat reports 31337. Both are normal, which is why a fork is
 * the one place the identity check must stay quiet.
 *
 * Every test here is therefore discriminating by construction: the SIMULATED id is declared as 1
 * and only the node's answer changes, so an implementation that let the simulated side win would
 * fail the anvil case, the hardhat case, or both.
 *
 * Like the other tests in this folder these do NOT use `@rocketh/test-utils` (nx cycle) and build
 * a REAL environment locally, through `loadEnvironmentFromStore`, which is also the path
 * hardhat-deploy takes. The transaction FIELD itself is asserted one package over, in
 * `packages/rocketh-read-execute/test/fork-chain-identity.integration.test.ts`, because that is
 * where the builders live.
 */

import {describe, it, expect, vi} from 'vitest';
import {getChainIdForEnvironment, loadEnvironmentFromStore, resolveConfig} from '../src/executor/index.js';
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

/** The message the identity check emits; asserted on rather than on "any warning at all". */
const IDENTITY_WARNING = /different chainId/;

/** Both buckets are FULLY described, so no unrelated notice can be mistaken for the one under test. */
const chainInfo = (id: number, name: string, rpcUrl: string): ChainInfo => ({
	id,
	name,
	nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
	rpcUrls: {default: {http: [rpcUrl]}},
	chainType: 'default',
});

/** The user's LOCALHOST dev node entry: on a fork this is what supplies the CONNECTION. */
const localChain: ChainUserConfig = {
	rpcUrl: LOCAL_RPC_URL,
	info: chainInfo(31337, 'localhost', LOCAL_RPC_URL),
};

/** The network being SIMULATED. A fork run must never end up connected to this one. */
const mainnetChain: ChainUserConfig = {
	rpcUrl: MAINNET_RPC_URL,
	info: chainInfo(1, 'mainnet', MAINNET_RPC_URL),
};

const baseConfig: UserConfig = {
	accounts: {deployer: ACCOUNT},
	defaultPollingInterval: 0.001,
	chains: {31337: localChain, 1: mainnetChain},
	// the forked network declares its own chain id, so the identity check HAS something to
	// compare against and a fork under hardhat is a genuine (and legitimate) disagreement
	environments: {mainnet: {chain: 1}},
};

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

async function loadEnv(options: {
	environment: ExecutionParams['environment'];
	config?: UserConfig;
	nodeChainId: number;
}) {
	return loadEnvironmentFromStore(
		options.config ?? baseConfig,
		{
			provider: mockProvider(options.nodeChainId),
			environment: options.environment,
			saveDeployments: false,
			promptExecutor,
		},
		emptyStore(),
	);
}

/** Run `body` with `console.warn` captured, and hand back every message it emitted. */
async function withWarnings<T>(body: () => Promise<T>): Promise<{result: T; warnings: string[]}> {
	const warnings: string[] = [];
	const warn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
		warnings.push(args.map((a) => String(a)).join(' '));
	});
	try {
		return {result: await body(), warnings};
	} finally {
		warn.mockRestore();
	}
}

describe('env.network.chain reports the CONNECTED chain, so transactions follow the node', () => {
	/**
	 * The anvil shape, and the bug this closes: forking mainnet, anvil reports 1, so the run must
	 * declare 1. It used to report 31337 whatever the node said, because the identity was read off
	 * the local `chains[31337]` bucket, and a locally signed transaction declaring 31337 to a node
	 * that believes it is chain 1 is rejected.
	 */
	it('adopts the id a node reporting the FORKED chain gives', async () => {
		const env = await loadEnv({environment: {fork: 'mainnet', chainId: 1}, nodeChainId: 1});

		expect(env.network.chain.id).toBe(1);
	});

	/**
	 * The hardhat shape, which is every hardhat-deploy user today: the engine reports its own
	 * 31337 while simulating mainnet, and 31337 is what its node accepts. Unchanged behaviour, and
	 * the reason the SIMULATED id must never be adopted for transactions.
	 */
	it('adopts the id a node reporting its own LOCAL engine gives', async () => {
		const env = await loadEnv({environment: {fork: 'mainnet', chainId: 1}, nodeChainId: 31337});

		expect(env.network.chain.id).toBe(31337);
	});

	/**
	 * Only the ID follows the node. The rest of the chain info still describes what the run is
	 * CONNECTED to, above all the rpc urls: a fork run pointed at the forked network's public
	 * endpoint would be the worst possible outcome of this change.
	 */
	it('moves the id alone, leaving the connection description local', async () => {
		const env = await loadEnv({environment: {fork: 'mainnet', chainId: 1}, nodeChainId: 1});

		expect(env.network.chain.rpcUrls.default.http).toEqual([LOCAL_RPC_URL]);
		expect(env.network.chain.rpcUrls.default.http).not.toContain(MAINNET_RPC_URL);
	});

	/** The two identities coexist: the descriptor keeps naming what is SIMULATED. */
	it('keeps the simulated identity on the descriptor while the chain id follows the node', async () => {
		const env = await loadEnv({environment: {fork: 'mainnet', chainId: 1}, nodeChainId: 31337});

		expect(env.network.fork).toEqual({networkName: 'mainnet', chainId: 1});
		expect(env.network.chain.id).toBe(31337);
	});

	/** A non-fork run is untouched: its one identity is still the node's. */
	it('leaves a non-fork run reporting the node id, as it always did', async () => {
		const env = await loadEnv({environment: 'mainnet', nodeChainId: 1});

		expect(env.network.chain.id).toBe(1);
	});
});

describe('the identity check is lenient on a fork, and ONLY on a fork', () => {
	/**
	 * The discriminating case: `environments.mainnet.chain` is 1 and the node says 31337, which
	 * is precisely the comparison that fires off a fork. On a fork it is not a disagreement at
	 * all, it is what hardhat does, so nothing is said.
	 */
	it('says nothing when a forked node reports its own local engine id', async () => {
		const {warnings} = await withWarnings(() => loadEnv({environment: {fork: 'mainnet'}, nodeChainId: 31337}));

		expect(warnings.filter((message) => IDENTITY_WARNING.test(message))).toEqual([]);
	});

	/** The other tool: anvil reports the forked chain's id, which agrees, and is equally silent. */
	it('says nothing when a forked node reports the forked chain id', async () => {
		const {warnings} = await withWarnings(() => loadEnv({environment: {fork: 'mainnet'}, nodeChainId: 1}));

		expect(warnings.filter((message) => IDENTITY_WARNING.test(message))).toEqual([]);
	});

	/**
	 * The scoping half, and the one that stops this being "the check was deleted": the SAME
	 * configuration and the SAME node, run as an ordinary named environment, is a genuine
	 * misconfiguration and still says so.
	 */
	it('still warns on a genuine mismatch off a fork', async () => {
		const {warnings} = await withWarnings(() => loadEnv({environment: 'mainnet', nodeChainId: 31337}));

		expect(warnings.filter((message) => IDENTITY_WARNING.test(message))).toHaveLength(1);
	});
});

describe('which id the run ADOPTS', () => {
	const config = resolveConfig(baseConfig);

	/**
	 * A decision, not whichever value happened to be truthy: when a node answered, its id is the
	 * one the run uses, because it is the only id a transaction can be signed for. That holds on
	 * a fork, where it deliberately disagrees with the declared (simulated) id.
	 */
	it('takes the node id over the declared one, on a fork', async () => {
		const chainId = await getChainIdForEnvironment(config, 'mainnet', {
			environment: {fork: 'mainnet'},
			provider: mockProvider(31337),
		});

		expect(chainId).toBe(31337);
	});

	/** Same rule off a fork, where the disagreement is also warned about. */
	it('takes the node id over the declared one off a fork too', async () => {
		const {result} = await withWarnings(() =>
			getChainIdForEnvironment(config, 'mainnet', {environment: 'mainnet', provider: mockProvider(31337)}),
		);

		expect(result).toBe(31337);
	});

	/** With no node to ask, the declared id is all there is, and it is still accepted. */
	it('falls back to the declared id when there is no provider', async () => {
		const chainId = await getChainIdForEnvironment(config, 'mainnet', {environment: 'mainnet'});

		expect(chainId).toBe(1);
	});
});
