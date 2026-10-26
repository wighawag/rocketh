---
title: 'Diamond `execute`: an explicit `{init, onUpgrade}` form, like the proxy'
slug: diamond-execute-init-on-upgrade
blockedBy: []
covers: []
---

## What to build

`@rocketh/diamond`'s `execute` option is ONE call, made on the first deploy (as an entry in the diamond constructor's initializations) and again on EVERY later `diamondCut` that changes something, with the same method and args (`packages/rocketh-diamond/src/types.ts`, the `execute` JSDoc; the gate is `if (changesDetected)` in `packages/rocketh-diamond/src/index.ts`). Running only when something changed is deliberate and STAYS: deploy scripts are re-run and must be idempotent. What is missing is a way to say WHICH event a call belongs to, so a one-time initializer does not re-fire on every later cut. `@rocketh/proxy` already has this (`execute: {init, onUpgrade}`, `packages/rocketh-proxy/src/index.ts`), inherited from hardhat-deploy v1.

The maintainer approved this shape on 2026-10-26:

```ts
type DiamondCall =
	| {type: 'facet'; functionName: string; args: unknown[]}
	| {type: 'artifact'; artifact: Artifact; functionName: string; args: unknown[]};

execute?:
	| DiamondCall // unchanged: first deploy AND every later cut that changes something
	| {init?: DiamondCall; onUpgrade?: DiamondCall}; // explicit
```

- `init` runs only when the diamond is first created (constructor initializations).
- `onUpgrade` runs only on a later cut that actually changes facets; no cut, no call.
- Each carries its own target, so `init` and `onUpgrade` may name different functions, even on different contracts. The `{type: 'facet'}` lookup (which finds `functionName` among the facets being cut in) must therefore run per selected call, AFTER choosing init versus onUpgrade.
- A value that mixes the flat form with `init` / `onUpgrade` is refused with a clear message, as the proxy and v1 do.
- The flat form keeps its exact current behaviour, and keeps the name `execute`: the proxy's flat `execute` has the same "deploy and every upgrade" meaning, so the two packages keep one vocabulary.

Out of scope: a way to run a call although nothing changed (a storage migration needing no cut). It needs its own explicit opt-in and its own design.

Provenance, kept from the idea note this task replaces: a third-party security review reported the initializer-only skip as a high-severity bug. It is not one (the same gating exists in hardhat-deploy v1's diamond implementations and in `@rocketh/proxy`, and removing it would break idempotence); the real gap is this missing expressiveness.

## Acceptance criteria

- [ ] `DiamondDeployOptions.execute` accepts the flat form and `{init?, onUpgrade?}`, typed as above; the existing flat-form tests pass unchanged.
- [ ] Integration tests, as documentation: `init` runs on the first deploy and NOT on a later changing cut; `onUpgrade` runs on a later changing cut and NOT on the first deploy; neither runs on a re-run with no change; `init` and `onUpgrade` naming different functions (and one of each `type`) both work; mixing the flat form with `init`/`onUpgrade` is refused.
- [ ] The `execute` JSDoc (whose pointer to the retired idea note `work/notes/ideas/diamond-execute-init-on-upgrade.md` must go) and the diamond section of the user docs (`documentation/deploying/index.md`, and the `@rocketh/diamond` README if it covers `execute`) explain the two forms, and steer anything that must run exactly once to `init`.
- [ ] The capability map (`documentation/migration/index.md`, Diamonds section) no longer says there is no `{init, onUpgrade}` split for diamonds.
- [ ] Tests use `createTestEnvironment` (or the diamond tests' existing node-held helper); `pnpm typecheck`, `pnpm test`, `pnpm format:check` pass; a minor changeset for `@rocketh/diamond`.

## Blocked by

- None.

## Prompt

> Add the explicit `{init, onUpgrade}` form to `@rocketh/diamond`'s `execute`, exactly in the shape recorded above (it was approved; do not redesign it). Read the current `execute` handling in `packages/rocketh-diamond/src/index.ts` and its JSDoc in `packages/rocketh-diamond/src/types.ts`, and the proxy's `{init, onUpgrade}` handling in `packages/rocketh-proxy/src/index.ts` for the semantics and the mixing refusal to mirror.
>
> Keep the flat form byte-for-byte as it behaves today. Never make a call fire on a run that cuts nothing.
>
> Never run an unbounded regex over `packages/rocketh-diamond/src/hardhat-deploy-v1-artifacts/` or `packages/rocketh-proxy/src/hardhat-deploy-v1-artifacts/` (multi-megabyte single-line files); bound every command with `timeout`. This repository is public: describe motivations by pattern, never by who reported them.
>
> FIRST, check this task against current reality; if the diamond code has moved, route to needs-attention (WORK-CONTRACT.md, "Drift is a needs-attention signal"). RECORD non-obvious decisions in `## Decisions` at the end of your FINAL REPORT. Do not write the done record or the commit message yourself.

## Decisions

- **The mixing refusal is a runtime throw, and the proxy does not actually refuse.** The task says to refuse mixing "as the proxy and v1 do", but `@rocketh/proxy` (`packages/rocketh-proxy/src/index.ts`, around lines 448–483) has no such throw. It reads `'methodName' in execute` first and silently ignores `init`/`onUpgrade` next to it, and TypeScript doesn't catch it either for a value that isn't a literal. The task's requirement itself was clear, so I implemented it: `selectExecution` throws when a value has any of `type`/`functionName`/`args`/`artifact` alongside `init`/`onUpgrade`. The alternative was to copy the proxy's silent precedence, but that drops a call without a word. This touches only `@rocketh/diamond`. The proxy's silent precedence remains, and whether to fix it is a separate decision.
- **The flat `DiamondCall` keeps today's generic artifact typing.** `DiamondCall<TAbi, TFunctionName, TArgs>` is `ExecuteOptions<…> | {type: 'facet'; functionName: string; args: unknown[]}`. It reuses the existing `ExecuteOptions` for the artifact variant instead of a bare `Artifact`, so flat-form typing stays the same. The facet variant's `args` changed from `any[]` to the approved `unknown[]`, which accepts the same inputs. The alternative was a literal transcription with `artifact: Artifact`, which would loosen typing for anyone passing generics. `DiamondCall` is exported from `@rocketh/diamond/types`.
- **First deploy versus upgrade is decided by whether the diamond proxy already exists**, the same flag that already chooses constructor versus `diamondCut`. So `init` always lands in the constructor initializations and `onUpgrade` always in a cut.
- **An empty `{}` keeps its current behaviour (no call).** It isn't treated as the explicit form: today `{}` is truthy but matches neither `type`, so nothing runs, and that still holds.
- **The "facet not found" error now names which call it was looking for**: `Facet not found for execute`, `execute.init` or `execute.onUpgrade`. The flat form's message is unchanged.
