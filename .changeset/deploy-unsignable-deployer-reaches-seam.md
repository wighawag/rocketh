---
'@rocketh/deploy': minor
---

Let a deploy from an unsignable deployer reach the unknown-signer seam. `deploy` performed its own `env.addressSigners[address]` lookup and threw an opaque `cannot get signer for ...` before the transaction was built, so such a deploy died there instead of reaching the single `broadcastTransaction` choke point. It now surfaces the same `UnknownSignerError` (carrying the transaction to execute out-of-band) that a raw tx or an `execute` does, under the same effective `onUnknownSigner` policy. A signable deployer is unaffected, including the deterministic create2/create3 paths.

The removed lookup existed only to feed a `signer` argument to the module-private create2/create3 factory helpers, which never read it (every transaction they send goes through `env.broadcastExecution`, which resolves the signer at the choke point). That unused parameter is removed too; no public signature changes.
