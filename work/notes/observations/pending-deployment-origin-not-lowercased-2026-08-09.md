---
title: savePendingDeployment records transaction.origin un-lowercased, unlike every sibling
slug: pending-deployment-origin-not-lowercased
needsAnswers: true
---

## What was spotted

`packages/rocketh/src/environment/index.ts` records a pending transaction's `origin` inconsistently, within a few lines of itself:

- `savePendingDeployment` (around line 803) sets `origin: transaction.from` with no normalisation.
- `broadcastExecution` (around line 903) and `broadcastDeployment` (around line 959) both set `origin: from.toLowerCase()`.
- The re-hydration path (around line 992) also uses `transaction.from` verbatim, though there the value comes from the node's `eth_getTransactionByHash` rather than from user input.

So the same conceptual field is stored lowercased on some paths and as-resolved on others.

## Why it was captured rather than fixed

Found while fixing the `addressSigners` key-casing defect (commit `693e46f`), and deliberately left out of that commit's scope. It is a DIFFERENT question from the one that fix answered: `addressSigners` is a lookup MAP, where a non-normalised key is straightforwardly a bug, whereas `origin` is a persisted VALUE, and this repo has just ratified that user-visible address values keep their EIP-55 checksum (`namedAccounts` and `unnamedAccounts` were deliberately left un-normalised for exactly that reason).

That makes the right answer non-obvious, and worth a human decision rather than a tidy-up:

- If `origin` is a persisted, user-visible value, then arguably the LOWERCASING sites are the anomaly and should stop, not the other way round.
- If it is only ever used for internal matching, then normalising everywhere is right.

Which it is depends on how pending-transaction records are consumed (recovery, `recoverTransactionsIfAny`, and anything reading the deployment record's `transaction.origin`). That was not traced.

## Verified

Confirmed by reading the file at the four sites listed above. Not otherwise investigated: no consumer analysis, no assessment of whether a mismatch can actually cause a failed match during transaction recovery.

## Suggested disposition

Trace the consumers of `transaction.origin`, decide whether it is an identity value or a match key, then make all four sites consistent in whichever direction that answer implies. Small, but it should be a decision rather than a reflex.
