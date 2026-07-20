---
title: Unknown-signer integration scenarios (Safe-proxy-upgrade + mixed-run + idempotent re-run + tx-agnostic)
slug: unknown-signer-integration-scenarios
spec: unknown-signer-core
blockedBy: [unknown-signer-package]
covers: [1, 5, 6, 7, 8]
---

## What to build

A single vertical test file (or a small cluster) under the new `@rocketh/unknown-signer` package's `test/` folder that serves as the headline documentation for the seam + wrapper. These tests must READ as example scripts, not as brittle unit tests — they are the docs a v1 user reads to see how to port.

Scenarios:

1. **Safe-governed proxy upgrade (story 1) — the headline.** Deploy an implementation signed by the local deployer. Then attempt an upgrade whose `from` is a "Safe" account (an unsignable named address in the test env: not locally signable, `autoImpersonate: false`). Assert the upgrade tx is caught, the returned `{from,to,data,value}` matches what a real Safe would need to submit, and the surrounding script continues past the wrapped step.

2. **Transaction-agnostic (story 5).** Repeat the caught-and-returned assertion for each of:
   - a RAW tx from the unsignable `from`,
   - a `deploy` whose deployer is the unsignable `from` (no `to` in the returned payload — it's a contract deploy),
   - an `execute` from the unsignable `from` (assert the printed message includes `contract {name, method, args}`, though the returned object itself does not),
   - a plain value transfer from the unsignable `from`.
   All four go through the same seam; this proves the mechanism is a single choke-point, not per-path.

3. **Mixed run (story 6).** In ONE script, drive both a signable deploy (broadcasts normally, returns a real receipt) and an unsignable wrapped upgrade (caught). Assert the signable one produced on-chain state and the unsignable one did not.

4. **Idempotent re-run (story 7).** After the first run's wrapped catch, SIMULATE the Safe executing the tx by mutating on-chain state directly (the test-env equivalent of "the Safe went and did it"). Re-run the same script. The idempotency check (whatever the deploy uses — implementation address equality, an admin readback, etc.) sees the new state and SKIPS the previously-deferred step; nothing is thrown, `catchUnknownSigner` returns `null`. Nothing is persisted across runs — no state file consulted, only on-chain state.

5. **`autoImpersonate: false` routes to the seam (story 8).** Set `autoImpersonate: false` at run/chain level, use a named account with no local signer, and assert BOTH: unwrapped call throws `UnknownSignerError`; wrapped call returns the expected tx.

Each test carries a short JSDoc explaining the real-world scenario it demonstrates (per the repo's integration-tests-as-documentation convention). Use `createMockEnvironment` + `createMockArtifact` from `@rocketh/test-utils`.

## Acceptance criteria

- [ ] Integration tests exercise the Safe-governed proxy upgrade end-to-end (story 1) via `catchUnknownSigner`.
- [ ] Tests demonstrate transaction-agnostic behaviour across raw tx / deploy / execute / value transfer (story 5), with the `contract` enrichment visible for the execute path.
- [ ] Mixed-run test proves signable txs broadcast and unsignable ones are caught in the same script (story 6).
- [ ] Idempotent-re-run test proves that once on-chain state changes, the same script skips the previously-deferred step and does not throw (story 7); no persisted file is read or written.
- [ ] `autoImpersonate: false` scenario shows both the unwrapped-throw and wrapped-catch behaviours (story 8).
- [ ] Each test reads as a documentation example (JSDoc block explaining the scenario).
- [ ] Tests do not write outside their own temp fixtures — assert no `.unsigned_transactions.json` or similar sneaks in.
- [ ] `pnpm test` passes.

## Blocked by

- `unknown-signer-package` — depends on `catchUnknownSigner` existing.

## Prompt

> Write the headline integration tests for the unknown-signer feature under the new `@rocketh/unknown-signer` package. These tests double as the documentation a v1 user reads to see how to port their scripts, so they must be legible: each `it(...)` gets a JSDoc explaining the scenario, and the code inside reads like a real deploy script.
>
> FIRST, check this task against current reality (launch snapshot may have DRIFTED): confirm the seam and the wrapper landed with the shapes their tasks specified. If the return shape or the config keys shifted, route to needs-attention.
>
> Domain vocabulary: an "unsignable `from`" is a named account with no local signer AND not auto-impersonated. In tests, get that by adding a named address to the config, giving it no signer material, and setting `autoImpersonate: false`. The "Safe" in these tests is just an unsignable named account — no Safe-specific code exists (v1 had none either).
>
> Where to look: `packages/rocketh-deploy/test/*.integration.test.ts` and `packages/rocketh-proxy/test/*.integration.test.ts` for the integration-tests-as-documentation style. `@rocketh/test-utils` for `createMockEnvironment` / `createMockArtifact`. Story 1 wants a proxy-upgrade shape — reuse whatever proxy helper the repo already exposes (do not roll a new one).
>
> Seams to test at: the wrapped `catchUnknownSigner(env)(async () => { ... })` call. Assert the returned object shape AND the surrounding script's ability to keep going. For the idempotent re-run (story 7), simulate the Safe execution by moving on-chain state directly (e.g. writing the new implementation slot on the mock provider, or re-deploying with a stub that leaves the target state in place); the deploy script's own idempotency check should then see the new state and skip.
>
> Key invariant to preserve: **nothing is persisted.** Assert no unsigned-tx file appears on disk between the "first run" and the "re-run" — idempotency comes entirely from on-chain state.
>
> Done means: reading these tests explains to a v1 user exactly what `catchUnknownSigner` does in rocketh and confirms the "print → execute out-of-band → re-run" loop works end-to-end.
