---
'rocketh': patch
---

`PendingTransaction.transaction.origin` is now written un-normalised at all five sites, where two of them previously lowercased it. It is a persisted RECORD VALUE, not a lookup key: nothing reads it back, and it reaches the deployment record and the pending-transaction files, so it keeps the address as resolved (EIP-55 checksum intact), exactly as `namedAccounts`/`unnamedAccounts` deliberately do, while the re-hydration paths keep what the node returned. Contrast `addressSigners`, which is a lookup map and stays keyed lowercase. Records written before this change hold lowercased values, so anything that ever starts matching on `origin` must lowercase at the comparison rather than rely on the stored form.
