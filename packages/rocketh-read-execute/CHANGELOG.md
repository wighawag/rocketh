# @rocketh/deploy

## 0.20.0

### Minor Changes

- 8ea2a76: `execute` guards gain `equals`, sugar over `satisfied` that compares the value the way its ABI type says the value means (`address` and `bytesN` fold case, `string` does not, a bigint never coerces against a number, arrays and tuples compare elementwise), plus `output` to select one of the read function's declared outputs by name or position. The evaluation record now reports the whole value read, the selected value and the expected one.
- 3e56ae0: A skipped guarded step now says so, on one line, through the environment's user-message channel (`env.showMessage`, the channel `catchUnknownSigner` already prints through): which step was skipped, which contract was read and how (a view function plus its arguments, or a slot plus the interpretation the word was decoded under), the value that came back, the selected output where one was selected, and the expected value where one was given. A skip is otherwise the only outcome with no trace at all, so a run whose guard is subtly wrong looked exactly like one where the work was already done. Everything reported is read off the evaluation record, so the line and the returned record cannot disagree. The path that sends stays silent: it already leaves a transaction behind.
- 468db2f: A guard that cannot produce a verdict now fails the run instead of being mistaken for "not satisfied": a read that reverts, a target that returns no data once the inherited retry is exhausted, a slot that cannot be read or decoded, and a `satisfied` predicate that throws all abort before the transaction is built, so nothing is broadcast. The failure surfaces as a `GuardEvaluationError` (new, on the `@rocketh/read-execute/errors` subpath) naming the guard, the function or slot it reads and the target it reads it on, and keeping the underlying failure whole on `cause`.
- 2bc550a: `execute` and `executeByName` accept an optional `guard`, a declared read that answers whether the call is still needed. `kind: 'call'` reads a view function on a target (another contract by default, since that is where the effect is usually observable) and judges the decoded value with `satisfied`. A satisfied guard skips the call: no transaction is built and nothing is broadcast. The evaluation record is returned on both paths, and `evaluateGuard(env)` evaluates a guard standalone without executing anything. Unguarded calls keep their exact previous signature. One type-level correction ships with this: the exported aliases `ExecuteFunction`, `ExecuteFunctionByName` and `TxFunction` said they resolved to `Promise<EIP1193DATA>`, while the implementations have always returned a receipt. They now say `Promise<EIP1193TransactionReceipt>`. Runtime behaviour is unchanged, but code annotated with those aliases rather than with `ReturnType<typeof execute>` will need updating.
- e5e14bd: Add the `storage` guard kind to `execute`: read a slot on any contract (`kind: 'storage'`, `on`, `slot`, `as`), decode the word under a declared interpretation from a closed set (`address`, `bytes32`, `uint256`, `bool`), and compare it under the same ABI-type rule a getter's return goes through. This is what expresses the commonest upgrade topology there is, where the proxy exposes no getter and the effect is observable only in its EIP-1967 implementation slot.

### Patch Changes

- Updated dependencies [6a274cb]
- Updated dependencies [d479e65]
- Updated dependencies [ef77a3d]
  - @rocketh/core@0.20.0

## 0.19.13

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

## 0.19.12

### Patch Changes

- Updated dependencies [916507d]
  - @rocketh/core@0.19.12

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

- 68fede3: `read`'s retry path no longer lets an ABI-conflict throw mask the decode error it is handling. `fromAddressToNamedABIOrNull` returns `null` for "no match" but THROWS `ABI conflict: ...` when two deployments registered at one address share a function selector, and the retry path calls it from inside the `AbiDecodingZeroDataError` catch. A caller reading such an address now sees the decode failure they need, not a bookkeeping complaint about ABI registration. A conflict is treated exactly like no match: the original error is rethrown.
- Updated dependencies [c833bda]
  - @rocketh/core@0.19.9

## 0.19.8

### Patch Changes

- e20634b: Name the function in an `UnknownSignerError` raised from a contract call. `execute` / `executeByName` now declare the call they encode through the new `options.contract` on `env.broadcastExecution` (`{method, args}`), and the seam at the broadcast choke point turns it into `contract: {name?, method, args}` on the error. A user whose proxy owner is a Safe therefore reads `contract: Proxy.upgradeTo("0x...")` and knows which function to run out-of-band, instead of only an address.

  `contract.name` is resolved on the error path through the environment's existing `fromAddressToNamedABIOrNull`, so it is absent when the target address matches no deployment (the message then falls back to `to`), and enrichment can never replace the error with an unrelated one.

  Non-contract paths are unchanged and leave `contract` unset: a plain `tx()`, a value transfer and a deploy have no function to name.

  `@rocketh/test-utils` is a type-only touch, mirroring the widened `broadcastExecution` signature.

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

- 034b3a7: retry config + read-execute use it for AbiDecodingZeroDataError errors on existing deployments
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

## 0.18.5

### Patch Changes

- environment refactor for simpler extensions
- Updated dependencies
  - @rocketh/core@0.18.4

## 0.18.4

### Patch Changes

- add confirmationsRequired option
- Updated dependencies
  - @rocketh/core@0.18.3

## 0.18.3

### Patch Changes

- fix(read-execute): add missing block tag to eth_call

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

## 0.17.17

### Patch Changes

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
- 7c42de1: fixes types
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

- export type so viem is not needed for inference

## 0.17.6

### Patch Changes

- Updated dependencies [f7a81d8]
  - @rocketh/core@0.17.7

## 0.17.5

### Patch Changes

- Fixed typo in readByName function

## 0.17.4

### Patch Changes

- Updated dependencies [f4431ed]
  - @rocketh/core@0.17.6

## 0.17.3

### Patch Changes

- update deps and dev deps
- Updated dependencies
  - @rocketh/core@0.17.5

## 0.17.2

### Patch Changes

- b03146f: fix message + allow it everywhere

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

## 0.15.3

### Patch Changes

- auto-mine + faster import by caching

## 0.15.2

### Patch Changes

- latest deps

## 0.15.1

### Patch Changes

- detect no sigenr

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

## 0.14.3

### Patch Changes

- fix

## 0.14.2

### Patch Changes

- latest deps + fix eth_feeHistory

## 0.14.1

### Patch Changes

- return receipt rather than txHash for execute function

## 0.14.0

### Minor Changes

- setup for both deployScript and loadAndExecuteDeployments

## 0.13.0

### Minor Changes

- use env function for extended functions

## 0.12.0

### Minor Changes

- switch to setup function

## 0.11.23

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

## 0.11.23-testing.8

### Patch Changes

- fix

## 0.11.23-testing.7

### Patch Changes

- Extra type generic

## 0.11.23-testing.6

### Patch Changes

- fix

## 0.11.23-testing.5

### Patch Changes

- allow to pass Extra date to environment

## 0.11.23-testing.4

### Patch Changes

- fix

## 0.11.23-testing.3

### Patch Changes

- signer protocols are specified via config

## 0.11.23-testing.2

### Patch Changes

- use hard deps

## 0.11.23-testing.1

### Patch Changes

- fixes

## 0.11.23-testing.0

### Patch Changes

- remove use of global, breakinmg change

## 0.11.22

### Patch Changes

- allow minimal deployment info for read/execute
- Updated dependencies
  - rocketh@0.11.21

## 0.11.21

### Patch Changes

- Updated dependencies
  - rocketh@0.11.20

## 0.11.20

### Patch Changes

- Updated dependencies
  - rocketh@0.11.19

## 0.11.19

### Patch Changes

- Updated dependencies
  - rocketh@0.11.18

## 0.11.18

### Patch Changes

- Updated dependencies
  - rocketh@0.11.17

## 0.11.17

### Patch Changes

- Updated dependencies
  - rocketh@0.11.16

## 0.11.16

### Patch Changes

- add tx function to read-execute

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

- fixes
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

## invalid-next.2

### Patch Changes

- Updated dependencies [9a9b3c4]
  - rocketh@invalid-next.5

## invalid-next.1

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
