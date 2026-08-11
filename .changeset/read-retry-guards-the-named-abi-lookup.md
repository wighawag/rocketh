---
'@rocketh/read-execute': patch
---

`read`'s retry path no longer lets an ABI-conflict throw mask the decode error it is handling. `fromAddressToNamedABIOrNull` returns `null` for "no match" but THROWS `ABI conflict: ...` when two deployments registered at one address share a function selector, and the retry path calls it from inside the `AbiDecodingZeroDataError` catch. A caller reading such an address now sees the decode failure they need, not a bookkeeping complaint about ABI registration. A conflict is treated exactly like no match: the original error is rethrown.
