/**
 * A minimal in-memory file system.
 *
 * This exists because `DeploymentStore` (see `@rocketh/core` types) is a file-shaped
 * interface: rocketh's executor writes deployment JSON through it, and `@rocketh/node`
 * backs it with `node:fs`. In the browser there is no `fs`, so this module provides the
 * equivalent substrate: a flat path -> content map with the folder semantics the fs
 * implementation exposes (including WHICH operations throw, since callers depend on it).
 *
 * It is deliberately observable (`subscribe`) and snapshottable (`snapshot`/`restore`):
 * a UI can render the tree and watch files appear as a deploy script runs, and a stepped
 * tutorial can reset to a known state between steps.
 *
 * No DOM, no IndexedDB, no `node:*` imports, so it runs identically in a browser, a
 * worker and node (which is how it is tested).
 */

export type VFSChange =
	| {type: 'write'; path: string}
	| {type: 'delete'; path: string}
	| {type: 'delete-folder'; path: string}
	| {type: 'restore'};

export type VFSListener = (change: VFSChange) => void;

export type VFS = {
	/** Read a file. THROWS when absent, mirroring `fs.readFileSync`. */
	read(path: string): string;
	/** Read a file, or `undefined` when absent. The non-throwing counterpart to `read`. */
	tryRead(path: string): string | undefined;
	/** Write a file, creating ancestor folders (mirrors `mkdirSync({recursive: true})` + `writeFileSync`). */
	write(path: string, content: string): void;
	/** Delete a file. THROWS when absent, mirroring `fs.unlinkSync`. */
	remove(path: string): void;
	/** Delete a folder and everything under it. Never throws, mirroring `rmSync({force: true})`. */
	removeFolder(path: string): void;
	has(path: string): boolean;
	hasFolder(path: string): boolean;
	/** Names (not paths) of the direct children of a folder. THROWS when the folder does not exist, mirroring `fs.readdirSync`. */
	list(folder: string): string[];
	/** Every file path currently held, sorted. For rendering a whole tree. */
	paths(): string[];
	snapshot(): Record<string, string>;
	restore(snapshot: Record<string, string>): void;
	subscribe(listener: VFSListener): () => void;
	/**
	 * Present only on a persisted VFS (see `createPersistentVFS`). `createVFSDeploymentStore`
	 * awaits it after each mutation, so a store built on a persisted VFS makes
	 * `await store.writeFile(...)` durable while a plain in-memory one costs nothing.
	 */
	flush?(): Promise<void>;
};

/**
 * Normalize a path to the VFS's canonical form: no leading `./`, no leading or trailing
 * `/`, no empty segments. `.` and `''` both denote the root, which is the empty string.
 */
export function normalizePath(path: string): string {
	const segments: string[] = [];
	for (const segment of path.split('/')) {
		if (segment === '' || segment === '.') {
			continue;
		}
		segments.push(segment);
	}
	return segments.join('/');
}

export function joinPath(...parts: string[]): string {
	return normalizePath(parts.join('/'));
}

function parentOf(path: string): string {
	const index = path.lastIndexOf('/');
	return index === -1 ? '' : path.substring(0, index);
}

export function createMemoryVFS(initial?: Record<string, string>): VFS {
	const files = new Map<string, string>();
	// Folders are tracked separately from files so that an EMPTY folder can exist, which
	// is the difference `loadDeploymentsFromStore` depends on: it treats a throwing
	// `listFiles` as "never deployed here" and an empty array as "folder present but bare".
	const folders = new Set<string>(['']);
	const listeners = new Set<VFSListener>();

	function emit(change: VFSChange) {
		for (const listener of listeners) {
			listener(change);
		}
	}

	function ensureFolder(folder: string) {
		let current = folder;
		while (current !== '' && !folders.has(current)) {
			folders.add(current);
			current = parentOf(current);
		}
	}

	function write(path: string, content: string) {
		const normalized = normalizePath(path);
		if (normalized === '') {
			throw new Error(`cannot write to the VFS root`);
		}
		ensureFolder(parentOf(normalized));
		files.set(normalized, content);
		emit({type: 'write', path: normalized});
	}

	function tryRead(path: string): string | undefined {
		return files.get(normalizePath(path));
	}

	function read(path: string): string {
		const normalized = normalizePath(path);
		const content = files.get(normalized);
		if (content === undefined) {
			throw new Error(`ENOENT: no such file, open '${normalized}'`);
		}
		return content;
	}

	function remove(path: string) {
		const normalized = normalizePath(path);
		if (!files.has(normalized)) {
			throw new Error(`ENOENT: no such file, unlink '${normalized}'`);
		}
		files.delete(normalized);
		emit({type: 'delete', path: normalized});
	}

	function removeFolder(path: string) {
		const normalized = normalizePath(path);
		const prefix = normalized === '' ? '' : `${normalized}/`;
		for (const filePath of [...files.keys()]) {
			if (filePath === normalized || filePath.startsWith(prefix)) {
				files.delete(filePath);
			}
		}
		for (const folder of [...folders]) {
			if (folder !== '' && (folder === normalized || folder.startsWith(prefix))) {
				folders.delete(folder);
			}
		}
		emit({type: 'delete-folder', path: normalized});
	}

	function has(path: string): boolean {
		return files.has(normalizePath(path));
	}

	function hasFolder(path: string): boolean {
		return folders.has(normalizePath(path));
	}

	function list(folder: string): string[] {
		const normalized = normalizePath(folder);
		if (!folders.has(normalized)) {
			throw new Error(`ENOENT: no such directory, scandir '${normalized}'`);
		}
		const prefix = normalized === '' ? '' : `${normalized}/`;
		const names = new Set<string>();
		for (const filePath of files.keys()) {
			if (!filePath.startsWith(prefix)) {
				continue;
			}
			const rest = filePath.substring(prefix.length);
			const slash = rest.indexOf('/');
			names.add(slash === -1 ? rest : rest.substring(0, slash));
		}
		for (const subFolder of folders) {
			if (subFolder === normalized || !subFolder.startsWith(prefix)) {
				continue;
			}
			const rest = subFolder.substring(prefix.length);
			const slash = rest.indexOf('/');
			names.add(slash === -1 ? rest : rest.substring(0, slash));
		}
		return [...names].sort();
	}

	function paths(): string[] {
		return [...files.keys()].sort();
	}

	function snapshot(): Record<string, string> {
		return Object.fromEntries(files);
	}

	function restore(snapshotToRestore: Record<string, string>) {
		files.clear();
		folders.clear();
		folders.add('');
		for (const [path, content] of Object.entries(snapshotToRestore)) {
			const normalized = normalizePath(path);
			ensureFolder(parentOf(normalized));
			files.set(normalized, content);
		}
		emit({type: 'restore'});
	}

	function subscribe(listener: VFSListener): () => void {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}

	if (initial) {
		for (const [path, content] of Object.entries(initial)) {
			const normalized = normalizePath(path);
			ensureFolder(parentOf(normalized));
			files.set(normalized, content);
		}
	}

	return {
		read,
		tryRead,
		write,
		remove,
		removeFolder,
		has,
		hasFolder,
		list,
		paths,
		snapshot,
		restore,
		subscribe,
	};
}
