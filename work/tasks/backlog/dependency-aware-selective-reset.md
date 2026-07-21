---
title: Dependency-aware selective reset via `--reset --tags`
slug: dependency-aware-selective-reset
spec: tag-tracking-selective-reset
blockedBy: [record-script-tags-and-dependencies-on-deployments]
covers: [4, 5, 6, 7, 8, 9]
---

## What to build

Extend the executor's reset path so that when BOTH `--reset` AND `--tags X[,Y,...]` are supplied, only the deployments related to those tags are deleted — expanded to include the transitive closure over declared script dependencies in BOTH directions:

- **Forward:** scripts whose tags include any of `X,Y,...`, plus the scripts THEY depend on (their `dependencies` tags), recursively.
- **Reverse:** scripts that depend on any script already in the set (dependents), recursively — so we never leave a dependent pointing at a stale/deleted dependency (no orphans).

Compute the closure by walking script modules' declared `tags` and `dependencies`, and matching against each saved `Deployment`'s recorded `tags` (from the sibling task). Then: (a) show a confirmation prompt listing the full scope of deployments to be deleted, (b) on confirm, delete those deployment files, AND (c) prune the corresponding entries in `.migrations.json` and `.pending_transactions.json` so no stale bookkeeping remains.

Preserve existing behaviour on the other flag combinations:

- `--reset` alone → still deletes ALL deployments for the environment (unchanged).
- `--tags X` alone → still just runs matching scripts, no deletion (unchanged).
- Neither → unchanged.

Legacy safety: a `Deployment` lacking a `tags` field is NEVER matched by selective reset — it is preserved (the user can still opt into a full `--reset` if they want it gone).

End-to-end vertical: CLI flags already exist → executor reset branch detects the `reset + tags` combination → build forward+reverse tag/script closure → resolve to deployment files → confirmation prompt with the full scope → delete files + prune `.migrations.json` + prune `.pending_transactions.json` → integration tests cover every combination and edge case.

## Acceptance criteria

- [ ] `--reset --tags X` deletes only the deployments produced by scripts tagged `X`, their dependency scripts (forward), and their dependent scripts (reverse), transitively.
- [ ] The scope shown in the confirmation prompt matches exactly what is deleted; declining the prompt deletes nothing.
- [ ] `.migrations.json` entries for the deleted deployments are removed; other entries are untouched.
- [ ] `.pending_transactions.json` entries for the deleted deployments are removed; other entries are untouched.
- [ ] `--reset` with NO `--tags` still deletes ALL deployments for the environment (regression guard).
- [ ] `--tags X` with NO `--reset` still only executes matching scripts (regression guard).
- [ ] A pre-existing deployment WITHOUT a `tags` field is NOT deleted by `--reset --tags X`, even if a script with tag `X` exists.
- [ ] Multi-tag deployments (e.g. produced by a script tagged `['foo', 'bar']`) are matched by `--reset --tags foo` AND by `--reset --tags bar`.
- [ ] `--reset --tags X,Y` (multiple tags) computes the union of each tag's closure.
- [ ] Integration tests (mirror the existing `*.integration.test.ts` style) cover: forward-only dep chain, reverse-only dependent chain, mixed (a diamond: `X` depends on `core`, `Y` also depends on `core`; `--reset --tags X` also resets `core` AND `Y`), the no-`tags`-field legacy case, and both flag-alone regressions.
- [ ] `pnpm typecheck`, `pnpm test`, and `pnpm format:check` are green.
- [ ] **Shared-write isolation:** tests that exercise deployment/bookkeeping deletion write ONLY to test-scoped temp fixtures; assert the repo's real deployments directory is untouched after the run.

## Blocked by

- `record-script-tags-and-dependencies-on-deployments` — selective reset matches against the `tags` recorded on each deployment; without those, the closure has nothing to match on.

## Prompt

> Self-contained context. Goal: teach the executor's reset path a new mode — `--reset --tags X` — that deletes ONLY the deployments related to tag `X`, expanded via BOTH forward (dependencies) AND reverse (dependents) closure over declared script tags, plus prunes the matching bookkeeping entries. Existing behaviours of `--reset` alone and `--tags` alone are preserved.
>
> Domain vocabulary: `tags` on a script = self-labels; `dependencies` on a script = tags of other scripts it requires; `--tags` at CLI = the set of tags used to SELECT scripts (either to execute, or — new — to scope a reset). A deployment recorded by the sibling task carries its producing script's OWN `tags` and `dependencies` — that is what selective reset matches on.
>
> Where to look (by concept, not brittle paths):
> - `@rocketh/node` CLI: `--tags` and `--reset` flags already exist; no CLI surface change is required, only how they combine.
> - `rocketh` executor: the reset branch (where "delete all deployments for env" and the confirmation prompt live today). Extend that branch to handle the `reset + tags` combination: build the closure, prompt with the scope, delete on confirm.
> - `rocketh` environment / node executor: the on-disk deployment layout, `.migrations.json`, and `.pending_transactions.json` — the two bookkeeping files that need surgical pruning (not truncation).
> - `@rocketh/test-utils`: `createMockEnvironment` for setting up scripts and deployments in tests.
>
> Closure algorithm (from the spec's Implementation Decisions):
> 1. Seed the tag set with `--tags` values.
> 2. Forward: any script whose `tags` intersect the set → add its `dependencies` tags → repeat until stable.
> 3. Reverse: any script that lists a tag in the set inside its `dependencies` → add its own `tags` → repeat until stable.
> 4. Match deployments whose recorded `tags` intersect the closed set. Deployments with NO `tags` field are NEVER matched (legacy safety).
>
> Seams to test at: run the executor with a fixture set of scripts + deployments in a temp dir; after `--reset --tags X` (auto-confirmed in tests), assert the surviving deployment files, and assert the remaining entries in `.migrations.json` and `.pending_transactions.json`. Use a diamond fixture (`X` → `core` ← `Y`) to prove reverse-closure prevents orphans.
>
> Constraining decisions from the spec (`tag-tracking-selective-reset`):
> - Reuse `--tags` — do NOT add a new `--reset-tags` flag.
> - Confirmation prompt must show the FULL scope (all deployments in the closure) before deleting.
> - Prune, don't blow away, `.migrations.json` and `.pending_transactions.json`.
> - Deployments lacking the `tags` field are safely NOT matched.
>
> "Done" = every acceptance criterion above passes, the sibling task's tag-recording continues to work, and pre-existing `--reset` / `--tags` workflows are behaviourally unchanged.
