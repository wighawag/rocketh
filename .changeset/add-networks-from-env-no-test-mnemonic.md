---
'hardhat-deploy': minor
---

`addNetworksFromEnv` no longer gives a real network the public test mnemonic (`test test ... junk`) when neither `MNEMONIC_<network>` nor `MNEMONIC` is set. It now follows the rule `addNetworksFromKnownList` already had: only `hardhat`, `localhost`, `memory` and `test` fall back to the test mnemonic, and any other network gets no accounts, so a deploy that needs one stops and names the variable to set instead of signing with a key everyone knows. A dev node configured under another name (for example `ETH_NODE_URI_lan`) now needs its mnemonic set explicitly, such as `MNEMONIC_lan="test test test test test test test test test test test junk"`.
