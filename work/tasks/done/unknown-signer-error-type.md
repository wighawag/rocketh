---
title: UnknownSignerError type in @rocketh/core
slug: unknown-signer-error-type
spec: unknown-signer-core
blockedBy: []
covers: []
needsAnswers: true
---

<!-- covers is empty deliberately: this task builds the class only. Story 4 (an unwrapped call
     HALTS with a clear UnknownSignerError) is delivered by `unknown-signer-broadcast-seam`. -->

## What to build

Add a shared `UnknownSignerError` to `@rocketh/core` and export it from the package's public entry. The error carries the exact transaction a human/multisig must execute out-of-band, mirroring hardhat-deploy v1's `errors.ts`:

- `from` (required) — the unsignable account.
- `to?` — omitted for contract deploys.
- `data?` — calldata / init code.
- `value?`.
- `contract?: {name?: string; method: string; args: readonly unknown[]}` — populated only when the tx originated from an `execute` call, so the printed message can name the intended function.

**`contract.name` is OPTIONAL.** This is a ratified decision, not an oversight: `MinimalDeployment` is `{address, abi}` and carries no name, and widening that core type so an error message can be prettier was rejected (see ADR 0006). The name is resolved opportunistically downstream by reverse-lookup, and is simply absent when the target address matches no known deployment. Do NOT make it required, and do NOT add a name to `MinimalDeployment`.

The class extends `Error` with a stable `name` (`'UnknownSignerError'`) so downstream packages can use `err instanceof UnknownSignerError` OR fall back to `err.name === 'UnknownSignerError'` across dual-published boundaries. The `message` should be a v1-style human-readable summary (which account is missing a signer, plus the tx fields, plus the `contract` block when present) so an unwrapped throw is self-explanatory in a stack trace.

## Acceptance criteria

- [ ] `UnknownSignerError` exported from `@rocketh/core` as both a value and a type.
- [ ] Payload shape matches the spec exactly: `from` required; `to`, `data`, `value`, `contract` optional; `contract.name` optional within `contract`.
- [ ] `name` is the string `'UnknownSignerError'` (survives cross-realm identity checks).
- [ ] Default `message` is human-readable and includes `from` (and `to` when present, and the `contract` block when present, falling back to the `to` address when `contract.name` is absent).
- [ ] `MinimalDeployment` is UNCHANGED.
- [ ] Unit tests cover construction with only `{from}` and with the full payload, `instanceof Error` / `instanceof UnknownSignerError` / `name` identity, payload round-trip, and message content both with and without `contract.name`.
- [ ] A changeset accompanies the change (`@rocketh/core` is published and the verify gate runs `changeset status`).
- [ ] `pnpm typecheck` and `pnpm test` pass for `@rocketh/core`.

## Blocked by

- None — can start immediately.

## Prompt

> Add an `UnknownSignerError` to `@rocketh/core` (`packages/rocketh-core`). It is the single carrier for "the tx a human/multisig must execute out-of-band", surfaced when a privileged call targets an account rocketh cannot sign for (for example a Safe that owns a proxy).
>
> FIRST, check this task against current reality (launch snapshot may have DRIFTED): confirm `@rocketh/core` still lives at `packages/rocketh-core` and its public entry re-exports from `types.ts`. If the export layout has shifted, route to needs-attention rather than guessing.
>
> Domain vocabulary: an "unsignable `from`" is an address rocketh has no way to sign for after account resolution AND after auto-impersonation. Note that it is NOT "an address with no entry in `env.addressSigners`" — a named account declared as a plain address gets a `{type:'remote'}` entry regardless, which is exactly why a sibling task introduces an explicit signability classification. You do not need that classification here; you are only building the error type.
>
> Constraining decision (ADR 0006, `docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md`): `contract.name` is OPTIONAL and is resolved later by reverse-lookup. Do NOT widen `MinimalDeployment` to carry a name.
>
> The hardhat-deploy v1 shape, inlined so you need no external checkout (any local v1 clone lives under the gitignored `tmp/`, so do not rely on it): v1's `UnknownSignerError` carries `data: {from, to?, value?, data?, contract?: {name, method, args}}` and is thrown from its account-resolution fallback. Port the SHAPE, not the code, and note the one deliberate divergence: v1 makes `contract.name` required, we make it optional.
>
> Where to look: `packages/rocketh-core/src/index.ts` for the export style, `packages/rocketh-core/src/types.ts` for existing type patterns, and the existing tests in that package for test conventions.
>
> Seams to test at: pure unit. Construct the error, assert identity, payload and message. No environment plumbing here — that is the seam task.
>
> Done means: importers can `import {UnknownSignerError} from '@rocketh/core'`, throw it, catch it with `instanceof`, and read every payload field off it. `unknown-signer-broadcast-seam` and `unknown-signer-package` both depend on this class.
