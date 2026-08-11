---
title: 'Carry a text-prompt capability on the environment (every construction path)'
slug: prompt-capability-on-the-environment
spec: unknown-signer-interactive
blockedBy: []
covers: []
---

## What to build

The EXPAND step of this spec: give the environment a way to ask a human for free TEXT, and make "can I ask?" a per-CAPABILITY question, on every path that builds an environment. Nothing consumes it yet, so this task lands green on its own.

Three pieces, one thin path:

1. **Widen the prompt abstraction additively.** It is confirm-only today (`prompt({type:'confirm', name, message}) => {proceed: boolean}` plus `exit()`). Add an OPTIONAL text method alongside it rather than widening the existing request union. Absence of the method IS the capability signal.
2. **Carry the prompt on the resolved run parameters**, the same bag that already carries `provider`, `autoImpersonate` and `onUnknownSigner`, and thread it into the environment on EVERY construction path.
3. **Implement it where a human is actually reachable** (the Node executor, which already depends on a prompting library) and deliberately DO NOT implement it in the browser runtime.

Then expose, on the environment, the single predicate a later task will branch on: whether a text prompt is available for this run.

The decided shape (recorded in the spec, reproduced here so this file stands alone):

```ts
export type TextPromptAnswer = {value: string} | {cancelled: true};

export interface PromptExecutor {
	prompt(request: {type: 'confirm'; name: string; message: string}): Promise<PromptAnswer>;
	/** OPTIONAL. Absence IS the capability signal: this runtime cannot ask for free text. */
	promptText?(request: {type: 'text'; name: string; message: string}): Promise<TextPromptAnswer>;
	exit(): void;
}
```

Why a separate optional method and not a widened `prompt` union: it is purely additive so no existing implementation breaks; the capability check becomes one honest predicate instead of a parallel descriptor that can drift; and it sidesteps a live bug described in the prompt below.

## Acceptance criteria

- [ ] The prompt abstraction gains an OPTIONAL text method returning a value-or-cancelled result. Purely additive: every existing implementation still compiles and behaves identically, and the existing confirm method is unchanged.
- [ ] The prompt is carried on `ExecutionParams` (and its resolved form) and reaches the environment on ALL THREE `createEnvironment` call sites: the one inside `createExecutor`, the one inside `loadEnvironmentFromStore`, and the shared test harness. Enumerate them in the done record and confirm no fourth exists at build time.
- [ ] A named, tested predicate on the environment reports whether a TEXT prompt is available for this run. It is per-CAPABILITY: it must NOT be satisfied merely by a prompt object being present.
- [ ] `@rocketh/node` implements the text method, and it reads its answer keyed off `request.name`. A test drives it with a name that is NOT `proceed` and asserts the value comes back (this is the regression guard for the bug named in the prompt).
- [ ] `@rocketh/web` does NOT implement the text method, and a test asserts the capability predicate reports false for a web-shaped prompt object.
- [ ] hardhat-deploy's path reaches the environment WITH the capability by default, because `@rocketh/node` supplies its own prompt implementation on that path. Demonstrate it (a test through the node loader is enough); this is the whole point of routing through `ExecutionParams` rather than the executor.
- [ ] Nothing changes behaviourally yet: `onUnknownSigner` still resolves exactly as before and no policy branches on the new capability in this task.
- [ ] Tests live in `packages/rocketh/test/` for anything exercising the environment itself, building a real environment locally with a mock provider, because `rocketh` must not depend on `@rocketh/test-utils` (that edge closes an nx project-graph cycle and fails `pnpm build`).
- [ ] A changeset accompanies the change.
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass.

## Blocked by

- None, can start immediately.

## Prompt

> Goal: make "this run can ask a human for a transaction hash" a capability the ENVIRONMENT carries, available on every path that constructs one. This is the enabling step for the interactive unknown-signer resolver; you are not building the resolver here, and no policy should branch on the capability yet.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Confirm the prompt abstraction is still confirm-only and the three construction paths are still three. If any of this landed differently, route to needs-attention rather than working around it.
>
> Where to look. The prompt abstraction is `PromptExecutor` in `@rocketh/core`'s types (currently `prompt` plus `exit`, no text variant). The run-parameter bag is `ExecutionParams` in the same file, which already carries `provider`, `autoImpersonate` and `onUnknownSigner`, and is resolved by `resolveExecutionParams` in `packages/rocketh/src/executor/index.ts`. The three `createEnvironment` callers, verified 2026-08-10, are `packages/rocketh/src/executor/index.ts:318` (inside `loadEnvironmentFromStore`, which has NO prompt in scope today), `packages/rocketh/src/executor/index.ts:408` (inside `createExecutor`, which does), and `packages/rocketh-test-utils/src/test-environment.ts:337` (the shared harness). Line numbers will drift; the concepts will not.
>
> Why `ExecutionParams` and not a new `createEnvironment` argument. `autoImpersonate` ALREADY travels this exact road and reaches both production paths, because it is resolved inside `resolveExecutionParams`, which `loadEnvironmentFromStore` also calls. The prompt is today a runtime object only `createExecutor` holds, which is precisely why hardhat users would otherwise be pinned to the non-interactive policy forever. hardhat-deploy reaches the environment via `@rocketh/node`'s `loadEnvironmentFromFiles`, which delegates to `loadEnvironmentFromFilesWithSpecificConfig` and then `loadEnvironmentFromStore`. Make the capability ride the road that already works. A bonus of this choice: the shared test harness already accepts a partial `ExecutionParams` pass-through, so a later task can inject a fake prompt with NO new harness API. Do not add one.
>
> The live bug to guard against. `@rocketh/node`'s existing prompt implementation does `return {proceed: answer.proceed}`, reading `.proceed` unconditionally and IGNORING `request.name`, while the underlying `prompts` library keys its answer object BY `request.name`. It works today only because both existing call sites happen to pass `name: 'proceed'`. If you implement the text variant the same way, a prompt named `txHash` will silently receive `undefined`. Key off `request.name`, and write the test that would have caught it.
>
> `@rocketh/web` must NOT implement the text variant: a browser cannot sensibly ask a user to paste a hash. Note while you are there that web's existing confirm implementation is a stub that returns `{proceed: true}` without asking anyone, which is exactly why the capability check must be per-CAPABILITY and not "is a prompt object present?". Do not fix the confirm stub in this task; if it bothers you, capture it as an observation.
>
> Test homes follow the two-homes split this project settled on (see `CONTEXT.md` under _test environment_): anything exercising the environment itself is tested in `packages/rocketh/test/` with a locally-built real environment, because `rocketh` must not depend on `@rocketh/test-utils`. Extension-package work uses the shared harness.
>
> Done means: the capability exists, is per-capability, reaches all three construction paths including hardhat's, is implemented for Node and absent for web, and NOTHING has changed about how transactions are broadcast or how `onUnknownSigner` resolves.

## Requeue 2026-08-10

Gate-3 BLOCK (conductor), 2026-08-10: TWO doc-vs-reality fixes, no behaviour change. (1) packages/rocketh-core/src/types.ts TextPromptAnswer's JSDoc lists 'an empty non-answer' among what cancelled covers, but createNodePromptExecutor().promptText returns cancelled only when typeof value !== 'string', so '' comes back as {value: ''} and a test pins that deliberately. The BEHAVIOUR is RATIFIED (generic text primitive, caller validates); fix the DOC: drop the empty-non-answer clause and state positively that an empty string IS a value callers must validate. Record it as a decision, since Gate 2 flagged it unrecorded. This is blocking because it is a public exported type in a 0.x minor bump and ask-policy-interactive-resolver reads it to decide how an empty paste behaves. (2) packages/rocketh/test/prompt-capability.test.ts has the hardhat/loadEnvironmentFromStore JSDoc block sitting immediately above the EXECUTOR test, documenting a test that is not there, while the real loadEnvironmentFromStore test below has none; move it to the test it describes. RATIFIED, do NOT churn: the hardhat default (node injects its prompt when the caller supplied none), run-params-beat-executor-prompt precedence, canPromptForText() as a method, the promptExecutor field name, leaving @rocketh/web untouched, and capturing the pre-existing confirm .proceed bug as an observation instead of fixing it. Everything else verified good: additive widening, all three construction paths, the request.name regression guard, per-capability check, nothing-branches-yet guard, clean lockfile.

## Decisions

_Transcribed from `work/notes/observations/decisions-prompt-capability-on-the-environment-2026-08-10.md`, deleted in the same commit. That note predated the protocol rule (synced 2026-08-11) that gives a builder's rationale exactly ONE home: a `## Decisions` block in the done record. The rationale is reproduced unchanged below, followed by the human's ratification._

_Decisions taken while building `prompt-capability-on-the-environment` (2026-08-10)_

Recorded here because they are user-visible or touch other tasks, and the task body (which the runner moves) is not mine to edit. Each also carries a JSDoc at its choice site.

### 1. The run-parameter field is named `promptExecutor`, not `prompt`

`ExecutionParams.promptExecutor` / `ResolvedExecutionParams.promptExecutor`. `prompt` is already taken twice in this codebase's language: it is the METHOD on `PromptExecutor`, and the local name for an ANSWER in `packages/rocketh/src/executor/index.ts` (`const prompt = await promptExecutor.prompt(...)`). `promptExecutor` is the name every existing instance of the abstraction already carries (`createExecutor(deploymentStore, promptExecutor)`, and the module-level consts in `@rocketh/node` and `@rocketh/web`). Alternative considered: `prompt`, rejected as a third meaning for an overloaded word.

### 2. The predicate is `env.canPromptForText()`, a method

On the `Environment` interface, next to the other verbs (`hasMigrationBeenDone`, `resolveAccount`). Alternative considered: a readonly boolean (e.g. `context.canPromptForText`), rejected because a method leaves room for a later runtime check (a TTY probe) without a shape change, and reads as the predicate the spec asks for. This is the name `ask-policy-interactive-resolver` and `per-call-ask-override-and-deferral-precedence` will branch on.

### 3. The executor's prompt is a DEFAULT; run parameters win

In `createExecutor`'s `executeDeployScriptModules`, the prompt handed to `createExecutor` is used only when the resolved run parameters carry none. Applied there (rather than in `resolveConfigAndExecuteDeployScriptModules`) because `@rocketh/node` and `@rocketh/web` resolve their parameters themselves and call `executeDeployScriptModules` directly; the later point is the only one both entries pass through. Consequence: injecting a prompt through `ExecutionParams` (what `injectable-prompt-executor-for-extension-tests` will do) overrides the runtime's own, which is what a test wants.

### 4. USER-VISIBLE DEFAULT: `@rocketh/node`'s loader now supplies its prompt to hardhat-deploy runs

`loadEnvironmentFromFilesWithSpecificConfig` puts `@rocketh/node`'s own `PromptExecutor` on the run parameters when the caller supplied none, so a hardhat-deploy environment reports `canPromptForText() === true` by default. This is the point of the task (ADR 0007), and it is INERT in this slice: nothing branches on the capability yet. It becomes user-visible when `ask-policy-interactive-resolver` lands, at which point `'auto'` will resolve to `'ask'` on a hardhat run with a TTY. Flagging it here so that consequence is ratified deliberately rather than discovered.

### 5. `@rocketh/web` was left completely untouched

No text implementation, and no comment either: the "browser has no text capability, use impersonation on a fork instead" guidance is `impersonation-unsupported-hint-and-web-guidance`'s job, and touching the package for a comment alone would drag it into this changeset. The web-shaped, confirm-only prompt is covered by test instead (`packages/rocketh/test/prompt-capability.test.ts`).

### 6. USER-VISIBLE: an EMPTY answer is a VALUE (`{value: ''}`), not a cancellation

`createNodePromptExecutor().promptText` returns `{cancelled: true}` only when `prompts` gives back no string for `request.name` (the Ctrl-C abort); `''` comes back as `{value: ''}`, pinned by `packages/rocketh-node/test/prompt-executor.test.ts` ("treats an empty answer as a value"). Chosen because `promptText` is a GENERIC text primitive: only the caller knows what its prompt can accept, so the caller validates. Alternative considered: mapping `''` to `{cancelled: true}` inside the Node implementation, rejected because it bakes one caller's policy into the primitive, makes "the user pressed enter on an empty line" indistinguishable from "the user aborted", and would have to be re-litigated for any prompt where empty is legitimate. What it touches: `ask-policy-interactive-resolver` (and `per-call-ask-override-and-deferral-precedence`) must reject an empty paste THEMSELVES and decide whether that means re-ask, abort or defer; it must not read `''` as a cancellation. Recorded because the `TextPromptAnswer` JSDoc previously implied the opposite (Gate 2 flagged the doc/behaviour disagreement, Gate 3 blocked on it); the doc at `packages/rocketh-core/src/types.ts` and the choice site at `packages/rocketh-node/src/environment/prompt.ts` now both state it positively.

### Ratification (2026-08-11 observation triage)

**Ratified - all six decisions accepted as-is; keep the note.**

Including the two with user-visible weight: the loader supplying `@rocketh/node`'s prompt to hardhat-deploy runs by default (decision 4), and an EMPTY answer being a VALUE rather than a cancellation (decision 6), which the interactive resolver's defer semantics rest on.

Two things were checked while ratifying, and both hold:

- The TTY question this note anticipated is settled by what landed: the gate lives in the RUNTIME (`packages/rocketh-node/src/environment/prompt.ts` supplies `promptText` only when `process.stdin.isTTY`), not in `canPromptForText()`, which stays pure method presence per ADR 0007.
- Decision 4's asymmetry between the two entry points is FIXED rather than ratified. The environment loader built its prompt per call while the execute path used a module-level one built at import, so the two agreed only by coincidence (identical for a CLI process, divergent for an embedder running deployments in-process). Both now build per call, and a caller-supplied `ExecutionParams.promptExecutor` still wins over both. Note the CLI and hardhat-deploy's deploy task are the same code path - both call `loadAndExecuteDeploymentsFromFiles` - so this was never a CLI-vs-hardhat-deploy difference.

Decided and closed alongside this: the runtime will NOT also withhold the text ability when `process.env.CI` is set. The guarantee rests on `process.stdin.isTTY` alone. A CI runner that allocates a pty therefore still gets a text prompt, which is the accepted residual: the docs are carefully qualified ("a CI run whose stdin is not a terminal"), and withholding on an env var would break someone deliberately running interactively in a CI-labelled environment.
