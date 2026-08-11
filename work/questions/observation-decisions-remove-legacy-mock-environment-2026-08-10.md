<!-- dorfl-sidecar: item=observation:decisions-remove-legacy-mock-environment-2026-08-10 type=observation slug=decisions-remove-legacy-mock-environment-2026-08-10 allAnswered=false -->

Item: [`observation:decisions-remove-legacy-mock-environment-2026-08-10`](../notes/observations/decisions-remove-legacy-mock-environment-2026-08-10.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratify decision 2 as-is; REVERSE decision 1.**

Decision 2 (inverting the transitional test into a regrowth fence rather than deleting it) is right and stays.

Decision 1 is not: the three unreleased changesets (`test-env-harness.md`, `migrate-deploy-and-read-tests.md`, `migrate-proxy-diamond-tests.md`) still describe `createMockEnvironment` as live, and they will be folded into the SAME published `@rocketh/test-utils` version as `.changeset/remove-legacy-mock-environment.md`'s "**Breaking:** remove the legacy `createMockEnvironment`". A consumer reading one CHANGELOG entry would see a direct contradiction. The stated reason for leaving them ("rewriting history corrupts the record") does not apply, because nothing has been PUBLISHED yet, so trimming the now-false "still exported / still used" clauses misdescribes no released version. Trim those clauses before the next release.
