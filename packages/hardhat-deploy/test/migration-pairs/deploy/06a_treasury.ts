// deploy/06a_treasury.ts (rocketh)
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deployViaProxy(
			'Treasury',
			{account: deployer, artifact: artifacts.Treasury, args: [1000n]},
			{upgradeIndex: 0}, // step 0: the first deployment, never repeated
		);
	},
	{tags: ['Treasury']},
);
