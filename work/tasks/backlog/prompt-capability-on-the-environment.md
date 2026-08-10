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
