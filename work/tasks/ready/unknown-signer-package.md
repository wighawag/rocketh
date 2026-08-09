---
title: '@rocketh/unknown-signer package with catchUnknownSigner'
slug: unknown-signer-package
spec: unknown-signer-core
blockedBy: [unknown-signer-error-type, unknown-signer-broadcast-seam, test-env-harness]
covers: [2, 3, 10]
needsAnswers: true
---

## What to build

A new package `@rocketh/unknown-signer` exporting a curried `catchUnknownSigner`, consistent with the rest of the rocketh extension ecosystem (`deploy(env)(...)`, `execute(env)(...)`).

Shape: `catchUnknownSigner(env)(action, options?)` returns `null` when the action succeeded, or `{from, to, value, data}` when an unknown signer was caught.

**The action is a THUNK only, and that is a deliberate, load-bearing divergence from v1.** v1 accepted `Promise | (() => Promise)`, but the promise form cannot work here: `catchUnknownSigner(execute(...))` has already STARTED the action before the wrapper is called, so there is no moment at which to push the policy frame. Accepting it would produce a wrapper that silently does not do its job — harmless while `'throw'` is the only outcome, and a real bug the moment `'ask'` lands.

So: the TYPE accepts a thunk only, meaning a v1-style promise-form call fails to compile. Because JavaScript callers and `as any` exist, ALSO guard at runtime: if the argument is thenable rather than callable, throw a clear, actionable error naming the fix (wrap the call in an arrow function), never an obscure failure from calling a promise. Fail loudly, not silently.

`options` carries `{log?: boolean}` for v1 parity (default true; `false` suppresses the printed block and only returns the value).

Behaviour, at exact hardhat-deploy v1 parity:

1. Before running `action`, push a `{policy: 'throw'}` frame onto the environment's policy stack (built by the seam task), so this scope forces the throw path rather than an ambient policy. Pop in `finally`, including when the action throws something else.
2. `await action()`. On success, return `null`.
3. On `UnknownSignerError` (identify by `instanceof`, falling back to `err.name === 'UnknownSignerError'` for cross-realm safety), print a v1-style human-readable description — `from`, `to`, `value`, `data`, and the `contract {name?, method, args}` block when present, so the user sees WHICH function to execute on their Safe. Suppress the print when `options.log === false`. Then return `{from, to, value, data}` **with the keys always PRESENT even when undefined, and `value` stringified when it is not already a string** — that is what v1 returns, and since this task claims exact return parity it must match under a strict comparison, not merely a loose one. Do NOT include `contract` in the returned object: `contract` exists purely to enrich the printed message.
4. Any other error rethrows unchanged.
5. **Persists nothing.** No unsigned-transactions file, no filesystem writes, no environment mutation beyond the push/pop frame. Idempotency is on-chain-state-driven only.
6. The throw unwinds the wrapped action, so ONE `catchUnknownSigner` call captures exactly ONE deferred tx: the first unsignable one. Multi-step deferral means one wrapper per step. Document this in the package README / JSDoc.

**What the frame does and does not do.** The frame exists so a wrapped action reliably receives its `UnknownSignerError` instead of an interactive prompt once `unknown-signer-interactive` adds `'ask'`. It forces `throw` over `ask`. It does NOT override impersonation: an account the node can sign for, including an impersonated one, still broadcasts inside a `catchUnknownSigner` block. Testing the throw path on a fork is done with `autoImpersonate: false` for the run (story 8), and per-account control is parked in `work/notes/ideas/per-call-autoimpersonate.md`. See ADR 0006.

**No story is claimed for the frame.** Because this slice ships only `'throw'` and `'auto'` (which degrades to `'throw'`), the ambient policy can never differ from the frame, so "forces the throw regardless of ambient policy" is not assertable by value here. The frame is built as declared forward-compat; the user-visible guarantee lands with `unknown-signer-interactive` (its story 8). Test the plumbing — the frame is pushed, is what the seam reads, and is always popped — and do not dress that up as a behavioural assertion.

Package plumbing: same conventions as sibling `@rocketh/*` packages (ESM, `type: "module"`, `exports`), `src/index.ts` exporting `catchUnknownSigner` and re-exporting `UnknownSignerError`, and wired into the workspace so `pnpm build` / `typecheck` / `test` pick it up. Depend on `@rocketh/core` ONLY, matching `@rocketh/deploy`: everything needed (the `Environment` type, `UnknownSignerError`, the frame helpers typed on the environment) lives in core, and depending on the `rocketh` runtime package would invert the documented layering.

## Acceptance criteria

- [ ] `@rocketh/unknown-signer` exists under `packages/rocketh-unknown-signer/` with standard sibling-package plumbing and is picked up by the root scripts.
- [ ] `catchUnknownSigner(env)(action, options?)` returns `null` on success and `{from, to?, value?, data?}` on a caught `UnknownSignerError`.
- [ ] The action parameter is typed as a thunk only; a promise-form call does not compile, and passing a thenable at runtime throws a clear error naming the fix rather than failing obscurely (explicit test).
- [ ] `options.log === false` suppresses the printed block and still returns the value.
- [ ] The returned object matches v1 under a STRICT comparison: keys present even when undefined, `value` stringified when not already a string (explicit test).
- [ ] A `{policy: 'throw'}` frame is pushed for the wrapped action and popped in `finally`, including when the action throws a non-`UnknownSignerError` (explicit test).
- [ ] An impersonated account still broadcasts inside a `catchUnknownSigner` block — the wrapper does not override impersonation (explicit test; this is the drift ADR 0006 guards).
- [ ] The caught error is printed v1-style including the `contract` block when present, falling back to the `to` address when `contract.name` is absent.
- [ ] Non-`UnknownSignerError` errors rethrow unchanged.
- [ ] Zero persistence: no filesystem writes, and the return matches v1's shape exactly (no `contract` on the return).
- [ ] Tests cover stories 2, 3, 10, plus the frame plumbing, rethrow and no-persistence invariants, mirroring existing `*.integration.test.ts` style.
- [ ] The new capability is documented: `@rocketh/unknown-signer` appears in `documentation.md` and in the package list in `README.md`/`AGENTS.md` alongside its siblings, with the thunk-versus-promise call shape shown in the example (a v1 user copying the old idiom is the likeliest first mistake). Note `remove-legacy-mock-environment` also edits `AGENTS.md` and `documentation.md` and is not ordered against this task, so keep the edit tightly scoped to the package list to avoid a needless conflict.
- [ ] A changeset accompanies the new published package.
- [ ] Tests do not write outside their own temp fixtures (WORK-CONTRACT shared-write rule); assert no deployment/persistence artefact appears.
- [ ] `pnpm typecheck` and `pnpm test` pass for the new package.

## Blocked by

- `unknown-signer-error-type` — the class caught here.
- `unknown-signer-broadcast-seam` — the throw site and the frame stack API.
- `test-env-harness` — this package's tests use the shared harness. (Unlike the seam, this task lives OUTSIDE `rocketh`, so it may depend on `@rocketh/test-utils` freely.)

## Prompt

> Create the `@rocketh/unknown-signer` package: a small curried extension in the shape of `@rocketh/deploy`. `catchUnknownSigner(env)(action)` runs the action, catches `UnknownSignerError` (from `@rocketh/core`), prints the tx to execute out-of-band, and returns `{from, to?, value?, data?}`, exactly like hardhat-deploy v1's helper.
>
> FIRST, check this task against current reality (launch snapshot may have DRIFTED): confirm the seam task landed as specified — an environment-level policy frame stack whose frames are objects carrying a policy, and `UnknownSignerError` exported from `@rocketh/core`. If either API shifted, route to needs-attention.
>
> Constraining decision (ADR 0006, `docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md` — read it): the frame you push forces `throw` over **`ask`**, never over impersonation. An impersonated account still broadcasts inside your wrapper. Do not try to make `catchUnknownSigner` defeat `autoImpersonate`; that misreading is what bounced the previous task set. Write the anti-regression test.
>
> v1's surface, inlined so you need no external checkout (any local v1 clone lives under the gitignored `tmp/`): `catchUnknownSigner(action: Promise | (() => Promise), options?: {log?: boolean})`, returning `null` or `{from, to, value, data}` with the keys present even when undefined and `value` stringified. Port the surface with ONE deliberate divergence, described in What to build: the action is a thunk only, because the promise form is already running when we receive it and there is no moment to push the policy frame. Make that divergence loud, not silent — a type error at compile time and an actionable throw at runtime.
>
> Where to look: `packages/rocketh-deploy/` for the curried-extension package skeleton (package.json, tsconfig, exports, test setup) and for the dependency convention — note the execute extension lives in `packages/rocketh-read-execute/`, there is no `packages/rocketh-execute/`. Use `createTestEnvironment` from `@rocketh/test-utils` for tests (the real-environment harness; not the legacy `createMockEnvironment`).
>
> Seams to test at: drive the wrapped action against an environment whose named `from` classifies as unsignable (no signer material, impersonation off or unsupported). Also test that the frame is popped when the action throws something else, that an impersonated `from` is unaffected by the wrapper, and that a promise-form call is rejected clearly.
>
> Key invariant to preserve: **nothing is persisted.** No unsigned-transactions file, no filesystem writes. Idempotency is purely on-chain-state-driven, exactly like v1. A persisted batch, if ever built, belongs downstream in `explore-unknown-signer-adapters`.
>
> Done means: a script can wrap a Safe-only upgrade in `catchUnknownSigner`, keep going, and get back `{from, to, value, data}` describing the tx to execute, with the behaviour a v1 script would have had, so the migration diff is the import plus the one mechanical call-shape change (wrap the action in an arrow function).
