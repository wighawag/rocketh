---
title: "A fork run still dials `environments[<name>].overrides.rpcUrl`, which for a named network is that network's REAL endpoint"
type: observation
status: spotted
spotted: 2026-08-28
---

Spotted while building `fork-config-sub-key-on-the-environment`, which stopped a fork's endpoint coming from `chains[31337]` but deliberately left the `overrides` layer alone (that layering, chain config then `overrides` then `whenForked`, is what the task asked for).

The override layer still supplies the connection endpoint on a fork run, and on the environment of a real network that endpoint is the real network's. Verified by running `resolveExecutionParams` with `environments: {mainnet: {chain: 1, overrides: {rpcUrl: 'https://production.invalid/override'}}}` and `{fork: 'mainnet'}`: the built provider's endpoint is `https://production.invalid/override`, i.e. a fork run pointed at production rather than at the fork. Writing `whenForked: {rpcUrl: ...}` fixes it, because the fork layer wins, but nothing says so and the default is the dangerous one.

It is latent rather than live today: the only caller that can fork (hardhat-deploy) always passes a `provider` on the execution params, and a provider beats any `rpcUrl` in the merge. It becomes reachable on the `--is-fork` CLI path, which is exactly the path that attaches to an anvil fork with no provider of its own. Related: the file comment in `resolveExecutionParams` already calls "a fork run pointed at the forked network's public endpoint" the worst outcome that file can produce.
