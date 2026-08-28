/**
 * The hardhat-deploy fork path, unchanged.
 *
 * `HARDHAT_FORK=mainnet` is how a fork run is started today, and the plugin turns it into the
 * fork input it has always built. This test pins BOTH halves: the plugin still constructs exactly
 * `{fork: '<network>'}`, and handing that same input to core now yields a descriptor NAMING the
 * forked network, with the deployment records of that network still loading although the node
 * reports 31337. In other words the plugin needed no edit to gain the new behaviour.
 */

import {describe, it, expect, afterEach, vi} from 'vitest';
import type {DeploymentStore, PromptExecutor, UserConfig} from 'rocketh/types';

import {generateForkConfig} from '../src/helpers.js';
import {loadEnvironmentFromStore} from 'rocketh';

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

const promptExecutor: PromptExecutor = {
	async prompt() {
		return {proceed: true};
	},
	exit() {},
};

const config: UserConfig = {accounts: {deployer: ACCOUNT}, defaultPollingInterval: 0.001};

afterEach(() => {
	delete process.env.HARDHAT_FORK;
});

describe('hardhat-deploy fork runs', () => {
	it('still builds exactly the fork input it always built', async () => {
		process.env.HARDHAT_FORK = 'mainnet';
		const {environment, isFork} = await generateForkConfig({hre: {} as any, connection: hardhatForkConnection()});
		expect(environment).toEqual({fork: 'mainnet'});
		expect(isFork).toBe(true);
	});

	it('passes the environment NAME through untouched when there is no fork', async () => {
		const {environment, isFork} = await generateForkConfig({hre: {} as any, connection: hardhatForkConnection()});
		expect(environment).toBe('fork');
		expect(isFork).toBe(false);
	});

	it('gets the descriptor for free, and still reads the forked network records', async () => {
		process.env.HARDHAT_FORK = 'mainnet';
		const {environment, provider} = await generateForkConfig({
			hre: {} as any,
			connection: hardhatForkConnection(),
		});

		const env = await loadEnvironmentFromStore(
			config,
			{provider, environment, saveDeployments: false, promptExecutor},
			mainnetRecords(),
		);

		expect(env.network.fork?.networkName).toBe('mainnet');
		// nothing declared the simulated chain id, so the descriptor claims none rather than
		// borrowing the 31337 this hardhat node reports
		expect(env.network.fork?.chainId).toBeUndefined();
		// the property the whole feature exists for: mainnet's records, on a node that is not mainnet
		expect(env.deployments['MyContract'].address).toBe(CONTRACT_ADDRESS);
	});
});
