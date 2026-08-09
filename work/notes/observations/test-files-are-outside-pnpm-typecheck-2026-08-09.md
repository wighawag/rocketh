---
title: test files are outside `pnpm typecheck`, so `@ts-expect-error` in a test is never enforced
slug: test-files-are-outside-pnpm-typecheck-2026-08-09
needsAnswers: true
---

# `pnpm typecheck` covers `src/**` only, so type-level assertions in tests are unenforced

Spotted 2026-08-09 while building `@rocketh/unknown-signer` (task `unknown-signer-package`).

## What was seen

Every package's `tsconfig.json` is `"include": ["src/**/*.ts"]`, and the root `typecheck` script is `pnpm -r --parallel exec tsc --noEmit`, which runs each package's own `tsconfig.json`. Test files are therefore never type-checked, by `pnpm typecheck` or by the `verify` gate (which runs `format:check`, `changeset status`, `build`, `test`, `test:getting-started` — no `typecheck` at all). Vitest does not type-check either.

## Why it might matter

A test that asserts a COMPILE-TIME contract with `@ts-expect-error` (for example that `catchUnknownSigner`'s v1 promise-form call does not compile) reads as an assertion but nothing verifies it: if the type later widened and the call started compiling, the now-unused directive would be a TS error that no CI step runs. More generally, a test file can drift out of type-correctness indefinitely.

The compile-time half of the thunk-only divergence was verified manually for that task with a one-off `tsc --noEmit` over `src` + `test`; the package layout was deliberately left identical to its siblings rather than growing a bespoke second tsconfig. A repo-wide decision (a `tsconfig.test.json` per package plus a `typecheck` step in the gate, or nothing) belongs to whoever owns the build config.
