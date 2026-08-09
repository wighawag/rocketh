# @rocketh/core

## 0.19.7

### Patch Changes

- 09ea46d: Fix "cannot get signer" for named accounts declared with a private key, a signer protocol, or a checksummed address. `addressSigners` is now keyed by a lowercased address at both write sites and at the leftover-account filter, matching every reader (which already lowercased). `resolveAccountOrUndefined` now normalises like `resolveAccount`, so both resolvers agree. Address values exposed by `namedAccounts`/`unnamedAccounts` are unchanged.

## 0.19.6

### Patch Changes

- 6456996: Fix spurious deployment wipes caused by using the `"earliest"` block tag as the genesis fingerprint.

  rocketh fetched the chain's genesis hash via `eth_getBlockByNumber("earliest")`. On pruned nodes `"earliest"` does not return genesis — geth resolves it to `HistoryPruningCutoff()` and reth to `earliest_block_number()`, i.e. the prune-cutoff block whose hash is not the genesis hash and drifts as history is pruned. The recorded `.chain` genesisHash therefore stopped matching, and because `deleteDeploymentsIfDifferentGenesisHash` was hardcoded `true` for every non-fork environment, rocketh silently deleted the entire deployments folder on real chains whenever the node pruned (or two nodes pruned to different points).

  Genesis is now fetched explicitly via block number `0x0`. On a pruned node that throws (geth `PrunedHistoryError` / reth `PrunedHistoryUnavailable`) or returns null, the genesis hash is left undefined and the mismatch check is skipped entirely — no delete, no throw. Dev/full nodes (never pruned) keep returning the real genesis, so reset detection still works there.

  The delete-on-mismatch behavior is now configurable via a new chain config option `deleteDeploymentsIfDifferentGenesisHash` (resolved like `autoMine`/`autoImpersonate`), using `??` so an explicit `false` on a default-`true` chain actually opts out (`||` would have silently ignored the opt-out). It defaults to `true` for the recognised dev chain ids 1337 and 31337 (reset detection out of the box) and `false` everywhere else. Non-dev chains now throw with a clear reason on a genesis mismatch instead of silently wiping — the message explains how to mark a resettable chain (set the option to `true`) or recover a stale `.chain` (remove its `genesisHash` field, e.g. left over from the old `"earliest"` behavior). The option also inherits per-environment `overrides` for free.

## 0.19.5

### Patch Changes

- 7249888: Allow arbitrary `@custom:*` natspec keys (e.g. `@custom:oz-upgrades-unsafe-allow`) on `DevMethodDoc` so OpenZeppelin upgradeable-contract natspec type-checks without casting — issue #44

## 0.19.4

### Patch Changes

- b2987d7: Do not include viem's default public RPC in a chain's `info.rpcUrls` by default.

  Previously, for every viem-known chain, rocketh merged viem's default public RPC
  endpoint (e.g. `https://<id>.rpc.thirdweb.com`) into `chains[id].info.rpcUrls`.
  That endpoint is rate-limited, can disappear, and was getting baked into
  serialized chain info (frontend exports, wallet "add network" data).

  Now, only an RPC url set explicitly in the config appears in `info.rpcUrls`; the
  required `default` entry is kept with an empty `http` list otherwise. Chain
  metadata (name, nativeCurrency, multicall3, block explorers, ...) is still always
  populated from viem. Deploying keeps working with zero config: viem's default RPC
  is still provided to the deploy path via the chain's top-level `rpcUrl`, so it is
  used but never serialized.

  Set the new top-level config flag `includeDefaultRPCUrlsInChainInfos: true` to
  restore the previous behavior of including viem's default RPC in `info.rpcUrls`.

  Also exposes `mergeChainConfig` from `@rocketh/node` (the pure per-chain merge
  used during config resolution).

## 0.19.3

### Patch Changes

- 034b3a7: retry config + read-execute use it for AbiDecodingZeroDataError errors on existing deployments

## 0.19.2

### Patch Changes

- c6fa24e: add reset + make loading deployment a separate step from createEnvionment

## 0.19.1

### Patch Changes

- packagesWithLogsEnabled + latest deps

## 0.19.0

### Minor Changes

- autoMine

## 0.18.4

### Patch Changes

- environment refactor for simpler extensions

## 0.18.3

### Patch Changes

- add confirmationsRequired option

## 0.18.2

### Patch Changes

- fix package version

## 0.18.1

### Patch Changes

- revert mistake

## 0.18.0

### Minor Changes

- inject default chains instead of getting it at runtime

## 0.17.17

### Patch Changes

- fix address resolution

## 0.17.16

### Patch Changes

- fix

## 0.17.15

### Patch Changes

- ignore supportsInterface conflit for ERC173Proxy

## 0.17.14

### Patch Changes

- latest deps

## 0.17.13

### Patch Changes

- add auto impersonation

## 0.17.12

### Patch Changes

- add metadata to packages

## 0.17.11

### Patch Changes

- add licenses

## 0.17.10

### Patch Changes

- update deps

## 0.17.9

### Patch Changes

- 8ef1407: fix typos + improvements
- ef83a74: update deps
- ce1e98f: readme
- e01378e: publish src too

## 0.17.8

### Patch Changes

- add logging

## 0.17.7

### Patch Changes

- f7a81d8: refactor logging

## 0.17.6

### Patch Changes

- f4431ed: removing dependence on ethers

## 0.17.5

### Patch Changes

- update deps and dev deps

## 0.17.4

### Patch Changes

- provider available: doNotRequireRpcURL

## 0.17.3

### Patch Changes

- dc5aefe: allow for custom deployment message

## 0.17.2

### Patch Changes

- add ability to add message to simple tx broadcast

## 0.17.1

### Patch Changes

- 6642ece: reorg using @rocketh/core for utility functions and types (still reexported from rocketh)
