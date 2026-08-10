---
title: 'Record script tags and dependency-tags on each saved deployment'
slug: record-script-tags-and-dependencies-on-deployments
spec: tag-tracking-selective-reset
blockedBy: []
covers: [1, 2, 3, 9]
---

## What to build

> **FORWARD-POINTER (added when this tasking landed, READ FIRST).** This task and its spec were written a long time before they landed, and one placement decision in them is now WRONG.
>
> The spec's "setter approach" says the executor pushes the current script's tags into the environment "via setter methods on the `Environment` interface". Do NOT put them there. `Environment` is the object every USER deploy script holds, so setters on it would let a script rewrite the tags its own deployments are stamped with, which is a far larger public API change than this work needs and is not what the spec was reaching for.
>
> Since that spec was written, `rocketh` grew the seam this belongs on: `InternalEnvironment` (`packages/rocketh/src/internal/types.ts`), the executor-to-environment handle that already carries exactly this class of plumbing (`recordMigration`, `loadDeployments`, `recoverTransactionsIfAny`). `createEnvironment` returns `{external, internal}` and the executor already drives the run through `internal`. Put the tag/dependency setter there, and keep `Environment` unchanged apart from what the deployment RECORD needs.
>
> Enumerate `InternalEnvironment` from its definition before you design against it rather than from a search result. Extending `Deployment` in `@rocketh/core` with optional `tags` / `dependencies` is still correct and is unchanged by this note.
>
> One more thing that landed since tasking, relevant to the SIBLING task: a fork run now REFUSES `--reset` outright (`packages/rocketh/src/environment/index.ts`, checked while the environment is built). Selective reset must not route around that guard.

Make every deployment that a script produces carry, on the persisted deployment file, the **script's own declared `tags`** and the **script's own declared `dependencies`** (the tags it depends on). Both fields are optional on `Deployment`, so pre-existing deployments (and any code path that doesn't set them) stay valid.

End-to-end vertical:

- Extend the `Deployment` type in `@rocketh/core` with optional `tags?: readonly string[]` and `dependencies?: readonly string[]`.
- Push the currently-executing script's `tags` and `dependencies` into the environment before the script runs, and clear/replace them when moving to the next script. **NOT on the public `Environment` interface** (see the forward-pointer above): use the `InternalEnvironment` handle.
- In the `rocketh` executor, invoke those setters with the script module's OWN `tags` / `dependencies` immediately before executing each script — including scripts that ran because they were a dependency of some other script. A dependency script must stamp ITS OWN tags on the deployments it creates, NEVER the triggering tag.
- In the save / broadcast-deployment path, read the currently-set tags/dependencies from the environment and include them on the persisted `Deployment` object.

Backward compatibility is a first-class requirement: reading an existing deployment file with no `tags` / `dependencies` must continue to work; nothing writes empty arrays as a placeholder that could later be mistaken for "declared to have no tags" — absent means absent.

## Acceptance criteria

- [ ] `Deployment` in `@rocketh/core` types carries optional `tags` and `dependencies` (both are `readonly string[] | undefined`); no existing consumer breaks (typecheck passes across the workspace).
- [ ] `Environment` exposes the setter(s) the executor uses to communicate the current script's `tags` and `dependencies`; the setter mechanism is documented at the type level.
- [ ] The `rocketh` executor calls the setter(s) before executing EACH script it runs, using that script module's own `tags` / `dependencies` (not the invoking `--tags` value, not the dependent script's tags).
- [ ] Deployments saved during a script's execution include that script's declared `tags` and `dependencies` on disk; a script with multiple tags records all of them; a script with no tags records no `tags` field (not an empty array).
- [ ] Deployments produced by a script that ran purely as a dependency carry THAT script's tags, not the triggering tag — verified by an integration test using `createTestEnvironment` / `createMockArtifact`.
- [ ] Integration tests (in the style of the existing `*.integration.test.ts`) cover: single-tag recording, multi-tag recording, dependency-script recording its own tags, and a script with no declared tags producing a deployment without a `tags` field.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm format:check` all pass.

## Blocked by

- None — can start immediately.

## Prompt

> Self-contained instructions to paste into a fresh agent context.
>
> FIRST, check this task against current reality (launch snapshot may have drifted): confirm `Deployment` in `packages/rocketh-core/src/types.ts` still lacks `tags` / `dependencies` fields, confirm `DeployScriptModule` still declares `tags?: string[]` and `dependencies?: string[]`, and confirm the executor in `packages/rocketh/src/executor/` still runs scripts without pushing their tags into the environment. If any of those have changed under you, route to needs-attention with the discrepancy.
>
> GOAL: when a deploy script runs and calls `save` (or its deployment is broadcast/persisted), the resulting deployment file records the SCRIPT'S OWN declared `tags` and `dependencies`. This is purely observational — no behaviour changes for scripts that don't declare tags, and no existing deployment file becomes invalid.
>
> DOMAIN VOCABULARY:
>
> - **script tags** = `DeployScriptModule.tags` on the exported deploy script (already exists in `@rocketh/core` types).
> - **script dependencies** = `DeployScriptModule.dependencies` — an array of TAG strings the script depends on (not runtime deployment lookups; not accesses via `env.deployments.get(...)`).
> - **triggering tag** = the value of `--tags` (or the executor's chosen entrypoint) that CAUSED a script to run. It is NOT what gets stamped on the deployment; the script's own tags are.
> - **setter approach** = the decision (see `work/specs/tasked/tag-tracking-selective-reset.md` "Implementation Decisions") that the executor calls a method on `Environment` to hand it the current script's tags/dependencies BEFORE each script runs, and the persistence path reads them back at save time. This is deliberately NOT threaded as a `save` argument, so third-party deploy helpers (`@rocketh/deploy`, `@rocketh/proxy`, `@rocketh/diamond`, …) inherit the behaviour with no change to their signatures.
>
> WHERE TO LOOK (by concept, not brittle paths):
>
> - `Deployment` and `Environment` type declarations in `packages/rocketh-core/src/types.ts`.
> - Environment construction in `packages/rocketh/src/environment/`.
> - The script-execution loop in `packages/rocketh/src/executor/` — this is where the setter must be invoked before each script (top-level AND dependency-triggered).
> - The save / broadcast-deployment implementation on the environment (search for `save` and `broadcastDeployment`) — this is where the tags/dependencies must be attached to the persisted object.
> - Existing integration tests under `packages/*/test/*.integration.test.ts` for the pattern to mirror; use `createTestEnvironment` and `createMockArtifact` from `@rocketh/test-utils`.
>
> SEAMS TO TEST AT:
>
> - Write an integration test that defines two scripts A (tags `['core']`) and B (tags `['feature1']`, dependencies `['core']`); trigger B and assert A's deployments carry `['core']` while B's carry `['feature1']`.
> - A script with `tags: ['a','b']` — its deployment records both.
> - A script with no `tags` — its deployment has no `tags` field (assert `'tags' in deployment === false`, not just falsy).
>
> DONE means: types extended, setter wired, executor invokes it per script, persisted deployments carry the script's own tags/dependencies, no legacy deployment breaks, tests green, typecheck + format green. Do NOT touch the CLI / reset behaviour — that's the follow-on task `dependency-aware-selective-reset-via-reset-and-tags`.
>
> RECORD non-obvious in-scope decisions durably (per `TASKING-PROTOCOL.md`). Likely candidates: the exact shape of the setter API on `Environment` (single method taking `{tags, dependencies}` vs two methods; whether prior state is cleared or replaced between scripts); how the persistence path decides "absent" vs "empty array". If any of these meet the ADR gate, add an ADR under `docs/adr/`.
