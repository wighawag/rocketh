import {ResolvedConfig, loadDeployments} from 'rocketh';
import {submitSourcesToEtherscan} from './etherscan';
import {submitSourcesToSourcify} from './sourcify';
import {submitSourcesToBlockscout} from './blockscout';

export type EtherscanOptions = {
	type: 'etherscan';
	endpoint?: string;
	apiKey?: string;
	license?: string;
	forceLicense?: boolean;
};

export type SourcifyOptions = {
	type: 'sourcify';
	endpoint?: string;
};

export type BlockscoutOptions = {
	type: 'blockscout';
	endpoint?: string;
	// version?: string;
};

export type VerificationOptions = {
	verifier: EtherscanOptions | SourcifyOptions | BlockscoutOptions;
	deploymentNames?: string[];
	minInterval?: number;
	logErrorOnFailure?: boolean;
};

export async function run(config: ResolvedConfig, options: VerificationOptions) {
	const {deployments, chainId} = loadDeployments(config.deployments, config.networkName, false);

	if (Object.keys(deployments).length === 0) {
		console.log(`the network ${config.networkName} has zero deployments`);
		process.exit();
	}

	if (!chainId) {
		console.error(`the network ${config.networkName} has no chainId recorded`);
		process.exit(1);
	}

	if (options.verifier.type === 'etherscan') {
		await submitSourcesToEtherscan(
			{
				chainId,
				deployments,
				networkName: config.networkName,
				deploymentNames: options.deploymentNames,
				minInterval: options.minInterval,
				logErrorOnFailure: options.logErrorOnFailure,
			},
			options.verifier
		);
	} else if (options.verifier.type === 'sourcify') {
		await submitSourcesToSourcify(
			{
				chainId,
				deployments,
				networkName: config.networkName,
				deploymentNames: options.deploymentNames,
				minInterval: options.minInterval,
				logErrorOnFailure: options.logErrorOnFailure,
			},
			options.verifier
		);
	} else if (options.verifier.type === 'blockscout') {
		await submitSourcesToBlockscout(
			{
				chainId,
				deployments,
				networkName: config.networkName,
				deploymentNames: options.deploymentNames,
				minInterval: options.minInterval,
				logErrorOnFailure: options.logErrorOnFailure,
			},
			options.verifier
		);
	}
}
