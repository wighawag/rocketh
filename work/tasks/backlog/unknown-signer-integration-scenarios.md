---
title: Unknown-signer integration scenarios (Safe proxy upgrade + tx-agnostic + mixed run + idempotent re-run)
slug: unknown-signer-integration-scenarios
spec: unknown-signer-core
blockedBy: [unknown-signer-package, unknown-signer-contract-enrichment]
covers: [1, 5, 6, 7, 8]
---

## What to build

A vertical test file (or a small cluster) under `@rocketh/unknown-signer`'s `test/` folder that is the headline documentation for the seam plus the wrapper. These must READ as example scripts, not as brittle unit tests: they are what a v1 user reads to see how to port.

Scenarios:

1. **Safe-governed proxy upgrade (story 1), the headline.** Deploy an implementation signed by the local deployer. Then attempt an upgrade whose `from` is a "Safe" account — an unsignable named address in the test environment (no local signer, `autoImpersonate: false`). Assert the upgrade tx is caught, the returned `{from, to, data, value}` is what a real Safe would need to submit, and the surrounding script continues past the wrapped step.

2. **Transaction-agnostic (story 5).** Repeat the caught-and-returned assertion for a plain transaction sent via the `tx()` helper, a deploy whose deployer is the unsignable account (no `to` in the payload), an execute from the unsignable account (the printed message includes the `contract` block; the returned object does not), and a value transfer (a `tx()` call carrying `value`). All go through the same choke point, which is what proves this is one seam and not four.

   Vocabulary trap: do NOT write this against `TransactionToBroadcast` with `type: 'raw'`. That means an already-signed transaction, which returns before any signer lookup and can never produce an `UnknownSignerError`. The plain-transaction path that reaches the seam is `tx()`.

3. **Mixed run (story 6).** In ONE script, drive both a signable deploy (broadcasts normally, real receipt) and an unsignable wrapped upgrade (caught). Assert the signable one produced on-chain state and the unsignable one did not.

4. **Idempotent re-run (story 7).** After the first run's wrapped catch, simulate the Safe executing the tx by moving on-chain state directly. Re-run the same script: the deploy's own idempotency check sees the new state and SKIPS the previously-deferred step, nothing throws, and `catchUnknownSigner` returns `null`. Nothing is persisted between runs — no state file is read or written, the idempotency comes entirely from on-chain state.

5. **`autoImpersonate: false` routes to the seam (story 8).** With `autoImpersonate: false` at run/chain level and a named account with no local signer, assert BOTH that an unwrapped call throws `UnknownSignerError` and that a wrapped call returns the expected tx. This is the supported way to exercise the unknown-signer path on a fork or dev node; it is deliberately NOT done by making `catchUnknownSigner` override impersonation (ADR 0006).

Each test carries a short JSDoc explaining the real-world scenario, per the repo's integration-tests-as-documentation convention. Use `createTestEnvironment` (the real-environment harness, not the legacy `createMockEnvironment`) and `createMockArtifact` from `@rocketh/test-utils`.

Note on overlap: stories 5 and 6 are also covered by `unknown-signer-broadcast-seam`. Deliberate, not duplication — there they are seam-level tests driven through the choke point, here they are user-facing scenarios driven through `catchUnknownSigner`.

## Acceptance criteria

- [ ] The Safe-governed proxy upgrade runs end-to-end through `catchUnknownSigner` (story 1).
- [ ] Transaction-agnostic behaviour is demonstrated across `tx()` / deploy / execute / value transfer (story 5), with the `contract` enrichment visible on the execute path's printed output and absent from the return.
- [ ] Mixed-run test proves signable txs broadcast while unsignable ones are caught in the same script (story 6).
- [ ] Idempotent-re-run test proves the second run skips the deferred step and does not throw (story 7), with no persisted file read or written.
- [ ] `autoImpersonate: false` scenario shows both unwrapped-throw and wrapped-catch (story 8).
- [ ] Every test carries a JSDoc explaining its scenario and reads as an example script.
- [ ] Tests do not write outside their own temp fixtures; assert no unsigned-transactions file or similar appears.
- [ ] `pnpm test` passes.

## Blocked by

- `unknown-signer-package` — these drive `catchUnknownSigner`.
- `unknown-signer-contract-enrichment` — scenario 2 asserts the `contract` block on the execute path.

## Prompt

> Write the headline integration tests for the unknown-signer feature under the `@rocketh/unknown-signer` package. They double as the documentation a v1 user reads to see how to port their scripts, so legibility is a requirement, not a nicety: each test gets a JSDoc explaining the scenario, and the body reads like a real deploy script.
>
> FIRST, check this task against current reality (launch snapshot may have DRIFTED): confirm the seam and the wrapper landed with the shapes their tasks specified. If the return shape or the config keys shifted, route to needs-attention.
>
> Domain vocabulary: an "unsignable `from`" is an address that classifies as `unsignable` in the environment's signability view — no local signing material, not in `eth_accounts`, and not impersonated. In tests, get that by adding a named address to the config with no signer material and setting `autoImpersonate: false`. The "Safe" here is just an unsignable named account; there is no Safe-specific code, and v1 had none either.
>
> Note that `catchUnknownSigner` takes a THUNK, not a promise: write `catchUnknownSigner(env)(() => execute(...))`. The promise form is a compile error by design.
>
> Constraining decision (ADR 0006): `autoImpersonate: false` is the supported way to exercise this path on a fork. `catchUnknownSigner` does NOT override impersonation, so do not write a test that expects it to.
>
> Where to look: `packages/rocketh-deploy/test/*.integration.test.ts` and `packages/rocketh-proxy/test/*.integration.test.ts` for the integration-tests-as-documentation style; `@rocketh/test-utils` for `createTestEnvironment` (the real-environment harness) and `createMockArtifact`. Story 1 wants a proxy-upgrade shape — reuse whatever proxy helper the repo already exposes rather than rolling a new one.
>
> Seams to test at: the wrapped `catchUnknownSigner(env)(async () => { ... })` call. Assert both the returned shape and the surrounding script's ability to continue. For the idempotent re-run, simulate the Safe execution by moving on-chain state directly on the mock provider; the deploy script's own idempotency check should then see it and skip.
>
> Key invariant to preserve: **nothing is persisted.** Assert no unsigned-tx file appears between the first run and the re-run — idempotency comes entirely from on-chain state.
>
> Done means: reading these tests tells a v1 user exactly what `catchUnknownSigner` does in rocketh, and confirms the print, execute out-of-band, re-run loop works end to end.
