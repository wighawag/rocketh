---
title: '`pnpm format:check` covers `src/**` only, so three test files are already unformatted'
slug: format-check-covers-src-only-2026-08-10
needsAnswers: true
---

# `format:check` globs `packages/*/src/**/*.ts`, so `test/**` drifts unformatted

Spotted 2026-08-10 while migrating the deploy/read tests onto `createTestEnvironment` (task `migrate-deploy-and-read-tests`).

The root script is `prettier --check "packages/*/src/**/*.ts"`, and that is what the `verify` gate runs. Running prettier over `packages/*/test/**/*.ts` today reports three files already out of style: `packages/rocketh-read-execute/test/unknown-signer-contract.integration.test.ts`, `packages/rocketh-unknown-signer/test/catchUnknownSigner.integration.test.ts`, `packages/rocketh/test/addressSignability.test.ts`. Not fixed here (out of this task's scope), and not urgent while the glob stays as it is, but widening the glob later will produce a diff touching unrelated files. Same shape as `test-files-are-outside-pnpm-typecheck-2026-08-09`: the repo's per-change tooling is scoped to `src`, while `test/` is where the integration-tests-as-documentation convention says the value is.
