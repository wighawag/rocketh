# Branch: references/proxies.md, what an upgrade calls

## Prompt

Staking V2 needs `recomputeRewards()` called once right after the upgrade. Wire that into the deploy and upgrade it on sepolia.

## A run that follows the skill

- changes the existing `deployViaProxy` call, under the same name, to the explicit `execute: {init, onUpgrade}` form with `recomputeRewards` as `onUpgrade`, keeping the original `init`;
- does not use the flat `execute` form, which would call it again on every later upgrade and on a fresh deployment;
- tells the user `onUpgrade` is made on every later upgrade of this script too, so the call must be safe to repeat or be replaced with the next version;
- checks who holds the upgrade right before the run, and applies the storage-layout check and the fork rehearsal of `SKILL.md`.
