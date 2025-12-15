import path from 'node:path';
import fs from 'node:fs';
import type {DeploymentStoreFactory, UnknownDeployments} from '@rocketh/core';
import {loadDeployments} from './deployments.js';

export function createFSDeploymentStoreFactory(): DeploymentStoreFactory {
	function create({chainId, genesisHash}: {chainId: string; genesisHash?: string}) {
		function getDeploymentFolder(deploymentsFolder: string, environmentName: string): string {
			const folderPath = path.join(deploymentsFolder, environmentName);
			return folderPath;
		}

		function ensureDeploymentFolder(deploymentsFolder: string, environmentName: string) {
			const folderPath = getDeploymentFolder(deploymentsFolder, environmentName);
			fs.mkdirSync(folderPath, {recursive: true});
			// const chainIdFilepath = path.join(folderPath, '.chainId');
			// if (!fs.existsSync(chainIdFilepath)) {
			// 	fs.writeFileSync(chainIdFilepath, chainId);
			// }
			const chainFilepath = path.join(folderPath, '.chain');
			if (!fs.existsSync(chainFilepath)) {
				fs.writeFileSync(chainFilepath, JSON.stringify({chainId, genesisHash}));
			}
			return folderPath;
		}

		async function writeFile(
			deploymentsFolder: string,
			environmentName: string,
			name: string,
			content: string
		): Promise<void> {
			const folderPath = ensureDeploymentFolder(deploymentsFolder, environmentName);
			fs.writeFileSync(`${folderPath}/${name}`, content);
		}

		async function readFile(deploymentsFolder: string, environmentName: string, name: string): Promise<string> {
			const folderPath = ensureDeploymentFolder(deploymentsFolder, environmentName);
			return fs.readFileSync(`${folderPath}/${name}`, 'utf-8');
		}
		async function deleteFile(deploymentsFolder: string, environmentName: string, name: string): Promise<void> {
			const folderPath = ensureDeploymentFolder(deploymentsFolder, environmentName);
			fs.unlinkSync(`${folderPath}/${name}`);
		}

		async function loadDeploymentsAsync(
			deploymentsPath: string,
			networkName: string,
			onlyABIAndAddress?: boolean,
			expectedChain?: {chainId: string; genesisHash?: `0x${string}`; deleteDeploymentsIfDifferentGenesisHash?: boolean}
		): Promise<{
			deployments: UnknownDeployments;
			migrations: Record<string, number>;
			chainId?: string;
			genesisHash?: `0x${string}`;
		}> {
			return loadDeployments(deploymentsPath, networkName, onlyABIAndAddress, expectedChain);
		}
		return {
			loadDeployments: loadDeploymentsAsync,
			readFile,
			writeFile,
			deleteFile,
		};
	}
	return {create};
}
