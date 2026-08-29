---
'rocketh': minor
---

A fork run with no `provider` now asks the node it attaches to which chain it is, instead of throwing `Could not find chainId ...`. Fork-only, since a fork's endpoint is known without a chain id; the node's answer wins over `environments[<name>].chain`, which keeps naming the SIMULATED network; and an unreachable node fails with the endpoint named.
