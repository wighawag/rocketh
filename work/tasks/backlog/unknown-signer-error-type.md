---
title: UnknownSignerError type in @rocketh/core
slug: unknown-signer-error-type
spec: unknown-signer-core
blockedBy: []
covers: [4]
---

## What to build

Add a shared `UnknownSignerError` to `@rocketh/core` and export it from the package's public entry. The error carries the exact transaction a human/multisig must execute out-of-band, mirroring hardhat-deploy v1's `errors.ts`:

- `from: 0x${string}` (required — the unsignable account)
- `to?: 0x${string}` (optional — omitted for contract deploys)
- `data?: 0x${string}` (optional — calldata / init code)
- `value?: bigint | 0x${string}` (optional)
- `contract?: { name: string; method: string; args: readonly unknown[] }` (optional — populated only when the tx originated from an `execute` call, so the printed message can name the intended function)

The class extends `Error` with a stable `name` ("UnknownSignerError") so downstream packages can `err instanceof UnknownSignerError` OR fall back to `err.name === 'UnknownSignerError'` across dual-published boundaries. The `message` should be a v1-style human-readable summary (the details block that says which account is missing a signer + the tx fields) so unwrapped throws are self-explanatory in a stack trace.

Ship with unit tests that:
- construct the error with only `{from}` and with the full payload including `contract`,
- assert `instanceof Error`, `instanceof UnknownSignerError`, `name === 'UnknownSignerError'`,
- assert the payload fields survive round-trip,
- assert the default `message` contains `from` and (when set) `to`, so an unwrapped throw is legible.

## Acceptance criteria

- [ ] `UnknownSignerError` class exported from `@rocketh/core` (both as a value and as a type).
- [ ] Payload shape matches the spec exactly (`from` required; `to`, `data`, `value`, `contract` optional).
- [ ] `name` is the string `'UnknownSignerError'` (survives cross-realm checks).
- [ ] Default `message` is human-readable and includes `from` (and `to` when present).
- [ ] Unit tests cover construction, identity checks, payload round-trip, and message content.
- [ ] `pnpm typecheck` and `pnpm test` pass for `@rocketh/core`.

## Blocked by

- None — can start immediately.

## Prompt

> Add a `UnknownSignerError` to `@rocketh/core` (`packages/rocketh-core`). It is the single carrier for "the tx a human/multisig must execute out-of-band", surfaced when a privileged call targets an account rocketh cannot sign for (e.g. a Safe proxy owner).
>
> FIRST, check this task against current reality (launch snapshot may have DRIFTED): confirm `@rocketh/core` still exists at `packages/rocketh-core` and its public entry is `src/index.ts` re-exporting from `types.ts`. If the export layout has shifted, route to needs-attention rather than guessing.
>
> Domain vocabulary: an "unsignable `from`" is an address for which `env.addressSigners[from]` has no real local signer (see `packages/rocketh/src/environment/index.ts`, the `broadcastTransaction` choke point). The v1 reference is `hardhat-deploy-v1/src/errors.ts` — port the shape, not the code.
>
> Where to look: `packages/rocketh-core/src/index.ts` for exports; `packages/rocketh-core/src/types.ts` for existing type patterns; existing tests under `packages/rocketh-core/test/` (or `src/*.test.ts` if that's the style) for test conventions.
>
> Seams to test at: pure unit — construct the error, assert identity + payload + message. No environment plumbing yet — that's the next task.
>
> Done means: importers can `import {UnknownSignerError} from '@rocketh/core'`, `throw` it, `catch` it with `instanceof`, and read all payload fields off it. Follow-on tasks (`unknown-signer-broadcast-seam`, `unknown-signer-package`) depend on this class.
