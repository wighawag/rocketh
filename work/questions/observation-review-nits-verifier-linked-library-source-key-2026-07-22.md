<!-- dorfl-sidecar: item=observation:review-nits-verifier-linked-library-source-key-2026-07-22 type=observation slug=review-nits-verifier-linked-library-source-key-2026-07-22 allAnswered=false -->

Item: [`observation:review-nits-verifier-linked-library-source-key-2026-07-22`](../notes/observations/review-nits-verifier-linked-library-source-key-2026-07-22.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratified - all three findings accepted as-is; keep the note.** The task this reviews is in `work/tasks/done/` and this is the oldest note in the inbox (2026-07-22), so nothing here has proved urgent in practice.

Accepted: the `library <Name>` regex fallback can match inside a comment or a string literal (low impact, since the AST path is preferred and the fallback only runs when it fails); the first hit wins arbitrarily when two sources declare a library of the same name; and the error path skips the deployment and continues rather than throwing, matching the file's existing convention.

Live residue, in the order it would bite: the duplicate-name tie-break is the one with a plausible real trigger (test fixtures, forked dependency trees), and the cheapest improvement there is a WARNING naming both candidates rather than a full compilation-target-anchored resolution. The regex hardening (strip comments first) is a smaller win. Neither is scheduled.
