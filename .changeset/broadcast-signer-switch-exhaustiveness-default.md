---
'rocketh': patch
---

Add exhaustive `default:` branch to the signer-routing switch in `broadcastTransaction` so a future fourth `Signer` variant fails to compile at the call site, and cast / JS-caller / user-supplied-`signerProtocols` paths that violate their own type contract throw a clear error naming the unexpected `signer.type` instead of silently returning `undefined` and failing confusingly downstream in `savePendingExecution`.
