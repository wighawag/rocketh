---
title: 'Say that a re-run will surface the same deferred transaction again, and that a stale hash can still be pasted'
slug: deferral-message-warns-about-repeat-execution
blockedBy: []
covers: []
---

## What to build

Two sentences that are currently missing from the one place the user is guaranteed to be looking.

**The warning.** Under `throw`, rocketh prints the transaction to execute out of band, aborts, and records nothing (correctly, since it observed nothing: ADR 0012). The operator executes it on their Safe and re-runs. rocketh has no way to know it happened, so it surfaces the IDENTICAL transaction again. If the operator follows the instructions a second time, the call executes twice. For an idempotent setter that is a wasted round trip; for a mint, a transfer, an increment or a governance action carrying its own nonce it is a real loss. Nothing says this today, and it is inherited from hardhat-deploy v1 unchanged.

So the message must say it: re-running will surface this transaction again unless the step is guarded on chain state, and executing it twice may not be harmless. This is the same reasoning as the existing capability-degradation note, and it belongs next to it.

**The recovery.** The interactive path has a way out that nobody knows about, because nothing states it. There is NO recency check on the pasted hash (`packages/rocketh/src/environment/interactiveUnknownSigner.ts` and `pastedTransactionIntent.ts` check inclusion, success and evidence tier, not age), so a hash from a transaction executed after a PREVIOUS run is accepted and resolves the step in the current run. That turns a stale deferral into something recoverable without editing the script. Say so at the prompt, and in the docs.

Scope discipline, because these messages are load-bearing and easy to bloat:

- Keep it to the `throw` path's message and the interactive prompt. Do not touch the transaction block itself (`formatDeferredTransaction` in `@rocketh/unknown-signer`), which is v1's layout and is pinned by the migration parity work.
- Say nothing new on the `catchUnknownSigner` path. That wrapper's whole point is that the user already decided to handle this, and the existing code is deliberately quiet there (see `describeUnknownSignerCapabilityDegradation`, which returns `undefined` for an explicit `'throw'` for exactly this reason). A user who wrapped the call does not need to be told the run will surface it again, because the run did not stop.
- No em dashes in any message text (repo rule, and the existing note in `unknownSignerPolicy.ts` already calls this out).

## Acceptance criteria

- [ ] An unwrapped deferral under `throw` includes the repeat-execution warning in the surfaced error message
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
> Sentence one: under `throw`, tell the user that a re-run will surface this same transaction again unless the step is guarded on chain state, and that executing it twice may not be harmless. rocketh cannot detect that they already executed it, which is precisely why it has to say so.
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
