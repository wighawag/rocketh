---
title: 'Pin catchUnknownSigner v1 parity: return-shape, no-side-effects, thunk-misuse'
slug: v1-parity-tests-catch-unknown-signer
spec: unknown-signer-v1-migration
blockedBy: []
covers: [2, 3, 6, 7]
---

## What to build

A dedicated parity test file in `@rocketh/unknown-signer` that PINS the hardhat-deploy v1 compatibility promise as tests, so a future change (a new field, a persisted file, a different print) that would break a migrated v1 script cannot merge quietly. This is a pinning layer on top of the existing behavioural tests — the runtime already behaves correctly; the point is that a regression would go RED.

Three groups of assertions, all in one integration test file so the parity contract is discoverable in one place:

- **Return-shape parity.** On success, `catchUnknownSigner` returns exactly `null`. On the deferral path, it returns an object with the exact key SET `{from, to, value, data}` — assert key PRESENCE with `'to' in result` / `Object.keys(result).sort()`, INCLUDING when the underlying value is `undefined` (v1 returned a destructure, so a consumer may do `'to' in result` or serialise via `Object.keys`). Assert `value` is a `string` (or `undefined`), never a bigint. Assert `contract` is NEVER a key on the returned object even when the underlying error carries one. Assert that any hypothetical additive field would still leave the four core keys present with their v1 meanings.
- **No side effects (filesystem + records).** Run a deferring script under a REAL filesystem-backed deployment store (see `@rocketh/node`) pointed at a temp dir. Snapshot the temp dir contents (recursive list + per-file bytes) BEFORE and AFTER the deferring run and assert byte-identical. Also assert no writes to the deployment store (the existing test already spies on the store — reuse or extend). This is what makes it a test failure if a future batching / Safe-proposal feature quietly starts persisting.
- **Thunk-misuse loudness.** The existing tests cover the promise-form and non-callable cases; consolidate/extend them here so the parity contract is complete in one file, and assert the error MESSAGE names the fix (contains `() =>` and identifies `@rocketh/unknown-signer` and the wrapper name).

Test-isolation rule applies: point the filesystem-backed store at a scratch temp dir; do not touch any real user path.

## Acceptance criteria

- [ ] New integration test file under `packages/rocketh-unknown-signer/test/` (name it after "v1-parity" so its purpose is obvious) with the three groups above.
- [ ] Return-shape group asserts key PRESENCE of `from`, `to`, `value`, `data` even when the underlying value is `undefined`, and asserts `contract` is never a key.
- [ ] Return-shape group asserts `null`-on-success and `value` is always a string (or `undefined`), never a bigint.
- [ ] No-side-effects group snapshots a temp dir before/after a deferring run and asserts byte-identical; also asserts the deployment store received no writes.
- [ ] Thunk-misuse group covers promise-form and non-function argument, asserting the error message names the arrow-function fix and the wrapper name.
- [ ] Tests run in the package's normal `pnpm test`; use `createTestEnvironment` from `@rocketh/test-utils`.
- [ ] Tests ISOLATE the filesystem write to a temp/scratch dir (via the deployment-store folder option) AND assert that the real user home / repo tree is untouched by the run.

## Blocked by

- None — can start immediately.

## Prompt

> Goal: pin the hardhat-deploy v1 compatibility promise for `catchUnknownSigner` as tests, so a future change that would break a migrated v1 script fails a red test rather than surfacing as a silent behaviour change on a user's Safe.
>
> FIRST, check this task against current reality (launch snapshot). Read the source at `packages/rocketh-unknown-signer/src/index.ts` and the existing tests in `packages/rocketh-unknown-signer/test/catchUnknownSigner.integration.test.ts` — several of the assertions this task asks for already exist (return-shape keys.sort, `contract`-not-present, thunk-misuse, deployment-store no-writes). Do NOT duplicate blindly; the point of this task is to CONSOLIDATE and EXTEND the parity contract in ONE file that a reviewer can point at, and to ADD what is missing: (1) explicit `'to' in result` / `'value' in result` / `'data' in result` assertions when those values are `undefined` (v1 returned a destructure, so `in`-checks matter), and (2) a filesystem byte-identical snapshot around a deferring run, not just deployment-store spies.
>
> Vocabulary: "parity" here means what the spec `work/specs/tasked/unknown-signer-v1-migration.md` calls the hard compatibility promise — the four keys, always present, `null`-on-success, `value` as a string, no persistence, thunk-only. `UnknownSignerError` carries `UnknownSignerErrorData` (see `@rocketh/core`). The seam that decides sign-vs-defer lives in the core; `catchUnknownSigner` is a shim on top.
>
> Where to look: `@rocketh/unknown-signer` (this package), `@rocketh/test-utils` (`createTestEnvironment`, `createMockArtifact`), `@rocketh/node` (filesystem deployment store), and the existing integration tests in this package as prior art for setup helpers (`safeOwnerEnvironment` etc.).
>
> Seams to test at: the wrapper's return value shape; the deployment store's write/delete methods; the actual temp directory on disk before/after a deferring run. Do NOT test the seam itself here (that is `@rocketh/core`'s job) — test what the WRAPPER returns and does not do.
>
> Done means: `pnpm --filter @rocketh/unknown-signer test` passes with the new file; each of the three parity groups has at least one test whose failure would flag a real regression (a hypothetical PR that starts persisting a batch file, or drops a key when `undefined`, or stops stringifying `value`, would fail one of these tests); the filesystem snapshot asserts against a temp dir, never a real user path.
>
> Constraining ADR: `docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md` explains why persistence is not a wrapper concern.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your final report (e.g. how you chose to snapshot the temp dir; whether you added new fixtures; whether you re-exported or duplicated an existing helper).
