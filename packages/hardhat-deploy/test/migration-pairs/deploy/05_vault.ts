// deploy/05_vault.ts (rocketh)
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deployViaProxy(
			'Vault',
			{account: deployer, artifact: artifacts.Vault},
			{
				// unchanged from v1, one level up: `execute` sits directly in the options, not under `proxy`
				execute: {
					init: {methodName: 'initialize', args: [deployer]}, // on the first deployment
					onUpgrade: {methodName: 'migrate', args: [2n]}, // on every later upgrade
				},
			},
		);
	},
	{tags: ['Vault']},
);
