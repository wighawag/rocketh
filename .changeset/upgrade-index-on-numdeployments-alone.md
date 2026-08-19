---
'@rocketh/proxy': patch
'@rocketh/diamond': patch
---

`upgradeIndex` now works from `numDeployments` alone, and says something useful when it refuses.

`checkUpgradeIndex` was a faithful port of hardhat-deploy v1's, which consults a `history` array first and falls back to a counter. rocketh has never written `history`: not in `@rocketh/proxy`, not in `@rocketh/diamond` (where the code sat commented out behind a TODO), and the field is not even on the `Deployment` type. So half of that function could not run, and its error messages told users to produce a field they had no way to produce.

Removed rather than reinstated. `numDeployments` counts how many times the record has been written, which is exactly how many steps of the upgrade story have run, and therefore the index of the step due next. That leaves one comparison with three outcomes: more steps recorded than the index asked for means this step already ran, so hand back the existing deployment; exactly that many means it is due, so proceed; fewer means its predecessors have not run, so throw instead of applying an upgrade out of order. The old special cases for index `0` and `1` fall out of the same rule.

Behaviour is unchanged for every case that could actually occur, including a record with no `numDeployments`, which still counts as exactly one step and is what carries deployments recorded before that field was persisted.

**The error messages changed**, and deliberately diverge from v1's wording. They used to say `expects Deployments history to exists, or numDeployments to be greater than 1`, naming a field rocketh does not maintain. They now name the index that was asked for, how many steps have actually run, and which step is missing. Matching v1 word for word is worth less than not misleading the reader.

Worth knowing if you use `upgradeIndex`: combined with `numDeployments` now persisting, a sequence of steps kept in a deploy script is idempotent across runs for the first time. Previously `upgradeIndex: 1` would redo its upgrade on every run and `upgradeIndex: 2` or higher would throw, because the counter it depends on never survived to disk.
