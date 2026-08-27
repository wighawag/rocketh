---
title: '@rocketh/export typecheck tests flake on vitest default 5s timeout under load'
type: observation
status: spotted
spotted: 2026-08-27
needsAnswers: false
---

# The four `tsc`-running tests in `packages/rocketh-export/test/export.test.ts` time out intermittently

Spotted while running `pnpm test` repeatedly for the storage-guard task: four tests under "the generated TypeScript compiles for real consumers" (`export.test.ts:551`, `:576`, `:587`, `:605`) fail with `Test timed out in 5000ms`, and the same suite passes on the next run with nothing changed. They each invoke a real `tsc` compile through the file's `typecheck` helper, and `packages/rocketh-export/vitest.config.ts` sets no `testTimeout`, so they run against vitest's 5s default; the failures track machine load rather than any code change (`@rocketh/export` does not depend on the package this task touched). Not fixed here, out of scope, but it makes `pnpm test` non-deterministic, which is the first thing a red acceptance gate will be blamed on.
