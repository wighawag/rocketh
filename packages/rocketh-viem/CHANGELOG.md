# @rocketh/viem

## 0.19.11

### Patch Changes

- Updated dependencies [8547e39]
  - @rocketh/core@0.19.11

## 0.19.10

### Patch Changes

- b34e921: Dependency maintenance: bump transitive runtime dependency ranges across all published packages. Notable bumps: `viem` ^2.48.2 → ^2.55.13, `abitype` ^1.2.4 → ^1.3.0, `commander` ^14.0.3 → ^15.0.0, `chalk` 5.6.2 → 6.0.0, `fs-extra` ^11.3.4 → ^11.4.0, `ldenv` ^0.5.0 → ^0.6.0, `hardhat` peer ^3.6.0 → ^3.12.0, `ipfs-gateway-emulator` 4.2.1-ipfs.2 → 5.0.0, `typedoc` ^0.28.19 → ^0.28.20. `zod` is kept on ^3.25.76 (not bumped to 4.x) so `hardhat-deploy` stays compatible with hardhat's zod 3 tree. Root dev tooling also bumped (`@types/node` 25 → 26, `nx` 22 → 23, `@changesets/cli` 2 → 3, `tsx`, `prettier`, `@vitest/coverage-v8`, `vitest`); `syncpack` removed (v15 has pnpm interop issues). No public API changes — typecheck, the 444-test suite, and a cache-busted build all pass.
- Updated dependencies [b34e921]
  - @rocketh/core@0.19.10

## 0.19.9

### Patch Changes

- Updated dependencies [c833bda]
  - @rocketh/core@0.19.9

## 0.19.8

### Patch Changes

- Updated dependencies [11ab414]
- Updated dependencies [a5db88c]
- Updated dependencies [aac0ca1]
- Updated dependencies [9319520]
- Updated dependencies [2797550]
- Updated dependencies [43b9545]
- Updated dependencies [e20634b]
- Updated dependencies [d800333]
- Updated dependencies [01d5bfb]
  - @rocketh/core@0.19.8

## 0.19.7

### Patch Changes

- Updated dependencies [09ea46d]
  - @rocketh/core@0.19.7

## 0.19.6

### Patch Changes

- Updated dependencies [6456996]
  - @rocketh/core@0.19.6

## 0.19.5

### Patch Changes

- Updated dependencies [7249888]
  - @rocketh/core@0.19.5

## 0.19.4

### Patch Changes

- Updated dependencies [b2987d7]
  - @rocketh/core@0.19.4

## 0.19.3

### Patch Changes

- Updated dependencies [034b3a7]
  - @rocketh/core@0.19.3

## 0.19.2

### Patch Changes

- Updated dependencies [c6fa24e]
  - @rocketh/core@0.19.2

## 0.19.1

### Patch Changes

- packagesWithLogsEnabled + latest deps
- Updated dependencies
  - @rocketh/core@0.19.1

## 0.19.0

### Minor Changes

- autoMine

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.19.0

## 0.18.4

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.4

## 0.18.3

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.3

## 0.18.2

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.2

## 0.18.1

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.1

## 0.18.0

### Minor Changes

- inject default chains instead of getting it at runtime

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.0

## 0.17.14

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.17

## 0.17.13

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.16

## 0.17.12

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.15

## 0.17.11

### Patch Changes

- latest deps
- Updated dependencies
  - @rocketh/core@0.17.14

## 0.17.10

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.13

## 0.17.9

### Patch Changes

- add metadata to packages
- Updated dependencies
  - @rocketh/core@0.17.12

## 0.17.8

### Patch Changes

- add licenses
- Updated dependencies
  - @rocketh/core@0.17.11

## 0.17.7

### Patch Changes

- update deps
- Updated dependencies
  - @rocketh/core@0.17.10

## 0.17.6

### Patch Changes

- 8ef1407: fix typos + improvements
- ef83a74: update deps
- 7c42de1: fixes types
- ce1e98f: readme
- e01378e: publish src too
- Updated dependencies [8ef1407]
- Updated dependencies [ef83a74]
- Updated dependencies [ce1e98f]
- Updated dependencies [e01378e]
  - @rocketh/core@0.17.9

## 0.17.5

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.8

## 0.17.4

### Patch Changes

- Updated dependencies [f7a81d8]
  - @rocketh/core@0.17.7

## 0.17.3

### Patch Changes

- e737031: add option to get a contract with specific account
- Updated dependencies [f4431ed]
  - @rocketh/core@0.17.6

## 0.17.2

### Patch Changes

- update deps and dev deps
- Updated dependencies
  - @rocketh/core@0.17.5

## 0.17.1

### Patch Changes

- 6642ece: reorg using @rocketh/core for utility functions and types (still reexported from rocketh)

## 0.17.0

### Minor Changes

- d67b01f: reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

## 0.17.0-next.0

### Minor Changes

- reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

## 0.16.0

### Minor Changes

- add @roceth/core

## 0.15.1

### Patch Changes

- latest deps

## 0.15.0

### Patch Changes

- 691d296: fixes
- 68151ae: rname target to environment
- e2dbd6f: revamp of types and resolution
- e260c6d: fix

## 0.15.0-testing.3

### Patch Changes

- fixes

## 0.15.0-testing.2

### Patch Changes

- rname target to environment

## 0.15.0-testing.1

### Patch Changes

- fix

## 0.15.0-testing.0

### Patch Changes

- revamp of types and resolution

## 0.14.2

### Patch Changes

- fix

## 0.14.1

### Patch Changes

- latest deps + fix eth_feeHistory

## 0.14.0

### Minor Changes

- setup for both deployScript and loadAndExecuteDeployments

## 0.13.5

### Patch Changes

- split getWritableContract and getContract

## 0.13.4

### Patch Changes

- allow to get by deployment

## 0.13.3

### Patch Changes

- fix

## 0.13.2

### Patch Changes

- fix
