---
title: 'Export deployments as part of the hardhat deploy run'
slug: export-as-part-of-the-deploy-run
blockedBy: []
covers: []
---

<!-- open-questions -->

## Open questions

1. This adds `@rocketh/export` as a dependency of the `hardhat-deploy` package, and AGENTS.md makes adding a package dependency ask-first. Approved, and if so as a regular dependency or an optional peer (so a project that never exports does not install it)?

<!-- /open-questions -->

## What to build

In hardhat-deploy v1, `deploy --export <file>` and `--export-all <file>` write the frontend export at the end of the same run (v1 `src/index.ts:623-624`, written by `src/DeploymentsManager.ts:1267-1375`). In rocketh, export is a separate command (`rocketh-export`), so every pipeline that had one step now has two. The hardhat plugin already carries the placeholder: `// TODO? export?: string;` at `packages/hardhat-deploy/src/tasks/deploy.ts:18`.

Add an export option to the hardhat plugin's `deploy` task that runs `@rocketh/export` against the environment just deployed, once the run succeeds, in the formats `@rocketh/export` already supports (ts, js, json and the two module forms). Only the single-environment export: the multi-environment form was dropped until users ask for it.

Scope is the HARDHAT PLUGIN only, and that is a constraint, not a preference: `@rocketh/export` already depends on `@rocketh/node` (see its `package.json`), so the standalone `rocketh` CLI, which lives in `@rocketh/node`, cannot call it without a dependency cycle. The standalone CLI keeps the two-step.

Rules to keep:

- Export runs only after a SUCCESSFUL run. A failed run exports nothing.
- On an in-memory or fork run, where deployments are not saved (`packages/hardhat-deploy/src/tasks/deploy.ts:28-32, 84-93`), there is nothing on disk to export; refuse with a message that says why rather than exporting stale files.
- `@rocketh/export`'s own refusals (no output path, zero deployments) surface unchanged.

## Acceptance criteria

- [ ] `hardhat deploy --export <file.ts>` (or the chosen spelling) leaves the same file a separate `rocketh-export --ts <file.ts>` would.
- [ ] A failed run writes nothing.
- [ ] An in-memory or fork run with the option refuses with a clear message.
- [ ] Tests cover the three cases; `pnpm typecheck`, `pnpm test`, `pnpm format:check` pass; a minor changeset for `hardhat-deploy`.

## Blocked by

- None mechanically; the dependency question above must be answered first.

## Prompt

> Add an export option to the hardhat plugin's `deploy` task (`packages/hardhat-deploy/src/`), running `@rocketh/export` on the environment just deployed after a successful run. The v1 behaviour is in `work/notes/findings/hardhat-deploy-v1-feature-surface.md`, section G.
>
> Do not start until the open question is answered: it adds a package dependency, which AGENTS.md makes ask-first.
>
> Do not add this to the standalone `rocketh` CLI: `@rocketh/export` depends on `@rocketh/node`, so that direction is a cycle. Verify the cycle yourself from the two `package.json` files before relying on it.
>
> FIRST, check this task against current reality; if the plugin or export package has moved, route to needs-attention (WORK-CONTRACT.md, "Drift is a needs-attention signal"). RECORD non-obvious decisions (the option's spelling, the refusal on unsaved runs) in `## Decisions` at the end of your FINAL REPORT. Do not write the done record or the commit message yourself.
