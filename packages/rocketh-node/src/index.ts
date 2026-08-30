export {
	setupEnvironmentFromFiles,
	loadEnvironmentFromFiles,
	readAndResolveConfig,
	mergeChainConfig,
	loadAndExecuteDeploymentsFromFiles,
	loadDeploymentsFromFiles,
} from './executor/index.js';

export {setupDeployScripts} from 'rocketh';

// what the EXECUTE entry points above take: core's run parameters plus the one option only a
// filesystem runtime can honour
export type {NodeExecutionParams} from './execution-params.js';

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
