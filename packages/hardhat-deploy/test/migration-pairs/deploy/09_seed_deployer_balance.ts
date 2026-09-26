// deploy/09_seed_deployer_balance.ts (rocketh)
import {parseEther} from 'viem';
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({execute, get, namedAccounts}) => {
		const {deployer, tokenOwner} = namedAccounts;

		await execute(get<typeof artifacts.Token.abi>('Token'), {
			account: tokenOwner,
			functionName: 'transfer',
			args: [deployer, parseEther('100')],
		});

		return true; // records the `id`: this script never runs again on this environment
	},
	{id: 'seed_deployer_balance', tags: ['Seed'], dependencies: ['Token']},
);
