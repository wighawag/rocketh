import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await deployViaProxy(
			'GreetingsRegistry',
			{
				account: deployer,
				artifact: artifacts.GreetingsRegistry,
				args: ['hello: '],
			},
			{
				owner: admin,
				execute: {init: {methodName: 'init', args: ['hello: ']}},
			},
		);
	},
	{tags: ['GreetingsRegistry', 'GreetingsRegistry_deploy']},
);
