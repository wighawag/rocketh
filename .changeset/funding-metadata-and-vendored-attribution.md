---
'hardhat-deploy': patch
'rocketh': patch
'@rocketh/core': patch
'@rocketh/deploy': patch
'@rocketh/diamond': patch
'@rocketh/doc': patch
'@rocketh/export': patch
'@rocketh/node': patch
'@rocketh/playground': patch
'@rocketh/proxy': patch
'@rocketh/read-execute': patch
'@rocketh/router': patch
'@rocketh/signer': patch
'@rocketh/test-utils': patch
'@rocketh/unknown-signer': patch
'@rocketh/verifier': patch
'@rocketh/viem': patch
'@rocketh/web': patch
---

Every published package now declares a `funding` field, so `npm fund` resolves to the same destinations as `.github/FUNDING.yml` instead of returning nothing. `@rocketh/diamond` and `@rocketh/proxy` additionally ship a `THIRD-PARTY-NOTICES.md` beside their vendored Solidity, recording the upstream project, the version stamps that are recoverable from the sources, the copyright line and the MIT permission notice: an SPDX identifier alone does not satisfy MIT's requirement that the notice travel with the code. No Solidity source or built artifact changed.
