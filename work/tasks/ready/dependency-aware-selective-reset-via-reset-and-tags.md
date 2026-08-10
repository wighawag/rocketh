---
title: 'Dependency-aware selective reset via `--reset --tags`'
slug: dependency-aware-selective-reset-via-reset-and-tags
spec: tag-tracking-selective-reset
blockedBy: [record-script-tags-and-dependencies-on-deployments]
covers: [4, 5, 6, 7, 8, 9]
---

## What to build

> **FORWARD-POINTER (added when this tasking landed, READ FIRST).** Two things landed after this task was written.
>
> 1. **A fork run now REFUSES to reset**, and selective reset must not become a way around that. The guard lives in `createEnvironment` (`packages/rocketh/src/environment/index.ts`) and fires on `fork && reset`, so it already covers `--reset --tags X` as written, because that still sets `reset`. Do not narrow it to "reset without tags" while restructuring, and add a case pinning that a fork run refuses a SELECTIVE reset too. The reason it is a refusal rather than a warning: a fork run reads the simulated network's records and never writes them back, so deleting a subset of them is as destructive as deleting all of them and equally pointless.
> 2. **The confirmation-prompt UX is no longer an open field.** The nits note filed with this tasking warned that the prompt decisions here might collide with then-concurrent ask-policy work. That work has since LANDED, so align with what shipped instead of deciding afresh: `PromptExecutor` (`@rocketh/core` types) with `prompt` for confirmations, the capability signalled by method presence rather than by a TTY probe (ADR 0007), `@rocketh/node` supplying it only when stdin is a terminal, and `--skip-prompts` already meaning "skip any prompts". The existing reset confirmation in `packages/rocketh/src/executor/index.ts` is the one to extend so it states the RESOLVED scope, not a new prompt to invent.

Extend the existing `--reset` + `--tags` CLI options so that combining them performs a **dependency-aware selective reset** instead of the current "delete everything" behaviour. The two options ALONE keep their current meaning; only the combination is new.

End-to-end vertical:

- When BOTH `--reset` and `--tags X[,Y,...]` are passed:
  1. Load the deploy scripts and build the tag→scripts index and the script dependency graph.
  2. Resolve the **scope**: the set of scripts matching any provided tag, PLUS all scripts they (transitively) depend on (forward), PLUS all scripts that (transitively) depend on them (reverse). Reverse resolution is what prevents orphaned deployments pointing at a stale dependency.
  3. From the on-disk deployments for the target environment, select those whose recorded `tags` intersect the scope's tags. Deployments with NO recorded `tags` field (legacy / pre-tracking) are NEVER matched — the safe default.
  4. Show the user the full deletion scope (script tags in scope + concrete deployment names to be deleted + which `.migrations.json` and `.pending_transactions.json` entries will be cleaned) and require confirmation before deleting anything.
  5. On confirmation: delete the selected deployment files AND remove the corresponding entries from `.migrations.json` and `.pending_transactions.json` so no stale bookkeeping remains.
- When `--reset` is passed WITHOUT `--tags`: behaviour is UNCHANGED — delete all deployments for the environment.
- When `--tags` is passed WITHOUT `--reset`: behaviour is UNCHANGED — execute matching scripts, no deletion.

## Acceptance criteria

- [ ] `--reset` alone deletes all deployments (unchanged), verified by an integration test.
- [ ] `--tags X` alone executes matching scripts without deleting anything (unchanged), verified by an integration test.
- [ ] `--reset --tags X` deletes exactly the deployments produced by scripts in the resolved scope (forward deps + reverse deps of tag X), and NO others; verified with a fixture where `feature1` and `feature2` both depend on `core` — `--reset --tags feature1` deletes `feature1`, `core`, AND `feature2`, leaving nothing pointing at a stale `core`.
- [ ] Deployments lacking a recorded `tags` field are NOT deleted by selective reset, even if they happen to sit alongside in-scope deployments; verified by an integration test.
- [ ] `.migrations.json` and `.pending_transactions.json` entries corresponding to the deleted deployments are removed; unrelated entries are preserved; verified by an integration test.
- [ ] The user is shown the full scope (in-scope tags + deployment names + bookkeeping cleanup summary) and prompted to confirm before any deletion occurs; tests exercise both confirm and abort.
- [ ] Multiple comma-separated tags (`--reset --tags X,Y`) resolve as the union of scopes.
- [ ] **Shared-write isolation:** integration tests never touch a real user's on-disk deployments folder / migrations file / pending-transactions file — they operate in a temp/scratch directory and assert that no real shared location is written.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm format:check` all pass.

## Blocked by

- `record-script-tags-and-dependencies-on-deployments` — selective reset matches deployments by their recorded `tags` field, so tag recording must land first (also serialises edits to the executor / environment modules to avoid merge conflicts).

## Prompt

> Self-contained instructions to paste into a fresh agent context.
>
> FIRST, check this task against current reality (launch snapshot may have drifted): confirm the `--tags` and `--reset` options still exist on the CLI in `packages/rocketh-node/src/cli.ts`, confirm the blocking task `record-script-tags-and-dependencies-on-deployments` has landed in `work/tasks/done/` and that `Deployment` now carries `tags` / `dependencies`, and confirm no other reset-scoping work has landed in the meantime. If any assumption is stale, route to needs-attention.
>
> GOAL: teach `--reset --tags X` to perform a dependency-aware selective reset — deleting exactly the deployments related to tag `X`'s scripts, their forward dependencies, and their reverse dependents — with bookkeeping cleanup and a confirmation prompt. `--reset` alone and `--tags` alone are UNCHANGED.
>
> DOMAIN VOCABULARY:
>
> - **scope** = the set of deploy scripts in the "reset zone" for the given tags: matching scripts ∪ their transitive forward `dependencies` ∪ their transitive reverse dependents. Reverse dependents matter because leaving them behind would produce orphaned deployments pointing at a now-deleted / to-be-re-deployed dependency.
> - **matching deployments** = the on-disk deployment files whose recorded `tags` field intersects the tags of scripts in the scope. A deployment with NO `tags` field (a legacy / pre-tracking deployment) is deliberately NEVER matched — this is the "safe default for legacy deployments" decision.
> - **bookkeeping** = `.migrations.json` (script-run record) and `.pending_transactions.json` (in-flight tx record) alongside the deployments folder. Selective reset removes the entries for the deleted deployments; a full `--reset` continues to clear them as it does today.
>
> WHERE TO LOOK (by concept, not brittle paths):
>
> - CLI option definitions and the entrypoint that reads them: `packages/rocketh-node/src/cli.ts`.
> - Executor / environment reset logic in `packages/rocketh/src/executor/` and `packages/rocketh/src/environment/` — this is where the current "delete all" `--reset` behaviour lives and where the new selective branch attaches.
> - Node-side filesystem access for deployments / migrations / pending transactions: `packages/rocketh-node/src/`.
> - Script loading and the dependency graph construction — the executor already resolves `dependencies` when running scripts; the graph you need for scope resolution is either that same structure or derived from the loaded script modules' `tags` and `dependencies`.
> - Integration test style: `packages/*/test/*.integration.test.ts`, using `createTestEnvironment` / `createMockArtifact`.
>
> SEAMS TO TEST AT:
>
> - Fixture with three scripts: `core` (tags `['core']`), `feature1` (tags `['feature1']`, deps `['core']`), `feature2` (tags `['feature2']`, deps `['core']`). Deploy all, then run `--reset --tags feature1`; assert all three deployment sets go away, `.migrations.json` no longer lists any of the three scripts, `.pending_transactions.json` has no stale entries for them, and confirmation was requested.
> - Same fixture, run `--reset --tags core`; assert everything is deleted (core plus both dependents).
> - Legacy-safety: seed a deployment file WITHOUT a `tags` field alongside tagged ones; run `--reset --tags feature1`; assert the untagged deployment is untouched.
> - Prompt abort: user says no → nothing is deleted, exit is clean.
> - `--reset` alone (no tags) still deletes everything; `--tags` alone (no reset) still just executes matching scripts and deletes nothing.
>
> DONE means: the four combinations of `--reset` / `--tags` behave per the spec, bookkeeping is cleaned in the selective case, legacy deployments are safe, confirmation is required, tests green, typecheck + format green.
>
> RECORD non-obvious in-scope decisions durably (per `TASKING-PROTOCOL.md`). Likely candidates: the exact confirmation UX (auto-approve flag? non-interactive stdin?), how "matching deployments" is computed when scripts share tags, exit code on abort, ordering of deletion vs bookkeeping cleanup for crash safety. If any meets the ADR gate, add an ADR under `docs/adr/`.
