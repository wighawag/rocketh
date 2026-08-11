---
title: review-gate non-blocking nits for 'unknown-signer-integration-scenarios' (Gate 2 approve)
date: 2026-08-10
status: open
reviewOf: unknown-signer-integration-scenarios
needsAnswers: true
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'unknown-signer-integration-scenarios' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Story 7's JSDoc claims the re-run's idempotency comes entirely from on-chain state and 'not from anything rocketh wrote down', but only the UPGRADE skip is chain-derived. The second run skips the v2 implementation DEPLOY because of the persisted deployment record, not the chain. Since this file is the documentation deliverable, consider narrowing the claim to the deferred upgrade so a reader does not conclude deploy re-checks code on-chain.
  (packages/rocketh-unknown-signer/test/scenarios.integration.test.ts (Story 7 describe block JSDoc) vs packages/rocketh-deploy/src/index.ts:303-373, where the skip comes from env.getOrNull(name) plus a deployedBytecode-minus-CBOR compare, with no eth_getCode on that path.)
- Ratify: viem was added as a devDependency of @rocketh/unknown-signer, but the task pre-authorised only @rocketh/deploy, @rocketh/proxy, @rocketh/read-execute and @rocketh/test-utils. It is test-only (encodeFunctionData) and viem is already ubiquitous in the repo, so this looks fine, but it is an unratified dependency addition under the ask-first rule.
  (packages/rocketh-unknown-signer/package.json devDependencies; task pre-authorisation paragraph in work/tasks/done/unknown-signer-integration-scenarios.md.)
- Ratify: the commit also deletes the stale my-rocketh-project importer block from pnpm-lock.yaml (37 lines) as a pnpm install side effect, which is unrelated churn in an otherwise test-only change. I confirmed the directory does not exist and is not matched by pnpm-workspace.yaml globs (packages/\*, website), so it looks harmless, and it is recorded as an observation note.
  (pnpm-lock.yaml in 358661e; work/notes/observations/stale-lockfile-importer-my-rocketh-project.md; pnpm-workspace.yaml.)
- The new README section points readers at test/scenarios.integration.test.ts 'in this package', but package.json files is [dist, src], so the test file is not in the published npm tarball. A GitHub link would serve an npm reader better.
  (packages/rocketh-unknown-signer/README.md 'Worked examples'; packages/rocketh-unknown-signer/package.json files field.)
