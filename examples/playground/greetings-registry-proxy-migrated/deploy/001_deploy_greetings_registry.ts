import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async (env) => {
		const {deployer} = env.namedAccounts;
		const useProxy = !env.tags.live;

		await env.deployViaProxy(
			'GreetingsRegistry',
			{
				account: deployer,
				artifact: artifacts.GreetingsRegistry,
				args: ['2'],
			},
			{
				proxyDisabled: !useProxy,
				execute: 'postUpgrade',
			},
		);

		return !useProxy;
	},
	{
		tags: ['GreetingsRegistry'],
		id: 'deploy_greetings_registry',
	},
);
