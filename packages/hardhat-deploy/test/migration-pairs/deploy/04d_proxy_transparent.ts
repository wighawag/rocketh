// deploy/04d_proxy_transparent.ts (rocketh)
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deployViaProxy(
			'GreetingsRegistry',
			{account: deployer, artifact: artifacts.GreetingsRegistry, args: ['hello: ']},
			{
				// v1 'OpenZeppelinTransparentProxy', renamed. It implies the shared `DefaultProxyAdmin`
				// that v1's `viaAdminContract` named; `{type: '...', proxyAdminName}` picks another name.
				proxyContract: 'SharedAdminOpenZeppelinTransparentProxy',
			},
		);
	},
	{tags: ['GreetingsRegistry']},
);
