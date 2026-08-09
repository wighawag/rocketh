---
'@rocketh/unknown-signer': minor
---

New package `@rocketh/unknown-signer`, providing the hardhat-deploy v1 `catchUnknownSigner` helper as a curried rocketh extension: `catchUnknownSigner(env)(action, options?)` runs the action with a `{policy: 'throw'}` unknown-signer frame pushed for its duration, catches the `UnknownSignerError` the broadcast seam throws for an unsignable `from`, prints the transaction to execute out-of-band, and returns `{from, to, value, data}` (or `null` when the action succeeded). Return parity with v1 is exact: every key is present even when `undefined`, `value` is a string, and `contract` is never returned. Nothing is persisted — idempotency is on-chain-state-driven, as in v1.

One deliberate divergence from v1: the action is a THUNK only (`() => execute(...)`), not `Promise | thunk`. A promise has already started executing before the wrapper can establish its policy scope, so accepting one would silently do nothing. The v1 promise form is a compile error, and a JavaScript caller gets a runtime error naming the fix.

The pushed frame forces `throw` over the interactive `ask` policy that ships later; it NEVER overrides impersonation. An account the node can sign for, including an impersonated one, still broadcasts inside a `catchUnknownSigner` block (ADR 0006).

`UnknownSignerError` is re-exported from the `@rocketh/unknown-signer/errors` subpath rather than the package root, because every runtime export of an extension package is called as `value(env)` when the package is spread into `extensions`.
