# @rocketh/proxy

## 0.19.23

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

- 443c031: `upgradeIndex` now works from `numDeployments` alone, and says something useful when it refuses.

  `checkUpgradeIndex` was a faithful port of hardhat-deploy v1's, which consults a `history` array first and falls back to a counter. rocketh has never written `history`: not in `@rocketh/proxy`, not in `@rocketh/diamond` (where the code sat commented out behind a TODO), and the field is not even on the `Deployment` type. So half of that function could not run, and its error messages told users to produce a field they had no way to produce.

  Removed rather than reinstated. `numDeployments` counts how many times the record has been written, which is exactly how many steps of the upgrade story have run, and therefore the index of the step due next. That leaves one comparison with three outcomes: more steps recorded than the index asked for means this step already ran, so hand back the existing deployment; exactly that many means it is due, so proceed; fewer means its predecessors have not run, so throw instead of applying an upgrade out of order. The old special cases for index `0` and `1` fall out of the same rule.

  Behaviour is unchanged for every record rocketh itself has written, including one with no `numDeployments`, which still counts as exactly one step and is what carries deployments recorded before that field was persisted.

  **One case does change, and it matters if you are migrating from hardhat-deploy v1.** A `deployments/` folder produced by v1 can contain a `history` array and no counter. v1 read `history` first, so it would treat such a record as several steps in; rocketh now reads the counter alone and treats it as one step. Concretely, with `history` of length 3 and no `numDeployments`: `upgradeIndex: 1` now proceeds where v1 skipped, which is harmless because the implementation-slot check downstream still refuses to send an upgrade the chain does not need; but `upgradeIndex: 2` or higher now THROWS where v1 skipped, which will stop the run. The record self-heals after any successful save (the counter starts being written), so the workaround is to add `"numDeployments": <history.length + 1>` to the affected file once.

  **The error messages changed**, and deliberately diverge from v1's wording. They used to say `expects Deployments history to exists, or numDeployments to be greater than 1`, naming a field rocketh does not maintain. They now name the index that was asked for, how many steps have actually run, and which step is missing. Matching v1 word for word is worth less than not misleading the reader.

  Worth knowing if you use `upgradeIndex`: combined with `numDeployments` now persisting, a sequence of steps kept in a deploy script is idempotent across runs for the first time. Previously `upgradeIndex: 1` would redo its upgrade on every run and `upgradeIndex: 2` or higher would throw, because the counter it depends on never survived to disk.

- Updated dependencies [916507d]
  - @rocketh/deploy@0.19.17
  - @rocketh/core@0.19.12
  - @rocketh/read-execute@0.19.12

## 0.19.22

### Patch Changes

- f7fe1c8: Vendor the Solidity sources of the bundled proxy artifacts, and generate the artifacts from them.

  The same gap `@rocketh/diamond` had, and larger. This package ships six prebuilt artifacts inherited from hardhat-deploy v1 (`EIP173Proxy`, `EIP173ProxyWithReceive`, `ERC1967Proxy`, `TransparentUpgradeableProxy`, `OptimizedTransparentUpgradeableProxy`, `ProxyAdmin`), its build never invokes a Solidity compiler, and exactly ONE `.sol` was vendored (`solc_0_8/ERC1967/Proxied.sol`, which is not even among the nineteen sources those artifacts were compiled from). A proxy deployed with a deterministic salt takes its ADDRESS from that bytecode, and nothing in the repository explained where the bytecode came from.

  All nineteen sources are now vendored as a frozen mirror of v1's tree under `hardhat-deploy-v1/` (added to the published `files`), including the OpenZeppelin sources v1 vendored in turn, and two checks pin the chain:

  - `test/bundled-artifact-provenance.test.ts` runs on every `pnpm test` with no compiler: each artifact embeds the full text of its sources (`metadata.useLiteralContent: true`), and the test asserts the repo's copies are byte-identical, that the compiler was the pinned `0.8.10+commit.fc410830`, and that the mirror holds exactly the union of the compilation units.
  - `pnpm --filter @rocketh/proxy verify:artifacts` recompiles and compares the generated files. All six reproduce BYTE FOR BYTE, `solcInput` and `solcInputHash` included. CI runs it through the root `pnpm verify:artifacts`.

  **Two compilation units, kept apart deliberately.** v1 compiled the EIP173 proxies separately from the OpenZeppelin-based ones, so those two groups carry different `solcInput` strings and different `solcInputHash` values. Merging them into one unit would compile to identical bytecode and still rewrite every artifact, so the split is stated as data in the generator and pinned by a test.

  The artifacts stay committed and are unmodified: they are byte-identical to what shipped before. Compiling them during `build` or during a release would let a different compiler, platform or path silently move every user's deterministic proxy addresses, and would put a Solidity toolchain in the job that holds the npm OIDC token.

- Updated dependencies [1973f4f]
- Updated dependencies [8547e39]
  - @rocketh/deploy@0.19.16
  - @rocketh/core@0.19.11
  - @rocketh/read-execute@0.19.11

## 0.19.21

### Patch Changes

- b34e921: Dependency maintenance: bump transitive runtime dependency ranges across all published packages. Notable bumps: `viem` ^2.48.2 → ^2.55.13, `abitype` ^1.2.4 → ^1.3.0, `commander` ^14.0.3 → ^15.0.0, `chalk` 5.6.2 → 6.0.0, `fs-extra` ^11.3.4 → ^11.4.0, `ldenv` ^0.5.0 → ^0.6.0, `hardhat` peer ^3.6.0 → ^3.12.0, `ipfs-gateway-emulator` 4.2.1-ipfs.2 → 5.0.0, `typedoc` ^0.28.19 → ^0.28.20. `zod` is kept on ^3.25.76 (not bumped to 4.x) so `hardhat-deploy` stays compatible with hardhat's zod 3 tree. Root dev tooling also bumped (`@types/node` 25 → 26, `nx` 22 → 23, `@changesets/cli` 2 → 3, `tsx`, `prettier`, `@vitest/coverage-v8`, `vitest`); `syncpack` removed (v15 has pnpm interop issues). No public API changes — typecheck, the 444-test suite, and a cache-busted build all pass.
- 17841b7: Comment only, no behaviour change: document why the `owner()` lookup in the proxy upgrade path swallows its error. An empty EIP-1967 admin slot does not mean "no owner" (an ERC173 proxy keeps it elsewhere), so the code asks the contract; that call legitimately fails for a proxy with no `owner()` at all, which is an ANSWER rather than an error worth surfacing. Nothing is hidden: `currentOwner` stays the zero address and the very next check turns that into either a clear refusal ("The Proxy belongs to no-one") or the no-admin path. This was the last of the empty catch blocks flagged by an external code review; the sibling one in `@rocketh/deploy` had already been removed.
- Updated dependencies [b34e921]
  - @rocketh/core@0.19.10
  - @rocketh/deploy@0.19.15
  - @rocketh/read-execute@0.19.10

## 0.19.20

### Patch Changes

- bf7ee52: `strictBytecodeMatch` is now documented and tested. It had neither: `documentation.md` never mentioned it, and no test named it, though it decides whether a re-run redeploys a contract (or upgrades a proxy). `documentation.md` gains a "When does a re-run REDEPLOY?" section covering it alongside `skipIfAlreadyDeployed` and `alwaysOverride`, and `@rocketh/deploy` gains `test/strict-bytecode-match.integration.test.ts`, which pins both directions on the SAME pair of artifacts (metadata-only difference: reused by default, redeployed under `strictBytecodeMatch: true`), verified by mutation.

  Named constants replace magic values at the two sites the feature relies on: the CBOR length-suffix arithmetic in `@rocketh/deploy` now explains what solc appends and why creation bytecode is not used, and `@rocketh/proxy`'s two raw storage-slot literals become `EIP1967_IMPLEMENTATION_SLOT` / `EIP1967_ADMIN_SLOT` with the EIP cited. No behaviour change.

- Updated dependencies [2ea36e3]
- Updated dependencies [c833bda]
- Updated dependencies [68fede3]
- Updated dependencies [bf7ee52]
  - @rocketh/deploy@0.19.14
  - @rocketh/core@0.19.9
  - @rocketh/read-execute@0.19.9

## 0.19.19

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

## 0.19.18

### Patch Changes

- Updated dependencies [09ea46d]
  - @rocketh/core@0.19.7
  - @rocketh/deploy@0.19.12
  - @rocketh/read-execute@0.19.7

## 0.19.17

### Patch Changes

- Updated dependencies [6456996]
  - @rocketh/core@0.19.6
  - @rocketh/deploy@0.19.11
  - @rocketh/read-execute@0.19.6

## 0.19.16

### Patch Changes

- Updated dependencies [7249888]
  - @rocketh/core@0.19.5
  - @rocketh/deploy@0.19.10
  - @rocketh/read-execute@0.19.5

## 0.19.15

### Patch Changes

- Updated dependencies [b2987d7]
  - @rocketh/core@0.19.4
  - @rocketh/deploy@0.19.9
  - @rocketh/read-execute@0.19.4

## 0.19.14

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.19.8

## 0.19.13

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.19.7

## 0.19.12

### Patch Changes

- 72df1c8: strictBytecodeMatch and alwaysOverride for diamond/router/proxies

## 0.19.11

### Patch Changes

- 56bcf8d: strictBytecodeMatch + alwaysOverride for proxies
- Updated dependencies [56bcf8d]
  - @rocketh/deploy@0.19.6

## 0.19.10

### Patch Changes

- Updated dependencies [034b3a7]
  - @rocketh/read-execute@0.19.3
  - @rocketh/core@0.19.3
  - @rocketh/deploy@0.19.5

## 0.19.9

### Patch Changes

- e06b151: fix cbor logic for bytecode matching + remove unecessary logs
- Updated dependencies [e06b151]
  - @rocketh/deploy@0.19.4

## 0.19.8

### Patch Changes

- Updated dependencies [c6fa24e]
  - @rocketh/core@0.19.2
  - @rocketh/deploy@0.19.3
  - @rocketh/read-execute@0.19.2

## 0.19.7

### Patch Changes

- packagesWithLogsEnabled + latest deps
- Updated dependencies
  - @rocketh/core@0.19.1
  - @rocketh/deploy@0.19.2
  - @rocketh/read-execute@0.19.1

## 0.19.6

### Patch Changes

- better Proxied + allow init only execution

## 0.19.5

### Patch Changes

- export artifacts files

## 0.19.4

### Patch Changes

- proxyDIsabled imply skipIfAlreadyDeployed: true

## 0.19.3

### Patch Changes

- fix export

## 0.19.2

### Patch Changes

- add 0.6 and 0.7 Proxied solidity utils

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
  - @rocketh/read-execute@0.19.0

## 0.18.7

### Patch Changes

- environment refactor for simpler extensions
- Updated dependencies
  - @rocketh/read-execute@0.18.5
  - @rocketh/deploy@0.18.4
  - @rocketh/core@0.18.4

## 0.18.6

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.18.4
  - @rocketh/core@0.18.3
  - @rocketh/deploy@0.18.3

## 0.18.5

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.18.3

## 0.18.4

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.2
  - @rocketh/deploy@0.18.2
  - @rocketh/read-execute@0.18.2

## 0.18.3

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.1
  - @rocketh/deploy@0.18.1
  - @rocketh/read-execute@0.18.1

## 0.18.2

### Patch Changes

- fix, it was resaving + removed abi

## 0.18.1

### Patch Changes

- fix

## 0.18.0

### Minor Changes

- inject default chains instead of getting it at runtime

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.0
  - @rocketh/deploy@0.18.0
  - @rocketh/read-execute@0.18.0

## 0.17.22

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.17.18

## 0.17.21

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.17.17
  - @rocketh/core@0.17.17
  - @rocketh/read-execute@0.17.17

## 0.17.20

### Patch Changes

- fix
- Updated dependencies
  - @rocketh/core@0.17.16
  - @rocketh/deploy@0.17.16
  - @rocketh/read-execute@0.17.16

## 0.17.19

### Patch Changes

- ignore supportsInterface conflit for ERC173Proxy
- Updated dependencies
  - @rocketh/core@0.17.15
  - @rocketh/deploy@0.17.15
  - @rocketh/read-execute@0.17.15

## 0.17.18

### Patch Changes

- latest deps
- Updated dependencies
  - @rocketh/read-execute@0.17.14
  - @rocketh/deploy@0.17.14
  - @rocketh/core@0.17.14

## 0.17.17

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.13
  - @rocketh/deploy@0.17.13
  - @rocketh/read-execute@0.17.13

## 0.17.16

### Patch Changes

- add metadata to packages
- Updated dependencies
  - @rocketh/core@0.17.12
  - @rocketh/deploy@0.17.12
  - @rocketh/read-execute@0.17.12

## 0.17.15

### Patch Changes

- add licenses
- Updated dependencies
  - @rocketh/core@0.17.11
  - @rocketh/deploy@0.17.11
  - @rocketh/read-execute@0.17.11

## 0.17.14

### Patch Changes

- update deps
- Updated dependencies
  - @rocketh/read-execute@0.17.10
  - @rocketh/deploy@0.17.10
  - @rocketh/core@0.17.10

## 0.17.13

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

## 0.17.12

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.8
  - @rocketh/deploy@0.17.8
  - @rocketh/read-execute@0.17.8

## 0.17.11

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.17.7

## 0.17.10

### Patch Changes

- Updated dependencies [f7a81d8]
  - @rocketh/core@0.17.7
  - @rocketh/deploy@0.17.7
  - @rocketh/read-execute@0.17.6

## 0.17.9

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.17.5

## 0.17.8

### Patch Changes

- Updated dependencies [f4431ed]
  - @rocketh/core@0.17.6
  - @rocketh/deploy@0.17.6
  - @rocketh/read-execute@0.17.4

## 0.17.7

### Patch Changes

- update deps and dev deps
- Updated dependencies
  - @rocketh/read-execute@0.17.3
  - @rocketh/deploy@0.17.5
  - @rocketh/core@0.17.5

## 0.17.6

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.4
  - @rocketh/deploy@0.17.4
  - @rocketh/read-execute@0.17.2

## 0.17.5

### Patch Changes

- 651abb7: fix passing of options
- Updated dependencies [b03146f]
- Updated dependencies [dc5aefe]
  - @rocketh/read-execute@0.17.2
  - @rocketh/deploy@0.17.3
  - @rocketh/core@0.17.3

## 0.17.4

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.17.2
  - @rocketh/core@0.17.2
  - @rocketh/read-execute@0.17.1

## 0.17.3

### Patch Changes

- 6642ece: reorg using @rocketh/core for utility functions and types (still reexported from rocketh)
- c574413: LinkedData vs LinkedDataProvided
- Updated dependencies [6642ece]
- Updated dependencies [c574413]
  - @rocketh/read-execute@0.17.1
  - @rocketh/deploy@0.17.1
  - @rocketh/core@0.17.1

## 0.17.2

### Patch Changes

- Updated dependencies
  - rocketh@0.17.1
  - @rocketh/deploy@0.17.0
  - @rocketh/read-execute@0.17.0

## 0.17.1

### Patch Changes

- fix export

## 0.17.0

### Minor Changes

- d67b01f: reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

### Patch Changes

- 58368b4: proxy implementation is now not deterministic by default add deterministicImplementation opetion field
- Updated dependencies [d67b01f]
  - @rocketh/read-execute@0.17.0
  - @rocketh/deploy@0.17.0
  - rocketh@0.17.0

## 0.17.0-next.1

### Patch Changes

- proxy implementation is now not deterministic by default add deterministicImplementation opetion field

## 0.17.0-next.0

### Minor Changes

- reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.17.0-next.0
  - @rocketh/deploy@0.17.0-next.0
  - rocketh@0.17.0-next.0

## 0.16.0

### Minor Changes

- add @roceth/core

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.16.0
  - @rocketh/deploy@0.16.0
  - @rocketh/read-execute@0.16.0

## 0.15.12

### Patch Changes

- Updated dependencies
  - rocketh@0.15.15
  - @rocketh/deploy@0.15.3
  - @rocketh/read-execute@0.15.3

## 0.15.11

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.15.3
  - @rocketh/deploy@0.15.3
  - rocketh@0.15.14

## 0.15.10

### Patch Changes

- Updated dependencies
  - rocketh@0.15.13
  - @rocketh/deploy@0.15.2
  - @rocketh/read-execute@0.15.2

## 0.15.9

### Patch Changes

- Updated dependencies
  - rocketh@0.15.12
  - @rocketh/deploy@0.15.2
  - @rocketh/read-execute@0.15.2

## 0.15.8

### Patch Changes

- Updated dependencies
  - rocketh@0.15.11
  - @rocketh/deploy@0.15.2
  - @rocketh/read-execute@0.15.2

## 0.15.7

### Patch Changes

- latest deps
- Updated dependencies
  - @rocketh/read-execute@0.15.2
  - @rocketh/deploy@0.15.2
  - rocketh@0.15.10

## 0.15.6

### Patch Changes

- Updated dependencies
  - rocketh@0.15.9
  - @rocketh/deploy@0.15.1
  - @rocketh/read-execute@0.15.1

## 0.15.5

### Patch Changes

- 02fea02: fix error msg
- Updated dependencies
  - rocketh@0.15.8
  - @rocketh/deploy@0.15.1
  - @rocketh/read-execute@0.15.1

## 0.15.4

### Patch Changes

- proxy: do not merge docs from proxy contract
- Updated dependencies
  - rocketh@0.15.7
  - @rocketh/deploy@0.15.1
  - @rocketh/read-execute@0.15.1

## 0.15.3

### Patch Changes

- proxy: add checkProxyAdmin and checkABIConflict + merge abi
- Updated dependencies
  - rocketh@0.15.6
  - @rocketh/deploy@0.15.1
  - @rocketh/read-execute@0.15.1

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

## 0.14.7-testing.1

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.15.0-testing.1
  - @rocketh/read-execute@0.14.3

## 0.14.7-testing.0

### Patch Changes

- Updated dependencies
  - @rocketh/deploy@0.15.0-testing.0
  - @rocketh/read-execute@0.14.3

## 0.14.6

### Patch Changes

- fix
- Updated dependencies
  - @rocketh/read-execute@0.14.3
  - @rocketh/deploy@0.14.2

## 0.14.5

### Patch Changes

- latest deps + fix eth_feeHistory
- Updated dependencies
  - @rocketh/read-execute@0.14.2
  - @rocketh/deploy@0.14.1

## 0.14.4

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.14.1

## 0.14.3

### Patch Changes

- use latest soldiity-proxy for router

## 0.14.2

### Patch Changes

- allow to specify custom proxy and router

## 0.14.1

### Patch Changes

- allow to specify args for proxy execute option

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

## 0.11.26

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

## 0.11.26-testing.8

### Patch Changes

- fix
- Updated dependencies
  - @rocketh/read-execute@0.11.23-testing.8
  - @rocketh/deploy@0.11.22-testing.8

## 0.11.26-testing.7

### Patch Changes

- Extra type generic
- Updated dependencies
  - @rocketh/read-execute@0.11.23-testing.7
  - @rocketh/deploy@0.11.22-testing.7

## 0.11.26-testing.6

### Patch Changes

- fix
- Updated dependencies
  - @rocketh/read-execute@0.11.23-testing.6
  - @rocketh/deploy@0.11.22-testing.6

## 0.11.26-testing.5

### Patch Changes

- allow to pass Extra date to environment
- Updated dependencies
  - @rocketh/read-execute@0.11.23-testing.5
  - @rocketh/deploy@0.11.22-testing.5

## 0.11.26-testing.4

### Patch Changes

- fix
- Updated dependencies
  - @rocketh/read-execute@0.11.23-testing.4
  - @rocketh/deploy@0.11.22-testing.4

## 0.11.26-testing.3

### Patch Changes

- signer protocols are specified via config
- Updated dependencies
  - @rocketh/read-execute@0.11.23-testing.3
  - @rocketh/deploy@0.11.22-testing.3

## 0.11.26-testing.2

### Patch Changes

- use hard deps
- Updated dependencies
  - @rocketh/read-execute@0.11.23-testing.2
  - @rocketh/deploy@0.11.22-testing.2

## 0.11.26-testing.1

### Patch Changes

- fixes
- Updated dependencies
  - @rocketh/read-execute@0.11.23-testing.1
  - @rocketh/deploy@0.11.22-testing.1

## 0.11.26-testing.0

### Patch Changes

- remove use of global, breakinmg change
- Updated dependencies
  - @rocketh/read-execute@0.11.23-testing.0
  - @rocketh/deploy@0.11.22-testing.0

## 0.11.25

### Patch Changes

- Updated dependencies
  - @rocketh/read-execute@0.11.22
  - rocketh@0.11.21
  - @rocketh/deploy@0.11.21

## 0.11.24

### Patch Changes

- Updated dependencies
  - rocketh@0.11.20
  - @rocketh/deploy@0.11.20
  - @rocketh/read-execute@0.11.21

## 0.11.23

### Patch Changes

- Updated dependencies
  - rocketh@0.11.19
  - @rocketh/deploy@0.11.19
  - @rocketh/read-execute@0.11.20

## 0.11.22

### Patch Changes

- fix

## 0.11.21

### Patch Changes

- fixes + add basescan
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

- add support for transparent proxies with shared proxy admin contract

## 0.11.6

### Patch Changes

- Updated dependencies [4426c7d]
  - @rocketh/deploy@0.11.5
  - rocketh@0.11.5
  - @rocketh/read-execute@0.11.5

## 0.11.5

### Patch Changes

- Updated dependencies
  - rocketh@0.11.4
  - @rocketh/deploy@0.11.4
  - @rocketh/read-execute@0.11.4

## 0.11.4

### Patch Changes

- 5c2e671: fix UUPS support

## 0.11.3

### Patch Changes

- 2431e8f: remove the use of context
- 3f39d5c: use hardhat-deloy v1 proxies + add proxyDisabled option
- Updated dependencies [2431e8f]
  - @rocketh/deploy@0.11.3
  - rocketh@0.11.3
  - @rocketh/read-execute@0.11.3

## 0.11.2

### Patch Changes

- d7dbbbd: support UUPS + ERC173WithReceive
- 858c537: add contract helper for proxy and diamond
- fee5656: upgradeIndex and numDeployments tracking
- e2dff3f: embed solidity-proxy artifacts
- Updated dependencies [f2959f3]
- Updated dependencies [169b618]
- Updated dependencies [aaba9cb]
- Updated dependencies [fee5656]
  - @rocketh/deploy@0.11.2
  - rocketh@0.11.2
  - @rocketh/read-execute@0.11.2

## 0.11.1

### Patch Changes

- release as v0.11.1
- Updated dependencies
  - rocketh@0.11.1
  - @rocketh/deploy@0.11.1
  - @rocketh/read-execute@0.11.1

## invalid-next.6

### Patch Changes

- Updated dependencies [9a9b3c4]
  - rocketh@invalid-next.5
  - @rocketh/deploy@invalid-next.5
  - @rocketh/read-execute@invalid-next.2

## invalid-next.5

### Patch Changes

- add @rocketh/read-execute
- Updated dependencies
  - @rocketh/deploy@invalid-next.4
  - rocketh@invalid-next.4
  - @rocketh/read-execute@invalid-next.1

## invalid-next.4

### Patch Changes

- fix dist path
- Updated dependencies
  - @rocketh/deploy@invalid-next.3
  - rocketh@invalid-next.3

## invalid-next.3

### Patch Changes

- proxy owner do the upgrade, regardless of account used to deploy the proxy

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

## 0.10.13

### Patch Changes

- fix chains import, no default export
- Updated dependencies
  - @rocketh/deploy@0.10.12
  - rocketh@0.10.18

## 0.10.12

### Patch Changes

- hardhat3-rocketh
- Updated dependencies
  - @rocketh/deploy@0.10.11
  - rocketh@0.10.17

## 0.10.11

### Patch Changes

- export dist
- Updated dependencies
  - @rocketh/deploy@0.10.10

## 0.10.10

### Patch Changes

- use tsx
- Updated dependencies
  - rocketh@0.10.16
  - @rocketh/deploy@0.10.9

## 0.10.9

### Patch Changes

- Updated dependencies
  - rocketh@0.10.15
  - @rocketh/deploy@0.10.8

## 0.10.8

### Patch Changes

- latest dependencies
- Updated dependencies
  - @rocketh/deploy@0.10.7
  - rocketh@0.10.14

## 0.10.7

### Patch Changes

- fix type + allow license specification for etherscan

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

- unnamedAccounts
- Updated dependencies
  - @rocketh/deploy@0.10.2
  - rocketh@0.10.10

## 0.10.1

### Patch Changes

- use pkgroll and @rocketh namespace
- Updated dependencies
  - @rocketh/deploy@0.10.1
  - rocketh@0.10.9
