---
'@rocketh/diamond': patch
---

Vendor the Solidity sources of the bundled Diamond artifacts, and prove they produce the shipped bytecode.

This package DEPLOYS prebuilt artifacts: the base `Diamond` and the default cut/loupe/ownership facets ship as compiled bytecode under `src/hardhat-deploy-v1-artifacts/`, and the package build (`tsc` plus `ts-to-json`) never invokes a Solidity compiler. Only the supporting sources were present (`LibDiamond`, the interfaces, `UsingDiamondOwner`); the six contracts actually deployed had none. Their metadata names `solc_0.8/diamond/Diamond.sol`, a path that exists in hardhat-deploy v1's tree and nowhere in this repository, so no reviewer, including the maintainer, could answer "what source produced the bytecode this package puts on chain?" without leaving the repo.

All six are now vendored, along with the interfaces and library they pull in, as a frozen mirror of hardhat-deploy v1's tree under `hardhat-deploy-v1/` (added to the published `files`, so consumers get them too), and two checks pin the chain from source to deployed bytecode:

```
hardhat-deploy-v1/**/*.sol  ==  metadata.sources[*].content  ->  (solc 0.8.10)  ->  bundled bytecode
```

**Why a separate folder from `solc_0_8/`.** That directory is a PUBLIC Solidity import surface: `package.json` exports `./solc_0_8/*` and the migration guide tells users to write `import '@rocketh/proxy/solc_0_8/ERC1967/Proxied.sol'` in their own contracts. It holds the few files a consumer inherits or imports, and the contracts this package DEPLOYS are not among them. Keeping the mirror separate also lets it reproduce v1's tree exactly, so a file's path relative to `hardhat-deploy-v1/` is literally its key in the artifact metadata (`solc_0.8/diamond/Diamond.sol`). That is load-bearing rather than tidy: solc hashes source paths into the metadata blob at the end of the bytecode, so these same bytes compiled under any other path produce different bytecode, and, because the default facets deploy with CREATE2, a different address for every user. A test asserts the overlapping files (LibDiamond, the interfaces) stay byte-identical between the two trees, since drift there would have a consumer compiling facets against a different interface than the deployed diamond was built with.

**The left link, hermetically, on every `pnpm test`.** These artifacts were compiled with `metadata.useLiteralContent: true`, so each one carries the FULL TEXT of every source it was built from, not merely a hash. `test/bundled-artifact-provenance.test.ts` asserts that every such source exists in the mirror and is byte-identical to the compiler's own copy, that the compiler was the pinned `0.8.10+commit.fc410830`, and, in the reverse direction, that no vendored `.sol` is left unaccounted for by any artifact. No compiler, no network, no fixtures.

**The right link, by regenerating them.** The artifacts are now GENERATED from the mirror by `pnpm --filter @rocketh/diamond generate:artifacts`, and `verify:artifacts` is the same generator in `--check` mode, run in CI. Regenerating today reproduces all six files BYTE FOR BYTE, which required matching three things hardhat-deploy v1 fed the compiler, each of which would otherwise change the output silently: the source paths (hashed into the metadata blob), the input shape and source order (`solcInput` is stored verbatim in each artifact and `solcInputHash` is `murmur128` over it), and the settings (`evmVersion` is deliberately absent, since v1 never passed one and 0.8.10 defaults to london).

The compiler is the npm `solc` package pinned to `0.8.10`, whose Emscripten build reproduces the native compiler's output exactly here, so the check needs no toolchain install. The generator refuses to run against any other version, because the compiler identity is hashed into the bytecode.

**They stay committed, and that is the point.** The default facets deploy with CREATE2, so their bytecode determines their ADDRESS. Compiling during `build` or during the release would let a different compiler, platform or path silently move every user's facets, and would put a Solidity toolchain in the job that holds the npm OIDC token. v1 committed its `extendedArtifacts/` for the same reason, with `hardhat compile` as a separate manual step. Generated-and-committed keeps the `.sol` as the single source of truth while leaving the addresses fixed: before this, editing a vendored source had no effect on anything deployed, and nothing said so. The check reports which half moved, since an unchanged bytecode with different packaging is harmless while a bytecode difference moves addresses.

No behaviour change: the artifacts are byte-identical to what shipped before.
