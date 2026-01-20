export {
	setupDeployScripts,
	loadEnvironment,
	resolveConfig,
	resolveExecutionParams,
	getChainIdForEnvironment,
	getEnvironmentName,
	createExecutor,
} from './executor/index.js';
export {createEnvironment, loadDeployments} from './environment/index.js';

// used by hardhat-deploy and instead of having hardhat-deploy depends on @rocketh/core we export it here as well
export {enhanceEnvIfNeeded} from '@rocketh/core/environment';

export {
	getChainConfigFromUserConfigAndDefaultChainInfo,
	chainByCanonicalName,
	getDefaultChainInfoByName,
	getDefaultChainInfoFromChainId,
} from './environment/chains.js';
