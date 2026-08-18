---
'@rocketh/diamond': patch
---

Vendor the Solidity sources of the bundled Diamond artifacts, and prove they produce the shipped bytecode.

This package DEPLOYS prebuilt artifacts: the base `Diamond` and the default cut/loupe/ownership facets ship as compiled bytecode under `src/hardhat-deploy-v1-artifacts/`, and the package build (`tsc` plus `ts-to-json`) never invokes a Solidity compiler. Only the supporting sources were present (`LibDiamond`, the interfaces, `UsingDiamondOwner`); the six contracts actually deployed had none. Their metadata names `solc_0.8/diamond/Diamond.sol`, a path that exists in hardhat-deploy v1's tree and nowhere in this repository, so no reviewer, including the maintainer, could answer "what source produced the bytecode this package puts on chain?" without leaving the repo.

All six sources are now vendored under `solc_0_8/` (already part of the published `files`, so consumers get them too), and two checks pin the chain from source to deployed bytecode:

```
solc_0_8/*.sol  ==  metadata.sources[*].content  ->  (solc 0.8.10)  ->  bundled bytecode
```

**The left link, hermetically, on every `pnpm test`.** These artifacts were compiled with `metadata.useLiteralContent: true`, so each one carries the FULL TEXT of every source it was built from, not merely a hash. `test/bundled-artifact-provenance.test.ts` asserts that every such source exists in `solc_0_8/` and is byte-identical to the compiler's own copy, that the compiler was the pinned `0.8.10+commit.fc410830`, and, in the reverse direction, that no vendored `.sol` is left unaccounted for by any artifact. No compiler, no network, no fixtures.

**The right link, on demand.** `pnpm --filter @rocketh/diamond verify:artifacts` rebuilds each artifact from the vendored sources through a standard-json input assembled from that artifact's OWN recorded settings (optimizer `runs: 999999`, `evmVersion: london`, `metadata.bytecodeHash: ipfs`), and compares creation and runtime bytecode. All six currently reproduce EXACTLY, trailing metadata hash included. It refuses to run against any compiler other than the pinned one, since comparing output from a different solc would report differences that are not defects, and it separates a metadata-only difference (same executable code, different metadata hash) from a real one, because those mean different things and need different fixes.

It is a script rather than a test because it needs a specific solc binary that `pnpm test` cannot assume, and silently downloading one mid-test-run is the implicit network dependency this repo's supply-chain settings exist to prevent. Point `SOLC` at one you already have, or run `forge build --use 0.8.10` once to fetch it.

No behaviour change: the artifacts are unmodified, and this only makes what they contain checkable.
