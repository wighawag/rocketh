import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import {Abi, Deployment, UnknownDeployments} from 'rocketh';
import {BlockscoutOptions} from '.';

//https://eth.blockscout.com/api/v2/search?q=WETH
const defaultEndpoints: {[chainId: string]: string} = {
	'1': 'https://eth.blockscout.com/',
	'11155111': 'https://eth-sepolia.blockscout.com/',
	'5': 'https://eth-goerli.blockscout.com/',
	'10': 'https://optimism.blockscout.com/',
	'11155420': 'https://optimism-sepolia.blockscout.com/',
	'61': 'https://etc.blockscout.com/',
	'324': 'https://zksync.blockscout.com/',
	'8453': 'https://base.blockscout.com/',
	'84532': 'https://base-sepolia.blockscout.com/',
	'100': 'https://gnosis.blockscout.com/',
	'10200': 'https://gnosis-chiado.blockscout.com/',
	'17001': 'https://17001-explorer-api.quarry.linfra.xyz', // probably temporary
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

	// async function submitV1(name: string, deployment: Deployment<Abi>) {
	// 	const {address, metadata} = deployment;

	// 	const apiEndPoint = `${url}api/v1/solidity/verify/standard-json`;

	// 	const data = {
	// 		creation_bytecode: deployment.bytecode + deployment.argsData.slice(2),
	// 		compiler_version: JSON.parse(metadata).compiler.version,
	// 		input: metadata,
	// 	};

	// 	try {
	// 		console.log(`trying at ${apiEndPoint}`);
	// 		const submissionResponse = await fetch(apiEndPoint, {body: JSON.stringify(data), method: 'POST'});
	// 		const json = await submissionResponse.json();
	// 		console.log(json);
	// 		if (json.result[0].status === 'perfect') {
	// 			logSuccess(` => contract ${name} is now verified`);
	// 		} else {
	// 			logError(` => contract ${name} is not verified`);
	// 		}
	// 	} catch (e) {
	// 		if (env?.logErrorOnFailure) {
	// 			const failingMetadataFolder = path.join('failing_metadata', env.chainId);
	// 			fs.ensureDirSync(failingMetadataFolder);
	// 			fs.writeFileSync(path.join(failingMetadataFolder, `${name}_at_${address}.json`), metadata);
	// 		}
	// 		logError(((e as any).response && JSON.stringify((e as any).response.data)) || e);
	// 	}
	// }

	async function submit(name: string, deployment: Deployment<Abi>) {
		const {address, metadata} = deployment;

		try {
			const checkResponse = await fetch(`${url}api/v2/smart-contracts/${address.toLowerCase()}`);
			const json = await checkResponse.json();
			if (json.is_verified) {
				log(`already verified: ${name} (${address}), skipping.`);
				return;
			}
		} catch (e) {
			logError(((e as any).response && JSON.stringify((e as any).response.data)) || e);
		}

		const formData = new FormData();
		formData.append('address_hash', address);
		formData.append('compiler_version', JSON.parse(metadata).compiler.version);
		const metadataBlob = new Blob([metadata], {
			type: 'application/json',
		});
		formData.append('files[0]', metadataBlob, 'metadata.json');

		try {
			const submissionResponse = await fetch(
				`${url}api/v2/smart-contracts/${address.toLowerCase()}/verification/via/standard-input`,
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
