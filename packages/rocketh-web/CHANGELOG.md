# @rocketh/web

## 0.19.20

### Patch Changes

- Updated dependencies [916507d]
  - @rocketh/core@0.19.12
  - rocketh@0.19.19

## 0.19.19

### Patch Changes

- Updated dependencies [753705b]
- Updated dependencies [7fdb319]
- Updated dependencies [400ece3]
- Updated dependencies [ad03283]
- Updated dependencies [8547e39]
  - rocketh@0.19.18
  - @rocketh/core@0.19.11

## 0.19.18

### Patch Changes

- 42d7ff6: Publish internal peer dependencies as `^` ranges instead of exact versions.

  Every internal peer was declared `workspace:*`, which pnpm replaces at publish time with the exact version of the peer as it stood at that moment. `@rocketh/export@0.19.19` therefore shipped `peerDependencies: {"@rocketh/node": "0.19.18", "rocketh": "0.19.17"}`, and upgrading that one package forced a consumer to move `@rocketh/node`, `rocketh`, and then everything else pinning the same pair (`hardhat-deploy`, the proxy, router and verifier packages) in a single lockstep step. They are now `workspace:^`, which publishes as `^0.19.18` / `^0.19.17`, meaning `>=0.19.17 <0.20.0`: patch drift inside the 0.19 line is allowed, 0.20.0 is still refused.

  The floor is unchanged, and that is the point. An exact pin and a caret share the same lower bound; they differ only in the ceiling, and a ceiling of "exactly the version that happened to be newest when this package was published" encodes publish timing rather than a compatibility fact. `updateInternalDependencies: "patch"` re-pins these on every release, so the pinned number moved even when the peer's API did not. The caret keeps the lower bound that actually carries meaning (a package needing a fix from its peer still refuses anything older) and drops the upper bound that never did.

  Nine entries across eight packages changed: `hardhat-deploy` (`@rocketh/node`, `rocketh`), `@rocketh/doc` (`@rocketh/node`), `@rocketh/export` (`@rocketh/node`, `rocketh`), `@rocketh/node` (`rocketh`), `@rocketh/playground` (`rocketh`), `@rocketh/test-utils` (`rocketh`), `@rocketh/verifier` (`@rocketh/node`), `@rocketh/web` (`rocketh`). Each consumes named function or type exports of its peer rather than subclassing it, checking `instanceof` against it, or sharing module-level state with it, so none of them requires a single exact peer build. `@rocketh/viem`'s `viem: ^2.45.0` is external and was already a range.

  **What this does NOT do.** Already-published versions keep the exact pins baked into their published `package.json`, and nothing can retroactively widen them. This only takes effect for versions published from this release onward. A project currently stuck on the cascade does not get unstuck by this change alone: it has to re-resolve onto releases that carry the new ranges, which in practice means upgrading the affected rocketh packages once more, after which single-package upgrades within the 0.19 line stop dragging the rest along.

  Two related exact pins are deliberately left alone here and reported separately, because both change installation rather than only the peer constraint. `hardhat-deploy` declares `@rocketh/node` and `rocketh` as regular `dependencies` as well as peers, and a regular dependency pinned exact still forces a specific build, so widening only its peer does not by itself remove `hardhat-deploy` from the cascade. `@rocketh/core` is a regular `workspace:*` dependency of nearly every package and likewise publishes exact, so packages of different vintages can pull in several copies of it.

## 0.19.17

### Patch Changes

- Updated dependencies [5266a61]
  - rocketh@0.19.17

## 0.19.16

### Patch Changes

- ec0050e: Give the browser a deployment store that actually stores, with optional IndexedDB persistence.

  `@rocketh/web` previously bound a no-op store whose every method body was commented out: writes were swallowed, `readFile` returned `''`, `listFiles` returned `[]`. Nothing a deploy script saved survived the call.

  **The default store now retains deployments** for the lifetime of the page (`createVFSDeploymentStore()`). This is a behaviour change: code that relied on writes being discarded should now pass `createEmptyDeploymentStore()` explicitly.

  New exports:

  - `createVFSDeploymentStore(vfs?)` - a `DeploymentStore` over an in-memory file system, mirroring `@rocketh/node`'s `createFSDeploymentStore()` semantics, including which calls throw (`loadDeploymentsFromStore` reads a throwing `listFiles` as "never deployed here", so the distinction is load-bearing).
  - `createIndexedDBDeploymentStore(options?)` - the same store, persisted. Async, because it loads what IndexedDB already holds before returning.
  - `createMemoryVFS()`, `createPersistentVFS()`, `createIndexedDBPersistence()`, `createMemoryPersistence()` - the pieces underneath. A persistent VFS reports every failed write through `onSaveError` (defaulting to `console.error`) so a caller that never awaits `flush()` cannot lose data silently, and `dispose()` unsubscribes it. The persistence adapter is injected, so the durability behaviour is testable outside a browser, and its shape matches `embedded-eth-node`'s adapter so an app configures both the same way.
  - `getDefaultDeploymentStore()` - reach the store used when none is passed.
  - Every store exposes its `vfs`, which is observable (`subscribe`) and snapshottable (`snapshot`/`restore`), so a UI can watch `deployments/<env>/Foo.json` appear as a script runs.

  `setupEnvironment(config, extensions, options?)` takes an optional `{deploymentStore}`.

  `loadDeploymentsFromIndexedDB` is deprecated: it never touched IndexedDB, it reads the store bound to the module. Use `loadDeploymentsFromStore(store, ...)` from `rocketh` with a store you built.

- Updated dependencies [6c7aee3]
  - rocketh@0.19.16

## 0.19.15

### Patch Changes

- Updated dependencies [d41ff21]
  - rocketh@0.19.15

## 0.19.14

### Patch Changes

- b34e921: Dependency maintenance: bump transitive runtime dependency ranges across all published packages. Notable bumps: `viem` ^2.48.2 → ^2.55.13, `abitype` ^1.2.4 → ^1.3.0, `commander` ^14.0.3 → ^15.0.0, `chalk` 5.6.2 → 6.0.0, `fs-extra` ^11.3.4 → ^11.4.0, `ldenv` ^0.5.0 → ^0.6.0, `hardhat` peer ^3.6.0 → ^3.12.0, `ipfs-gateway-emulator` 4.2.1-ipfs.2 → 5.0.0, `typedoc` ^0.28.19 → ^0.28.20. `zod` is kept on ^3.25.76 (not bumped to 4.x) so `hardhat-deploy` stays compatible with hardhat's zod 3 tree. Root dev tooling also bumped (`@types/node` 25 → 26, `nx` 22 → 23, `@changesets/cli` 2 → 3, `tsx`, `prettier`, `@vitest/coverage-v8`, `vitest`); `syncpack` removed (v15 has pnpm interop issues). No public API changes — typecheck, the 444-test suite, and a cache-busted build all pass.
- Updated dependencies [b34e921]
  - @rocketh/core@0.19.10
  - rocketh@0.19.14

## 0.19.13

### Patch Changes

- Updated dependencies [6ea32f1]
- Updated dependencies [1a583b2]
- Updated dependencies [c833bda]
  - rocketh@0.19.13
  - @rocketh/core@0.19.9

## 0.19.12

### Patch Changes

- Updated dependencies [11ab414]
- Updated dependencies [a5db88c]
- Updated dependencies [aac0ca1]
- Updated dependencies [ef4a3b0]
- Updated dependencies [9319520]
- Updated dependencies [2797550]
- Updated dependencies [43b9545]
- Updated dependencies [e20634b]
- Updated dependencies [d800333]
- Updated dependencies [01d5bfb]
  - rocketh@0.19.12
  - @rocketh/core@0.19.8

## 0.19.11

### Patch Changes

- Updated dependencies [09ea46d]
  - rocketh@0.19.11
  - @rocketh/core@0.19.7

## 0.19.10

### Patch Changes

- Updated dependencies [6456996]
  - @rocketh/core@0.19.6
  - rocketh@0.19.10

## 0.19.9

### Patch Changes

- Updated dependencies [7249888]
  - @rocketh/core@0.19.5
  - rocketh@0.19.9

## 0.19.8

### Patch Changes

- Updated dependencies [b2987d7]
  - @rocketh/core@0.19.4
  - rocketh@0.19.8

## 0.19.7

### Patch Changes

- Updated dependencies [034b3a7]
  - @rocketh/core@0.19.3
  - rocketh@0.19.7

## 0.19.6

### Patch Changes

- Updated dependencies [e06b151]
  - rocketh@0.19.6

## 0.19.5

### Patch Changes

- c6fa24e: add reset + make loading deployment a separate step from createEnvionment
- Updated dependencies [c6fa24e]
  - @rocketh/core@0.19.2
  - rocketh@0.19.5

## 0.19.4

### Patch Changes

- packagesWithLogsEnabled + latest deps
- Updated dependencies
  - rocketh@0.19.4
  - @rocketh/core@0.19.1

## 0.19.3

### Patch Changes

- Updated dependencies
  - rocketh@0.19.3

## 0.19.2

### Patch Changes

- Updated dependencies
  - rocketh@0.19.2

## 0.19.1

### Patch Changes

- Updated dependencies
  - rocketh@0.19.1

## 0.19.0

### Minor Changes

- autoMine

### Patch Changes

- Updated dependencies
  - rocketh@0.19.0
  - @rocketh/core@0.19.0

## 0.18.8

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.4
  - rocketh@0.18.7

## 0.18.7

### Patch Changes

- Updated dependencies
  - rocketh@0.18.6

## 0.18.6

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.3
  - rocketh@0.18.5

## 0.18.5

### Patch Changes

- Updated dependencies
  - rocketh@0.18.4

## 0.18.4

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.2
  - rocketh@0.18.3

## 0.18.3

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.1
  - rocketh@0.18.2

## 0.18.2

### Patch Changes

- Updated dependencies
  - rocketh@0.18.1

## 0.18.1

### Patch Changes

- @rocketh/node add option to pass config in

## 0.18.0

### Minor Changes

- inject default chains instead of getting it at runtime

### Patch Changes

- Updated dependencies
  - rocketh@0.18.0
  - @rocketh/core@0.18.0

## 0.17.23

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.17
  - rocketh@0.17.23

## 0.17.22

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.16
  - rocketh@0.17.22

## 0.17.21

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.15
  - rocketh@0.17.21

## 0.17.20

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.14
  - rocketh@0.17.20

## 0.17.19

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.13
  - rocketh@0.17.19

## 0.17.18

### Patch Changes

- add metadata to packages
- Updated dependencies
  - rocketh@0.17.18
  - @rocketh/core@0.17.12

## 0.17.17

### Patch Changes

- add licenses
- Updated dependencies
  - rocketh@0.17.17
  - @rocketh/core@0.17.11

## 0.17.16

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.10
  - rocketh@0.17.16

## 0.17.15

### Patch Changes

- Updated dependencies [b765457]
  - rocketh@0.17.15

## 0.17.14

### Patch Changes

- 8ef1407: fix typos + improvements
- ef83a74: update deps
- ce1e98f: readme
- e01378e: publish src too
- Updated dependencies [8ef1407]
- Updated dependencies [ef83a74]
- Updated dependencies [ce1e98f]
- Updated dependencies [e01378e]
  - @rocketh/core@0.17.9
  - rocketh@0.17.14

## 0.17.13

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.8
  - rocketh@0.17.13

## 0.17.12

### Patch Changes

- Updated dependencies
  - rocketh@0.17.12

## 0.17.11

### Patch Changes

- Updated dependencies
  - rocketh@0.17.11

## 0.17.10

### Patch Changes

- Updated dependencies [f7a81d8]
  - @rocketh/core@0.17.7
  - rocketh@0.17.10

## 0.17.9

### Patch Changes

- Updated dependencies
  - rocketh@0.17.9

## 0.17.8

### Patch Changes

- Updated dependencies [e737031]
- Updated dependencies [f4431ed]
  - rocketh@0.17.8
  - @rocketh/core@0.17.6

## 0.17.7

### Patch Changes

- update deps and dev deps
- Updated dependencies
  - @rocketh/core@0.17.5
  - rocketh@0.17.7

## 0.17.6

### Patch Changes

- Updated dependencies
  - rocketh@0.17.6
  - @rocketh/core@0.17.4

## 0.17.5

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.4
  - rocketh@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [dc5aefe]
  - @rocketh/core@0.17.3
  - rocketh@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.2
  - rocketh@0.17.3

## 0.17.2

### Patch Changes

- 6642ece: reorg using @rocketh/core for utility functions and types (still reexported from rocketh)
- Updated dependencies [6642ece]
- Updated dependencies [c574413]
  - @rocketh/core@0.17.1
  - rocketh@0.17.2

## 0.17.1

### Patch Changes

- Updated dependencies
  - rocketh@0.17.1

## 0.17.0

### Minor Changes

- d67b01f: reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

### Patch Changes

- Updated dependencies [d67b01f]
  - rocketh@0.17.0

## 0.17.0-next.0

### Minor Changes

- reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

### Patch Changes

- Updated dependencies
  - rocketh@0.17.0-next.0
