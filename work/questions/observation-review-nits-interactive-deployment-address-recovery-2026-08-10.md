<!-- dorfl-sidecar: item=observation:review-nits-interactive-deployment-address-recovery-2026-08-10 type=observation slug=review-nits-interactive-deployment-address-recovery-2026-08-10 allAnswered=false -->

Item: [`observation:review-nits-interactive-deployment-address-recovery-2026-08-10`](../notes/observations/review-nits-interactive-deployment-address-recovery-2026-08-10.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratified - all findings in this note are accepted as-is; no reversal.** The task this reviews is in `work/tasks/done/`, so none of these block anything.

All accepted: the required discriminated origin bag, the unanswerable-`eth_getCode` refusal, and ignoring the receipt's own `contractAddress` when an expected address exists.

Two of these are now ACTED ON rather than merely ratified:

- the missing test for the unanswerable-`eth_getCode` refusal now exists (`packages/rocketh/test/interactive-deployment-address.test.ts`, "fails when the node cannot answer the code lookup"), and `documentation.md` names that failure shape alongside the other three;
- the `origin` collision is resolved by renaming the choke point's bag to `BroadcastSource` (parameter `source`). `PendingTransaction.transaction.origin` keeps the name and its meaning, the sender address.

Keep the note until the residue above is either acted on or judged not worth acting on; it is the only record of these choices outside the code.
