---
'@rocketh/core': minor
'rocketh': patch
---

A per-network named-account entry of `null` now means the account is absent on that network, as in hardhat-deploy v1, instead of crashing environment construction with a raw `TypeError`. `AccountType` admits `null` as a per-network value; such a name has no entry in `namedAccounts`, `namedSigners`, `addressSigners` or `addressSignability`, and `ResolvedNamedAccounts` / `ResolvedNamedSigners` type it as possibly `undefined`. A name with no entry for the network and no `default` still fails with the readable `cannot get account for ...` message.
