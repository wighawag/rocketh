---
title: 'The deployment record must describe the chain, not what this run happened to do'
slug: record-tracks-the-chain-not-this-run
blockedBy: []
covers: []
---

## What was built

A deferred proxy upgrade never updated the proxy's deployment record, so its ABI stayed on the old implementation forever. Found by running `demoes/hardhat-deploy/governance` end to end, captured in `work/notes/observations/deferred-proxy-upgrade-leaves-stale-abi-in-the-record.md`, and fixed here along with the same defect in two sibling packages.

Written retroactively: this was driven interactively, test-first, at the maintainer's request, because the defect was judged urgent. The tests and their red-then-green order are the real record; this file exists so the work is findable.

## Why it is one task and not three

`@rocketh/proxy`, `@rocketh/diamond` and `@rocketh/router` each gated their `env.save` on "did THIS run change something", which is a different question from "does the stored record still describe what is declared and on chain". It is one mistake made three times, with one rule as the fix, so splitting it would have produced three tasks arguing about the same rule.

## The rule

The record describes the chain. Save whenever the stored record disagrees with what is declared and on chain, however it got there, and guard the save so a converged re-run writes nothing.

`numDeployments` counts changes to the RECORD, not transactions rocketh sent. An upgrade executed by a Safe out-of-band counts exactly like one rocketh sent itself, because from the record's point of view the same thing happened.

## Acceptance, as met

- `packages/rocketh-proxy/test/upgrade.integration.test.ts` gains two tests: an out-of-band upgrade refreshes the ABI and ticks the counter to the same value the signable path reaches; a re-run that changes nothing writes nothing and does not move the counter. The first was RED before the fix.
- `packages/rocketh-diamond/test/upgrade.integration.test.ts` gains the equivalent pair for the facet snapshot. RED before the fix. The guard compares facets as well as ABI, because replacing a facet with a new build of the same contract moves addresses while leaving the merged ABI byte-identical, which an ABI-only check would call unchanged.
- `packages/rocketh-router/test/router.test.ts` gains the equivalent pair. RED before the fix, and it needs no governance at all to reach: `extraABIs` widen the merged ABI without touching the router's constructor args.
- `packages/rocketh/test/environment-functions.test.ts` pins `save`'s counter semantics and the renamed `considerItAsFreshDeployment`.
- `pnpm build`, `pnpm typecheck`, `pnpm test` green (958 tests, six new).
- Verified against the original real-world reproduction: the demo's `Registry.json` now carries the v2-only member after the deferred upgrade converges.

## Decisions worth keeping

- **`doNotCountAsNewDeployment` renamed to `considerItAsFreshDeployment`.** The old name promised "do not increment" and did something stronger, asserting a count of 1. Harmless for its two callers (`@rocketh/deploy` recording a CREATE3 address that already holds the right code, `@rocketh/diamond`'s fresh-diamond path), since neither can hold a count above 1, and a trap for the third caller this work nearly added.
- **Guards compare as order-sensitive JSON.** Both sides come from the same merge over the same inputs in the same order, so a genuine no-op reproduces identical output. A comparison that throws counts as different: a redundant save is recoverable, a skipped one is the bug.
- **Router keeps `newlyDeployed: false` on a record refresh.** Nothing was deployed; only the record caught up.

## Fallout, deliberately not fixed here

- `work/notes/observations/numdeployments-is-persisted-only-by-accident.md`. `save()` counts into the in-memory record but writes the uncounted argument, so the field reaches disk only when a caller spreads an object that already had it. Older, orthogonal, and changing it rewrites every user's committed deployment files.
- The four sibling demoes had to move to `workspace:*`, because the `save` signature lives on `Environment` and they were typechecking a workspace `rocketh` against registry extension packages built for the previous signature. That skew was already recorded as a hazard; this is it biting.
