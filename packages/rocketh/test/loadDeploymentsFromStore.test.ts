import {describe, it, expect, vi} from 'vitest';

import {loadDeploymentsFromStore} from '../src/environment/index.js';
import type {DeploymentStore} from '@rocketh/core/types';

/**
 * In-memory DeploymentStore for tests. The same record is mutated by deleteAll/write/deleteFile
 * so tests can assert side effects.
 */
function makeStore(initial: Record<string, string>): {store: DeploymentStore; files: Record<string, string>} {
	const files: Record<string, string> = {...initial};
	const store: DeploymentStore = {
		listFiles: vi.fn(async (_folder, _env, filter) =>
			Object.keys(files).filter((name) => (filter ? filter(name) : true)),
		),
		deleteAll: vi.fn(async () => {
			for (const key of Object.keys(files)) delete files[key];
		}),
		hasFile: vi.fn(async (_folder, _env, name) => files[name] !== undefined),
		writeFile: vi.fn(async (_folder, _env, name, content) => {
			files[name] = content;
		}),
		writeFileWithChainInfo: vi.fn(async (_info, _folder, _env, name, content) => {
			files[name] = content;
		}),
		readFile: vi.fn(async (_folder, _env, name) => files[name]),
		deleteFile: vi.fn(async (_folder, _env, name) => {
			delete files[name];
		}),
	};
	return {store, files};
}

const STORED = '0x111111111111111111111111111111111111111111111111111111111111aaaa';
const EXPECTED = '0x222222222222222222222222222222222222222222222222222222222222bbbb';

function chainFile(chainId: string, genesisHash?: string): string {
	return JSON.stringify({chainId, genesisHash});
}

const DEPLOYMENT_FILE = JSON.stringify({address: '0xabc0000000000000000000000000000000000000', abi: []});

function filesWith(chainFileContent: string): Record<string, string> {
	return {'.chain': chainFileContent, 'MyContract.json': DEPLOYMENT_FILE};
}

describe('loadDeploymentsFromStore - genesis hash mismatch policy', () => {
	/**
	 * Ephemeral/dev chain (deleteDeploymentsIfDifferentGenesisHash: true): a recorded genesisHash
	 * that no longer matches means the chain was reset → auto-delete the stale deployments.
	 */
	it('deletes all deployments when genesisHash differs and delete flag is true', async () => {
		const {store} = makeStore(filesWith(chainFile('1', STORED)));
		const result = await loadDeploymentsFromStore(store, 'deployments', 'dev', false, {
			chainId: '1',
			genesisHash: EXPECTED,
			deleteDeploymentsIfDifferentGenesisHash: true,
		});
		expect(store.deleteAll).toHaveBeenCalledTimes(1);
		expect(result.deployments).toEqual({});
		expect(result.migrations).toEqual({});
	});

	/**
	 * Real chain (deleteDeploymentsIfDifferentGenesisHash: false / unset): a genesis mismatch is an
	 * error, never a silent wipe. rocketh must abort with a clear reason.
	 */
	it('throws (and does NOT delete) when genesisHash differs and delete flag is false', async () => {
		const {store} = makeStore(filesWith(chainFile('1', STORED)));
		await expect(
			loadDeploymentsFromStore(store, 'deployments', 'mainnet', false, {
				chainId: '1',
				genesisHash: EXPECTED,
				deleteDeploymentsIfDifferentGenesisHash: false,
			}),
		).rejects.toThrow(/genesisHash/);
		expect(store.deleteAll).not.toHaveBeenCalled();
	});

	it('throws by default when the delete flag is unset (non-dev default)', async () => {
		const {store} = makeStore(filesWith(chainFile('1', STORED)));
		await expect(
			loadDeploymentsFromStore(store, 'deployments', 'mainnet', false, {
				chainId: '1',
				genesisHash: EXPECTED,
			}),
		).rejects.toThrow(/genesisHash/);
		expect(store.deleteAll).not.toHaveBeenCalled();
	});

	/**
	 * Pruned node case: the current chain's genesis could not be fetched (genesisHash undefined),
	 * so the mismatch check is skipped entirely. Existing deployments are preserved — no delete,
	 * no throw. This is the fix for the "earliest" bug causing spurious wipes on pruned nodes.
	 */
	it('skips the check (no delete, no throw) when the expected genesisHash is undefined', async () => {
		const {store} = makeStore(filesWith(chainFile('1', STORED)));
		const result = await loadDeploymentsFromStore(store, 'deployments', 'mainnet', false, {
			chainId: '1',
			genesisHash: undefined,
			deleteDeploymentsIfDifferentGenesisHash: false,
		});
		expect(store.deleteAll).not.toHaveBeenCalled();
		expect(result.genesisHash).toBe(STORED);
		expect(result.deployments.MyContract).toBeDefined();
		expect((result.deployments.MyContract as {address: string}).address).toBe(
			'0xabc0000000000000000000000000000000000000',
		);
	});

	it('loads deployments unchanged when genesisHash matches (no delete, no throw)', async () => {
		const {store} = makeStore(filesWith(chainFile('1', STORED)));
		const result = await loadDeploymentsFromStore(store, 'deployments', 'mainnet', false, {
			chainId: '1',
			genesisHash: STORED,
			deleteDeploymentsIfDifferentGenesisHash: false,
		});
		expect(store.deleteAll).not.toHaveBeenCalled();
		expect(result.deployments.MyContract).toBeDefined();
	});

	/**
	 * Forks pass `expectedChain = undefined`, so no mismatch check runs at all.
	 */
	it('skips the check entirely when expectedChain is undefined (fork case)', async () => {
		const {store} = makeStore(filesWith(chainFile('1', STORED)));
		const result = await loadDeploymentsFromStore(store, 'deployments', 'fork', false, undefined);
		expect(store.deleteAll).not.toHaveBeenCalled();
		expect(result.deployments.MyContract).toBeDefined();
	});

	/**
	 * Regression guard: a chainId mismatch is still a hard error regardless of the genesis policy.
	 */
	it('throws on chainId mismatch regardless of the delete flag', async () => {
		const {store} = makeStore(filesWith(chainFile('1', STORED)));
		await expect(
			loadDeploymentsFromStore(store, 'deployments', 'mainnet', false, {
				chainId: '2',
				genesisHash: STORED,
				deleteDeploymentsIfDifferentGenesisHash: true,
			}),
		).rejects.toThrow(/chainId/);
		expect(store.deleteAll).not.toHaveBeenCalled();
	});
});
