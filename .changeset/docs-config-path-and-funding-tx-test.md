---
---

Docs/tests only: `documentation.md` said named accounts are configured in `rocketh.ts`, while the file rocketh actually reads is `rocketh/config.ts` (as every template and demo shows) - a new user following the docs created a file nothing read. Both occurrences corrected. `@rocketh/deploy` also gains a test for the funding-transfer-first branch of a deterministic deploy from an unsignable deployer: when the create2 factory is missing AND its deployer is under-funded, the first transaction to reach the unknown-signer seam is a 21000-gas value transfer from the Safe, not the deployment. Previously untestable, because the harness answers `eth_getBalance` with 1000 ETH.
