# @rocketh/proxy

`deployViaProxy` for rocketh deploy scripts: deploys your implementation behind a proxy and records the pair under one name with the implementation's ABI. Run it again after changing the implementation and it upgrades the proxy in place. ERC-173 (the default), UUPS, OpenZeppelin-compatible and optimized transparent proxies, your own admin contract or proxy, upgrade stories with `upgradeIndex`, and upgrades owned by a Safe.

## Installation

```bash
pnpm add -D @rocketh/proxy
# or
npm install --save-dev @rocketh/proxy
```

## Wiring it up

`@rocketh/proxy` is an extension: spread it into `extensions` in `rocketh/config.ts`, and your deploy scripts receive its functions.

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';
import * as proxyExtension from '@rocketh/proxy';

const extensions = {...deployExtension, ...proxyExtension};
export {extensions};
```

## Example

```typescript
// deploy/001_deploy_greetings_registry.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;
		await deployViaProxy(
			'GreetingsRegistry',
			{account: deployer, artifact: artifacts.GreetingsRegistry, args: ['hello: ']},
			{owner: admin, execute: {init: {methodName: 'init', args: ['hello: ']}}},
		);
	},
	{tags: ['GreetingsRegistry']},
);
```

The proxied contract's state is initialized through `execute` (a call made through the proxy), never by its constructor, which writes to the implementation's own storage. The Solidity helper `Proxied` (`@rocketh/proxy/solc_0_8/ERC1967/Proxied.sol`) guards such an initializer.

## Documentation

- [Upgradeable contracts with proxies](https://rocketh.dev/documentation/proxies/)
- [A Safe-owned project, end to end](https://rocketh.dev/documentation/safe-owned-project/)
- [Routers behind a proxy](https://rocketh.dev/documentation/routers/#behind-a-proxy)

The whole documentation is at [rocketh.dev](https://rocketh.dev), the hardhat-deploy section at [rocketh.dev/hardhat-deploy](https://rocketh.dev/hardhat-deploy/).

## License

[MIT](https://github.com/wighawag/rocketh/blob/main/LICENSE)
