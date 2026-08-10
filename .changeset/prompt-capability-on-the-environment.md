---
'@rocketh/core': minor
'rocketh': minor
'@rocketh/node': minor
---

Carry a text-prompt CAPABILITY on the environment, on every construction path. `PromptExecutor` gains an OPTIONAL `promptText` method (returning `{value}` or `{cancelled: true}`) whose ABSENCE is the capability signal, and the prompt now rides `ExecutionParams.promptExecutor` (and its resolved form) — the same road `autoImpersonate` travels — so it reaches `createEnvironment` from the executor, from `loadEnvironmentFromStore` (the path hardhat-deploy takes, where no executor is in scope) and from the shared test harness alike. Environments expose the per-CAPABILITY predicate `env.canPromptForText()`, true only when a text prompt genuinely exists: a prompt object being present is not enough, since `@rocketh/web`'s confirm returns `{proceed: true}` without asking anyone. See `docs/adr/0007-prompt-capability-on-the-environment-not-the-executor.md`.

`@rocketh/node` implements `promptText` (reading the answer keyed by `request.name`, as the `prompts` library returns it) and supplies its prompt on the hardhat-deploy path, so those runs carry the capability by default; a caller-supplied prompt still wins. `@rocketh/web` deliberately does not implement it. Purely additive and inert: nothing branches on the capability yet, and `onUnknownSigner` resolves and broadcasts exactly as before.
