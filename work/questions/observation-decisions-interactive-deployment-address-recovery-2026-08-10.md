<!-- dorfl-sidecar: item=observation:decisions-interactive-deployment-address-recovery-2026-08-10 type=observation slug=decisions-interactive-deployment-address-recovery-2026-08-10 allAnswered=false -->

Item: [`observation:decisions-interactive-deployment-address-recovery-2026-08-10`](../notes/observations/decisions-interactive-deployment-address-recovery-2026-08-10.md)

## Q1

**Should the flagged in-module collision on the term 'origin' (BroadcastOrigin's 'what produced this tx' bag vs PendingTransaction.transaction.origin's SENDER ADDRESS) be resolved now by renaming one, or left as-is with only a glossary note?**

> Decision 6 in the observation body explicitly flags this as noted-but-not-introduced-here, out of scope for the originating task. Two live meanings sit in packages/rocketh/src/environment/index.ts (BroadcastOrigin at ~L83; PendingTransaction ...origin at L1361/L1393/L1421/L1454) and neither is in CONTEXT.md's glossary. The observation says renaming either is out of scope; the open judgement is whether to spawn a follow-up task/ADR before a third meaning appears.

_Suggested default: Spawn a small follow-up task to add both terms to CONTEXT.md's glossary and defer any rename until a concrete third use forces it._

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):
