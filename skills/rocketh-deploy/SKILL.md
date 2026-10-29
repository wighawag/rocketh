---
name: rocketh-deploy
description: 'Deploy with rocketh or hardhat-deploy v2: a project with a `rocketh/config.ts`, `deployScript` files, or `rocketh` or `hardhat-deploy` ^2 in package.json (the Hardhat flavor of Scaffold-ETH 2 included). Use when writing or changing a deploy script; when running or re-running a deployment on a network; when upgrading a contract behind a proxy or a diamond; when a step must run once; when verifying or exporting deployments afterwards.'
metadata:
  rocketh: '>=0.26.2'
---

# Deploying with rocketh and hardhat-deploy v2

rocketh runs a project's deploy scripts and records what they deployed. `hardhat deploy` (hardhat-deploy v2) runs the same scripts through the same executor, so every rule below holds under both ([The same run with the `rocketh` command](https://rocketh.dev/hardhat-deploy/deploy-task/#the-same-run-with-the-rocketh-command)). What differs between the two setups (the command line, where a network's endpoint and keys are configured, how the finished check is run) is in one reference per setup. Read the one the project uses before running anything:

- `hardhat.config.ts` lists hardhat-deploy among its plugins: [references/hardhat-deploy.md](references/hardhat-deploy.md).
- The project runs the `rocketh` command without Hardhat: [references/rocketh-cli.md](references/rocketh-cli.md).

The documentation at rocketh.dev says what each function and option does; this skill carries the decisions, each tied to the page that makes it true.

## First, the version

This skill was written against `rocketh` 0.26.2 (`metadata.rocketh` above). Read the version the project installed (`node_modules/rocketh/package.json`). When it is older, tell the user, and read the documentation in the repository at the tag `rocketh@<installed version>` (`https://github.com/wighawag/rocketh/tree/rocketh@<installed version>`, folders `documentation/` and `hardhat-deploy/`) instead of rocketh.dev, which follows the latest code.

## Where addresses and secrets come from

**Addresses come from deployment records and named accounts.** A contract a script deployed is recorded in `deployments/<environment>/<Name>.json` and read back with `get('Name')`, which throws when the record is absent ([Reading records](https://rocketh.dev/documentation/deployment-records/#reading-records)). An account is a name in `rocketh/config.ts`, resolved per environment: an index of the node's accounts, an address, or a signer protocol ([What a definition can be](https://rocketh.dev/documentation/named-accounts/#what-a-definition-can-be)). When the user gives you an address (a treasury, a Safe), put it in the config under that environment and read it as a named account; a script names no address of its own.

<!-- fixture: rocketh-deploy/rocketh/config.ts -->

```ts
// rocketh/config.ts
import type {UserConfig} from 'rocketh/types';

import * as deployExtension from '@rocketh/deploy';
import * as readExecuteExtension from '@rocketh/read-execute';

export const config = {
	accounts: {
		deployer: 0,
		// the node's second account on a dev chain, a fixed address on mainnet
		treasury: {default: 1, mainnet: '0x2222222222222222222222222222222222222222'},
	},
	data: {},
} as const satisfies UserConfig;

export const extensions = {
	...deployExtension,
	...readExecuteExtension,
};

export type Extensions = typeof extensions;
export type Accounts = typeof config.accounts;
export type Data = typeof config.data;
```

**Keys and RPC URLs come from the environment, and you never handle them.** On a real network, a run that cannot resolve an account stops before any script and says what to set ([Named accounts on a real network](https://rocketh.dev/documentation/named-accounts/#named-accounts-on-a-real-network)); which variable holds each endpoint and key depends on the setup, and its reference says. When a run stops because one is missing, name the variable to the user and let them set it. Hard guardrail: never read, print, write or ask for a private key, a mnemonic or an RPC URL carrying a token; refer to it by its variable name.

`linkedData` is public: it is copied into every export and so into the frontend that ships it. Put a prefix, an admin address or a start block there, never a secret ([`linkedData` is public](https://rocketh.dev/documentation/exporting-and-verifying/#linkeddata-is-public)).

## Writing a deploy script

The target: running a script twice leaves the chain as running it once would ([A script must be safe to re-run](https://rocketh.dev/documentation/deploy-scripts/#a-script-must-be-safe-to-re-run)). For each step, ask what on chain shows it is done, not what was recorded.

- `deploy`, from `@rocketh/deploy`, compares the recorded code and constructor arguments with the ones asked for, metadata ignored, and redeploys only when they differ ([When does a re-run redeploy?](https://rocketh.dev/documentation/deploy-contracts/#when-does-a-re-run-redeploy)). Leave that comparison to it: a script needs no "already deployed?" check of its own.
- `execute`, from `@rocketh/read-execute`, sends on every run. Give each `execute` a `guard`: the on-chain read that says whether the call is still needed. rocketh reads it before building the call and skips the call when the chain already says so ([Guarding execute calls](https://rocketh.dev/documentation/execute-guard/)). A guard is what lets a privileged call _converge_.

<!-- fixture: rocketh-deploy/deploy/01_token.ts -->

```ts
// deploy/01_token.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		// on a re-run, `deploy` compares the code and the arguments with the record: same, nothing sent
		await deploy('Token', {account: deployer, artifact: artifacts.Token, args: [deployer, 1_000_000n]});
	},
	{tags: ['Token']},
);
```

<!-- fixture: rocketh-deploy/deploy/02_registry.ts -->

```ts
// deploy/02_registry.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, execute, namedAccounts}) => {
		const {deployer} = namedAccounts;

		const registry = await deploy('Registry', {account: deployer, artifact: artifacts.Registry, args: [deployer]});

		// `execute` sends on every run unless a guard says what on chain shows it is done
		await execute(registry, {
			account: deployer,
			functionName: 'setValue',
			args: [42n],
			guard: {kind: 'call', functionName: 'value', equals: 42n},
		});
	},
	{tags: ['Registry']},
);
```

A script that branches on the network reads `env.tags`, which come from `chains[<id>].tags` in the config. There is no built-in `live` or `local` tag: a chain marked as a testnet gets `testnet`, any other chain gets none, so `env.tags['live']` is absent until the config declares it ([Tags](https://rocketh.dev/documentation/environments/#tags)). Declare every tag a script reads.

`dependencies` lists tags. A tag no script carries is ignored without a word, so check each one against a script's `tags` ([Dependencies](https://rocketh.dev/documentation/deploy-scripts/#dependencies-running-another-script-first)).

## A step that must run once

A script with an `id` that returns `true` is recorded in `deployments/<environment>/.migrations.json`, and every later run on that environment skips it, as a whole, before calling it ([A script that returns `true` is never run again](https://rocketh.dev/documentation/script-lifecycle/#a-script-that-returns-true-is-never-run-again)). Make a script _run-once_ only for a genuine one-off, a step nothing on chain can confirm (a transfer, a seed); anything a read can confirm takes a `guard` instead.

`return true` asserts that everything in the script happened, so it is the last line, reached only after every step landed. Up to that point the script stays safe to re-run in full: a run that stops before it records nothing, and the next run starts the script from the top, never halfway ([It is a fast path, not what makes a re-run safe](https://rocketh.dev/documentation/script-lifecycle/#it-is-a-fast-path-not-what-makes-a-re-run-safe)). The `id` is the identity: changing it runs the script again.

<!-- fixture: rocketh-deploy/deploy/03_fund_treasury.ts -->

```ts
// deploy/03_fund_treasury.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({execute, get, namedAccounts}) => {
		const {deployer, treasury} = namedAccounts;

		// the address comes from the record `01_token.ts` saved, the recipient from a named account
		const token = get<typeof artifacts.Token.abi>('Token');

		// a one-off: the treasury's balance moves later, so nothing on chain says this transfer happened
		await execute(token, {account: deployer, functionName: 'transfer', args: [treasury, 100_000n]});

		return true; // reached only once the transfer landed: the whole script is recorded as done
	},
	{id: 'fund_treasury', tags: ['FundTreasury'], dependencies: ['Token']},
);
```

## Upgrading a contract

An upgrade is a re-run. Change the contract, compile, and run the same script again: `deployViaProxy`, from `@rocketh/proxy`, deploys the new implementation and upgrades the proxy only when the implementation changed ([Upgrading](https://rocketh.dev/documentation/proxies/#upgrading)). The script keeps its deployment name; an upgrade needs no new script. Who sends the upgrade, what `execute` calls on it, and an upgrade story kept with `upgradeIndex` are in [references/proxies.md](references/proxies.md); a diamond, whose upgrade removes whatever its declared facets no longer produce, is in [references/diamonds.md](references/diamonds.md).

rocketh does not check that the new implementation's storage layout is compatible with the old one: it compares the implementation address in the proxy's EIP-1967 slot and sends the upgrade when it differs, and a diamond cut compares selectors and facets the same way (same section). Before an upgrade on a live network, compare the old and new `storageLayout` (storage variables may only be appended) and tell the user what you found, then _rehearse_ the upgrade on a fork (next section).

## When rocketh cannot sign, or a change should be rehearsed first

A step whose `account` is an address rocketh cannot sign for (a Safe, a multisig, a timelock, a governor) is _unsignable_. At that step rocketh either pauses, printing `Unknown signer for account 0x…` and the transaction to execute, or throws `UnknownSignerError` (no terminal, `--skip-prompts`, or `--on-unknown-signer throw`). A thrown step is _deferred_: it did not happen, nothing after it in the run happened, and the deployment is not finished ([Handling unknown signers](https://rocketh.dev/documentation/unknown-signers/), [In CI it does not hang, it throws](https://rocketh.dev/documentation/unknown-signers/#in-ci-it-does-not-hang-it-throws)). Report it to the user as not done, with the transaction rocketh printed.

Then continue with the skill `rocketh-safe-owned-changes`; when it is not installed, read it from https://rocketh.dev/skills/rocketh-safe-owned-changes/SKILL.md. Go there too before a deployment or an upgrade on a live network that should be rehearsed on a fork first, which includes every proxy upgrade ([Upgrading](https://rocketh.dev/documentation/proxies/#upgrading)). Hard guardrail: at a pause, the transaction hash is the user's to paste, after they executed the transaction themselves; never type a hash in.

## Running and re-running

Re-running is how a deployment finishes and how an upgrade happens. A second run is not a recovery: it reads the records and the chain, and sends only what is still needed ([Running once, and running last](https://rocketh.dev/documentation/script-lifecycle/)). A run that stopped halfway is finished by running the same scripts again, unchanged.

**The user says yes to the environment and the chain.** Before any run on a network other than hardhat's in-memory one, tell the user the environment and the chain it is, and wait for their yes. rocketh asks as well: it prints the environment, its chain and its tags, then the gas prices, and asks whether to proceed ([Before the run: the confirmation](https://rocketh.dev/documentation/reference/cli/#before-the-run-the-confirmation)). Run it where the user can answer, or, once they said yes to this environment and this chain, add `--skip-prompts`. Without a terminal the run stops with an error naming `--skip-prompts`: that error is a question for the user, not a flag to add on your own. The one exception is a run with `--is-fork` against a fork node the user or you started on this machine: it writes nothing back and sends nothing to the live network, so it may take `--skip-prompts` without asking ([A Safe-owned project, step 4](https://rocketh.dev/documentation/safe-owned-project/#4-rehearse-on-a-fork), [A fork does not save](https://rocketh.dev/documentation/fork-runs/#a-fork-does-not-save-and-you-do-not-have-to-remember-that)). Never drop `--is-fork` from such a command; any run that can reach a live network still waits for the user's yes. The command that starts a run is in the setup's reference.

`--reset` deletes the environment's deployment records and its run-once ids, so the next run deploys everything again ([Where the record lives](https://rocketh.dev/documentation/script-lifecycle/#where-the-record-lives)). Run it only when the user asked for it; with `--skip-prompts` it deletes without asking.

**When it is finished.** On hardhat's in-memory network, which saves no records, the deployment is finished when the run succeeds. On a live network it is finished when a re-run of the same scripts on a fork of that network sends nothing. rocketh attaches to a fork, it does not start one, so the check needs a node that can fork the network, such as anvil ([From the command line: `--is-fork`](https://rocketh.dev/documentation/fork-runs/#from-the-command-line---is-fork)), and it writes what the re-run sent to a file, `[]` when it sent nothing ([Getting the list, as a file](https://rocketh.dev/documentation/captured-transactions/#getting-the-list-as-a-file)). The commands for the project's setup are in its reference. The file holding `[]` is done; delete it and stop the fork node afterwards. The check holds only when every privileged `execute` has a `guard`: an unguarded one sends on every run, so the re-run is never empty. Anything else it lists is a step not yet done: say which, and re-run against the network once the user agrees. Without a node that can fork, tell the user the check could not be made.

## Verifying and exporting afterwards

Both commands read the deployment records, so they run after `hardhat deploy` or `rocketh` alike, from any checkout that has `deployments/` ([Exporting, verifying and documenting](https://rocketh.dev/documentation/exporting-and-verifying/)).

```bash
npx rocketh-verify -e sepolia etherscan
npx rocketh-export -e sepolia --ts ./src/contracts.ts --verify
```

`-e` comes before the explorer, and the Etherscan key is `ETHERSCAN_API_KEY` from the environment (`.env` or `.env.local`), under the same guardrail as every other secret ([Contract Verification](https://rocketh.dev/documentation/exporting-and-verifying/#contract-verification)). `rocketh-export` alone makes no network request: it cannot tell a stale record or a reset chain from a live one. Pass `--verify` when the export is for an app that will use it, so the chain id and the code at every address are checked first ([Checking the export against the chain](https://rocketh.dev/documentation/exporting-and-verifying/#checking-the-export-against-the-chain---verify)).

## What rocketh does not do

The failures come from assuming one of these is there:

- **No built-in `live` tag**, nor `local`: a chain's tags are the ones its config declares ([Tags](https://rocketh.dev/documentation/environments/#tags)).
- **No storage-layout check on an upgrade**, through a proxy or a diamond cut ([Upgrading](https://rocketh.dev/documentation/proxies/#upgrading)).
- **No chain access in `rocketh-export` without `--verify`** ([Checking the export against the chain](https://rocketh.dev/documentation/exporting-and-verifying/#checking-the-export-against-the-chain---verify)).
- **No check on `execute`** without a `guard`: it sends on every run ([Guarding execute calls](https://rocketh.dev/documentation/execute-guard/)).
- **No check that a dependency exists** ([Dependencies](https://rocketh.dev/documentation/deploy-scripts/#dependencies-running-another-script-first)).
- **No fork of its own**: it attaches to a node that forked the network ([rocketh attaches to a fork](https://rocketh.dev/documentation/fork-runs/#rocketh-attaches-to-a-fork-it-does-not-create-one)).

<!-- The scripts import `deployScript` and `artifacts` from the project's `rocketh/deploy.ts`, as in a real project; its fixture is rocketh-deploy/rocketh/deploy.ts. -->
