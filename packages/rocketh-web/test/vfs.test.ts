/**
 * Tests for the in-memory VFS that backs `createVFSDeploymentStore`.
 *
 * The behaviour pinned here is the fs-mirroring contract: which calls throw, and the
 * distinction between "folder absent" and "folder present but empty". Those are not
 * cosmetic. `loadDeploymentsFromStore` reads a throwing `listFiles` as "nothing was ever
 * deployed for this environment", so a VFS that silently returned `[]` would quietly
 * change how rocketh loads state.
 */

import {describe, it, expect, vi} from 'vitest';
import {createMemoryVFS, joinPath, normalizePath} from '../src/vfs.js';

describe('@rocketh/web - normalizePath / joinPath', () => {
	it('strips leading ./, leading and trailing slashes, and empty segments', () => {
		expect(normalizePath('./deployments/localhost/')).toBe('deployments/localhost');
		expect(normalizePath('/deployments//localhost')).toBe('deployments/localhost');
		expect(normalizePath('.')).toBe('');
		expect(normalizePath('')).toBe('');
	});

	it('joins parts into a normalized path', () => {
		expect(joinPath('deployments', 'localhost', 'Foo.json')).toBe('deployments/localhost/Foo.json');
		expect(joinPath('./deployments/', '/localhost/', 'Foo.json')).toBe('deployments/localhost/Foo.json');
	});
});

describe('@rocketh/web - createMemoryVFS', () => {
	it('writes and reads a file, creating ancestor folders', () => {
		const vfs = createMemoryVFS();
		vfs.write('deployments/localhost/Foo.json', '{"address":"0x1"}');

		expect(vfs.read('deployments/localhost/Foo.json')).toBe('{"address":"0x1"}');
		expect(vfs.has('deployments/localhost/Foo.json')).toBe(true);
		expect(vfs.hasFolder('deployments/localhost')).toBe(true);
		expect(vfs.hasFolder('deployments')).toBe(true);
	});

	it('read throws for a missing file, tryRead returns undefined', () => {
		const vfs = createMemoryVFS();
		expect(() => vfs.read('nope.json')).toThrow(/no such file/);
		expect(vfs.tryRead('nope.json')).toBeUndefined();
	});

	it('remove throws for a missing file, mirroring unlinkSync', () => {
		const vfs = createMemoryVFS();
		expect(() => vfs.remove('nope.json')).toThrow(/no such file/);
	});

	it('list throws for a missing folder but returns [] for an existing empty one', () => {
		const vfs = createMemoryVFS();
		expect(() => vfs.list('deployments/localhost')).toThrow(/no such directory/);

		vfs.write('deployments/localhost/Foo.json', '{}');
		vfs.remove('deployments/localhost/Foo.json');

		// The folder outlives the file it was created for, exactly as on a real fs.
		expect(vfs.list('deployments/localhost')).toEqual([]);
	});

	it('list returns direct children only, folders included, sorted', () => {
		const vfs = createMemoryVFS();
		vfs.write('deployments/localhost/Foo.json', '{}');
		vfs.write('deployments/localhost/Bar.json', '{}');
		vfs.write('deployments/localhost/solcInputs/input.json', '{}');

		expect(vfs.list('deployments/localhost')).toEqual(['Bar.json', 'Foo.json', 'solcInputs']);
	});

	it('removeFolder deletes descendants and never throws for a missing folder', () => {
		const vfs = createMemoryVFS();
		vfs.write('deployments/localhost/Foo.json', '{}');
		vfs.write('deployments/localhost/solcInputs/input.json', '{}');
		vfs.write('deployments/sepolia/Foo.json', '{}');

		vfs.removeFolder('deployments/localhost');

		expect(vfs.hasFolder('deployments/localhost')).toBe(false);
		expect(vfs.has('deployments/localhost/solcInputs/input.json')).toBe(false);
		// A sibling environment is untouched.
		expect(vfs.has('deployments/sepolia/Foo.json')).toBe(true);
		expect(() => vfs.removeFolder('deployments/never-existed')).not.toThrow();
	});

	it('paths lists every file, sorted, for rendering a tree', () => {
		const vfs = createMemoryVFS();
		vfs.write('b.json', '{}');
		vfs.write('a/c.json', '{}');

		expect(vfs.paths()).toEqual(['a/c.json', 'b.json']);
	});

	it('notifies subscribers of writes and deletes, and stops after unsubscribe', () => {
		const vfs = createMemoryVFS();
		const listener = vi.fn();
		const unsubscribe = vfs.subscribe(listener);

		vfs.write('deployments/localhost/Foo.json', '{}');
		vfs.remove('deployments/localhost/Foo.json');
		vfs.removeFolder('deployments');

		expect(listener.mock.calls.map(([change]) => change)).toEqual([
			{type: 'write', path: 'deployments/localhost/Foo.json'},
			{type: 'delete', path: 'deployments/localhost/Foo.json'},
			{type: 'delete-folder', path: 'deployments'},
		]);

		unsubscribe();
		vfs.write('after.json', '{}');
		expect(listener).toHaveBeenCalledTimes(3);
	});

	it('snapshot and restore round-trip, which is how a stepped tutorial resets', () => {
		const vfs = createMemoryVFS();
		vfs.write('deployments/localhost/Foo.json', '{"address":"0x1"}');
		const snapshot = vfs.snapshot();

		vfs.write('deployments/localhost/Bar.json', '{}');
		vfs.remove('deployments/localhost/Foo.json');

		vfs.restore(snapshot);

		expect(vfs.paths()).toEqual(['deployments/localhost/Foo.json']);
		expect(vfs.read('deployments/localhost/Foo.json')).toBe('{"address":"0x1"}');
		// Folders are rebuilt from the restored paths.
		expect(vfs.hasFolder('deployments/localhost')).toBe(true);
	});

	it('accepts an initial file set, which is how a tutorial step seeds a project', () => {
		const vfs = createMemoryVFS({'./rocketh/config.ts': 'export const config = {};'});

		expect(vfs.paths()).toEqual(['rocketh/config.ts']);
		expect(vfs.read('rocketh/config.ts')).toBe('export const config = {};');
	});

	it('refuses a write to the root', () => {
		const vfs = createMemoryVFS();
		expect(() => vfs.write('.', 'content')).toThrow(/root/);
	});
});
