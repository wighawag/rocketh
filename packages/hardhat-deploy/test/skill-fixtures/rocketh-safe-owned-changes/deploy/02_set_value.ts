// deploy/02_set_value.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({execute, get, namedAccounts}) => {
		const {admin} = namedAccounts;

		// `admin` is unsignable: this step pauses for the Safe's hash, or throws when unattended
		await execute(get<typeof artifacts.Registry.abi>('Registry'), {
			account: admin,
			functionName: 'setValue',
			args: [42n],
			// what on chain says the step is done: once the Safe executed it, a re-run skips it
			guard: {kind: 'call', functionName: 'value', equals: 42n},
		});

		return true; // reached only once the value is really set
	},
	{id: 'set_value', tags: ['Value'], dependencies: ['Registry']},
);
