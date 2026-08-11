---
'@rocketh/deploy': patch
'@rocketh/proxy': patch
---

`strictBytecodeMatch` is now documented and tested. It had neither: `documentation.md` never mentioned it, and no test named it, though it decides whether a re-run redeploys a contract (or upgrades a proxy). `documentation.md` gains a "When does a re-run REDEPLOY?" section covering it alongside `skipIfAlreadyDeployed` and `alwaysOverride`, and `@rocketh/deploy` gains `test/strict-bytecode-match.integration.test.ts`, which pins both directions on the SAME pair of artifacts (metadata-only difference: reused by default, redeployed under `strictBytecodeMatch: true`), verified by mutation.

Named constants replace magic values at the two sites the feature relies on: the CBOR length-suffix arithmetic in `@rocketh/deploy` now explains what solc appends and why creation bytecode is not used, and `@rocketh/proxy`'s two raw storage-slot literals become `EIP1967_IMPLEMENTATION_SLOT` / `EIP1967_ADMIN_SLOT` with the EIP cited. No behaviour change.
