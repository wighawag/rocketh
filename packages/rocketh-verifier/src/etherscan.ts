/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import qs from 'qs';
import chalk from 'chalk';
import {matchAll} from './utils/match-all.js';
import {Environment, UnknownDeployments} from 'rocketh';
import {EtherscanOptions} from './index.js';

const defaultEndpoints: {[chainId: string]: string} = {
	'1': 'https://api.etherscan.io/api',
	'3': 'https://api-ropsten.etherscan.io/api',
	'4': 'https://api-rinkeby.etherscan.io/api',
	'5': 'https://api-goerli.etherscan.io/api',
	'10': 'https://api-optimistic.etherscan.io/api',
	'42': 'https://api-kovan.etherscan.io/api',
	'97': 'https://api-testnet.bscscan.com/api',
	'56': 'https://api.bscscan.com/api',
	'69': 'https://api-kovan-optimistic.etherscan.io/api',
	'70': 'https://api.hooscan.com/api',
	'77': 'https://blockscout.com/poa/sokol/api',
	'128': 'https://api.hecoinfo.com/api',
	'137': 'https://api.polygonscan.com/api',
	'250': 'https://api.ftmscan.com/api',
	'256': 'https://api-testnet.hecoinfo.com/api',
	'420': 'https://api-goerli-optimism.etherscan.io/api',
	'588': 'https://stardust-explorer.metis.io/api',
	'1088': 'https://andromeda-explorer.metis.io/api',
	'1285': 'https://api-moonriver.moonscan.io/api',
	'80001': 'https://api-testnet.polygonscan.com/api',
	'4002': 'https://api-testnet.ftmscan.com/api',
	'42161': 'https://api.arbiscan.io/api',
	'421611': 'https://api-testnet.arbiscan.io/api',
	'421613': 'https://api-goerli.arbiscan.io/api',
	'43113': 'https://api-testnet.snowtrace.io/api',
	'43114': 'https://api.snowtrace.io/api',
	'11155111': 'https://api-sepolia.etherscan.io/api',
};

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

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function writeRequestIfRequested(
	write: boolean,
	networkName: string,
	name: string,
	request: string,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	postData: any
) {
	if (write) {
		try {
			fs.mkdirSync('etherscan_requests');
		} catch (e) {}
		const folder = `etherscan_requests/${networkName}`;
		try {
			fs.mkdirSync(folder);
		} catch (e) {}
		fs.writeFileSync(`${folder}/${name}.formdata`, request);
		fs.writeFileSync(`${folder}/${name}.json`, JSON.stringify(postData));
		fs.writeFileSync(`${folder}/${name}_multi-source.json`, postData.sourceCode);
	}
}

function extractOneLicenseFromSourceFile(source: string): string | undefined {
	const licenses = extractLicenseFromSources(source);
	if (licenses.length === 0) {
		return undefined;
	}
	return licenses[0]; // TODO error out on multiple SPDX ?
}

function extractLicenseFromSources(metadata: string): string[] {
	const regex = /\/\/\s*\t*SPDX-License-Identifier:\s*\t*(.*?)[\s\\]/g;
	const matches = matchAll(metadata, regex).toArray();
	const licensesFound: {[license: string]: boolean} = {};
	const licenses = [];
	if (matches) {
		for (const match of matches) {
			if (!licensesFound[match]) {
				licensesFound[match] = true;
				licenses.push(match);
			}
		}
	}
	return licenses;
}

function getLicenseType(license: string): undefined | number {
	const licenseType = (() => {
		if (license === 'None') {
			return 1;
		}
		if (license === 'UNLICENSED') {
			return 2;
		}
		if (license === 'MIT') {
			return 3;
		}
		if (license === 'GPL-2.0') {
			return 4;
		}
		if (license === 'GPL-3.0') {
			return 5;
		}
		if (license === 'LGPL-2.1') {
			return 6;
		}
		if (license === 'LGPL-3.0') {
			return 7;
		}
		if (license === 'BSD-2-Clause') {
			return 8;
		}
		if (license === 'BSD-3-Clause') {
			return 9;
		}
		if (license === 'MPL-2.0') {
			return 10;
		}
		if (license === 'OSL-3.0') {
			return 11;
		}
		if (license === 'Apache-2.0') {
			return 12;
		}
		if (license === 'AGPL-3.0') {
			return 13;
		}
		if (license === 'BUSL-1.1') {
			return 14;
		}
	})();
	return licenseType;
}

export async function submitSourcesToEtherscan(
	env: {
		deployments: UnknownDeployments;
		networkName: string;
		chainId: string;
		deploymentNames?: string[];
		minInterval?: number;
		logErrorOnFailure?: boolean;
	},
	config?: EtherscanOptions
): Promise<void> {
	config = config || {type: 'etherscan'};
	const licenseOption = config.license;
	const forceLicense = config.forceLicense;
	const etherscanApiKey = config.apiKey;
	const all = env.deployments;
	const networkName = env.networkName;
	let endpoint = config.endpoint;
	if (!endpoint) {
		endpoint = defaultEndpoints[env.chainId];
		if (!endpoint) {
			return logError(`Network with chainId: ${env.chainId} not supported. Please specify the endpoint manually.`);
		}
	}

	async function submit(name: string) {
		const deployment = all[name];
		const {address, metadata: metadataString} = deployment;
		const abiResponse = await fetch(
			`${endpoint}?module=contract&action=getabi&address=${address}&apikey=${etherscanApiKey}`
		);
		const json = await abiResponse.json();
		let contractABI;
		if (json.status !== '0') {
			try {
				contractABI = JSON.parse(json.result);
			} catch (e) {
				logError(e);
				return;
			}
		}
		if (contractABI && contractABI !== '') {
			log(`already verified: ${name} (${address}), skipping.`);
			return;
		}

		if (!metadataString) {
			logError(`Contract ${name} was deployed without saving metadata. Cannot submit to etherscan, skipping.`);
			return;
		}
		const metadata = JSON.parse(metadataString);
		const compilationTarget = metadata.settings?.compilationTarget;

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

		const contractSourceFile = metadata.sources[contractFilepath].content;
		const sourceLicenseType = extractOneLicenseFromSourceFile(contractSourceFile);

		let license = licenseOption;
		if (!sourceLicenseType) {
			if (!license) {
				return logError(
					`no license speccified in the source code for ${name} (${contractNamePath}), Please use option --license <SPDX>`
				);
			}
		} else {
			if (license && license !== sourceLicenseType) {
				if (!forceLicense) {
					return logError(
						`mismatch for --license option (${licenseOption}) and the one specified in the source code for ${name}.\nLicenses found in source : ${sourceLicenseType}\nYou can use option --force-license to force option --license`
					);
				}
			} else {
				license = sourceLicenseType;
				if (!getLicenseType(license)) {
					return logError(
						`license :"${license}" found in source code for ${name} (${contractNamePath}) but this license is not supported by etherscan, list of supported license can be found here : https://etherscan.io/contract-license-types . This tool expect the SPDX id, except for "None" and "UNLICENSED"`
					);
				}
			}
		}

		const licenseType = getLicenseType(license);

		if (!licenseType) {
			return logError(
				`license :"${license}" not supported by etherscan, list of supported license can be found here : https://etherscan.io/contract-license-types . This tool expect the SPDX id, except for "None" and "UNLICENSED"`
			);
		}

		let solcInput: {
			language: string;
			settings: any;
			sources: Record<string, {content: string}>;
		};

		const settings = {...metadata.settings};
		delete settings.compilationTarget;
		solcInput = {
			language: metadata.language,
			settings,
			sources: {},
		};
		for (const sourcePath of Object.keys(metadata.sources)) {
			const source = metadata.sources[sourcePath];
			// only content as this fails otherwise
			solcInput.sources[sourcePath] = {
				content: source.content,
			};
		}

		// Adding Libraries ....
		if (deployment.libraries) {
			const settings = solcInput.settings;
			settings.libraries = settings.libraries || {};
			for (const libraryName of Object.keys(deployment.libraries)) {
				if (!settings.libraries[contractNamePath]) {
					settings.libraries[contractNamePath] = {};
				}
				settings.libraries[contractNamePath][libraryName] = deployment.libraries[libraryName];
			}
		}
		const solcInputString = JSON.stringify(solcInput);

		logInfo(`verifying ${name} (${address}) ...`);

		let constructorArguments: string | undefined;
		if (deployment.argsData) {
			constructorArguments = deployment.argsData.slice(2);
		} else {
			// TODO ?
			// logInfo(`no argsData found, falling back on args (hardhat-deploy v1)`);
			// if ((deployment as any).args) {
			// 	const constructorABI: {inputs: any[]} = deployment.abi.find(
			// 	  (v) => v.type === 'constructor'
			// 	);
			// 	if (constructorABI) {
			// 	  constructorArguements = encode
			// 		.encode(constructor.inputs, deployment.args)
			// 		.slice(2);
			// 	}
			//   } else {
			// 	logInfo(`no args found, assuming empty constructor...`);
			//   }
			logInfo(`no args found, assuming empty constructor...`);
		}

		const postData: {
			[fieldName: string]: string | number | void | undefined; // TODO type
		} = {
			apikey: etherscanApiKey,
			module: 'contract',
			action: 'verifysourcecode',
			contractaddress: address,
			sourceCode: solcInputString,
			codeformat: 'solidity-standard-json-input',
			contractname: contractNamePath,
			compilerversion: `v${metadata.compiler.version}`, // see http://etherscan.io/solcversions for list of support versions
			constructorArguements: constructorArguments, // note the spelling mistake by etherscan
			licenseType,
		};

		const formDataAsString = qs.stringify(postData);
		const data = new URLSearchParams();
		for (const entry of Object.entries(postData)) {
			if (entry[1]) {
				if (typeof entry[1] === 'number') {
					data.append(entry[0], entry[1].toString());
				} else {
					data.append(entry[0], entry[1]);
				}
			}
		}
		const submissionResponse = await fetch(`${endpoint}`, {
			method: 'POST',
			headers: {'content-type': 'application/x-www-form-urlencoded'},
			body: data,
		});
		const submissionJson = await submissionResponse.json();

		let guid: string;
		if (submissionJson.status === '1') {
			guid = submissionJson.result;
		} else {
			logError(
				`contract ${name} failed to submit : "${submissionJson.message}" : "${submissionJson.result}"`,
				submissionJson
			);
			writeRequestIfRequested(env?.logErrorOnFailure || false, networkName, name, formDataAsString, postData);
			return;
		}
		if (!guid) {
			logError(`contract submission for ${name} failed to return a guid`);
			writeRequestIfRequested(env?.logErrorOnFailure || false, networkName, name, formDataAsString, postData);
			return;
		}

		async function checkStatus(): Promise<string | undefined> {
			// TODO while loop and delay :
			const statusResponse = await fetch(
				`${endpoint}?apikey=${etherscanApiKey}&guid=${guid}&module=contract&action=checkverifystatus`
			);
			const json = await statusResponse.json();

			// blockscout seems to return status == 1 in case of failure
			// so we check string first
			if (json.result === 'Pending in queue') {
				return undefined;
			}
			if (json.result !== 'Fail - Unable to verify') {
				if (json.status === '1') {
					// console.log(statusData);
					return 'success';
				}
			}
			logError(`Failed to verify contract ${name}: ${json.message}, ${json.result}`);

			logError(
				JSON.stringify(
					{
						apikey: 'XXXXXX',
						module: 'contract',
						action: 'verifysourcecode',
						contractaddress: address,
						sourceCode: '...',
						codeformat: 'solidity-standard-json-input',
						contractname: contractNamePath,
						compilerversion: `v${metadata.compiler.version}`, // see http://etherscan.io/solcversions for list of support versions
						constructorArguements: constructorArguments, // note the spelling mistake by etherscan
						licenseType,
					},
					null,
					'  '
				)
			);
			// logError(JSON.stringify(postData, null, "  "));
			// logInfo(postData.sourceCode);
			return 'failure';
		}

		logInfo('waiting for result...');
		let result;
		while (!result) {
			await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
			result = await checkStatus();
		}

		if (result === 'success') {
			logSuccess(` => contract ${name} is now verified`);
		}

		if (result === 'failure') {
			writeRequestIfRequested(env?.logErrorOnFailure || false, networkName, name, formDataAsString, postData);
			logInfo('Etherscan failed to verify the source provided');
		} else {
			writeRequestIfRequested(env?.logErrorOnFailure || false, networkName, name, formDataAsString, postData);
		}
	}

	for (const name of env.deploymentNames ? env.deploymentNames : Object.keys(all)) {
		await submit(name);
		if (env.minInterval) {
			await sleep(env.minInterval);
		}
	}
}
