# @rocketh/core

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
