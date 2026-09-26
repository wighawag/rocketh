---
'@rocketh/core': minor
'rocketh': minor
'@rocketh/deploy': minor
'@rocketh/read-execute': minor
---

Support chains that reject EIP-1559 transactions. A chain declared with `transactionType: 'legacy'` (default `'eip1559'`) gets legacy (type 0) transactions from `deploy`, `execute` and `tx`, deterministic-deployment bootstrapping included, and any call can pass `gasPrice` or `type: 'legacy'` to send a legacy transaction. `gasPrice` combined with `maxFeePerGas` / `maxPriorityFeePerGas` is refused with a message naming both. Chains left at the default send exactly what they sent before.
