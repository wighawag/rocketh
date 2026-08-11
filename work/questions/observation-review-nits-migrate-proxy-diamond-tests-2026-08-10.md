<!-- dorfl-sidecar: item=observation:review-nits-migrate-proxy-diamond-tests-2026-08-10 type=observation slug=review-nits-migrate-proxy-diamond-tests-2026-08-10 allAnswered=false -->

Item: [`observation:review-nits-migrate-proxy-diamond-tests-2026-08-10`](../notes/observations/review-nits-migrate-proxy-diamond-tests-2026-08-10.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratified - all findings in this note are accepted as-is; no reversal.** The task this reviews is in `work/tasks/done/`, so none of these block anything.

Both added assertion blocks ratified as deliberate strengthenings, including the diamond facet block, which the builder correctly flagged as sitting OUTSIDE acceptance criterion 3's fence. Not trimmed back.

The create2-collision item this note flags as having no follow-up is now FIXED: `createExampleArtifact` varies bytecode per template, so the multi-facet example deploys three distinct contracts, and the example asserts it.

Live residue: the `NAMED_ACCOUNTS` / `NODE_ACCOUNTS` / `createEnv()` fixture triple is still duplicated verbatim in three test files, and a shared preset in `@rocketh/test-utils` is now unblocked since the legacy harness is gone.

Keep the note until the residue above is either acted on or judged not worth acting on; it is the only record of these choices outside the code.
