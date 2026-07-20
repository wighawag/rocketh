---
title: "@rocketh/unknown-signer package with catchUnknownSigner"
slug: unknown-signer-package
spec: unknown-signer-core
blockedBy: [unknown-signer-error-type, unknown-signer-broadcast-seam]
covers: [2, 3, 9, 10]
---

## What to build

Create a new package `@rocketh/unknown-signer` (under `packages/rocketh-unknown-signer/`) that exports a curried `catchUnknownSigner` consistent with the rest of the rocketh extension ecosystem (`deploy(env)(...)`, `execute(env)(...)`).

Signature:

```ts
catchUnknownSigner(env: Environment): <T>(
  action: () => Promise<T>,
  options?: { /* reserved for future use — none required in this spec */ },
) => Promise<null | { from: `0x${string}`; to?: `0x${string}`; value?: bigint | `0x${string}`; data?: `0x${string}` }>
```

Behaviour (EXACT hardhat-deploy v1 parity):

1. Before running `action`, push `'throw'` onto `env`'s unknown-signer policy stack (from the previous task) so this scope FORCES the throw path even when the global default is `'auto'` or when a fork/dev impersonation default would otherwise resolve the account. Pop in `finally`.
2. `await action()`. On success, return `null`.
3. On `UnknownSignerError` (identify by `instanceof` with fallback to `err.name === 'UnknownSignerError'` for cross-realm safety), print a v1-style human-readable description (the `from`, `to`, `value`, `data`, and — when present — the `contract {name, method, args}` block, so users see WHICH function they need to execute on their Safe). Then return `{from, to, value, data}` (omit undefined keys). Do NOT include `contract` in the returned object — v1 parity: return the raw tx fields only.
4. Any OTHER error rethrows unchanged.
5. PERSISTS NOTHING. No `.unsigned_transactions.json`, no filesystem writes, no env-mutable state beyond the push/pop stack. Idempotency is on-chain-state-driven only.
6. The throw unwinds the wrapped action — ONE `catchUnknownSigner` call captures exactly ONE deferred tx (the first unsignable one). Document this in the package README / JSDoc; multi-step deferral = one wrapper per step.

Package plumbing:
- `package.json` with the same conventions as sibling `@rocketh/*` packages (ESM, `type: "module"`, `exports`, `main`/`types`, workspace deps on `@rocketh/core` and `rocketh`).
- `src/index.ts` exports `catchUnknownSigner` as a value and re-exports `UnknownSignerError` as a type/value for convenience.
- Include in the workspace / root scripts so `pnpm build`, `pnpm typecheck`, `pnpm test` pick it up automatically.

Tests (integration-as-documentation, using `createMockEnvironment`):
- (story 2) wrapping the unsignable call keeps the surrounding script running instead of halting.
- (story 3) return shape is `{from, to?, value?, data?}` when caught; `null` when the action succeeds; matches v1 exactly (no `contract` in the return).
- (story 9) with a global impersonate/auto default that would otherwise resolve the account, wrapping in `catchUnknownSigner` FORCES the throw for the wrapped call (push/pop takes precedence).
- (story 10) migration parity: a wrapped call behaves like v1 — throw → catch → print → return, no waiting, no persistence — regardless of the new default.
- non-`UnknownSignerError` errors rethrow untouched.
- nothing is persisted to disk (assert no writes outside temp fixtures).

## Acceptance criteria

- [ ] New package `@rocketh/unknown-signer` created under `packages/rocketh-unknown-signer/` with `src/index.ts` and standard sibling-package plumbing.
- [ ] Curried `catchUnknownSigner(env)(action, options?)` returns `null` on success and `{from, to?, value?, data?}` on caught `UnknownSignerError`.
- [ ] Wrapping forces `'throw'` policy for the wrapped action via push/pop on the env stack; pop runs even if `action` throws non-`UnknownSignerError`.
- [ ] Caught error is printed v1-style, including `contract {name, method, args}` when present, so users see WHICH function to execute.
- [ ] Non-`UnknownSignerError` errors rethrow unchanged.
- [ ] Zero persistence — no filesystem writes; the returned object matches v1's shape exactly (no `contract` field on the return).
- [ ] Tests cover stories 2, 3, 9, 10 plus the rethrow-other-errors and no-persistence invariants; mirror existing `*.integration.test.ts` style.
- [ ] `pnpm typecheck` and `pnpm test` pass for the new package.
- [ ] Tests do not write outside their own temp fixtures (per WORK-CONTRACT shared-write rule); assert absence of any deployment/persistence artefacts.

## Blocked by

- `unknown-signer-error-type` — the class caught here.
- `unknown-signer-broadcast-seam` — the throw site and the push/pop stack API.

## Prompt

> Create the `@rocketh/unknown-signer` package. This is a small, curried extension in the shape of `@rocketh/deploy` / `@rocketh/execute`: `catchUnknownSigner(env)(action)` runs `action`, catches `UnknownSignerError` (from `@rocketh/core`), prints the tx to execute out-of-band, and returns `{from,to?,value?,data?}` — exactly like hardhat-deploy v1's helper.
>
> FIRST, check this task against current reality (launch snapshot may have DRIFTED): confirm the broadcast seam task landed as specified (an env-level policy push/pop stack exists and `UnknownSignerError` is exported from `@rocketh/core`). If the API shape shifted, route to needs-attention.
>
> v1 reference: `hardhat-deploy-v1/src/helpers.ts:2556` — port the surface, not the code. Print format should match v1 closely enough that users porting scripts recognise it; the RETURN shape must match v1 exactly (raw tx fields; no `contract` on the return — `contract` is only used to enrich the printed message).
>
> Where to look: `packages/rocketh-deploy/` and `packages/rocketh-execute/` for the curried-extension package skeleton (package.json / tsconfig / exports / test setup). `@rocketh/test-utils`' `createMockEnvironment` for tests.
>
> Seams to test at: drive the wrapped action against an env whose named `from` has no local signer (do NOT enable impersonation for it). Also test the "force throw under a global impersonate/auto default" scenario — story 9 — to prove push/pop takes precedence.
>
> Key invariant to preserve: **nothing is persisted.** No `.unsigned_transactions.json`, no filesystem writes. Idempotency is purely on-chain-state-driven, exactly like v1. If a future adapter wants a persisted batch, it belongs downstream in `explore-unknown-signer-adapters`, not here.
>
> Done means: a script can wrap a Safe-only upgrade in `catchUnknownSigner`, keep going, and get back `{from,to,value,data}` describing the tx to execute — with the exact behaviour a v1 script would have had, so the only migration diff is the import.
