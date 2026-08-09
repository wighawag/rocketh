---
'rocketh': minor
'@rocketh/core': minor
'@rocketh/test-utils': patch
---

Throw a first-class `UnknownSignerError` at the single broadcast choke point when a transaction's `from` is unsignable, replacing the opaque `cannot get signer for ...` error there. Because `deploy`, `execute`, `tx` and the proxy upgrade path all funnel through `broadcastTransaction`, the mechanism is transaction-agnostic: a Safe/multisig owner, a hardware wallet left unplugged or any account rocketh cannot sign for now surfaces the exact transaction to execute out-of-band. The decision is made on `addressSignability`, so `local`, `node` and `impersonated` accounts broadcast exactly as before.

Add `onUnknownSigner: 'throw' | 'auto'`, resolved as execution param > chain config > default `'auto'`, mirroring how `autoImpersonate` is threaded. `'auto'` degrades to `'throw'` while no interactive resolver exists, so CI never prompts and never hangs. It is a POLICY, orthogonal to the `autoImpersonate` node-capability switch (which runs before the seam and is unchanged), and it deliberately has no `'impersonate'` value.

Add `env.pushUnknownSignerPolicy(frame)` / `env.popUnknownSignerPolicy()` to the `Environment` interface: a scoped policy-frame stack that `@rocketh/unknown-signer`'s `catchUnknownSigner` will use. A frame changes what happens to an `unsignable` account only — it never turns a `local`, `node` or `impersonated` account into a throw.

`@rocketh/test-utils` is a test-only touch: harness tests that broadcast from a named account the mock node did not list in `eth_accounts` now declare `nodeAccounts`, since such an account is (correctly) unsignable.
