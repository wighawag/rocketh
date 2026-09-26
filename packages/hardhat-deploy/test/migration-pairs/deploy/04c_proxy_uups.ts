// deploy/04c_proxy_uups.ts (rocketh)
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deployViaProxy(
			'GreetingsRegistry',
			{account: deployer, artifact: artifacts.GreetingsRegistry, args: ['hello: ']},
			{
				// the one built-in name that did not change
				proxyContract: 'UUPS',
			},
		);
	},
	{tags: ['GreetingsRegistry']},
);
