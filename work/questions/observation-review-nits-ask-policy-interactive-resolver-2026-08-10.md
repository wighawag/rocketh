<!-- dorfl-sidecar: item=observation:review-nits-ask-policy-interactive-resolver-2026-08-10 type=observation slug=review-nits-ask-policy-interactive-resolver-2026-08-10 allAnswered=false -->

Item: [`observation:review-nits-ask-policy-interactive-resolver-2026-08-10`](../notes/observations/review-nits-ask-policy-interactive-resolver-2026-08-10.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratified, with one finding turned into work and one still open.** The task this reviews is in `work/tasks/done/`, so none of it blocks anything.

- **The unknown-hash bound: CHANGED, not ratified.** A hash the node cannot find should NOT end the run. It should RE-ASK, with the previously typed hash PRE-FILLED, so a truncated paste or an RPC that has not caught up costs an edit instead of a whole re-run. Minted as `work/tasks/backlog/re-ask-a-not-found-pasted-hash-with-the-previous-value.md`, which carries the constraint that the bound itself must survive in some form (an unbounded re-ask is the hang the current bound exists to prevent) and must reconcile with the malformed-input re-ask that already exists.
- **The `docs/spikes/` vs `work/notes/findings/` question** is being decided upstream in `../dorfl`, where the protocol source of truth lives, together with the `decisions-*` note-kind and missing-Decisions-block questions.
- **The stale symbol** (`requireSuccessfulExecutedTransaction`, which never existed; the landed function is `waitForPastedTransaction`) is FIXED in the decisions note it was raised against.
- **Still open, deliberately:** whether the runtime should also withhold the text ability when `process.env.CI` is set. A CI runner that allocates a pty still gets `promptText` today, so the guarantee rests on `process.stdin.isTTY` alone.
