---
title: Tag Tracking and Selective Reset
slug: tag-tracking-selective-reset
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/backlog/` slices. (Migrated from `.kilo/plans/1778240550544-cosmic-squid.md` during work/ setup.)

## Problem Statement

When a deploy script runs, the **tags it declares** and the **dependency tags it requires** are not recorded on the resulting deployment files. As a result:

- You cannot tell which tags were responsible for a given deployment.
- You cannot understand script dependencies after the fact.
- You cannot safely reset _only some_ deployments: `--reset` deletes ALL deployments for an environment, and there is no way to reset a subset without risking a broken state.

Concretely, a user who wants to re-run just one feature's deployments has no safe path. If `feature1` and `feature2` both depend on `core`, resetting `feature1` (and therefore `core`) would leave `feature2` pointing at a stale `core` — an orphaned, broken deployment.

## Solution

Two related capabilities:

1. **Tag & dependency tracking** — when a script runs, record the script's own declared `tags` and its declared `dependencies` (as tags) onto each deployment it saves. Both are optional fields, so existing deployments stay valid.

2. **Dependency-aware selective reset** — reuse the existing `--tags` option so that `--reset --tags X` deletes the deployments from scripts with tag `X`, the scripts they depend on (forward), AND the scripts that depend on them (reverse) — then requires confirmation showing the full scope. `--reset` alone keeps its current "delete all" behaviour; `--tags` alone keeps its current "execute matching scripts" behaviour.

## User Stories

1. As a deployer, I want each deployment to record the tags of the script that produced it, so that I can tell which tags drove which deployments.
2. As a deployer, I want each deployment to record the dependency tags its script declared, so that I can understand the dependency graph after the fact.
3. As a deployer, I want a deployment created by a _dependency_ script to carry _its own_ tags (not the triggering tag), so that deployment content is independent of how it was triggered.
4. As a deployer, I want `--reset --tags X` to delete only the deployments related to tag `X` (plus its dependencies and dependents), so that I can re-run a subset without nuking everything.
5. As a deployer, I want selective reset to also remove dependents of the reset scripts, so that I never end up with orphaned deployments pointing at stale dependencies.
6. As a deployer, I want `--reset` without `--tags` to still delete all deployments, so that existing workflows are unchanged.
7. As a deployer, I want `--tags X` without `--reset` to still just execute matching scripts, so that existing workflows are unchanged.
8. As a deployer, I want selective reset to clean up `.migrations.json` and `.pending_transactions.json` entries for the deleted deployments, so that no stale bookkeeping remains.
9. As a deployer with pre-existing deployments lacking the `tags` field, I want them to be safely _not_ matched by selective reset, so that I am never surprised by an over-broad delete.

### Autonomy notes (the two gate axes)

- **`humanOnly`** — omitted: this Spec can be sliced by an agent (the design is concrete and the open questions are resolved). The human may still choose to drive slicing.
- **`needsAnswers`** — omitted: the source plan's open questions are all resolved (see Implementation Decisions). The spec is complete enough to slice.

## Implementation Decisions

Decisions carried over from the source plan (all "Open Questions" were resolved there):

- **Record only the script's OWN declared tags** on deployments — not the "executing"/triggering tag. Deployment content must be independent of how it was triggered.
- **Track declared dependency tags** (`scriptModule.dependencies`), not runtime deployment accesses.
- **Reuse `--tags`** for selective reset rather than adding a new `--reset-tags` flag.
- **Reverse dependency resolution:** selective reset resolves forward dependencies AND finds dependent scripts (reverse lookup) so dependents are reset too, preventing orphans.
- **Bookkeeping cleanup:** on selective reset, delete the corresponding `.migrations.json` and `.pending_transactions.json` entries.
- **Setter approach:** the executor passes the current script's tags/dependencies to the environment via setter methods on the `Environment` interface, called before executing each script; `save` reads them when persisting a deployment.
- **Safe default for legacy deployments:** deployments without a `tags` field are not matched by selective reset (user may still need a full reset).

Modules involved (from the plan): `rocketh-core` types (`Deployment`, `Environment`), `rocketh` environment + executor, `@rocketh/node` CLI (already exposes `--tags`).

## Testing Decisions

- Verify deployments created by a tagged script record those tags; multiple tags all recorded.
- Verify dependency scripts' deployments carry their OWN tags, not the triggering tag.
- Verify `--reset` (no tags) still deletes all; `--tags` (no reset) still executes normally.
- Verify `--reset --tags X` deletes tag `X`'s deployments, their dependencies, and their dependents (reverse).
- Edge cases: deployments with no tags (not deleted), deployments with multiple tags.

## Out of Scope

- Tracking runtime deployment _accesses_ (vs declared dependency tags).
- Any CLI surface change beyond reusing `--tags` (the option already exists).

## Further Notes

Backward compatible throughout: `tags`/`dependencies` are optional on `Deployment`; selective reset is opt-in via `--reset --tags`; default behaviours of `--reset` and `--tags` are unchanged.
