---
name: rocketh-safe-owned-changes
description: "Unsignable steps in a rocketh or hardhat-deploy v2 deployment. Use when a deploy script's step has a `from` rocketh cannot sign for (a named account that is a Safe, a multisig, a timelock, a governance contract or a hardware wallet); when a run paused at `Unknown signer for account`; when a run threw `UnknownSignerError`; when a privileged change (an upgrade, an ownership or role change, a parameter set by an owner) is to be rehearsed on a fork before it goes live."
metadata:
  rocketh: '>=0.26.2'
---

# Changes rocketh cannot sign for

A step is _unsignable_ when its `from` is an account rocketh holds no key for and the node does not sign for: a Safe, a timelock, a governance contract. That is the expected shape of a privileged change, not an error: rocketh builds the transaction, the account that holds the authority executes it, and the deployment finishes when a re-run finds nothing left to do ([Handling unknown signers](https://rocketh.dev/documentation/unknown-signers/)). This skill is the judgement around that loop; the pages it links hold the mechanics.

For everything that is not specific to an unsignable account (which network to touch, secrets, writing and re-running ordinary scripts), use the `rocketh-deploy` skill (`https://raw.githubusercontent.com/wighawag/rocketh/main/skills/rocketh-deploy/SKILL.md`).

## First: the version

This skill was written against `rocketh` `>=0.26.2` (its `metadata.rocketh`). Read the version the project has installed (`node_modules/rocketh/package.json`). When it is older, tell the user so, and read the documentation from the repository at the tag `rocketh@<installed version>` (`https://github.com/wighawag/rocketh/tree/rocketh@<installed version>/documentation`) instead of rocketh.dev, which follows the repository's `main` branch.

A script that already calls `catchUnknownSigner` (from `@rocketh/unknown-signer`) is a ported hardhat-deploy v1 script: its deferral comes back as a value and the script carries on, so it follows [`catchUnknownSigner` in a migrated script](https://rocketh.dev/hardhat-deploy/migration/#catch-unknown-signer), not the rules below. Write new steps on the native path this skill teaches.

## The project shape these rules assume

The Safe is a named account declared by its address; nothing else marks an account as external ([A Safe-owned project, step 1](https://rocketh.dev/documentation/safe-owned-project/#1-name-the-safe-before-it-exists)):

<!-- fixture: rocketh-safe-owned-changes/rocketh/config.ts -->

```ts
// rocketh/config.ts
import type {UserConfig} from 'rocketh/types';

import * as deployExtension from '@rocketh/deploy';
import * as readExecuteExtension from '@rocketh/read-execute';

export const config = {
	accounts: {
		deployer: 0,
		// the Registry's owner: a Safe, declared by address, an account rocketh cannot sign for
		admin: '0x5afe5afe5afe5afe5afe5afe5afe5afe5afe5afe',
	},
	environments: {
		mainnet: {
			// a hardhat fork reports chain 31337: this says what a fork of `mainnet` is a fork OF
			chain: 1,
			// on a fork the impersonated Safe sends its own calls: lend it their gas
			whenForked: {fundImpersonatedAccounts: true},
		},
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

The scripts import `deployScript` and `artifacts` from `rocketh/deploy.ts`, as in any rocketh project (the fixture's is `rocketh-safe-owned-changes/rocketh/deploy.ts`). The deployer deploys, and the Safe only becomes the owner: creating a contract owned by an account is not a call from that account.

<!-- fixture: rocketh-safe-owned-changes/deploy/01_registry.ts -->

```ts
// deploy/01_registry.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		// the deployer can sign: the Safe only becomes the owner
		await deploy('Registry', {account: deployer, artifact: artifacts.Registry, args: [admin]});
	},
	{tags: ['Registry']},
);
```

## Writing a step whose `from` is unsignable

The target: every privileged step can be re-run any number of times and sends its transaction only while its effect has not landed on chain.

- **A privileged `execute` carries a `guard`** that reads the effect on chain ([Guarding execute calls](https://rocketh.dev/documentation/execute-guard/)). rocketh never observes an out-of-band execution, so without a guard every re-run hands the same transaction over again, and executing it twice is a real loss for a mint, a transfer, an increment or a governance action carrying its own nonce ([What makes the re-run converge](https://rocketh.dev/documentation/unknown-signers/#what-makes-the-re-run-converge)).
- **Read where the effect lands**, which is often not the contract you call: an upgrade through a ProxyAdmin lands in the proxy's EIP-1967 slot (`kind: 'storage'`, `on: proxy`). A guard reading the wrong contract skips a step that is still needed ([The two kinds](https://rocketh.dev/documentation/execute-guard/#the-two-kinds-and-the-contract-each-one-reads)).
- **State the verdict with `equals`.** `satisfied` hands you the raw value, and an `===` on two spellings of one address never skips ([Trap 1](https://rocketh.dev/documentation/execute-guard/#trap-1-satisfied-hands-you-the-value-raw)).
- **`deployViaProxy` and a deterministic `deploy` check the chain themselves**; a plain `deploy` compares its saved record, which a deferred run never wrote, so a deferred plain deploy is offered again on the next run ([What makes the re-run converge](https://rocketh.dev/documentation/unknown-signers/#what-makes-the-re-run-converge)).
- **`id` with `return true` claims the whole script happened** and skips it for ever after ([Script lifecycle](https://rocketh.dev/documentation/script-lifecycle/#a-script-that-returns-true-is-never-run-again)). On the native path that claim holds: a `throw` aborts before the script returns, and a resolved pause is a step that happened.

<!-- fixture: rocketh-safe-owned-changes/deploy/02_set_value.ts -->

```ts
// deploy/02_set_value.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({execute, get, namedAccounts}) => {
		const {admin} = namedAccounts;

		// `admin` is unsignable: this step pauses for the Safe's hash, or throws when unattended
		await execute(get<typeof artifacts.Registry.abi>('Registry'), {
			account: admin,
			functionName: 'setValue',
			args: [42n],
			// what on chain says the step is done: once the Safe executed it, a re-run skips it
			guard: {kind: 'call', functionName: 'value', equals: 42n},
		});

		return true; // reached only once the value is really set
	},
	{id: 'set_value', tags: ['Value'], dependencies: ['Registry']},
);
```

When the admin must stay external on a live network, the script asserts it instead of inferring it from the policy: an account rocketh can sign for broadcasts whatever `onUnknownSigner` says ([Deferring is not a "never send" switch](https://rocketh.dev/documentation/unknown-signers/#catchunknownsigner-is-not-a-never-send-switch), [Production hardening](https://rocketh.dev/documentation/production-hardening/#an-unsignable-account-is-what-defers-not-the-policy)). Run it on the networks where the account is declared by the external address (a dev network that names `admin` by index would refuse); a fork rehearsal impersonates it on purpose:

<!-- fixture: rocketh-safe-owned-changes/deploy/00_admin_stays_external.ts -->

```ts
// deploy/00_admin_stays_external.ts
import {deployScript} from '../rocketh/deploy.js';

export default deployScript(
	async ({addressSignability, namedAccounts, network}) => {
		// a fork rehearsal impersonates the Safe on purpose
		if (network.fork) return;

		const {admin} = namedAccounts;
		if (addressSignability[admin.toLowerCase() as `0x${string}`] !== 'unsignable') {
			throw new Error(`refusing to run: rocketh can sign for ${admin}, which must stay external`);
		}
	},
	{tags: ['Registry', 'Value']},
);
```

When the owner is a contract that cannot send a transaction (a governance executor, a `TimelockController`), the printed transaction is not an instruction to follow literally: read [references/governance-owners.md](references/governance-owners.md) before handing it to anyone.

Done when: every `execute` whose `account` is unsignable has a `guard` that reads where its effect lands, and the scripts run (on hardhat's in-memory network, which saves no records, the run succeeding is the check).

## The run stopped at an unsignable step

Under the default policy `auto`, rocketh pauses when the run has a terminal and throws `UnknownSignerError` when it has none, which is what an agent's shell and CI usually are ([Choosing the behaviour](https://rocketh.dev/documentation/unknown-signers/#choosing-the-behaviour-onunknownsigner), [In CI it does not hang, it throws](https://rocketh.dev/documentation/unknown-signers/#in-ci-it-does-not-hang-it-throws)). Either way it prints the block that starts `Unknown signer for account`, with `from`, `to` and `data` (and `contract:` and `abi:` for a call made through `execute`).

- **A deferred step did not happen.** Under `throw` the run aborts at that step and records nothing for it: no deployment record, no run-once id, and every later step of the run did not run either ([A run that threw will hand you the same transaction again](https://rocketh.dev/documentation/unknown-signers/#a-run-that-threw-will-hand-you-the-same-transaction-again)).
- **Report it as outstanding, verbatim.** Give the user the printed block exactly as rocketh printed it (every line: `from`, `to`, `data`, `contract:`, `abi:`), say which account has to execute it, and report the deployment as unfinished. A summary or a re-encoding of the calldata is a second source of truth the user cannot check against the run.
- **The account that holds the authority executes it.** For a Safe, that is the Transaction Builder with the printed `to` and `abi:` ([Executing it from a Safe](https://rocketh.dev/documentation/unknown-signers/#executing-it-from-a-safe-with-the-transaction-builder)). Leave `autoImpersonate` and `onUnknownSigner` as the project configured them for a live network, keep the admin's key out of the deployment environment, and keep the step's `account` as it is: each of those would make rocketh send a transaction that belongs to the Safe ([Production hardening](https://rocketh.dev/documentation/production-hardening/#keep-the-signing-authority-outside-the-deployment-environment), [Check `autoImpersonate` is off](https://rocketh.dev/documentation/production-hardening/#check-autoimpersonate-is-off)).

### At a pause: the hash comes from the user

A pause waits for the hash of the transaction the authority executed ([At the pause you have two answers](https://rocketh.dev/documentation/unknown-signers/#at-the-pause-you-have-two-answers)). Hard guardrail: the hash comes from the user who executed the transaction, never from you, with or without a terminal. A hash you found on an explorer, picked from the Safe's history or typed from memory may be another transaction of the same Safe, and rocketh records what it is given.

When the pasted transaction does not visibly contain the requested call, rocketh asks whether to record it anyway. Relay that question to the user word for word and give rocketh their answer: a user who confirms is believed, which is rocketh's accepted residual risk, so the confirmation has to be theirs ([An execution is weighed on evidence](https://rocketh.dev/documentation/unknown-signers/#an-execution-is-weighed-on-evidence)). An empty answer or `cannot sign` defers the step, as `throw` does.

### Finishing after a deferral is a re-run

Nothing in the script changes; there are two ways to finish:

- **From a terminal, with the hash the user already has.** The re-run reaches the same step, pauses, and accepts the hash of the transaction executed after the earlier run: [A hash from an earlier run is still good](https://rocketh.dev/documentation/unknown-signers/#a-hash-from-an-earlier-run-is-still-good). Without a terminal of your own, the user runs it, or gives you the hash for a run that can prompt.
- **Unattended, once a `guard` lets the re-run see the effect.** After the authority executed the transaction, the guarded step is skipped and the run completes; before that, it surfaces the same transaction again, so a re-run is not a way to make it happen ([Trap 3](https://rocketh.dev/documentation/execute-guard/#trap-3-the-guard-is-what-makes-a-deferred-run-converge-and-not-a-substitute-for-care)). An unguarded step offers the same transaction again: ask the user whether it was executed, and add the guard rather than executing it a second time.

Done when: on a live network, a fork re-run of the same scripts sends nothing (below). That needs a node that can fork the network, and it holds only when every privileged `execute` has a `guard`. On hardhat's in-memory network, the run succeeding is the check.

## Rehearsing the change on a fork

A rehearsal runs the same scripts against a fork of the real network, with the Safe impersonated so its steps execute, and is how a privileged change is proven before it is sent ([Rehearsing a deployment on a fork](https://rocketh.dev/documentation/fork-runs/), [A Safe-owned project, step 4](https://rocketh.dev/documentation/safe-owned-project/#4-rehearse-on-a-fork)).

- **Say it is a fork.** With the `rocketh` CLI against a node someone started (`anvil --fork-url`), `--is-fork` ([From the command line](https://rocketh.dev/documentation/fork-runs/#from-the-command-line---is-fork)); through hardhat-deploy, `HARDHAT_FORK=<network>` ([Through hardhat-deploy](https://rocketh.dev/documentation/fork-runs/#through-hardhat-deploy-hardhat_fork)). Without it, `-e mainnet` is a real mainnet run.
- **A hardhat fork reports chain 31337**, so `environments.<network>.chain` has to name the forked chain, or the rehearsal takes your dev node's settings and tags ([the condition](https://rocketh.dev/documentation/fork-runs/#what-a-fork-run-inherits-and-the-one-condition)). anvil reports the forked id itself.
- **Records are read, not written.** The rehearsal reads `deployments/<network>` and saves nothing back ([A fork does not save](https://rocketh.dev/documentation/fork-runs/#a-fork-does-not-save-and-you-do-not-have-to-remember-that)), so a rehearsal leaves the repository's records as they were.
- **The Safe pays no gas for real**, so set `fundImpersonatedAccounts` (in `whenForked`, as in the config above) or the rehearsal stops at its first call with "insufficient funds" ([Paying the impersonated account's gas](https://rocketh.dev/documentation/fork-runs/#paying-the-impersonated-accounts-gas-fundimpersonatedaccounts)).
- **The batch for the Safe** is written by `--write-transactions <file>`, on the `rocketh` command only (`hardhat deploy` does not take it). The `impersonated` entries are what the Safe executes, in order; rocketh does not split them into batches ([Captured transactions](https://rocketh.dev/documentation/captured-transactions/#ordering-is-the-only-promise-and-rocketh-does-not-segment)).

```bash
# the fork, in its own terminal
anvil --fork-url "$ETH_NODE_URI_mainnet"
# the rehearsal, with the batch the Safe has to execute
rocketh -e mainnet --is-fork --write-transactions fork-batch.json --skip-prompts
# or through hardhat-deploy (no batch file)
HARDHAT_FORK=mainnet npx hardhat deploy
```

`--skip-prompts` skips the gas-price confirmation, which an agent's shell cannot answer; on a fork it skips nothing that matters, since the run writes nothing back and the Safe is impersonated ([step 4](https://rocketh.dev/documentation/safe-owned-project/#4-rehearse-on-a-fork)). Keep `--is-fork` on the command: without it, the same flag would skip the user's yes on a real mainnet run.

A rehearsal on the same anvil node twice finds the first rehearsal's effects already there: restart the node to rehearse from scratch ([step 4](https://rocketh.dev/documentation/safe-owned-project/#4-rehearse-on-a-fork)). After the real execution, read the chain again: a successful receipt says a transaction was mined, not that the intended state was reached ([Rehearse on a fork, then verify](https://rocketh.dev/documentation/production-hardening/#rehearse-on-a-fork-then-verify-the-chain-afterwards)).

Done when: the rehearsal succeeds and the user has the `impersonated` transactions to review. After the Safe executed them for real, the same rehearsal on a fresh fork sends nothing (`--write-transactions` then writes `[]`), which is the deployment finished ([Run again: nothing is sent](https://rocketh.dev/documentation/safe-owned-project/#6-run-again-nothing-is-sent)).
