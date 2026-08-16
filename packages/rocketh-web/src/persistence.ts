/**
 * Persistence for the deployment VFS.
 *
 * The adapter shape (`load` / `save`, `{db, store, key}` options) deliberately mirrors
 * `webevm`'s `createIndexedDBPersistence()`, so a browser app that persists BOTH
 * its chain state and its deployments configures them the same way.
 *
 * Persistence is a whole-snapshot concern rather than a per-file one: a deployment set is a
 * handful of small JSON files, so writing the map as one record is simpler than maintaining
 * per-key transactions, and it makes a partially-written set impossible.
 *
 * Because the adapter is injected, every behaviour here is testable outside a browser with
 * `createMemoryPersistence()`; the IndexedDB adapter stays a thin layer over that contract.
 */
import {createMemoryVFS, type VFS} from './vfs.js';

/** The file map a VFS round-trips through storage: path -> content. */
export type PersistedFiles = Record<string, string>;

export type VFSPersistence = {
	load(): Promise<PersistedFiles | null>;
	save(files: PersistedFiles): Promise<void>;
};

export interface IndexedDBPersistenceOptions {
	/**
	 * Database name. Defaults to `'rocketh'`, deliberately NOT shared with any other library's
	 * database: two openers of one name at different versions give whichever opened lower a
	 * `VersionError`. `webevm` defaults to `'webevm'`, so the two do not collide even though
	 * their adapter shapes match.
	 */
	db?: string;
	store?: string;
	key?: string;
	/** Injectable for tests or non-`window` scopes (a Worker). Defaults to the ambient `indexedDB`. */
	indexedDB?: IDBFactory;
}

export function createIndexedDBPersistence(opts: IndexedDBPersistenceOptions = {}): VFSPersistence {
	const dbName = opts.db ?? 'rocketh';
	const storeName = opts.store ?? 'deployments';
	const key = opts.key ?? 'vfs';
	let dbPromise: Promise<IDBDatabase> | undefined;

	function getFactory(): IDBFactory {
		const factory = opts.indexedDB ?? (typeof indexedDB !== 'undefined' ? indexedDB : undefined);
		if (!factory) {
			throw new Error(
				`IndexedDB is not available in this environment. ` +
					`Use createMemoryPersistence() (or no persistence at all) outside a browser.`,
			);
		}
		return factory;
	}

	function getDb(): Promise<IDBDatabase> {
		if (!dbPromise) {
			dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
				const req = getFactory().open(dbName, 1);
				req.onupgradeneeded = () => {
					const db = req.result;
					if (!db.objectStoreNames.contains(storeName)) {
						db.createObjectStore(storeName);
					}
				};
				req.onsuccess = () => resolve(req.result);
				req.onerror = () => reject(req.error);
			}).catch((err) => {
				// A FAILED open must not be cached, or one transient failure (another tab holding an
				// upgrade, a private-mode restriction) leaves the store permanently dead for the page
				// even after the condition clears. Forget it so the next call retries.
				dbPromise = undefined;
				throw err;
			});
		}
		return dbPromise;
	}

	return {
		async load(): Promise<PersistedFiles | null> {
			const db = await getDb();
			return new Promise((resolve, reject) => {
				const tx = db.transaction(storeName, 'readonly');
				const req = tx.objectStore(storeName).get(key);
				req.onsuccess = () => resolve((req.result as PersistedFiles) ?? null);
				req.onerror = () => reject(req.error);
			});
		},
		async save(files: PersistedFiles): Promise<void> {
			const db = await getDb();
			return new Promise((resolve, reject) => {
				const tx = db.transaction(storeName, 'readwrite');
				tx.objectStore(storeName).put(files, key);
				tx.oncomplete = () => resolve();
				tx.onerror = () => reject(tx.error);
			});
		},
	};
}

/** An in-memory adapter (for tests, SSR, or proving the round-trip). */
export function createMemoryPersistence(initial?: PersistedFiles | null): VFSPersistence {
	let stored: PersistedFiles | null = initial ?? null;
	return {
		async load() {
			return stored;
		},
		async save(files) {
			stored = {...files};
		},
	};
}

export type PersistentVFS = VFS & {
	/** Resolves once every change made so far has reached storage. */
	flush(): Promise<void>;
	/**
	 * Stop persisting. The VFS keeps working in memory; it simply no longer writes through.
	 * Without this the subscription (and through it this VFS, its files and the storage handle)
	 * lives as long as whatever it was built from, which for a page that builds one per tutorial
	 * step is a leak.
	 */
	dispose(): void;
};

export type CreatePersistentVFSOptions = {
	persistence: VFSPersistence;
	/** Seed files, used ONLY when storage holds nothing yet. */
	initial?: PersistedFiles;
	/**
	 * Called when a write-through fails (a full quota, a closed database).
	 *
	 * A save is scheduled by every mutation, but only a caller that `await`s `flush()` (which
	 * `createVFSDeploymentStore` does) ever learns it failed. Anyone writing to the VFS directly
	 * and not flushing would otherwise lose data in silence, so failures are ALWAYS reported
	 * here, defaulting to `console.error`. `flush()` still rethrows, so a failure can surface
	 * twice; that is deliberate, on the view that a lost write is worse reported twice than not
	 * at all. Pass a handler to route it somewhere else.
	 */
	onSaveError?: (error: unknown) => void;
};

/**
 * A VFS whose contents are loaded from storage on creation and written back on every change.
 *
 * Saves are coalesced: a deploy run that writes five files schedules one save per turn of the
 * microtask queue rather than five serialized transactions. `flush()` (which
 * `createVFSDeploymentStore` awaits after each mutation) still resolves only once the write
 * that covers your change has completed, so `await store.writeFile(...)` remains durable.
 */
export async function createPersistentVFS(options: CreatePersistentVFSOptions): Promise<PersistentVFS> {
	const {persistence} = options;
	const report =
		options.onSaveError ??
		((error: unknown) => console.error(`failed to persist the deployment VFS; the change is in memory only`, error));
	const loaded = await persistence.load();
	const vfs = createMemoryVFS(loaded ?? options.initial);

	let pending: Promise<void> = Promise.resolve();
	let scheduled = false;
	let failure: unknown;
	let disposed = false;

	function schedule() {
		if (scheduled || disposed) {
			return;
		}
		scheduled = true;
		pending = pending.then(async () => {
			scheduled = false;
			try {
				await persistence.save(vfs.snapshot());
			} catch (err) {
				// Reported immediately, because a caller who never flushes would otherwise lose the
				// write in silence. Also KEPT rather than rethrown into the chain, so one failure
				// does not poison every later flush: `flush()` surfaces it once and clears it.
				failure = err;
				report(err);
			}
		});
	}

	const unsubscribe = vfs.subscribe(() => schedule());

	async function flush(): Promise<void> {
		await pending;
		if (failure !== undefined) {
			const err = failure;
			failure = undefined;
			throw err;
		}
	}

	function dispose(): void {
		disposed = true;
		unsubscribe();
	}

	return {...vfs, flush, dispose};
}
