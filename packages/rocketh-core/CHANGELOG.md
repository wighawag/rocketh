# @rocketh/core

## 0.19.10

### Patch Changes

- b34e921: Dependency maintenance: bump transitive runtime dependency ranges across all published packages. Notable bumps: `viem` ^2.48.2 → ^2.55.13, `abitype` ^1.2.4 → ^1.3.0, `commander` ^14.0.3 → ^15.0.0, `chalk` 5.6.2 → 6.0.0, `fs-extra` ^11.3.4 → ^11.4.0, `ldenv` ^0.5.0 → ^0.6.0, `hardhat` peer ^3.6.0 → ^3.12.0, `ipfs-gateway-emulator` 4.2.1-ipfs.2 → 5.0.0, `typedoc` ^0.28.19 → ^0.28.20. `zod` is kept on ^3.25.76 (not bumped to 4.x) so `hardhat-deploy` stays compatible with hardhat's zod 3 tree. Root dev tooling also bumped (`@types/node` 25 → 26, `nx` 22 → 23, `@changesets/cli` 2 → 3, `tsx`, `prettier`, `@vitest/coverage-v8`, `vitest`); `syncpack` removed (v15 has pnpm interop issues). No public API changes — typecheck, the 444-test suite, and a cache-busted build all pass.

## 0.19.9

### Patch Changes

- c833bda: Message wording: the auto-impersonation note said the node "did not accept it (only a fork or dev node, such as anvil or hardhat, implements that RPC)", which misleads a user who IS on a fork. The same outcome also covers a node that implements the RPC and REFUSED the account, which the suite explicitly tests. The message now says both, matching what the JSDoc already said.

## 0.19.8

### Patch Changes

- 11ab414: Expose `env.addressSignability`, a four-state (`local` / `node` / `impersonated` / `unsignable`) classification of whether rocketh can sign for a given address. Computed after auto-impersonation runs, keyed by lowercased address (like `addressSigners`), returns `'unsignable'` for an address never seen during setup. Additive — no existing behaviour changes and no transaction routing changes.

  Also narrows the auto-impersonation candidate set to named accounts whose resolved signer is `remote` (matching the helper's own doc comment). Before, `hardhat_impersonateAccount` was also sent for `signerOnly` accounts (privateKey, hardware, protocol) that already sign locally, wasting RPC. Dev/fork-only, since `autoImpersonate` is enabled only on simulated networks; the accepted risk is that a script calling `eth_sendTransaction` directly from a privateKey-derived named account on a dev node (which worked by accident) will stop working — those calls should now go through `broadcastExecution`.

- a5db88c: Add the `'ask'` unknown-signer policy and the interactive resolver at the broadcast seam.

  `onUnknownSigner` is now `'throw' | 'ask' | 'auto'`, and `'auto'` (still the default) is CAPABILITY-AWARE: it resolves to `'ask'` where the run can ask a human for text (`env.canPromptForText()`, i.e. a `PromptExecutor` implementing `promptText`) and to `'throw'` where it cannot. Capability is a CEILING, so an explicit `'ask'` also degrades to `'throw'` without a prompt. `@rocketh/node` now supplies its `promptText` ONLY when stdin is a terminal, so a CI run (whose stdin is not) simply has no text capability and takes the throw path: it never prompts and never hangs. The gate lives in the runtime rather than in `canPromptForText()`, which stays pure method presence (ADR 0007), because `prompts` asked a question with no terminal behind it never settles and never rejects (measured in `docs/spikes/ask-policy-interactive-resolver/prompts-non-tty-behaviour.md`).

  Under `'ask'`, a transaction whose `from` is unsignable PAUSES: rocketh presents the exact transaction (the undegraded `UnknownSignerError` message), the user executes it out-of-band on their Safe and pastes the resulting transaction hash, and the run CONTINUES through the same pending-transaction pipeline a normal broadcast uses, returning a real receipt with no send RPC attempted. Because the resolver resolves instead of throwing, a multi-step governed action pauses at each unsignable step and completes in ONE run. The pasted hash is registered with the transaction-hash tracker, so gas reporting does not omit an externally-executed transaction. A hash this node has never heard of is looked up for a bounded number of rounds and then reported as NOT FOUND rather than polled for ever, and a receipt without a successful status fails loudly, naming both the transaction and the pasted hash; neither saves anything. The receipt fetched to check that is handed to the pipeline, so one pasted transaction is waited for once.

  Answering "cannot sign" (or pressing enter, aborting the prompt, or failing to paste a valid hash) degrades to the existing defer workflow: the full transaction is printed and the same `UnknownSignerError` is thrown, still caught by `catchUnknownSigner`. Signable accounts are entirely unaffected — the policy is still consulted only inside the `unsignable` branch, so `local`, `node` and `impersonated` accounts broadcast exactly as before, and a pre-signed `raw` transaction never reaches the seam. `@rocketh/unknown-signer` only gains doc-comment corrections now that `'ask'` exists.

- aac0ca1: Tell the user when auto-impersonation was enabled but did not resolve the account.

  The impersonation attempt deliberately SWALLOWS an unsupported or refused `hardhat_impersonateAccount`, which is what lets `autoImpersonate` be harmless on a provider that is not a dev node. The cost was silence: a user who switched it on against the wrong kind of node got an unknown-signer error later with nothing saying impersonation had ever been tried. `UnknownSignerErrorData` now carries an optional `autoImpersonation` outcome, and the error message says which of two things happened: `'attempted'` (this account WAS a candidate, `hardhat_impersonateAccount` was sent and the node did not accept it) or `'not-a-candidate'` (never attempted for this account, because the candidates are the NAMED accounts the node would otherwise have to sign for). The two shapes have different fixes, so they do not collapse into one message, and the note is printed directly under the error's header rather than after `data:`, which for a deployment is the whole creation bytecode.

  With `autoImpersonate` off, the message is byte-for-byte unchanged: no new noise on the common path, where the user never asked for impersonation at all.

  It is a MESSAGE detail and nothing more (ADR 0006). `autoImpersonate` remains a NODE CAPABILITY resolved BEFORE the seam and `onUnknownSigner` remains the POLICY afterwards: the outcome is recorded at setup and read only where the error is built, inside the `unsignable` branch, so no control flow, no signability classification and no policy decision changed. Documentation gains the browser/fork route: `@rocketh/web` implements no text prompt by design, so `'ask'` degrades to `throw` there, and the fork answer is impersonation rather than interactivity, with its three real constraints (naming the addresses is mandatory, it needs a node implementing the impersonation RPC, and it is run-level rather than per-transaction).

- 9319520: Make the unknown-signer policy reachable from the shell and settable once for every chain.
  - **New CLI option on both CLIs:** `rocketh --on-unknown-signer <throw|ask|auto>` and `hardhat deploy --on-unknown-signer <throw|ask|auto>`. Previously the only run-level lever was the programmatic `ExecutionParams.onUnknownSigner`, so there was no way to say "not interactive, just this once" from a terminal. An invalid value is rejected by name rather than silently passed through, and omitting the flag leaves config in charge.
  - **Fix: `--skip-prompts` now also forces `throw`** on both CLIs. It is documented as "skip any prompts" but only ever silenced the reset and gas-price confirmations, which was harmless until the interactive resolver landed and made `'auto'` prompt by default on a TTY. It wins over an explicit `--on-unknown-signer ask`, since asking to be prompted and not prompted at once is a contradiction and not prompting is the safe half. (For hardhat-deploy this also covers an in-memory network, where `skipPrompts` is forced on and there is no Safe to execute anything on.)
  - **New top-level `onUnknownSigner` in `UserConfig`**, so a repo-wide default is one line instead of one per `chains[id]` entry. Full precedence is now run parameter (including the CLI flag) > chain config > top-level config > the built-in `'auto'`; a more specific setting always wins.

  Docs: `@rocketh/unknown-signer` is now documented primarily as an EXTENSION (spread it into `extensions` and call `catchUnknownSigner(() => …)` straight off the deploy-script environment, no `env` threading), with the curried `catchUnknownSigner(env)(…)` form shown for use outside a deploy script.

- 2797550: Carry a text-prompt CAPABILITY on the environment, on every construction path. `PromptExecutor` gains an OPTIONAL `promptText` method (returning `{value}` or `{cancelled: true}`) whose ABSENCE is the capability signal, and the prompt now rides `ExecutionParams.promptExecutor` (and its resolved form) — the same road `autoImpersonate` travels — so it reaches `createEnvironment` from the executor, from `loadEnvironmentFromStore` (the path hardhat-deploy takes, where no executor is in scope) and from the shared test harness alike. Environments expose the per-CAPABILITY predicate `env.canPromptForText()`, true only when a text prompt genuinely exists: a prompt object being present is not enough, since `@rocketh/web`'s confirm returns `{proceed: true}` without asking anyone. See `docs/adr/0007-prompt-capability-on-the-environment-not-the-executor.md`.

  `@rocketh/node` implements `promptText` (reading the answer keyed by `request.name`, as the `prompts` library returns it) and supplies its prompt on the hardhat-deploy path, so those runs carry the capability by default; a caller-supplied prompt still wins. `@rocketh/web` deliberately does not implement it. Purely additive and inert: nothing branches on the capability yet, and `onUnknownSigner` resolves and broadcasts exactly as before.

- 43b9545: Throw a first-class `UnknownSignerError` at the single broadcast choke point when a transaction's `from` is unsignable, replacing the opaque `cannot get signer for ...` error there. Because `deploy`, `execute`, `tx` and the proxy upgrade path all funnel through `broadcastTransaction`, the mechanism is transaction-agnostic: a Safe/multisig owner, a hardware wallet left unplugged or any account rocketh cannot sign for now surfaces the exact transaction to execute out-of-band. The decision is made on `addressSignability`, so `local`, `node` and `impersonated` accounts broadcast exactly as before.

  Add `onUnknownSigner: 'throw' | 'auto'`, resolved as execution param > chain config > default `'auto'`, mirroring how `autoImpersonate` is threaded. `'auto'` degrades to `'throw'` while no interactive resolver exists, so CI never prompts and never hangs. It is a POLICY, orthogonal to the `autoImpersonate` node-capability switch (which runs before the seam and is unchanged), and it deliberately has no `'impersonate'` value.

  Add `env.pushUnknownSignerPolicy(frame)` / `env.popUnknownSignerPolicy()` to the `Environment` interface: a scoped policy-frame stack that `@rocketh/unknown-signer`'s `catchUnknownSigner` will use. A frame changes what happens to an `unsignable` account only — it never turns a `local`, `node` or `impersonated` account into a throw.

  `@rocketh/test-utils` is a test-only touch: harness tests that broadcast from a named account the mock node did not list in `eth_accounts` now declare `nodeAccounts`, since such an account is (correctly) unsignable.

- e20634b: Name the function in an `UnknownSignerError` raised from a contract call. `execute` / `executeByName` now declare the call they encode through the new `options.contract` on `env.broadcastExecution` (`{method, args}`), and the seam at the broadcast choke point turns it into `contract: {name?, method, args}` on the error. A user whose proxy owner is a Safe therefore reads `contract: Proxy.upgradeTo("0x...")` and knows which function to run out-of-band, instead of only an address.

  `contract.name` is resolved on the error path through the environment's existing `fromAddressToNamedABIOrNull`, so it is absent when the target address matches no deployment (the message then falls back to `to`), and enrichment can never replace the error with an unrelated one.

  Non-contract paths are unchanged and leave `contract` unset: a plain `tx()`, a value transfer and a deploy have no function to name.

  `@rocketh/test-utils` is a type-only touch, mirroring the widened `broadcastExecution` signature.

- d800333: Add `UnknownSignerError` to `@rocketh/core`, the shared carrier for "the transaction a human or multisig must execute out-of-band". Thrown when a privileged call targets an account rocketh cannot sign for (for example a Safe that owns a proxy). The payload mirrors hardhat-deploy v1's shape — `{from, to?, data?, value?, contract?: {name?, method, args}}` — with one deliberate divergence: `contract.name` is optional and resolved downstream by reverse-lookup (see ADR 0006). Exported as both a value and a type so importers can `catch` via `instanceof` or fall back to `err.name === 'UnknownSignerError'` across dual-published boundaries.
- 01d5bfb: `withEnvironment` now refuses a bad extension root export BY NAME instead of failing with an anonymous `TypeError`.

  An extension package's root may export only curried `(env) => …` functions, because the documented user idiom is a namespace spread (`{...deployExtension, ...myExtension}`) and every entry is called as `value(env)`. A re-exported class or plain constant previously died on `Class constructor … cannot be invoked without 'new'` or `func is not a function`, neither of which says WHICH export is at fault, and this happens at deploy-script run time rather than at build time. Both are now rejected with the offending key named and the fix stated (move it to a subpath export, as `@rocketh/unknown-signer` does with `UnknownSignerError` on `./errors`).

  No working configuration changes: both shapes already threw here, so this only replaces an unhelpful crash with a diagnosable one. Getters (`(env) => value` returning a non-function) remain a supported shape and are unaffected, since the check is on the ENTRY being callable and never on what it returns.

## 0.19.7

### Patch Changes

- 09ea46d: Fix "cannot get signer" for named accounts declared with a private key, a signer protocol, or a checksummed address. `addressSigners` is now keyed by a lowercased address at both write sites and at the leftover-account filter, matching every reader (which already lowercased). `resolveAccountOrUndefined` now normalises like `resolveAccount`, so both resolvers agree. Address values exposed by `namedAccounts`/`unnamedAccounts` are unchanged.

## 0.19.6

### Patch Changes

- 6456996: Fix spurious deployment wipes caused by using the `"earliest"` block tag as the genesis fingerprint.

  rocketh fetched the chain's genesis hash via `eth_getBlockByNumber("earliest")`. On pruned nodes `"earliest"` does not return genesis — geth resolves it to `HistoryPruningCutoff()` and reth to `earliest_block_number()`, i.e. the prune-cutoff block whose hash is not the genesis hash and drifts as history is pruned. The recorded `.chain` genesisHash therefore stopped matching, and because `deleteDeploymentsIfDifferentGenesisHash` was hardcoded `true` for every non-fork environment, rocketh silently deleted the entire deployments folder on real chains whenever the node pruned (or two nodes pruned to different points).

  Genesis is now fetched explicitly via block number `0x0`. On a pruned node that throws (geth `PrunedHistoryError` / reth `PrunedHistoryUnavailable`) or returns null, the genesis hash is left undefined and the mismatch check is skipped entirely — no delete, no throw. Dev/full nodes (never pruned) keep returning the real genesis, so reset detection still works there.

  The delete-on-mismatch behavior is now configurable via a new chain config option `deleteDeploymentsIfDifferentGenesisHash` (resolved like `autoMine`/`autoImpersonate`), using `??` so an explicit `false` on a default-`true` chain actually opts out (`||` would have silently ignored the opt-out). It defaults to `true` for the recognised dev chain ids 1337 and 31337 (reset detection out of the box) and `false` everywhere else. Non-dev chains now throw with a clear reason on a genesis mismatch instead of silently wiping — the message explains how to mark a resettable chain (set the option to `true`) or recover a stale `.chain` (remove its `genesisHash` field, e.g. left over from the old `"earliest"` behavior). The option also inherits per-environment `overrides` for free.

## 0.19.5

### Patch Changes

- 7249888: Allow arbitrary `@custom:*` natspec keys (e.g. `@custom:oz-upgrades-unsafe-allow`) on `DevMethodDoc` so OpenZeppelin upgradeable-contract natspec type-checks without casting — issue #44

## 0.19.4

### Patch Changes

- b2987d7: Do not include viem's default public RPC in a chain's `info.rpcUrls` by default.

  Previously, for every viem-known chain, rocketh merged viem's default public RPC
  endpoint (e.g. `https://<id>.rpc.thirdweb.com`) into `chains[id].info.rpcUrls`.
  That endpoint is rate-limited, can disappear, and was getting baked into
  serialized chain info (frontend exports, wallet "add network" data).

  Now, only an RPC url set explicitly in the config appears in `info.rpcUrls`; the
  required `default` entry is kept with an empty `http` list otherwise. Chain
  metadata (name, nativeCurrency, multicall3, block explorers, ...) is still always
  populated from viem. Deploying keeps working with zero config: viem's default RPC
  is still provided to the deploy path via the chain's top-level `rpcUrl`, so it is
  used but never serialized.

  Set the new top-level config flag `includeDefaultRPCUrlsInChainInfos: true` to
  restore the previous behavior of including viem's default RPC in `info.rpcUrls`.

  Also exposes `mergeChainConfig` from `@rocketh/node` (the pure per-chain merge
  used during config resolution).

## 0.19.3

### Patch Changes

- 034b3a7: retry config + read-execute use it for AbiDecodingZeroDataError errors on existing deployments

## 0.19.2

### Patch Changes

- c6fa24e: add reset + make loading deployment a separate step from createEnvionment

## 0.19.1

### Patch Changes

- packagesWithLogsEnabled + latest deps

## 0.19.0

### Minor Changes

- autoMine

## 0.18.4

### Patch Changes

- environment refactor for simpler extensions

## 0.18.3

### Patch Changes

- add confirmationsRequired option

## 0.18.2

### Patch Changes

- fix package version

## 0.18.1

### Patch Changes

- revert mistake

## 0.18.0

### Minor Changes

- inject default chains instead of getting it at runtime

## 0.17.17

### Patch Changes

- fix address resolution

## 0.17.16

### Patch Changes

- fix

## 0.17.15

### Patch Changes

- ignore supportsInterface conflit for ERC173Proxy

## 0.17.14

### Patch Changes

- latest deps

## 0.17.13

### Patch Changes

- add auto impersonation

## 0.17.12

### Patch Changes

- add metadata to packages

## 0.17.11

### Patch Changes

- add licenses

## 0.17.10

### Patch Changes

- update deps

## 0.17.9

### Patch Changes

- 8ef1407: fix typos + improvements
- ef83a74: update deps
- ce1e98f: readme
- e01378e: publish src too

## 0.17.8

### Patch Changes

- add logging

## 0.17.7

### Patch Changes

- f7a81d8: refactor logging

## 0.17.6

### Patch Changes

- f4431ed: removing dependence on ethers

## 0.17.5

### Patch Changes

- update deps and dev deps

## 0.17.4

### Patch Changes

- provider available: doNotRequireRpcURL

## 0.17.3

### Patch Changes

- dc5aefe: allow for custom deployment message

## 0.17.2

### Patch Changes

- add ability to add message to simple tx broadcast

## 0.17.1

### Patch Changes

- 6642ece: reorg using @rocketh/core for utility functions and types (still reexported from rocketh)
