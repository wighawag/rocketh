---
'@rocketh/core': minor
'@rocketh/read-execute': minor
'rocketh': minor
'@rocketh/test-utils': patch
---

Name the function in an `UnknownSignerError` raised from a contract call. `execute` / `executeByName` now declare the call they encode through the new `options.contract` on `env.broadcastExecution` (`{method, args}`), and the seam at the broadcast choke point turns it into `contract: {name?, method, args}` on the error. A user whose proxy owner is a Safe therefore reads `contract: Proxy.upgradeTo("0x...")` and knows which function to run out-of-band, instead of only an address.

`contract.name` is resolved on the error path through the environment's existing `fromAddressToNamedABIOrNull`, so it is absent when the target address matches no deployment (the message then falls back to `to`), and enrichment can never replace the error with an unrelated one.

Non-contract paths are unchanged and leave `contract` unset: a plain `tx()`, a value transfer and a deploy have no function to name.

`@rocketh/test-utils` is a type-only touch: the legacy `createMockEnvironment` mirrors the widened `broadcastExecution` signature (it ignores the new option; it has no unknown-signer seam).
