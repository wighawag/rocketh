---
title: Remove the legacy createMockEnvironment fake
slug: remove-legacy-mock-environment
blockedBy: [migrate-deploy-and-read-tests, migrate-proxy-diamond-tests, unknown-signer-contract-enrichment]
covers: []
---

## What to build

CONTRACT step (`TASKING-PROTOCOL.md` §3a): once every caller has moved, delete the fabricated harness so the repo has ONE way to build a test environment and cannot silently regrow a second reality.

- Delete `createMockEnvironment` and the hand-built environment literal behind it, including its reimplementations of `broadcastExecution` and `broadcastDeployment` — the specific code whose existence meant no test ever executed the real environment module.
- Keep `createMockArtifact` and the mock provider utilities; they are orthogonal and still used.
- `@rocketh/test-utils` is a PUBLISHED package, so removing an export is a breaking change. It needs a changeset with a migration line telling users to switch to `createTestEnvironment` and `await` it. The bump is **minor** — answered by the maintainer (see `work/questions/task-remove-legacy-mock-environment.md`), since at `0.x` a minor is the conventional break signal. That answer IS the human confirmation the convention requires, so do not stop to ask again.
- Note `unknown-signer-package` also edits `AGENTS.md` and `documentation.md` (to add the new package to the lists) and is not ordered against this task, so keep your edits to the harness-related lines and expect theirs to be elsewhere in the same files.
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

## Decisions

_Transcribed from `work/notes/observations/decisions-remove-legacy-mock-environment-2026-08-10.md`, deleted in the same commit. That note predated the protocol rule (synced 2026-08-11) that gives a builder's rationale exactly ONE home: a `## Decisions` block in the done record. The rationale is reproduced unchanged below, followed by the human's ratification._

Two judgement calls made in `remove-legacy-mock-environment` that the task did not pin down. Recorded here so a reviewer can ratify or reverse them.

1. **Pending changesets under `.changeset/` were NOT edited, so they are a third grep exception beyond the two the task names.** The task's acceptance criterion allows exactly two remaining references to `createMockEnvironment` (the `work/` archive, and the `CONTEXT.md` glossary entry reworded to the past tense). Four `.changeset/*.md` files also name it: `migrate-deploy-and-read-tests.md`, `migrate-proxy-diamond-tests.md`, `unknown-signer-contract-enrichment.md`, `test-env-harness.md`. Those are unreleased release notes for changes that ALREADY landed, and each statement was true of its own change (e.g. `test-env-harness.md` says the legacy harness "is unchanged and still exported", which is what that change did). Rewriting them to keep a grep clean would make the generated CHANGELOG misdescribe those releases, the same corruption the task forbids for `work/tasks/done/`. The new `.changeset/remove-legacy-mock-environment.md` names the symbol too, because the migration note the criterion asks for has to say what was removed. Alternative considered: strip the name from the three older changesets. Rejected for the reason above. Touches: the next release's CHANGELOG for `@rocketh/test-utils` only.

2. **The transitional "legacy harness is still exported" test was INVERTED into a regrowth fence, not deleted.** `packages/rocketh-test-utils/test/createTestEnvironment.test.ts` carried `it('createMockEnvironment is still exported (this task adds; it does not migrate)')` from the expand step. Its subject no longer exists, so deleting it was one option, but the acceptance criterion says no test may be deleted or weakened, and the removal's whole value is that a second notion of a test environment cannot regrow. It now asserts the package exports exactly ONE `create*Environment` builder, which fences the regression under ANY name and avoids referencing the removed symbol (keeping the source/test grep clean). Verified red by temporarily re-adding a `createMockEnvironment` export. Alternative considered: `expect('createMockEnvironment' in testUtils).toBe(false)`, which is more direct but names the removed symbol in a TEST, contradicting the criterion. Touches: nothing outside this test file.

### Note

`TESTING.md` also claimed "the integration tests use inline mock helpers rather than a separate test utilities package", which was stale and contradicted the rest of the same file. Updated to point at `@rocketh/test-utils` / `await createTestEnvironment(...)` as part of the "docs consistent" criterion.

### Ratification (2026-08-11 observation triage)

**Ratify decision 2 as-is; REVERSE decision 1.**

Decision 2 (inverting the transitional test into a regrowth fence rather than deleting it) is right and stays.

Decision 1 is not: the three unreleased changesets (`test-env-harness.md`, `migrate-deploy-and-read-tests.md`, `migrate-proxy-diamond-tests.md`) still describe `createMockEnvironment` as live, and they will be folded into the SAME published `@rocketh/test-utils` version as `.changeset/remove-legacy-mock-environment.md`'s "**Breaking:** remove the legacy `createMockEnvironment`". A consumer reading one CHANGELOG entry would see a direct contradiction. The stated reason for leaving them ("rewriting history corrupts the record") does not apply, because nothing has been PUBLISHED yet, so trimming the now-false "still exported / still used" clauses misdescribes no released version. ALREADY DONE, discovered while executing this: commit `0c93870` ("chore(changesets): stop three pending entries contradicting the createMockEnvironment removal") trimmed the false clause from `test-env-harness.md` and `unknown-signer-contract-enrichment.md`. The two `migrate-*` changesets still name the symbol but have EMPTY frontmatter, so they bump nothing and generate no CHANGELOG entry at all; correctly left alone. Nothing further to do here.
