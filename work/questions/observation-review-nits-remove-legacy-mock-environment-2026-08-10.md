<!-- dorfl-sidecar: item=observation:review-nits-remove-legacy-mock-environment-2026-08-10 type=observation slug=review-nits-remove-legacy-mock-environment-2026-08-10 allAnswered=false -->

Item: [`observation:review-nits-remove-legacy-mock-environment-2026-08-10`](../notes/observations/review-nits-remove-legacy-mock-environment-2026-08-10.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratified, with ONE reversal** (recorded in full on the `decisions-remove-legacy-mock-environment` note). The task this reviews is in `work/tasks/done/`, so none of this blocks anything.

This review is RIGHT that decision 1 does not hold: the three unreleased changesets still describing `createMockEnvironment` as live (`test-env-harness.md`, `migrate-deploy-and-read-tests.md`, `migrate-proxy-diamond-tests.md`) will publish in the SAME `@rocketh/test-utils` version as the "Breaking: remove" note, so one CHANGELOG entry would contradict itself. Nothing has been published, so trimming the now-false "still exported / still used" clauses misdescribes no released version. ALREADY DONE: commit `0c93870` trimmed the false clause from the two changesets that actually bump the package. The two `migrate-*` changesets have EMPTY frontmatter, so they generate no CHANGELOG entry and were correctly left alone.

Decision 2's name-shaped regrowth fence is ratified as-is, neither narrower nor wider: it trips on any second `create*Environment` builder in this package, which is the intent, and `CONTEXT.md`'s sanctioned "two builders" are in different packages on opposite sides of the dependency edge.

The third finding (the done record moved byte-identical, so the required verification statement lives only in the note) is a protocol tension, not agent fault, and is covered by the separate repo-wide question about where a builder's rationale is allowed to live.
