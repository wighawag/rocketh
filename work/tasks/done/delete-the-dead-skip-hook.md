---
title: 'Delete the dead skip() hook and document the early-return replacement'
slug: delete-the-dead-skip-hook
blockedBy: []
covers: []
---

## What to build

hardhat-deploy v1 lets a deploy script export `skip(env)`, an async predicate evaluated before the script runs (v1 `types.ts:32`, `src/DeploymentsManager.ts:1183-1216`). rocketh does not support it, and the executor carries the ghost of an implementation: a `let skip = false` that is never assigned, followed by a commented-out block that would have called `deployScript.func.skip` (`packages/rocketh/src/executor/index.ts:824-835`). `DeployScriptModule` has no `skip` field (`packages/rocketh-core/src/types.ts:31-42`), so a v1 script that exports one is silently ignored: the script runs anyway.

Two things to do, and they are the same decision from both ends.

1. Remove the dead code and the unused local, so the executor says what it does. ADR 0010 already took this position on the `newEnvironments` block it deleted: unwired code that looks like an oversight invites someone to finish it. Leave the reachable behaviour identical.
2. Document the replacement where a migrating user will meet it: a script that wants to skip itself returns early from its own body, and a script that wants to be skipped PERMANENTLY once it has completed uses the run-once mechanism (`id` plus `return true`, `documentation/script-lifecycle/`). Say explicitly that a v1 `skip` export is IGNORED rather than honoured, because silent non-support is the part that bites.

This task deliberately does NOT implement `skip`. If the maintainer decides it should exist, that is a different task and this one should not have half-built it.

## Acceptance criteria

- [ ] The commented-out `skip` block and the unused `let skip = false` are gone from `packages/rocketh/src/executor/index.ts`; the surrounding control flow is unchanged.
- [ ] `pnpm test` passes with no test edits (nothing tested the dead branch; if something does, say so and stop).
- [ ] The migration documentation states that a v1 `skip` export is ignored, and gives the early-return and run-once replacements.
- [ ] `pnpm typecheck` and `pnpm format:check` pass, and an EMPTY changeset is added if nothing user-visible changed in a published package, or a patch changeset if it did (see `CONTEXT.md` on changesets, and do not run `pnpm changeset`).

## Blocked by

- None. It is independent of the capability-map task, though the two touch the same documentation and are cheaper together.

## Prompt

> Remove the dead `skip()` scaffolding in `packages/rocketh/src/executor/index.ts` (the unused `let skip = false` and the commented-out block around it) and document what a migrating hardhat-deploy v1 user should write instead. The gap is recorded in `work/notes/findings/hardhat-deploy-v1-feature-surface.md`, section F, with citations on both sides.
>
> Do NOT implement `skip`. Whether rocketh should have it is not settled, and a half-implementation is worse than the honest absence.
>
> Precedent for the deletion is ADR 0010 (`docs/adr/0010-environments-stay-explicit.md`), which removed a dead block for exactly this reason. Read it before you delete, so your report can cite the rule rather than your taste.
>
> Before deleting, confirm by reading that nothing assigns `skip` anywhere in the executor and that `DeployScriptModule` (`packages/rocketh-core/src/types.ts`) has no `skip` member. If either is false, stop and route to needs-attention.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT. Do not write the done record or the commit message yourself.

## Decisions

- **Empty changeset rather than a patch.** The executor's behaviour is identical: `skip` was always `false`, so the removed branch was always taken. CONTEXT.md asks for an empty changeset when a package is touched but nothing user-visible changed. The alternative was a `rocketh` patch; I rejected it because there is nothing for users to see in a changelog. This only affects release bookkeeping.
- **Example condition in the migration doc uses `env.tags['testnet']`.** I first wrote `'local'` but switched, because `'local'` is already a `Signability` value in `packages/rocketh-core/src/types.ts:689`, and reusing it as a tag name in the docs would give one word two meanings. Environment tags come from the config's `tags` (`ChainUserConfig.tags`), so the comment calls it "a tag you declared in rocketh/config.ts". This touches documentation only.
- **The docs live in the migration guide, not the script-lifecycle page.** A migrating v1 user reads the migration guide first, and it links to `documentation/script-lifecycle/` for the run-once rules instead of repeating them. The script-lifecycle page itself is unchanged.
