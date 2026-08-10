# Decisions taken while building `prompt-capability-on-the-environment` (2026-08-10)

Recorded here because they are user-visible or touch other tasks, and the task body (which the runner moves) is not mine to edit. Each also carries a JSDoc at its choice site.

## 1. The run-parameter field is named `promptExecutor`, not `prompt`

`ExecutionParams.promptExecutor` / `ResolvedExecutionParams.promptExecutor`. `prompt` is already taken twice in this codebase's language: it is the METHOD on `PromptExecutor`, and the local name for an ANSWER in `packages/rocketh/src/executor/index.ts` (`const prompt = await promptExecutor.prompt(...)`). `promptExecutor` is the name every existing instance of the abstraction already carries (`createExecutor(deploymentStore, promptExecutor)`, and the module-level consts in `@rocketh/node` and `@rocketh/web`). Alternative considered: `prompt`, rejected as a third meaning for an overloaded word.

## 2. The predicate is `env.canPromptForText()`, a method

On the `Environment` interface, next to the other verbs (`hasMigrationBeenDone`, `resolveAccount`). Alternative considered: a readonly boolean (e.g. `context.canPromptForText`), rejected because a method leaves room for a later runtime check (a TTY probe) without a shape change, and reads as the predicate the spec asks for. This is the name `ask-policy-interactive-resolver` and `per-call-ask-override-and-deferral-precedence` will branch on.

## 3. The executor's prompt is a DEFAULT; run parameters win

In `createExecutor`'s `executeDeployScriptModules`, the prompt handed to `createExecutor` is used only when the resolved run parameters carry none. Applied there (rather than in `resolveConfigAndExecuteDeployScriptModules`) because `@rocketh/node` and `@rocketh/web` resolve their parameters themselves and call `executeDeployScriptModules` directly; the later point is the only one both entries pass through. Consequence: injecting a prompt through `ExecutionParams` (what `injectable-prompt-executor-for-extension-tests` will do) overrides the runtime's own, which is what a test wants.

## 4. USER-VISIBLE DEFAULT: `@rocketh/node`'s loader now supplies its prompt to hardhat-deploy runs

`loadEnvironmentFromFilesWithSpecificConfig` puts `@rocketh/node`'s own `PromptExecutor` on the run parameters when the caller supplied none, so a hardhat-deploy environment reports `canPromptForText() === true` by default. This is the point of the task (ADR 0007), and it is INERT in this slice: nothing branches on the capability yet. It becomes user-visible when `ask-policy-interactive-resolver` lands, at which point `'auto'` will resolve to `'ask'` on a hardhat run with a TTY. Flagging it here so that consequence is ratified deliberately rather than discovered.

## 5. `@rocketh/web` was left completely untouched

No text implementation, and no comment either: the "browser has no text capability, use impersonation on a fork instead" guidance is `impersonation-unsupported-hint-and-web-guidance`'s job, and touching the package for a comment alone would drag it into this changeset. The web-shaped, confirm-only prompt is covered by test instead (`packages/rocketh/test/prompt-capability.test.ts`).
