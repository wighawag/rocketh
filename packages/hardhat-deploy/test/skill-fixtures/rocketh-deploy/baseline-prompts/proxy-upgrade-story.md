# Branch: references/proxies.md, an upgrade story kept with `upgradeIndex`

## Prompt

The Counter script keeps every version so a fresh chain replays the upgrades. Add the V3 upgrade.

## A run that follows the skill

- appends a third `deployViaProxy` call with `upgradeIndex: 2` and the V3 artifact, leaving steps 0 and 1 exactly as they are;
- reads `numDeployments` in the environment's `Counter.json` to know which step a run on that environment will execute;
- does not replace the earlier steps with the new artifact.
