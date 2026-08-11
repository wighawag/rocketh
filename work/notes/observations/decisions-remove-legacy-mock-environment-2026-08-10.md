---
title: Decisions taken while removing the legacy createMockEnvironment fake
date: 2026-08-10
status: open
taskOf: remove-legacy-mock-environment
needsAnswers: false
---

## Decisions

Two judgement calls made in `remove-legacy-mock-environment` that the task did not pin down. Recorded here so a reviewer can ratify or reverse them.

1. **Pending changesets under `.changeset/` were NOT edited, so they are a third grep exception beyond the two the task names.** The task's acceptance criterion allows exactly two remaining references to `createMockEnvironment` (the `work/` archive, and the `CONTEXT.md` glossary entry reworded to the past tense). Four `.changeset/*.md` files also name it: `migrate-deploy-and-read-tests.md`, `migrate-proxy-diamond-tests.md`, `unknown-signer-contract-enrichment.md`, `test-env-harness.md`. Those are unreleased release notes for changes that ALREADY landed, and each statement was true of its own change (e.g. `test-env-harness.md` says the legacy harness "is unchanged and still exported", which is what that change did). Rewriting them to keep a grep clean would make the generated CHANGELOG misdescribe those releases, the same corruption the task forbids for `work/tasks/done/`. The new `.changeset/remove-legacy-mock-environment.md` names the symbol too, because the migration note the criterion asks for has to say what was removed. Alternative considered: strip the name from the three older changesets. Rejected for the reason above. Touches: the next release's CHANGELOG for `@rocketh/test-utils` only.

2. **The transitional "legacy harness is still exported" test was INVERTED into a regrowth fence, not deleted.** `packages/rocketh-test-utils/test/createTestEnvironment.test.ts` carried `it('createMockEnvironment is still exported (this task adds; it does not migrate)')` from the expand step. Its subject no longer exists, so deleting it was one option, but the acceptance criterion says no test may be deleted or weakened, and the removal's whole value is that a second notion of a test environment cannot regrow. It now asserts the package exports exactly ONE `create*Environment` builder, which fences the regression under ANY name and avoids referencing the removed symbol (keeping the source/test grep clean). Verified red by temporarily re-adding a `createMockEnvironment` export. Alternative considered: `expect('createMockEnvironment' in testUtils).toBe(false)`, which is more direct but names the removed symbol in a TEST, contradicting the criterion. Touches: nothing outside this test file.

## Note

`TESTING.md` also claimed "the integration tests use inline mock helpers rather than a separate test utilities package", which was stale and contradicted the rest of the same file. Updated to point at `@rocketh/test-utils` / `await createTestEnvironment(...)` as part of the "docs consistent" criterion.

## Applied answers 2026-08-11

### q1: What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).

**Ratify decision 2 as-is; REVERSE decision 1.**

Decision 2 (inverting the transitional test into a regrowth fence rather than deleting it) is right and stays.

Decision 1 is not: the three unreleased changesets (`test-env-harness.md`, `migrate-deploy-and-read-tests.md`, `migrate-proxy-diamond-tests.md`) still describe `createMockEnvironment` as live, and they will be folded into the SAME published `@rocketh/test-utils` version as `.changeset/remove-legacy-mock-environment.md`'s "**Breaking:** remove the legacy `createMockEnvironment`". A consumer reading one CHANGELOG entry would see a direct contradiction. The stated reason for leaving them ("rewriting history corrupts the record") does not apply, because nothing has been PUBLISHED yet, so trimming the now-false "still exported / still used" clauses misdescribes no released version. ALREADY DONE, discovered while executing this: commit `0c93870` ("chore(changesets): stop three pending entries contradicting the createMockEnvironment removal") trimmed the false clause from `test-env-harness.md` and `unknown-signer-contract-enrichment.md`. The two `migrate-*` changesets still name the symbol but have EMPTY frontmatter, so they bump nothing and generate no CHANGELOG entry at all; correctly left alone. Nothing further to do here.
