---
title: 'rocketh never writes `history`, so half of `checkUpgradeIndex` is unreachable and four of its unit tests cover dead code'
type: observation
status: spotted
spotted: 2026-08-19
needsAnswers: true
---

# `checkUpgradeIndex` reads a field nothing in rocketh ever writes

Spotted while answering "how does `checkUpgradeIndex` compare to hardhat-deploy v1". The decision function is a faithful port. Its INPUTS are not.

## What was compared

`packages/rocketh-proxy/src/utils.ts:4-52` against v1's `_checkUpgradeIndex` at `hardhat-deploy-v1/src/helpers.ts:985-1038`. **Identical branch for branch**, including all five error message strings verbatim. The only differences are cosmetic: rocketh hoists `history` and `numDeployments` into locals and casts them.

## The divergence is in what feeds it

`checkUpgradeIndex` decides from two fields, `history` first and `numDeployments` second.

**v1 writes `history`** in four places (proxy upgrades at `src/helpers.ts:1573` and `:1602`, diamonds at `:2446` and `:3450`, each `history.concat([oldDeployment])`) and persists it through `src/DeploymentsManager.ts:879`.

**rocketh writes it nowhere.** Searching `packages/*/src` for `history` returns only the two READS inside `checkUpgradeIndex` itself. In `@rocketh/diamond` the equivalent code is commented out with `// TODO reenable history with options` (`src/index.ts:528-532`). It is not even declared on the `Deployment` type, which is why `utils.ts` reads it through `as any[]` and compiles only because `Deployment` ends in `& Record<string, unknown>`.

So `oldDeployment.history` is permanently `undefined`, every `history` branch is unreachable, and `numDeployments` is the only live source of truth.

## Consequences

- **Four unit tests cover code that cannot run.** In `packages/rocketh-proxy/test/utils.test.ts`: "returns the existing deployment when history is non-empty" under `upgradeIndex === 1`, and all three under `upgradeIndex > 1` / "with history". They pass, they are green, and they protect nothing.
- **The unit tests could not have caught the real defect.** They hand `checkUpgradeIndex` a fabricated record (`deployment({numDeployments: 2})`), so nothing ever checked that a real saved-and-reloaded deployment carries the number it reads. It did not, until `numDeployments` was made to persist. That is why an integration test running the actual upgrade story was added alongside.
- **Before persistence landed, `upgradeIndex >= 2` threw for everyone.** Trace it: `history` undefined takes the `!history` branch, `numDeployments` undefined fails `numDeployments && numDeployments > 1`, and the `else` throws `upgradeIndex > 1 : expects Deployments history to exists, or numDeployments to be greater than 1`. `upgradeIndex === 1` failed more quietly, always returning "proceed" instead of ever recognising the step as done.

## The decision this leaves open

`upgradeIndex` exists so a deploy script can tell the story of an upgrade and stay idempotent, every step kept in the script forever, each running exactly once. v1's README: "allow you to breakdown your upgrades into separate deploy script, each with their own index. A deploy call with a specific upgradeIndex will be executed only once, only if the current upgradeIndex is one less." The same property lets a test replay an upgrade sequence from scratch.

With `numDeployments` persisted the feature now works on the counter alone, so `history` is not required for it. But the option's behaviour is documented and typed as if `history` participates, and one of two things should happen:

- **reinstate it**, which is what the diamond TODO intends and what v1 does, giving richer information than a bare count (each entry is the previous deployment); or
- **delete the branches and the four tests**, and say plainly that the current upgrade index comes from `numDeployments`.

Leaving it as-is means a reader of `checkUpgradeIndex` cannot tell that half of it is decoration. Not decided here.

## Related

- `work/notes/observations/numdeployments-is-persisted-only-by-accident.md`, the input that was broken.
- `work/tasks/done/record-tracks-the-chain-not-this-run.md`, where the persistence fix and the integration test landed.

## Update, 2026-08-19: decided, removed

The maintainer chose **delete, not reinstate**: `numDeployments` is the sole mechanism.

`checkUpgradeIndex` collapsed to a single comparison as a result, because the two-source shape was the only thing making it complicated. `numDeployments` is how many steps of the story have run, so it is also the index of the step due next, and there are exactly three outcomes: more steps recorded than the index asked for means the step already ran (skip), exactly that many means it is due (proceed), fewer means its predecessors have not run (throw). The former special cases for `upgradeIndex === 0` and `=== 1` fall out of that rule rather than needing their own branches.

Behaviour is unchanged for every reachable case. Verified by hand against the old implementation across the whole matrix (no record, record with counter 1..N, counter absent, index 0/1/2+), including that a record with no `numDeployments` still counts as exactly one step, which is what carries records written before the counter was persisted.

The error messages DID change, necessarily: the old ones advertised `history`, a field users had no way to produce. They now name the index asked for, how many steps have actually run, and which step is missing. This is a deliberate divergence from v1's strings, on the grounds that matching v1 word for word is worth less than not lying.

Removed with it: the four unit tests covering unreachable branches, and the commented-out `// TODO reenable history with options` block in `@rocketh/diamond` (`src/index.ts`). One test was ADDED in their place, asserting that a leftover `history` field, hand-written or inherited from a v1 project, is now ignored rather than quietly changing the answer.
