---
needsAnswers: true
---

# `fromAddressToNamedABIOrNull` can THROW despite its `OrNull` name (2026-08-09)

Noticed while enriching `UnknownSignerError` with a deployment name: `fromAddressToNamedABIOrNull` (`packages/rocketh/src/environment/index.ts:~606`) calls `mergeArtifacts`, which throws `ABI conflict: ...` when two deployments registered at the SAME address share a function selector. So the helper returns `null` for "no match" but throws for "several conflicting matches", which its name does not suggest.

This task guards its own call site (the throw would otherwise replace the very `UnknownSignerError` the user needs). The other caller, `read`'s retry path in `packages/rocketh-read-execute/src/index.ts:~284`, calls it INSIDE a `catch (AbiDecodingZeroDataError)` block, where a throw would likewise mask the original error. Not fixed here (outside this task's scope).
