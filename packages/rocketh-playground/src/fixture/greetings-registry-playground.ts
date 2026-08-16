import type {PlaygroundDefinition} from '../core/playground.js';
import deployGreetingsRegistry, {extensions} from './deploy-greetings-registry.js';

/**
 * Test keys, and they are meant to be readable in the page source. This chain exists for the
 * lifetime of one run inside one browser tab and is reachable by nothing else, so there is
 * nothing here to protect. They are fixed rather than generated so the deployed addresses are
 * the same for every reader, which makes the docs reproducible.
 */
const DEPLOYER_KEY = '0x503f38a9c967ed597e47fe25643985f032b072db8075426a92110f82df48dfcb';
const ADMIN_KEY = '0x7e5bfb82febc4c2c8529167104271ceec190eafdca277314912eaabdb67c6e5f';

/**
 * Level 1 of the documentation playground: deploy a real upgradeable contract, in the reader's
 * browser, with no wallet, no node and no network.
 *
 * `environment` is `browser` rather than the tempting `memory`, because rocketh forces
 * `saveDeployments` off for `memory` / `hardhat` / `default` and the store would come back
 * empty. `createPlayground` refuses those three outright.
 */
export const greetingsRegistryPlayground: PlaygroundDefinition = {
	environment: 'browser',
	chainId: 31337,
	accounts: {
		deployer: DEPLOYER_KEY,
		admin: ADMIN_KEY,
	},
	extensions,
	modules: [{id: '001_deploy_greetings_registry', module: deployGreetingsRegistry}],
};
