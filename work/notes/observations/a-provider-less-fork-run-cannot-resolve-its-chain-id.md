---
title: 'A fork run with NO provider throws before it ever dials: `Could not find chainId for environment named "mainnet" (no provider)`'
type: observation
status: spotted
spotted: 2026-08-29
---

Spotted while checking the premises of `is-fork-flag-on-the-cli` (the task claims `anvil --fork-url ... && rocketh -e mainnet --is-fork` works with nothing declared at all). `getChainIdForEnvironment` runs BEFORE `resolveExecutionParams`, and with no `provider` its only source is `environments[<name>].chain`, so a provider-less fork run with nothing declared throws `Could not find chainId for environment named "mainnet" (no provider)` and never reaches the conventional-local-endpoint fallback that `fork-config-layer.test.ts` pins (that test calls `resolveExecutionParams` directly with an already-computed id, so it cannot see this).

Also a documentation trap that exists today, independently of the flag: `documentation/fork-runs/index.md` says under `whenForked` that "an entry that carries nothing but the fork layer is valid, so saying where a fork listens does not mean declaring a chain you are not using". True of core's layering, false on the provider-less path a fork run takes through `@rocketh/node`: verified that `environments: {mainnet: {whenForked: {rpcUrl: 'http://127.0.0.1:8546'}}}` plus `{fork: 'mainnet'}` throws the same error, while adding `chain: 1` makes the whole run resolve correctly (endpoint `http://127.0.0.1:8545`, descriptor `{networkName: 'mainnet', chainId: 1}`, `saveDeployments: false`, `autoImpersonate: true`).
