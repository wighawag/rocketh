# @rocketh/doc

## 0.19.22

### Patch Changes

- ef2a3f6: Point the playground README at the documentation's new URL, and replace the six-line stub READMEs with real package documentation: what the package is for, how to wire it into `rocketh/config.ts`, a worked example, an option reference, and the gotchas that are easy to get wrong (proxy initializers running through `execute`, a diamond's facet set being declarative so a removed entry removes selectors on chain, `@rocketh/viem` writes bypassing the managed broadcast path, an empty export being an error rather than a no-op).
- 28426fe: Rewrite the npm-facing metadata so the packages are discoverable by the terms people actually search, rather than by a name they have to already know.

  Every package carried the same four keywords (`rocketh`, `ethereum`, `deployment`, `test`), which meant the scope was findable only by someone who had already heard of it. Keywords are now per-package and include the terms a search starts from: `hardhat-deploy`, `solidity`, `smart-contracts`, `evm`, `viem`, plus the specifics each package is the answer to (`create2`/`create3`, `uups`/`erc1967`/`erc173`, `eip-2535`, `etherscan`/`sourcify`, `safe`/`multisig`).

  Descriptions defined each package in terms of rocketh itself ("provide deploy function for rocketh"), which is the one thing a first-time reader on npm cannot yet resolve. They now lead with the capability and anchor it to known concepts. Also fixes a typo in `@rocketh/read-execute` ("read abd execute").

  `rocketh`'s `homepage` now points at https://rocketh.dev rather than the monorepo README.

- Updated dependencies [ef2a3f6]
- Updated dependencies [28426fe]
- Updated dependencies [e7ce24b]
  - @rocketh/core@0.19.13
  - @rocketh/node@0.19.22

## 0.19.21

### Patch Changes

- Updated dependencies [916507d]
  - @rocketh/core@0.19.12
  - @rocketh/node@0.19.21

## 0.19.20

### Patch Changes

- Updated dependencies [8547e39]
  - @rocketh/core@0.19.11
  - @rocketh/node@0.19.20

## 0.19.19

### Patch Changes

- 42d7ff6: Publish internal peer dependencies as `^` ranges instead of exact versions.

  Every internal peer was declared `workspace:*`, which pnpm replaces at publish time with the exact version of the peer as it stood at that moment. `@rocketh/export@0.19.19` therefore shipped `peerDependencies: {"@rocketh/node": "0.19.18", "rocketh": "0.19.17"}`, and upgrading that one package forced a consumer to move `@rocketh/node`, `rocketh`, and then everything else pinning the same pair (`hardhat-deploy`, the proxy, router and verifier packages) in a single lockstep step. They are now `workspace:^`, which publishes as `^0.19.18` / `^0.19.17`, meaning `>=0.19.17 <0.20.0`: patch drift inside the 0.19 line is allowed, 0.20.0 is still refused.

  The floor is unchanged, and that is the point. An exact pin and a caret share the same lower bound; they differ only in the ceiling, and a ceiling of "exactly the version that happened to be newest when this package was published" encodes publish timing rather than a compatibility fact. `updateInternalDependencies: "patch"` re-pins these on every release, so the pinned number moved even when the peer's API did not. The caret keeps the lower bound that actually carries meaning (a package needing a fix from its peer still refuses anything older) and drops the upper bound that never did.

  Nine entries across eight packages changed: `hardhat-deploy` (`@rocketh/node`, `rocketh`), `@rocketh/doc` (`@rocketh/node`), `@rocketh/export` (`@rocketh/node`, `rocketh`), `@rocketh/node` (`rocketh`), `@rocketh/playground` (`rocketh`), `@rocketh/test-utils` (`rocketh`), `@rocketh/verifier` (`@rocketh/node`), `@rocketh/web` (`rocketh`). Each consumes named function or type exports of its peer rather than subclassing it, checking `instanceof` against it, or sharing module-level state with it, so none of them requires a single exact peer build. `@rocketh/viem`'s `viem: ^2.45.0` is external and was already a range.

  **What this does NOT do.** Already-published versions keep the exact pins baked into their published `package.json`, and nothing can retroactively widen them. This only takes effect for versions published from this release onward. A project currently stuck on the cascade does not get unstuck by this change alone: it has to re-resolve onto releases that carry the new ranges, which in practice means upgrading the affected rocketh packages once more, after which single-package upgrades within the 0.19 line stop dragging the rest along.

  Two related exact pins are deliberately left alone here and reported separately, because both change installation rather than only the peer constraint. `hardhat-deploy` declares `@rocketh/node` and `rocketh` as regular `dependencies` as well as peers, and a regular dependency pinned exact still forces a specific build, so widening only its peer does not by itself remove `hardhat-deploy` from the cascade. `@rocketh/core` is a regular `workspace:*` dependency of nearly every package and likewise publishes exact, so packages of different vintages can pull in several copies of it.

- Updated dependencies [42d7ff6]
  - @rocketh/node@0.19.19

## 0.19.18

### Patch Changes

- Updated dependencies [7f9819e]
- Updated dependencies [7f9819e]
  - @rocketh/node@0.19.18

## 0.19.17

### Patch Changes

- @rocketh/node@0.19.17

## 0.19.16

### Patch Changes

- @rocketh/node@0.19.16

## 0.19.15

### Patch Changes

- b34e921: Dependency maintenance: bump transitive runtime dependency ranges across all published packages. Notable bumps: `viem` ^2.48.2 → ^2.55.13, `abitype` ^1.2.4 → ^1.3.0, `commander` ^14.0.3 → ^15.0.0, `chalk` 5.6.2 → 6.0.0, `fs-extra` ^11.3.4 → ^11.4.0, `ldenv` ^0.5.0 → ^0.6.0, `hardhat` peer ^3.6.0 → ^3.12.0, `ipfs-gateway-emulator` 4.2.1-ipfs.2 → 5.0.0, `typedoc` ^0.28.19 → ^0.28.20. `zod` is kept on ^3.25.76 (not bumped to 4.x) so `hardhat-deploy` stays compatible with hardhat's zod 3 tree. Root dev tooling also bumped (`@types/node` 25 → 26, `nx` 22 → 23, `@changesets/cli` 2 → 3, `tsx`, `prettier`, `@vitest/coverage-v8`, `vitest`); `syncpack` removed (v15 has pnpm interop issues). No public API changes — typecheck, the 444-test suite, and a cache-busted build all pass.
- Updated dependencies [b34e921]
  - @rocketh/core@0.19.10
  - @rocketh/node@0.19.15

## 0.19.14

### Patch Changes

- Updated dependencies [0397afa]
- Updated dependencies [9b46130]
- Updated dependencies [0692a33]
- Updated dependencies [c833bda]
  - @rocketh/node@0.19.14
  - @rocketh/core@0.19.9

## 0.19.13

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
  - @rocketh/node@0.19.13

## 0.19.12

### Patch Changes

- Updated dependencies [09ea46d]
  - @rocketh/core@0.19.7
  - @rocketh/node@0.19.12

## 0.19.11

### Patch Changes

- Updated dependencies [6456996]
  - @rocketh/core@0.19.6
  - @rocketh/node@0.19.11

## 0.19.10

### Patch Changes

- Updated dependencies [7249888]
  - @rocketh/core@0.19.5
  - @rocketh/node@0.19.10

## 0.19.9

### Patch Changes

- Updated dependencies [b624ef0]
  - @rocketh/node@0.19.9

## 0.19.8

### Patch Changes

- Updated dependencies [b2987d7]
  - @rocketh/core@0.19.4
  - @rocketh/node@0.19.8

## 0.19.7

### Patch Changes

- Updated dependencies [034b3a7]
  - @rocketh/core@0.19.3
  - @rocketh/node@0.19.7

## 0.19.6

### Patch Changes

- @rocketh/node@0.19.6

## 0.19.5

### Patch Changes

- Updated dependencies [c6fa24e]
  - @rocketh/core@0.19.2
  - @rocketh/node@0.19.5

## 0.19.4

### Patch Changes

- packagesWithLogsEnabled + latest deps
- Updated dependencies
  - @rocketh/core@0.19.1
  - @rocketh/node@0.19.4

## 0.19.3

### Patch Changes

- @rocketh/node@0.19.3

## 0.19.2

### Patch Changes

- @rocketh/node@0.19.2

## 0.19.1

### Patch Changes

- @rocketh/node@0.19.1

## 0.19.0

### Minor Changes

- autoMine

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.19.0
  - @rocketh/node@0.19.0

## 0.18.8

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.4
  - @rocketh/node@0.18.8

## 0.18.7

### Patch Changes

- @rocketh/node@0.18.7

## 0.18.6

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.3
  - @rocketh/node@0.18.6

## 0.18.5

### Patch Changes

- @rocketh/node@0.18.5

## 0.18.4

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.2
  - @rocketh/node@0.18.4

## 0.18.3

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.1
  - @rocketh/node@0.18.3

## 0.18.2

### Patch Changes

- @rocketh/node@0.18.2

## 0.18.1

### Patch Changes

- Updated dependencies
  - @rocketh/node@0.18.1

## 0.18.0

### Minor Changes

- inject default chains instead of getting it at runtime

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.0
  - @rocketh/node@0.18.0

## 0.17.26

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.17
  - @rocketh/node@0.17.26

## 0.17.25

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.16
  - @rocketh/node@0.17.25

## 0.17.24

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.15
  - @rocketh/node@0.17.24

## 0.17.23

### Patch Changes

- latest deps
- Updated dependencies
  - @rocketh/core@0.17.14
  - @rocketh/node@0.17.23

## 0.17.22

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.13
  - @rocketh/node@0.17.22

## 0.17.21

### Patch Changes

- add metadata to packages
- Updated dependencies
  - @rocketh/core@0.17.12
  - @rocketh/node@0.17.21

## 0.17.20

### Patch Changes

- add licenses
- Updated dependencies
  - @rocketh/core@0.17.11
  - @rocketh/node@0.17.20

## 0.17.19

### Patch Changes

- update deps
- Updated dependencies
  - @rocketh/core@0.17.10
  - @rocketh/node@0.17.19

## 0.17.18

### Patch Changes

- @rocketh/node@0.17.18

## 0.17.17

### Patch Changes

- 8ef1407: fix typos + improvements
- ef83a74: update deps
- ce1e98f: readme
- Updated dependencies [8ef1407]
- Updated dependencies [ef83a74]
- Updated dependencies [ce1e98f]
- Updated dependencies [e01378e]
  - @rocketh/core@0.17.9
  - @rocketh/node@0.17.17

## 0.17.16

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.8
  - @rocketh/node@0.17.16

## 0.17.15

### Patch Changes

- Updated dependencies
  - @rocketh/node@0.17.15

## 0.17.14

### Patch Changes

- Updated dependencies
  - @rocketh/node@0.17.14

## 0.17.13

### Patch Changes

- Updated dependencies
  - @rocketh/node@0.17.13

## 0.17.12

### Patch Changes

- @rocketh/node@0.17.12

## 0.17.11

### Patch Changes

- Updated dependencies
  - @rocketh/node@0.17.11

## 0.17.10

### Patch Changes

- Updated dependencies [f7a81d8]
  - @rocketh/core@0.17.7
  - @rocketh/node@0.17.10

## 0.17.9

### Patch Changes

- @rocketh/node@0.17.9

## 0.17.8

### Patch Changes

- f4431ed: removing dependence on ethers
- Updated dependencies [f4431ed]
  - @rocketh/core@0.17.6
  - @rocketh/node@0.17.8

## 0.17.7

### Patch Changes

- update deps and dev deps
- Updated dependencies
  - @rocketh/core@0.17.5
  - @rocketh/node@0.17.7

## 0.17.6

### Patch Changes

- @rocketh/node@0.17.6

## 0.17.5

### Patch Changes

- @rocketh/node@0.17.5

## 0.17.4

### Patch Changes

- @rocketh/node@0.17.4

## 0.17.3

### Patch Changes

- @rocketh/node@0.17.3

## 0.17.2

### Patch Changes

- 6642ece: reorg using @rocketh/core for utility functions and types (still reexported from rocketh)
- Updated dependencies [6642ece]
  - @rocketh/node@0.17.2

## 0.17.1

### Patch Changes

- @rocketh/node@0.17.1

## 0.17.0

### Minor Changes

- d67b01f: reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

### Patch Changes

- Updated dependencies [d67b01f]
  - @rocketh/node@invalid

## 0.17.0-next.0

### Minor Changes

- reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

### Patch Changes

- Updated dependencies
  - @rocketh/node@0.17.0-next.0

## 0.16.0

### Minor Changes

- add @roceth/core

### Patch Changes

- Updated dependencies
  - rocketh@0.16.0

## 0.15.15

### Patch Changes

- Updated dependencies
  - rocketh@0.15.15

## 0.15.14

### Patch Changes

- Updated dependencies
  - rocketh@0.15.14

## 0.15.13

### Patch Changes

- Updated dependencies
  - rocketh@0.15.13

## 0.15.12

### Patch Changes

- Updated dependencies
  - rocketh@0.15.12

## 0.15.11

### Patch Changes

- Updated dependencies
  - rocketh@0.15.11

## 0.15.10

### Patch Changes

- latest deps
- Updated dependencies
  - rocketh@0.15.10

## 0.15.9

### Patch Changes

- Updated dependencies
  - rocketh@0.15.9

## 0.15.8

### Patch Changes

- Updated dependencies
  - rocketh@0.15.8

## 0.15.7

### Patch Changes

- Updated dependencies
  - rocketh@0.15.7

## 0.15.6

### Patch Changes

- Updated dependencies
  - rocketh@0.15.6

## 0.15.5

### Patch Changes

- Updated dependencies
  - rocketh@0.15.5

## 0.15.4

### Patch Changes

- Updated dependencies
  - rocketh@0.15.4

## 0.15.3

### Patch Changes

- Updated dependencies
  - rocketh@0.15.3

## 0.15.2

### Patch Changes

- Updated dependencies
  - rocketh@0.15.2

## 0.15.1

### Patch Changes

- Updated dependencies
  - rocketh@0.15.1

## 0.15.0

### Minor Changes

- 851378e: revamp the settings to be allowed to configure per chain as well as per target

### Patch Changes

- 691d296: fixes
- 68151ae: rname target to environment
- e2dbd6f: revamp of types and resolution
- 4d1a814: fix cli
- e260c6d: fix
- Updated dependencies [8122cdb]
- Updated dependencies [e6de720]
- Updated dependencies [1f2e044]
- Updated dependencies [9d920a8]
- Updated dependencies [c682fd2]
- Updated dependencies [0d7e7ed]
- Updated dependencies [691d296]
- Updated dependencies [cb340e2]
- Updated dependencies [2b82b5b]
- Updated dependencies [a0fcde6]
- Updated dependencies [356f26c]
- Updated dependencies [03f2406]
- Updated dependencies [68151ae]
- Updated dependencies [e2dbd6f]
- Updated dependencies [851378e]
- Updated dependencies [4d1a814]
- Updated dependencies [e260c6d]
- Updated dependencies [feb4780]
  - rocketh@0.15.0

## 0.15.0-testing.17

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.17

## 0.15.0-testing.16

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.16

## 0.15.0-testing.15

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.15

## 0.15.0-testing.14

### Patch Changes

- fixes
- Updated dependencies
  - rocketh@0.15.0-testing.14

## 0.15.0-testing.13

### Patch Changes

- rname target to environment
- Updated dependencies
  - rocketh@0.15.0-testing.13

## 0.15.0-testing.12

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.12

## 0.15.0-testing.11

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.11

## 0.15.0-testing.10

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.10

## 0.15.0-testing.9

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.9

## 0.15.0-testing.8

### Patch Changes

- fix
- Updated dependencies
  - rocketh@0.15.0-testing.8

## 0.15.0-testing.7

### Patch Changes

- revamp of types and resolution
- Updated dependencies
  - rocketh@0.15.0-testing.7

## 0.15.0-testing.6

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.6

## 0.15.0-testing.5

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.5

## 0.15.0-testing.4

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.4

## 0.15.0-testing.3

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.3

## 0.15.0-testing.2

### Patch Changes

- fix cli
- Updated dependencies
  - rocketh@0.15.0-testing.2

## 0.15.0-testing.1

### Minor Changes

- Updated dependencies
  - rocketh@0.15.0-testing.1
- revamp the settings to be allowed to configure per chain as well as per target

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.0

## 0.14.9

### Patch Changes

- Updated dependencies
  - rocketh@0.14.9

## 0.14.8

### Patch Changes

- Updated dependencies
  - rocketh@0.14.8

## 0.14.7

### Patch Changes

- latest deps + fix eth_feeHistory
- Updated dependencies
  - rocketh@0.14.7

## 0.14.6

### Patch Changes

- Updated dependencies
  - rocketh@0.14.6

## 0.14.5

### Patch Changes

- Updated dependencies
  - rocketh@0.14.5

## 0.14.4

### Patch Changes

- Updated dependencies
  - rocketh@0.14.4

## 0.14.2

### Patch Changes

- Updated dependencies
  - rocketh@0.14.2

## 0.14.1

### Patch Changes

- Updated dependencies
  - rocketh@0.14.1

## 0.14.0

### Minor Changes

- setup for both deployScript and loadAndExecuteDeployments

### Patch Changes

- Updated dependencies
  - rocketh@0.14.0

## 0.13.4

### Patch Changes

- Updated dependencies
  - rocketh@0.13.4

## 0.13.3

### Patch Changes

- Updated dependencies
  - rocketh@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies
  - rocketh@0.13.2

## 0.13.1

### Patch Changes

- Updated dependencies
  - rocketh@0.13.1

## 0.13.0

### Patch Changes

- Updated dependencies
  - rocketh@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies
  - rocketh@0.12.1

## 0.12.0

### Minor Changes

- fix version
- switch to setup function

### Patch Changes

- Updated dependencies
  - rocketh@0.12.0

## 0.11.22

### Patch Changes

- 5bf9962: allow to pass Extra date to environment
- a76870d: signer protocols are specified via config
- de97d9c: fix
- 77c2ffd: fix
- c841f17: use hard deps
- 966bab6: fixes
- c03812e: Extra type generic
- 1148e1c: fix
- Updated dependencies [5bf9962]
- Updated dependencies [a76870d]
- Updated dependencies [de97d9c]
- Updated dependencies [77c2ffd]
- Updated dependencies [c841f17]
- Updated dependencies [966bab6]
- Updated dependencies [c03812e]
- Updated dependencies [1148e1c]
- Updated dependencies [4d37f14]
  - rocketh@0.11.22

## 0.11.22-testing.8

### Patch Changes

- fix
- Updated dependencies
  - rocketh@0.11.22-testing.8

## 0.11.22-testing.7

### Patch Changes

- Extra type generic
- Updated dependencies
  - rocketh@0.11.22-testing.7

## 0.11.22-testing.6

### Patch Changes

- fix
- Updated dependencies
  - rocketh@0.11.22-testing.6

## 0.11.22-testing.5

### Patch Changes

- allow to pass Extra date to environment
- Updated dependencies
  - rocketh@0.11.22-testing.5

## 0.11.22-testing.4

### Patch Changes

- fix
- Updated dependencies
  - rocketh@0.11.22-testing.4

## 0.11.22-testing.3

### Patch Changes

- signer protocols are specified via config
- Updated dependencies
  - rocketh@0.11.22-testing.3

## 0.11.22-testing.2

### Patch Changes

- use hard deps
- Updated dependencies
  - rocketh@0.11.22-testing.2

## 0.11.22-testing.1

### Patch Changes

- fixes
- Updated dependencies
  - rocketh@0.11.22-testing.1

## 0.11.22-testing.0

### Patch Changes

- Updated dependencies
  - rocketh@0.11.22-testing.0

## 0.11.21

### Patch Changes

- Updated dependencies
  - rocketh@0.11.21

## 0.11.20

### Patch Changes

- Updated dependencies
  - rocketh@0.11.20

## 0.11.19

### Patch Changes

- Updated dependencies
  - rocketh@0.11.19

## 0.11.18

### Patch Changes

- Updated dependencies
  - rocketh@0.11.18

## 0.11.17

### Patch Changes

- Updated dependencies
  - rocketh@0.11.17

## 0.11.16

### Patch Changes

- Updated dependencies
  - rocketh@0.11.16

## 0.11.15

### Patch Changes

- Updated dependencies
  - rocketh@0.11.15

## 0.11.14

### Patch Changes

- Updated dependencies
  - rocketh@0.11.14

## 0.11.13

### Patch Changes

- Updated dependencies
  - rocketh@0.11.13

## 0.11.12

### Patch Changes

- Updated dependencies
  - rocketh@0.11.12

## 0.11.11

### Patch Changes

- Updated dependencies
  - rocketh@0.11.11

## 0.11.10

### Patch Changes

- Updated dependencies
  - rocketh@0.11.10

## 0.11.9

### Patch Changes

- Updated dependencies [6d4e756]
- Updated dependencies [82f6787]
- Updated dependencies [37e6a46]
  - rocketh@0.11.9

## 0.11.8

### Patch Changes

- Updated dependencies
  - rocketh@0.11.8

## 0.11.7

### Patch Changes

- Updated dependencies
  - rocketh@0.11.7

## 0.11.6

### Patch Changes

- Updated dependencies
  - rocketh@0.11.6

## 0.11.5

### Patch Changes

- Updated dependencies [4426c7d]
  - rocketh@0.11.5

## 0.11.4

### Patch Changes

- Updated dependencies
  - rocketh@0.11.4

## 0.11.3

### Patch Changes

- 2431e8f: remove the use of context
- Updated dependencies [2431e8f]
  - rocketh@0.11.3

## 0.11.2

### Patch Changes

- Updated dependencies [f2959f3]
- Updated dependencies [169b618]
- Updated dependencies [aaba9cb]
- Updated dependencies [fee5656]
  - rocketh@0.11.2

## 0.11.1

### Patch Changes

- release as v0.11.1
- Updated dependencies
  - rocketh@0.11.1

## invalid-next.5

### Patch Changes

- Updated dependencies [9a9b3c4]
  - rocketh@invalid-next.5

## invalid-next.4

### Patch Changes

- add @rocketh/read-execute
- Updated dependencies
  - rocketh@invalid-next.4

## invalid-next.3

### Patch Changes

- fix dist path
- Updated dependencies
  - rocketh@invalid-next.3

## invalid-next.2

### Patch Changes

- update deps
- Updated dependencies
  - rocketh@invalid-next.2

## invalid-next.1

### Patch Changes

- Updated dependencies
  - rocketh@invalid-next.1

## 0.17.0-next.0

### Major Changes

- first alpha release

### Patch Changes

- Updated dependencies
  - rocketh@0.17.0-next.0

## 0.10.12

### Patch Changes

- fix chains import, no default export
- Updated dependencies
  - rocketh@0.10.18

## 0.10.11

### Patch Changes

- hardhat3-rocketh
- Updated dependencies
  - rocketh@0.10.17

## 0.10.10

### Patch Changes

- fix

## 0.10.9

### Patch Changes

- use tsx
- Updated dependencies
  - rocketh@0.10.16

## 0.10.8

### Patch Changes

- Updated dependencies
  - rocketh@0.10.15

## 0.10.7

### Patch Changes

- latest dependencies
- Updated dependencies
  - rocketh@0.10.14

## 0.10.6

### Patch Changes

- fix default doc template

## 0.10.5

### Patch Changes

- forgot to build
- Updated dependencies
  - rocketh@0.10.13

## 0.10.4

### Patch Changes

- fixes for rocketh-doc and allow memory hardhat network to be used for it
- Updated dependencies
  - rocketh@0.10.12

## 0.10.3

### Patch Changes

- Updated dependencies
  - rocketh@0.10.11

## 0.10.2

### Patch Changes

- Updated dependencies
  - rocketh@0.10.10

## 0.10.1

### Patch Changes

- use pkgroll and @rocketh namespace
- Updated dependencies
  - rocketh@0.10.9
