import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, execute, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		const registry = await deploy('GreetingsRegistry', {
			account: deployer,
			artifact: artifacts.GreetingsRegistry,
			args: [''],
		});

		// only on the run that actually deployed it
		if (registry.newlyDeployed) {
			await execute(registry, {account: deployer, functionName: 'setMessage', args: ['hello']});
		}
	},
	{tags: ['GreetingsRegistry', 'GreetingsRegistry_deploy']},
);
