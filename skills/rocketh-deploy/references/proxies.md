# Upgrading a contract behind a proxy

Read this when a script calls `deployViaProxy`, from `@rocketh/proxy`, or the user wants a contract to be upgradeable. Before an upgrade on a live network, the storage-layout check in `SKILL.md` ("Upgrading a contract") applies first: rocketh does not make it.

## An upgrade is a re-run of the same script

Change the contract, compile, and run the same script again, with the same deployment name: `deployViaProxy` deploys the new implementation, upgrades the proxy at the same address, and keeps its storage ([Upgrading](https://rocketh.dev/documentation/proxies/#upgrading)). A new name, or a new script calling `deployViaProxy` for the same contract, deploys a second proxy with empty storage instead.

<!-- fixture: rocketh-deploy/upgrades/deploy/01_vault.ts -->

```ts
// deploy/01_vault.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		// the same name on every run: after Vault.sol changes, re-running this script upgrades the proxy
		await deployViaProxy(
			'Vault',
			{account: deployer, artifact: artifacts.Vault},
			{
				owner: admin, // sends every later upgrade
				execute: {
					init: {methodName: 'init', args: [admin]}, // on the first deployment only
					onUpgrade: {methodName: 'postUpgrade', args: []}, // on each upgrade, never on the first deployment
				},
			},
		);
	},
	{tags: ['Vault']},
);
```

The upgrade is sent from the account that holds the upgrade right: the proxy's `owner` (the deployer when none is given), or, behind a transparent proxy, the owner of its admin contract (`DefaultProxyAdmin` unless `proxyAdminName` names another) ([Choosing the proxy](https://rocketh.dev/documentation/proxies/#choosing-the-proxy)). Check who that is before the run. When it is an account rocketh cannot sign for, the upgrade is _unsignable_ and `SKILL.md` routes it to `rocketh-safe-owned-changes`.

The `Vault` record's `implementation` is the one the last completed run established, not a reading of the chain: after an upgrade a Safe has not executed yet, it still names the old one. When you report which implementation is live, read the proxy's EIP-1967 implementation slot ([Deploying behind a proxy](https://rocketh.dev/documentation/proxies/#deploying-behind-a-proxy)).

## State goes through `execute`, and each call has its moment

A constructor writes the implementation's storage, never the proxy's, so state the contract needs (an owner, a fee) is written by a call through the proxy: `execute` ([Initializing: `execute`, not the constructor](https://rocketh.dev/documentation/proxies/#initializing-execute-not-the-constructor)).

- Write the explicit form, `{init, onUpgrade}`, as above: `init` is made only when the proxy is first deployed, in that deployment, so nobody can initialize it first; `onUpgrade` only on an upgrade.
- The flat form (`execute: 'init'`) is made on the first deployment AND again on every upgrade. Use it only for a call that is safe to repeat.
- Without `onUpgrade`, an upgrade calls nothing. When a new version needs a migration step, add it as `onUpgrade` in the same change as the contract. It is made on every upgrade this script performs from then on, so the step must be safe to repeat, or be replaced by the next version's own step.
- The explicit form's type requires `init` even on a proxy that already exists; keep the original one there.

## An upgrade story: `upgradeIndex`

Most projects keep one `deployViaProxy` call with the current artifact. `upgradeIndex` is for a project that wants a fresh chain to replay every upgrade in order, so it keeps each version's artifact and one call per step ([An upgrade story kept forever](https://rocketh.dev/documentation/proxies/#an-upgrade-story-kept-forever-upgradeindex)).

<!-- fixture: rocketh-deploy/upgrades/deploy/02_counter.ts -->

```ts
// deploy/02_counter.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		// step 0, the original deployment: kept, so a fresh chain replays every step in order
		await deployViaProxy(
			'Counter',
			{account: deployer, artifact: artifacts.CounterV1},
			{owner: admin, upgradeIndex: 0, execute: {init: {methodName: 'init', args: [admin]}}},
		);

		// step 1, appended with the upgrade: the next index, and step 0 left exactly as it was
		await deployViaProxy(
			'Counter',
			{account: deployer, artifact: artifacts.CounterV2},
			{
				owner: admin,
				upgradeIndex: 1,
				execute: {init: {methodName: 'init', args: [admin]}, onUpgrade: {methodName: 'postUpgrade', args: []}},
			},
		);
	},
	{tags: ['Counter']},
);
```

The record's `numDeployments` counts the steps already run: a step whose index is below it is skipped without reading the chain, the step equal to it runs, and a step above it throws. So, in a script that uses it:

- An upgrade appends a call with the next index; earlier steps stay exactly as they are, since a fresh chain still runs them.
- Before adding `upgradeIndex` to a proxy that was already deployed or upgraded without it, read `numDeployments` in `deployments/<environment>/<Name>.json`: the step that runs is the one whose index equals it.

## What a run did

`deployViaProxy` returns the proxy's record, which has no `newlyDeployed`. To tell the user whether a run deployed, upgraded or did nothing, compare `implementation` in the record before and after the call ([Upgrading](https://rocketh.dev/documentation/proxies/#upgrading)).

<!-- The scripts import `deployScript` and `artifacts` from the miniature project's own `rocketh/deploy.ts` and `rocketh/config.ts` (fixtures rocketh-deploy/upgrades/rocketh/deploy.ts and rocketh-deploy/upgrades/rocketh/config.ts), which add `@rocketh/proxy` and `@rocketh/diamond` to the extensions. -->
