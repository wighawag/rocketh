# @rocketh/test-utils

## 0.2.12

### Patch Changes

- 6c7aee3: Prepare transactions that rocketh signs itself, and stop assuming every provider implements `eth_accounts`.

  **Locally-signed transactions are now prepared before signing.** A `signerOnly` account (what the `privateKey` protocol and hardware/HSM protocols return) signs without the node, so nothing was filling `nonce`, `gas` or the fees: they were signed as zero and any correct node refused the result with `intrinsic gas too low: have 0`. `broadcastTransaction` now fills them (`eth_getTransactionCount` at `pending`, `eth_feeHistory`/`eth_gasPrice` via the estimator the executor already uses, then `eth_estimateGas`) before handing the transaction to the signer.

  The two 1559 fields are resolved together rather than independently, because `maxPriorityFeePerGas > maxFeePerGas` is an invalid pair that nodes reject, and filling either one in isolation can produce it. The filled cap also carries headroom (the base-fee component is doubled, as viem multiplies it by 1.2): a cap of exactly "next block's base fee plus a tip" strands the transaction the moment it misses that block and the base fee steps up.

  `UnsuccessfulTransactionError` is exported from `rocketh`, so a caller can discriminate on the type rather than on message text. It carries the `hash` and the `receipt`.

  The `remote` and `wallet` variants are deliberately left untouched, which is the line viem draws in `sendTransaction`: a `json-rpc` account is passed to `eth_sendTransaction` as-is because the node or wallet is authoritative and is defined to fill what the caller omitted, while a `local` account goes through `prepareTransactionRequest` first. Preparing the json-rpc side would be worse than redundant: handing a wallet our own gas limit takes the estimate out of the user's hands, and an estimate taken at another block can be wrong by the time they confirm. This is done with plain EIP-1193 calls rather than by importing viem, because `rocketh` depends only on `eip-1193` (ADR-0002); viem stays in the optional `@rocketh/viem` extension.

  **An index-based account that the node cannot supply now says so usefully.** A provider that answers `eth_accounts` with `[]` (most public RPC endpoints hold no keys) is, to the user, the same situation as one that rejects the call, and now gets the same actionable message naming the account and suggesting `privateKey:0x...`, instead of the generic "cannot get account".

  **`eth_accounts` is no longer required.** It was called unconditionally when building the environment, before knowing whether any named account was index-based, so execution-only nodes and public RPC endpoints that reject the method were unusable even for configs that name accounts by address or signer protocol. The failure is now remembered and re-raised, with its cause attached, only if an index-based account (`{default: 0}`) actually has to be resolved.

  **A reverted transaction is no longer recorded as a success.** `waitForTransaction` is the single choke point every normal-path receipt passes through, and until now only the pasted-transaction path looked at `receipt.status` at all. A deployment whose transaction reverted (out of gas, a throwing constructor, a failed require) was recorded with its address, so a proxy could be saved over an implementation that was never created and the failure surfaced much later as a call returning `0x`. Such a receipt now raises, and nothing is saved.

  This is a behaviour break rather than a fix to something broken in all cases, hence `minor`. Two consequences worth knowing:

  - A receipt with NO `status` field is also refused, since rocketh will not record what it cannot prove. Pre-Byzantium chains and some node mocks omit it. The message distinguishes this case from an actual revert, so nobody is sent looking for a bug that is not there.
  - Transaction RECOVERY treats a resolved-but-unsuccessful transaction as dealt with: the pending entry is dropped and the shortened list persisted, then the failure is reported. Leaving it would make every later run replay the same reverted hash and fail identically, with no exit but hand-editing `.pending_transactions.json`. A recovery that fails for any OTHER reason still keeps its entry, because that transaction may yet resolve.

  **`displayTransaction` no longer crashes on a `null` fee field.** It branched on `'maxFeePerGas' in transaction`; nodes differ on whether an inapplicable field is omitted or sent as `null`, and on the latter a legacy transaction took the 1559 branch and died on `BigInt(null)`, so a cosmetic log line could take down a deploy run.

  `@rocketh/test-utils`' harness provider gained an `eth_feeHistory` default (one reward entry per requested percentile, as the spec requires), which locally-signed broadcasts now reach.

- Updated dependencies [6c7aee3]
  - rocketh@0.19.16

## 0.2.11

### Patch Changes

- Updated dependencies [d41ff21]
  - rocketh@0.19.15

## 0.2.10

### Patch Changes

- b34e921: Dependency maintenance: bump transitive runtime dependency ranges across all published packages. Notable bumps: `viem` ^2.48.2 → ^2.55.13, `abitype` ^1.2.4 → ^1.3.0, `commander` ^14.0.3 → ^15.0.0, `chalk` 5.6.2 → 6.0.0, `fs-extra` ^11.3.4 → ^11.4.0, `ldenv` ^0.5.0 → ^0.6.0, `hardhat` peer ^3.6.0 → ^3.12.0, `ipfs-gateway-emulator` 4.2.1-ipfs.2 → 5.0.0, `typedoc` ^0.28.19 → ^0.28.20. `zod` is kept on ^3.25.76 (not bumped to 4.x) so `hardhat-deploy` stays compatible with hardhat's zod 3 tree. Root dev tooling also bumped (`@types/node` 25 → 26, `nx` 22 → 23, `@changesets/cli` 2 → 3, `tsx`, `prettier`, `@vitest/coverage-v8`, `vitest`); `syncpack` removed (v15 has pnpm interop issues). No public API changes — typecheck, the 444-test suite, and a cache-busted build all pass.
- Updated dependencies [b34e921]
  - @rocketh/core@0.19.10
  - rocketh@0.19.14

## 0.2.9

### Patch Changes

- 4904d9a: `createExampleArtifact` now varies the BYTECODE per template, not just the ABI. Templates that differed only in their ABI produced identical bytecode, so every deterministic (create2) deployment of them resolved to the SAME address: the multi-facet diamond example documented a diamond whose three differently-named facets were one contract, with three cuts pointing at one address and every assertion still green. Each template now carries a distinct `bytecode` and `deployedBytecode`. Note this CHANGES the addresses these example artifacts deploy to, so a test asserting a hard-coded create2 address for one of them will need updating.
- e34ac95: Export `createNodeHeldEnvironment`, plus `STANDARD_NAMED_ACCOUNTS` and `NODE_HELD_ACCOUNTS`: the commonest test setup there is (three named accounts declared as bare addresses, all held by the node, so everything is signable). The same fixture triple was being redeclared verbatim in `@rocketh/deploy`'s, `@rocketh/proxy`'s and `@rocketh/diamond`'s suites. It is a PRESET, not a second builder: it takes no options and returns exactly what `createTestEnvironment` returns, so anything further from the default should keep calling `createTestEnvironment` directly and say so.
- Updated dependencies [6ea32f1]
- Updated dependencies [1a583b2]
- Updated dependencies [c833bda]
  - rocketh@0.19.13
  - @rocketh/core@0.19.9

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
