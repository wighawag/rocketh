// deploy/01_vault.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		// the same name on every run: after Vault.sol changes, re-running this script upgrades the proxy
		await deployViaProxy(
			'Vault',
			{account: deployer, artifact: artifacts.Vault},
			{
				owner: admin, // sends every later upgrade
				execute: {
					init: {methodName: 'init', args: [admin]}, // on the first deployment only
					onUpgrade: {methodName: 'postUpgrade', args: []}, // on each upgrade, never on the first deployment
				},
			},
		);
	},
	{tags: ['Vault']},
);
