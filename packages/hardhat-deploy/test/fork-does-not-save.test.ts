/**
 * The hardhat-deploy fork path still does not save, now that the rule lives in rocketh core.
 *
 * This plugin used to be the only thing standing between a `HARDHAT_FORK` rehearsal and the forked
 * network's real deployment records: `loadEnvironmentFromHardhat` paired the fork input with
 * `saveDeployments: false` itself. Core now defaults a fork to not saving
 * (`docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md`), so that pairing was
 * removed here. This is the one path with real users today, so the equivalence is TESTED rather
 * than reasoned about, in two steps that together cover the whole call:
 *
 * 1. what the plugin now PASSES: `@rocketh/node` is mocked so the params reaching
 *    `loadEnvironmentFromFiles` can be inspected, and `saveDeployments` must be absent (not
 *    `false`, absent: an explicit value would outrank core's default and hide a regression in it);
 * 2. what those params RESOLVE to: the very same object is handed to the real core loader, which
 *    must answer `false` on a fork and, unchanged, `true` on an ordinary named run.
 */

import {describe, it, expect, afterEach, vi} from 'vitest';
import type {DeploymentStore, ExecutionParams, PromptExecutor, UserConfig} from 'rocketh/types';
import {loadEnvironmentFromStore} from 'rocketh';

const captured = vi.hoisted(() => ({params: undefined as Record<string, unknown> | undefined}));

vi.mock('@rocketh/node', () => ({
	loadEnvironmentFromFiles: vi.fn(async (params: Record<string, unknown>) => {
		captured.params = params;
		return {} as never;
	}),
	chainByCanonicalName: {},
}));

const {loadEnvironmentFromHardhat} = await import('../src/helpers.js');

const ACCOUNT = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' as `0x${string}`;
const GENESIS_HASH = ('0x' + '0'.repeat(64)) as `0x${string}`;
const CONTRACT_ADDRESS = '0xabc0000000000000000000000000000000000000';

/** A hardhat EDR node forking mainnet: it simulates chain 1 but REPORTS 31337 (ADR 0014). */
function hardhatForkConnection() {
	return {
		networkName: 'fork',
		networkConfig: {type: 'edr-simulated'},
		provider: {
			request: async (args: {method: string}) => {
				switch (args.method) {
					case 'eth_chainId':
						return '0x7a69'; // 31337
					case 'eth_accounts':
						return [ACCOUNT];
					case 'eth_getBlockByNumber':
						return {number: '0x0', hash: GENESIS_HASH};
					case 'hardhat_impersonateAccount':
						return null;
					default:
						throw new Error(`mock: ${args.method}`);
				}
			},
		},
	} as any;
}

/** Deployment records of the network being forked: keyed by its NAME, marked with ITS chain. */
function mainnetRecords(): DeploymentStore {
	const files: Record<string, string> = {
		'.chain': JSON.stringify({chainId: '1', genesisHash: GENESIS_HASH}),
		'MyContract.json': JSON.stringify({address: CONTRACT_ADDRESS, abi: []}),
	};
	return {
		listFiles: vi.fn(async (_f: unknown, _e: unknown, filter?: (name: string) => boolean) =>
			Object.keys(files).filter((name) => (filter ? filter(name) : true)),
		),
		deleteAll: vi.fn(async () => {
			for (const key of Object.keys(files)) delete files[key];
		}),
		hasFile: vi.fn(async (_f: unknown, _e: unknown, name: string) => files[name] !== undefined),
		writeFile: vi.fn(async (_f: unknown, _e: unknown, name: string, content: string) => {
			files[name] = content;
		}),
		writeFileWithChainInfo: vi.fn(async (_i: unknown, _f: unknown, _e: unknown, name: string, content: string) => {
			files[name] = content;
		}),
		readFile: vi.fn(async (_f: unknown, _e: unknown, name: string) => files[name] ?? ''),
		deleteFile: vi.fn(async (_f: unknown, _e: unknown, name: string) => {
			delete files[name];
		}),
	} as unknown as DeploymentStore;
}

/** No records at all: what an ordinary (non-fork) run of this plugin reads in these tests. */
function emptyStore(): DeploymentStore {
	const files: Record<string, string> = {};
	return {
		listFiles: vi.fn(async (_f: unknown, _e: unknown, filter?: (name: string) => boolean) =>
			Object.keys(files).filter((name) => (filter ? filter(name) : true)),
		),
		deleteAll: vi.fn(async () => {}),
		hasFile: vi.fn(async (_f: unknown, _e: unknown, name: string) => files[name] !== undefined),
		writeFile: vi.fn(async (_f: unknown, _e: unknown, name: string, content: string) => {
			files[name] = content;
		}),
		writeFileWithChainInfo: vi.fn(async (_i: unknown, _f: unknown, _e: unknown, name: string, content: string) => {
			files[name] = content;
		}),
		readFile: vi.fn(async (_f: unknown, _e: unknown, name: string) => files[name] ?? ''),
		deleteFile: vi.fn(async (_f: unknown, _e: unknown, name: string) => {
			delete files[name];
		}),
	} as unknown as DeploymentStore;
}

const promptExecutor: PromptExecutor = {
	async prompt() {
		return {proceed: true};
	},
	exit() {},
};

const config: UserConfig = {accounts: {deployer: ACCOUNT}, defaultPollingInterval: 0.001};

/** Run the plugin's real loader and return the params it handed to `@rocketh/node`. */
async function paramsPassedByThePlugin(): Promise<ExecutionParams> {
	captured.params = undefined;
	await loadEnvironmentFromHardhat({hre: {} as any, connection: hardhatForkConnection()});
	if (!captured.params) {
		throw new Error('the plugin did not call loadEnvironmentFromFiles');
	}
	return captured.params as ExecutionParams;
}

afterEach(() => {
	delete process.env.HARDHAT_FORK;
});

describe('hardhat-deploy no longer carries the fork saving rule', () => {
	/**
	 * The removal itself. `undefined` rather than `false` is the load-bearing part: an explicit
	 * value wins over every default in core, so passing `false` "to be safe" would keep this
	 * plugin green even if the core default regressed.
	 */
	it('passes NO saveDeployments on a fork, leaving the decision to core', async () => {
		process.env.HARDHAT_FORK = 'mainnet';
		const params = await paramsPassedByThePlugin();

		expect(params.environment).toEqual({fork: 'mainnet'});
		expect(params.saveDeployments).toBeUndefined();
	});

	/** And nothing changed off a fork: it never passed a value there either. */
	it('passes NO saveDeployments off a fork, exactly as before', async () => {
		const params = await paramsPassedByThePlugin();

		expect(params.environment).toBe('fork');
		expect(params.saveDeployments).toBeUndefined();
	});
});

describe('the resulting run behaves exactly as it did', () => {
	async function environmentFor(params: ExecutionParams, store: DeploymentStore) {
		return loadEnvironmentFromStore(config, {...params, extra: undefined, promptExecutor}, store);
	}

	/**
	 * The property a `HARDHAT_FORK` user has today, now obtained from core: the rehearsal reads
	 * mainnet's records and writes nothing back into them.
	 */
	it('does not save on a fork, while still reading the forked network records', async () => {
		process.env.HARDHAT_FORK = 'mainnet';
		const env = await environmentFor(await paramsPassedByThePlugin(), mainnetRecords());

		expect(env.context.saveDeployments).toBe(false);
		expect(env.network.fork?.networkName).toBe('mainnet');
		expect(env.deployments['MyContract'].address).toBe(CONTRACT_ADDRESS);
	});

	/** The contrast that makes the assertion above mean something: an ordinary run still saves. */
	it('still saves on an ordinary hardhat-deploy run', async () => {
		// its OWN (empty) folder: this run is the network `fork`, not mainnet, and it does not get
		// the chain-identity leniency a fork does, so it may not be pointed at mainnet's records
		const env = await environmentFor(await paramsPassedByThePlugin(), emptyStore());

		expect(env.network.fork).toBeUndefined();
		expect(env.context.saveDeployments).toBe(true);
	});
});
