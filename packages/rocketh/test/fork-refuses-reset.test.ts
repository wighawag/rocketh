/**
 * A fork run REFUSES to reset, rather than deleting the simulated network's real records.
 *
 * The two rules that make this necessary are already pinned elsewhere and are both correct on
 * their own: a fork run IS the forked network for RECORDS, so its deployment folder is keyed by
 * the SIMULATED network's name (`fork-semantics`, ADR 0014), and a fork run does NOT save
 * (`fork-does-not-save`). Together they meant `rocketh -e mainnet --is-fork --reset` deleted
 * `deployments/mainnet/` (records, `.chain` and `.migrations.json`) and then guaranteed the run
 * put nothing back, so the flag combination could only ever destroy real records of a network the
 * run was never going to write to. There is no reading of it a user could want, which is why it
 * is refused outright instead of warned about.
 *
 * Three properties, and the last two are what keep the refusal honest:
 *
 * - a fork run asked to reset THROWS, and nothing is deleted. The store assertion is the load
 *   bearing half: an error raised after the folder was already emptied would still pass a
 *   throws-only test.
 * - the refusal happens while the environment is being BUILT, before the executor asks the user
 *   to confirm the deletion. A check at the deletion site would prompt "this will delete all
 *   deployments for env: mainnet, proceed?" and only then refuse, which is the worst order.
 * - a NON-fork reset still deletes, and a fork WITHOUT reset still loads. Both are contrasted
 *   with the refused case so a regression to a hardcoded refusal (or none) fails.
 *
 * Like the other tests in this folder these do NOT use `@rocketh/test-utils` (nx cycle) and build
 * a REAL environment locally, through `loadEnvironmentFromStore`.
 */

import {describe, it, expect, vi} from 'vitest';
import {loadEnvironmentFromStore} from '../src/executor/index.js';
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
const EXISTING_CONTRACT = '0xabc0000000000000000000000000000000000000' as `0x${string}`;

const LOCAL_RPC_URL = 'http://127.0.0.1:8545';
/** Deliberately a PUBLIC endpoint: no fork run may ever end up pointed at it. */
const MAINNET_RPC_URL = 'https://mainnet.example.invalid/production';

const chainInfo = (id: number, name: string, rpcUrl: string): ChainInfo => ({
	id,
	name,
	nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
	rpcUrls: {default: {http: [rpcUrl]}},
	chainType: 'default',
});

const localChain: ChainUserConfig = {
	rpcUrl: LOCAL_RPC_URL,
	info: chainInfo(31337, 'localhost', LOCAL_RPC_URL),
	tags: ['local'],
};

/** The network being simulated, whose records a fork reads and must never delete. */
const mainnetChain: ChainUserConfig = {
	rpcUrl: MAINNET_RPC_URL,
	info: chainInfo(1, 'mainnet', MAINNET_RPC_URL),
	tags: ['mainnet'],
};

const config: UserConfig = {
	accounts: {deployer: ACCOUNT},
	defaultPollingInterval: 0.001,
	chains: {31337: localChain, 1: mainnetChain},
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

/** Records of the network being forked: keyed by its name, marked with ITS chain. */
function mainnetRecords(): DeploymentStore & {files: Record<string, string>} {
	const files: Record<string, string> = {
		'.chain': JSON.stringify({chainId: '1', genesisHash: GENESIS_HASH}),
		'MyContract.json': JSON.stringify({address: EXISTING_CONTRACT, abi: []}),
	};
	return {
		files,
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
	} as unknown as DeploymentStore & {files: Record<string, string>};
}

/**
 * Counts every question asked. The refusal must land BEFORE the executor's reset confirmation,
 * so on the refused path this stays at zero.
 */
function countingPrompt(): PromptExecutor & {asked: string[]} {
	const asked: string[] = [];
	return {
		asked,
		async prompt(request: {name: string}) {
			asked.push(request.name);
			return {proceed: true} as any;
		},
		exit() {},
	} as unknown as PromptExecutor & {asked: string[]};
}

function build(environment: ExecutionParams['environment'], reset: boolean, connectedChainId = 31337) {
	const store = mainnetRecords();
	const promptExecutor = countingPrompt();
	const promise = loadEnvironmentFromStore(
		config,
		{provider: mockProvider(connectedChainId), environment, reset, promptExecutor},
		store,
	);
	return {promise, store, promptExecutor};
}

describe('a fork run refuses to reset', () => {
	/**
	 * The headline. `rocketh -e mainnet --is-fork --reset` used to empty `deployments/mainnet`
	 * before rehearsing against it.
	 */
	it('throws instead of deleting the simulated network records', async () => {
		const {promise, store} = build({fork: 'mainnet', chainId: 1}, true);

		await expect(promise).rejects.toThrow(/Refusing to reset on a fork run/);

		// the load bearing half: it refused BEFORE deleting, not after
		expect(store.deleteAll).not.toHaveBeenCalled();
		expect(Object.keys(store.files).sort()).toEqual(['.chain', 'MyContract.json']);
	});

	/** The message has to name the network whose records were at stake, since that is the point. */
	it('names the network being simulated', async () => {
		const {promise} = build({fork: 'mainnet', chainId: 1}, true);

		await expect(promise).rejects.toThrow(/'mainnet'/);
	});

	/**
	 * Ordering, pinned. The executor confirms the deletion before it loads deployments, so a
	 * refusal at the deletion site would ask the user to approve destroying their records and
	 * only then refuse. Nothing is asked at all.
	 */
	it('refuses before asking the user to confirm anything', async () => {
		const {promise, promptExecutor} = build({fork: 'mainnet', chainId: 1}, true);

		await expect(promise).rejects.toThrow();
		expect(promptExecutor.asked).toEqual([]);
	});

	/** Covers `--is-fork`, which attaches by rpc url and names the fork without a chain id. */
	it('refuses a fork named without a chain id', async () => {
		const {promise, store} = build({fork: 'mainnet'}, true);

		await expect(promise).rejects.toThrow(/Refusing to reset on a fork run/);
		expect(store.deleteAll).not.toHaveBeenCalled();
	});

	/** Nothing was loosened: a fork run that did not ask to reset still reads the records. */
	it('still loads the forked network records when no reset was asked for', async () => {
		const {promise, store} = build({fork: 'mainnet', chainId: 1}, false);

		const env = await promise;

		expect(env.name).toBe('mainnet');
		expect(store.deleteAll).not.toHaveBeenCalled();
		expect(env.deployments.MyContract.address).toBe(EXISTING_CONTRACT);
	});

	/** ...and nothing was tightened either: a reset that is not on a fork still deletes. */
	it('still resets a run that is not a fork', async () => {
		const {promise, store} = build('mainnet', true, 1);

		await promise;

		expect(store.deleteAll).toHaveBeenCalled();
		expect(Object.keys(store.files)).toEqual([]);
	});
});
