# @rocketh/proxy

Upgradeable deployments for rocketh. `deployViaProxy` deploys your implementation contract, puts a proxy in front of it, and records the pair as a single named deployment whose ABI is the implementation's. Run it again after changing the implementation and it performs an **upgrade** instead of a fresh deployment.

Supports ERC-1967 / UUPS, transparent proxies (OpenZeppelin-compatible and an optimized variant), ERC-173 ownable proxies, and any custom proxy artifact you supply.

## Installation

```bash
# Using pnpm
pnpm add @rocketh/proxy

# Using npm
npm install @rocketh/proxy

# Using yarn
yarn add @rocketh/proxy
```

## Wiring it up

`@rocketh/proxy` is an **extension**: spread its namespace into `extensions` in `rocketh/config.ts`.

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';
import * as proxyExtension from '@rocketh/proxy';

const extensions = {
	...deployExtension,
	...proxyExtension,
};
export {extensions};
```

## Basic usage

```typescript
// deploy/deploy_Counter.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await deployViaProxy(
			'Counter',
			{
				account: deployer,
				artifact: artifacts.Counter,
				args: [42n],
			},
			{
				owner: admin,
				execute: 'postUpgrade',
			},
		);
	},
	{tags: ['Counter', 'Counter_deploy']},
);
```

`env.get('Counter')` now returns the **proxy address** with the implementation's ABI, which is what callers and frontends want. The two underlying contracts are saved alongside it as `Counter_Proxy` and `Counter_Implementation`.

## The initializer runs through `execute`, not the constructor

This is the single most common mistake. State written by an implementation's **constructor** lands in the implementation's own storage, not the proxy's, so a proxied contract initializes through a call made _through the proxy_. That is what `execute` is for:

```typescript
// runs `initialize(...)` through the proxy on first deployment
{execute: {methodName: 'initialize', args: [ownerAddress]}}

// shorthand when the method takes no arguments
{execute: 'postUpgrade'}
```

To run different functions on first deployment and on later upgrades, use the object form:

```typescript
{
	execute: {
		init: {methodName: 'initialize', args: [ownerAddress]},
		onUpgrade: {methodName: 'postUpgrade'},
	},
}
```

Omitting `onUpgrade` means **nothing runs on upgrade**. If your new implementation needs a migration step, this is where it goes; a silently missing `onUpgrade` is a bug that looks like a successful upgrade.

## Choosing the proxy

```typescript
type PredefinedProxyContract =
	| 'ERC173Proxy'
	| 'ERC173ProxyWithReceive'
	| 'UUPS'
	| 'SharedAdminOpenZeppelinTransparentProxy'
	| 'SharedAdminOptimizedTransparentProxy';
```

| Value                                     | Use it for                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| `ERC173Proxy`                             | Default ERC-173 ownable proxy.                                          |
| `ERC173ProxyWithReceive`                  | Same, when the proxy must accept plain ETH transfers.                   |
| `UUPS`                                    | The upgrade logic lives in the implementation (ERC-1822 / UUPS).        |
| `SharedAdminOpenZeppelinTransparentProxy` | OpenZeppelin-compatible transparent proxy behind a shared `ProxyAdmin`. |
| `SharedAdminOptimizedTransparentProxy`    | Optimized transparent proxy behind a shared `ProxyAdmin`.               |

The two shared-admin variants accept a `proxyAdminName` so several proxies can share (or deliberately not share) one admin contract:

```typescript
{proxyContract: {type: 'SharedAdminOptimizedTransparentProxy', proxyAdminName: 'MyProxyAdmin'}}
```

A custom proxy artifact is supported too. `args` names where the proxy constructor wants each value, and defaults to `['{implementation}', '{admin}', '{data}']`:

```typescript
{
	proxyContract: {
		type: 'custom',
		artifact: artifacts.MyProxy,
		args: ['{implementation}', '{admin}', '{data}'],
	},
}
```

## Options

Everything from `@rocketh/deploy`'s `DeployOptions` (minus the re-deployment flags it replaces) plus:

| Option                                   | Description                                                                                                    |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `owner`                                  | Address that may upgrade the proxy. Defaults to the deployer.                                                  |
| `execute`                                | Initializer / upgrade call, as described above.                                                                |
| `proxyContract`                          | Which proxy to use. See the table above.                                                                       |
| `proxyDisabled`                          | Deploy the implementation directly, with no proxy. Useful for a production build that must not be upgradeable. |
| `upgradeIndex`                           | Lets you tell an upgrade story as a sequence of steps that each run exactly once. See below.                   |
| `checkProxyAdmin`                        | Verify the on-chain proxy admin matches what the config expects (defaults on).                                 |
| `checkABIConflict`                       | Refuse an upgrade whose new ABI conflicts with the proxy's own functions.                                      |
| `deterministicImplementation`            | Deploy the implementation deterministically while leaving the proxy address nonce-derived.                     |
| `alwaysOverride` / `strictBytecodeMatch` | Mutually exclusive re-deployment controls, as in `@rocketh/deploy`.                                            |

**Proxies force `strictBytecodeMatch: false`.** A metadata-only difference (a changed comment) must never trigger an upgrade. See [`docs/adr/0004-non-strict-bytecode-matching-by-default.md`](https://github.com/wighawag/rocketh/blob/main/docs/adr/0004-non-strict-bytecode-matching-by-default.md).

## Telling an upgrade story with `upgradeIndex`

Keeping every upgrade in your scripts forever, each one running exactly once, makes a deployment reproducible from zero on a fresh chain. `upgradeIndex` is the step number:

```typescript
// step 0: the original deployment
await deployViaProxy('Counter', {account: deployer, artifact: artifacts.CounterV1}, {upgradeIndex: 0});

// step 1: an upgrade, added later and kept forever
await deployViaProxy(
	'Counter',
	{account: deployer, artifact: artifacts.CounterV2},
	{upgradeIndex: 1, execute: {onUpgrade: 'postUpgrade'}},
);
```

The step count comes from `numDeployments` on the saved record, which is how many steps have already run and therefore the index of the step due next. More steps recorded than the index asks for means the step already ran, and it is skipped; exactly that many means it is due, and it proceeds; fewer means an earlier step never ran, and it throws rather than silently skipping ahead.

(A `history` field left over from a hardhat-deploy v1 project is ignored: `numDeployments` is the only source of truth.)

## Deploying the implementation yourself

`artifact` also accepts a function, so the implementation can be produced by something other than a plain deploy (a library-linked deployment, a router, a deterministic deployment with its own options):

```typescript
await deployViaProxy(
	'Counter',
	{
		account: deployer,
		artifact: (name, args, options) => deploy(name, {...args, artifact: artifacts.Counter}, options),
	},
	{owner: admin},
);
```

## Upgrades owned by a Safe or multisig

This needs no extra package. When the proxy owner is an account rocketh cannot sign for, the default behaviour is to print the upgrade transaction, wait while you execute it on the Safe, take the transaction hash back and continue the same run.

If you instead want the non-interactive flow, where the run hands you the transaction as a value and stops that branch, wrap the upgrade in [`@rocketh/unknown-signer`](https://www.npmjs.com/package/@rocketh/unknown-signer):

```typescript
const deferred = await catchUnknownSigner(() => deployViaProxy('Counter', {...}, {owner: safeAddress}));

if (deferred) {
	// {from, to, value, data} - execute this on the Safe, then re-run the script.
}
```

That wrapper is mainly for migrating hardhat-deploy v1 scripts and for runs that must never block.

## Related packages

- [`@rocketh/deploy`](https://www.npmjs.com/package/@rocketh/deploy) - the deployment function this builds on
- [`@rocketh/diamond`](https://www.npmjs.com/package/@rocketh/diamond) - EIP-2535 Diamonds, for upgradeability by facet
- [`@rocketh/unknown-signer`](https://www.npmjs.com/package/@rocketh/unknown-signer) - defer upgrades owned by a Safe or multisig
- [`rocketh`](https://www.npmjs.com/package/rocketh) - core environment and executor

For full documentation, visit [rocketh.dev](https://rocketh.dev).

For hardhat-deploy documentation, see [rocketh.dev/hardhat-deploy/](https://rocketh.dev/hardhat-deploy/).
