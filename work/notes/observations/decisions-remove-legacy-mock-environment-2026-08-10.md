---
title: Decisions taken while removing the legacy createMockEnvironment fake
date: 2026-08-10
status: open
taskOf: remove-legacy-mock-environment
needsAnswers: true
---

## Decisions

Two judgement calls made in `remove-legacy-mock-environment` that the task did not pin down. Recorded here so a reviewer can ratify or reverse them.

1. **Pending changesets under `.changeset/` were NOT edited, so they are a third grep exception beyond the two the task names.** The task's acceptance criterion allows exactly two remaining references to `createMockEnvironment` (the `work/` archive, and the `CONTEXT.md` glossary entry reworded to the past tense). Four `.changeset/*.md` files also name it: `migrate-deploy-and-read-tests.md`, `migrate-proxy-diamond-tests.md`, `unknown-signer-contract-enrichment.md`, `test-env-harness.md`. Those are unreleased release notes for changes that ALREADY landed, and each statement was true of its own change (e.g. `test-env-harness.md` says the legacy harness "is unchanged and still exported", which is what that change did). Rewriting them to keep a grep clean would make the generated CHANGELOG misdescribe those releases, the same corruption the task forbids for `work/tasks/done/`. The new `.changeset/remove-legacy-mock-environment.md` names the symbol too, because the migration note the criterion asks for has to say what was removed. Alternative considered: strip the name from the three older changesets. Rejected for the reason above. Touches: the next release's CHANGELOG for `@rocketh/test-utils` only.

2. **The transitional "legacy harness is still exported" test was INVERTED into a regrowth fence, not deleted.** `packages/rocketh-test-utils/test/createTestEnvironment.test.ts` carried `it('createMockEnvironment is still exported (this task adds; it does not migrate)')` from the expand step. Its subject no longer exists, so deleting it was one option, but the acceptance criterion says no test may be deleted or weakened, and the removal's whole value is that a second notion of a test environment cannot regrow. It now asserts the package exports exactly ONE `create*Environment` builder, which fences the regression under ANY name and avoids referencing the removed symbol (keeping the source/test grep clean). Verified red by temporarily re-adding a `createMockEnvironment` export. Alternative considered: `expect('createMockEnvironment' in testUtils).toBe(false)`, which is more direct but names the removed symbol in a TEST, contradicting the criterion. Touches: nothing outside this test file.

## Note

`TESTING.md` also claimed "the integration tests use inline mock helpers rather than a separate test utilities package", which was stale and contradicted the rest of the same file. Updated to point at `@rocketh/test-utils` / `await createTestEnvironment(...)` as part of the "docs consistent" criterion.
