import type {PlaygroundDefinition} from '../core/playground.js';
import {deployV1, extensions, upgradeToV2, writeGreetingUnderV1, writeGreetingUnderV2} from './deploy-scripts.js';

/**
 * Test keys, and they are meant to be readable in the page source. This chain exists for the
 * lifetime of one tutorial inside one browser tab and is reachable by nothing else, so there is
 * nothing here to protect. They are fixed rather than generated so the deployed addresses are
 * the same for every reader, which makes the docs reproducible.
 */
const DEPLOYER_KEY = '0x503f38a9c967ed597e47fe25643985f032b072db8075426a92110f82df48dfcb';
const ADMIN_KEY = '0x7e5bfb82febc4c2c8529167104271ceec190eafdca277314912eaabdb67c6e5f';

/**
 * The documentation tutorial: deploy an upgradeable contract, find its bug, fix it by
 * upgrading, and see what survived.
 *
 * All four steps run against ONE chain and ONE deployment store, which is the only way the
 * upgrade means anything: step 3 has to find the proxy step 1 deployed.
 *
 * `environment` is `browser` rather than the tempting `memory`, because rocketh forces
 * `saveDeployments` off for `memory` / `hardhat` / `default` and the store would come back
 * empty. `createPlayground` refuses those three.
 */
export const greetingsRegistryPlayground: PlaygroundDefinition = {
	environment: 'browser',
	chainId: 31337,
	accounts: {
		deployer: DEPLOYER_KEY,
		admin: ADMIN_KEY,
	},
	extensions,
	steps: [
		{
			id: '001_deploy_v1',
			label: 'Deploy behind a proxy',
			description: 'Deploys GreetingsRegistry with a CREATE2 implementation and a proxy in front of it.',
			modules: [{id: '001_deploy_v1', module: deployV1}],
		},
		{
			id: '002_greeting_v1',
			label: 'Write a greeting',
			description: 'Sets a greeting and reads it back. Look closely at what comes back.',
			modules: [{id: '002_greeting_v1', module: writeGreetingUnderV1}],
		},
		{
			id: '003_upgrade_v2',
			label: 'Upgrade the implementation',
			description: 'Points the same proxy at a fixed implementation, and initialises it properly this time.',
			modules: [{id: '003_upgrade_v2', module: upgradeToV2}],
		},
		{
			id: '004_greeting_v2',
			label: 'Write another greeting',
			description: 'The new greeting is prefixed. The one from step 2 is not.',
			modules: [{id: '004_greeting_v2', module: writeGreetingUnderV2}],
		},
	],
};
