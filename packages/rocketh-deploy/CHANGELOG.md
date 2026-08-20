# @rocketh/deploy

## 0.19.18

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

## 0.19.17

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
  - @rocketh/core@0.19.12

## 0.19.16

### Patch Changes

- 1973f4f: Fix the create3 "already deployed" check, which compared runtime code against creation code, and establish that a deterministic factory is the factory the chain config describes.

  **The create3 check never matched.** When a create3 address already holds code, the deploy path asks whether that code is the contract it was told to deploy. It answered by comparing what `eth_getCode` returned (RUNTIME code) against `transactionData.data` (CREATION code plus constructor arguments), which are different artifacts of different lengths, so the comparison failed for every contract and the deployment threw `code (length: 5) already deployed ... but is not the expected bytecode (length: 49)`.

  The branch is only reached when the local deployment record is missing but the chain still has the contract: a fresh clone with no `deployments/` folder, a reset, a lost machine. That is the recovery case an idempotent deploy script exists to survive, so the one path that had to recognise its own work was the one that could not.

  It now compares runtime code with runtime code, against the artifact's `deployedBytecode`. The default comparison is the trailing CBOR METADATA BLOB rather than the whole code, because an `immutable` is written into the runtime code at construction time: the artifact carries zeros where the deployed contract carries values, so comparing the full code verbatim would call any contract with immutables a stranger. The metadata blob is a hash of the source and the compiler settings, including which contract in the file was compiled, so it identifies the contract while ignoring what the constructor wrote. `strictBytecodeMatch: true` asks for the verbatim comparison, and bytecode with no metadata blob falls back to it.

  The check itself is worth keeping and only create3 needs it: a create2 address is derived from the creation bytecode, so code at the computed address can only have come from that bytecode, while a create3 address is derived from the deployer and the salt alone. Two contracts deployed with one salt therefore collide, and the error now says that is what happened and what to do about it.

  **A factory address holding code is not proof of the right factory.** Every deterministic address this package computes is derived from the assumption that the configured factory address holds the factory the chain config describes, and the only thing previously established was that something had code there. The factory address, its deployer and its pre-signed deployment transaction are all user-supplied chain configuration, and a fork or an L2 can have anything at a given address.

  - **create2**: when code is already at the factory address, it is compared against the runtime code the config's own `signedTx` creates. That expectation is derived, not hardcoded: the canonical factory's twelve-byte constructor returns a fixed slice of its own creation code, so the runtime code is readable from the configuration. A chain that configures a different factory is checked against ITS factory, and a factory whose constructor computes its runtime code cannot be predicted without an EVM, so the check skips rather than guesses.
  - **create3**: the existing "is this the address this bytecode and salt produce" assertion now runs whether or not the factory is already deployed. It used to run only on the branch that DEPLOYS the factory, which is the branch where being wrong fails visibly anyway. On the other branch, a wrong address means `deployDeterministic` calls go to whatever contract sits there while rocketh records addresses from a formula that does not describe it. The create2 factory address it needs is read from configuration directly rather than through `getCreate2Factory`, since verifying a configuration must not deploy anything.

- Updated dependencies [8547e39]
  - @rocketh/core@0.19.11

## 0.19.15

### Patch Changes

- b34e921: Dependency maintenance: bump transitive runtime dependency ranges across all published packages. Notable bumps: `viem` ^2.48.2 → ^2.55.13, `abitype` ^1.2.4 → ^1.3.0, `commander` ^14.0.3 → ^15.0.0, `chalk` 5.6.2 → 6.0.0, `fs-extra` ^11.3.4 → ^11.4.0, `ldenv` ^0.5.0 → ^0.6.0, `hardhat` peer ^3.6.0 → ^3.12.0, `ipfs-gateway-emulator` 4.2.1-ipfs.2 → 5.0.0, `typedoc` ^0.28.19 → ^0.28.20. `zod` is kept on ^3.25.76 (not bumped to 4.x) so `hardhat-deploy` stays compatible with hardhat's zod 3 tree. Root dev tooling also bumped (`@types/node` 25 → 26, `nx` 22 → 23, `@changesets/cli` 2 → 3, `tsx`, `prettier`, `@vitest/coverage-v8`, `vitest`); `syncpack` removed (v15 has pnpm interop issues). No public API changes — typecheck, the 444-test suite, and a cache-busted build all pass.
- Updated dependencies [b34e921]
  - @rocketh/core@0.19.10

## 0.19.14

### Patch Changes

- 2ea36e3: **Fix two bugs in the CBOR metadata stripping that decides whether a re-run redeploys.** Both affect the default (non-strict) comparison, and therefore also whether `@rocketh/proxy` upgrades a proxy.
  1. **The two-byte length suffix was not removed.** solc terminates the metadata blob with a two-byte big-endian length of the blob, NOT counting those two bytes, so the removal is `length + 2` bytes. Stripping only `length` bytes cut the suffix but left the first two bytes of the blob itself in the comparison. That did not bite in practice only because those leading bytes are the CBOR header, which is usually identical between compilations; where it differed, an unchanged contract was redeployed.
  2. **The declared length was trusted without validation, and applied to both sides.** Any bytecode ends in some two bytes, and reading them as a length is only meaningful when a blob that size could actually be there. A short runtime bytecode (a stub, a minimal proxy, a test fixture) routinely ends in bytes that parse as tens of thousands; stripping that many characters silently produced an EMPTY string on both sides, so every such contract compared equal to every other one and a genuinely changed contract was skipped as already deployed — the new code never reaching the chain. An implausible length now falls back to the creation-bytecode comparison instead. Relatedly, each side is now stripped by ITS OWN declared length: metadata length varies with what solc puts in the blob (an absolute source path is enough), so applying one side's length to both cut at a different offset in each and reported differences that did not exist.

  All three failure modes are pinned by tests, verified by mutation.

- bf7ee52: `strictBytecodeMatch` is now documented and tested. It had neither: `documentation.md` never mentioned it, and no test named it, though it decides whether a re-run redeploys a contract (or upgrades a proxy). `documentation.md` gains a "When does a re-run REDEPLOY?" section covering it alongside `skipIfAlreadyDeployed` and `alwaysOverride`, and `@rocketh/deploy` gains `test/strict-bytecode-match.integration.test.ts`, which pins both directions on the SAME pair of artifacts (metadata-only difference: reused by default, redeployed under `strictBytecodeMatch: true`), verified by mutation.

  Named constants replace magic values at the two sites the feature relies on: the CBOR length-suffix arithmetic in `@rocketh/deploy` now explains what solc appends and why creation bytecode is not used, and `@rocketh/proxy`'s two raw storage-slot literals become `EIP1967_IMPLEMENTATION_SLOT` / `EIP1967_ADMIN_SLOT` with the EIP cited. No behaviour change.

- Updated dependencies [c833bda]
  - @rocketh/core@0.19.9

## 0.19.13

### Patch Changes

- 2bacf9a: Let a deploy from an unsignable deployer reach the unknown-signer seam. `deploy` performed its own `env.addressSigners[address]` lookup and threw an opaque `cannot get signer for ...` before the transaction was built, so such a deploy died there instead of reaching the single `broadcastTransaction` choke point. It now surfaces the same `UnknownSignerError` (carrying the transaction to execute out-of-band) that a raw tx or an `execute` does, under the same effective `onUnknownSigner` policy. A signable deployer is unaffected, including the deterministic create2/create3 paths.

  The removed lookup existed only to feed a `signer` argument to the module-private create2/create3 factory helpers, which never read it (every transaction they send goes through `env.broadcastExecution`, which resolves the signer at the choke point). That unused parameter is removed too; no public signature changes.

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

## 0.19.12

### Patch Changes

- Updated dependencies [09ea46d]
  - @rocketh/core@0.19.7

## 0.19.11

### Patch Changes

- Updated dependencies [6456996]
  - @rocketh/core@0.19.6

## 0.19.10

### Patch Changes

- Updated dependencies [7249888]
  - @rocketh/core@0.19.5

## 0.19.9

### Patch Changes

- Updated dependencies [b2987d7]
  - @rocketh/core@0.19.4

## 0.19.8

### Patch Changes

- Wire up value on the deployment transaction so payable constructors receive msg.value

## 0.19.7

### Patch Changes

- log when reusing an unchanged deployment

## 0.19.6

### Patch Changes

- 56bcf8d: strictBytecodeMatch + alwaysOverride for proxies

## 0.19.5

### Patch Changes

- Updated dependencies [034b3a7]
  - @rocketh/core@0.19.3

## 0.19.4

### Patch Changes

- e06b151: fix cbor logic for bytecode matching + remove unecessary logs

## 0.19.3

### Patch Changes

- Updated dependencies [c6fa24e]
  - @rocketh/core@0.19.2

## 0.19.2

### Patch Changes

- packagesWithLogsEnabled + latest deps
- Updated dependencies
  - @rocketh/core@0.19.1

## 0.19.1

### Patch Changes

- fix

## 0.19.0

### Minor Changes

- autoMine

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.19.0

## 0.18.4

### Patch Changes

- environment refactor for simpler extensions
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

## 0.17.18

### Patch Changes

- fix auto-mine

## 0.17.17

### Patch Changes

- fix address resolution
- Updated dependencies
  - @rocketh/core@0.17.17

## 0.17.16

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.16

## 0.17.15

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.15

## 0.17.14

### Patch Changes

- latest deps
- Updated dependencies
  - @rocketh/core@0.17.14

## 0.17.13

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.13

## 0.17.12

### Patch Changes

- add metadata to packages
- Updated dependencies
  - @rocketh/core@0.17.12

## 0.17.11

### Patch Changes

- add licenses
- Updated dependencies
  - @rocketh/core@0.17.11

## 0.17.10

### Patch Changes

- update deps
- Updated dependencies
  - @rocketh/core@0.17.10

## 0.17.9

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

## 0.17.8

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.8

## 0.17.7

### Patch Changes

- Updated dependencies [f7a81d8]
  - @rocketh/core@0.17.7

## 0.17.6

### Patch Changes

- Updated dependencies [f4431ed]
  - @rocketh/core@0.17.6

## 0.17.5

### Patch Changes

- update deps and dev deps
- Updated dependencies
  - @rocketh/core@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.4

## 0.17.3

### Patch Changes

- b03146f: fix message + allow it everywhere
- dc5aefe: allow for custom deployment message
- Updated dependencies [dc5aefe]
  - @rocketh/core@0.17.3

## 0.17.2

### Patch Changes

- add ability to add message to simple tx broadcast
- Updated dependencies
  - @rocketh/core@0.17.2

## 0.17.1

### Patch Changes

- 6642ece: reorg using @rocketh/core for utility functions and types (still reexported from rocketh)
- c574413: LinkedData vs LinkedDataProvided
- Updated dependencies [6642ece]
  - @rocketh/core@0.17.1

## 0.17.0

### Minor Changes

- d67b01f: reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

## 0.17.0-next.0

### Minor Changes

- reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

## 0.16.0

### Minor Changes

- add @roceth/core

## 0.15.3

### Patch Changes

- auto-mine + faster import by caching

## 0.15.2

### Patch Changes

- latest deps

## 0.15.1

### Patch Changes

- fix

## 0.15.0

### Minor Changes

- 851378e: revamp the settings to be allowed to configure per chain as well as per target

### Patch Changes

- 691d296: fixes
- 03f2406: fixes
- 68151ae: rname target to environment
- e2dbd6f: revamp of types and resolution
- e260c6d: fix

## 0.15.0-testing.5

### Patch Changes

- fixes

## 0.15.0-testing.4

### Patch Changes

- rname target to environment

## 0.15.0-testing.3

### Patch Changes

- fix

## 0.15.0-testing.2

### Patch Changes

- revamp of types and resolution

## 0.15.0-testing.1

### Patch Changes

- fixes

## 0.15.0-testing.0

### Minor Changes

- revamp the settings to be allowed to configure per chain as well as per target

## 0.14.2

### Patch Changes

- fix

## 0.14.1

### Patch Changes

- latest deps + fix eth_feeHistory

## 0.14.0

### Minor Changes

- setup for both deployScript and loadAndExecuteDeployments

## 0.13.0

### Minor Changes

- use env function for extended functions

## 0.12.1

### Patch Changes

- Merge branch 'feat/create3-support'

## 0.12.0

### Minor Changes

- switch to setup function

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
- 4d37f14: remove use of global, breakinmg change

## 0.11.22-testing.8

### Patch Changes

- fix

## 0.11.22-testing.7

### Patch Changes

- Extra type generic

## 0.11.22-testing.6

### Patch Changes

- fix

## 0.11.22-testing.5

### Patch Changes

- allow to pass Extra date to environment

## 0.11.22-testing.4

### Patch Changes

- fix

## 0.11.22-testing.3

### Patch Changes

- signer protocols are specified via config

## 0.11.22-testing.2

### Patch Changes

- use hard deps

## 0.11.22-testing.1

### Patch Changes

- fixes

## 0.11.22-testing.0

### Patch Changes

- remove use of global, breakinmg change

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

- LinkedData + remove auto-json-convertion
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

- fixes
- Updated dependencies
  - rocketh@0.11.6

## 0.11.5

### Patch Changes

- 4426c7d: remove .json config file + support custom deterministic deployment factory
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

- f2959f3: display <no-name>
- aaba9cb: allow to not save deployment + use it for diamond unamed artifact execution
- fee5656: upgradeIndex and numDeployments tracking
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

- export dist

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

- rocketh-deploy: add libraries support

## 0.10.5

### Patch Changes

- Updated dependencies
  - rocketh@0.10.13

## 0.10.4

### Patch Changes

- Updated dependencies
  - rocketh@0.10.12

## 0.10.3

### Patch Changes

- Updated dependencies
  - rocketh@0.10.11

## 0.10.2

### Patch Changes

- unnamedAccounts
- Updated dependencies
  - rocketh@0.10.10

## 0.10.1

### Patch Changes

- use pkgroll and @rocketh namespace
- Updated dependencies
  - rocketh@0.10.9
