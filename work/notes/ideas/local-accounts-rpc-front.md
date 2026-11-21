---
title: 'A signing front for any RPC: local accounts outside rocketh, for every tool'
type: idea
status: incubating
created: 2026-11-21
---

# A signing front for any RPC, configured on its own

A process (or an in-process provider wrapper) that sits between a tool and an RPC endpoint, holds keys derived from a mnemonic or given as a list, answers `eth_accounts` with them, signs `eth_sendTransaction` and the signing methods, and forwards everything else upstream. Its accounts are configured on the front itself, as Hardhat's network accounts are configured in `hardhat.config.ts`, and a tool reaches it by pointing its RPC URL at the front.

## Why it is not how rocketh does local accounts

Spec `environment-accounts` and ADR 0019 chose the other shape for rocketh itself: `localAccounts` in `rocketh/config.ts`, signed by core rocketh through its own broadcast path. As rocketh's main mechanism a front is less elegant: two configs to keep linked (each environment's `rpcUrl` to the right front, each front to the right upstream and keys, two fronts for two environments on one chain), a process to start and stop (the chore spec `in-process-chain` removes), the signer kind hidden (front-held accounts are `remote` to rocketh, so captured transactions say `intent:node` for what is a local key), and a second home for nonce, gas and fee filling.

## Why it is still worth having

- **It serves every tool, not only rocketh.** `forge script --unlocked`, `cast send`, Hardhat, a frontend in development and a wallet-less script all get the same accounts from one place. `localAccounts` cannot do that: it lives inside rocketh.
- **Keys can stay out of the deploy process** when the front runs as its own process.

## It already composes with rocketh, with no rocketh change

With no `localAccounts` declared for an environment (or `localAccounts: null` at any layer), an index means the node's `eth_accounts[i]` and rocketh sends from it with `eth_sendTransaction`, as a `remote` signer. A front is, to rocketh, just a node that holds keys: start it, point the environment's `rpcUrl` at it, write `deployer: 0`. So nothing here blocks or is blocked by `environment-accounts`.

## Where it would live

Most likely in the webevm repository, not here: `@webevm/devnode` already implements the layer (`eth_accounts`, `eth_sendTransaction` with nonce, gas and fee filling, the signing methods, `{mnemonic, count, path, initialIndex}` or a key list), but only over a webevm `SlimNode` (`wrapDevNode(node: SlimNode, ...)` in its `src/dev-node.ts`, 0.1.0). Generalising it to wrap any EIP-1193 provider, plus a small CLI that serves the result over HTTP, would be the front. Impersonation stays webevm-only (it needs `senderMode: 'trusted'`).

## Open

- Its send path fills fields through `eth_fillTransaction` among others (`src/send.ts`), which public RPC endpoints often do not implement (not verified per provider), so a generic front needs a fallback that fills from `eth_getTransactionCount`, `eth_estimateGas` and the fee methods.
- Whether a front on a port should refuse to bind beyond localhost, since it signs for whoever reaches it.
