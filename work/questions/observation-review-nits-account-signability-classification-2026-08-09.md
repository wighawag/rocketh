<!-- dorfl-sidecar: item=observation:review-nits-account-signability-classification-2026-08-09 type=observation slug=review-nits-account-signability-classification-2026-08-09 allAnswered=false -->

Item: [`observation:review-nits-account-signability-classification-2026-08-09`](../notes/observations/review-nits-account-signability-classification-2026-08-09.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratified - all findings in this note are accepted as-is; no reversal.** The task this reviews is in `work/tasks/done/`, so none of these block anything.

Residue worth knowing: the never-seen-returns-`unsignable` contract is implemented as a JS Proxy over the map and is undocumented on the type, so a consumer who iterates or spreads `addressSignability` sees only addresses actually classified. Accepted; a `getSignability(address)` helper is not being added now. The missing `## Decisions` block is covered by the separate, repo-wide process question.

Keep the note until the residue above is either acted on or judged not worth acting on; it is the only record of these choices outside the code.
