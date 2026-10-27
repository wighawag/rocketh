---
'rocketh': patch
'@rocketh/core': patch
---

Fork-rehearsal refinements to 0.25.0.

- `fundImpersonatedAccounts` lends exactly the most a transaction can cost in gas (its gas limit times its max fee per gas, which rocketh now fills for such a transaction) instead of a flat 1000 ETH. Value is no longer lent, so a Safe sending ETH it does not have fails on the fork as it would for real.
- Whether an account the node lists in `eth_accounts` is impersonated is now decided by how the config DECLARES it, not by whether it has code (an EOA can carry code too, EIP-7702): with auto-impersonation on, an account declared by address is impersonated and classified `impersonated`, one declared by index stays `node`. If impersonating it fails, it stays `node`. No `eth_getCode` is asked anymore. A node dev account written out by address is therefore labelled `impersonated` during such a run; it signs exactly as before.
