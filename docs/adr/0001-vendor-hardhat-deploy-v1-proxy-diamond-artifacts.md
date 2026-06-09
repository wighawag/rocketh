# Vendor the hardhat-deploy v1 proxy/diamond artifacts in-tree

We ship the pre-compiled proxy and diamond contract artifacts from hardhat-deploy v1 directly inside `@rocketh/proxy` and `@rocketh/diamond` (under `src/hardhat-deploy-v1-artifacts/`) rather than recompiling them or depending on a separate contracts package.

**Why:** existing deployments in the wild were made with the v1 contracts, and we want the bytecode shipped with the newest code to stay byte-equivalent to what is already deployed — so a redeploy/upgrade against an existing proxy or diamond matches rather than appearing as a change. Vendoring the artifacts pins that exact bytecode, and keeping them in a clearly-named `hardhat-deploy-v1-artifacts/` folder makes it explicit that they originate from v1 (not freshly recompiled, which could drift).
