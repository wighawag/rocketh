# rocketh

## 0.19.18

### Patch Changes

- 753705b: Document how to run rocketh against something valuable, in one place, and add a security policy.

  The operational advice that decides whether a deployment tool is safe to point at mainnet was spread across an ADR, a changeset, three sections of the documentation and a rebuttal in a notes file. A reader with an upgrade to perform had no page to read, so `documentation.md` now has a **Production hardening** section that collects it and says which parts are defaults you should check rather than features you must install:

  - keep the signing authority outside the deployment environment, and set `onUnknownSigner: 'throw'` when the run administers something live;
  - `catchUnknownSigner` catches what rocketh CANNOT sign, and is not a "never broadcast" switch;
  - `autoImpersonate` is off by default and belongs to fork testing, so the thing to check is that it is not switched on for a production chain;
  - rehearse on a fork, and read the chain again afterwards, because a successful receipt says a transaction was mined, not that the intended state transition happened;
  - read the diamond cut plan, especially the removals, since a declarative selector diff removes by design;
  - pass `--verify` on the export that ships, and treat the generated file as a build artifact rather than a record;
  - review a deployment-record address change like a code change, and pin the tooling exactly in a repository whose job is to administer live contracts.

  `SECURITY.md` gives vulnerability reports a private channel (a GitHub security advisory) and, more usefully, states the boundary that decides what a vulnerability here even is: rocketh silently doing something other than what the script asked for is one, and a deploy script misusing an admin key it was handed is the deployment environment's design. It also lists the accepted, documented properties that are not worth reporting, so a reader can tell the difference between something already known and something new.

  Also fixed: the deploy-script example under "Deploying Contracts" still imported from `#rocketh`, the subpath-imports alias that setup no longer uses. It reads `../rocketh/deploy.js`, like every other example on the page.

- 7fdb319: Document what the interactive unknown-signer path now checks, that `catchUnknownSigner` is not a "never send" switch, and that `linkedData` is public.

  Three gaps in `documentation.md`, all about the same thing: what a reader can rely on when a privileged transaction is involved.

  **The stated residual risk was out of date.** It said an execution's pasted hash is checked for success "and nothing else", which stopped being true when the evidence check landed. It now describes what is actually weighed (the transaction itself, a Safe execution, a wrapper carrying the calldata, or nothing), that the last case pauses and asks rather than refusing, since governance executed by proposal id looks exactly like a wrong hash, and what remains accepted: no wallet ABI is decoded, so a user who deliberately confirms the wrong transaction is believed. What is gone is the silent case.

  **`catchUnknownSigner` reads like a "never send" switch and is not one.** It catches the case where rocketh CANNOT sign; an account it CAN sign for still broadcasts inside the wrapper, which is what makes a mixed run work. A production run that unexpectedly holds the admin key therefore sends the admin transaction. The docs now say so and show the assertion to write instead, using `env.addressSignability`, which is public API and needed no new feature.

  **`linkedData` is public.** It is stored in the deployment record and copied into every export, so it reaches the frontend bundle and the repository. Fine for a prefix, an admin address or a start block; the wrong place for an API key or an RPC URL with a token in it.

  Also documented: the diamond cut plan (and why a declarative selector diff removes functions by design), `--verify` for exports, and the identifier constraint on the `--tsm` / `--jsm` module formats.

- 400ece3: Weigh whether a pasted transaction is actually the one rocketh asked for, instead of accepting any successful hash.

  When rocketh cannot sign, the interactive path prints the transaction, the user executes it out-of-band and pastes back a hash. For an EXECUTION, the whole of the check was that the hash existed on this network and its receipt reported success. Pasting the hash of an unrelated successful transaction therefore recorded that transaction as the requested proxy upgrade, diamond cut or ownership transfer. A deployment was already held to a stricter standard (`requireDeployedContract` proves code exists at the expected address); an execution had no anchor at all.

  **Equality is not the fix.** A Safe execution is not the transaction rocketh described: it goes to the Safe, carries rocketh's call as an inner payload, and is signed by an owner who is not the `from` at all. A timelock adds another layer. So a mismatch cannot be refused and a match cannot be required.

  The evidence is ranked instead, and the transaction is already in hand (it is fetched before waiting for the receipt), so this costs no extra RPC:

  - **direct**: same `to`, `data` and `value`. It IS the transaction. Values compare numerically, since `0x0`, `0x00` and `0` are the same amount written by different tools.
  - **account**: sent TO the account rocketh needed to act as, which is what every Safe execution looks like from outside. Deliberately outranks `embedded`: it names the executing account rather than merely finding bytes.
  - **embedded**: rocketh's calldata appears verbatim inside the transaction's input, which is what a Safe `execTransaction`, a MultiSend batch or an OpenZeppelin `TimelockController.execute` payload looks like. Wallet-agnostic: no ABI is decoded and no wallet is recognised. Empty calldata is excluded, since `0x` is a substring of everything and a plain ETH transfer would otherwise match every transaction ever mined.
  - **none**: nothing links the two.

  The first three are accepted and the run now says WHICH one matched, because it is about to record a privileged operation as done on the strength of it.

  **`none` asks rather than refuses**, and that is the load-bearing decision. Governance executed by identifier, such as Governor Bravo's `execute(uint256 proposalId)` where the payload was queued in an earlier transaction, carries no trace of the calldata: refusing would break a legitimate workflow. It is also exactly what pasting the wrong hash looks like, and rocketh cannot tell them apart, so it stops and says so. Only an explicit `yes` records it; anything else, including an empty line, a cancelled prompt or a prompt that cannot reach a human, defers the transaction with the same `UnknownSignerError` any other deferral raises, so `catchUnknownSigner` handles it identically and nothing is saved.

  This narrows, but does not remove, the residual risk documented in "Handling unknown signers": a user who deliberately confirms the wrong transaction is still believed. What it removes is the silent case.

  Two test mocks returned an `eth_getTransactionByHash` result with no `to`, `input` or `value`, which no node does; they now return the Safe-execution shape they were always meant to model.

- ad03283: Fail with the name of the deployment record that could not be read, instead of a bare `SyntaxError`.

  Every deployment record was parsed with no error handling, so a truncated or hand-edited JSON file surfaced as:

  ```
  SyntaxError: Expected property name or '}' in JSON at position 2
  ```

  That answers neither of the two questions the reader has, which file and which environment, and it reached users through every path that loads deployments: the `rocketh` CLI, hardhat-deploy, `rocketh-export` and `rocketh-doc`.

  It now names the record, the environment and the folder, keeps the original parse error as `cause`, and says why it stops rather than skipping the file: a deployment rocketh cannot see is one it would **deploy again**, at a new address, silently replacing what the unreadable record described.

  `.migrations.json` keeps its existing non-fatal handling, deliberately, and the asymmetry is now pinned by a test. What is lost there is the record of which scripts have run, and those are idempotent by design, so the run continues; the message just has to say so, or a reader watches every script re-run with no explanation. `failed to parse .migrations.json` named neither the environment nor the consequence, and now does both.

- 8547e39: Replace `pushUnknownSignerPolicy` / `popUnknownSignerPolicy` on the environment with a single `runUnderUnknownSignerPolicy(frame, action)`.

  ```ts
  // before
  env.pushUnknownSignerPolicy({policy: 'throw'});
  try {
  	await action();
  } finally {
  	env.popUnknownSignerPolicy();
  }

  // after
  await env.runUnderUnknownSignerPolicy({policy: 'throw'}, () => action());
  ```

  Behaviour is unchanged: same precedence (innermost frame, else the run's `onUnknownSigner`), same capability ceiling degrading `'ask'` to `'throw'` where no human can be reached, same invariant that a frame never turns a signable account into a throw. `catchUnknownSigner` and `withUnknownSignerPolicy` are untouched at the surface, so no deploy script changes.

  **Why one verb instead of two.** A stranded frame is no longer representable: the environment owns both ends of the scope, so a caller cannot forget the `finally`, and an unbalanced pop (a documented no-op, which meant a leaked policy announced itself only as changed behaviour much later) cannot be written at all.

  **And it is what unblocks the concurrency limitation.** The policy scope is dynamic scope over a sequential run, so `Promise.all` of two actions inside one `catchUnknownSigner` shares one frame and leaks it between them, in both directions since `'ask'` landed (ADR 0006). Fixing that means a scope that follows the ASYNC CAUSAL CHAIN rather than wall-clock time, so that work started inside the wrapper inherits the frame and work started outside it does not: `AsyncLocalStorage` on Node, `AsyncContext` when it reaches browsers.

  What stood in the way was not the storage, it was this API. Two independent verbs can only be backed by ambient mutable state, so the frame stack was part of the published contract of `@rocketh/core` and could not be swapped without a second breaking change. It is now an implementation detail of one method, and `AsyncLocalStorage` being Node-only is not a blocker either: ADR 0007 already established the pattern for a capability only some runtimes provide, injected on the environment by `@rocketh/node`, with a fallback elsewhere.

  The leak itself is NOT fixed here, and the limitation stands until that work lands. This removes the reason it could not be fixed cheaply.

  Only code that drove the seam directly is affected. Nothing in `@rocketh/deploy`, `@rocketh/proxy`, `@rocketh/diamond` or `@rocketh/read-execute` called these.

- Updated dependencies [8547e39]
  - @rocketh/core@0.19.11

## 0.19.17

### Patch Changes

- 5266a61: Report a chain with no public info as a warning, not an error.

  `getChainConfigFromUserConfig` wrote `chain with id <id> has no public info` to `console.error`, then immediately substituted placeholder chain metadata and carried on. The condition is handled and expected (`info` is optional in `ChainUserConfig`), so anything classifying rocketh's output by severity saw a failure during a completely healthy run: the docs playground, which captures the console, painted a red error line through the middle of a successful deploy.

  It is now `console.warn`, and the message says what it fell back to. A double space in the text (`chain with id 31337  has no public info`, from an empty conditional clause between two spaces) is fixed at the same time.

  `console.warn` and `console.error` both go to stderr in Node, and the substring `has no public info` is unchanged, so redirects and greps keep matching. Tooling that classifies rocketh's stderr BY SEVERITY will see this line move from error to warn, which is the point of the change. The notice deliberately stays on `console` rather than moving to the `named-logs` logger used elsewhere in the package, because `named-logs` returns a no-op unless a factory has been hooked first and only the `@rocketh/node` CLI does that; see `docs/adr/0009-user-facing-notices-stay-on-console.md`.

## 0.19.16

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

## 0.19.15

### Patch Changes

- d41ff21: Add exhaustive `default:` branch to the signer-routing switch in `broadcastTransaction` so a future fourth `Signer` variant fails to compile at the call site, and cast / JS-caller / user-supplied-`signerProtocols` paths that violate their own type contract throw a clear error naming the unexpected `signer.type` instead of silently returning `undefined` and failing confusingly downstream in `savePendingExecution`.

## 0.19.14

### Patch Changes

- b34e921: Dependency maintenance: bump transitive runtime dependency ranges across all published packages. Notable bumps: `viem` ^2.48.2 → ^2.55.13, `abitype` ^1.2.4 → ^1.3.0, `commander` ^14.0.3 → ^15.0.0, `chalk` 5.6.2 → 6.0.0, `fs-extra` ^11.3.4 → ^11.4.0, `ldenv` ^0.5.0 → ^0.6.0, `hardhat` peer ^3.6.0 → ^3.12.0, `ipfs-gateway-emulator` 4.2.1-ipfs.2 → 5.0.0, `typedoc` ^0.28.19 → ^0.28.20. `zod` is kept on ^3.25.76 (not bumped to 4.x) so `hardhat-deploy` stays compatible with hardhat's zod 3 tree. Root dev tooling also bumped (`@types/node` 25 → 26, `nx` 22 → 23, `@changesets/cli` 2 → 3, `tsx`, `prettier`, `@vitest/coverage-v8`, `vitest`); `syncpack` removed (v15 has pnpm interop issues). No public API changes — typecheck, the 444-test suite, and a cache-busted build all pass.
- Updated dependencies [b34e921]
  - @rocketh/core@0.19.10

## 0.19.13

### Patch Changes

- 6ea32f1: Docs/comments only: correct a documented invariant that `withUnknownSignerPolicy` falsified. `unknownSignerPolicy.ts` (and ADR 0006) claimed the `Promise.all` frame leak could only make a concurrent action throw where it would have prompted, "never the other way round, since a frame only ever forces `throw`" — true only while `catchUnknownSigner` was the sole thing pushing a frame. A per-call override can push `'ask'` or `'auto'`, so the leak now runs in both directions; the capability ceiling still applies to a leaked frame. `documentation.md` also gains the missing nesting caveat on `catchUnknownSigner` (an explicit override written inside it wins), documents the per-call `'auto'` meaning, and moves the `withUnknownSignerPolicy` subsection after the deployment paragraphs it had orphaned.
- 1a583b2: `PendingTransaction.transaction.origin` is now written un-normalised at all five sites, where two of them previously lowercased it. It is a persisted RECORD VALUE, not a lookup key: nothing reads it back, and it reaches the deployment record and the pending-transaction files, so it keeps the address as resolved (EIP-55 checksum intact), exactly as `namedAccounts`/`unnamedAccounts` deliberately do, while the re-hydration paths keep what the node returned. Contrast `addressSigners`, which is a lookup map and stays keyed lowercase. Records written before this change hold lowercased values, so anything that ever starts matching on `origin` must lowercase at the comparison rather than rely on the stored form.
- Updated dependencies [c833bda]
  - @rocketh/core@0.19.9

## 0.19.12

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

- ef4a3b0: Recover and verify the deployed address when a DEPLOYMENT is resolved interactively.

  A deployment from an unsignable `from` under `onUnknownSigner: 'ask'` already paused, took the hash of the transaction the user executed out-of-band, and inherited the successful-status check. It now also has to prove that the pasted transaction actually deployed something before anything is recorded: an ordinary deployment is saved at the address that transaction's OWN receipt reports as created, while a deterministic or factory deployment — whose address is computed from bytecode and salt before broadcast and is preferred over the receipt's — is saved only once there is CODE at that expected address. The confirmation is code-at-address, never transaction parsing, so the wrapper a multisig executed the deployment inside is irrelevant.

  A receipt with no usable contract address (absent OR the zero address, which is truthy and so slipped through every `if (!contractAddress)` check), an expected address holding no code, or an unanswerable `eth_getCode`, all now FAIL LOUDLY and save nothing at all: no deployment record, no pending-transaction state, no gas-report entry. Each error names the deployment, the pasted hash and the transaction that still needs executing.

  Normal broadcasts are untouched and gain NO new failure mode — in particular a deterministic deploy that rocketh sends itself is still recorded at its expected address without a code check. The invariants run at the shared broadcast choke point, which now requires each funnel to state whether it is broadcasting an execution or a deployment, so a future funnel cannot reach the seam without the deployment checks applying.

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

## 0.19.11

### Patch Changes

- 09ea46d: Fix "cannot get signer" for named accounts declared with a private key, a signer protocol, or a checksummed address. `addressSigners` is now keyed by a lowercased address at both write sites and at the leftover-account filter, matching every reader (which already lowercased). `resolveAccountOrUndefined` now normalises like `resolveAccount`, so both resolvers agree. Address values exposed by `namedAccounts`/`unnamedAccounts` are unchanged.
- Updated dependencies [09ea46d]
  - @rocketh/core@0.19.7

## 0.19.10

### Patch Changes

- 6456996: Fix spurious deployment wipes caused by using the `"earliest"` block tag as the genesis fingerprint.

  rocketh fetched the chain's genesis hash via `eth_getBlockByNumber("earliest")`. On pruned nodes `"earliest"` does not return genesis — geth resolves it to `HistoryPruningCutoff()` and reth to `earliest_block_number()`, i.e. the prune-cutoff block whose hash is not the genesis hash and drifts as history is pruned. The recorded `.chain` genesisHash therefore stopped matching, and because `deleteDeploymentsIfDifferentGenesisHash` was hardcoded `true` for every non-fork environment, rocketh silently deleted the entire deployments folder on real chains whenever the node pruned (or two nodes pruned to different points).

  Genesis is now fetched explicitly via block number `0x0`. On a pruned node that throws (geth `PrunedHistoryError` / reth `PrunedHistoryUnavailable`) or returns null, the genesis hash is left undefined and the mismatch check is skipped entirely — no delete, no throw. Dev/full nodes (never pruned) keep returning the real genesis, so reset detection still works there.

  The delete-on-mismatch behavior is now configurable via a new chain config option `deleteDeploymentsIfDifferentGenesisHash` (resolved like `autoMine`/`autoImpersonate`), using `??` so an explicit `false` on a default-`true` chain actually opts out (`||` would have silently ignored the opt-out). It defaults to `true` for the recognised dev chain ids 1337 and 31337 (reset detection out of the box) and `false` everywhere else. Non-dev chains now throw with a clear reason on a genesis mismatch instead of silently wiping — the message explains how to mark a resettable chain (set the option to `true`) or recover a stale `.chain` (remove its `genesisHash` field, e.g. left over from the old `"earliest"` behavior). The option also inherits per-environment `overrides` for free.

- Updated dependencies [6456996]
  - @rocketh/core@0.19.6

## 0.19.9

### Patch Changes

- Updated dependencies [7249888]
  - @rocketh/core@0.19.5

## 0.19.8

### Patch Changes

- Updated dependencies [b2987d7]
  - @rocketh/core@0.19.4

## 0.19.7

### Patch Changes

- 034b3a7: retry config + read-execute use it for AbiDecodingZeroDataError errors on existing deployments
- Updated dependencies [034b3a7]
  - @rocketh/core@0.19.3

## 0.19.6

### Patch Changes

- e06b151: fix cbor logic for bytecode matching + remove unecessary logs

## 0.19.5

### Patch Changes

- c6fa24e: add reset + make loading deployment a separate step from createEnvionment
- Updated dependencies [c6fa24e]
  - @rocketh/core@0.19.2

## 0.19.4

### Patch Changes

- packagesWithLogsEnabled + latest deps
- Updated dependencies
  - @rocketh/core@0.19.1

## 0.19.3

### Patch Changes

- fix gas price report

## 0.19.2

### Patch Changes

- report gas price too

## 0.19.1

### Patch Changes

- fix autoMine

## 0.19.0

### Minor Changes

- autoMine

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.19.0

## 0.18.7

### Patch Changes

- environment refactor for simpler extensions
- Updated dependencies
  - @rocketh/core@0.18.4

## 0.18.6

### Patch Changes

- fix

## 0.18.5

### Patch Changes

- add confirmationsRequired option
- Updated dependencies
  - @rocketh/core@0.18.3

## 0.18.4

### Patch Changes

- fix(rocketh): use 'in' operator for field existence checks to support falsy values

## 0.18.3

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.2

## 0.18.2

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.1

## 0.18.1

### Patch Changes

- fix

## 0.18.0

### Minor Changes

- inject default chains instead of getting it at runtime

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.18.0

## 0.17.23

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.17

## 0.17.22

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.16

## 0.17.21

### Patch Changes

- Updated dependencies
  - @rocketh/core@0.17.15

## 0.17.20

### Patch Changes

- latest deps
- Updated dependencies
  - @rocketh/core@0.17.14

## 0.17.19

### Patch Changes

- add auto impersonation
- Updated dependencies
  - @rocketh/core@0.17.13

## 0.17.18

### Patch Changes

- add metadata to packages
- Updated dependencies
  - @rocketh/core@0.17.12

## 0.17.17

### Patch Changes

- add licenses
- Updated dependencies
  - @rocketh/core@0.17.11

## 0.17.16

### Patch Changes

- update deps
- Updated dependencies
  - @rocketh/core@0.17.10

## 0.17.15

### Patch Changes

- b765457: better warning for cahing info missing

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

## 0.17.13

### Patch Changes

- add logging
- Updated dependencies
  - @rocketh/core@0.17.8

## 0.17.12

### Patch Changes

- add tsx back

## 0.17.11

### Patch Changes

- explicit return type for `setupDeployScript`

## 0.17.10

### Patch Changes

- f7a81d8: refactor logging
- Updated dependencies [f7a81d8]
  - @rocketh/core@0.17.7

## 0.17.9

### Patch Changes

- fix eth_feeHistory missing case

## 0.17.8

### Patch Changes

- e737031: get gas price at start + fallback on eth_gasPrice, todo: set for the duration of the execution
- Updated dependencies [f4431ed]
  - @rocketh/core@0.17.6

## 0.17.7

### Patch Changes

- update deps and dev deps
- Updated dependencies
  - @rocketh/core@0.17.5

## 0.17.6

### Patch Changes

- fix message
  - @rocketh/core@0.17.4

## 0.17.5

### Patch Changes

- provider available: doNotRequireRpcURL
- Updated dependencies
  - @rocketh/core@0.17.4

## 0.17.4

### Patch Changes

- dc5aefe: allow for custom deployment message
- Updated dependencies [dc5aefe]
  - @rocketh/core@0.17.3

## 0.17.3

### Patch Changes

- add ability to add message to simple tx broadcast
- Updated dependencies
  - @rocketh/core@0.17.2

## 0.17.2

### Patch Changes

- 6642ece: reorg using @rocketh/core for utility functions and types (still reexported from rocketh)
- c574413: LinkedData vs LinkedDataProvided
- Updated dependencies [6642ece]
  - @rocketh/core@0.17.1

## 0.17.1

### Patch Changes

- better default chain info resolution

## 0.17.0

### Minor Changes

- d67b01f: reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

## 0.17.0-next.0

### Minor Changes

- reorg the package, to use rocketh you now need rocketh + @rocketh/node (for cli and rocketh.ts support)

## 0.16.0

### Minor Changes

- add @roceth/core
