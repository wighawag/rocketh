---
'@rocketh/core': patch
'rocketh': minor
---

Fix spurious deployment wipes caused by using the `"earliest"` block tag as the genesis fingerprint.

rocketh fetched the chain's genesis hash via `eth_getBlockByNumber("earliest")`. On pruned nodes `"earliest"` does not return genesis — geth resolves it to `HistoryPruningCutoff()` and reth to `earliest_block_number()`, i.e. the prune-cutoff block whose hash is not the genesis hash and drifts as history is pruned. The recorded `.chain` genesisHash therefore stopped matching, and because `deleteDeploymentsIfDifferentGenesisHash` was hardcoded `true` for every non-fork environment, rocketh silently deleted the entire deployments folder on real chains whenever the node pruned (or two nodes pruned to different points).

Genesis is now fetched explicitly via block number `0x0`. On a pruned node that throws (geth `PrunedHistoryError` / reth `PrunedHistoryUnavailable`) or returns null, the genesis hash is left undefined and the mismatch check is skipped entirely — no delete, no throw. Dev/full nodes (never pruned) keep returning the real genesis, so reset detection still works there.

The delete-on-mismatch behavior is now configurable via a new chain config option `deleteDeploymentsIfDifferentGenesisHash` (resolved like `autoMine`/`autoImpersonate`), using `??` so an explicit `false` on a default-`true` chain actually opts out (`||` would have silently ignored the opt-out). It defaults to `true` for the recognised dev chain ids 1337 and 31337 (reset detection out of the box) and `false` everywhere else. Non-dev chains now throw with a clear reason on a genesis mismatch instead of silently wiping — the message explains how to mark a resettable chain (set the option to `true`) or recover a stale `.chain` (remove its `genesisHash` field, e.g. left over from the old `"earliest"` behavior). The option also inherits per-environment `overrides` for free.