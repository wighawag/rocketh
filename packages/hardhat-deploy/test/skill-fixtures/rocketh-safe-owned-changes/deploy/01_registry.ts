// deploy/01_registry.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		// the deployer can sign: the Safe only becomes the owner
		await deploy('Registry', {account: deployer, artifact: artifacts.Registry, args: [admin]});
	},
	{tags: ['Registry']},
);
