# @rocketh/router

## 0.19.22

### Patch Changes

- Updated dependencies [6a274cb]
- Updated dependencies [d479e65]
- Updated dependencies [ef77a3d]
  - @rocketh/core@0.20.0
  - @rocketh/deploy@0.19.19

## 0.19.21

### Patch Changes

- 466a7d1: Deploy a router whenever its routes changed, instead of skipping it and stranding the new route. `deployViaRouter` synthesised `skipIfAlreadyDeployed: true` for the router contract, which makes `@rocketh/deploy` return the existing record on NAME alone, without comparing bytecode or constructor args. A changed route was then redeployed to a new address while the router kept naming the previous one: the new code was on chain, reachable by nobody, and nothing reported an error. The trigger was passing ANY fourth argument to `deployViaRouter`, because the router's options were built inside `options ? … : undefined`; omitting options avoided it.

  That default belongs to a PROXY, whose address is stable and whose implementation pointer is mutable, so an existing one is left in place and the change is wired in by a later upgrade call. A router has neither: it is immutable and the route addresses live in its constructor args, so a redeployed route makes the existing router stale by definition. Routes and router now both take the ordinary comparison, and behaviour no longer depends on whether an options object was passed.

  `RouterDeployOptions` is now exactly `DeployOptions` plus `extraABIs` and `routerContract`, as the README already documented it. It previously omitted `skipIfAlreadyDeployed`, `alwaysOverride` and `strictBytecodeMatch` and re-added a hand-rolled union, which encoded "a router is special" into the option surface. It is not: a router is a plain immutable deployment. What is particular to it is that it writes SEVERAL deployment names, which is a question of the LEVEL an option applies at.

  `skipIfAlreadyDeployed` therefore applies to the composite as a whole. If a deployment exists under `name` it is returned untouched and nothing is deployed, routes included. It is never pushed down to a child, because `deploy` keys the skip on a name existing, so a per-child skip leaves a seam wherever one name is new: forced onto the router alone it stranded a changed route, and forwarding it to the routes as well would strand an ADDED route instead (new route deploys, router is frozen). Combining it with `alwaysOverride` throws with the same message `deploy` uses, restated here because the composite skip returns before any child deploy is reached.

  `deployViaProxy` had the same root cause on its `proxyDisabled` path, which took the PROXY's options for a deployment that is not a proxy. With the proxy disabled, the deployment under `name` is the contract itself and nothing rewires it afterwards, so it now takes the IMPLEMENTATION's options instead. Three things change: a forced `skipIfAlreadyDeployed` no longer silently leaves a recompiled contract undeployed while reporting `newlyDeployed: false`; a forced `strictBytecodeMatch: false` no longer discards the caller's own setting for their own contract (that forcing exists so a metadata-only diff cannot trigger an UPGRADE, which is not a risk when there is no proxy to upgrade); and `deterministicImplementation` is no longer dropped, when with the proxy disabled it is the only implementation there is.

  Not changed here: `ProxyDeployOptions` still omits `skipIfAlreadyDeployed`, so a `proxyDisabled: true` caller has no way to freeze a deployment. Supporting it raises the same level question the router just answered, and the answer for a proxied deploy (freeze the proxy, the implementation, the admin, all of it?) is a separate decision from this fix.

  The proxy's own proxy deploy and `@rocketh/diamond` are unaffected: their child changes are wired in by `upgradeTo` and `diamondCut`, both gated on on-chain state rather than on `newlyDeployed`.

## 0.19.20

### Patch Changes

- 28426fe: Rewrite the npm-facing metadata so the packages are discoverable by the terms people actually search, rather than by a name they have to already know.

  Every package carried the same four keywords (`rocketh`, `ethereum`, `deployment`, `test`), which meant the scope was findable only by someone who had already heard of it. Keywords are now per-package and include the terms a search starts from: `hardhat-deploy`, `solidity`, `smart-contracts`, `evm`, `viem`, plus the specifics each package is the answer to (`create2`/`create3`, `uups`/`erc1967`/`erc173`, `eip-2535`, `etherscan`/`sourcify`, `safe`/`multisig`).

  Descriptions defined each package in terms of rocketh itself ("provide deploy function for rocketh"), which is the one thing a first-time reader on npm cannot yet resolve. They now lead with the capability and anchor it to known concepts. Also fixes a typo in `@rocketh/read-execute` ("read abd execute").

  `rocketh`'s `homepage` now points at https://rocketh.dev rather than the monorepo README.

- Updated dependencies [ef2a3f6]
- Updated dependencies [28426fe]
- Updated dependencies [e7ce24b]
  - @rocketh/core@0.19.13
  - @rocketh/deploy@0.19.18

## 0.19.19

### Patch Changes

- 916507d: Record a deployment whenever the chain agrees with the target, not only when this run is what changed it.

  **The bug.** `deployViaProxy` wrote the proxy's record only inside the branch that performs an upgrade. That answers "did THIS run change anything?", which is a different question from "does the record still describe reality", and the two come apart whenever the upgrade happens somewhere else. For a governed upgrade that is always: the run that wants it throws `UnknownSignerError` at the `_execute` before reaching the save, and the run after governance executes finds the implementation slot already correct and skips the whole branch. No run wrote the record, so it kept the OLD implementation's ABI indefinitely.

  That record is what `@rocketh/export` ships to a frontend, what `env.get<Abi>(name)` hands the next script, and what `@rocketh/doc` documents. All three went silently stale, and only for users whose upgrades are governed by a Safe, a timelock or any other account rocketh cannot sign for, which is exactly why it survived: in the ordinary signable flow the upgrade and the save happen in the same run.

  Reproduced end to end against a local node with `demoes/hardhat-deploy/governance`: after deferring an upgrade, executing it on the multisig, and re-running to convergence, the chain ran the new implementation while `Registry.json` still described the old one.

  **Same defect in `@rocketh/diamond`**, same cause: the save lived inside `if (changesDetected)`. Worth noting the change DETECTION was always right, since it reads the on-chain loupe rather than the record, so a deferred `diamondCut` did converge. Only the record was left behind.

  **`@rocketh/router` was affected too, and does not need governance to reach it.** Its save was guarded on `!existingDeployment || router.newlyDeployed`, and `extraABIs` contribute to the merged ABI without reaching the router's constructor args. So adding one was a silent no-op: the router is not redeployed, nothing is saved, and the record keeps an ABI that omits it.

  All three now re-record when the stored record disagrees with what is declared and on chain, guarded so an ordinary converged re-run still writes nothing. An upgrade a run actually performs still saves unconditionally: two implementations can differ while their ABIs are identical, so making that save conditional would freeze `numDeployments` on a real upgrade and break `upgradeIndex`, which reads the counter to decide which step of an upgrade sequence has already run.

  `upgradeIndex` now has an integration test that runs the story it exists for, `0` then `1` then `2` across separate calls, and asserts the second run broadcasts nothing. Its existing unit tests hand `checkUpgradeIndex` a fabricated record, so they could never have shown that the feature did not survive a reload.

  **`numDeployments` counts changes to the RECORD**, whether rocketh made the change or merely observed one made elsewhere. An upgrade executed by a Safe out-of-band therefore counts exactly as one rocketh sent itself, and the deferred path now produces the same record as the signable path, that field included.

  **Renamed `save`'s `doNotCountAsNewDeployment` option to `considerItAsFreshDeployment`** (`@rocketh/core` type, `rocketh` implementation). The old name promised "do not increment" and actually did something stronger: it ASSERTS a count of 1. That was harmless for its two callers, which each record something deployed exactly once, and a trap for anyone reaching for it to refresh a record whose history matters, which the work above nearly did. The name now states the behaviour. This is a breaking rename of an option on `Environment.save`, and both in-tree callers were updated: `@rocketh/deploy` (recording a CREATE3 address that already holds the right code) and `@rocketh/diamond` (its fresh-diamond path). If you call `save` yourself with the old option name, a plain object literal will fail its excess-property check loudly, but a loosely typed options variable will silently stop asserting a fresh deployment and start incrementing instead.

  **`numDeployments` now survives to disk.** `save()` counted into the in-memory record and then wrote the UNCOUNTED argument, so the field reached a file only when a caller happened to spread an object that already carried one. Anything reading it across runs, `checkUpgradeIndex` most of all, was working from a number that silently restarted. It now serialises the counted record.

  It is **omitted while the count is 1**, which is the overwhelmingly common case and says nothing. Absent already reads back as 1, since the increment is `(old.numDeployments || 1) + 1`, so this keeps files small rather than introducing a case anyone downstream has to remember. A record reset by `considerItAsFreshDeployment` drops the field again.

  Note for anyone with committed `deployments/` folders: the first run after upgrading may rewrite a record that had gone stale and tick its `numDeployments`, which is the fix doing its job. Records that have only ever been deployed once gain nothing, and the occasional file carrying `numDeployments: 1` today will shed it.

- Updated dependencies [916507d]
  - @rocketh/deploy@0.19.17
  - @rocketh/core@0.19.12

## 0.19.18

### Patch Changes

- Updated dependencies [1973f4f]
- Updated dependencies [8547e39]
  - @rocketh/deploy@0.19.16
  - @rocketh/core@0.19.11

## 0.19.17

### Patch Changes

- b34e921: Dependency maintenance: bump transitive runtime dependency ranges across all published packages. Notable bumps: `viem` ^2.48.2 → ^2.55.13, `abitype` ^1.2.4 → ^1.3.0, `commander` ^14.0.3 → ^15.0.0, `chalk` 5.6.2 → 6.0.0, `fs-extra` ^11.3.4 → ^11.4.0, `ldenv` ^0.5.0 → ^0.6.0, `hardhat` peer ^3.6.0 → ^3.12.0, `ipfs-gateway-emulator` 4.2.1-ipfs.2 → 5.0.0, `typedoc` ^0.28.19 → ^0.28.20. `zod` is kept on ^3.25.76 (not bumped to 4.x) so `hardhat-deploy` stays compatible with hardhat's zod 3 tree. Root dev tooling also bumped (`@types/node` 25 → 26, `nx` 22 → 23, `@changesets/cli` 2 → 3, `tsx`, `prettier`, `@vitest/coverage-v8`, `vitest`); `syncpack` removed (v15 has pnpm interop issues). No public API changes — typecheck, the 444-test suite, and a cache-busted build all pass.
- Updated dependencies [b34e921]
  - @rocketh/core@0.19.10
  - @rocketh/deploy@0.19.15

## 0.19.16

### Patch Changes

- Updated dependencies [2ea36e3]
- Updated dependencies [c833bda]
- Updated dependencies [bf7ee52]
  - @rocketh/deploy@0.19.14
  - @rocketh/core@0.19.9

## 0.19.15

### Patch Changes

- Updated dependencies [11ab414]
- Updated dependencies [a5db88c]
- Updated dependencies [2bacf9a]
- Updated dependencies [aac0ca1]
- Updated dependencies [9319520]
- Updated dependencies [2797550]
- Updated dependencies [43b9545]
- Updated dependencies [e20634b]
- Updated dependencies [d800333]
- Updated dependencies [01d5bfb]
  - @rocketh/core@0.19.8
  - @rocketh/deploy@0.19.13

## 0.19.14

### Patch Changes

- Updated dependencies [09ea46d]
  - @rocketh/core@0.19.7
  - @rocketh/deploy@0.19.12

## 0.19.13

### Patch Changes

- Updated dependencies [6456996]
  - @rocketh/core@0.19.6
  - @rocketh/deploy@0.19.11

## 0.19.12

### Patch Changes

- Updated dependencies [7249888]
  - @rocketh/core@0.19.5
  - @rocketh/deploy@0.19.10

## 0.19.11

### Patch Changes

- Updated dependencies [b2987d7]
  - @rocketh/core@0.19.4
  - @rocketh/deploy@0.19.9

## 0.19.10

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.19.8

## 0.19.9

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.19.7

## 0.19.8

### Patch Changes

- 72df1c8: strictBytecodeMatch and alwaysOverride for diamond/router/proxies

## 0.19.7

### Patch Changes

- Updated dependencies [56bcf8d]
  - @rocketh/deploy@0.19.6

## 0.19.6

### Patch Changes

- Updated dependencies [034b3a7]
  - @rocketh/core@0.19.3
  - @rocketh/deploy@0.19.5

## 0.19.5

### Patch Changes

- e06b151: fix cbor logic for bytecode matching + remove unecessary logs
- Updated dependencies [e06b151]
  - @rocketh/deploy@0.19.4

## 0.19.4

### Patch Changes

- Updated dependencies [c6fa24e]
  - @rocketh/core@0.19.2
  - @rocketh/deploy@0.19.3

## 0.19.3

### Patch Changes

- packagesWithLogsEnabled + latest deps
- Updated dependencies
  - @rocketh/core@0.19.1
  - @rocketh/deploy@0.19.2

## 0.19.2

### Patch Changes

- export router artifact

## 0.19.1

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.19.1

## 0.19.0

### Minor Changes

- autoMine

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.19.0
  - @rocketh/deploy@0.19.0

## 0.18.4

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.18.4
  - @rocketh/core@0.18.4

## 0.18.3

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.3
  - @rocketh/deploy@0.18.3

## 0.18.2

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.2
  - @rocketh/deploy@0.18.2

## 0.18.1

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.1
  - @rocketh/deploy@0.18.1

## 0.18.0

### Minor Changes

- inject default chains instead of getting it at runtime

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.0
  - @rocketh/deploy@0.18.0

## 0.17.20

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.17.18

## 0.17.19

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.17.17
  - @rocketh/core@0.17.17

## 0.17.18

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.16
  - @rocketh/deploy@0.17.16

## 0.17.17

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.15
  - @rocketh/deploy@0.17.15

## 0.17.16

### Patch Changes

- latest deps
- Updated dependencies
  - @rocketh/deploy@0.17.14
  - @rocketh/core@0.17.14

## 0.17.15

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.13
  - @rocketh/deploy@0.17.13

## 0.17.14

### Patch Changes

- add metadata to packages
- Updated dependencies
  - @rocketh/core@0.17.12
  - @rocketh/deploy@0.17.12

## 0.17.13

### Patch Changes

- add licenses
- Updated dependencies
  - @rocketh/core@0.17.11
  - @rocketh/deploy@0.17.11

## 0.17.12

### Patch Changes

- update deps
- Updated dependencies
  - @rocketh/deploy@0.17.10
  - @rocketh/core@0.17.10

## 0.17.11

### Patch Changes

- 8ef1407: fix typos + improvements
- ef83a74: update deps
- ce1e98f: readme
- e01378e: publish src too
- Updated dependencies [8ef1407]
- Updated dependencies [ef83a74]
- Updated dependencies [ce1e98f]
- Updated dependencies [e01378e]
  - @rocketh/deploy@0.17.9
  - @rocketh/core@0.17.9

## 0.17.10

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.8
  - @rocketh/deploy@0.17.8

## 0.17.9

### Patch Changes

- Updated dependencies [f7a81d8]
  - @rocketh/core@0.17.7
  - @rocketh/deploy@0.17.7

## 0.17.8

### Patch Changes

- Updated dependencies [f4431ed]
  - @rocketh/core@0.17.6
  - @rocketh/deploy@0.17.6

## 0.17.7

### Patch Changes

- update deps and dev deps
- Updated dependencies
  - @rocketh/deploy@0.17.5
  - @rocketh/core@0.17.5

## 0.17.6

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.4
  - @rocketh/deploy@0.17.4

## 0.17.5

### Patch Changes

- fix type

## 0.17.4

### Patch Changes

- 651abb7: fix passing of options
- Updated dependencies [b03146f]
- Updated dependencies [dc5aefe]
  - @rocketh/deploy@0.17.3
  - @rocketh/core@0.17.3

## 0.17.3

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.17.2
  - @rocketh/core@0.17.2

## 0.17.2

### Patch Changes

- 6642ece: reorg using @rocketh/core for utility functions and types (still reexported from rocketh)
- Updated dependencies [6642ece]
- Updated dependencies [c574413]
  - @rocketh/deploy@0.17.1
  - @rocketh/core@0.17.1

## 0.17.1

### Patch Changes

- Updated dependencies
  - rocketh@0.17.1
  - @rocketh/deploy@0.17.0

## 0.17.0

### Minor Changes

- d67b01f: reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

### Patch Changes

- Updated dependencies [d67b01f]
  - @rocketh/deploy@0.17.0
  - rocketh@0.17.0

## 0.17.0-next.0

### Minor Changes

- reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.17.0-next.0
  - rocketh@0.17.0-next.0

## 0.16.0

### Minor Changes

- add @roceth/core

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.16.0
  - @rocketh/deploy@0.16.0

## 0.15.16

### Patch Changes

- Updated dependencies
  - rocketh@0.15.15
  - @rocketh/deploy@0.15.3

## 0.15.15

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.15.3
  - rocketh@0.15.14

## 0.15.14

### Patch Changes

- Updated dependencies
  - rocketh@0.15.13
  - @rocketh/deploy@0.15.2

## 0.15.13

### Patch Changes

- Updated dependencies
  - rocketh@0.15.12
  - @rocketh/deploy@0.15.2

## 0.15.12

### Patch Changes

- Updated dependencies
  - rocketh@0.15.11
  - @rocketh/deploy@0.15.2

## 0.15.11

### Patch Changes

- latest deps
- Updated dependencies
  - @rocketh/deploy@0.15.2
  - rocketh@0.15.10

## 0.15.10

### Patch Changes

- Updated dependencies
  - rocketh@0.15.9
  - @rocketh/deploy@0.15.1

## 0.15.9

### Patch Changes

- Updated dependencies
  - rocketh@0.15.8
  - @rocketh/deploy@0.15.1

## 0.15.8

### Patch Changes

- Updated dependencies
  - rocketh@0.15.7
  - @rocketh/deploy@0.15.1

## 0.15.7

### Patch Changes

- Updated dependencies
  - rocketh@0.15.6
  - @rocketh/deploy@0.15.1

## 0.15.6

### Patch Changes

- Updated dependencies
  - rocketh@0.15.5
  - @rocketh/deploy@0.15.1

## 0.15.5

### Patch Changes

- Updated dependencies
  - rocketh@0.15.4
  - @rocketh/deploy@0.15.1

## 0.15.4

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.15.1

## 0.15.3

### Patch Changes

- Updated dependencies
  - rocketh@0.15.3
  - @rocketh/deploy@0.15.0

## 0.15.2

### Patch Changes

- Updated dependencies
  - rocketh@0.15.2
  - @rocketh/deploy@0.15.0

## 0.15.1

### Patch Changes

- Updated dependencies
  - rocketh@0.15.1
  - @rocketh/deploy@0.15.0

## 0.15.0

### Patch Changes

- 0d7e7ed: fix export
- 691d296: fixes
- 68151ae: rname target to environment
- e2dbd6f: revamp of types and resolution
- 0591471: fix
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
  - @rocketh/deploy@0.15.0

## 0.15.0-testing.11

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.17
  - @rocketh/deploy@0.15.0-testing.5

## 0.15.0-testing.10

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.16
  - @rocketh/deploy@0.15.0-testing.5

## 0.15.0-testing.9

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.15
  - @rocketh/deploy@0.15.0-testing.5

## 0.15.0-testing.8

### Patch Changes

- fixes
- Updated dependencies
  - @rocketh/deploy@0.15.0-testing.5
  - rocketh@0.15.0-testing.14

## 0.15.0-testing.7

### Patch Changes

- rname target to environment
- Updated dependencies
  - @rocketh/deploy@0.15.0-testing.4
  - rocketh@0.15.0-testing.13

## 0.15.0-testing.6

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.12
  - @rocketh/deploy@0.15.0-testing.3

## 0.15.0-testing.5

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.11
  - @rocketh/deploy@0.15.0-testing.3

## 0.15.0-testing.4

### Patch Changes

- fix export
- Updated dependencies
  - rocketh@0.15.0-testing.10
  - @rocketh/deploy@0.15.0-testing.3

## 0.15.0-testing.3

### Patch Changes

- Updated dependencies
  - rocketh@0.15.0-testing.9
  - @rocketh/deploy@0.15.0-testing.3

## 0.15.0-testing.2

### Patch Changes

- fix

## 0.15.0-testing.1

### Patch Changes

- fix
- Updated dependencies
  - @rocketh/deploy@0.15.0-testing.3

## 0.15.0-testing.0

### Patch Changes

- revamp of types and resolution
- Updated dependencies
  - @rocketh/deploy@0.15.0-testing.2

## 0.14.5-testing.1

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.15.0-testing.1

## 0.14.5-testing.0

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.15.0-testing.0

## 0.14.4

### Patch Changes

- fix
- Updated dependencies
  - @rocketh/deploy@0.14.2

## 0.14.3

### Patch Changes

- latest deps + fix eth_feeHistory
- Updated dependencies
  - @rocketh/deploy@0.14.1

## 0.14.2

### Patch Changes

- use latest soldiity-proxy for router

## 0.14.1

### Patch Changes

- allow to specify custom proxy and router

## 0.14.0

### Minor Changes

- setup for both deployScript and loadAndExecuteDeployments

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.14.0

## 0.13.0

### Minor Changes

- use env function for extended functions

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.12.1

## 0.12.0

### Minor Changes

- switch to setup function

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.12.0

## 0.11.25

### Patch Changes

- 5bf9962: allow to pass Extra date to environment
- a76870d: signer protocols are specified via config
- de97d9c: fix
- 77c2ffd: fix
- c841f17: use hard deps
- 966bab6: fixes
- c03812e: Extra type generic
- 1148e1c: fix
- 4d37f14: remove use of global, breakinmg change
- Updated dependencies [5bf9962]
- Updated dependencies [a76870d]
- Updated dependencies [de97d9c]
- Updated dependencies [77c2ffd]
- Updated dependencies [c841f17]
- Updated dependencies [966bab6]
- Updated dependencies [c03812e]
- Updated dependencies [1148e1c]
- Updated dependencies [4d37f14]
  - @rocketh/deploy@0.11.22

## 0.11.25-testing.8

### Patch Changes

- fix
- Updated dependencies
  - @rocketh/deploy@0.11.22-testing.8

## 0.11.25-testing.7

### Patch Changes

- Extra type generic
- Updated dependencies
  - @rocketh/deploy@0.11.22-testing.7

## 0.11.25-testing.6

### Patch Changes

- fix
- Updated dependencies
  - @rocketh/deploy@0.11.22-testing.6

## 0.11.25-testing.5

### Patch Changes

- allow to pass Extra date to environment
- Updated dependencies
  - @rocketh/deploy@0.11.22-testing.5

## 0.11.25-testing.4

### Patch Changes

- fix
- Updated dependencies
  - @rocketh/deploy@0.11.22-testing.4

## 0.11.25-testing.3

### Patch Changes

- signer protocols are specified via config
- Updated dependencies
  - @rocketh/deploy@0.11.22-testing.3

## 0.11.25-testing.2

### Patch Changes

- use hard deps
- Updated dependencies
  - @rocketh/deploy@0.11.22-testing.2

## 0.11.25-testing.1

### Patch Changes

- fixes
- Updated dependencies
  - @rocketh/deploy@0.11.22-testing.1

## 0.11.25-testing.0

### Patch Changes

- remove use of global, breakinmg change
- Updated dependencies
  - @rocketh/deploy@0.11.22-testing.0

## 0.11.24

### Patch Changes

- Updated dependencies
  - rocketh@0.11.21
  - @rocketh/deploy@0.11.21

## 0.11.23

### Patch Changes

- Updated dependencies
  - rocketh@0.11.20
  - @rocketh/deploy@0.11.20

## 0.11.22

### Patch Changes

- Updated dependencies
  - rocketh@0.11.19
  - @rocketh/deploy@0.11.19

## 0.11.21

### Patch Changes

- Updated dependencies
  - rocketh@0.11.18
  - @rocketh/deploy@0.11.18

## 0.11.20

### Patch Changes

- router: remove need for specify account for route

## 0.11.19

### Patch Changes

- fix rocketh-router types

## 0.11.18

### Patch Changes

- fix deploy-router

## 0.11.17

### Patch Changes

- Updated dependencies
  - rocketh@0.11.17
  - @rocketh/deploy@0.11.17

## 0.11.16

### Patch Changes

- Updated dependencies
  - rocketh@0.11.16
  - @rocketh/deploy@0.11.16

## 0.11.15

### Patch Changes

- Updated dependencies
  - rocketh@0.11.15
  - @rocketh/deploy@0.11.15

## 0.11.14

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.11.14
  - rocketh@0.11.14

## 0.11.13

### Patch Changes

- Updated dependencies
  - rocketh@0.11.13
  - @rocketh/deploy@0.11.13

## 0.11.12

### Patch Changes

- Updated dependencies
  - rocketh@0.11.12
  - @rocketh/deploy@0.11.12

## 0.11.11

### Patch Changes

- Updated dependencies
  - rocketh@0.11.11
  - @rocketh/deploy@0.11.11

## 0.11.10

### Patch Changes

- Updated dependencies
  - rocketh@0.11.10
  - @rocketh/deploy@0.11.10

## 0.11.9

### Patch Changes

- Updated dependencies [6d4e756]
- Updated dependencies [82f6787]
- Updated dependencies [37e6a46]
  - rocketh@0.11.9
  - @rocketh/deploy@0.11.9

## 0.11.8

### Patch Changes

- Updated dependencies
  - rocketh@0.11.8
  - @rocketh/deploy@0.11.8

## 0.11.7

### Patch Changes

- Updated dependencies
  - rocketh@0.11.7
  - @rocketh/deploy@0.11.7

## 0.11.6

### Patch Changes

- fixes
- Updated dependencies
  - @rocketh/deploy@0.11.6
  - rocketh@0.11.6

## 0.11.5

### Patch Changes

- Updated dependencies [4426c7d]
  - @rocketh/deploy@0.11.5
  - rocketh@0.11.5

## 0.11.4

### Patch Changes

- Updated dependencies
  - rocketh@0.11.4
  - @rocketh/deploy@0.11.4

## 0.11.3

### Patch Changes

- Updated dependencies [2431e8f]
  - @rocketh/deploy@0.11.3
  - rocketh@0.11.3

## 0.11.2

### Patch Changes

- 84aa470: embed solidity-proxy router artifact
- Updated dependencies [f2959f3]
- Updated dependencies [169b618]
- Updated dependencies [aaba9cb]
- Updated dependencies [fee5656]
  - @rocketh/deploy@0.11.2
  - rocketh@0.11.2

## 0.11.1

### Patch Changes

- release as v0.11.1
- Updated dependencies
  - rocketh@0.11.1
  - @rocketh/deploy@0.11.1

## invalid-next.5

### Patch Changes

- Updated dependencies [9a9b3c4]
  - rocketh@invalid-next.5
  - @rocketh/deploy@invalid-next.5

## invalid-next.4

### Patch Changes

- add @rocketh/read-execute
- Updated dependencies
  - @rocketh/deploy@invalid-next.4
  - rocketh@invalid-next.4

## invalid-next.3

### Patch Changes

- fix dist path
- Updated dependencies
  - @rocketh/deploy@invalid-next.3
  - rocketh@invalid-next.3

## invalid-next.2

### Patch Changes

- update deps
- Updated dependencies
  - @rocketh/deploy@invalid-next.2
  - rocketh@invalid-next.2

## invalid-next.1

### Patch Changes

- Updated dependencies
  - rocketh@invalid-next.1
  - @rocketh/deploy@invalid-next.1

## 0.17.0-next.0

### Major Changes

- first alpha release

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.17.0-next.0
  - rocketh@0.17.0-next.0

## 0.10.12

### Patch Changes

- fix chains import, no default export
- Updated dependencies
  - @rocketh/deploy@0.10.12
  - rocketh@0.10.18

## 0.10.11

### Patch Changes

- hardhat3-rocketh
- Updated dependencies
  - @rocketh/deploy@0.10.11
  - rocketh@0.10.17

## 0.10.10

### Patch Changes

- export dist
- Updated dependencies
  - @rocketh/deploy@0.10.10

## 0.10.9

### Patch Changes

- use tsx
- Updated dependencies
  - rocketh@0.10.16
  - @rocketh/deploy@0.10.9

## 0.10.8

### Patch Changes

- Updated dependencies
  - rocketh@0.10.15
  - @rocketh/deploy@0.10.8

## 0.10.7

### Patch Changes

- latest dependencies
- Updated dependencies
  - @rocketh/deploy@0.10.7
  - rocketh@0.10.14

## 0.10.6

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.10.6

## 0.10.5

### Patch Changes

- Updated dependencies
  - rocketh@0.10.13
  - @rocketh/deploy@0.10.5

## 0.10.4

### Patch Changes

- Updated dependencies
  - rocketh@0.10.12
  - @rocketh/deploy@0.10.4

## 0.10.3

### Patch Changes

- Updated dependencies
  - rocketh@0.10.11
  - @rocketh/deploy@0.10.3

## 0.10.2

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.10.2
  - rocketh@0.10.10

## 0.10.1

### Patch Changes

- use pkgroll and @rocketh namespace
- Updated dependencies
  - @rocketh/deploy@0.10.1
  - rocketh@0.10.9
