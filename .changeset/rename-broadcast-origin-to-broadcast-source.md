---
---

Internal refactor, no behaviour change and no public surface: the broadcast choke point's "what produced this transaction" descriptor is renamed `BroadcastOrigin` -> `BroadcastSource` (and its parameter `origin` -> `source`). `origin` already meant the SENDER ADDRESS of a pending transaction (`PendingTransaction.transaction.origin`) in the same module; that field is unchanged and keeps the name. `BroadcastSource` is a module-private closure's parameter type, absent from the `Environment` interface, so nothing exported moves.
