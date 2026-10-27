---
title: "`rocketh-export` writes viem's function-valued chain fields as residue (`{\"type\": \"block\"}`) for OP-stack and other formatted chains"
type: observation
status: spotted
spotted: 2026-10-27
---

# What was seen

`mergeChainConfig` (`packages/rocketh-node/src/executor/index.ts`) builds a chain's `info` as `{...viemChain, ...userInfo}`. For a chain viem gives formatters (Base, OP Mainnet and the other OP-stack chains, Celo, zkSync), that copies `formatters`, `serializers`, `fees` and `extend` into `info`. Measured against the built `@rocketh/node` with viem's `base`:

```
keys: formatters, fees, serializers, blockTime, contracts, id, name, nativeCurrency, rpcUrls, blockExplorers, sourceId, extend
JSON.stringify(info.formatters) -> {"block":{"type":"block"},"transaction":{"type":"transaction"},"transactionReceipt":{"type":"transactionReceipt"}}
```

`@rocketh/export` serialises `info` with `JSON.stringify` (`packages/rocketh-export/src/index.ts`), so the functions disappear and their containers remain. The exported chain then carries a `formatters` object with no `format` function in it, typed `as const`, which a viem client's chain type does not accept.

# Evidence that it bites

The public `stratagems` repository (`contracts/rocketh/config.ts`, read 2026-10-27) works around it by overriding Base's chain info with `formatters: undefined, serializers: undefined`, and records that without the override its web app's type check reported 19 errors. It notes the override must be explicit `undefined`, because rocketh merges the user's entry over its own copy of viem's chain and would otherwise put the functions back.

# Not done here

Found during the documentation audit, which changes no source code. Candidate fix: drop function-valued fields (and objects left empty by that) when building or exporting `info`, which would let the workaround be deleted.
