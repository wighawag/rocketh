# @rocketh/unknown-signer

## 0.19.4

### Patch Changes

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

## 0.19.3

### Patch Changes

- b34e921: Dependency maintenance: bump transitive runtime dependency ranges across all published packages. Notable bumps: `viem` ^2.48.2 → ^2.55.13, `abitype` ^1.2.4 → ^1.3.0, `commander` ^14.0.3 → ^15.0.0, `chalk` 5.6.2 → 6.0.0, `fs-extra` ^11.3.4 → ^11.4.0, `ldenv` ^0.5.0 → ^0.6.0, `hardhat` peer ^3.6.0 → ^3.12.0, `ipfs-gateway-emulator` 4.2.1-ipfs.2 → 5.0.0, `typedoc` ^0.28.19 → ^0.28.20. `zod` is kept on ^3.25.76 (not bumped to 4.x) so `hardhat-deploy` stays compatible with hardhat's zod 3 tree. Root dev tooling also bumped (`@types/node` 25 → 26, `nx` 22 → 23, `@changesets/cli` 2 → 3, `tsx`, `prettier`, `@vitest/coverage-v8`, `vitest`); `syncpack` removed (v15 has pnpm interop issues). No public API changes — typecheck, the 444-test suite, and a cache-busted build all pass.
- Updated dependencies [b34e921]
  - @rocketh/core@0.19.10

## 0.19.2

### Patch Changes

- Updated dependencies [c833bda]
  - @rocketh/core@0.19.9

## 0.19.1

### Patch Changes

- a5db88c: Add the `'ask'` unknown-signer policy and the interactive resolver at the broadcast seam.

  `onUnknownSigner` is now `'throw' | 'ask' | 'auto'`, and `'auto'` (still the default) is CAPABILITY-AWARE: it resolves to `'ask'` where the run can ask a human for text (`env.canPromptForText()`, i.e. a `PromptExecutor` implementing `promptText`) and to `'throw'` where it cannot. Capability is a CEILING, so an explicit `'ask'` also degrades to `'throw'` without a prompt. `@rocketh/node` now supplies its `promptText` ONLY when stdin is a terminal, so a CI run (whose stdin is not) simply has no text capability and takes the throw path: it never prompts and never hangs. The gate lives in the runtime rather than in `canPromptForText()`, which stays pure method presence (ADR 0007), because `prompts` asked a question with no terminal behind it never settles and never rejects (measured in `docs/spikes/ask-policy-interactive-resolver/prompts-non-tty-behaviour.md`).

  Under `'ask'`, a transaction whose `from` is unsignable PAUSES: rocketh presents the exact transaction (the undegraded `UnknownSignerError` message), the user executes it out-of-band on their Safe and pastes the resulting transaction hash, and the run CONTINUES through the same pending-transaction pipeline a normal broadcast uses, returning a real receipt with no send RPC attempted. Because the resolver resolves instead of throwing, a multi-step governed action pauses at each unsignable step and completes in ONE run. The pasted hash is registered with the transaction-hash tracker, so gas reporting does not omit an externally-executed transaction. A hash this node has never heard of is looked up for a bounded number of rounds and then reported as NOT FOUND rather than polled for ever, and a receipt without a successful status fails loudly, naming both the transaction and the pasted hash; neither saves anything. The receipt fetched to check that is handed to the pipeline, so one pasted transaction is waited for once.

  Answering "cannot sign" (or pressing enter, aborting the prompt, or failing to paste a valid hash) degrades to the existing defer workflow: the full transaction is printed and the same `UnknownSignerError` is thrown, still caught by `catchUnknownSigner`. Signable accounts are entirely unaffected — the policy is still consulted only inside the `unsignable` branch, so `local`, `node` and `impersonated` accounts broadcast exactly as before, and a pre-signed `raw` transaction never reaches the seam. `@rocketh/unknown-signer` only gains doc-comment corrections now that `'ask'` exists.

- 82ef614: Add `withUnknownSignerPolicy`, a PER-CALL override of the unknown-signer policy.

  `withUnknownSignerPolicy(env)('ask', () => execute(...))` runs one action under the policy you name, overriding the run-level `onUnknownSigner` (itself resolved as run parameter > chain config > the default `'auto'`). It is the SAME policy frame `catchUnknownSigner` pushes, so precedence stays one rule — innermost override, then the run parameter, then the chain config, then the default — and the frame is popped in a `finally`, so an action that throws (the deferral itself does) cannot strand it on the stack. The action is a thunk for the same reason `catchUnknownSigner`'s is: a promise has already started before the frame could be pushed, so the override would silently not apply. It returns whatever the action returned and propagates whatever it threw, so wrapping it in `catchUnknownSigner` still defers.

  CAPABILITY IS A CEILING, NOT A DEFAULT: an overridden `'ask'` degrades to `'throw'` wherever the run cannot ask a human for text (CI, a non-TTY shell, the browser), so a script that hardcodes the override still runs un-hangable in CI. And since it is the same frame, it is read only inside the seam's `unsignable` branch: a `local`, `node` or `impersonated` account broadcasts identically inside the scope, and a pre-signed `raw` transaction never reaches the seam at all.

  `catchUnknownSigner` is unchanged in behaviour (it now shares the one push/pop site) and its deferral guarantee is finally ASSERTABLE: under an ambient `'ask'` with a working prompt, a wrapped action takes the throw path without the prompt being consulted at all, and the printed deferral message is byte-for-byte the one an ambient `'throw'` produces. The core slice could not test this, because both of its policy values resolved to `'throw'`.

- 4383bb6: New package `@rocketh/unknown-signer`, providing the hardhat-deploy v1 `catchUnknownSigner` helper as a curried rocketh extension: `catchUnknownSigner(env)(action, options?)` runs the action with a `{policy: 'throw'}` unknown-signer frame pushed for its duration, catches the `UnknownSignerError` the broadcast seam throws for an unsignable `from`, prints the transaction to execute out-of-band, and returns `{from, to, value, data}` (or `null` when the action succeeded). Return parity with v1 is exact: every key is present even when `undefined`, `value` is a string, and `contract` is never returned. Nothing is persisted — idempotency is on-chain-state-driven, as in v1.

  One deliberate divergence from v1: the action is a THUNK only (`() => execute(...)`), not `Promise | thunk`. A promise has already started executing before the wrapper can establish its policy scope, so accepting one would silently do nothing. The v1 promise form is a compile error, and a JavaScript caller gets a runtime error naming the fix.

  The pushed frame forces `throw` over the interactive `ask` policy that ships later; it NEVER overrides impersonation. An account the node can sign for, including an impersonated one, still broadcasts inside a `catchUnknownSigner` block (ADR 0006).

  `UnknownSignerError` is re-exported from the `@rocketh/unknown-signer/errors` subpath rather than the package root, because every runtime export of an extension package is called as `value(env)` when the package is spread into `extensions`.

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
