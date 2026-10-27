---
'rocketh': patch
'@rocketh/export': patch
---

Require `@eip-1193/jsonrpc-provider@^0.6.0`, which returns a `null` JSON-RPC result instead of throwing 'No Result'. Auto-impersonation on a run without a provider (`rocketh -e <network> --is-fork` against anvil, which answers `hardhat_impersonateAccount` with `null`) always looked refused before, so a Safe-owned step in a fork rehearsal stayed unsignable.
