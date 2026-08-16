/**
 * Tests for VFS persistence.
 *
 * The adapter (`load`/`save`) is injected, so everything here runs in node against
 * `createMemoryPersistence()`. That is the point of the seam: the durability LOGIC (when a
 * save is scheduled, what `flush` guarantees, what happens to a failed write) is tested
 * without a browser, leaving `createIndexedDBPersistence` a thin layer over the same contract.
 *
 * The reload proof is the important one: write through a store, then build a SECOND VFS from
 * the same storage and check the deployment is there. That is what "survives a page reload"
 * means, and it is what the previous no-op store could never do.
 */

import {describe, it, expect, vi} from 'vitest';
import {loadDeploymentsFromStore} from 'rocketh';
import {createIndexedDBPersistence, createMemoryPersistence, createPersistentVFS} from '../src/persistence.js';
import {createVFSDeploymentStore} from '../src/vfs-deployment-store.js';

function deploymentJSON(address: string) {
	return JSON.stringify({address, abi: [], bytecode: '0x', argsData: '0x'});
}

describe('@rocketh/web - createMemoryPersistence', () => {
	it('starts empty and round-trips a saved file map', async () => {
		const persistence = createMemoryPersistence();
		expect(await persistence.load()).toBeNull();

		await persistence.save({'a.json': '{}'});
		expect(await persistence.load()).toEqual({'a.json': '{}'});
	});

	it('copies on save, so later VFS mutations cannot alter what was stored', async () => {
		const persistence = createMemoryPersistence();
		const files = {'a.json': '{}'};
		await persistence.save(files);

		files['a.json'] = 'MUTATED';

		expect(await persistence.load()).toEqual({'a.json': '{}'});
	});
});

describe('@rocketh/web - createPersistentVFS', () => {
	it('loads what storage already holds', async () => {
		const persistence = createMemoryPersistence({'deployments/localhost/Foo.json': '{"address":"0x1"}'});

		const vfs = await createPersistentVFS({persistence});

		expect(vfs.paths()).toEqual(['deployments/localhost/Foo.json']);
		expect(vfs.hasFolder('deployments/localhost')).toBe(true);
	});

	it('uses `initial` only when storage is empty', async () => {
		const empty = createMemoryPersistence();
		const seeded = await createPersistentVFS({persistence: empty, initial: {'rocketh/config.ts': 'seed'}});
		expect(seeded.read('rocketh/config.ts')).toBe('seed');

		const occupied = createMemoryPersistence({'existing.json': '{}'});
		const loaded = await createPersistentVFS({persistence: occupied, initial: {'rocketh/config.ts': 'seed'}});
		expect(loaded.paths()).toEqual(['existing.json']);
	});

	it('persists writes, and flush resolves once they have landed', async () => {
		const persistence = createMemoryPersistence();
		const vfs = await createPersistentVFS({persistence});

		vfs.write('deployments/localhost/Foo.json', '{"address":"0x1"}');
		await vfs.flush();

		expect(await persistence.load()).toEqual({'deployments/localhost/Foo.json': '{"address":"0x1"}'});
	});

	it('persists deletions', async () => {
		const persistence = createMemoryPersistence({'deployments/localhost/Foo.json': '{}'});
		const vfs = await createPersistentVFS({persistence});

		vfs.removeFolder('deployments/localhost');
		await vfs.flush();

		expect(await persistence.load()).toEqual({});
	});

	it('coalesces a burst of writes into fewer saves', async () => {
		const persistence = createMemoryPersistence();
		const save = vi.spyOn(persistence, 'save');
		const vfs = await createPersistentVFS({persistence});

		vfs.write('a.json', '{}');
		vfs.write('b.json', '{}');
		vfs.write('c.json', '{}');
		await vfs.flush();

		// One scheduled save covers all three, and it still holds every file.
		expect(save).toHaveBeenCalledTimes(1);
		expect(await persistence.load()).toEqual({'a.json': '{}', 'b.json': '{}', 'c.json': '{}'});
	});

	it('reports a failed save even when nobody ever flushes', async () => {
		// The silent-data-loss case: writing to the VFS directly (no deployment store, so no
		// implicit flush) used to swallow the failure entirely.
		const persistence = createMemoryPersistence();
		vi.spyOn(persistence, 'save').mockRejectedValueOnce(new Error('QuotaExceededError'));
		const onSaveError = vi.fn();
		const vfs = await createPersistentVFS({persistence, onSaveError});

		vfs.write('a.json', '{}');
		await vfs.flush().catch(() => {});

		expect(onSaveError).toHaveBeenCalledTimes(1);
		expect((onSaveError.mock.calls[0][0] as Error).message).toBe('QuotaExceededError');
	});

	it('dispose stops persisting but leaves the VFS working in memory', async () => {
		const persistence = createMemoryPersistence();
		const save = vi.spyOn(persistence, 'save');
		const vfs = await createPersistentVFS({persistence});

		vfs.write('before.json', '{}');
		await vfs.flush();
		const savesBefore = save.mock.calls.length;

		vfs.dispose();
		vfs.write('after.json', '{}');
		await vfs.flush();

		expect(save).toHaveBeenCalledTimes(savesBefore);
		expect(await persistence.load()).toEqual({'before.json': '{}'});
		// In memory it is still a working VFS.
		expect(vfs.read('after.json')).toBe('{}');
	});

	it('surfaces a failed save through flush once, then recovers', async () => {
		const persistence = createMemoryPersistence();
		const failure = new Error('QuotaExceededError');
		const save = vi.spyOn(persistence, 'save').mockRejectedValueOnce(failure);
		// A handler, so the expected failure does not print through the test output.
		const vfs = await createPersistentVFS({persistence, onSaveError: () => {}});

		vfs.write('a.json', '{}');
		await expect(vfs.flush()).rejects.toThrow('QuotaExceededError');

		// The failure is not sticky: a later write saves normally.
		save.mockRestore();
		vfs.write('b.json', '{}');
		await expect(vfs.flush()).resolves.toBeUndefined();
		expect(await persistence.load()).toEqual({'a.json': '{}', 'b.json': '{}'});
	});
});

describe('@rocketh/web - a persisted deployment store', () => {
	it('makes deployments survive a reload', async () => {
		const persistence = createMemoryPersistence();

		// First "page load": deploy something.
		const firstVFS = await createPersistentVFS({persistence});
		const firstStore = createVFSDeploymentStore(firstVFS);
		await firstStore.writeFileWithChainInfo(
			{chainId: '31337', genesisHash: '0xabc'},
			'deployments',
			'localhost',
			'GreetingsRegistry.json',
			deploymentJSON('0x0000000000000000000000000000000000000001'),
		);

		// Second "page load": a brand new VFS and store over the same storage.
		const secondVFS = await createPersistentVFS({persistence});
		const secondStore = createVFSDeploymentStore(secondVFS);
		const loaded = await loadDeploymentsFromStore(secondStore, 'deployments', 'localhost');

		expect(Object.keys(loaded.deployments)).toEqual(['GreetingsRegistry']);
		expect(loaded.deployments.GreetingsRegistry.address).toBe('0x0000000000000000000000000000000000000001');
		expect(loaded.chainId).toBe('31337');
	});

	it('awaiting a store write is enough for durability (no explicit flush)', async () => {
		const persistence = createMemoryPersistence();
		const vfs = await createPersistentVFS({persistence});
		const store = createVFSDeploymentStore(vfs);

		await store.writeFile('deployments', 'localhost', 'Foo.json', '{}');

		// The store awaits vfs.flush() internally, so storage is already up to date.
		expect(await persistence.load()).toEqual({'deployments/localhost/Foo.json': '{}'});
	});
});

describe('@rocketh/web - createIndexedDBPersistence', () => {
	it('fails with an actionable message when IndexedDB is absent (node, SSR)', async () => {
		const persistence = createIndexedDBPersistence();
		await expect(persistence.load()).rejects.toThrow(/IndexedDB is not available/);
	});

	it('accepts an injected IDBFactory, so a Worker or a test can supply its own', async () => {
		const open = vi.fn(() => {
			throw new Error('opened');
		});
		const persistence = createIndexedDBPersistence({indexedDB: {open} as unknown as IDBFactory});

		await expect(persistence.load()).rejects.toThrow('opened');
		expect(open).toHaveBeenCalledWith('rocketh', 1);
	});
});
