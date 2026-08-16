---
'@rocketh/export': minor
---

Stop `as const` making the exported chain info unusable.

The generated TypeScript is emitted `as const`, which is exactly right for the CONTRACTS (literal addresses and ABIs are the whole reason to export TypeScript rather than JSON) and wrong for the CHAIN, which is configuration a consumer legitimately overrides at run time. Two fields could not be used at all without a hand-written cast:

- **`chain.rpcUrls.*.http`** — rocketh no longer bakes a public RPC endpoint into chain info, so this is very often `[]`, which `as const` pins to `readonly []`. Nothing is assignable to that type, so a consumer holding `typeof deployments.chain` could not construct a chain with an endpoint injected from an env var or from the user's wallet. A non-empty list was equally stuck, pinned to its own literal tuple.
- **`chain.properties`** — usually `{}`, which `as const` pins to `{}`, so reading a known property such as `averageBlockTimeMs` or `finality` was a type error rather than `undefined`.

Both are now widened (`readonly string[]` and `Record<string, JSONValue>`) by a small set of type aliases prepended to the generated file. The widening is surgical rather than dropping `as const`: `chain.id`, `chain.name`, `nativeCurrency`, contract addresses and ABIs all keep their literal types, and a test pins that they do.

The aliases are emitted as local declarations rather than imported, because a generated deployments file has to stay dependency-free enough to drop into a project with no rocketh packages installed.

Applies to the `--ts` output, the `.d.ts` sidecar emitted beside `--js`, and the `--tsm` module output. `--json` has no types and is unaffected; `--jsm` emits no `.d.ts` and is unchanged.

Found in the wild: `jolly-roger` carried a hand-written `ChainInfo` cast whose comment described this precisely, meaning every consumer of `@rocketh/export` had to discover and re-solve it. The new tests type-check a generated file with a real `tsc` invocation rather than asserting on substrings, and were each verified to fail with the fix reverted.
