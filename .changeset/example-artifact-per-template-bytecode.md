---
'@rocketh/test-utils': minor
---

`createExampleArtifact` now varies the BYTECODE per template, not just the ABI. Templates that differed only in their ABI produced identical bytecode, so every deterministic (create2) deployment of them resolved to the SAME address: the multi-facet diamond example documented a diamond whose three differently-named facets were one contract, with three cuts pointing at one address and every assertion still green. Each template now carries a distinct `bytecode` and `deployedBytecode`. Note this CHANGES the addresses these example artifacts deploy to, so a test asserting a hard-coded create2 address for one of them will need updating.
