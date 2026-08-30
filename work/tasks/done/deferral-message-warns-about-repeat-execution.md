---
title: 'Say that a re-run will surface the same deferred transaction again, and that a stale hash can still be pasted'
slug: deferral-message-warns-about-repeat-execution
blockedBy: []
covers: []
---

## What to build

Two sentences that are currently missing from the one place the user is guaranteed to be looking.

**The warning, and its ACTUAL cause.** Under `throw`, rocketh prints the transaction to execute out of band, aborts, and records nothing (correctly, since it observed nothing: ADR 0012). The operator executes it on their Safe and re-runs. rocketh has no way to know it happened, so it surfaces the IDENTICAL transaction again, and following the instructions a second time executes the call twice.

Be precise about WHY, because the obvious explanation is wrong and a message built on it will be rightly dismissed. This is NOT "you forgot to guard the step". A guard is optional (`guard?: AnyGuard`, `packages/rocketh-read-execute/src/index.ts`), and an unguarded call re-executing on a re-run is a general property of an unguarded call, not something a deferral introduces. Stated that way, the warning says nothing that is not already true of every transaction, and the reader learns nothing.

The real asymmetry is that the deferral ABORTS THE RUN BEFORE THE COMPLETION RECORD IS WRITTEN. Read `packages/rocketh/src/executor/index.ts` around the script loop and confirm this before you write the prose: `recordMigration` is reached ONLY when the script FUNCTION RETURNS `true` (`if (result && typeof result === 'boolean')`), while a throw from the script is rethrown one branch earlier and takes the whole run down with it. So for the IDIOMATIC run-once script (`id` plus `return true`) the two paths diverge sharply:

- a SIGNABLE account executes the call, the script reaches `return true`, the migration is recorded, and `hasMigrationBeenDone` skips the script on every later run. The author is protected.
- an UNSIGNABLE account under unwrapped `throw` never reaches `return true`, so NO migration is recorded, and the next run runs the script again and surfaces the same transaction.

That is the point worth telling the user: an author who did everything right is still exposed, on this one path, because the abort precedes the record. A warning that instead implies they should have written a guard misdiagnoses it.

So the message must say: this run stopped before the script finished, so nothing recorded that this step was reached; re-running will surface this transaction again even for a script that returns `true`; and executing it twice may not be harmless (for an idempotent setter it is a wasted round trip, but for a mint, a transfer, an increment or a governance action carrying its own nonce it is a real loss). This is the same shape as the existing capability-degradation note, and it belongs next to it.

The two sentences are ONE story, so write them as one: the resurfacing is the problem, and the stale-hash paste below is the remedy. Point from the first to the second rather than leaving them as unrelated bullets.

(The MIRROR hazard on the other path is already documented and is NOT in scope here: under `catchUnknownSigner` the error is swallowed, the script continues to `return true`, the migration IS recorded, and the deferred transaction is never surfaced again. See ADR 0012, which records that enforcing the opposite was considered and rejected. The backlog task `document-migrations-and-run-at-the-end` owns documenting that contract; if it has landed, match its wording rather than coining a second description of the same mechanism.)

**The recovery.** The interactive path has a way out that nobody knows about, because nothing states it. There is NO recency check on the pasted hash (`packages/rocketh/src/environment/interactiveUnknownSigner.ts` and `pastedTransactionIntent.ts` check inclusion, success and evidence tier, not age), so a hash from a transaction executed after a PREVIOUS run is accepted and resolves the step in the current run. That turns a stale deferral into something recoverable without editing the script. Say so at the prompt, and in the docs.

Scope discipline, because these messages are load-bearing and easy to bloat:

- Keep it to the `throw` path's message and the interactive prompt. Do not touch the transaction block itself (`formatDeferredTransaction` in `@rocketh/unknown-signer`), which is v1's layout and is pinned by the migration parity work.
- Say nothing new on the `catchUnknownSigner` path. That wrapper's whole point is that the user already decided to handle this, and the existing code is deliberately quiet there (see `describeUnknownSignerCapabilityDegradation`, which returns `undefined` for an explicit `'throw'` for exactly this reason). A user who wrapped the call does not need to be told the run will surface it again, because the run did not stop.
- No em dashes in any message text (repo rule, and the existing note in `unknownSignerPolicy.ts` already calls this out).

## Acceptance criteria

- [ ] An unwrapped deferral under `throw` includes the repeat-execution warning in the surfaced error message
- [ ] The warning attributes the resurfacing to the run having stopped before the script's completion was recorded, NOT to a missing guard, and a test pins that content. A message that tells a correctly-written run-once script's author to guard the step is the specific failure this task exists to avoid
- [ ] The warning points the reader at the stale-hash paste as the remedy, so the two sentences read as one story rather than two unrelated notes
- [ ] A deferral under `catchUnknownSigner` does NOT include it (the wrapper stays quiet, matching the existing degradation-note asymmetry)
- [ ] The interactive prompt states that a hash from a previously executed transaction is accepted
- [ ] Pasting a hash for a transaction that landed before the current run resolves the step (test the property, so a later "freshness check" cannot be added without a test going red)
- [ ] The documentation site's unknown-signers page carries both the warning and the stale-hash recovery
- [ ] No message text contains an em dash
- [ ] Tests assert message CONTENT at the seam, in the style of the existing unknown-signer integration tests

## Blocked by

- None, can start immediately.

## Prompt

> Add two missing sentences to rocketh's unknown-signer messaging, and pin one of them as a behavioural property.
>
> Read first: `docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md` (the reasoning), then `packages/rocketh/src/environment/unknownSignerPolicy.ts` (in particular `describeUnknownSignerCapabilityDegradation`, which is the model to follow: a pure function returning the note or `undefined`, deliberately silent on an explicit `'throw'`), then the unknown-signer branch of `broadcastTransaction` in `packages/rocketh/src/environment/index.ts` and `interactiveUnknownSigner.ts` / `pastedTransactionIntent.ts`.
>
> Sentence one: under `throw`, tell the user that a re-run will surface this same transaction again, and that executing it twice may not be harmless. Get the CAUSE right, because the obvious one is wrong: it is not that the step lacks a guard (guards are optional, and an unguarded call re-executes on any re-run, which makes that framing say nothing deferral-specific). It is that the deferral ABORTS the run before the script's completion is recorded. VERIFY this in `packages/rocketh/src/executor/index.ts` before writing the prose: `recordMigration` is reached only via the script returning `true`, and a throw is rethrown before it, so even the idiomatic `id` plus `return true` script gets no migration record and runs again. An author who did everything right is exposed on exactly this path, and that is what the message has to convey. Then point them at sentence two as the remedy.
>
> Sentence two: at the interactive prompt, tell the user that a hash from a transaction they executed after an EARLIER run is accepted. Verify this is true before writing it (the classifier ranks evidence that the hash matches the intended call; confirm there is no recency or block-height condition anywhere on that path), then add a test that pins it, so the property cannot be silently removed later.
>
> Follow the existing asymmetry exactly: a `catchUnknownSigner` action gets neither sentence, because that user already opted into handling the deferral and the path is meant to stay quiet.
>
> Do not modify `formatDeferredTransaction` in `@rocketh/unknown-signer`: that block is hardhat-deploy v1's layout and is pinned by the v1 migration parity guarantee.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). If the code or an ADR has moved on, route to needs-attention with the discrepancy rather than building on a stale premise.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT. Do not write the done record, the commit message or the PR body, and do not edit this task body.

## Decisions

- **The quiet path is keyed on a SCOPED `'throw'` frame, not on any explicit `'throw'`.** `catchUnknownSigner` pushes `{policy: 'throw'}`, so at the seam a wrapper-scoped throw and a run-level `onUnknownSigner: 'throw'` have the same effective policy and mean opposite things about whether the run stops. To satisfy both "an unwrapped deferral under `throw` includes the warning" and "a `catchUnknownSigner` action does not", I added a private `scopedPolicy()` to the policy-frame stack (`UnknownSignerPolicyStack`, internal to `rocketh`; `@rocketh/core`'s `UnknownSignerPolicyFrame` is unchanged) and made the note silent only when a frame asked for `'throw'`. Alternative considered and rejected: mirror `describeUnknownSignerCapabilityDegradation` exactly and stay silent on every explicit `'throw'`, which would deny the note to the run-level `throw`, which is precisely the case ADR 0012 lists as "a real hazard ... and nothing warns about it today". Second alternative rejected: add a discriminator field to `UnknownSignerPolicyFrame` (a core type change, and the frame is meant to say what policy, not who pushed it). **What it touches:** `withUnknownSignerPolicy(env)('throw', ...)` is now ALSO quiet even though such a run does halt, because it is indistinguishable from `catchUnknownSigner` at the seam. I judged that acceptable (a caller who wrote `'throw'` around one call chose the defer workflow for it), and it is the one false negative in the rule. A scoped `'ask'`/`'auto'` degraded by the capability ceiling still gets the note.
- **The note is attached only on the policy-throw branch, not on the interactive degrade-to-defer exits** ("cannot sign", a cancelled/failed prompt, a refused unrelated-transaction confirmation). Those deliberately rethrow the message UNDEGRADED so `catchUnknownSigner` sees exactly what an unwrapped throw produces, and that is pinned by an existing test's stated intent; the user on that path has just READ the prompt, which now carries the stale-hash sentence. Alternative considered: warn there too, since the run does abort. Rejected as scope creep against the task's "keep it to the `throw` path's message and the interactive prompt". **What it touches:** `interactive-unknown-signer.test.ts` story 4.
- **The docs page names the guard as the SECOND remedy, under an explicit "neither of these is the diagnosis" paragraph.** The page already tells the reader that a guard is what closes the loop on a re-run, and omitting it would leave the new section contradicting the existing one. The error MESSAGE still says nothing about guards. **What it touches:** the existing "What closes the loop on the re-run" section and `../execute-guard/`.
- **No ADR written.** The choice above is small and reversible (one predicate in one pure function), and ADR 0012 already carries the underlying reasoning; the rationale lives in the function's JSDoc and here.
