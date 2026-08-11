<!-- dorfl-sidecar: item=observation:review-nits-unknown-signer-broadcast-seam-2026-08-09 type=observation slug=review-nits-unknown-signer-broadcast-seam-2026-08-09 allAnswered=false -->

Item: [`observation:review-nits-unknown-signer-broadcast-seam-2026-08-09`](../notes/observations/review-nits-unknown-signer-broadcast-seam-2026-08-09.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratified - all findings in this note are accepted as-is; no reversal.** The task this reviews is in `work/tasks/done/`, so none of these block anything.

Ratified: the unbalanced pop as a silent no-op (a mis-nested wrapper must not abort a run from inside a `finally`, where it would mask the real error), and `onUnknownSigner` staying OPTIONAL on the resolved `ChainConfig` so "absent" remains distinguishable from an explicit chain-level `'auto'`.

The fourth finding is now DEAD: the legacy `createMockEnvironment` it warns about (typechecking through `as unknown as Environment` while lacking the two new required methods at runtime) has been removed from `@rocketh/test-utils`. The `nodeAccounts` interaction it flags is likewise spent, since every downstream harness-using task has landed.

Keep the note until the residue above is either acted on or judged not worth acting on; it is the only record of these choices outside the code.
