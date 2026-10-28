// deploy/02_set_value.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({execute, get, namedAccounts}) => {
		const {admin} = namedAccounts;

		// `admin` is unsignable: without a terminal this throws, and nothing below it runs
		await execute(get<typeof artifacts.Registry.abi>('Registry'), {
			account: admin,
			functionName: 'setValue',
			args: [42n],
		});

		return true; // reached only once the value was really set
	},
	{id: 'set_value', tags: ['Value'], dependencies: ['Registry']},
);
