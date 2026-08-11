# @rocketh/deploy

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
