---
title: 'What a forked node reports about its own identity: anvil preserves the forked chain, hardhat does not'
slug: fork-node-chain-identity-behaviour
source: 'Measured locally on 2026-08-27 against anvil 1.5.1-stable (commit b0a9dd9) forking Ethereum mainnet via https://ethereum-rpc.publicnode.com, by raw JSON-RPC; plus hardhat 3.12.0 read from its own resolution code in node_modules. Commands and responses reproduced below.'
---

# Why this note exists

Several rocketh artifacts now branch on how a forked node answers questions about its own identity: the fork spec, ADR 0014, the `fork-*` build tasks and two observations. Those numbers were measured rather than looked up, and one of them was nearly recorded backwards, so they belong in a citable place with their provenance rather than being repeated from memory.

# anvil PRESERVES the forked chain's identity

Forking mainnet with no chain-id override:

```
anvil --fork-url <mainnet endpoint>
```

- **Its own banner reports `Chain ID: 1`.**
- `eth_chainId` answers `0x1`.
- `eth_getBlockByNumber('0x0', false)` answers with the REAL mainnet genesis hash, `0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3`. This is the surprising one: a fork pinned at a recent block has no local block 0, and it serves the genuine one rather than a synthetic or empty answer.

So along every axis rocketh knows how to interrogate, a forked anvil is **indistinguishable from mainnet**. `--chain-id` overrides the first two; nothing observed here changes the third.

# hardhat does NOT

hardhat 3.12.0's `resolveEdrNetwork` (in `internal/builtin-plugins/network-manager/config-resolution.js`) sets `chainId: networkConfig.chainId ?? 31337`, and the forking configuration is resolved separately by `resolveForkingConfig`, which never feeds the chain id. `EdrNetworkForkingUserConfig` is `{enabled?, url, blockNumber?, httpHeaders?}`: no chain-id field at all.

So a hardhat node forking mainnet reports **31337** unless the user sets `chainId` explicitly on that network. `addForkConfiguration` in `packages/hardhat-deploy/src/helpers.ts` sets `accounts` and `forking` on the generated `fork` network and does NOT set `chainId`, so rocketh's hardhat users are on the 31337 answer today.

# The methodological warning that comes with the anvil number

The first attempt to measure it queried port 8546, which was already held by an unrelated process, and cheerfully returned `31337` with a plausible block number. Believed, that would have recorded the exact opposite of the truth for anvil and inverted a design decision built on it. The number came from somebody else's node. Check what is listening before trusting a local RPC answer.

# What this constrains, in one line each

- A fork's transactions must declare the id the NODE reports, since a signed transaction commits to it and the node rejects a mismatch. The two tools genuinely differ, so this cannot be a constant.
- The forked network's own chain id is recoverable for free from the provider on anvil, and is not on hardhat, which is why it can be supplied or declared rather than required.
- A chain-identity guard cannot detect a forked anvil at all, which is why declaring a fork has to be possible rather than inferred.
