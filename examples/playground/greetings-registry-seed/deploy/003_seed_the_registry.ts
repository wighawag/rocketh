import {deployScript} from '../rocketh/deploy.js';

export default deployScript(
	async ({execute, get, namedAccounts}) => {
		const {deployer} = namedAccounts;
		const registry = get('GreetingsRegistry');

		// a genuine one-off: nothing on chain can be read back to tell whether it happened
		await execute(registry, {account: deployer, functionName: 'seed', args: [42n]});

		// everything this script had to do is done
		return true;
	},
	{tags: ['Seed'], id: 'seed_the_registry'},
);
