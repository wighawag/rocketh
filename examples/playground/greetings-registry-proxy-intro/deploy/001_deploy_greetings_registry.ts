// deploy/001_deploy_greetings_registry.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	// the environment: the functions of your extensions, the named accounts, the network
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await deployViaProxy(
			'GreetingsRegistry',
			{account: deployer, artifact: artifacts.GreetingsRegistry, args: ['hello: ']},
			{owner: admin, execute: {init: {methodName: 'init', args: ['hello: ']}}},
		);
	},
	// tags select the script, dependencies run other scripts first
	{tags: ['GreetingsRegistry']},
);
