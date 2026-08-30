---
'rocketh': patch
---

A fork run now REFUSES to reset instead of deleting the simulated network's deployment records. A fork run is the forked network for RECORDS (ADR 0014), so its deployment folder is keyed by the simulated network's name, while "a fork does not save" guarantees the run writes nothing back. `rocketh -e mainnet --is-fork --reset` therefore deleted `deployments/mainnet/` (records, `.chain` and `.migrations.json`) and then rehearsed against nothing, which no user can have wanted, so the combination is refused rather than warned about. The error names the network whose records were at stake and is raised while the environment is built, before the executor asks the user to confirm the deletion. Every route into fork mode is covered (`--is-fork`, `HARDHAT_FORK`, a configured fork input), and a reset on a run that is not a fork is unchanged.
