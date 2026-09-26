// deploy/04e_proxy_optimized_transparent.ts (rocketh)
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deployViaProxy(
			'GreetingsRegistry',
			{account: deployer, artifact: artifacts.GreetingsRegistry, args: ['hello: ']},
			{
				// v1 'OptimizedTransparentProxy', renamed. `DefaultProxyAdmin` is implied, as above.
				proxyContract: 'SharedAdminOptimizedTransparentProxy',
			},
		);
	},
	{tags: ['GreetingsRegistry']},
);
