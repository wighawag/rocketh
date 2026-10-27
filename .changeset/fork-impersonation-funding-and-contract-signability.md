---
'@rocketh/core': minor
'rocketh': minor
---

Two fixes for rehearsing a Safe-owned step on a fork.

- `fundImpersonatedAccounts` (chain config, `overrides`, `whenForked`, or per run): lends an impersonated account the ETH for each of its transactions and, once mined, sets its balance to what it would be had it paid no gas. Impersonation makes a Safe the payer of its own calls, which it never is for real, and a Safe usually holds no ETH. Off by default; accounts rocketh did not impersonate are never touched.
- A named account the node lists in `eth_accounts` but which has contract code is no longer classified `node` when auto-impersonation is on: it is impersonated and classified `impersonated`. anvil lists an address it has impersonated as its own, so on a node reused across rehearsals the Safe's transactions used to be captured as `node`, and a batch consumer filtering on `impersonated` silently got none.
