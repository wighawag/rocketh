<!-- dorfl-sidecar: item=observation:review-nits-injectable-prompt-executor-for-extension-tests-2026-08-10 type=observation slug=review-nits-injectable-prompt-executor-for-extension-tests-2026-08-10 allAnswered=false -->

Item: [`observation:review-nits-injectable-prompt-executor-for-extension-tests-2026-08-10`](../notes/observations/review-nits-injectable-prompt-executor-for-extension-tests-2026-08-10.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratified - all findings in this note are accepted as-is; no reversal.** The task this reviews is in `work/tasks/done/`, so none of these block anything.

All four reconstructed decisions accepted: the omit-vs-empty-array capability shape, the hardcoded `{proceed: true}` confirm half, an exhausted script throwing (and therefore surfacing as an `UnknownSignerError` through the resolver's degrade path), and `MockTextAnswer` additionally accepting an `Error` entry.

Live residue: the consumer-facing wording is genuinely misleading and should be tightened. The changeset (which becomes the published CHANGELOG) and `TESTING.md:77` both say "with no scripted answers", which a reader will apply to `textAnswers: []` too, but that gives a capability-PRESENT-but-exhausted prompt. Only OMITTING the option gives the capability-absent shape. FIXED while executing this: the changeset half was already corrected in commit `0c93870`, and `TESTING.md` now states the omit-vs-empty distinction explicitly.

Keep the note until the residue above is either acted on or judged not worth acting on; it is the only record of these choices outside the code.
