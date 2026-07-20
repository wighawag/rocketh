---
title: Explore — Unknown Signer Convenience Adapters (Safe / protocol / batching)
slug: explore-unknown-signer-adapters
taskedAfter: [unknown-signer-core]
needsAnswers: true
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked — they move into tasks/ADRs and this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

**Kind: EXPLORATION spec.** Done = CONFIDENCE + a de-risked, sliced build plan — NOT shipped
adapters. The approach here is unproven (batching-inside-an-active-protocol tension, Safe SDK
dependency choices, a persisted-batch schema with no committed consumer). Do not author build
tasks that would be fiction; spike the risky questions on the narrowest real case, decide, and
emit a build plan for a follow-on build spec.

<!-- open-questions -->
## Open questions

1. **Batching vs active protocols.** `catchUnknownSigner` batches naturally (collect-and-defer,
   terminal, non-interactive). An ACTIVE signer protocol (prompt/propose per tx) is per-tx and
   blocking, so it does NOT batch for free. Should batching live ONLY on the collect-and-defer
   side (a post-run batch consumer over collected txs), or is a deferring-protocol lifecycle
   hook (`flush()` after all scripts, reconcile results back into state) ever worth its weight?
   SPIKE to a recommendation.
2. **Persisted batch schema — driven by its consumer.** A `.unsigned_transactions.json` (or
   similar) only earns its place once a consumer exists. What does the FIRST consumer need
   (raw tx list? Safe MultiSend encoding? Timelock-wrapped ops? provenance/`origin.scriptId`?
   chainId/safe address)? Design the schema AROUND that consumer, not before it.
3. **Safe submission surface.** Raw tx list for manual paste, Safe MultiSend calldata, or a
   direct Safe Transaction Service proposal via the Safe SDK? Which, and does the Safe SDK
   become an OPTIONAL dependency kept out of core?
4. **`external`/`safe` account-level protocol.** Is the v1-style account-scoped active
   wait-for-hash protocol (alongside `privateKey`/`ledger`) still wanted once the policy/call-
   level interactive resolver (from `unknown-signer-interactive`) exists, or does the resolver
   subsume it?
5. **Signing-page launcher.** Is launching a browser tab / WalletConnect signing page in scope,
   and can it batch (one page for N txs)? Feasibility spike.
<!-- /open-questions -->

## Problem Statement

Beyond the core defer primitive and the interactive resolver, there is a family of CONVENIENCE
adapters that would make the unsignable-`from` experience nicer: proposing directly to a Safe,
batching many deferred txs into one Safe MultiSend, an account-scoped active protocol (v1's
`external`), and possibly a signing-page launcher. These are all MORE than v1 ever had (v1 has
zero Safe integration). But their design is unproven and several carry real architectural
tension (notably batching vs active protocols, and a persisted batch schema with no committed
consumer). They belong on the SIGNER-PROTOCOL axis (like `privateKey`), not inside
`@rocketh/unknown-signer`, which stays a generic terminal net.

## Solution (exploration outcome, not shipped adapters)

De-risk each adapter question via a narrow spike, decide the module boundaries (what lives on
the protocol axis vs a post-run batch consumer vs core), design the persisted-batch schema
around a concrete first consumer, and emit a build plan (a follow-on build spec, ordered after
this) for whichever adapters are greenlit. No adapter is committed to ship from this spec.

## User Stories

1. As a maintainer, I want a recommendation on WHERE batching lives (collect-and-defer consumer
   vs deferring protocol) with the trade-offs spiked, so we do not contort the execution flow.
2. As a maintainer, I want a persisted-batch schema designed around a concrete first consumer
   (Safe MultiSend or raw list), so the file is not write-only guesswork.
3. As a deployer, I want (if greenlit) to emit a Safe-consumable artifact (raw list / MultiSend
   calldata / SDK proposal) from collected deferred txs — designed here, built later.
4. As a maintainer, I want a decision on whether the v1-style `external`/`safe` account-scoped
   protocol is still needed given the interactive resolver, so we do not build redundant paths.
5. As a maintainer, I want a feasibility read on a signing-page launcher and whether it can
   batch, so we know if it is worth a build spec.
6. As a maintainer, I want the Safe SDK dependency decision (optional, out of core) made
   explicitly.

## Autonomy notes

`needsAnswers: true` — exploration questions above gate tasking; they are spikes to resolve,
not build tasks. `taskedAfter: [unknown-signer-core]` (builds on the core seam and, for some
adapters, benefits from `unknown-signer-interactive` existing). Omitting `humanOnly`. Signal:
`explore-` slug prefix. The BUILD of any greenlit adapter is a follow-on build spec this
exploration de-risks and orders before.

## Implementation Decisions

- Adapters live on the SIGNER-PROTOCOL axis (mirroring `rocketh-signer`'s `privateKey`) and/or
  as a post-run batch consumer — NOT inside `@rocketh/unknown-signer`.
- Any persisted batch (`.unsigned_transactions.json` or similar) is defined WITH its consumer;
  it must NOT participate in script re-execution/idempotency (that stays purely on-chain-state-
  driven, per the core spec) to avoid two-sources-of-truth reconciliation bugs.
- Safe SDK, if used, is an optional dependency kept out of `@rocketh/core`.

## Testing Decisions

Spikes: the ANSWER/recommendation is the deliverable, not production code. Where a spike
produces a throwaway prototype (e.g. a MultiSend encoding, a batch-consumer sketch), it is
scoped to one question and discarded after the decision is recorded.

## Out of Scope

- The core defer primitive and interactive resolver (their own specs).
- Committing to ship any specific adapter (that is the follow-on build spec's job).

## Further Notes

- Batching tension, recorded across the design conversation: collect-and-defer batches
  naturally; active per-tx protocols do not. Leaning: batching belongs on the collect-and-defer
  consumer side, with the deferring-protocol lifecycle hook left as an explicitly open question.
- v1 prior art for the account-scoped active protocol: `../hardhat-deploy-v1/src/helpers.ts:1680`.
