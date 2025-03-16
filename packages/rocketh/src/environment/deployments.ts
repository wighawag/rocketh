import path from 'node:path';
import fs from 'node:fs';
import {traverse} from '../utils/fs.js';
import {UnknownDeployments} from './types.js';

export function loadDeployments(
	deploymentsPath: string,
	networkName: string,
	onlyABIAndAddress?: boolean,
	expectedChain?: {chainId: string; genesisHash?: `0x${string}`; deleteDeploymentsIfDifferentGenesisHash?: boolean}
): {
	deployments: UnknownDeployments;
	migrations: Record<string, number>;
	chainId?: string;
	genesisHash?: `0x${string}`;
} {
	const deploymentsFound: UnknownDeployments = {};
	const deployPath = path.join(deploymentsPath, networkName);

	let filesStats;
	try {
		filesStats = traverse(
			deployPath,
			undefined,
			undefined,
			(name) => !(name.startsWith('.') && name !== '.migrations.json') && name !== 'solcInputs'
		);
	} catch (e) {
		// console.log('no folder at ' + deployPath);
		return {deployments: {}, migrations: {}};
	}
	let chainId: string;
	let genesisHash: `0x${string}` | undefined;
	if (filesStats.length > 0) {
		const chainIdFilepath = path.join(deployPath, '.chainId');
		const chainFilepath = path.join(deployPath, '.chain');
		if (fs.existsSync(chainFilepath)) {
			const chainSTR = fs.readFileSync(chainFilepath, 'utf-8');
			const chainData = JSON.parse(chainSTR);
			chainId = chainData.chainId;
			genesisHash = chainData.genesisHash;
		} else if (fs.existsSync(chainIdFilepath)) {
			chainId = fs.readFileSync(chainIdFilepath, 'utf-8').trim();
		} else {
			throw new Error(
				`A '.chain' or '.chainId' file is expected to be present in the deployment folder for network ${networkName}`
			);
		}

		if (expectedChain) {
			if (expectedChain.chainId !== chainId) {
				throw new Error(
					`Loading deployment in folder '${deployPath}' (with chainId: ${chainId}) for a different chainId (${expectedChain.chainId})`
				);
			}

			if (genesisHash) {
				if (expectedChain.genesisHash && expectedChain.genesisHash !== genesisHash) {
					if (expectedChain.deleteDeploymentsIfDifferentGenesisHash) {
						// we delete the old folder

						fs.rmSync(deployPath, {recursive: true, force: true});
						return {deployments: {}, migrations: {}};
					} else {
						throw new Error(
							`Loading deployment in folder '${deployPath}' (with genesisHash: ${genesisHash}) for a different genesisHash (${expectedChain.genesisHash})`
						);
					}
				}
			} else {
				console.warn(
					`genesisHash not found in folder '${deployPath}' (with chainId: ${chainId}), writing .chain with expected one...`
				);
				fs.writeFileSync(
					chainFilepath,
					JSON.stringify({chainId: expectedChain.chainId, genesisHash: expectedChain.genesisHash})
				);
				try {
					fs.unlinkSync(chainIdFilepath);
				} catch {}
			}
		}
	} else {
		return {deployments: {}, migrations: {}};
	}

	let migrations: Record<string, number> = {};
	const migrationsFilepath = path.join(deployPath, '.migrations.json');
	if (fs.existsSync(migrationsFilepath)) {
		try {
			migrations = JSON.parse(fs.readFileSync(migrationsFilepath, 'utf-8'));
		} catch (err) {
			console.error(`failed to parse .migrations.json`);
		}
	}

	let fileNames = filesStats.map((a) => a.relativePath);
	fileNames = fileNames.sort((a, b) => {
		if (a < b) {
			return -1;
		}
		if (a > b) {
			return 1;
		}
		return 0;
	});

	for (const fileName of fileNames) {
		if (fileName.substring(fileName.length - 5) === '.json' && fileName !== '.migrations.json') {
			const deploymentFileName = path.join(deployPath, fileName);
			let deployment = JSON.parse(fs.readFileSync(deploymentFileName).toString());
			// truffleChainId argument:
			// if (!deployment.address && deployment.networks) {
			// 	if (truffleChainId && deployment.networks[truffleChainId]) {
			// 		// TRUFFLE support
			// 		const truffleDeployment = deployment as any; // TruffleDeployment;
			// 		deployment.address = truffleDeployment.networks[truffleChainId].address;
			// 		deployment.transactionHash = truffleDeployment.networks[truffleChainId].transactionHash;
			// 	}
			// }
			if (onlyABIAndAddress) {
				deployment = {
					address: deployment.address,
					abi: deployment.abi,
					linkedData: deployment.linkedData,
				};
			}
			const name = fileName.slice(0, fileName.length - 5);
			// console.log('fetching ' + deploymentFileName + '  for ' + name);

			deploymentsFound[name] = deployment;
		}
	}
	return {deployments: deploymentsFound, migrations, chainId, genesisHash};
}
