import type {DeploymentStore} from 'rocketh/types';

/**
 * A `DeploymentStore` that DISCARDS everything: writes go nowhere, reads come back empty.
 *
 * This was once the only store `@rocketh/web` had, which meant a browser deploy silently lost
 * whatever it saved. It is no longer the default (see `createVFSDeploymentStore`), and survives
 * as an explicit opt-out for the case where discarding is what you actually want: a read-only
 * environment, or a run that must leave no trace.
 *
 * It reports "nothing here" rather than throwing, deliberately differing from the fs-mirroring
 * semantics of the real stores. `loadDeploymentsFromStore` reads an empty `listFiles` as an
 * environment with no deployments, which is exactly what this store means.
 */
export function createEmptyDeploymentStore(): DeploymentStore {
	return {
		async writeFileWithChainInfo(): Promise<void> {},
		async writeFile(): Promise<void> {},
		async deleteFile(): Promise<void> {},
		async deleteAll(): Promise<void> {},
		async listFiles(): Promise<string[]> {
			return [];
		},
		async hasFile(): Promise<boolean> {
			return false;
		},
		async readFile(): Promise<string> {
			return '';
		},
	};
}
