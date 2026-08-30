---
title: 'Matrix entry: re-running before governance executes surfaces the same set, broadcasts nothing twice'
slug: unknown-signer-matrix-idempotent-rerun-before-execution
spec: governance-topology-validation
blockedBy: [unknown-signer-matrix-ordered-upgrade-and-followup]
covers: [4]
---

## What to build

Extend the matrix with a scenario that runs a mixed deploy script (some signable steps, some deferrals against a multisig owner), then runs it AGAIN with no on-chain state change between runs — governance did NOT execute yet. Assert:

- the second run surfaces the IDENTICAL set of deferred transactions as the first (same `from`/`to`/`value`/`data`, same order);
- no signable step is broadcast twice (broadcast-tx count on the mock provider stays flat across the second run for the already-deployed contracts);
- deployment records remain consistent (the signable deployment written on run 1 is still there on run 2, and its address doesn't change);
- nothing persisted between runs — no unsigned-tx file appears.

This is the "re-run is free" property, and it is distinct from the existing "re-run AFTER execution" story (which proves convergence via an on-chain state check). Writing this as its own scenario keeps the two properties independently verifiable.

## Acceptance criteria

- [ ] New integration test(s) in `packages/rocketh-unknown-signer/test/` cover idempotent re-run BEFORE governance executes.
- [ ] Test drives two runs of the same script against the same mock provider without mutating any storage slots between runs.
- [ ] Test asserts identical deferred set on both runs.
- [ ] Test asserts no signable step is re-broadcast on run 2 (assert against the mock provider's tx count / call log).
- [ ] Uses `createTestEnvironment` / `createMockArtifact`.
- [ ] `pnpm --filter @rocketh/unknown-signer test` passes.

## Blocked by

- `unknown-signer-matrix-ordered-upgrade-and-followup` — serialized to avoid parallel edits to `scenarios.integration.test.ts`.

## Prompt

> Goal: pin the "re-running before governance executes costs nothing" property as an executable test, distinct from the existing "re-run after execution converges" story.
>
> FIRST, check this task against current reality. Read `packages/rocketh-unknown-signer/test/scenarios.integration.test.ts`, especially Story 6 (mixed run) and Story 7 (re-run after execution), to see the shape and to avoid duplicating the AFTER-execution assertion. Read the spec `work/specs/tasked/governance-topology-validation.md` story 4 for the precise wording of the property.
>
> Domain vocabulary: `catchUnknownSigner`, signable/unsignable, the mock provider from `createTestEnvironment` (RPCs answered, not executed — so "broadcast count" is measurable against the provider's call log).
>
> Seam: same `broadcastTransaction` signability branch, exercised twice with no state mutation in between.
>
> "Done" means: a describe block that runs the script twice, asserts identical surfaced set and flat broadcast count for the already-deployed signable steps, with narration explaining why this matters (a user can re-run whenever they lose their terminal without cost).
