// deploy/01_token.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		// on a re-run, `deploy` compares the code and the arguments with the record: same, nothing sent
		await deploy('Token', {account: deployer, artifact: artifacts.Token, args: [deployer, 1_000_000n]});
	},
	{tags: ['Token']},
);
