import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, deployViaRouter, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		const config = {commitPhaseDuration: 82800n, revealPhaseDuration: 3600n};

		const routes = [
			{name: 'Getters', artifact: artifacts.GameGetters, args: [config]},
			{name: 'Commit', artifact: artifacts.GameCommit, args: [config]},
			{name: 'Reveal', artifact: artifacts.GameReveal, args: [config]},
		];

		await deployViaProxy(
			'Game',
			{
				account: deployer,
				// the implementation is a router over the routes above
				artifact: (name, {account}) => deployViaRouter(name, {account}, routes),
			},
			{owner: admin},
		);
	},
	{tags: ['Game', 'Game_deploy']},
);
