// deploy/04a_proxy_erc173.ts (rocketh)
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deployViaProxy(
			'GreetingsRegistry',
			{account: deployer, artifact: artifacts.GreetingsRegistry, args: ['hello: ']},
			{
				// v1 'EIP173Proxy', renamed. Also the default when `proxyContract` is omitted, in both.
				proxyContract: 'ERC173Proxy',
			},
		);
	},
	{tags: ['GreetingsRegistry']},
);
