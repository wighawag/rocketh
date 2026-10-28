// deploy/02_counter.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		// step 0, the original deployment: kept, so a fresh chain replays every step in order
		await deployViaProxy(
			'Counter',
			{account: deployer, artifact: artifacts.CounterV1},
			{owner: admin, upgradeIndex: 0, execute: {init: {methodName: 'init', args: [admin]}}},
		);

		// step 1, appended with the upgrade: the next index, and step 0 left exactly as it was
		await deployViaProxy(
			'Counter',
			{account: deployer, artifact: artifacts.CounterV2},
			{
				owner: admin,
				upgradeIndex: 1,
				execute: {init: {methodName: 'init', args: [admin]}, onUpgrade: {methodName: 'postUpgrade', args: []}},
			},
		);
	},
	{tags: ['Counter']},
);
