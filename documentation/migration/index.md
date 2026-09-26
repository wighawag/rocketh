# Migrating from hardhat-deploy v1 to v2

hardhat-deploy v2 is hardhat-deploy on top of rocketh. Two other documents teach you how to TRANSLATE a project: the step-by-step [hardhat-deploy migration guide](/hardhat-deploy/documentation/how-to/migration-from-v1/), and the [migration skill](https://github.com/wighawag/rocketh/blob/main/skills/hardhat-deploy-migration/SKILL.md) you can hand to an AI assistant. Both assume the feature you use exists on the other side.

This page answers the question that decides whether you can move at all: **for every hardhat-deploy v1 capability, what replaces it, or that nothing does and why.** It is the one place that list lives; the other two documents link here rather than repeating it.

Each capability is marked with one of these:

- **same**: it exists, possibly under a different spelling, which the row gives.
- **replaced**: something else answers the same need by a different mechanism, which the row names.
- **not supported**: a decision was taken not to have it. Plan around it.
- **not supported yet**: it is missing today and work to add it is planned. Until it ships, treat it as not supported; no date is promised.

Read the sections that match what your v1 project uses. The ones that fail LATE (at deploy-script run time, or silently) are marked, because those are the ones a type check will not catch for you.

## Changes in Deploy Scripts

In v1:

```typescript
// deploy/00_deploy_my_contract.js
module.exports = async ({getNamedAccounts, deployments}) => {
	const {deploy} = deployments;
	const {deployer} = await getNamedAccounts();
	await deploy('MyContract', {
		from: deployer,
		args: ['Hello'],
		log: true,
	});
};
module.exports.tags = ['MyContract'];
```

In v2:

```typescript
// deploy/00_deploy_my_contract.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy('MyContract', {
			account: deployer,
			artifact: artifacts.MyContract,
			args: ['Hello'],
		});
	},
	{tags: ['MyContract']},
);
```

What v1 built into `deployments`, rocketh provides as **extensions**: packages whose functions you spread into `extensions` in `rocketh/config.ts`, and which then arrive on the environment your deploy script receives. `deploy` comes from `@rocketh/deploy`, `read` and `execute` from `@rocketh/read-execute`, `deployViaProxy` from `@rocketh/proxy`, `diamond` from `@rocketh/diamond`, `catchUnknownSigner` from `@rocketh/unknown-signer`, and viem clients from `@rocketh/viem`. A function you use and did not register is simply not on the environment.

### A v1 `skip` export is ignored

v1 let a script export `func.skip = async (hre) => boolean`, a predicate evaluated before the script ran. rocketh has no such hook, and it does not refuse one either: a `skip` export is IGNORED, so the script runs as if it were not there. Nothing warns you, which is why this is the part to check when porting a script. Two replacements cover what `skip` was used for.

To skip a script conditionally on this run, return early from its own body. The condition sees the same environment the rest of the script does:

```typescript
export default deployScript(
	async (env) => {
		// `testnet` is a tag you declared in rocketh/config.ts
		if (!env.tags['testnet']) {
			return; // what v1's skip() returning true did
		}
		// ...
	},
	{tags: ['DevOnly']},
);
```

To skip a script PERMANENTLY once it has completed, use the run-once mechanism instead of a predicate: give the script an `id` and `return true` at the end. The id is recorded, and later runs against the same environment do not call the script at all. See [Script lifecycle](../script-lifecycle/) for the rules, including why `return true` must not be reached on a path where a step was deferred.

## Changes in Configuration

In v1, configuration was in `hardhat.config.ts`:

```typescript
namedAccounts: {
  deployer: 0,
  ...
},
```

In v2, configuration is in `rocketh/config.ts`:

```typescript
export const config = {
  accounts: {
    deployer: {
      default: 0,
    },
    ...
  },
} as const satisfies UserConfig;
```

## Named accounts {#named-accounts}

v1's `namedAccounts` moves to `rocketh/config.ts` as `accounts`. Most entries move unchanged; the differences are below.

| v1 named-account entry                                                      | rocketh                                                                                                                                                                                        |                                                                                                                                                         |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| an index into the node's accounts (`deployer: 0`)                           | the same                                                                                                                                                                                       | same, but an index the node's list does not reach now THROWS with a message naming the account, where v1 left the name absent                           |
| a bare address                                                              | the same                                                                                                                                                                                       | same                                                                                                                                                    |
| the name of another named account                                           | the same                                                                                                                                                                                       | same; a name that is not in `accounts`, or a reference cycle, is refused with a message naming it                                                       |
| a per-network map (`{default: 1, sepolia: '0x...'}`)                        | the same, keyed by environment name or chain id, then `default`                                                                                                                                | same                                                                                                                                                    |
| `null` for a network (`{default: 2, mainnet: null}`)                        | the same: the name is ABSENT on that network, and TypeScript types it as possibly `undefined`                                                                                                  | same. Only an explicit `null` means absent: a name with no entry for the network and no `default` refuses to start with `cannot get account for <name>` |
| `privatekey://0x...`                                                        | `privateKey:0x...`, with the `privateKey` protocol from `@rocketh/signer` registered in `signerProtocols`                                                                                      | same, renamed (`://` becomes `:`)                                                                                                                       |
| `ledger://...`, `trezor://...`                                              | nothing bundled                                                                                                                                                                                | not supported. The `signerProtocols` seam remains, for a protocol you write yourself                                                                    |
| `external://0x...` (v1 then prompted for the transaction hash)              | the plain address. An address rocketh cannot sign for is handled by the unknown-signer flow, which pauses, asks for the hash of the transaction you executed elsewhere, and checks it on chain | replaced, see [Handling unknown signers](../unknown-signers/)                                                                                           |
| `HARDHAT_DEPLOY_ACCOUNTS_NETWORK` (override which network key is looked up) | nothing                                                                                                                                                                                        | not supported                                                                                                                                           |
| automatic impersonation on the `hardhat` network, `--no-impersonation`      | `autoImpersonate` per chain and per run, with no CLI flag                                                                                                                                      | same, minus the flag                                                                                                                                    |

```typescript
// rocketh/config.ts
import type {UserConfig} from 'rocketh/types';
import {privateKey} from '@rocketh/signer';

export const config = {
	accounts: {
		deployer: 0,
		// v1: `privatekey://0x...`
		relayer: {default: 1, sepolia: `privateKey:${process.env.RELAYER_PRIVATE_KEY}`},
		// v1 `null`: this account does not exist on mainnet
		faucetOwner: {default: 2, mainnet: null},
	},
	data: {},
	signerProtocols: {privateKey},
} as const satisfies UserConfig;
```

Unnamed accounts (`getUnnamedAccounts()`) are `env.unnamedAccounts`: same.

## Proxies {#proxies}

::: warning Three built-in proxy names changed, and the mistake surfaces late

| v1 `proxyContract`             | rocketh `proxyContract`                   |
| ------------------------------ | ----------------------------------------- |
| `EIP173Proxy` (the v1 default) | `ERC173Proxy` (the rocketh default)       |
| `EIP173ProxyWithReceive`       | `ERC173ProxyWithReceive`                  |
| `UUPS`                         | `UUPS`                                    |
| `OpenZeppelinTransparentProxy` | `SharedAdminOpenZeppelinTransparentProxy` |
| `OptimizedTransparentProxy`    | `SharedAdminOptimizedTransparentProxy`    |

The set is CLOSED: those five names and nothing else. TypeScript rejects a v1 name in a typed deploy script, but the check that always applies happens at deploy-script RUN time, where a name outside the set throws `unknown proxy contract <name>`. And a port that drops the option altogether gets the default, `ERC173Proxy`, deployed without complaint: for a v1 transparent or UUPS proxy that is a different contract, with no ProxyAdmin.
:::

A v1 `deploy(name, {..., proxy})` becomes `deployViaProxy(name, {account, artifact, args}, options)` from `@rocketh/proxy`: the contents of `proxy` move into the third argument, `options`. The option names map like this:

| v1 `proxy` option                                           | rocketh `deployViaProxy` option                                               |                                                                                                                                  |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `proxy: true`                                               | `deployViaProxy` with no options                                              | same                                                                                                                             |
| `proxy: 'methodName'`, or `methodName`                      | `execute: 'methodName'`                                                       | same, renamed                                                                                                                    |
| `execute: {methodName, args}`                               | `execute: {methodName, args}`                                                 | same                                                                                                                             |
| `execute: {init, onUpgrade}`                                | `execute: {init, onUpgrade}`                                                  | same; `init` and `onUpgrade` may also be a bare method name                                                                      |
| `owner`                                                     | `owner`                                                                       | same, defaulting to the deploying account as in v1                                                                               |
| `proxyContract: '<built-in name>'`                          | `proxyContract: '<rocketh name>'`                                             | same, RENAMED: see the warning above                                                                                             |
| `proxyContract: '<your artifact name>'`, with `proxyArgs`   | `proxyContract: {type: 'custom', artifact, args}`                             | same, with the artifact passed explicitly; `args` takes the `proxyArgs` template (`'{implementation}'`, `'{admin}'`, `'{data}'`) |
| `viaAdminContract: 'DefaultProxyAdmin'`                     | implied by the two `SharedAdmin*` names                                       | same                                                                                                                             |
| `viaAdminContract: 'MyAdmin'` (a deployment name)           | `proxyContract: {type: 'SharedAdmin...', proxyAdminName: 'MyAdmin'}`          | same. An existing deployment under that name is used as-is                                                                       |
| `viaAdminContract: {name, artifact}`                        | `proxyAdminName` plus `proxyAdminArtifact` on the same `proxyContract` object | same, on the two `SharedAdmin*` kinds and on `{type: 'custom', ...}`                                                             |
| `upgradeFunction: {methodName, upgradeArgs}`                | `upgradeFunction: {methodName, args}`                                         | same, the template key renamed; it accepts only the placeholders `'{proxy}'`, `'{implementation}'`, `'{data}'`, `'{admin}'`      |
| `upgradeIndex`                                              | `upgradeIndex`                                                                | same, decided on the record's `numDeployments` alone (rocketh keeps no `history`)                                                |
| `checkABIConflict`, `checkProxyAdmin`                       | the same                                                                      | same                                                                                                                             |
| `implementationName`                                        | nothing: the implementation is always recorded as `<name>_Implementation`     | not supported                                                                                                                    |
| a pre-EIP-173 proxy upgraded through `changeImplementation` | nothing                                                                       | not supported                                                                                                                    |

Before and after, for a transparent proxy whose admin is your own contract and whose upgrade entry point is not one rocketh picks by itself:

```typescript
// v1
await deploy('Registry', {
	from: deployer,
	args: ['hello'],
	proxy: {
		owner: admin,
		proxyContract: 'OpenZeppelinTransparentProxy',
		viaAdminContract: {name: 'RegistryAdmin', artifact: 'RegistryAdmin'},
		upgradeFunction: {methodName: 'upgradeProxy', upgradeArgs: ['{proxy}', '{implementation}', '{data}']},
		execute: {methodName: 'postUpgrade', args: ['hello']},
	},
});
```

```typescript
// v2
await deployViaProxy(
	'Registry',
	{account: deployer, artifact: artifacts.Registry, args: ['hello']},
	{
		owner: admin,
		proxyContract: {
			type: 'SharedAdminOpenZeppelinTransparentProxy',
			proxyAdminName: 'RegistryAdmin',
			proxyAdminArtifact: artifacts.RegistryAdmin,
		},
		upgradeFunction: {methodName: 'upgradeProxy', args: ['{proxy}', '{implementation}', '{data}']},
		execute: {methodName: 'postUpgrade', args: ['hello']},
	},
);
```

One field a consumer may have read is missing from the proxy deployment: v1 stored `implementation: <address>` on the `<name>` record, and rocketh does not (the implementation is its own `<name>_Implementation` deployment, and rocketh reads the proxy's EIP-1967 slot when it needs the live value). **Not supported yet.** See [Deploying proxies](../deploying/#deploying-proxies) for the rest of `deployViaProxy`.

## `catchUnknownSigner` in a migrated script {#catch-unknown-signer}

`deployments.catchUnknownSigner` is `catchUnknownSigner` from `@rocketh/unknown-signer`, and it returns v1's shape: `null` when the action went through, otherwise `{from, to, value, data}` with every key present and `value` as a string. Three things are worth knowing before you port a script that uses it.

**The action is a function, not a promise.** v1's `catchUnknownSigner(execute(...))` becomes `catchUnknownSigner(() => execute(...))`. This is the one mechanical change. A promise has already started running by the time the wrapper receives it, so there is no moment left at which to establish the policy the wrapped call runs under. Forgetting the arrow is a LOUD error, not a wrapper that quietly fails to defer: TypeScript rejects it, and a JavaScript caller gets a runtime error that names the fix (`Wrap the call in an arrow function: ...`).

```typescript
// v1
await catchUnknownSigner(execute('Registry', {from: admin}, 'setFee', 5));

// v2
await catchUnknownSigner(() => execute(registry, {account: admin, functionName: 'setFee', args: [5n]}));
```

**Wrapping a call means accepting that the step did not happen.** When the wrapper catches, the step was NOT executed, and your script carries on anyway. Anything later in the same script that depends on that step must check the chain before it acts, or must not be there. rocketh unwinds only the wrapped action: `deployViaProxy`'s own post-upgrade `execute` / `onUpgrade` call is part of that action, so it is safe automatically; your NEXT statement is not. This was equally true in v1; it was simply never written down. A [guard](../execute-guard/) on a later `execute` is how you state the chain check.

**Nothing is persisted.** No unsigned-transactions file, and no change to any deployment. The only thing that tells a later run the step is done is the chain, so the flow is the v1 flow: execute the printed transaction on the Safe, then re-run the script. That is also why a [run-once script](../script-lifecycle/#never-return-true-on-a-path-where-a-step-was-deferred) must not reach `return true` on a path where a step was deferred.

The full behaviour, including the default interactive flow that makes the wrapper unnecessary for a new script, is in [Handling unknown signers](../unknown-signers/#deferring-instead-of-asking-catchunknownsigner).

## The `deployments` API

Every member of v1's `hre.deployments` (plus the other HRE additions), and where it went. In a deploy script, "the environment" is the object your function receives.

| v1                                                                                          | rocketh                                                                                                                         |                                                              |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `deploy(name, options)`                                                                     | `deploy(name, {account, artifact, args}, options)` from `@rocketh/deploy`; proxies moved to `deployViaProxy`                    | same, split in two                                           |
| `diamond.deploy(name, options)`                                                             | `diamond(name, {account}, options)` from `@rocketh/diamond`                                                                     | same, see [Diamonds](#diamonds)                              |
| `deterministic(name, options)`: the create2 address BEFORE deploying                        | nothing: `deploy` with `deterministic` broadcasts                                                                               | not supported yet                                            |
| `fetchIfDifferent(name, options)`                                                           | nothing public; `deploy` still makes the same comparison internally before deciding to redeploy                                 | not supported                                                |
| `readDotFile`, `saveDotFile`, `deleteDotFile`                                               | nothing                                                                                                                         | not supported                                                |
| `save(name, deployment)`                                                                    | `save` on the environment                                                                                                       | same                                                         |
| `delete(name)`                                                                              | nothing                                                                                                                         | not supported                                                |
| `get`, `getOrNull`                                                                          | the same, on the environment                                                                                                    | same                                                         |
| `all()`                                                                                     | `deployments` on the environment                                                                                                | same                                                         |
| `getDeploymentsFromAddress(address)`                                                        | `fromAddressToNamedABI` / `fromAddressToNamedABIOrNull`: the names and their MERGED ABI, not the deployments                    | replaced                                                     |
| `getArtifact`, `getExtendedArtifact` (look an artifact up by name at run time)              | import the generated, typed artifact: `artifacts.MyContract`                                                                    | replaced: the typed import is where your ABI types come from |
| `run(tags, options)`                                                                        | `loadAndExecuteDeploymentsFromFiles({provider, tags})` from your `rocketh/environment.ts`                                       | same                                                         |
| `fixture(tags)`, `createFixture(fn)`                                                        | hardhat 3's `networkHelpers.loadFixture(fn)`, over a function that calls `loadAndExecuteDeploymentsFromFiles({provider, tags})` | replaced, see [Testing](../testing/)                         |
| `log(...)` (prints only when logging is on)                                                 | `showMessage` on the environment always prints; verbosity is set for the whole run                                              | replaced                                                     |
| `getNetworkName()`                                                                          | `name` on the environment; on a fork, `network.fork` says what is simulated                                                     | same                                                         |
| `getGasUsed()`                                                                              | nothing a script can read; the run prints its total gas when gas reporting is on                                                | not supported                                                |
| `execute(name, options, method, ...args)`                                                   | `execute(deployment, {account, functionName, args})`, or `executeByName`                                                        | same                                                         |
| `rawTx(tx)`                                                                                 | `tx` from `@rocketh/read-execute`                                                                                               | same                                                         |
| `read(...)`                                                                                 | `read(deployment, {functionName, args})`, or `readByName`                                                                       | same                                                         |
| `catchUnknownSigner(action)`                                                                | `catchUnknownSigner(() => action)` from `@rocketh/unknown-signer`                                                               | same, with a thunk: see [above](#catch-unknown-signer)       |
| `getSigner(address)` (an ethers `Signer`)                                                   | viem clients from `@rocketh/viem` (`viem.walletClient`, `viem.getWritableContract(...)`); rocketh has no ethers dependency      | replaced                                                     |
| `getNamedAccounts()`, `getUnnamedAccounts()`                                                | `namedAccounts`, `unnamedAccounts` on the environment                                                                           | same                                                         |
| `getChainId()` (a decimal string)                                                           | `network.chain.id` on the environment (a number)                                                                                | same                                                         |
| `companionNetworks` (a second network's deployments, accounts and provider, inside one run) | nothing                                                                                                                         | not supported                                                |

## Deploy and transaction options

| v1 option                                                | rocketh                                                                               |                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `from`                                                   | `account`, in the first object                                                        | same, renamed                                                           |
| `args`                                                   | `args`, typed from the artifact                                                       | same                                                                    |
| `contract` (an artifact by name, or inline)              | `artifact: artifacts.Name`, always explicit                                           | replaced                                                                |
| `skipIfAlreadyDeployed`, `linkedData`, `libraries`       | the same, in the options (third argument)                                             | same; `libraries` next to `args` does not compile                       |
| `deterministicDeployment: true \| salt`                  | `deterministic: true \| salt \| {type: 'create2' \| 'create3', salt}`, in the options | same, and wider                                                         |
| `gasLimit`                                               | `gas`                                                                                 | same, renamed                                                           |
| `maxFeePerGas`, `maxPriorityFeePerGas`, `value`, `nonce` | the same                                                                              | same                                                                    |
| `gasPrice` (legacy, pre-EIP-1559 transactions)           | nothing: every transaction rocketh builds is EIP-1559                                 | not supported yet. A chain without EIP-1559 cannot be deployed to today |
| `customData`                                             | nothing                                                                               | not supported                                                           |
| `log`                                                    | nothing per call; verbosity is run-level (`--log-level` on the `rocketh` CLI)         | not supported per call                                                  |
| `autoMine`                                               | `autoMine` per chain in `rocketh/config.ts`, or per run                               | not supported per call                                                  |
| `waitConfirmations`                                      | `confirmationsRequired` per chain in `rocketh/config.ts`                              | not supported per call                                                  |
| `estimatedGasLimit`, `estimateGasExtra`                  | nothing                                                                               | not supported                                                           |

## Diamonds {#diamonds}

`diamond.deploy` is `diamond` from `@rocketh/diamond`. `facets` are artifact objects rather than names; `facetsArgs`, `excludeSelectors`, `defaultCutFacet`, `defaultOwnershipFacet`, `owner`, `execute`, `deterministicSalt`, `diamondContractArgs`, `libraries` and `linkedData` carry over. `execute` still rides every cut, as in v1, and there is no `{init, onUpgrade}` split for diamonds. Not supported: `diamondContract` (replacing the base diamond artifact), and cutting a diamond deployed by an older hardhat-deploy through its legacy base. `upgradeIndex` is not accepted by `diamond` today: unlike `deployViaProxy`, it has no ordered-upgrade guard.

## Tags, dependencies, run-once scripts

| v1                                                    | rocketh                                                                    |                                                 |
| ----------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------- |
| `func.tags`, `func.dependencies`, `func.runAtTheEnd`  | `{tags, dependencies, runAtTheEnd}`, the second argument of `deployScript` | same                                            |
| `func.id` plus `return true`                          | `{id}`, plus `return true`                                                 | same: a [run-once script](../script-lifecycle/) |
| `func.skip`                                           | IGNORED, see [above](#a-v1-skip-export-is-ignored)                         | replaced by an early `return`                   |
| `--tags a,b` (scripts carrying ANY of them)           | the same                                                                   | same                                            |
| `--tags-require-all`                                  | nothing                                                                    | not supported                                   |
| a script failure wrapped as `ERROR processing <path>` | the script's own error, unwrapped                                          | not supported                                   |

## Networks, the CLI and environment variables

rocketh's hardhat 3 plugin registers one task, `deploy`; the standalone `rocketh` CLI does the same job outside hardhat.

| v1                                                                                                            | rocketh                                                                                                        |                                                                          |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `deploy --tags`, `--reset`, `--no-compile`                                                                    | the same (`--reset` asks for confirmation)                                                                     | same                                                                     |
| `deploy --write`, `--deploy-scripts`                                                                          | `--save-deployments`; `scripts` in `rocketh/config.ts` (or `--scripts` on the `rocketh` CLI)                   | same, renamed                                                            |
| `deploy --silent`                                                                                             | `--log-level` on the `rocketh` CLI                                                                             | same, renamed                                                            |
| `deploy --report-gas`                                                                                         | `--report-gas-used` on `hardhat deploy`; on by default on the `rocketh` CLI (`--skip-gas-report` turns it off) | same                                                                     |
| `deploy --pendingtx`                                                                                          | pending transactions are always recorded when deployments are saved                                            | replaced                                                                 |
| `deploy --gasprice`, `--maxfee`, `--priorityfee` (run-wide fee defaults)                                      | nothing; per-call fee options remain                                                                           | not supported                                                            |
| `deploy --export`, `--export-all`                                                                             | nothing inside the deploy run: run `rocketh-export -e <environment>` after the deploy                          | not supported                                                            |
| `deploy --watch`, `--watch-only`                                                                              | nothing                                                                                                        | not supported                                                            |
| `deploy --no-impersonation`                                                                                   | `autoImpersonate: false` per chain or per run                                                                  | not supported as a flag                                                  |
| the `node` task override (start a node, copy a network's deployments into `localhost`, deploy, watch)         | nothing                                                                                                        | not supported                                                            |
| `test --deploy-fixture`                                                                                       | `networkHelpers.loadFixture` in the test                                                                       | replaced                                                                 |
| `export`                                                                                                      | `rocketh-export -e <environment>` from `@rocketh/export` (ts, js, json and module forms)                       | same, see [Exporting](../exporting-and-verifying/#exporting-deployments) |
| `export --export-all` (every network in one file)                                                             | nothing: one environment per export                                                                            | not supported                                                            |
| `etherscan-verify`, `sourcify`                                                                                | `rocketh-verify` from `@rocketh/verifier` (Etherscan, Sourcify, and Blockscout)                                | same, minus the `solcInput` fallback and the `--write-post-data` dump    |
| `export-artifacts`, `external.contracts`, `external.deployments`                                              | publish the project as a package                                                                               | replaced, see [below](#consuming-another-project)                        |
| `paths.imports`                                                                                               | import the artifacts                                                                                           | replaced                                                                 |
| `HARDHAT_DEPLOY_LOG`, `_FIXTURE`, `_EXPORT`, `_EXPORT_ALL`, `_NO_IMPERSONATION`, `_ACCOUNTS_NETWORK`, `_FORK` | only `HARDHAT_FORK` survives, in the hardhat helper; the rest have no environment-variable form                | not supported                                                            |
| network `live`                                                                                                | nothing built in: declare a `live` tag per chain                                                               | replaced, see below                                                      |
| network `tags`, `saveDeployments`, `deploy` (per-network script folders)                                      | `chains[id].tags`; `saveDeployments`; `environments[name].scripts`                                             | same                                                                     |
| `deterministicDeployment` config                                                                              | per chain, for create2 and create3                                                                             | same, and wider                                                          |
| zkSync (`zksync`, `factoryDeps`)                                                                              | nothing                                                                                                        | not supported                                                            |

**`network.live` has no built-in equivalent.** rocketh's only default tag is `testnet`, for a chain its chain information marks as a testnet. Declare `live` yourself for every chain you deploy to for real, and read it as `env.tags['live']`; declaring `tags` for a chain replaces its default tags, so list `testnet` again where a script relies on it. The [migration guide](/hardhat-deploy/documentation/how-to/migration-from-v1/#step-4-convert-deploy-scripts) shows the config.

## The deployment files

rocketh writes one JSON file per deployment, per environment, as v1 did. A tool that READS those files (a frontend, a script, an indexer) may be reading a field that changed:

| v1 field                                                                                                                                | rocketh                                                                          |                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `args` (the decoded constructor arguments)                                                                                              | `argsData`: the encoded arguments                                                | replaced; decode it with the ABI if you need the values |
| `transactionHash`                                                                                                                       | `transaction.hash`                                                               | same, moved                                             |
| `receipt` (the whole receipt: `gasUsed`, logs, ...)                                                                                     | `receipt` with `blockHash`, `blockNumber` and `transactionIndex` only            | not supported                                           |
| `history` (every previous version)                                                                                                      | nothing; `numDeployments` counts them                                            | not supported                                           |
| `implementation` (on a proxy)                                                                                                           | nothing, see [Proxies](#proxies)                                                 | not supported yet                                       |
| `solcInputHash` and the `solcInputs/` folder                                                                                            | nothing: the metadata carries the sources, and that is what verification submits | not supported                                           |
| `methodIdentifiers`                                                                                                                     | nothing                                                                          | not supported                                           |
| `numDeployments`, `metadata`, `bytecode`, `deployedBytecode`, `libraries`, `linkedData`, `devdoc`, `userdoc`, `storageLayout`, `facets` | the same                                                                         | same                                                    |
| `gasEstimates`                                                                                                                          | under `evm.gasEstimates`                                                         | same, moved                                             |
| the `.chainId` file                                                                                                                     | `.chain`, holding the chain id and the genesis hash                              | same, and stricter                                      |

## Consuming another project's contracts and deployments {#consuming-another-project}

v1 let a project read another project's artifacts (`external.contracts`, `export-artifacts`), run its deploy scripts, and see its deployments (`external.deployments`). rocketh has none of those config keys: **the other project is an npm package, and you depend on it.**

The project being consumed publishes itself, with an `exports` map in its `package.json` exposing its generated artifacts, its deployment files, and its deploy scripts compiled to JavaScript (with `tsc`, plus `tsc-alias` if the scripts use path aliases). The paths are that project's own; the shape is:

```json
{
	"name": "my-protocol-contracts",
	"exports": {
		"./artifacts": "./generated/artifacts/index.js",
		"./deployments/*": "./deployments/*",
		"./deploy/*": "./dist/deploy/*"
	},
	"files": ["dist", "generated", "deployments"]
}
```

The consuming project adds it as a dependency, then:

- imports its artifacts like any module (`import * as protocol from 'my-protocol-contracts/artifacts'`), which replaces `external.contracts.artifacts` and `export-artifacts`;
- lists its compiled deploy scripts before its own in `rocketh/config.ts`, so they run inside your run and their `tags` and `dependencies` join yours, which replaces `external.contracts.deploy`:

  ```typescript
  export const config = {
  	accounts: {deployer: 0},
  	data: {},
  	scripts: ['node_modules/my-protocol-contracts/dist/deploy', 'deploy'],
  } as const satisfies UserConfig;
  ```

- reads its published deployment files as ordinary JSON, which replaces `external.deployments`.

## When there is no answer

Everything marked **not supported** above was decided, and the table is where to find out before you start rather than half way through a port. If something your project depends on is marked **not supported yet**, the practical choice today is to keep that part on v1 (see [When to stay on v1](/hardhat-deploy/documentation/how-to/migration-from-v1/#when-to-stay-on-v1)) or to work around it in your own deploy script. If you depend on something this page marks **not supported** and you think it should be, open an issue on the [rocketh repository](https://github.com/wighawag/rocketh/issues) and describe what your scripts do with it.
