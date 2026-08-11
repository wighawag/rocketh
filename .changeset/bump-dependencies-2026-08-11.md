---
"hardhat-deploy": patch
"@rocketh/core": patch
"@rocketh/deploy": patch
"@rocketh/diamond": patch
"@rocketh/doc": patch
"@rocketh/export": patch
"@rocketh/node": patch
"rocketh": patch
"@rocketh/proxy": patch
"@rocketh/read-execute": patch
"@rocketh/router": patch
"@rocketh/test-utils": patch
"@rocketh/unknown-signer": patch
"@rocketh/verifier": patch
"@rocketh/viem": patch
"@rocketh/web": patch
---

Dependency maintenance: bump transitive runtime dependency ranges across all published packages. Notable bumps: `viem` ^2.48.2 → ^2.55.13, `abitype` ^1.2.4 → ^1.3.0, `commander` ^14.0.3 → ^15.0.0, `chalk` 5.6.2 → 6.0.0, `fs-extra` ^11.3.4 → ^11.4.0, `ldenv` ^0.5.0 → ^0.6.0, `hardhat` peer ^3.6.0 → ^3.12.0, `ipfs-gateway-emulator` 4.2.1-ipfs.2 → 5.0.0, `typedoc` ^0.28.19 → ^0.28.20. `zod` is kept on ^3.25.76 (not bumped to 4.x) so `hardhat-deploy` stays compatible with hardhat's zod 3 tree. Root dev tooling also bumped (`@types/node` 25 → 26, `nx` 22 → 23, `@changesets/cli` 2 → 3, `tsx`, `prettier`, `@vitest/coverage-v8`, `vitest`); `syncpack` removed (v15 has pnpm interop issues). No public API changes — typecheck, the 444-test suite, and a cache-busted build all pass.