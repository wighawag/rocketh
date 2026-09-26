// deploy/04b_proxy_erc173_with_receive.ts (rocketh)
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deployViaProxy(
			'GreetingsRegistry',
			{account: deployer, artifact: artifacts.GreetingsRegistry, args: ['hello: ']},
			{
				// v1 'EIP173ProxyWithReceive', renamed
				proxyContract: 'ERC173ProxyWithReceive',
			},
		);
	},
	{tags: ['GreetingsRegistry']},
);
