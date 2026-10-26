---
'@rocketh/deploy': minor
---

Add `computeDeterministicAddress(env)(artifact, args, {account, deterministic, libraries})`: the address a deterministic `deploy` will land on, for create2 and create3, computed without broadcasting anything (the replacement for hardhat-deploy v1's `deployments.deterministic`). A create3 preview also reports whether the address is already `occupied`.
