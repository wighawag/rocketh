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

## Decisions

- **Where the fork term sits: ABOVE both existing default branches, not inside either.** The resolution is now `explicit param` → `fork ? false` → `no provider ? true` → `name check`. I considered adding it to the named-environment branch (the branch the trap is usually described in), but the no-provider branch short-circuits to `true` before the name is ever consulted, and a fork driven WITHOUT a provider is exactly the `--is-fork` shape (attach to an anvil fork by rpc url), so that placement would have left the hazard live on the one path the rule exists to protect. It is pinned by a test that fails under that alternative. _Touches:_ the future `--is-fork` CLI task, which can now pass a fork input with no provider and inherit the safe default with no extra flag handling.
- **The `helpers.ts` caller guard is REMOVED; the `tasks/deploy.ts` one STAYS.** They are not the same shape, which the task's framing (one guard) does not capture. `loadEnvironmentFromHardhat` passed `isFork ? false : undefined`, so deleting it changes nothing now that core answers `false` for a fork, and deleting it is what proves the rule really moved; passing `false` "as a belt" would hide a future core regression behind a local guard, so leaving it was rejected. `tasks/deploy.ts` is different: its `saveDeployments` is an explicit boolean by construction (it starts at `true`), and an explicit value outranks every default, so core's rule cannot reach that call site at all and removing the clamp would turn a `HARDHAT_FORK` run into an explicit `true` and write into the forked network's records. Both call sites carry a comment saying which case they are. _Alternative considered and rejected:_ reworking `tasks/deploy.ts` to leave the value `undefined` when `--save-deployments` is absent, so core decides there too. It would genuinely centralise the rule, but it also changes NON-fork behaviour (a hardhat network literally named `memory`/`hardhat`/`default` on a non-EDR connection would flip from saving to not saving), and the acceptance criterion is that the hardhat-deploy path behaves exactly as today. _Touches:_ the `--save-deployments` flag, which stays inert on a fork exactly as today; making that flag the fork escape hatch would be a user-visible change to the flag itself and belongs with the `--is-fork` work, not here.
- **ADR 0014 was amended rather than left alone**, with a "Refinement" section plus a "(Closed since…)" clause on the deferral bullet, following the precedent set by commit `54233e9a`, which closed the `overrides.rpcUrl` hazard the same way in the same file. The alternative was a new ADR; this is a consequence of ADR 0014's existing model rather than a new decision, and splitting it would scatter the fork model across two records.
