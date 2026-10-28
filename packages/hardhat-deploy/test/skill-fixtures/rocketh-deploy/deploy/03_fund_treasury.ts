// deploy/03_fund_treasury.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({execute, get, namedAccounts}) => {
		const {deployer, treasury} = namedAccounts;

		// the address comes from the record `01_token.ts` saved, the recipient from a named account
		const token = get<typeof artifacts.Token.abi>('Token');

		// a one-off: the treasury's balance moves later, so nothing on chain says this transfer happened
		await execute(token, {account: deployer, functionName: 'transfer', args: [treasury, 100_000n]});

		return true; // reached only once the transfer landed: the whole script is recorded as done
	},
	{id: 'fund_treasury', tags: ['FundTreasury'], dependencies: ['Token']},
);
