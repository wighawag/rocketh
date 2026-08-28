---
title: 'A forked anvil is INDISTINGUISHABLE from mainnet to rocketh, so the CLI reads mainnet deployments happily and then SAVES fork results into them'
type: observation
status: spotted
spotted: 2026-08-27
---

# The scenario

Start a fork with the node's own CLI and point the rocketh CLI at it, with no hardhat-deploy plugin in the loop:

```sh
anvil --fork-url $ETH_NODE_URI_MAINNET     # 127.0.0.1:8545
rocketh -e mainnet                          # there is no --fork flag today
```

# What happens, and it is worse than an error

Every identity check PASSES, because a forked anvil is not distinguishable from mainnet by any of them:

- **chain id.** anvil preserves the forked chain's id, so it answers `1`. Verified live.
- **genesis hash.** anvil serves the REAL mainnet genesis for block `0x0`, `0xd4e5…8fa3`. Verified live against a running fork; this is the surprising half, since a fork pinned at a recent block has no local block 0 and might have answered anything.

So `loadDeploymentsFromStore`'s guard is satisfied on both fields, and the run loads `deployments/mainnet/` believing it is on mainnet. Settings come from `chains[1]`, which is correct. Transactions declare chain 1, which is correct. Everything is correct except the last step.

**`saveDeployments` defaults to TRUE.** It resolves to `false` only for the environment names `memory`, `hardhat` and `default`; `mainnet` is none of those, and a provider is present, so it is `true`. The run therefore WRITES its fork deployments into `deployments/mainnet/`, overwriting the real records with addresses that exist only on a throwaway node. Nothing warns, because from rocketh's point of view nothing unusual happened.

The one thing that would have stopped it, `context.fork`, is FALSE here: the environment was given as a string, so the run is not flagged as a fork at all. And the CLI has no way to say otherwise, because `--fork` does not exist.

# Why this is not the trap already recorded

`what-fork-actually-does-today.md` records that core would save a fork run into the forked network's folder while the hardhat-deploy caller suppresses it, and calls that a trap laid for the future `--fork` path rather than a live bug. **This is a different and live one**: it does not need the fork mechanism at all, it needs only a forked anvil and the CLI as it ships today. The fork-does-not-save rule would not even fire, because the run is not marked as a fork.

# The contrast with a hardhat node, which is safe by accident

```sh
npx hardhat node --fork <mainnet>   # reports chain id 31337
rocketh -e mainnet
```

throws immediately: `Loading deployment from environment 'mainnet' (with chainId: 1) for a different chainId (31337)`. Unusable, but it cannot corrupt anything. Note the chain-id comparison happens BEFORE the genesis-hash branch, so the `deleteDeploymentsIfDifferentGenesisHash` deletion path is unreachable here; a mainnet folder cannot be auto-deleted by a 31337 node.

So the two tools fail in opposite directions: hardhat is too strict to be useful, anvil is too convincing to be safe.

# What it implies for the plan

`work/notes/ideas/fork-based-discovery-of-pending-privileged-work.md` puts both halves of the fix in Track B and describes `--fork` as audience expansion rather than a prerequisite. This finding argues they are the protection for a live footgun rather than a convenience:

- `--fork` is what lets an anvil user SAY the run is a fork, which is the only thing that distinguishes it from mainnet.
- Moving "a fork does not save" into core is what makes saying so protective.

Neither is urgent for the hardhat-deploy audience, who are guarded in the caller. Both are the difference between a safe rehearsal and overwritten production records for anyone using the CLI.
