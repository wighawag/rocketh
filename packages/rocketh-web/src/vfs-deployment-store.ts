import type {DeploymentStore} from 'rocketh/types';
import {createMemoryVFS, joinPath, type VFS} from './vfs.js';
import {
	createIndexedDBPersistence,
	createPersistentVFS,
	type IndexedDBPersistenceOptions,
	type PersistedFiles,
} from './persistence.js';

/**
 * A real `DeploymentStore` backed by an in-memory file system.
 *
 * This is the browser counterpart of `@rocketh/node`'s `createFSDeploymentStore()`, and it
 * mirrors that implementation's semantics deliberately, including which calls THROW:
 *
 * - `readFile` / `deleteFile` throw when the file is absent (`readFileSync` / `unlinkSync`).
 * - `listFiles` throws when the folder is absent (`readdirSync`).
 * - `deleteAll` never throws (`rmSync({force: true})`).
 * - `writeFile` creates ancestor folders (`mkdirSync({recursive: true})`).
 *
 * The throwing behaviour is not incidental. `loadDeploymentsFromStore` wraps its
 * `listFiles` call in a try/catch and reads a throw as "nothing was ever deployed for this
 * environment" (packages/rocketh/src/environment/index.ts). A store that returned `[]`
 * instead would still work today, but it erases the distinction between "no folder" and
 * "empty folder", so this keeps it.
 *
 * Pass the `vfs` in when the caller wants to observe or render it (a docs playground
 * watching `deployments/<env>/Foo.json` appear as a deploy script runs), or to make the
 * store durable by handing it a `createPersistentVFS()`; omit it for a private one.
 */
export function createVFSDeploymentStore(vfs: VFS = createMemoryVFS()): DeploymentStore & {vfs: VFS} {
	function getFolder(deploymentsFolder: string, environmentName: string): string {
		return joinPath(deploymentsFolder, environmentName);
	}
	function getFile(deploymentsFolder: string, environmentName: string, name: string): string {
		return joinPath(deploymentsFolder, environmentName, name);
	}

	async function ensureChainInfoRecorded(
		deploymentsFolder: string,
		environmentName: string,
		chainId: string,
		genesisHash?: string,
	): Promise<void> {
		if (!(await hasFile(deploymentsFolder, environmentName, '.chain'))) {
			await writeFile(deploymentsFolder, environmentName, '.chain', JSON.stringify({chainId, genesisHash}));
		}
	}

	async function writeFileWithChainInfo(
		chaininfo: {chainId: string; genesisHash?: string},
		deploymentsFolder: string,
		environmentName: string,
		name: string,
		content: string,
	): Promise<void> {
		await ensureChainInfoRecorded(deploymentsFolder, environmentName, chaininfo.chainId, chaininfo.genesisHash);
		await writeFile(deploymentsFolder, environmentName, name, content);
	}

	async function writeFile(
		deploymentsFolder: string,
		environmentName: string,
		name: string,
		content: string,
	): Promise<void> {
		vfs.write(getFile(deploymentsFolder, environmentName, name), content);
		await vfs.flush?.();
	}

	async function readFile(deploymentsFolder: string, environmentName: string, name: string): Promise<string> {
		return vfs.read(getFile(deploymentsFolder, environmentName, name));
	}

	async function deleteFile(deploymentsFolder: string, environmentName: string, name: string): Promise<void> {
		vfs.remove(getFile(deploymentsFolder, environmentName, name));
		await vfs.flush?.();
	}

	async function listFiles(
		deploymentsFolder: string,
		environmentName: string,
		filter?: (name: string) => boolean,
	): Promise<string[]> {
		const names = vfs.list(getFolder(deploymentsFolder, environmentName));
		return filter ? names.filter(filter) : names;
	}

	async function hasFile(deploymentsFolder: string, environmentName: string, name: string): Promise<boolean> {
		return vfs.has(getFile(deploymentsFolder, environmentName, name));
	}

	async function deleteAll(deploymentsFolder: string, environmentName: string): Promise<void> {
		vfs.removeFolder(getFolder(deploymentsFolder, environmentName));
		await vfs.flush?.();
	}

	return {
		writeFileWithChainInfo,
		listFiles,
		hasFile,
		deleteAll,
		readFile,
		writeFile,
		deleteFile,
		vfs,
	};
}

export type IndexedDBDeploymentStoreOptions = IndexedDBPersistenceOptions & {
	/** Seed files, used ONLY the first time (when IndexedDB holds nothing yet). */
	initial?: PersistedFiles;
};

/**
 * A `DeploymentStore` whose contents survive a page reload.
 *
 * Async because it loads what IndexedDB already holds before returning, so the environment
 * you then build sees previous deployments rather than racing them in.
 *
 * ```ts
 * const store = await createIndexedDBDeploymentStore();
 * const {loadAndExecuteDeploymentsFromModules} = setupEnvironment(config, extensions, {deploymentStore: store});
 * ```
 */
export async function createIndexedDBDeploymentStore(
	options: IndexedDBDeploymentStoreOptions = {},
): Promise<DeploymentStore & {vfs: VFS}> {
	const {initial, ...persistenceOptions} = options;
	const vfs = await createPersistentVFS({
		persistence: createIndexedDBPersistence(persistenceOptions),
		initial,
	});
	return createVFSDeploymentStore(vfs);
}
