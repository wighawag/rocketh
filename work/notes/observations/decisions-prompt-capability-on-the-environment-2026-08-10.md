---
needsAnswers: false
---

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

## 6. USER-VISIBLE: an EMPTY answer is a VALUE (`{value: ''}`), not a cancellation

`createNodePromptExecutor().promptText` returns `{cancelled: true}` only when `prompts` gives back no string for `request.name` (the Ctrl-C abort); `''` comes back as `{value: ''}`, pinned by `packages/rocketh-node/test/prompt-executor.test.ts` ("treats an empty answer as a value"). Chosen because `promptText` is a GENERIC text primitive: only the caller knows what its prompt can accept, so the caller validates. Alternative considered: mapping `''` to `{cancelled: true}` inside the Node implementation, rejected because it bakes one caller's policy into the primitive, makes "the user pressed enter on an empty line" indistinguishable from "the user aborted", and would have to be re-litigated for any prompt where empty is legitimate. What it touches: `ask-policy-interactive-resolver` (and `per-call-ask-override-and-deferral-precedence`) must reject an empty paste THEMSELVES and decide whether that means re-ask, abort or defer; it must not read `''` as a cancellation. Recorded because the `TextPromptAnswer` JSDoc previously implied the opposite (Gate 2 flagged the doc/behaviour disagreement, Gate 3 blocked on it); the doc at `packages/rocketh-core/src/types.ts` and the choice site at `packages/rocketh-node/src/environment/prompt.ts` now both state it positively.

## Applied answers 2026-08-11

### q1: What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).

**Ratified - all six decisions accepted as-is; keep the note.**

Including the two with user-visible weight: the loader supplying `@rocketh/node`'s prompt to hardhat-deploy runs by default (decision 4), and an EMPTY answer being a VALUE rather than a cancellation (decision 6), which the interactive resolver's defer semantics rest on.

Two things were checked while ratifying, and both hold:

- The TTY question this note anticipated is settled by what landed: the gate lives in the RUNTIME (`packages/rocketh-node/src/environment/prompt.ts` supplies `promptText` only when `process.stdin.isTTY`), not in `canPromptForText()`, which stays pure method presence per ADR 0007.
- Decision 4's asymmetry between the two entry points is FIXED rather than ratified. The environment loader built its prompt per call while the execute path used a module-level one built at import, so the two agreed only by coincidence (identical for a CLI process, divergent for an embedder running deployments in-process). Both now build per call, and a caller-supplied `ExecutionParams.promptExecutor` still wins over both. Note the CLI and hardhat-deploy's deploy task are the same code path - both call `loadAndExecuteDeploymentsFromFiles` - so this was never a CLI-vs-hardhat-deploy difference.

Decided and closed alongside this: the runtime will NOT also withhold the text ability when `process.env.CI` is set. The guarantee rests on `process.stdin.isTTY` alone. A CI runner that allocates a pty therefore still gets a text prompt, which is the accepted residual: the docs are carefully qualified ("a CI run whose stdin is not a terminal"), and withholding on an env var would break someone deliberately running interactively in a CI-labelled environment.
