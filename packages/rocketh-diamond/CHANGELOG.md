# @rocketh/diamond

## 0.19.22

### Patch Changes

- Updated dependencies [4a0525e]
- Updated dependencies [2e06f01]
  - @rocketh/core@0.21.0
  - @rocketh/deploy@0.19.20
  - @rocketh/read-execute@0.20.1

## 0.19.21

### Patch Changes

- Updated dependencies [8ea2a76]
- Updated dependencies [3e56ae0]
- Updated dependencies [468db2f]
- Updated dependencies [2bc550a]
- Updated dependencies [e5e14bd]
- Updated dependencies [6a274cb]
- Updated dependencies [d479e65]
- Updated dependencies [ef77a3d]
  - @rocketh/read-execute@0.20.0
  - @rocketh/core@0.20.0
  - @rocketh/deploy@0.19.19

## 0.19.20

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
  - @rocketh/deploy@0.19.18
  - @rocketh/read-execute@0.19.13

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
  - @rocketh/read-execute@0.19.12

## 0.19.18

### Patch Changes

- 0eeafba: Print what a diamond cut will do, with removals called out separately, before executing it.

  A cut is declarative: rocketh compares the selectors the diamond currently serves against the ones the declared facet set produces, and anything on chain but not declared goes into a Remove. That is the model working as designed, and it is also its sharp edge, because the same mechanism turns a typo, a commented-out facet or a half-finished refactor into the deletion of live functions. The worst case removes the only route to a future upgrade and makes the diamond permanently immutable.

  Until now the `diamondCut` transaction went out with **nothing printed**: the selectors were four-byte hex inside the calldata, so the one moment where a mistake is still cheap to catch passed in silence.

  The plan is now shown first:

  ```
    diamondCut on MyDiamond:
    REMOVING 1 function from the diamond:
      0x55241077  setValue(uint256)
    A removed function stops existing at this address. If any of the above was not meant to go,
    stop now: check that every facet you expect is in `facets`, since anything the declared set
    does not produce is removed by design.
    adding 2 functions:
      0x20965255  getValue()  ->  0xaaa...
  ```

  Two things make it worth printing. **Removals get their own block, ahead of everything else**, because scanning one combined list is exactly how a removal gets missed. And **selectors are resolved to signatures**: `Remove 0x1f931c1c` tells a reader nothing, `Remove diamondCut(...)` tells them to stop. The names are looked up in both the new merged ABI and the previous deployment's, since what is leaving is by definition no longer in the new one, and those are precisely the lines that matter most.

  An upgrade that only adds or replaces prints its summary without the removal block, so the loud part stays meaningful.

  This is a report, not a policy: nothing is refused, and a protected-selector list that would block a removal outright remains a separate, larger feature.

- a8d419d: Advertise the ERC-165 interfaces of the default facets, stop mutating the caller's `facets` array, and stop blaming `execute` for an unrelated bad template.

  Three near-misses in the same file, each a condition or a value that was almost right.

  **The default facets were installed but not advertised.** A default facet is installed when its option is `undefined` (omitted) or truthy, but the ERC-165 interface list read those same options for plain truthiness:

  ```ts
  if (options?.defaultCutFacet === undefined || options.defaultCutFacet) { /* install */ }
  ...
  if (options?.defaultCutFacet) { interfaceList.push('0x1f931c1c'); }
  ```

  So the DEFAULT configuration, which is every diamond that does not opt out, installed the cut and ownership facets and then advertised neither: `supportsInterface(0x1f931c1c)` and `supportsInterface(0x7f5828d0)` answered false on a diamond that has both. The two conditions are now one shared pair of booleans, so they cannot drift again, and the interface list is asserted against the constructor arguments the deploy actually encodes.

  **`options.facets` was mutated.** The three default facets were pushed onto the caller's own array (`const facetsSet = options.facets`). Reusing one options object across two `diamond(...)` calls appended them twice, which puts the same selector in a single Add cut (a revert) or trips `mergeABIs({check: true})` first. It is a copy now.

  **A diamond with no `execute` could be told `execute is set in option`.** `executeData` is the STRING `'0x'` when there is no initializer, and that is truthy, so the placeholder-substitution block ran unconditionally and could reach its "no `{init}` or `{initData}` found in list of args even though execute is set in option" throw for a caller who set no such option. Only the throw is conditional on there being a call now; the placeholders are still substituted either way, since an unreplaced `'{init}'` string would otherwise reach the constructor encoder.

  **Removed: the `artifact` field on `DiamondDeploymentConstruction`.** It was accepted by the type and then ignored, because the base diamond deployed is always this package's bundled one. Passing it could make a caller believe they had replaced the diamond base (with an independently audited one, say) while the bundled implementation was what landed on chain. Supporting a user-provided base is a real feature and is recorded as an idea, along with the finding that the non-default `diamondContractArgs` placeholders (`{erc165}`, `{init}`, `{initAddress}`, `{initData}`) describe constructor shapes the bundled diamond does not have and are therefore unreachable until that feature exists.

  **Not changed: an `execute` still only runs when a cut happens.** A review reported the initializer-only case (an `execute` with no selector change) as a bug. It is not: deploy scripts are re-run, so an initializer that fired on every re-run would not be idempotent. `@rocketh/proxy` gates its own `execute` the same way (nothing happens when the implementation is unchanged), and so did both of hardhat-deploy v1's diamond implementations. What is genuinely missing is the `{init, onUpgrade}` split the proxy already has, which is now recorded as an idea; `execute` is documented as the flat form of that option in the meantime.

- a4de04d: Vendor the Solidity sources of the bundled Diamond artifacts, and prove they produce the shipped bytecode.

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

- Updated dependencies [1973f4f]
- Updated dependencies [8547e39]
  - @rocketh/deploy@0.19.16
  - @rocketh/core@0.19.11
  - @rocketh/read-execute@0.19.11

## 0.19.17

### Patch Changes

- b34e921: Dependency maintenance: bump transitive runtime dependency ranges across all published packages. Notable bumps: `viem` ^2.48.2 → ^2.55.13, `abitype` ^1.2.4 → ^1.3.0, `commander` ^14.0.3 → ^15.0.0, `chalk` 5.6.2 → 6.0.0, `fs-extra` ^11.3.4 → ^11.4.0, `ldenv` ^0.5.0 → ^0.6.0, `hardhat` peer ^3.6.0 → ^3.12.0, `ipfs-gateway-emulator` 4.2.1-ipfs.2 → 5.0.0, `typedoc` ^0.28.19 → ^0.28.20. `zod` is kept on ^3.25.76 (not bumped to 4.x) so `hardhat-deploy` stays compatible with hardhat's zod 3 tree. Root dev tooling also bumped (`@types/node` 25 → 26, `nx` 22 → 23, `@changesets/cli` 2 → 3, `tsx`, `prettier`, `@vitest/coverage-v8`, `vitest`); `syncpack` removed (v15 has pnpm interop issues). No public API changes — typecheck, the 444-test suite, and a cache-busted build all pass.
- Updated dependencies [b34e921]
  - @rocketh/core@0.19.10
  - @rocketh/deploy@0.19.15
  - @rocketh/read-execute@0.19.10

## 0.19.16

### Patch Changes

- Updated dependencies [2ea36e3]
- Updated dependencies [c833bda]
- Updated dependencies [68fede3]
- Updated dependencies [bf7ee52]
  - @rocketh/deploy@0.19.14
  - @rocketh/core@0.19.9
  - @rocketh/read-execute@0.19.9

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
  - @rocketh/read-execute@0.19.8

## 0.19.14

### Patch Changes

- Updated dependencies [09ea46d]
  - @rocketh/core@0.19.7
  - @rocketh/deploy@0.19.12
  - @rocketh/read-execute@0.19.7

## 0.19.13

### Patch Changes

- Updated dependencies [6456996]
  - @rocketh/core@0.19.6
  - @rocketh/deploy@0.19.11
  - @rocketh/read-execute@0.19.6

## 0.19.12

### Patch Changes

- Updated dependencies [7249888]
  - @rocketh/core@0.19.5
  - @rocketh/deploy@0.19.10
  - @rocketh/read-execute@0.19.5

## 0.19.11

### Patch Changes

- Updated dependencies [b2987d7]
  - @rocketh/core@0.19.4
  - @rocketh/deploy@0.19.9
  - @rocketh/read-execute@0.19.4

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
  - @rocketh/read-execute@0.19.3
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
  - @rocketh/read-execute@0.19.2

## 0.19.3

### Patch Changes

- packagesWithLogsEnabled + latest deps
- Updated dependencies
  - @rocketh/core@0.19.1
  - @rocketh/deploy@0.19.2
  - @rocketh/read-execute@0.19.1

## 0.19.2

### Patch Changes

- export artifacts files

## 0.19.1

### Patch Changes

- fix
- Updated dependencies
  - @rocketh/deploy@0.19.1

## 0.19.0

### Minor Changes

- autoMine

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.19.0
  - @rocketh/deploy@0.19.0
  - @rocketh/read-execute@0.19.0

## 0.18.5

### Patch Changes

- environment refactor for simpler extensions
- Updated dependencies
  - @rocketh/read-execute@0.18.5
  - @rocketh/deploy@0.18.4
  - @rocketh/core@0.18.4

## 0.18.4

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.18.4
  - @rocketh/core@0.18.3
  - @rocketh/deploy@0.18.3

## 0.18.3

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.18.3

## 0.18.2

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.2
  - @rocketh/deploy@0.18.2
  - @rocketh/read-execute@0.18.2

## 0.18.1

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.1
  - @rocketh/deploy@0.18.1
  - @rocketh/read-execute@0.18.1

## 0.18.0

### Minor Changes

- inject default chains instead of getting it at runtime

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.0
  - @rocketh/deploy@0.18.0
  - @rocketh/read-execute@0.18.0

## 0.17.23

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.17.18

## 0.17.22

### Patch Changes

- fix diamond execute facet init

## 0.17.21

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.17.17
  - @rocketh/core@0.17.17
  - @rocketh/read-execute@0.17.17

## 0.17.20

### Patch Changes

- fix diamond types

## 0.17.19

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.16
  - @rocketh/deploy@0.17.16
  - @rocketh/read-execute@0.17.16

## 0.17.18

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.15
  - @rocketh/deploy@0.17.15
  - @rocketh/read-execute@0.17.15

## 0.17.17

### Patch Changes

- latest deps
- Updated dependencies
  - @rocketh/read-execute@0.17.14
  - @rocketh/deploy@0.17.14
  - @rocketh/core@0.17.14

## 0.17.16

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.13
  - @rocketh/deploy@0.17.13
  - @rocketh/read-execute@0.17.13

## 0.17.15

### Patch Changes

- add metadata to packages
- Updated dependencies
  - @rocketh/core@0.17.12
  - @rocketh/deploy@0.17.12
  - @rocketh/read-execute@0.17.12

## 0.17.14

### Patch Changes

- add licenses
- Updated dependencies
  - @rocketh/core@0.17.11
  - @rocketh/deploy@0.17.11
  - @rocketh/read-execute@0.17.11

## 0.17.13

### Patch Changes

- update deps
- Updated dependencies
  - @rocketh/read-execute@0.17.10
  - @rocketh/deploy@0.17.10
  - @rocketh/core@0.17.10

## 0.17.12

### Patch Changes

- 8ef1407: fix typos + improvements
- ef83a74: update deps
- ce1e98f: readme
- e01378e: publish src too
- Updated dependencies [8ef1407]
- Updated dependencies [ef83a74]
- Updated dependencies [7c42de1]
- Updated dependencies [ce1e98f]
- Updated dependencies [e01378e]
  - @rocketh/read-execute@0.17.9
  - @rocketh/deploy@0.17.9
  - @rocketh/core@0.17.9

## 0.17.11

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.8
  - @rocketh/deploy@0.17.8
  - @rocketh/read-execute@0.17.8

## 0.17.10

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.17.7

## 0.17.9

### Patch Changes

- Updated dependencies [f7a81d8]
  - @rocketh/core@0.17.7
  - @rocketh/deploy@0.17.7
  - @rocketh/read-execute@0.17.6

## 0.17.8

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.17.5

## 0.17.7

### Patch Changes

- Updated dependencies [f4431ed]
  - @rocketh/core@0.17.6
  - @rocketh/deploy@0.17.6
  - @rocketh/read-execute@0.17.4

## 0.17.6

### Patch Changes

- update deps and dev deps
- Updated dependencies
  - @rocketh/read-execute@0.17.3
  - @rocketh/deploy@0.17.5
  - @rocketh/core@0.17.5

## 0.17.5

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.4
  - @rocketh/deploy@0.17.4
  - @rocketh/read-execute@0.17.2

## 0.17.4

### Patch Changes

- Updated dependencies [b03146f]
- Updated dependencies [dc5aefe]
  - @rocketh/read-execute@0.17.2
  - @rocketh/deploy@0.17.3
  - @rocketh/core@0.17.3

## 0.17.3

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.17.2
  - @rocketh/core@0.17.2
  - @rocketh/read-execute@0.17.1

## 0.17.2

### Patch Changes

- 6642ece: reorg using @rocketh/core for utility functions and types (still reexported from rocketh)
- c574413: LinkedData vs LinkedDataProvided
- Updated dependencies [6642ece]
- Updated dependencies [c574413]
  - @rocketh/read-execute@0.17.1
  - @rocketh/deploy@0.17.1
  - @rocketh/core@0.17.1

## 0.17.1

### Patch Changes

- fix export

## 0.17.0

### Minor Changes

- d67b01f: reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

### Patch Changes

- Updated dependencies [d67b01f]
  - @rocketh/read-execute@0.17.0
  - @rocketh/deploy@0.17.0

## 0.17.0-next.0

### Minor Changes

- reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.17.0-next.0
  - @rocketh/deploy@0.17.0-next.0

## 0.16.0

### Minor Changes

- add @roceth/core

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.16.0
  - @rocketh/read-execute@0.16.0

## 0.15.5

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.15.3
  - @rocketh/deploy@0.15.3

## 0.15.4

### Patch Changes

- latest deps
- Updated dependencies
  - @rocketh/read-execute@0.15.2
  - @rocketh/deploy@0.15.2

## 0.15.3

### Patch Changes

- fix exports

## 0.15.2

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.15.1

## 0.15.1

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.15.1

## 0.15.0

### Patch Changes

- 691d296: fixes
- 68151ae: rname target to environment
- e2dbd6f: revamp of types and resolution
- e260c6d: fix
- Updated dependencies [691d296]
- Updated dependencies [03f2406]
- Updated dependencies [68151ae]
- Updated dependencies [e2dbd6f]
- Updated dependencies [851378e]
- Updated dependencies [e260c6d]
  - @rocketh/read-execute@0.15.0
  - @rocketh/deploy@0.15.0

## 0.15.0-testing.3

### Patch Changes

- fixes
- Updated dependencies
  - @rocketh/read-execute@0.15.0-testing.3
  - @rocketh/deploy@0.15.0-testing.5

## 0.15.0-testing.2

### Patch Changes

- rname target to environment
- Updated dependencies
  - @rocketh/read-execute@0.15.0-testing.2
  - @rocketh/deploy@0.15.0-testing.4

## 0.15.0-testing.1

### Patch Changes

- fix
- Updated dependencies
  - @rocketh/read-execute@0.15.0-testing.1
  - @rocketh/deploy@0.15.0-testing.3

## 0.15.0-testing.0

### Patch Changes

- revamp of types and resolution
- Updated dependencies
  - @rocketh/deploy@0.15.0-testing.2
  - @rocketh/read-execute@0.14.4-testing.0

## 0.14.4-testing.1

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.15.0-testing.1
  - @rocketh/read-execute@0.14.3

## 0.14.4-testing.0

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.15.0-testing.0
  - @rocketh/read-execute@0.14.3

## 0.14.3

### Patch Changes

- fix
- Updated dependencies
  - @rocketh/read-execute@0.14.3
  - @rocketh/deploy@0.14.2

## 0.14.2

### Patch Changes

- latest deps + fix eth_feeHistory
- Updated dependencies
  - @rocketh/read-execute@0.14.2
  - @rocketh/deploy@0.14.1

## 0.14.1

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.14.1

## 0.14.0

### Minor Changes

- setup for both deployScript and loadAndExecuteDeployments

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.14.0
  - @rocketh/read-execute@0.14.0

## 0.13.0

### Minor Changes

- use env function for extended functions

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.13.0
  - @rocketh/deploy@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.12.1
  - @rocketh/read-execute@0.12.0

## 0.12.0

### Minor Changes

- switch to setup function

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.12.0
  - @rocketh/read-execute@0.12.0

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
  - @rocketh/read-execute@0.11.23
  - @rocketh/deploy@0.11.22

## 0.11.25-testing.8

### Patch Changes

- fix
- Updated dependencies
  - @rocketh/read-execute@0.11.23-testing.8
  - @rocketh/deploy@0.11.22-testing.8

## 0.11.25-testing.7

### Patch Changes

- Extra type generic
- Updated dependencies
  - @rocketh/read-execute@0.11.23-testing.7
  - @rocketh/deploy@0.11.22-testing.7

## 0.11.25-testing.6

### Patch Changes

- fix
- Updated dependencies
  - @rocketh/read-execute@0.11.23-testing.6
  - @rocketh/deploy@0.11.22-testing.6

## 0.11.25-testing.5

### Patch Changes

- allow to pass Extra date to environment
- Updated dependencies
  - @rocketh/read-execute@0.11.23-testing.5
  - @rocketh/deploy@0.11.22-testing.5

## 0.11.25-testing.4

### Patch Changes

- fix
- Updated dependencies
  - @rocketh/read-execute@0.11.23-testing.4
  - @rocketh/deploy@0.11.22-testing.4

## 0.11.25-testing.3

### Patch Changes

- signer protocols are specified via config
- Updated dependencies
  - @rocketh/read-execute@0.11.23-testing.3
  - @rocketh/deploy@0.11.22-testing.3

## 0.11.25-testing.2

### Patch Changes

- use hard deps
- Updated dependencies
  - @rocketh/read-execute@0.11.23-testing.2
  - @rocketh/deploy@0.11.22-testing.2

## 0.11.25-testing.1

### Patch Changes

- fixes
- Updated dependencies
  - @rocketh/read-execute@0.11.23-testing.1
  - @rocketh/deploy@0.11.22-testing.1
  - rocketh@0.11.22-testing.1

## 0.11.25-testing.0

### Patch Changes

- remove use of global, breakinmg change
- Updated dependencies
  - @rocketh/read-execute@0.11.23-testing.0
  - @rocketh/deploy@0.11.22-testing.0
  - rocketh@0.11.22-testing.0

## 0.11.24

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.11.22
  - rocketh@0.11.21
  - @rocketh/deploy@0.11.21

## 0.11.23

### Patch Changes

- Updated dependencies
  - rocketh@0.11.20
  - @rocketh/deploy@0.11.20
  - @rocketh/read-execute@0.11.21

## 0.11.22

### Patch Changes

- Updated dependencies
  - rocketh@0.11.19
  - @rocketh/deploy@0.11.19
  - @rocketh/read-execute@0.11.20

## 0.11.21

### Patch Changes

- Updated dependencies
  - rocketh@0.11.18
  - @rocketh/deploy@0.11.18
  - @rocketh/read-execute@0.11.19

## 0.11.20

### Patch Changes

- Updated dependencies
  - rocketh@0.11.17
  - @rocketh/deploy@0.11.17
  - @rocketh/read-execute@0.11.18

## 0.11.19

### Patch Changes

- Updated dependencies
  - rocketh@0.11.16
  - @rocketh/deploy@0.11.16
  - @rocketh/read-execute@0.11.17

## 0.11.18

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.11.16

## 0.11.17

### Patch Changes

- Updated dependencies
  - rocketh@0.11.15
  - @rocketh/deploy@0.11.15
  - @rocketh/read-execute@0.11.15

## 0.11.16

### Patch Changes

- LinkedData + remove auto-json-convertion
- Updated dependencies
  - @rocketh/deploy@0.11.14
  - rocketh@0.11.14
  - @rocketh/read-execute@0.11.14

## 0.11.15

### Patch Changes

- Updated dependencies
  - rocketh@0.11.13
  - @rocketh/deploy@0.11.13
  - @rocketh/read-execute@0.11.13

## 0.11.14

### Patch Changes

- Updated dependencies
  - rocketh@0.11.12
  - @rocketh/deploy@0.11.12
  - @rocketh/read-execute@0.11.12

## 0.11.13

### Patch Changes

- Updated dependencies
  - rocketh@0.11.11
  - @rocketh/deploy@0.11.11
  - @rocketh/read-execute@0.11.11

## 0.11.12

### Patch Changes

- Updated dependencies
  - rocketh@0.11.10
  - @rocketh/deploy@0.11.10
  - @rocketh/read-execute@0.11.10

## 0.11.11

### Patch Changes

- Updated dependencies [6d4e756]
- Updated dependencies [82f6787]
- Updated dependencies [37e6a46]
  - rocketh@0.11.9
  - @rocketh/deploy@0.11.9
  - @rocketh/read-execute@0.11.9

## 0.11.10

### Patch Changes

- Updated dependencies
  - rocketh@0.11.8
  - @rocketh/deploy@0.11.8
  - @rocketh/read-execute@0.11.8

## 0.11.9

### Patch Changes

- Updated dependencies
  - rocketh@0.11.7
  - @rocketh/deploy@0.11.7
  - @rocketh/read-execute@0.11.7

## 0.11.8

### Patch Changes

- fixes
- Updated dependencies
  - @rocketh/read-execute@0.11.6
  - @rocketh/deploy@0.11.6
  - rocketh@0.11.6

## 0.11.7

### Patch Changes

- Updated dependencies [4426c7d]
  - @rocketh/deploy@0.11.5
  - rocketh@0.11.5
  - @rocketh/read-execute@0.11.5

## 0.11.6

### Patch Changes

- Updated dependencies
  - rocketh@0.11.4
  - @rocketh/deploy@0.11.4
  - @rocketh/read-execute@0.11.4

## 0.11.5

### Patch Changes

- diamond owner do the upgrade, not deployer

## 0.11.4

### Patch Changes

- 3f39d5c: use hardhat-deloy v1 proxies + add proxyDisabled option
- Updated dependencies [2431e8f]
  - @rocketh/deploy@0.11.3
  - rocketh@0.11.3
  - @rocketh/read-execute@0.11.3

## 0.11.3

### Patch Changes

- 5aa668e: typed execution for diamond
- 858c537: add contract helper for proxy and diamond
- aaba9cb: allow to not save deployment + use it for diamond unamed artifact execution
- 9df6923: add execute to diamond
- fee5656: upgradeIndex and numDeployments tracking
- Updated dependencies [f2959f3]
- Updated dependencies [169b618]
- Updated dependencies [aaba9cb]
- Updated dependencies [fee5656]
  - @rocketh/deploy@0.11.2
  - rocketh@0.11.2
  - @rocketh/read-execute@0.11.2

## 0.11.2

### Patch Changes

- working diamond

## 0.11.1

### Patch Changes

- release as v0.11.1
- Updated dependencies
  - rocketh@0.11.1
  - @rocketh/deploy@0.11.1
  - @rocketh/read-execute@0.11.1
