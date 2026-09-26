// deploy/06b_treasury_upgrade.ts (rocketh)
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deployViaProxy(
			'Treasury',
			{account: deployer, artifact: artifacts.TreasuryV2, args: [5000n]}, // `contract: 'TreasuryV2'`
			{upgradeIndex: 1}, // step 1: the first upgrade, applied once, after step 0
		);
	},
	{tags: ['Treasury']},
);
