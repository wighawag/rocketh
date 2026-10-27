---
title: '`read` never retries a zero-data result at a proxy address, because its "is this a known deployment" check merges ABIs'
type: observation
status: spotted
spotted: 2026-10-27
---

# What was seen

`read` in `packages/rocketh-read-execute/src/read.ts` retries a call that returned no data (`AbiDecodingZeroDataError`) only when the address is a known deployment, which it asks with `env.fromAddressToNamedABIOrNull(deployment.address)`. That helper MERGES the ABIs of every record at the address and throws `ABI conflict` when two share a selector, and the `read` code treats that throw like "no match" and rethrows the decode error at once.

A proxy deployed by `@rocketh/proxy` always has two records at its address (the main record and `<name>_Proxy`) sharing functions such as `owner()`, so for every such proxy the merge conflicts and the retry is skipped. A read right after deploying a proxy, against a node whose state lags, therefore fails where the same read of a plain contract would have been retried.

# Why it is only noted here

The unknown-signer seam had the same root cause (it needed a NAME, not a merged ABI) and was fixed in the `feat/unknown-signer-safe-ergonomics` branch with a lookup that merges nothing. `read` was left alone on purpose: it only needs "is there a record at this address", but changing it changes retry behaviour for proxies, which is a separate decision and is pinned by `read.integration.test.ts` ("surfaces the decode error, not an ABI conflict, when two deployments share the address").

# A likely fix shape

Ask presence without merging (any record whose address matches), keeping `fromAddressToNamedABIOrNull` unchanged for callers that need the merged ABI.
