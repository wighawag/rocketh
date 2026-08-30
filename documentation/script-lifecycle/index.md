# Script lifecycle: running once, and running last

A deploy script is meant to be re-run. That is what makes rocketh converge: `deploy` asks whether the contract it is about to deploy is already there, `deployViaProxy` reads the proxy's current implementation, and a `guard` on `execute` states the on-chain question for a call rocketh cannot answer by itself ([Guarding execute calls](../execute-guard/)). Running the same scripts again is the normal way to finish a deployment that stopped halfway.

Two options change WHEN a script runs rather than what it does, and both are declared next to `tags` and `dependencies` in the second argument of `deployScript`:

| option              | what it does                                                                           |
| ------------------- | -------------------------------------------------------------------------------------- |
| `id`                | names the script, so that a `return true` can record it as done and skip it thereafter |
| `runAtTheEnd: true` | runs this script after every ordinary script of the run, whatever the file order       |

## A script that returns `true` is never run again

Give the script an `id` and end it by returning `true`:

```typescript
import {deployScript} from '../rocketh/deploy.js';

export default deployScript(
	async ({execute, get, namedAccounts}) => {
		const {deployer} = namedAccounts;
		const registry = get('GreetingsRegistry');

		// a genuine one-off: nothing on chain can be read back to tell whether it happened
		await execute(registry, {account: deployer, functionName: 'seed', args: [42n]});

		// everything this script had to do is done
		return true;
	},
	{tags: ['Seed'], id: 'seed_the_registry'},
);
```

The run that returns `true` writes `seed_the_registry` into `.migrations.json` in that environment's deployment folder. Every later run against the same environment looks the id up BEFORE calling the script, finds it, and moves on, printing

```text
skipping /path/to/deploy/003_seed_the_registry.ts as migrations already executed and complete
```

Five things about that, only the first of which is obvious.

- **The unit is the WHOLE script**, never a step inside it. The skip happens before your function is entered, so a deploy, a read, a log and a privileged call that share a script are skipped together or not at all.
- **Only `true` records.** Returning nothing, which is what almost every script does, records nothing and leaves the script re-runnable. So does returning `false`, which is the useful form: `return deferred === null` records the script only on the run where nothing was left outstanding.
- **`return true` without an `id` is an error**, not a silent no-op: `... return true to not be executed again, but does not provide an id. the script function needs to have the field "id" to be set`.
- **The `id` is the identity, and it is a key you choose.** It is not the filename: renaming or renumbering the script file changes nothing, while editing the `id` string makes the script run again from scratch, because a different key is being looked up. Two scripts sharing an `id` in one environment means the second one is skipped as soon as the first has recorded it.
- **It applies to `runAtTheEnd` scripts too.** They go through the same loop and the same lookup.

## It is a fast path, not what makes a re-run safe

There are exactly two states, and no third: the id is not recorded and the script runs in FULL from the top, or it is recorded and the script does not run AT ALL. Nothing is resumed halfway. Anything that stops the script before it returns leaves nothing recorded, whether that is a revert, a network error, a `Ctrl-C` or a privileged call rocketh could not sign for.

So a script carrying an `id` must stay safe to re-run in full right up to the moment it returns `true`, and what makes it safe is the same chain-derived idempotency every other script relies on: `deploy` compares the deployed code and constructor arguments, a deterministic deploy asks whether code is already at the address it computed, `deployViaProxy` compares the implementation in the proxy's EIP-1967 slot, and an `execute` is only checked if you gave it a `guard`. The record is an optimisation layered in FRONT of those checks, so it can be deleted at any time with no consequence beyond a slower run. Remove the checks instead and the loop never closes, because a run that had to redo the work does not reach the `return true` that would have ended it.

That ordering is a rule rather than an accident, and it is written down: a persisted record asserts only what rocketh OBSERVED, and rocketh observes a step only when it sees the transaction land ([ADR 0012](https://github.com/wighawag/rocketh/blob/main/docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md), on top of the on-chain-state-driven idempotency of [ADR 0006](https://github.com/wighawag/rocketh/blob/main/docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md)).

## Never `return true` on a path where a step was deferred

::: danger This is the one way to lose a step permanently
`return true` is an ASSERTION, made by you, that everything in this script has happened. A script that deferred a privileged call to a Safe and CAUGHT the deferral can reach that line having skipped a step that never happened, and the id it records then skips the whole script for ever.
:::

`catchUnknownSigner` ([Handling unknown signers](../unknown-signers/#deferring-instead-of-asking-catchunknownsigner)) hands you back the transaction rocketh could not sign for and lets the script keep going. That is exactly what it is for. But the script then runs on to its end, and if its end is an unconditional `return true`:

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, get, execute, catchUnknownSigner}) => {
		const next = await deploy('Vault_Implementation', {account: 'deployer', artifact: artifacts.Vault, args: []});
		const proxyAdmin = get('Vault_ProxyAdmin');

		const deferred = await catchUnknownSigner(() =>
			execute(proxyAdmin, {
				account: 'safeOwner',
				functionName: 'upgradeAndCall',
				args: [get('Vault_Proxy').address, next.address, '0x'],
			}),
		);

		// WRONG. `deferred` may hold an upgrade nobody has executed yet, and this line
		//  tells rocketh the script is finished.
		return true;
	},
	{tags: ['Upgrade'], id: 'vault_upgrade_v2'},
);
```

then the sequence is: run 1 defers the upgrade, prints it, finishes the script, records `vault_upgrade_v2`. You execute the upgrade on your Safe. You re-run, and the script is skipped in full, so nothing looks at the proxy, nothing reconciles, and no later run ever will. If the Safe transaction was never executed at all, the deployment is quietly left half upgraded and the tool that was supposed to notice has been told not to look.

The fix is to make the assertion conditional on what actually happened. `catchUnknownSigner` returns `null` when the action went through, so:

```typescript
// records the script only on the run where nothing was left for the Safe to do
return deferred === null;
```

A run that deferred returns `false`, records nothing, and comes back to the same call next time. Give that call a [`guard`](../execute-guard/) as well and the re-run reads the proxy, sees the upgrade has landed, skips the call, reaches `return deferred === null` with `deferred` at `null`, and closes the loop by itself.

**rocketh does not police this, deliberately.** `catchUnknownSigner` is a try/catch, and a hand-written `try {} catch {}` around the same call produces the identical outcome with none of the machinery, so refusing to record a migration for a script that used the supported wrapper would tax the careful user and stop nobody. The decision and the reasoning are in ADR 0012 (see its 2026-08-27 amendment). `return true` with an `id` is a claim you make about your own script, and rocketh has no better information about it than you do.

### Two paths where `return true` is not the hazard

**The interactive path does not defer.** When rocketh pauses and you paste the transaction hash, it looks the transaction up, waits for it to be mined, requires a successful receipt and weighs the evidence that it is the call it asked for, all before saving anything ([What rocketh checks before recording anything](../unknown-signers/#what-rocketh-checks-before-recording-anything)). The step really happened and the run really saw it happen, so a script that resolved its privileged calls interactively returns `true` legitimately.

**The plain `throw` path is safe in the way that matters here, and exposed in another.** A deferral that is not caught aborts the run inside your script, one branch before the executor's record site, so nothing is written and the id is never recorded. No step is silently skipped. The cost is the other half of the same mechanism: because nothing was recorded, the re-run reaches that call again and prints the SAME transaction, with no way of knowing you already executed it, and an operator who follows the instructions twice executes a mint, a transfer, an increment or a nonce-bearing governance action twice. The deferral message says so on the spot, and [A run that threw will hand you the same transaction again](../unknown-signers/#a-run-that-threw-will-hand-you-the-same-transaction-again) covers both ways out (paste the hash you already have, or guard the step).

## Where the record lives

`.migrations.json`, in the environment's own deployment folder, alongside its deployment records:

```text
deployments/
  sepolia/
    .chain
    .migrations.json      <- {"seed_the_registry":1756500000}
    GreetingsRegistry.json
```

The values are the unix timestamps (in seconds) at which each id was recorded. Nothing reads them; the presence of the key is the whole of the answer.

- **It is per environment**, like everything else in that folder. Two environments on the same chain (`sepolia` and `sepolia2`) have their own, and an id recorded in one says nothing about the other.
- **It is written as soon as the script returns `true`**, not at the end of the run, and only when the run SAVES deployments. A [fork run](../fork-runs/) defaults to not saving, so a rehearsal writes no file and remembers the id for that run only; the same holds for a run given its own provider against the in-memory environments (`memory`, `hardhat`, `default`), and for any run that passes `saveDeployments: false`.
- **A fork run READS it**, because a fork reads the simulated network's records: a rehearsal of mainnet loads `deployments/mainnet/.migrations.json` and skips whatever mainnet has already recorded. That is usually what you want, and it is worth knowing when a rehearsal appears to do less than you expected.
- **It travels with the deployments.** If you do not commit `deployments/`, a colleague's checkout has no record and re-runs the scripts; `--reset` deletes the environment folder and takes the record with it; and a dev chain that comes back with a different genesis hash under `deleteDeploymentsIfDifferentGenesisHash` drops both together.
- **A file it cannot parse is not fatal.** rocketh prints `could not parse .migrations.json for environment '<name>' ... continuing as if no script had run yet, so scripts with tags already applied will run again`, and carries on. Losing the record costs a re-run of scripts that are re-runnable by construction, which is why it is a warning where an unreadable DEPLOYMENT record is a hard error.

## Asking, without asserting: `hasMigrationBeenDone`

Your script can read the record:

```typescript
if (env.hasMigrationBeenDone('seed_the_registry')) {
	// ...
}
```

There is no matching public way to WRITE one. Recording is internal to the executor and happens at exactly one place, when a script function returns `true`, and that asymmetry is the point: the record follows from an outcome the executor witnessed rather than from an assertion made anywhere in a script. Reading it is harmless, so it is on the environment.

## `runAtTheEnd`: run this script after the others

```typescript
export default deployScript(
	async (env) => {
		/* ... */
	},
	{tags: ['Report'], runAtTheEnd: true},
);
```

The executor resolves the scripts to run in the usual way (file order, filtered by `--tags`, with each script's `dependencies` pulled in first), and then runs them in two passes: every ordinary script, in that resolved order, and then every `runAtTheEnd` script, in that same order.

Three consequences worth stating.

- **`runAtTheEnd` beats the dependency graph, it does not participate in it.** Declaring a `runAtTheEnd` script as another script's dependency selects it for the run but does not move it before its dependent, because the second pass is unconditional. Depend on it and you get it last anyway, which is not what a dependency usually promises.
- **It is still subject to selection.** A `runAtTheEnd` script with no matching tag does not run at all when `--tags` is used, and one carrying an already recorded `id` is skipped like any other.
- **It sees everything the earlier scripts did**, which is the whole reason to use it, and the subject of the next section.

## The batch proposer: what `runAtTheEnd` is really for

The motivating case is a consumer of the work the run could not do itself. In a Safe-owned or governance-owned system the privileged calls are precisely the ones rocketh cannot sign, so a run either stops at each of them or keeps going and leaves them for somebody else to execute. What operators actually want is one place, at the end of the run, that collects all of them and proposes them as a single multisig batch. Two production teams built exactly that on hardhat-deploy v1, by hand. Everything needed to build it on rocketh ships today.

There are two sources to consume, and they are complementary rather than alternatives.

### From a fork rehearsal: what the run DID send

Rehearse the upgrade against a [fork](../fork-runs/) and impersonation makes the Safe-owned steps actually EXECUTE, so the run has real transactions rather than instructions. Every transaction a run broadcast is kept, in order, on the environment, and a `runAtTheEnd` script is where you read it:

```typescript
// deploy/999_propose_the_batch.ts
import {deployScript} from '../rocketh/deploy.js';

export default deployScript(
	async (env) => {
		// what could not have signed for itself is what the Safe has to execute
		const toPropose = env.capturedTransactions.filter(
			(entry) => entry.type === 'intent' && entry.signability === 'impersonated',
		);

		if (toPropose.length === 0) {
			return;
		}

		env.showMessage(`${toPropose.length} transaction(s) for the Safe`);
		// `proposeBatch` is yours: a Safe SDK call, an API post, or a file your operators pick up
		await proposeBatch(toPropose);
	},
	{tags: ['ProposeBatch'], runAtTheEnd: true},
);
```

[Captured transactions](../captured-transactions/) is the page for that list: what each entry holds, why `signability` is where a batch splits, and why rocketh refuses to group them for you. Two things about it matter here. A `runAtTheEnd` script sees everything broadcast so far in the run, which is every ordinary script plus any `runAtTheEnd` script that ran before it. And the boundary a reader of this page will immediately wonder about: **a DEFERRED transaction produces no captured entry**, because it never happened. The list is what the run DID, not what it still owes.

### From a run that deferred: what the run could NOT send

Which is why the other half is collected by you, at the call sites, out of what `catchUnknownSigner` hands back. A module the executor ignores (a leading underscore keeps a file out of the script list) is enough to share it:

```typescript
// deploy/_deferred.ts
import type {CaughtUnknownSignerTransaction} from '@rocketh/unknown-signer';

export const deferredTransactions: CaughtUnknownSignerTransaction[] = [];
```

```typescript
// deploy/010_upgrade_vault.ts
import {deployScript} from '../rocketh/deploy.js';
import {deferredTransactions} from './_deferred.js';

export default deployScript(
	async ({get, execute, catchUnknownSigner}) => {
		const proxyAdmin = get('Vault_ProxyAdmin');

		const deferred = await catchUnknownSigner(() =>
			execute(proxyAdmin, {
				account: 'safeOwner',
				functionName: 'upgradeAndCall',
				args: [get('Vault_Proxy').address, get('Vault_Implementation').address, '0x'],
			}),
		);

		if (deferred) {
			deferredTransactions.push(deferred);
		}

		// see the warning above: only claim the script is done when nothing was deferred
		return deferred === null;
	},
	{tags: ['Upgrade'], id: 'vault_upgrade_v2'},
);
```

and the consumer is the same shape, reading your array instead of the run's list:

```typescript
// deploy/999_propose_the_deferred_batch.ts
import {deployScript} from '../rocketh/deploy.js';
import {deferredTransactions} from './_deferred.js';

export default deployScript(
	async (env) => {
		if (deferredTransactions.length === 0) {
			return;
		}
		await proposeBatch(deferredTransactions);
	},
	{tags: ['ProposeBatch'], runAtTheEnd: true},
);
```

One `catchUnknownSigner` captures ONE transaction (the first unsignable one inside it), so a script deferring several steps wraps each of them.

Nothing about this collection is persisted by rocketh, and that is deliberate: a run-scoped array is inspected by your own code and read back by nobody to decide whether a step is needed. If you want the durable artifact, take it from the rehearsal instead, where `rocketh -e mainnet --is-fork --write-transactions ./batch.json` writes the captured list to a file once the run succeeds.

## See also

- [Handling unknown signers](../unknown-signers/) for the privileged calls behind both halves of the batch story, and for what a deferral does to a run.
- [Captured transactions](../captured-transactions/) for the list a `runAtTheEnd` consumer reads, and for segmenting it into proposals.
- [Guarding execute calls](../execute-guard/) for making a deferred step converge on the re-run, which is what a run-once script needs underneath it.
- [Rehearsing a deployment on a fork](../fork-runs/) for the run that turns Safe-owned steps into executed transactions.
