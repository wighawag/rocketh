import 'isomorphic-unfetch';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import {UnknownDeployments} from 'rocketh';
import {SourcifyOptions} from '.';

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
	const lastChar = s.substr(-1);
	if (lastChar != '/') {
		s = s + '/';
	}
	return s;
}

// const defaultEndpoint = 'https://server.verificationstaging.shardlabs.io/';
const defaultEndpoint = 'https://sourcify.dev/server/';

export async function submitSourcesToSourcify(
	env: {
		deployments: UnknownDeployments;
		networkName: string;
		chainId: string;
		deploymentNames?: string[];
		minInterval?: number;
		logErrorOnFailure?: boolean;
	},
	config?: SourcifyOptions
): Promise<void> {
	config = config || {type: 'sourcify'};
	const all = env.deployments;
	const url = config.endpoint ? ensureTrailingSlash(config.endpoint) : defaultEndpoint;

	async function submit(name: string) {
		const deployment = all[name];
		const {address, metadata: metadataString} = deployment;

		try {
			const checkResponse = await fetch(
				`${url}checkByAddresses?addresses=${address.toLowerCase()}&chainIds=${env.chainId}`
			);
			const json = await checkResponse.json();
			if (json[0].status === 'perfect') {
				log(`already verified: ${name} (${address}), skipping.`);
				return;
			}
		} catch (e) {
			logError(((e as any).response && JSON.stringify((e as any).response.data)) || e);
		}

		if (!metadataString) {
			logError(`Contract ${name} was deployed without saving metadata. Cannot submit to sourcify, skipping.`);
			return;
		}

		logInfo(`verifying ${name} (${address} on chain ${env.chainId}) ...`);

		const formData = new FormData();
		formData.append('address', address);
		formData.append('chain', env.chainId);
		const metadataBlob = new Blob([metadataString], {
			type: 'application/json',
		});
		formData.append('files', metadataBlob, 'metadata.json');

		try {
			const submissionResponse = await fetch(url, {body: formData, method: 'POST'});
			const json = await submissionResponse.json();
			if (json.result[0].status === 'perfect') {
				logSuccess(` => contract ${name} is now verified`);
			} else {
				logError(` => contract ${name} is not verified`);
			}
		} catch (e) {
			if (env?.logErrorOnFailure) {
				const failingMetadataFolder = path.join('failing_metadata', env.chainId);
				fs.ensureDirSync(failingMetadataFolder);
				fs.writeFileSync(path.join(failingMetadataFolder, `${name}_at_${address}.json`), metadataString);
			}
			logError(((e as any).response && JSON.stringify((e as any).response.data)) || e);
		}
	}

	for (const name of env.deploymentNames ? env.deploymentNames : Object.keys(all)) {
		await submit(name);
		if (env.minInterval) {
			await sleep(env.minInterval);
		}
	}
}
