---
title: Record script tags and dependency tags on saved deployments
slug: record-script-tags-and-dependencies-on-deployments
spec: tag-tracking-selective-reset
blockedBy: []
covers: [1, 2, 3]
---

## What to build

When a deploy script runs and `save`s a deployment, the deployment record must persist the script's OWN declared `tags` and declared `dependencies` (tag names). Both fields are OPTIONAL on the `Deployment` type — pre-existing deployments without them stay valid.

Wire it via setter methods on the `Environment` interface: the executor, immediately before invoking each script, sets the "current script" `tags` and `dependencies` on the environment; `save` reads them when persisting a deployment. Critically, when script A depends on script B and executing A causes B to run first, the deployment produced by B must carry B's OWN tags/dependencies — NOT A's, and NOT the triggering `--tags` value. Deployment content must be independent of how it was triggered.

End-to-end vertical: type field on `Deployment` (in `rocketh-core`) → setter on `Environment` interface → executor sets current-script context before each script invocation → `save` picks it up and writes it onto the deployment file → tests demonstrate a real script's tags/deps land on its deployment(s), across single-tag, multi-tag, and dependency-triggered-run cases.

## Acceptance criteria

- [ ] `Deployment` type in `@rocketh/core` carries optional `tags?: readonly string[]` and `dependencies?: readonly string[]` (already sketched — confirm/finalize).
- [ ] `Environment` (in `@rocketh/core` types) exposes setter(s) the executor uses to publish the current script's declared `tags` and `dependencies` before running it.
- [ ] The executor invokes those setters immediately before each script executes (including scripts run because they were declared as a dependency of another script).
- [ ] `save` reads the current-script context and writes `tags` + `dependencies` onto the persisted `Deployment`.
- [ ] Integration tests (in the style of the existing `*.integration.test.ts` files) verify:
  - a deployment created by a script tagged `['foo']` records `tags: ['foo']`;
  - a deployment created by a script tagged `['foo', 'bar']` records BOTH;
  - a deployment created by a dependency script `B` (triggered because `A` declared `B`'s tag as a dependency, or was run via `--tags A`) records `B`'s own tags — not `A`'s tags and not the invocation tag;
  - `dependencies` on the deployment reflect the script's declared `dependencies` array.
- [ ] Pre-existing deployment fixtures lacking `tags` still load and round-trip without error (backwards compatible).
- [ ] Tests cover the new behaviour and mirror the repo's existing test style (use `createMockEnvironment` / `createMockArtifact` from `@rocketh/test-utils`).

## Blocked by

- None — can start immediately.

## Prompt

> Self-contained context. Goal: make every saved `Deployment` remember which script's tags produced it and which dependency tags that script declared, using a setter-on-`Environment` seam so the executor pushes the current-script context and `save` pulls it on persist.
>
> Domain vocabulary: a deploy **script** declares `tags` (labels for itself) and `dependencies` (tags of other scripts it needs run first). `--tags` at the CLI selects WHICH scripts to run, but the tags RECORDED on a resulting deployment must be the producing script's OWN tags — never the CLI-invocation tag, never a triggering script's tag.
>
> Where to look (by concept, not brittle paths):
> - `@rocketh/core` types: `Deployment`, `Environment` — the optional `tags`/`dependencies` fields on `Deployment` already exist; verify shape and finalize. Add the setter surface on `Environment`.
> - `rocketh` executor: the script-execution loop — the point where each script (top-level or dependency-triggered) is about to be invoked is where to publish the current-script tags/deps into the environment.
> - `rocketh` environment: the `save` path — where a deployment is materialized and written to disk is where to READ the current-script context and stamp it on the record.
> - `@rocketh/test-utils`: `createMockEnvironment`, `createMockArtifact` for integration tests.
>
> Seams to test at: the persisted `Deployment` object returned by `deploy` / read back from storage. Assert on `deployment.tags` and `deployment.dependencies`. Add a scenario where `A` depends on `B` and both deploy contracts, then assert each contract's deployment carries ITS OWN script's tags. Add a scenario where an existing deployment fixture without `tags` still loads.
>
> Constraining decisions from the spec (`tag-tracking-selective-reset`):
> - Record the script's OWN declared tags — NOT the triggering tag.
> - Track declared `dependencies` (script-module level), not runtime deployment accesses.
> - Setter approach on `Environment`, not implicit globals.
> - Both fields OPTIONAL on `Deployment` for backwards compatibility.
>
> "Done" = the four integration-test scenarios above pass, `pnpm typecheck` and `pnpm test` are green, and no existing test regresses.
