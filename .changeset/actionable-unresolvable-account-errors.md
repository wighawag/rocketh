---
'rocketh': minor
'@rocketh/node': patch
'hardhat-deploy': patch
---

Named accounts that cannot be resolved are now reported in one actionable error, `UnresolvableAccountsError` (exported by `rocketh` with `formatUnresolvableAccountsMessage` and `redactEndpoint`). It names the environment, the chain id and the endpoint it asked (with any path, query string or credentials redacted), lists every account that cannot be resolved with its reason, and gives the fix for the way the run was started. The `rocketh` CLI prints it and exits with code 1, without a stack trace. hardhat-deploy reports it as a plugin error, with the hardhat-side fix: configure `accounts` for that hardhat network, for example through `MNEMONIC_<network>` with its network helpers.
