# @rocketh/test-utils

## 0.2.8

### Patch Changes

- 6b60aad: Export `createMockPromptExecutor`, a fake prompt so extension-package tests can drive the INTERACTIVE unknown-signer path (`onUnknownSigner: 'ask'`) with no TTY. It answers scripted text prompts in order — a canned transaction hash to continue the run, `'cannot sign'` to defer, `{cancelled: true}` for an aborted prompt, an `Error` for a prompt with no terminal behind it — and RECORDS every request it received (`requests`, `textRequests`), so a test can assert what the human was asked, or that nobody was asked at all. OMITTING `textAnswers` entirely returns the CAPABILITY-ABSENT shape (no `promptText` method), which is what makes `'ask'` degrade to `'throw'` (ADR 0007); passing an EMPTY array is different, giving a text-capable prompt whose script is already exhausted.

  It is injected through `createTestEnvironment`'s existing run-parameter pass-through (`executionParams.promptExecutor`); no harness option was added, and no environment is fabricated — this is a prompt double only.

- 4813523: **Breaking:** remove the legacy `createMockEnvironment` (and its `MockEnvironmentOptions` / `MockEnvironmentResult` types), a fabricated `Environment` literal that reimplemented `broadcastExecution` / `broadcastDeployment` and therefore never executed the real environment module. Migration: use `createTestEnvironment` instead, and `await` it (it is async and returns a REAL rocketh environment wired to a mock provider). `createMockProvider`, `createMockArtifact`, `createMockArtifactWithLibrary` and `createExampleArtifact` are unchanged.
- 78d9966: Add `createTestEnvironment`, an async harness that constructs a REAL rocketh environment against a mock EIP-1193 provider — so tests exercise the actual `broadcastTransaction`, account-resolution, and impersonation paths instead of a parallel fake. Also exports a Map-backed `createMapDeploymentStore` and gives the default mock receipt a per-transaction `contractAddress`.
- 43b9545: Throw a first-class `UnknownSignerError` at the single broadcast choke point when a transaction's `from` is unsignable, replacing the opaque `cannot get signer for ...` error there. Because `deploy`, `execute`, `tx` and the proxy upgrade path all funnel through `broadcastTransaction`, the mechanism is transaction-agnostic: a Safe/multisig owner, a hardware wallet left unplugged or any account rocketh cannot sign for now surfaces the exact transaction to execute out-of-band. The decision is made on `addressSignability`, so `local`, `node` and `impersonated` accounts broadcast exactly as before.

  Add `onUnknownSigner: 'throw' | 'auto'`, resolved as execution param > chain config > default `'auto'`, mirroring how `autoImpersonate` is threaded. `'auto'` degrades to `'throw'` while no interactive resolver exists, so CI never prompts and never hangs. It is a POLICY, orthogonal to the `autoImpersonate` node-capability switch (which runs before the seam and is unchanged), and it deliberately has no `'impersonate'` value.

  Add `env.pushUnknownSignerPolicy(frame)` / `env.popUnknownSignerPolicy()` to the `Environment` interface: a scoped policy-frame stack that `@rocketh/unknown-signer`'s `catchUnknownSigner` will use. A frame changes what happens to an `unsignable` account only — it never turns a `local`, `node` or `impersonated` account into a throw.

  `@rocketh/test-utils` is a test-only touch: harness tests that broadcast from a named account the mock node did not list in `eth_accounts` now declare `nodeAccounts`, since such an account is (correctly) unsignable.

- e20634b: Name the function in an `UnknownSignerError` raised from a contract call. `execute` / `executeByName` now declare the call they encode through the new `options.contract` on `env.broadcastExecution` (`{method, args}`), and the seam at the broadcast choke point turns it into `contract: {name?, method, args}` on the error. A user whose proxy owner is a Safe therefore reads `contract: Proxy.upgradeTo("0x...")` and knows which function to run out-of-band, instead of only an address.

  `contract.name` is resolved on the error path through the environment's existing `fromAddressToNamedABIOrNull`, so it is absent when the target address matches no deployment (the message then falls back to `to`), and enrichment can never replace the error with an unrelated one.

  Non-contract paths are unchanged and leave `contract` unset: a plain `tx()`, a value transfer and a deploy have no function to name.

  `@rocketh/test-utils` is a type-only touch, mirroring the widened `broadcastExecution` signature.

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

## 0.2.7

### Patch Changes

- 09ea46d: Fix "cannot get signer" for named accounts declared with a private key, a signer protocol, or a checksummed address. `addressSigners` is now keyed by a lowercased address at both write sites and at the leftover-account filter, matching every reader (which already lowercased). `resolveAccountOrUndefined` now normalises like `resolveAccount`, so both resolvers agree. Address values exposed by `namedAccounts`/`unnamedAccounts` are unchanged.
- Updated dependencies [09ea46d]
  - @rocketh/core@0.19.7

## 0.2.6

### Patch Changes

- Updated dependencies [6456996]
  - @rocketh/core@0.19.6

## 0.2.5

### Patch Changes

- Updated dependencies [7249888]
  - @rocketh/core@0.19.5

## 0.2.4

### Patch Changes

- Updated dependencies [b2987d7]
  - @rocketh/core@0.19.4

## 0.2.3

### Patch Changes

- 034b3a7: retry config + read-execute use it for AbiDecodingZeroDataError errors on existing deployments
- Updated dependencies [034b3a7]
  - @rocketh/core@0.19.3

## 0.2.2

### Patch Changes

- Updated dependencies [c6fa24e]
  - @rocketh/core@0.19.2

## 0.2.1

### Patch Changes

- packagesWithLogsEnabled + latest deps
- Updated dependencies
  - @rocketh/core@0.19.1

## 0.2.0

### Minor Changes

- autoMine

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.19.0

## 0.1.4

### Patch Changes

- environment refactor for simpler extensions
- Updated dependencies
  - @rocketh/core@0.18.4

## 0.1.3

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.3

## 0.1.2

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.2

## 0.1.1

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.1

## 0.1.0

### Minor Changes

- inject default chains instead of getting it at runtime

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.0

## 0.0.10

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.17

## 0.0.9

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.16

## 0.0.8

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.15

## 0.0.7

### Patch Changes

- latest deps
- Updated dependencies
  - @rocketh/core@0.17.14

## 0.0.6

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.13

## 0.0.5

### Patch Changes

- add metadata to packages
- Updated dependencies
  - @rocketh/core@0.17.12

## 0.0.4

### Patch Changes

- add licenses
- Updated dependencies
  - @rocketh/core@0.17.11

## 0.0.3

### Patch Changes

- update deps
- Updated dependencies
  - @rocketh/core@0.17.10

## 0.0.2

### Patch Changes

- ef83a74: update deps
- ce1e98f: readme
- e01378e: publish src too
- Updated dependencies [8ef1407]
- Updated dependencies [ef83a74]
- Updated dependencies [ce1e98f]
- Updated dependencies [e01378e]
  - @rocketh/core@0.17.9
