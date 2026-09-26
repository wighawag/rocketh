---
'@rocketh/read-execute': patch
---

`execute` no longer silently drops a transaction option its type accepts. `dataSuffix` is now appended to the calldata, as viem's `writeContract` does. Options the EIP-1559 transaction rocketh sends cannot carry are refused at the call with a message saying what to do instead: the EIP-4844 blob fields (`blobs`, `blobVersionedHashes`, `kzg`, `sidecars`, `maxFeePerBlobGas`), the EIP-7702 `authorizationList`, and any `type` other than `'eip1559'`. The refusal happens before a guard is evaluated, so it does not depend on chain state. `gasPrice` is unchanged, pending support for chains without EIP-1559.
