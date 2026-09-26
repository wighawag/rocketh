---
'rocketh': minor
---

A run that is not a fork now refuses to start when the node reports a different chain id from the one its environment declares (`environments.<name>.chain`), instead of printing a warning and then signing every transaction for the node's chain. The warning let a node that lies about its chain, such as a wrong or hostile RPC for a testnet environment answering `1`, collect transactions signed for mainnet on keys that are commonly shared across networks. Fork runs are unchanged: there the two ids legitimately differ. If you run a local node that simulates another network, run it as a fork (`--is-fork` on the rocketh CLI, `environment: {fork: '<name>'}` programmatically, `HARDHAT_FORK` with hardhat-deploy); the error message says so.
