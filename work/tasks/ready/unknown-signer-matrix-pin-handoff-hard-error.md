---
title: 'Matrix entry: pin today''s hard-throw behaviour of the deployer-to-governance handoff'
slug: unknown-signer-matrix-pin-handoff-hard-error
spec: governance-topology-validation
blockedBy: [unknown-signer-matrix-idempotent-rerun-before-execution]
covers: [6, 10]
---

## What to build

Extend the matrix with a scenario that reproduces TODAY'S behaviour of the deployer-to-governance handoff: a proxy admin whose on-chain owner is still the deployer, but the deploy script names the multisig as `owner`. Assert that `deployViaProxy` throws the plain `Error` ("To change owner/admin, you need to call transferOwnership on …") — NOT an `UnknownSignerError` — and that `catchUnknownSigner` rethrows it (i.e. does not swallow it as a deferral).

The test is a PIN: it locks the current (undesired) behaviour so that any change to it is a deliberate test flip, not an accidental regression. Include a comment naming the DESIRED behaviour (defer a `transferOwnership` from the current owner, or otherwise route this without a hard throw) and pointing at the `unsignable-routes` spec that will fix it.

Also cover the reassuring adjacent case that the demo README calls out: while the deployer still owns the admin, a WRAPPED `transferOwnership` is signable, broadcasts, and returns `null` — proving `catchUnknownSigner` is harmless around signable calls.

## Acceptance criteria

- [ ] New integration test(s) in `packages/rocketh-unknown-signer/test/` pin the handoff hard-error behaviour.
- [ ] Test asserts the thrown error is a plain `Error` (not `UnknownSignerError`) with the expected message shape.
- [ ] Test asserts `catchUnknownSigner` propagates it (does not swallow to a deferred tx).
- [ ] A companion assertion / test shows that a wrapped `transferOwnership` from the current (signable) deployer broadcasts and returns `null`.
- [ ] A comment on the pinning assertion names the intended behaviour and points at the `unsignable-routes` spec so the fix flips this test rather than discovering an untested path.
- [ ] Uses `createTestEnvironment` / `createMockArtifact`.
- [ ] `pnpm --filter @rocketh/unknown-signer test` passes.

## Blocked by

- `unknown-signer-matrix-idempotent-rerun-before-execution` — serialized to avoid parallel edits to `scenarios.integration.test.ts`.

## Prompt

> Goal: record the deployer-to-governance handoff's CURRENT hard-throw as an executable pin, so the eventual fix flips a test rather than discovers an untested path.
>
> FIRST, check this task against current reality. Read the demo `demoes/hardhat-deploy/governance/deploy/005_ownership_handoff.ts` and the README section "The deployer-to-governance handoff" — the sharp edge, the reassurance about signable wraps, and the pattern that works today (declare the owner you currently have; do the transfer as an explicit step; then upgrade). Read `packages/rocketh-unknown-signer/test/scenarios.integration.test.ts` for style. Read `work/specs/proposed/unsignable-routes.md` (or search `work/specs/` for `unsignable-routes`) so your pinning comment can point at the correct slug.
>
> Domain vocabulary: `catchUnknownSigner`, `UnknownSignerError` (subpath export from `@rocketh/unknown-signer/errors` per the extension-package export rules), `deployViaProxy`'s `owner` option as an ASSERTION about current on-chain owner (not a wish), signable vs unsignable.
>
> Seam: `deployViaProxy` reads the admin's on-chain owner; the seam here is the pre-owner-mismatch throw INSIDE the extension, upstream of `broadcastTransaction`. The pin test forces that throw path.
>
> "Done" means: a describe block that (a) reproduces the throw and locks its shape, (b) asserts the wrapper does not swallow it, (c) shows the harmless-when-signable adjacent case, and (d) carries a comment describing the intended future behaviour so a reviewer can see this is a PIN, not the endorsement of a bug.
