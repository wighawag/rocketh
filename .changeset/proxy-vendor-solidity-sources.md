---
'@rocketh/proxy': patch
---

Vendor the Solidity sources of the bundled proxy artifacts, and generate the artifacts from them.

The same gap `@rocketh/diamond` had, and larger. This package ships six prebuilt artifacts inherited from hardhat-deploy v1 (`EIP173Proxy`, `EIP173ProxyWithReceive`, `ERC1967Proxy`, `TransparentUpgradeableProxy`, `OptimizedTransparentUpgradeableProxy`, `ProxyAdmin`), its build never invokes a Solidity compiler, and exactly ONE `.sol` was vendored (`solc_0_8/ERC1967/Proxied.sol`, which is not even among the nineteen sources those artifacts were compiled from). A proxy deployed with a deterministic salt takes its ADDRESS from that bytecode, and nothing in the repository explained where the bytecode came from.

All nineteen sources are now vendored as a frozen mirror of v1's tree under `hardhat-deploy-v1/` (added to the published `files`), including the OpenZeppelin sources v1 vendored in turn, and two checks pin the chain:

- `test/bundled-artifact-provenance.test.ts` runs on every `pnpm test` with no compiler: each artifact embeds the full text of its sources (`metadata.useLiteralContent: true`), and the test asserts the repo's copies are byte-identical, that the compiler was the pinned `0.8.10+commit.fc410830`, and that the mirror holds exactly the union of the compilation units.
- `pnpm --filter @rocketh/proxy verify:artifacts` recompiles and compares the generated files. All six reproduce BYTE FOR BYTE, `solcInput` and `solcInputHash` included. CI runs it through the root `pnpm verify:artifacts`.

**Two compilation units, kept apart deliberately.** v1 compiled the EIP173 proxies separately from the OpenZeppelin-based ones, so those two groups carry different `solcInput` strings and different `solcInputHash` values. Merging them into one unit would compile to identical bytecode and still rewrite every artifact, so the split is stated as data in the generator and pinned by a test.

The artifacts stay committed and are unmodified: they are byte-identical to what shipped before. Compiling them during `build` or during a release would let a different compiler, platform or path silently move every user's deterministic proxy addresses, and would put a Solidity toolchain in the job that holds the npm OIDC token.
