import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, viem, namedAccounts}) => {
		const {deployer} = namedAccounts;

		const deployment = await deploy('GreetingsRegistry', {
			account: deployer,
			artifact: artifacts.GreetingsRegistry,
			args: [''],
		});

		// typed from the deployment
		const registry = viem.getContract(deployment);
		const message = await registry.read.messages([deployer]);

		// typed from the generic
		const sameRegistry = viem.getContract<typeof artifacts.GreetingsRegistry.abi>('GreetingsRegistry');
	},
	{tags: ['GreetingsRegistry']},
);
