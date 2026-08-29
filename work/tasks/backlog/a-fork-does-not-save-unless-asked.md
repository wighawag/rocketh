---
title: 'Move "a fork does not save" into core, so the rule lives in the thing being configured rather than in one caller'
slug: a-fork-does-not-save-unless-asked
blockedBy: []
covers: []
---

## What to build

The trap ADR 0014 deliberately left open, closed before the thing that springs it exists.

A fork run's environment name IS the forked network's, because that is the deployment folder it reads, and reading those records is the whole point of forking. Saving is the other half, and core gets it wrong: `saveDeployments` defaults to `true` for every environment name except `memory`, `hardhat` and `default`, so a fork of mainnet defaults to writing into `deployments/mainnet`. `context.fork` is consulted on no write path at all.

**Nothing is corrupting anything today, and the reason is the part that matters.** The only caller that can currently produce a fork guards it in the CALLER: `packages/hardhat-deploy/src/helpers.ts` passes `saveDeployments: isFork ? false : undefined`. So the knowledge that the two must be paired lives in one plugin rather than in the thing being configured, and any second caller that constructs a fork input and forgets the second argument gets production-record corruption with no warning.

So move the rule INTO core: **a fork implies `saveDeployments: false` unless explicitly overridden.** Same reasoning that replaced `pushUnknownSignerPolicy`/`popUnknownSignerPolicy` with a single scoping verb, and that named `whenForked` rather than `fork`: prefer making the mistake unrepresentable over documenting the pairing.

**The explicit override must still win**, in the direction that is actually reachable. `executionParameters.saveDeployments` is consulted FIRST and an explicit `true` must keep saving even on a fork, because "I know what I am doing, write it" has to remain expressible. Note the CLI's `--save-deployments` is a set-only boolean with no `--no-save-deployments` counterpart, so on a fork the flag is the only way to turn saving ON, which is exactly the right shape once the default is off.

**Read the existing resolution before changing it, because it has a branch that will bite.** The default is not one expression: when there is NO provider it short-circuits to `true` before the environment-name check is ever reached. A fork run driven without a provider is precisely the `--is-fork` case, so a fork term added only to the named-environment branch would leave the hazard live on the one path this task exists to protect. Confirm both branches.

**Do not invent a fork-saves-elsewhere behaviour.** If a fork run should ever save, it must be somewhere other than the forked network's folder, and that is a separate decision nobody needs yet. This task makes the default safe; it does not add a destination.

**A shipped page currently states this as a non-goal and will become wrong.** `documentation/fork-runs/index.md` has a section "Saving is unchanged" that tells the reader core would save and that the hardhat plugin suppresses it in the caller. Landing this makes that false, so update it in the same change: a page that documents a hazard which no longer exists is worse than one that never mentioned it.

**Decide what happens to the plugin's own guard** and say why in your report. Leaving it is harmless and defensive; removing it proves the rule really moved. Either way the hardhat-deploy path must behave identically, and that must be TESTED rather than reasoned about, since it is the one path with real users today.

## Acceptance criteria

- [ ] A fork run does NOT save by default, so it cannot write into the forked network's deployment folder
- [ ] This holds on the no-provider path as well as the named-environment path, since a fork driven without a provider is the case the rule exists to protect. Tested on both, because a fix to only one still passes a single-path test
- [ ] An explicit `saveDeployments: true` still saves on a fork, so the escape hatch stays expressible
- [ ] A NON-fork run's saving behaviour is completely unchanged, including the `memory`/`hardhat`/`default` names and the no-provider case. Tested, so nothing was loosened while the fork case was tightened
- [ ] The hardhat-deploy path behaves exactly as it does today, tested rather than reasoned about
- [ ] A fork still READS the forked network's records: the read path is untouched and still skips the chain-identity check. Tested, since this is the property the whole feature exists for and it sits next to the code being changed
- [ ] The "Saving is unchanged" section of `documentation/fork-runs/index.md` is updated to describe the shipped behaviour, including how to save deliberately
- [ ] A changeset accompanies the change
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass

## Blocked by

Nothing.

## Prompt

> Goal: make it impossible to corrupt a real network's deployment records by forgetting an argument, by moving the rule into the thing being configured.
>
> FIRST, check this task against current reality (it is a snapshot and may have DRIFTED). Confirm that `saveDeployments` still defaults as described in `resolveExecutionParams`, that the no-provider branch still short-circuits before the environment-name check, and that `packages/hardhat-deploy/src/helpers.ts` still passes `saveDeployments: isFork ? false : undefined`.
>
> READ FIRST: `docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md`, which records why a fork is the forked network for RECORDS and not for chain identity, and which explicitly defers this change to a later task (this one).
>
> Keep the READ path exactly as it is. A fork reading the forked network's records is correct and is the entire point of forking; only saving is wrong. If you find yourself touching the chain-identity skip at load time, stop: that is the wrong file.
>
> Done means: a fork cannot silently write into the network it simulates, a caller that wants it to can still say so, and the rule is stated once in core rather than replicated in every caller that learns to fork.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT: where exactly you placed the fork term relative to the two existing branches, and what you did with the hardhat-deploy caller guard and why. Do not write the done record, the commit message or the PR body, and do not edit this task file.
>
> Write any markdown emphasis in that block with UNDERSCORES (`_like this_`), not asterisks: the runner transcribes it verbatim into a file the repo's format gate checks, and `format:check` is the first link of that gate.
