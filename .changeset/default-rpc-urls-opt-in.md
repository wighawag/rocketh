---
'@rocketh/core': minor
'@rocketh/node': minor
---

Do not include viem's default public RPC in a chain's `info.rpcUrls` by default.

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
