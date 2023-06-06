import path from 'node:path';
import fs from 'node:fs';
import {traverse} from '../utils/fs';
import {UnknownDeployments} from './types';

export function loadDeployments(
	deploymentsPath: string,
	subPath: string,
	onlyABIAndAddress?: boolean,
	expectedChainId?: string
): {deployments: UnknownDeployments; chainId?: string} {
	const deploymentsFound: UnknownDeployments = {};
	const deployPath = path.join(deploymentsPath, subPath);

	let filesStats;
	try {
		filesStats = traverse(deployPath, undefined, undefined, (name) => !name.startsWith('.') && name !== 'solcInputs');
	} catch (e) {
		// console.log('no folder at ' + deployPath);
		return {deployments: {}};
	}
	let chainId: string;
	if (filesStats.length > 0) {
		const chainIdFilepath = path.join(deployPath, '.chainId');
		if (fs.existsSync(chainIdFilepath)) {
			chainId = fs.readFileSync(chainIdFilepath).toString().trim();
		} else {
			throw new Error(`A .chainId' file is expected to be present in the deployment folder for network ${subPath}`);
		}

		if (expectedChainId) {
			if (expectedChainId !== chainId) {
				throw new Error(
					`Loading deployment in folder '${deployPath}' (with chainId: ${chainId}) for a different chainId (${expectedChainId})`
				);
			}
		}
	} else {
		return {deployments: {}};
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
		if (fileName.substring(fileName.length - 5) === '.json') {
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
	return {deployments: deploymentsFound, chainId};
}
