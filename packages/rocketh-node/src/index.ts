export {
	setupEnvironmentFromFiles,
	loadEnvironmentFromFiles,
	readAndResolveConfig,
	mergeChainConfig,
	loadAndExecuteDeploymentsFromFiles,
	loadDeploymentsFromFiles,
} from './executor/index.js';

export {setupDeployScripts} from 'rocketh';

// used by hardhat-deploy
export {chainByCanonicalName} from './environment/chains.js';

export type * from '@rocketh/core';

export const packagesWithLogsEnabled = [
	'rocketh',
	'@rocketh/node',
	'@rocketh/deploy',
	'@rocketh/proxy',
	'@rocketh/diamond',
	'@rocketh/doc',
	'@rocketh/export',
	'@rocketh/read-execute',
	'@rocketh/signer',
	'@rocketh/router',
	'@rocketh/verifier',
];
