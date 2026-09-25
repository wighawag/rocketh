---
'@rocketh/deploy': patch
---

`deploy` no longer silently drops a transaction option its type accepts. `nonce` is now put on the deployment transaction (including `nonce: 0`, the first transaction of a fresh account), matching what `execute` already did. Options a deployment cannot carry are refused at the call with a message saying what to do instead: the EIP-4844 blob fields (`blobs`, `blobVersionedHashes`, `kzg`, `sidecars`, `maxFeePerBlobGas`) and the EIP-7702 `authorizationList`, since neither transaction type can create a contract; `dataSuffix`, since on a deployment it would become part of the init code and the recorded constructor arguments; and any `type` other than `'eip1559'`, since a deployment is sent as an EIP-1559 transaction. The refusal happens before any reuse check, so it does not depend on whether the contract already exists.
