// deploy/01_registry.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await deploy('Registry', {account: deployer, artifact: artifacts.Registry, args: [admin]});
	},
	{tags: ['Registry']},
);
