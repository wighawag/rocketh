import type {DeploymentStore} from 'rocketh/types';

export function createEmptyDeploymentStore(): DeploymentStore {
	// function getFolder(deploymentsFolder: string, environmentName: string) {
	// 	return path.join(deploymentsFolder, environmentName);
	// }
	// function getFile(deploymentsFolder: string, environmentName: string, name: string) {
	// 	return path.join(deploymentsFolder, environmentName, name);
	// }

	// async function ensureChainInfoRecorded(
	// 	deploymentsFolder: string,
	// 	environmentName: string,
	// 	chainId: string,
	// 	genesisHash?: string
	// ) {
	// 	if (!(await hasFile(deploymentsFolder, environmentName, '.chain'))) {
	// 		await writeFile(
	// 			deploymentsFolder,
	// 			environmentName,
	// 			'.chain',
	// 			JSON.stringify({ chainId, genesisHash })
	// 		);
	// 	}
	// }

	async function writeFileWithChainInfo(
		chaininfo: {chainId: string; genesisHash?: string},
		deploymentsFolder: string,
		environmentName: string,
		name: string,
		content: string
	): Promise<void> {
		// await ensureChainInfoRecorded(
		// 	deploymentsFolder,
		// 	environmentName,
		// 	chaininfo.chainId,
		// 	chaininfo.genesisHash
		// );
		// fs.mkdirSync(getFolder(deploymentsFolder, environmentName), { recursive: true });
		// fs.writeFileSync(getFile(deploymentsFolder, environmentName, name), content);
	}

	async function writeFile(
		deploymentsFolder: string,
		environmentName: string,
		name: string,
		content: string
	): Promise<void> {
		// fs.mkdirSync(getFolder(deploymentsFolder, environmentName), { recursive: true });
		// fs.writeFileSync(getFile(deploymentsFolder, environmentName, name), content);
	}

	async function readFile(deploymentsFolder: string, environmentName: string, name: string): Promise<string> {
		// return fs.readFileSync(getFile(deploymentsFolder, environmentName, name), 'utf-8');
		return '';
	}
	async function deleteFile(deploymentsFolder: string, environmentName: string, name: string): Promise<void> {
		// fs.unlinkSync(getFile(deploymentsFolder, environmentName, name));
	}

	async function listFiles(deploymentsFolder: string, environmentName: string): Promise<string[]> {
		// return fs.readdirSync(getFolder(deploymentsFolder, environmentName));
		return [];
	}
	async function hasFile(deploymentsFolder: string, environmentName: string, name: string): Promise<boolean> {
		// return fs.existsSync(getFile(deploymentsFolder, environmentName, name));
		return false;
	}
	async function deleteAll(deploymentsFolder: string, environmentName: string): Promise<void> {
		// fs.rmSync(getFolder(deploymentsFolder, environmentName), { recursive: true, force: true });
	}

	return {
		writeFileWithChainInfo,
		listFiles,
		hasFile,
		deleteAll,
		readFile,
		writeFile,
		deleteFile,
	};
}
