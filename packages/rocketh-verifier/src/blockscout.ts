import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import type {Abi, Deployment, UnknownDeployments} from '@rocketh/core/types';
import {BlockscoutOptions} from './index.js';

//https://eth.blockscout.com/api/v2/search?q=WETH
const defaultEndpoints: {[chainId: string]: string} = {
	'1': 'https://eth.blockscout.com/api/v2',
	'11155111': 'https://eth-sepolia.blockscout.com/api/v2',
	'5': 'https://eth-goerli.blockscout.com/api/v2',
	'10': 'https://optimism.blockscout.com/api/v2',
	'11155420': 'https://optimism-sepolia.blockscout.com/api/v2',
	'61': 'https://etc.blockscout.com/api/v2',
	'324': 'https://zksync.blockscout.com/api/v2',
	'8453': 'https://base.blockscout.com/api/v2',
	'84532': 'https://base-sepolia.blockscout.com/api/v2',
	'100': 'https://gnosis.blockscout.com/api/v2',
	'10200': 'https://gnosis-chiado.blockscout.com/api/v2',
	'17001': 'https://17001-explorer-api.quarry.linfra.xyz/api/v2', // probably temporary
};

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(...args: any[]) {
	console.log(...args);
}

function logError(...args: any[]) {
	console.log(chalk.red(...args));
}

function logInfo(...args: any[]) {
	console.log(chalk.yellow(...args));
}

function logSuccess(...args: any[]) {
	console.log(chalk.green(...args));
}

function ensureTrailingSlash(s: string): string {
	if (!s.endsWith('/')) {
		s = s + '/';
	}
	return s;
}

export async function submitSourcesToBlockscout(
	env: {
		deployments: UnknownDeployments;
		networkName: string;
		chainId: string;
		deploymentNames?: string[];
		minInterval?: number;
		logErrorOnFailure?: boolean;
	},
	config?: BlockscoutOptions
): Promise<void> {
	config = config || {type: 'blockscout'};
	const all = env.deployments;
	const url = config.endpoint
		? ensureTrailingSlash(config.endpoint)
		: ensureTrailingSlash(defaultEndpoints[env.chainId]);

	if (!url) {
		logError(`no endpoint provided and no default known for chainId ${env.chainId}`);
		return;
	}

	async function submit(name: string, deployment: Deployment<Abi>) {
		const {address, metadata} = deployment;

		try {
			const checkResponse = await fetch(`${url}smart-contracts/${address.toLowerCase()}`);
			const json = await checkResponse.json();
			if (json.is_verified) {
				log(`already verified: ${name} (${address}), skipping.`);
				return;
			}
		} catch (e) {
			logError(((e as any).response && JSON.stringify((e as any).response.data)) || e);
		}

		const metadataObj = JSON.parse(metadata);
		const compilationTarget = metadataObj.settings?.compilationTarget;

		let contractFilepath;
		let contractName;
		if (compilationTarget) {
			contractFilepath = Object.keys(compilationTarget)[0];
			contractName = compilationTarget[contractFilepath];
		}

		if (!contractFilepath || !contractName) {
			return logError(
				`Failed to extract contract fully qualified name from metadata.settings.compilationTarget for ${name}. Skipping.`
			);
		}

		const contractNamePath = `${contractFilepath}:${contractName}`;

		const formData = new FormData();
		formData.append('address_hash', address);
		formData.append('compiler_version', JSON.parse(metadata).compiler.version);
		formData.append('constructor_args', deployment.argsData);
		formData.append('autodetect_constructor_args', 'false');
		formData.append('contract_name', contractNamePath);

		const metadataBlob = new Blob([metadata], {
			type: 'application/json',
		});
		formData.append('files[0]', metadataBlob, 'metadata.json');

		try {
			const submissionResponse = await fetch(
				`${url}smart-contracts/${address.toLowerCase()}/verification/via/standard-input`,
				{body: formData, method: 'POST'}
			);
			const json = await submissionResponse.json();
			if (json.message === 'Smart-contract verification started') {
				logSuccess(` => contract ${name} verification has started`);
			} else {
				logError(` => contract ${name} might not have gone throyugh`, json);
			}
		} catch (e) {
			if (env?.logErrorOnFailure) {
				const failingMetadataFolder = path.join('failing_metadata', env.chainId);
				fs.ensureDirSync(failingMetadataFolder);
				fs.writeFileSync(path.join(failingMetadataFolder, `${name}_at_${address}.json`), metadata);
			}
			logError(((e as any).response && JSON.stringify((e as any).response.data)) || e);
		}
	}

	for (const name of env.deploymentNames ? env.deploymentNames : Object.keys(all)) {
		const deployment = all[name];

		if (!deployment.metadata) {
			logError(`Contract ${name} was deployed without saving metadata. Cannot submit to sourcify, skipping.`);
			return;
		}

		logInfo(`verifying ${name} (${deployment.address} on chain ${env.chainId}) ...`);

		// if (config?.version === 'v1') {
		// 	await submitV1(name, deployment);
		// } else {
		await submit(name, deployment);
		// }

		if (env.minInterval) {
			await sleep(env.minInterval);
		}
	}
}
