# Routers

A router is one contract that forwards each call, by its function selector, to one of several **route** contracts, each holding part of the code. `deployViaRouter`, from `@rocketh/router`, deploys the routes, builds the selector map, deploys the router over them, and records the whole under one name with the merged ABI of every route.

The router itself is immutable: changing a route deploys a new router. What makes it useful is putting it behind a [proxy](../proxies/): the system keeps one upgradeable address, and the code behind it can be larger than the contract size limit, split across as many routes as it needs.

## Setting it up

```bash
pnpm add -D @rocketh/router
```

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';
import * as proxyExtension from '@rocketh/proxy';
import * as routerExtension from '@rocketh/router';

const extensions = {...deployExtension, ...proxyExtension, ...routerExtension};
export {extensions};
```

## Behind a proxy

The usual shape is a game, a protocol or any system whose logic has outgrown one contract: every route receives the same configuration, the router puts them together, and `deployViaProxy` makes the router the proxy's implementation by producing it in its `artifact` function:

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, deployViaRouter, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		const config = {commitPhaseDuration: 82800n, revealPhaseDuration: 3600n};

		const routes = [
			{name: 'Getters', artifact: artifacts.GameGetters, args: [config]},
			{name: 'Commit', artifact: artifacts.GameCommit, args: [config]},
			{name: 'Reveal', artifact: artifacts.GameReveal, args: [config]},
		];

		await deployViaProxy(
			'Game',
			{
				account: deployer,
				// the implementation is a router over the routes above
				artifact: (name, {account}) => deployViaRouter(name, {account}, routes),
			},
			{owner: admin},
		);
	},
	{tags: ['Game', 'Game_deploy']},
);
```

`Game` is then the proxy, with the merged ABI of every route. Change a route's code or its arguments and the next run deploys that route, a new router over the routes (since the route addresses are the router's constructor arguments), and upgrades the proxy to it. A route that did not change keeps its deployment.

The routes share the proxy's storage, so the same care as for [diamond facets](../diamonds/#facet-storage) applies: give each route's state its own slot, or derive all routes from one base contract that declares the storage once.

## A router on its own

`deployViaRouter(name, {account}, routes, options?)` without a proxy gives an immutable contract made of several:

```typescript
await deployViaRouter('Token', {account: deployer}, [
	{name: 'Core', artifact: artifacts.ERC20Core, args: ['My Token', 'MTK', 18]},
	{name: 'Mintable', artifact: artifacts.MintableModule, args: [treasury]},
]);
```

A route is `{name, artifact, args?}`, plus any deployment field (`value`, `gas`). It records:

- `Token`: the router's address with the merged ABI (and the merged NatSpec), which is what callers use;
- `Token_Router`: the router contract;
- `Token_Router_<route>_Route`: each route.

Behind a proxy the router is the implementation, so the names start with `<name>_Implementation` instead.

## Options

`options` takes the options of `deploy` (`deterministic`, `linkedData`, `libraries` and the re-deployment controls) plus:

| Option           | What it does                                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `extraABIs`      | more ABIs to merge into the record, for events or errors no route declares (a debug interface, say)                                           |
| `routerContract` | `{type: 'custom', artifact}`: your own router contract, taking `(address fallbackImplementation, address[] implementations, bytes6[] sigMap)` |

The re-deployment controls apply at the level that keeps the router consistent. By default every route and the router are compared on code and constructor arguments and redeployed only when they differ. `skipIfAlreadyDeployed` applies to the whole: when a record exists under `name`, nothing is deployed, routes included, since skipping only some routes would deploy code the router cannot reach. `alwaysOverride` and `strictBytecodeMatch` apply to each contract, except that `strictBytecodeMatch` is not applied to the bundled router itself, so a metadata difference in it never cascades into an upgrade of the proxy in front of it.

## How the router finds a route

The router holds a sorted array of `bytes6` entries: a 4-byte function selector followed by the 2-byte (1-based) index of the route that implements it. A call looks its selector up and is delegated to that route. `deployViaRouter` deploys it with no fallback implementation, and two routes declaring the same function are refused when their ABIs are merged, before anything is deployed.
