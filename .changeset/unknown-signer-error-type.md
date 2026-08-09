---
'@rocketh/core': minor
---

Add `UnknownSignerError` to `@rocketh/core`, the shared carrier for "the transaction a human or multisig must execute out-of-band". Thrown when a privileged call targets an account rocketh cannot sign for (for example a Safe that owns a proxy). The payload mirrors hardhat-deploy v1's shape — `{from, to?, data?, value?, contract?: {name?, method, args}}` — with one deliberate divergence: `contract.name` is optional and resolved downstream by reverse-lookup (see ADR 0006). Exported as both a value and a type so importers can `catch` via `instanceof` or fall back to `err.name === 'UnknownSignerError'` across dual-published boundaries.
