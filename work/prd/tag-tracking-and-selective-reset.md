---
title: Tag Tracking and Selective Reset
slug: tag-tracking-and-selective-reset
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/backlog/` slices. Migrated from `.kilo/plans/1778240550544-cosmic-squid.md` and the third `TODO.md` item.

## Problem Statement

When a deployment script runs, the tags and dependencies it declares are not recorded on the resulting deployment files. As a result, given a saved deployment there is no way to know which tags produced it or which other scripts it depended on.

This makes selective reset impossible to do safely. Today `--reset` deletes ALL deployments for an environment. A user who wants to reset only some deployments (by tag) has no safe way to do so: resetting a deployment that others depend on would silently leave those dependents pointing at a stale/old deployment — a broken state.

## Solution

Two related capabilities, from the user's perspective:

1. **Record provenance on deployments.** Every saved deployment records the declaring script's own `tags` and its declared dependency tags, so a deployment carries the information needed to reason about resets.
2. **Tag-aware selective reset.** Reuse the existing `--tags` option so that `--reset --tags X` deletes the deployments from scripts with tag `X`, their dependencies, AND the scripts that depend on them (reverse dependency), showing the full scope and requiring confirmation — never leaving orphaned/broken dependents. `--reset` alone keeps deleting everything; `--tags X` alone (no `--reset`) keeps meaning "run scripts with tag X".

## User Stories

1. As a deployer, I want each deployment to record the tags of the script that produced it, so that I can later see which tags a deployment belongs to.
2. As a deployer, I want each deployment to record its script's declared dependency tags, so that reset tooling can reason about the dependency graph.
3. As a deployer, I want a deployment produced by a *dependency* script to record that script's OWN tags (not the triggering tag), so that deployment content is independent of how the run was triggered.
4. As a deployer, I want all of a script's tags recorded when it declares several (e.g. `['X','Y']`), so that none are lost.
5. As a deployer, I want `--reset` with no tags to keep deleting all deployments, so that existing behaviour is preserved.
6. As a deployer, I want `--reset --tags X` to delete deployments from scripts tagged `X` and their (forward) script dependencies, so that I can reset a feature and what it builds on.
7. As a deployer, I want `--reset --tags X` to ALSO delete deployments from scripts that depend (transitively) on the reset scripts, so that I never leave an orphaned deployment pointing at a deleted dependency.
8. As a deployer, I want the full scope of a selective reset shown and confirmed before deletion, so that I do not accidentally delete more than intended.
9. As a deployer, I want `.migrations.json` entries for deleted deployments cleaned up during selective reset, so that migration state stays consistent.
10. As a deployer, I want `.pending_transactions.json` entries for reset deployments cleaned up, so that pending-transaction state stays consistent.
11. As a deployer, I want `--tags X` without `--reset` to keep executing scripts (unchanged), so that nothing regresses.
12. As an existing user, I want the new `tags`/`dependencies` deployment fields to be optional, so that deployments saved before this feature keep working (and are simply not matched by selective reset — a safe default).

## Implementation Decisions

> Trimmed at slice-time: this detail moves into the slices and, where it's a durable rationale, into an ADR. It is here only to seed the slicing. The original kilo plan carried fuller code sketches — they are intentionally NOT copied verbatim (they would go stale); the decisions below are the durable part.

- Add optional `tags` and `dependencies` (both `readonly string[]`) to the `Deployment` type in `@rocketh/core`.
- Add `setCurrentScriptTags` / `setCurrentScriptDependencies` setters to the `Environment` interface; the executor calls them before each script runs, and `save` stamps the current values onto the deployment.
- `dependencies` records the script's *declared* dependency tags (`scriptModule.dependencies`), NOT runtime deployment accesses.
- Selective reset runs in the executor BEFORE deployments are loaded: resolve the set of script ids/tags to delete (forward dependency resolution + reverse dependent lookup), delete matching deployment files by tag, then clean migrations + pending transactions, then load with reset already handled.
- No new CLI option: reuse `--tags` (already present in `@rocketh/node`'s CLI).

### Autonomy notes (the two gate axes)

The kilo plan resolved its open questions (recorded in its "Open Questions (Resolved)" section), so the spec is reasonably complete. It is left for a HUMAN to slice (it touches core types + executor semantics + a destructive operation), but is not flagged `needsAnswers` — the design decisions are made. Set slice-level gates per slice nature when slicing.

## Testing Decisions

> Also trimmed at slice-time.

- Tag/dependency tracking: assert deployments created by tagged scripts record those tags; assert dependency scripts record their OWN tags; assert multiple tags are all recorded.
- Selective reset: `--reset` (no tags) still deletes all; `--reset --tags X` deletes tag X + forward deps; reverse dependents are included; deployments with no tags / multiple tags handled; `--tags X` alone unchanged.
- Note (from the code review): integration-test mock currently always reports `newlyDeployed: true`, which limits idempotent-behaviour testing — selective-reset tests may need real-FS fixtures rather than the mock.

## Out of Scope

- A separate `--reset-tags` option (deliberately rejected — reuse `--tags`).
- Tracking runtime deployment accesses as dependencies (only declared dependency tags are recorded).

## Further Notes

Source: `.kilo/plans/1778240550544-cosmic-squid.md` (full plan) + `TODO.md` line 3. The kilo plan contains detailed function-level code sketches (`getScriptsAndTagsToDelete`, `deleteDeploymentsByTags`) and a phased implementation order — consult it for the original detail when slicing, but treat its code snippets as illustrative, not binding.
