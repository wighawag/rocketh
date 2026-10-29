# Upgradeable contracts with proxies

`deployViaProxy`, from `@rocketh/proxy`, deploys your implementation contract, puts a proxy in front of it, and records the pair under one name whose ABI is the implementation's. Run the script again after changing the implementation and it **upgrades** the proxy instead of deploying a new one: same address, same storage, new code.

## Setting it up

```bash
pnpm add -D @rocketh/proxy
```

`@rocketh/proxy` is an extension, next to `@rocketh/deploy`:

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';
import * as proxyExtension from '@rocketh/proxy';

const extensions = {...deployExtension, ...proxyExtension};
export {extensions};
```

## Deploying behind a proxy

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await deployViaProxy(
			'GreetingsRegistry',
			{
				account: deployer,
				artifact: artifacts.GreetingsRegistry,
				args: ['hello: '],
			},
			{
				owner: admin,
				execute: {init: {methodName: 'init', args: ['hello: ']}},
			},
		);
	},
	{tags: ['GreetingsRegistry', 'GreetingsRegistry_deploy']},
);
```

The deployer pays for the deployment; `owner` is the account that may upgrade the proxy afterwards (the deployer when it is not given). Three records are written:

- `GreetingsRegistry`: the proxy's address with the implementation's ABI, which is what scripts, tests and frontends use. Its `implementation` field is the implementation that record describes, as established by the run that wrote it, not a live reading: an upgrade a Safe has yet to execute leaves it on the old one. Read the proxy's EIP-1967 slot when you need the live value.
- `GreetingsRegistry_Proxy`: the proxy contract itself.
- `GreetingsRegistry_Implementation`: the implementation most recently deployed.

## Initializing: `execute`, not the constructor

A constructor runs once, against the implementation's own storage, when the implementation is deployed. The proxy has storage of its own, which the constructor never touches, so state a proxied contract needs (an owner, a prefix, a fee) must be written by a call made **through the proxy**. That is `execute`, and it comes in two forms:

- **Flat**, one call made on the first deployment AND again on every later upgrade: `execute: 'init'`, or `execute: {methodName: 'init', args: [...]}`. Use it only for a call that is safe to repeat.
- **Explicit**, `{init, onUpgrade}`: `init` is made only when the proxy is first deployed, `onUpgrade` only on an upgrade. Each takes a method name or `{methodName, args}`.

When no `args` are given (the string forms, or `{methodName}` alone), the call receives the deployment's constructor `args`. Without `onUpgrade`, an upgrade calls nothing: if a new implementation needs a migration step, that is where it goes. It is then made on every upgrade this call performs, not only the next one, so write the step to be safe to repeat, or replace it with the next version's own step when the contract changes again. A value mixing the two forms (`methodName` next to `init` or `onUpgrade`) is refused before anything is deployed, and a method the artifact does not have stops the run.

The TypeScript type of the explicit form currently requires `init`, so an upgrade step that only needs `onUpgrade` must still name an `init` (one that is never called on that proxy, since it already exists).

### Writing the contract

The contract can keep its constructor, so the same code works with and without a proxy, and add an initializer that the proxy calls. `@rocketh/proxy` ships `Proxied`, whose modifiers make such an initializer safe to expose:

```solidity
import {Proxied} from "@rocketh/proxy/solc_0_8/ERC1967/Proxied.sol";

contract GreetingsRegistry is Proxied {
    string internal _prefix;

    constructor(string memory prefix) {
        _init(prefix);
    }

    function init(string memory prefix) external asProxyInitialiser {
        _init(prefix);
    }

    function _init(string memory prefix) internal {
        _prefix = prefix;
    }
}
```

`asProxyInitialiser` lets the first call through the proxy initialize it, and after that only the proxy's admin. `asProxyOneTimeInitialiser` allows exactly one call, ever. Either way the initializer must be called in the deployment itself, through `execute`, or anyone could call it first. A contract with no constructor works the same way: deploy it with no `args` and give the initializer its arguments in `execute`.

## Upgrading

Change the implementation, run the script again, and `deployViaProxy`:

1. deploys the new implementation, because its code (or its constructor arguments) changed;
2. calls the proxy's upgrade function from the account that holds upgrade rights, with the `onUpgrade` (or flat) call attached;
3. updates the three records.

The proxy keeps its address and its storage. An upgrade replaces code, not state, which is why a new implementation may only append storage variables: reordering them, or inserting one above existing ones, makes the new code read the old slots as something else. The [playground](../#try-it-here) shows this with a real upgrade.

rocketh does not check that rule for you. Whether to upgrade is decided by one comparison: the address in the proxy's EIP-1967 implementation slot against the implementation this run resolved. When they differ the upgrade is sent, whatever the new contract's storage looks like, and the compiler's `storageLayout` output is never read. So check the layout yourself before upgrading, for example by diffing the old and new `storageLayout` with a layout-diff tool, and rehearse the upgrade [on a fork](../fork-runs/) so the new code runs against the existing state before it does so for real. A [diamond](../diamonds/) cut is no different: rocketh compares function selectors and facet addresses, never the facets' storage.

The implementation is compared as `deploy` compares any contract (metadata ignored unless you set `strictBytecodeMatch`, see [When does a re-run redeploy?](../deploy-contracts/#when-does-a-re-run-redeploy)). The proxy contract itself is always compared without its metadata, so a recompilation of the bundled proxy never triggers an upgrade.

`deployViaProxy` returns the proxy's record, which has no `newlyDeployed` flag. To know what a run did, compare the record before and after:

```typescript
const before = getOrNull('GreetingsRegistry');
const after = await deployViaProxy('GreetingsRegistry', {
	account: deployer,
	artifact: artifacts.GreetingsRegistry,
	args: [''],
});
if (!before) {
	console.log('deployed');
} else if (before.implementation !== after.implementation) {
	console.log('upgraded');
}
```

When the owner is an account rocketh cannot sign for (a Safe, a multisig, a timelock), the upgrade is handed to you: by default the run prints the transaction, waits while you execute it, and checks the hash you paste. [A Safe-owned project, end to end](../safe-owned-project/) walks through it, rehearsal on a fork included.

### An upgrade story kept forever: `upgradeIndex`

A project that wants a fresh chain to replay every upgrade in order keeps each step in its scripts and numbers it:

```typescript
// step 0: the original deployment
await deployViaProxy('Counter', {account: deployer, artifact: artifacts.CounterV1, args: []}, {upgradeIndex: 0});

// step 1: an upgrade, added later and kept
await deployViaProxy(
	'Counter',
	{account: deployer, artifact: artifacts.CounterV2, args: []},
	{upgradeIndex: 1, execute: {init: 'init', onUpgrade: 'postUpgrade'}},
);
```

The record's `numDeployments` is the number of steps already run. A step whose index is below it already ran and is skipped, the step equal to it runs, and a step above it throws, since an earlier step never ran.

## Choosing the proxy

`proxyContract` picks the proxy, and defaults to `ERC173Proxy`:

| `proxyContract`                           | What it is                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `ERC173Proxy` (default)                   | an ownable proxy: its owner upgrades it directly                                                  |
| `ERC173ProxyWithReceive`                  | the same, accepting plain ETH transfers                                                           |
| `UUPS`                                    | an ERC-1967 proxy whose upgrade logic lives in the implementation (UUPS)                          |
| `SharedAdminOpenZeppelinTransparentProxy` | an OpenZeppelin-compatible transparent proxy, upgraded through a `ProxyAdmin` contract            |
| `SharedAdminOptimizedTransparentProxy`    | an optimized transparent proxy, upgraded through a `ProxyAdmin` contract                          |
| `{type: 'custom', artifact, args?}`       | your own proxy; `args` places `'{implementation}'`, `'{admin}'` and `'{data}'` in its constructor |

The two transparent kinds share one admin contract, `DefaultProxyAdmin`, deployed the first time and owned by `owner`. Name another with `proxyAdminName` to give a group of proxies its own admin, and give `proxyAdminArtifact` to deploy your own admin contract (a registry, say) under that name:

```typescript
{
	owner: admin,
	proxyContract: {
		type: 'SharedAdminOptimizedTransparentProxy',
		proxyAdminName: 'RegistryAdmin',
		proxyAdminArtifact: artifacts.RegistryAdmin, // optional; deployed with [owner] as constructor arguments
	},
}
```

An existing deployment under `proxyAdminName` is used as it is. The admin must answer `owner()`; rocketh refuses an admin owned by the zero address or by someone other than `owner`, and sends the upgrade from the admin's owner, so an admin owned by a Safe goes through the same unknown-signer flow.

When the admin or proxy upgrades through a method that is not `upgradeTo` / `upgradeToAndCall` (on a proxy) or `upgrade` / `upgradeAndCall` (on an admin), name it:

```typescript
{upgradeFunction: {methodName: 'upgradeProxy', args: ['{proxy}', '{implementation}', '{data}']}}
```

Its `args` may only hold the placeholders `{proxy}`, `{implementation}`, `{data}` (the `execute` calldata, or `0x`) and `{admin}`.

Beacon proxies are not built in; [one implementation behind many proxies](/hardhat-deploy/migration/#one-implementation-behind-many-proxies) shows the alternative.

## Options

`deployViaProxy(name, construction, options?)` takes everything `deploy` takes (except `skipIfAlreadyDeployed`), plus:

| Option                        | What it does                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `owner`                       | who may upgrade; defaults to the deployer                                                        |
| `execute`                     | the initializer and upgrade calls, above                                                         |
| `proxyContract`               | which proxy, and which admin contract, above                                                     |
| `upgradeFunction`             | your own upgrade method, above                                                                   |
| `upgradeIndex`                | the step number of an upgrade story, above                                                       |
| `proxyDisabled`               | deploy the implementation directly, with no proxy                                                |
| `deterministicImplementation` | deploy the implementation deterministically, leaving the proxy's address nonce-derived           |
| `checkProxyAdmin`             | check that the proxy's on-chain admin is the expected one (on by default, off for UUPS)          |
| `checkABIConflict`            | refuse an implementation whose functions clash with the proxy's own (on for the ERC-173 proxies) |

`proxyDisabled` is how one script serves both a development build that hot-swaps code and a production build that must not be upgradeable:

```typescript
const useProxy = !env.tags['live'];
await deployViaProxy(
	'GreetingsRegistry',
	{account: deployer, artifact: artifacts.GreetingsRegistry, args: ['']},
	{proxyDisabled: !useProxy, execute: 'init'},
);
```

## Producing the implementation yourself

`artifact` also accepts a function, which deploys the implementation however it needs to be deployed and returns its record. `deployViaProxy` calls it with the implementation's name (`Counter_Implementation`), the construction (`account` and the rest) and the deploy options; pass them on, with the artifact and its constructor arguments:

```typescript
const math = await deploy('MathLib', {account: deployer, artifact: artifacts.MathLib});

await deployViaProxy(
	'Counter',
	{
		account: deployer,
		artifact: (name, {account}, options) =>
			deploy(
				name,
				{account, artifact: artifacts.Counter, args: [42n]},
				{...options, libraries: {MathLib: math.address}},
			),
	},
	{owner: admin},
);
```

This is how a contract above the size limit stays upgradeable: the implementation is a [router](../routers/#behind-a-proxy) over several contracts.
