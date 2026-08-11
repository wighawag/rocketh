---
title: review-gate non-blocking nits for 'remove-legacy-mock-environment' (Gate 2 approve)
date: 2026-08-10
status: open
reviewOf: remove-legacy-mock-environment
needsAnswers: true
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'remove-legacy-mock-environment' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Ratify decision 1 (pending changesets left naming the removed symbol): three UNRELEASED changesets still describe the legacy builder as live (test-env-harness.md says it is unchanged and still exported; migrate-deploy-and-read-tests.md says it is untouched and still used by proxy/diamond; migrate-proxy-diamond-tests.md names it), and all of them will be folded into the SAME next published @rocketh/test-utils version as the new 'Breaking: remove createMockEnvironment' note. A consumer reading that one CHANGELOG entry sees a direct contradiction. The agent's stated reason for not touching them (rewriting history corrupts the record, as with work/tasks/done/) does not fully hold here: nothing has been published yet, so trimming the now-false 'still exported / still used' clauses would not misdescribe any RELEASED version. Ratify as-is or trim those clauses.
  (the `## Decisions` block of `work/tasks/done/remove-legacy-mock-environment.md` decision 1; .changeset/test-env-harness.md:5, .changeset/migrate-deploy-and-read-tests.md:4, .changeset/migrate-proxy-diamond-tests.md:4 vs .changeset/remove-legacy-mock-environment.md:5)
- Ratify decision 2 (transitional test inverted into a regrowth fence rather than deleted): the fence is name-shaped. It enumerates Object.keys of the package index and matches /^create.\*Environment$/, so a regrown fabricated harness named createFakeEnv, makeEnvironment, or exported from a secondary entry point would pass. It also trips on any legitimate SECOND builder added to this package, which is probably the intent but is a stricter rule than CONTEXT.md's prose (which sanctions two real builders on opposite sides of the dependency edge, in different packages). Keeping the test rather than deleting it is the right call under the no-test-deleted criterion; the question is only whether the human wants the fence narrower or wider.
  (packages/rocketh-test-utils/test/createTestEnvironment.test.ts:49-63; CONTEXT.md:19)
- The acceptance criterion asked the builder to verify by search AND state in the done record that only the two sanctioned references remain. The done record moved byte-identical (R100, no edit) and carries no link to where that verification is stated; it lives only in the observation note, discoverable via its filename slug and taskOf frontmatter. This looks like a protocol tension rather than agent fault, since CLAIM-PROTOCOL forbids the building agent from touching the task body. No action needed on the code.
  (git show --name-status HEAD: R100 work/tasks/ready/... -> work/tasks/done/remove-legacy-mock-environment.md; work/protocol/CLAIM-PROTOCOL.md:154-180)
