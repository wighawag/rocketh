---
'@rocketh/node': patch
---

Stop dropping a user-declared chain whose id viem does not know.

`readConfig` builds `config.chains` from viem's chain registry and replaces the user's map with it, so a chain id outside that registry (a private network, an in-house devnet, a new rollup) was discarded entirely: not only its `info`, but its `rpcUrl`, `tags`, `deterministicDeployment`, `onUnknownSigner`, `confirmationsRequired` and every other chain-level setting. Deploying to such a chain then either fell back to placeholder chain metadata (`name: 'unknown'`, `UNKNOWN`, which `@rocketh/export` baked into frontend exports) or failed outright with `chain with id <id> has no rpc url provided nor any provider to use`, for a chain that had been declared correctly.

User-declared ids are now merged in alongside viem's. For an id viem knows, the user's entry keeps layering over viem's metadata field by field, as before; for an id it does not, the user's entry is the whole truth and passes through untouched.

`mergeChainConfig` (exported) now accepts `undefined` as its `defaultInfo`, meaning "viem has no entry for this id". This widens the parameter type, so existing callers are unaffected.
