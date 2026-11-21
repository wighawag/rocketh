// deploy/00_deploy_my_contract.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy('MyContract', {
			account: deployer,
			artifact: artifacts.MyContract,
			args: ['Hello'],
		});
	},
	{tags: ['MyContract']},
);
