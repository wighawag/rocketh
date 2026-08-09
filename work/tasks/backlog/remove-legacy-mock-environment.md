---
title: Remove the legacy createMockEnvironment fake
slug: remove-legacy-mock-environment
blockedBy: [migrate-deploy-and-read-tests, migrate-proxy-diamond-tests, unknown-signer-contract-enrichment]
needsAnswers: true
covers: []
---

## Open questions

1. What version bump should the breaking removal of the `createMockEnvironment` export carry? `@rocketh/test-utils` is published at `0.x`, so a minor is the conventional way to signal a break at this stage, but repo convention says a breaking change is flagged for human confirmation rather than decided by the agent. Answer this and the flag can be cleared.

## What to build

CONTRACT step (`TASKING-PROTOCOL.md` §3a): once every caller has moved, delete the fabricated harness so the repo has ONE way to build a test environment and cannot silently regrow a second reality.

- Delete `createMockEnvironment` and the hand-built environment literal behind it, including its reimplementations of `broadcastExecution` and `broadcastDeployment` — the specific code whose existence meant no test ever executed the real environment module.
- Keep `createMockArtifact` and the mock provider utilities; they are orthogonal and still used.
- `@rocketh/test-utils` is a PUBLISHED package, so removing an export is a breaking change. It needs a changeset with a migration line telling users to switch to `createTestEnvironment` and `await` it. Do NOT decide the bump yourself: repo convention is that a breaking bump is flagged for human confirmation, so propose one and ask.
- Update every remaining mention in the docs, including `AGENTS.md` (which currently names `createMockEnvironment` in both its `Do` list and its test-structure example) and any reference in `documentation.md` / `TESTING.md`.
- Do NOT rename `createTestEnvironment` back to `createMockEnvironment` on the way out. It would churn every call site a second time for a cosmetic gain, and the new name is more honest: it builds a real environment, it does not mock one.

**Precondition to verify before starting, not after:** no test anywhere still uses the legacy harness. Both migration batches are required to migrate fully or bounce to needs-attention, so a straggler means a migration did not actually finish. If you find one, route to needs-attention rather than deleting the harness out from under it and weakening the test to compensate.

## Acceptance criteria

- [ ] `createMockEnvironment` and its hand-built environment literal are gone; no reimplementation of `broadcastExecution` / `broadcastDeployment` remains in `@rocketh/test-utils`.
- [ ] `createMockArtifact` and the mock provider helpers still exist and still work.
- [ ] No SOURCE file, TEST, or LIVE doc references `createMockEnvironment`, with two deliberate exceptions (verify by search and state in the done record that you did). Historical records must NOT be edited: `work/tasks/done/` entries and launch-snapshot specs describe what was true when written, and rewriting them to keep a grep clean would corrupt the archive. And the `CONTEXT.md` glossary entry distinguishing _test environment_ from _mock environment_ must be KEPT, reworded to the past tense: it exists precisely so a future author cannot re-fork the two concepts, and deleting it would invite exactly the regression this sequence removes.
- [ ] `AGENTS.md`, and any other doc naming the old harness, points at `createTestEnvironment` with the `await` shown.
- [ ] A changeset records the breaking removal with a one-line migration note.
- [ ] No test was deleted, skipped, or weakened as part of the removal.
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass across the workspace.

## Blocked by

- `migrate-deploy-and-read-tests` — batch 1 of the migration.
- `migrate-proxy-diamond-tests` — batch 2. Neither batch is permitted to leave anything behind on the legacy harness, so if a test still uses it, a migration did not finish.
- `unknown-signer-contract-enrichment` — not a logical dependency but a SERIALISING one: that task may edit the legacy harness's copy of the `broadcastExecution` signature, and this task deletes it. Both are reachable in parallel, so the ordering is pinned here rather than left to a merge conflict.

## Prompt

> Delete the legacy `createMockEnvironment` from `packages/rocketh-test-utils` now that every caller has moved to `createTestEnvironment`. This is the contract step of expand → migrate → contract; its whole value is that the repo stops having two different notions of a test environment.
>
> FIRST, check this task against current reality (launch snapshot may have DRIFTED): search the repo for `createMockEnvironment` and confirm the only remaining references are the definition itself and documentation. If a TEST still uses it, a migration did not finish — do not delete the harness and patch the straggler; route to needs-attention instead.
>
> Keep `createMockArtifact` and the mock provider helpers. The thing being removed is specifically the fabricated `Environment` literal and its own `broadcastExecution` / `broadcastDeployment`, which are why no test ever ran the real environment module.
>
> `@rocketh/test-utils` is published, so this is a breaking export removal: write a changeset with the right bump and a one-line migration note (switch to `createTestEnvironment`, and `await` it).
>
> Do not rename the new function to the old name. A second rename would churn every call site for cosmetics, and `createTestEnvironment` is the more honest name for something that builds a real environment.
>
> Done means: one harness, no fake, docs consistent, nothing skipped or weakened, and a clean workspace gate.
