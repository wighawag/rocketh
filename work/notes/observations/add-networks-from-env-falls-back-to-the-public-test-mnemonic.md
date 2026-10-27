---
title: "hardhat-deploy's addNetworksFromEnv gives a REAL network the public test mnemonic when no MNEMONIC is set"
type: observation
status: spotted
spotted: 2026-10-27
---

# What was seen

Spotted while wording the fix for an unresolvable named account under hardhat-deploy (`packages/hardhat-deploy/src/account-errors.ts`), from reading `packages/hardhat-deploy/src/helpers.ts`.

`addNetworksFromEnv` adds a network for every `ETH_NODE_URI_<network>` and sets its `accounts` to `getAccounts(networkName)`, with `doNotDefault` left `undefined`. `getMnemonic` then returns, when neither `MNEMONIC_<network>` nor `MNEMONIC` is set, the well-known `test test test test test test test test test test test junk`. `addNetworksFromKnownList` does pass `doNotDefault` for every network outside `hardhat`, `localhost`, `memory` and `test`, so the two helpers disagree.

Consequence: with `ETH_NODE_URI_sepolia` set and no mnemonic, `deployer: 0` resolves on sepolia to the first account of the public test mnemonic instead of failing. On a testnet that account usually has no funds, so the deploy fails later with a less helpful error; on a network where that address happens to hold funds (anyone can, its key is public), transactions go out signed by a key everyone knows.

# Not verified

Whether any template relies on the default for a non-local network. A fix would likely pass the same `doNotDefault` rule `addNetworksFromKnownList` uses, which is a user-visible change and needs a decision.
