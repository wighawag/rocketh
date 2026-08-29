---
title: 'A deferred-transaction collector: stop every team hand-rolling the same array'
slug: deferred-transaction-collector
humanOnly: true
taskedAfter: [unknown-signer-core]
---

> **DROPPED (2026-08-29), superseded by `captured-transactions`.** The comparison this spec was waiting on has been made and it lost. The fork route discovers the same pending privileged work by EXECUTING it against a fork with the account impersonated, so it has no counterfactual: reads after executes are true, deploys are real, ordering is real, and unlike this spec it can produce a batch containing DEPENDENT steps (a Safe MultiSend runs its calls inside one transaction, so an upgrade's effect is visible to the call encoded against it). Everything that route needed has now shipped except the capture itself, which is specced as `captured-transactions`.
>
> What this spec got right is preserved there rather than lost: the file lifecycle reasoning, which is why `captured-transactions` can justify writing once at the end instead of inheriting truncate-at-start, append-as-you-go and a `complete` flag. Those existed because a REAL-network run that halts has already sent real transactions; on a fork nothing real happened, so a partial list is misleading rather than merely incomplete.
>
> Kept for the field study it records and for that lifecycle argument. Do not build.

> **Original contingency note, for the record. CONTINGENT, do not task yet.** This spec builds on `catchUnknownSigner`, which `unknown-signer-v1-migration` already characterises as a v1 compatibility shim. `work/notes/ideas/fork-based-discovery-of-pending-privileged-work.md` argues that the goal here (discover every pending privileged action in one pass, so they go into one signing ceremony) is better served by running against a FORK with the unsignable account impersonated, which already works today, avoids the counterfactual entirely, and unlike this spec can produce a batch containing DEPENDENT steps. If that holds, this spec is unnecessary rather than merely second. Compare before building either. `execute-state-guard` is needed by both and is unaffected.

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked — this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

## Problem Statement

Two production DeFi teams, independently and unaware of each other, described building the same thing on top of `catchUnknownSigner` (`work/notes/findings/deployment-workflow-field-study.md`): wrap each privileged call, catch the transaction rocketh cannot sign, append it to a JSON file, and have a final script read the file and propose one multisig batch.

Everything they needed is already in rocketh v2. `catchUnknownSigner` returns the transaction, and `runAtTheEnd` marks the script that consumes them. What is not there is the array in the middle, so each team writes it, and each team writes it slightly differently, and each team independently meets the same two traps.

**Trap one: the shape of the wrapper forces the loop.** The deferral is a throw that unwinds the wrapped action, so ONE `catchUnknownSigner` captures ONE transaction and everything after it in that action is skipped. Collecting N transactions means N wrappers, which is not obvious from reading the wrapper's documentation and is usually discovered by finding only the first transaction in the file.

**Trap two: the collection pattern is what makes the migrations record dangerous.** A script that wraps every privileged call and keeps going can reach `return true` having skipped steps that never happened, which records its `id` and skips the whole script forever (ADR 0012, and the sibling task `refuse-migration-record-when-a-script-deferred`). The teams that converged on this pattern converged on the pattern that triggers it.

## Solution

An in-memory accumulator, and nothing else.

```typescript
const pending = await collectDeferred(env)(async (defer) => {
	await defer(() => execute(env)(config, {account: 'governance', functionName: 'setFeeBps', args: [30]}));
	await defer(() => execute(env)(config, {account: 'governance', functionName: 'setTreasury', args: [t]}));
});
// pending: the transactions the operator's multisig must execute, in order
```

`defer` is `catchUnknownSigner` with the result appended rather than returned, so its semantics are already specified and already tested: it forces the `throw` policy for its action, catches the `UnknownSignerError`, and returns the v1-shaped `{from, to, value, data}`. A step that succeeds contributes nothing. The scope returns the collected transactions in the order they were deferred.

**Collection is also RUN-SCOPED, not only scope-local, and that is what makes the pattern actually work.** The shape both teams described is cross-script: several deploy scripts each surface transactions, and ONE `runAtTheEnd` script proposes them as a single batch. A scope that only returns its transactions to its own caller cannot serve that, because script 001's array is not reachable from script 003, which is exactly why both teams reached for a file. So deferrals collected anywhere in the run accumulate on the environment for the run's duration, and a later script reads the lot:

```typescript
// 999_propose.ts, marked runAtTheEnd
const pending = deferredTransactions(env);
if (pending.length > 0) {
	// propose them as one batch, with your own Safe library
}
```

The run-scoped list is in-memory state alongside the policy frames and the provider's transaction-hash tracker. The scope's return value stays as a convenience for the single-script case.

**And the collected set is written to a file**, opt-in, because in-memory alone is not good enough and the teams who solved this by hand all reached the same conclusion.

That needs saying plainly, because "rocketh persists nothing" has been repeated often enough in this repo to read as a prohibition, and it is not one. ADR 0006's actual sentence is that nothing is persisted **by the seam**, and that "a persisted batch, if ever built, belongs downstream in a consumer package, not in the core seam, keeping the one-choke-point, zero-side-effects property that makes the seam auditable". `unknown-signer-v1-migration` likewise does not forbid a file; it requires that persistence be OPT-IN so a migrated v1 script's behaviour is unchanged. A collector is downstream of the seam, and an opt-in file satisfies both.

What the no-persistence doctrine is actually protecting against is a record that acquires AUTHORITY: something consulted to decide whether a step is needed, which ADR 0012 shows is systematically blind in exactly the governance-owned case where it would be trusted most. This file is never read to decide anything. It is an output.

Lifecycle, which is the only part with real design in it: **truncated at the start of the run, appended to as each transaction is collected, and marked complete when the script phase finishes.**

Writing AS WE GO rather than at the end, for two reasons. A `runAtTheEnd` consumer is itself part of the script phase, so "write when the script phase completes" would publish the file after the script meant to read it had already run. And a run that halts holds real transactions that genuinely need executing; discarding them to avoid publishing a partial set would be choosing a loss over a duplicate, which is the exact trade this spec says to make the other way.

So a halted run leaves a PARTIAL file, and the file says so. The `complete` flag is what makes partial safe: a consumer that requires the whole set can refuse, a human can see that more may be coming, and nobody has to infer completeness from the file's existence.

Truncating at run start is what removes the need for entry identity. A re-run after a failure re-collects the same transactions, and replacing rather than appending means they cannot accumulate into duplicates. The file is a **snapshot of what this run surfaced**, not a ledger of everything ever outstanding.

That leaves exactly one hole, and it is the one the user opted into: a script SEALED by a migration does not re-run, so what it collected is not in the next run's snapshot. Migrations are the author's business (below), and this is a consequence they should be told about in the same breath.

What the collector deliberately does NOT do is as much of the design as what it does:

- **It writes ONE file, opt-in, and reads nothing.** No deployment-record field, no state consulted to decide whether a step is needed. Off by default, so the v1 no-side-effects guarantee (`unknown-signer-v1-migration`) holds unchanged for anyone who did not ask; on, it is the durable, inspectable artifact the hand-rolled versions all built. The seam itself still persists nothing, which is what ADR 0006 actually requires.
- **It knows nothing about Safe.** No MultiSend encoding, no Transaction Service, no SDK. The consumer is somebody else's code, or a later package.
- **It does not change `catchUnknownSigner`.** The shim stays frozen (`unknown-signer-v1-migration`), and this is built ON it rather than by growing it.

That boundary is what makes this spec safe to build now while `explore-unknown-signer-adapters` is still unanswered: the persisted schema and the Safe submission surface are that exploration's open questions 2 and 3 and stay there. This spec builds only the part nobody disputes, and it gives that exploration a concrete producer to design its first consumer against.

### Migrations are the user's business

A script that collects and then returns `true` with an `id` seals itself, and will never run again, including the steps that never happened. That is a real hazard and it is documented (`document-migrations-and-run-at-the-end`), but it is NOT policed here.

The reason is that policing it is trivially bypassed: `catchUnknownSigner` is a try/catch, and a user who writes their own `try {} catch {}` and returns `true` produces the same outcome with none of the machinery. Enforcing on our wrapper alone would tax the user who reached for the supported tool and stop nobody, which is the same argument that made the guard optional. An earlier draft of this spec depended on a `deferralIsCompletion` option and on migrations held provisionally until end of run; both were cancelled with the reasoning in `work/tasks/cancelled/refuse-migration-record-when-a-script-deferred.md`.

The file above is what makes that safe to leave alone. The reason the enforcement kept growing was that in-memory collection dies with the process, so a sealed collecting script could lose its transactions permanently. Once the collected set is on disk, a sealed script is a re-run the user chose not to have, not a silent loss: the transactions are still there to propose.

One principle worth carrying into anything built on top, because it decided several smaller calls here: **prefer a duplicate to a loss.** A duplicate proposal is visible in a Safe UI and a human can reject it; a lost transaction is invisible until the operator discovers the batch they executed was incomplete.

The documentation has to carry one warning, prominently, because it is the thing that will otherwise be learned expensively: **collect only steps that are independent of one another.** A team told us exactly why, describing needing two or three separate multisig proposals because a later call had to be encoded against an ABI that only exists after the earlier upgrade executes. Batching does not fix that and must not appear to. Steps that depend on each other need separate runs, and the guard (`execute-state-guard`) is what makes those runs converge.

## User Stories

1. As a deployer with several independent privileged calls, I want to collect the transactions my multisig must execute in one run, so I make one proposal instead of one per run.
2. As that deployer, I want the transactions back in the order I deferred them, so an ordering constraint I do know about survives.
3. As that deployer, I want each collected transaction in the same shape `catchUnknownSigner` returns, so code I already wrote against v1 keeps working.
4. As that deployer, I want a step whose call SUCCEEDED to contribute nothing to the collection, so a mixed run (some steps signable, some not) works.
5. As that deployer, I want to feed the result to a `runAtTheEnd` script, so the proposal is built once at the end of the run.
6. As that deployer, I want ONE `runAtTheEnd` script to see the transactions collected by ALL my deploy scripts, so I make one batch per run rather than one per script.
7. As that deployer, I want the collected transactions written to a file, so I can inspect what is outstanding before I propose anything.
8. As that deployer, I want that file to survive the run, so a batch I have not proposed yet is not lost when I close the terminal.
9. As that deployer, I want a halted run to leave the transactions it DID collect, flagged as incomplete, so I can act on them knowing more may follow rather than losing them.
10. As a `runAtTheEnd` consumer, I want the file to exist by the time I run, since I am part of the script phase.
11. As a deployer re-running after a failure, I want the file replaced rather than appended to, so a retry does not double every entry.
12. As that deployer, I want the file opt-in, so my repo diff after a deploy is unchanged unless I asked for it.
13. As that deployer, I would rather see a duplicate proposal in my Safe than silently lose a transaction, because I can reject a duplicate and cannot notice an absence.
14. As a deployer who sealed a collecting script with a migration, I want the documentation to tell me its transactions will not appear in later snapshots, so the consequence is visible where I make the choice.
15. As a deployer, I want to be told plainly that collecting means those steps did NOT happen, so I do not write a dependent step after one.
16. As a deployer, I want the collector to be inert if nothing deferred, so a run against a local node where everything is signable behaves as if the collector were not there.
17. As a deployer who collected transactions and never consumed them, I want to be told at the end of the run, rather than discovering it when my multisig queue is empty.
18. As a v1 migrant who did not opt in, I want a run to write no new file, so the no-side-effects guarantee I was promised still holds.
19. As a maintainer, I want nothing to READ the file to decide whether a step is needed, so it never becomes a second source of truth.
20. As a maintainer, I want `catchUnknownSigner` untouched, so the migration parity promise is not renegotiated to add a feature.
21. As a deployer who accidentally wrapped a collected step in its own `catchUnknownSigner`, I want to be told, because otherwise that transaction vanishes from my batch and I find out when the multisig executes an incomplete set.

## Autonomy notes

`humanOnly: true`: this adds a public export to a package whose neighbouring export is frozen by a compatibility promise. A human drives the tasking.

No `needsAnswers`: the three shape questions (scope form, package, nesting) were answered before promotion and are recorded in Implementation Decisions.

One ordering constraint that is NOT in the frontmatter because it is a task-level dependency rather than a spec one: the nested-wrapper detection below reads the per-script deferral mark that `refuse-migration-record-when-a-script-deferred` introduces. Task this spec's detection slice after that task lands, or build the mark here if it has not.

Deliberately NOT `taskedAfter: [explore-unknown-signer-adapters]`. That exploration is unanswered and its warning against authoring fictional build tasks is right, which is why this spec carves out only the part that is not in question (an in-memory accumulator with no persistence and no Safe knowledge). It takes that exploration's recorded lean on its own question 1, that batching lives on the collect-and-defer side rather than in a deferring-protocol lifecycle hook, as its premise, and it leaves questions 2 and 3 entirely alone.

## Implementation Decisions

- **Scope form, not object form.** `collectDeferred(env)(async (defer) => {...})` returns the collected transactions; there is no long-lived collector object. Same reasoning that made the environment retire `pushUnknownSignerPolicy` / `popUnknownSignerPolicy` in favour of one scoping verb: a scope the caller cannot forget to close beats the flatter spelling, and it nests safely. The object form was rejected for having a lifetime nobody declares.
- **It lives in `@rocketh/unknown-signer`.** `explore-unknown-signer-adapters` says adapters live outside that package, "which stays a generic terminal net", and that still holds: an ADAPTER carries protocol knowledge, a network dependency or an SDK. This is a pure in-memory accumulator with none of those, no new dependency, and it is meaningless without the `catchUnknownSigner` sitting next to it. Splitting one workflow across two installs to honour a boundary that was drawn against a different kind of thing would be cargo-culting the rule.
- **Collection accumulates on the environment for the run**, readable by any later script through a separate curried export. Never read to decide whether a step is needed.
- **The file is dot-prefixed in the environment's deployment folder** (`.pending_transactions.json`), written through `deploymentStore` so it works in the browser. The dot prefix keeps it invisible to the deployment loader, whose `listFiles` predicate drops dot-prefixed names other than `.migrations.json`; verify that filter still holds at build time.
- **Truncated at run start, appended per collected transaction, marked complete at the end of the script phase.** Written incrementally because a `runAtTheEnd` consumer is inside the script phase and would otherwise read a file that does not exist yet, and because a halted run's partial set is real data that should not be thrown away. Truncating (rather than appending across runs) is what makes entry identity unnecessary: a re-run replaces, so nothing can accumulate into duplicates. Suggest gitignoring it in the docs; committing it is the user's call.
- **The file is a snapshot, not a ledger.** It holds what THIS run surfaced. A script sealed by a migration does not re-run, so its transactions are absent from later snapshots; that is a consequence of sealing and is documented with it, not worked around here.
- **An entry carries what a proposer needs**: `from`, `to`, `value`, `data` in the v1 shape, plus the chain id and which script surfaced it, in the order they were deferred.
- **An entry also carries a content DIGEST, as a field and never as an identity.** It costs nothing, it lets a consumer dedupe if its own semantics allow, and it lets a human tell two similar entries apart. rocketh itself must not use it to merge entries, because content-addressing silently collapses calls that legitimately recur: two `increment()` calls in one run are two obligations with identical bytes. This repo already has the precedent written down, from `TimelockController`, where an identical operation can never be scheduled twice and "a constant salt is therefore not viable for anything that could recur" (`work/notes/findings/governance-upgrade-topologies-in-the-wild.md`). Same trap, one layer up.
- **The file carries a `complete` flag**, false while the run is in flight and true once the script phase has finished, so a partial file after a halt is legible rather than misleading.
- **Migrations are NOT policed.** See the section above and `work/tasks/cancelled/refuse-migration-record-when-a-script-deferred.md`. No `deferralIsCompletion`, no provisional migration commits, no per-script deferral mark.
- **Collected-and-never-consumed is reported at end of run.** The accumulator records whether anything read it; if transactions were collected and nobody looked, the run says so. Cheap, and the failure it catches (a forgotten consumer script) is otherwise silent and total.
- **A nested `catchUnknownSigner` inside a collected step FAILS LOUDLY.** Frames nest LIFO, so an inner wrapper catches the deferral before the collector's step sees it and the transaction goes silently uncollected, which is the worst possible outcome for a tool whose entire job is not to lose transactions. It is detectable with a counter the collector owns: if the run's deferral count advanced during a step while no error reached the collector, an inner wrapper swallowed one. Throw, naming the step. (An earlier draft borrowed this counter from the now-cancelled migrations task; it is small enough to own here, and if it proves awkward this detection is the part to drop, not the collector.)
- **The curried export returns a FUNCTION, never a collector object.** `withEnvironment` calls every extension entry as `value(env)` ONCE, at environment setup, and stores the result (`packages/rocketh-core/src/environment.ts`). So a `collectDeferred: (env) => collector` spread into `extensions` would produce a single run-scoped collector shared by every script, created whether or not anybody uses it, with a lifetime nobody declared. Returning a function keeps it identical in shape to `catchUnknownSigner(env)` and every other extension.
- **`defer` is `catchUnknownSigner`'s behaviour, not a reimplementation of it.** Same forced `throw` policy frame, same error identification (including the cross-realm `name` check), same v1-shaped return, same thunk-only argument and the same loud error when given a promise.
- **Nothing else is caught.** Any error that is not an `UnknownSignerError` propagates unchanged and abandons the scope, exactly as it does through the wrapper today.
- **Printing follows the wrapper.** Each collected transaction is shown through `env.showMessage` as `catchUnknownSigner` does, with the same opt-out, so a collecting run reads like a sequence of deferrals rather than going silent until the end.
- **No new error class on the package root.** Extension roots may hold only curried functions; anything else goes on a subpath, as `UnknownSignerError` does on `./errors`.

## Testing Decisions

- The end-to-end story as an integration test that doubles as documentation: three privileged calls from an unsignable account, one of them signable, collected in one run, and the array asserted for content AND order.
- Parity with the wrapper: a single-step collection returns exactly what `catchUnknownSigner` would have returned for that step, field for field, including key presence for `undefined` values.
- With the file OFF (the default): the filesystem and the deployment records are byte-identical before and after a collecting run, mirroring the test `unknown-signer-v1-migration` specifies. This is the test that keeps the v1 promise true.
- With the file ON: a completed run writes the full pending set with `complete` true; a run halted by a later script's error leaves the transactions collected before the halt with `complete` false; the next run truncates and rewrites, so a retry does not duplicate entries.
- A `runAtTheEnd` script can read the file, which means it must exist before that script runs, not after the script phase.
- Two identical calls in one run produce TWO entries, so the content digest is not being used as an identity.
- The file is never read by rocketh: deleting it between runs changes nothing about what the next run collects.
- A non-`UnknownSignerError` thrown inside a step propagates and abandons the scope.
- A `catchUnknownSigner` nested inside a collected step fails, naming the step, rather than losing the transaction.
- Nested collector scopes behave, since the scope form makes that expressible.
- Cross-script accumulation: two deploy scripts collect, a `runAtTheEnd` script sees both sets, in run order.
- Collected but never consumed produces a warning at end of run.
- Prior art: `packages/rocketh-unknown-signer/test/scenarios.integration.test.ts` and `catchUnknownSigner.integration.test.ts`.

## Out of Scope

- Safe MultiSend encoding, Safe Transaction Service proposals, and the Safe SDK dependency decision, which stay in `explore-unknown-signer-adapters` (its question 3). The file this spec writes is the raw transaction list; turning it into a proposal is a separate package's job.
- Policing migrations, cancelled with reasoning in `work/tasks/cancelled/refuse-migration-record-when-a-script-deferred.md`. The hazard is documented instead.
- Call-through translation for a Timelock or AccessManager holder of the upgrade right, which is `unsignable-routes`. A collector collects whatever the seam surfaces; if routes later change what that is, the collector needs no change, which is a useful check that this seam is in the right place.
- Any change to `catchUnknownSigner` itself.
- Deciding whether collected steps are independent. The collector cannot know, and pretending it could would be worse than the warning.

## Further Notes

The strongest argument for building this is not convenience, it is that the pattern is already ubiquitous among the users who deploy to governance-owned systems, and every hand-rolled copy of it independently walks into the same two traps. Shipping the array is mostly an excuse to ship the warnings attached to it.
