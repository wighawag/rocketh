<!-- dorfl-sidecar: item=observation:review-nits-per-call-ask-override-and-deferral-precedence-2026-08-10 type=observation slug=review-nits-per-call-ask-override-and-deferral-precedence-2026-08-10 allAnswered=false -->

Item: [`observation:review-nits-per-call-ask-override-and-deferral-precedence-2026-08-10`](../notes/observations/review-nits-per-call-ask-override-and-deferral-precedence-2026-08-10.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratified - all findings in this note are accepted as-is; no reversal.** The task this reviews is in `work/tasks/done/`, so none of these block anything.

Decisions 1, 2 and 3 are ratified; see the answers on the `decisions-per-call-ask-override-and-deferral-precedence` note.

Live residue, and this one is a real doc defect rather than a nit: `packages/rocketh/src/environment/unknownSignerPolicy.ts` still carries a `DYNAMIC SCOPE INVARIANT` paragraph asserting that the `Promise.all` frame leak can only make a concurrent action throw where it would have prompted, "never the other way round, since a frame only ever forces `throw`". `withUnknownSignerPolicy` can now push `'ask'` or `'auto'`, so that sentence is FALSE as written. Correct it, together with the matching text in the package module JSDoc / ADR 0006, `documentation.md:574`'s missing nesting caveat, and the new subsection's heading position.

Keep the note until the residue above is either acted on or judged not worth acting on; it is the only record of these choices outside the code.
