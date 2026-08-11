---
---

Tests only: `@rocketh/proxy`'s two commented-out shared-admin cases (`SharedAdminOpenZeppelinTransparentProxy`, `SharedAdminOptimizedTransparentProxy`) are implemented rather than deleted. They were the only coverage of the separate-`DefaultProxyAdmin` path, which is the one thing those two flavours do differently, and they assert it: the admin is deployed, and it is distinct from both the implementation and the proxy. They need a node that answers `owner()` on the admin (`deployViaProxy` reads it and refuses on a mismatch), which the default harness does not, so they build an environment that does.

Also fixes a test fixture in `@rocketh/unknown-signer`'s scenarios: its two Vault versions put their distinguishing marker INSIDE the region their own metadata length declared, so once the metadata stripping was corrected the two versions were identical and no upgrade was ever detected. The marker now sits in the code, ahead of the blob.
