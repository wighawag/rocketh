---
'@rocketh/export': patch
---

The exported chain no longer carries the remains of viem's function-valued chain fields. For a chain viem gives formatters (Base and the other OP-stack chains, Celo, zkSync), the export used to write `formatters`, `serializers` and the like as empty husks such as `{"block": {"type": "block"}}`, which no viem client accepts as a chain. Every output format (`--ts`, `--js`, `--json`, `--tsm`, `--jsm`) now drops any field whose value held a function, while plain data such as `blockTime`, `contracts`, `rpcUrls`, `properties` and `genesisHash` is exported as before. A config that set those fields to `undefined` to work around this can drop the override.
