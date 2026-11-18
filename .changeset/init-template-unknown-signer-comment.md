---
'hardhat-deploy': patch
---

The comment above `@rocketh/unknown-signer` in the `hardhat-deploy init` template now describes how rocketh handles an account it cannot sign for (pause and paste the hash, defer and converge with a `guard`, or a fork rehearsal with `--write-transactions`), and presents `catchUnknownSigner` as the helper for scripts ported from hardhat-deploy v1, matching the documentation.
