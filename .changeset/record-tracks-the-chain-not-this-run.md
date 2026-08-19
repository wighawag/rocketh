---
'@rocketh/proxy': patch
'@rocketh/diamond': patch
'@rocketh/router': patch
'@rocketh/core': patch
'rocketh': patch
---

Record a deployment whenever the chain agrees with the target, not only when this run is what changed it.

**The bug.** `deployViaProxy` wrote the proxy's record only inside the branch that performs an upgrade. That answers "did THIS run change anything?", which is a different question from "does the record still describe reality", and the two come apart whenever the upgrade happens somewhere else. For a governed upgrade that is always: the run that wants it throws `UnknownSignerError` at the `_execute` before reaching the save, and the run after governance executes finds the implementation slot already correct and skips the whole branch. No run wrote the record, so it kept the OLD implementation's ABI indefinitely.

That record is what `@rocketh/export` ships to a frontend, what `env.get<Abi>(name)` hands the next script, and what `@rocketh/doc` documents. All three went silently stale, and only for users whose upgrades are governed by a Safe, a timelock or any other account rocketh cannot sign for, which is exactly why it survived: in the ordinary signable flow the upgrade and the save happen in the same run.

Reproduced end to end against a local node with `demoes/hardhat-deploy/governance`: after deferring an upgrade, executing it on the multisig, and re-running to convergence, the chain ran the new implementation while `Registry.json` still described the old one.

**Same defect in `@rocketh/diamond`**, same cause: the save lived inside `if (changesDetected)`. Worth noting the change DETECTION was always right, since it reads the on-chain loupe rather than the record, so a deferred `diamondCut` did converge. Only the record was left behind.

**`@rocketh/router` was affected too, and does not need governance to reach it.** Its save was guarded on `!existingDeployment || router.newlyDeployed`, and `extraABIs` contribute to the merged ABI without reaching the router's constructor args. So adding one was a silent no-op: the router is not redeployed, nothing is saved, and the record keeps an ABI that omits it.

All three now re-record when the stored record disagrees with what is declared and on chain, guarded so an ordinary converged re-run still writes nothing. An upgrade a run actually performs still saves unconditionally: two implementations can differ while their ABIs are identical, so making that save conditional would freeze `numDeployments` on a real upgrade and break `upgradeIndex`, which reads the counter to decide which step of an upgrade sequence has already run.

`upgradeIndex` now has an integration test that runs the story it exists for, `0` then `1` then `2` across separate calls, and asserts the second run broadcasts nothing. Its existing unit tests hand `checkUpgradeIndex` a fabricated record, so they could never have shown that the feature did not survive a reload.

**`numDeployments` counts changes to the RECORD**, whether rocketh made the change or merely observed one made elsewhere. An upgrade executed by a Safe out-of-band therefore counts exactly as one rocketh sent itself, and the deferred path now produces the same record as the signable path, that field included.

**Renamed `save`'s `doNotCountAsNewDeployment` option to `considerItAsFreshDeployment`** (`@rocketh/core` type, `rocketh` implementation). The old name promised "do not increment" and actually did something stronger: it ASSERTS a count of 1. That was harmless for its two callers, which each record something deployed exactly once, and a trap for anyone reaching for it to refresh a record whose history matters, which the work above nearly did. The name now states the behaviour. This is a breaking rename of an option on `Environment.save`; no in-tree caller outside these packages used it.

**`numDeployments` now survives to disk.** `save()` counted into the in-memory record and then wrote the UNCOUNTED argument, so the field reached a file only when a caller happened to spread an object that already carried one. Anything reading it across runs, `checkUpgradeIndex` most of all, was working from a number that silently restarted. It now serialises the counted record.

It is **omitted while the count is 1**, which is the overwhelmingly common case and says nothing. Absent already reads back as 1, since the increment is `(old.numDeployments || 1) + 1`, so this keeps files small rather than introducing a case anyone downstream has to remember. A record reset by `considerItAsFreshDeployment` drops the field again.

Note for anyone with committed `deployments/` folders: the first run after upgrading may rewrite a record that had gone stale and tick its `numDeployments`, which is the fix doing its job. Records that have only ever been deployed once gain nothing, and the occasional file carrying `numDeployments: 1` today will shed it.
