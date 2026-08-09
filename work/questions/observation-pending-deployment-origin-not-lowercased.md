<!-- dorfl-sidecar: item=observation:pending-deployment-origin-not-lowercased type=observation slug=pending-deployment-origin-not-lowercased allAnswered=false -->

Item: [`observation:pending-deployment-origin-not-lowercased`](../notes/observations/pending-deployment-origin-not-lowercased-2026-08-09.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

## Q2

**Is `transaction.origin` on a pending/saved deployment an identity VALUE or a match KEY, and therefore should the four sites be made consistent by lowercasing all of them, or by lowercasing none of them?**

> Two of the four sites lowercase (`broadcastExecution` and `broadcastDeployment`) and two do not (`waitForDeploymentTransactionAndSave` and `savePendingDeployment`). The direction is genuinely open rather than an obvious tidy-up, because this repo has just ratified the opposite convention for user-visible addresses: commit `09ea46d` normalised the `addressSigners` map KEYS while deliberately leaving `namedAccounts`/`unnamedAccounts` VALUES checksummed, since they reach deployment records and frontend exports where EIP-55 is an integrity feature. If `origin` is user-visible in the same way, the lowercasing sites are the anomaly.
>
> Answering needs a trace of who consumes `transaction.origin` (transaction recovery in particular), which was not done.

<!-- q2 fields: id=q2 -->

**Your answer** (write below this line):
