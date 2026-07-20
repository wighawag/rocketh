---
title: broadcastTransaction unknown-signer seam + onUnknownSigner policy + push/pop stack
slug: unknown-signer-broadcast-seam
spec: unknown-signer-core
blockedBy: [unknown-signer-error-type]
covers: [4, 5, 6, 11]
---

## What to build

Wire the single "unsignable `from`" seam into rocketh at the ONE transaction choke point (`broadcastTransaction` in `packages/rocketh/src/environment`). Because `deploy`, `execute`, `tx`, and the proxy upgrade path all funnel through this function, this one edit is what makes the mechanism transaction-agnostic — no changes to those upstream packages.

Pieces of the vertical:

1. **Detect "no local signer".** Today, every leftover address becomes `{type: 'remote', signer: provider}` (see the `unnamedAccounts` loop just before impersonation). Introduce a distinction so that a named account that is NEITHER locally signable NOR auto-impersonated is recorded as UNSIGNABLE rather than silently defaulted to `remote`. Impersonation runs BEFORE the seam — if `autoImpersonate` resolves the account, the seam never fires (the two settings are ORTHOGONAL; do NOT change `autoImpersonate` behaviour, and do NOT add an `impersonate` value to `onUnknownSigner`).

2. **Add `onUnknownSigner: 'throw' | 'auto'`** as a run/chain-level policy resolved with the same precedence as existing execution params (execution-param > chain config > default). Default is `'auto'`; in THIS spec `'auto'` degrades to `'throw'` (no interactive resolver ships here). Non-interactive/CI never prompts or hangs.

3. **Expose an env-level policy override stack** (e.g. `env._unknownSignerPolicyStack: Array<'throw'>`) with push/pop helpers the wrapper package will call. The seam reads TOP-OF-STACK first, then falls back to the resolved global `onUnknownSigner`. Dynamic-scope is safe because rocketh executes deploy scripts sequentially (single-await); document that invariant.

4. **Throw at the seam.** When `broadcastTransaction` is called with a tx whose `from` has no signer AND the effective policy is `throw`, construct and throw an `UnknownSignerError` populated from the tx object (`from`, `to`, `data`, `value`). Replace today's opaque `throw new Error('cannot get signer for ${from}')` at this call site.

5. **Contract-metadata enrichment on the execute path.** `broadcastExecution` (or the caller that funnels contract calls into `broadcastTransaction`) must be able to pass `{name, method, args}` alongside the tx so the error's `contract` field is populated when the unsignable tx came from an `execute`. Raw tx / deploy / value transfer paths leave `contract` unset. Do not thread this via a global — pass it explicitly.

Unit / integration test coverage on this task:
- (story 4) unwrapped call from an unsignable `from` throws `UnknownSignerError` (not a raw RPC error) with the correct payload.
- (story 5) same behaviour fires for a raw tx, a deploy, an execute (with `contract` populated), and a value transfer — driven through the choke point.
- (story 6) mixed run: signable txs broadcast normally; only the unsignable one is caught.
- (story 11) `onUnknownSigner: 'auto'` with no wrapper resolves to throw (no prompt, no hang).
- push/pop stack: pushing `'throw'` overrides a global default; popping restores it.
- `autoImpersonate: true` for a supported node still resolves the account BEFORE the seam (seam does not fire).

Use `createMockEnvironment` from `@rocketh/test-utils` for the seam tests.

## Acceptance criteria

- [ ] Named accounts that are neither locally signable nor auto-impersonated are tracked as UNSIGNABLE (no longer silently `remote`).
- [ ] `onUnknownSigner: 'throw' | 'auto'` is accepted at run/chain level with the documented precedence and defaults to `'auto'`.
- [ ] Effective policy is computed as `top-of-stack ?? resolved-global`; push/pop helpers exposed on the environment.
- [ ] `broadcastTransaction` throws `UnknownSignerError` (from `@rocketh/core`) — replacing the current opaque `Error('cannot get signer for ...')` — with `from/to/data/value` populated from the tx.
- [ ] `broadcastExecution` populates `contract: {name, method, args}` on the error when the tx originated from a contract call.
- [ ] `autoImpersonate` behaviour is UNCHANGED (still a NODE-CAPABILITY switch; impersonation happens BEFORE the seam; if it resolves the account, the seam does not fire).
- [ ] `onUnknownSigner` has no `'impersonate'` value; the two settings stay orthogonal.
- [ ] Tests cover stories 4, 5, 6, 11 plus the push/pop and impersonation-first invariants (mirror the repo's existing `*.integration.test.ts` style using `@rocketh/test-utils`).
- [ ] `pnpm typecheck` and `pnpm test` pass.

## Blocked by

- `unknown-signer-error-type` — the seam throws that class.

## Prompt

> Wire the "unsignable `from`" seam into the single `broadcastTransaction` choke point in `packages/rocketh/src/environment/index.ts` so that a privileged call to an account rocketh cannot sign for surfaces a first-class `UnknownSignerError` (from `@rocketh/core`) instead of an opaque RPC failure. Because `deploy`, `execute`, `tx`, and the proxy upgrade path all funnel here, this single edit makes the mechanism transaction-agnostic; do NOT touch those upstream packages.
>
> FIRST, check this task against current reality (launch snapshot may have DRIFTED): confirm `broadcastTransaction` is still the single choke point in `packages/rocketh/src/environment/index.ts` and that the leftover-address `unnamedAccounts → {type:'remote', signer: provider}` loop still runs during environment setup. If either has shifted materially, route to needs-attention.
>
> Domain vocabulary: `autoImpersonate` is a NODE CAPABILITY switch (impersonate named unsignable accounts if the node supports it); `onUnknownSigner` is the policy for accounts that remain unsignable after impersonation. They are ORTHOGONAL — do not merge them, do not add `'impersonate'` as an `onUnknownSigner` value, and do not change `autoImpersonate` behaviour in this task. Impersonation runs BEFORE the seam; if it resolves the account, the seam never fires.
>
> Push/pop dynamic-scope override: expose `env._unknownSignerPolicyStack` (or an equivalent internal API — pick a name that reads clearly) with `push('throw')` / `pop()` helpers. The seam reads top-of-stack first, then falls back to the resolved global `onUnknownSigner`. This is safe because deploy scripts run sequentially (single-await). Document that invariant near the helper.
>
> Seams to test at: `createMockEnvironment` from `@rocketh/test-utils`. Drive txs through `broadcastTransaction` directly and via `execute` / `deploy` / a value transfer path to prove the mechanism is transaction-agnostic (story 5). Assert the `contract` payload is populated only via the execute path.
>
> Where to look: v1 reference `hardhat-deploy-v1/src/helpers.ts:1797` (the `unknown` fallback) — this task is the rocketh-clean version of that check, done ONCE at the choke point, not repeated in five places.
>
> Done means: an unwrapped unsignable call throws `UnknownSignerError` with a fully-populated payload; a signable call is unaffected; `autoImpersonate` still resolves what it always did; the wrapper package (next task) can push `'throw'` to force the policy for a scoped action.
