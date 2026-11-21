# @rocketh/router

`deployViaRouter` for rocketh deploy scripts: deploys several route contracts and one router that forwards each call to the route implementing it, recorded under one name with the merged ABI. Put the router behind a `@rocketh/proxy` proxy and a system larger than the contract size limit stays one upgradeable address.

## Installation

```bash
pnpm add -D @rocketh/router
# or
npm install --save-dev @rocketh/router
```

## Wiring it up

`@rocketh/router` is an extension: spread it into `extensions` in `rocketh/config.ts`, and your deploy scripts receive its functions.

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';
import * as routerExtension from '@rocketh/router';

const extensions = {...deployExtension, ...routerExtension};
export {extensions};
```

## Example

```typescript
// deploy/001_deploy_game.ts: a router as the implementation of a proxy
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, deployViaRouter, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;
		const config = {commitPhaseDuration: 82800n, revealPhaseDuration: 3600n};
		const routes = [
			{name: 'Commit', artifact: artifacts.GameCommit, args: [config]},
			{name: 'Reveal', artifact: artifacts.GameReveal, args: [config]},
		];
		await deployViaProxy(
			'Game',
			{account: deployer, artifact: (name, {account}) => deployViaRouter(name, {account}, routes)},
			{owner: admin},
		);
	},
	{tags: ['Game']},
);
```

This needs `@rocketh/proxy` in `extensions` too.

## The router contract

The router is [`solidity-proxy`](https://github.com/wighawag/solidity-proxy)'s `Router` unless you name another with `routerContract`:

- `'Router'` (the default): up to 256 routes and as many selectors as the init code limit allows, its routes kept in a data contract, so every block explorer, Etherscan included, can verify it;
- `'InlineRouter'`: the same limits and the cheapest to call and deploy, its routes appended to its own code, so it verifies by its creation code only (Sourcify, Blockscout);
- `'Router10X60'`: the previous default, at most 10 routes and 60 selectors;
- `{type: 'custom', artifact}`: your own, constructed with the same routes.

```typescript
await deployViaRouter('Game', {account: deployer}, routes, {routerContract: 'InlineRouter'});
```

The three are also shipped as JSON under `@rocketh/router/artifacts/`, for `hardhat-external-artifacts`' `modules`.

## Documentation

- [Routers](https://rocketh.dev/documentation/routers/)
- [Upgradeable contracts with proxies](https://rocketh.dev/documentation/proxies/)

The whole documentation is at [rocketh.dev](https://rocketh.dev), the hardhat-deploy section at [rocketh.dev/hardhat-deploy](https://rocketh.dev/hardhat-deploy/).

## License

[MIT](https://github.com/wighawag/rocketh/blob/main/LICENSE)
