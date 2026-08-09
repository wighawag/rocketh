<!-- dorfl-sidecar: item=observation:pending-deployment-origin-not-lowercased-2026-08-09 type=observation slug=pending-deployment-origin-not-lowercased-2026-08-09 allAnswered=false -->

Item: [`observation:pending-deployment-origin-not-lowercased-2026-08-09`](../notes/observations/pending-deployment-origin-not-lowercased-2026-08-09.md)

## Q1

**Is pending deployment/execution `transaction.origin` an identity value (user-visible, keep EIP-55 like `namedAccounts`/`unnamedAccounts`) or an internal match key (lowercase everywhere) — and therefore should the four sites converge on NOT lowercasing, or on ALWAYS lowercasing?**

> packages/rocketh/src/environment/index.ts: line 803 (inside `waitForDeploymentTransactionAndSave`) stores `origin: transaction.from` un-normalised; lines 903 and 959 (`broadcastExecution`/`broadcastDeployment`) store `origin: from.toLowerCase()`; line 992 (inside `savePendingDeployment`, re-hydrating from `eth_getTransactionByHash`) stores `transaction.from` verbatim. Author flagged this while fixing the `addressSigners` key-casing bug (commit `09ea46d`) and deliberately deferred it because `origin` is a persisted VALUE (unlike the `addressSigners` lookup MAP), and the repo just ratified that user-visible address values keep EIP-55. The answer hinges on consumers of `transaction.origin` (recovery / `recoverTransactionsIfAny` / anything reading the deployment record) — those were not traced.
>
> (Two corrections applied by hand to this context after the engine wrote it: the function names at 803 and 992 were swapped in the source note, and the fix commit was cited by its pre-rebase SHA. The substance is unchanged.)

_Suggested default: Lowercase all four sites: `origin` is used by recovery paths as a match key (compared to `from` values re-derived from resolved accounts), so consistent normalisation is safer than preserving checksum on some paths and not others; if a user-visible checksummed form is ever needed, re-checksum at the read site._

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):
