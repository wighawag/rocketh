---
title: "`--reset` on a FORK run deletes the forked network's deployment folder, even though a fork never writes to it"
type: observation
status: spotted
spotted: 2026-08-30
---

A fork run takes the forked network's environment NAME (`getEnvironmentName`, `packages/rocketh/src/executor/index.ts`), and `loadDeployments({reset})` calls `deploymentStore.deleteAll(deploymentsFolder, environmentName)` with no fork term and no `saveDeployments` guard (`packages/rocketh/src/environment/index.ts`, around line 2077). So `rocketh -e mainnet --is-fork --reset` deletes `deployments/mainnet/` (records, `.chain` and `.migrations.json`) before rehearsing, while the fork-does-not-save rule makes sure the run puts nothing back.

Spotted while documenting `.migrations.json` for `document-migrations-and-run-at-the-end`; not investigated further. The CLI's default confirmation does name the environment ("This will delete all deployments for env: mainnet"), so it is not silent unless `--skip-prompts` is passed, and committed deployments make it recoverable with a checkout, which is the same mitigation recorded in `an-anvil-fork-is-indistinguishable-from-mainnet-and-the-cli-will-save-into-it.md`.
