---
title: 'Many instances of one deployment on one network, with a shared layer (what Vesper built by shuffling folders)'
slug: many-instances-of-one-deployment-on-one-network
---

# Idea: deploy the same scripts many times on one network, with a layer they all share

Status: proposed, not scheduled. Raised by `work/notes/findings/v1-protocol-deploy-and-governance-patterns.md` (Vesper section, and open question 3).

## What a real project does today, under hardhat-deploy v1

Vesper deploys one set of scripts once PER POOL on the same network. Every pool writes records with the same names (`PoolAccountant`, the pool, `PoolRewards`, strategies), so one `deployments/<network>/` folder cannot hold two pools. Their `deploy-core-contracts` task (`vesperfi/vesper-contracts`, `vesper-deployments/tasks/deploy-core-contracts.js:145-204`) therefore builds the folder for each run out of three layers, then takes it apart again:

- `deployments/<network>/<pool>/`: that pool's own records;
- `deployments/<network>/global/<deployer>/`: the admin contracts ("Upgraders") owned by a given account, shared by every pool that account administers;
- `deployments/<network>/global/`: implementations shared by every pool (filtered: only those whose `VERSION` still matches are reused).

It copies all three into `deployments/<network>/`, runs `hardhat deploy`, copies the results back out by file pattern (pool records to the pool folder, Upgraders to the owner folder, implementations to `global/`), and deletes the working copy. A pool is selected with `--pool`.

## What rocketh offers today, and where it falls short

One environment per pool on the same chain gives each pool its own folder and its own `data` (resolved by environment name first). Shared contracts can be deployed deterministically, so each pool's environment finds the same address and records it. That covers the NEW-project case, if every shared contract can be deterministic.

It falls short when:

- a shared contract is not deterministic (Vesper's Upgraders are nonce-deployed today), so each environment would deploy its own;
- a migrating project has existing records in the layered shape and wants rocketh to read them as they are, rather than re-recording every shared contract in every pool's folder;
- something needs to see ALL instances at once (an export for a frontend listing every pool, a script that touches every pool);
- the shared layer must be written by one run and read by the others, with one place where a shared record changes.

## Possible shapes (not decided)

1. **Read-only parent environments.** `environments.vdai = {chain: 1, inherits: ['mainnet-shared']}`: a record missing from `vdai` is looked up in `mainnet-shared`. Writes go to the run's own environment, or to the parent for names declared shared. Small, and close to Vesper's layers, but "which layer does this save go to" needs a rule.
2. **Namespaces inside one environment.** A run selects an instance (`--instance vdai`), and names are resolved as `vdai/PoolAccountant` before `PoolAccountant`. One folder, all instances visible to an export, but every name lookup gains a fallback rule and the record names change.
3. **A layered `DeploymentStore`.** Done entirely by the `@rocketh/node` store: a store composed of several folders, reads falling through, writes routed by a predicate. No core change, but the routing predicate is the hard part, and it is invisible in the scripts.

## Open questions

- Is this common beyond one project? A second team with "the same scripts, N instances, shared admin" would make this worth building; until then the environment-per-instance answer plus documentation may be enough.
- How do layered reads interact with ADR 0012 (a record asserts only what rocketh observed) and with fork runs (which read but do not write the simulated network's records)?
- Does an instance belong in the environment NAME (option 1), or is it a separate axis from the network (option 2)?
