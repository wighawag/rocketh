---
title: Migrate proxy and diamond tests onto createTestEnvironment
slug: migrate-proxy-diamond-tests
blockedBy: [test-env-harness]
covers: []
---

## What to build

MIGRATE step, batch 2 of 2 (`TASKING-PROTOCOL.md` §3a). Move the two higher-risk integration test files onto `createTestEnvironment`:

- `packages/rocketh-proxy/test/proxy.integration.test.ts`
- `packages/rocketh-diamond/test/diamond.integration.test.ts`

Separated from batch 1 deliberately: these suites deploy the MOST contracts per test, so they are the ones most exposed to harness defaults that only ever had to satisfy a fake.

**The likely failure is the receipt, and it is mechanical.** The old default `eth_getTransactionReceipt` returns the same `contractAddress` for every transaction, while a real environment reads a deployment's address from it. A diamond test deploys many facets plus a proxy, so without the per-transaction address that `test-env-harness` adds, every one of them lands on the same address. If something looks bizarre after the switch, check that first.

**What is NOT the risk, despite appearances:** neither package branches on `eth_getCode` (neither contains a single call to it). Both decide upgrade-versus-fresh from `env.getOrNull(name)`, the in-memory deployment record. And because every existing test builds a fresh environment with a fresh name, none of them reaches an upgrade path at all today — including the two commented-out proxy cases, which are transparent-proxy variants that would also take the fresh path. The `eth_call` / `eth_getStorageAt` calls in the proxy source only run once a prior deployment exists, so they should stay unreached. If you find yourself needing to mock them, stop and re-read what the test is actually driving — something has changed.

Resolve failures with canned per-test provider answers, or with a small explicitly-scoped harness option (never ambient statefulness), and record any harness addition with its rationale. If a test genuinely cannot pass within the harness's stated non-goal, do NOT park it on the legacy harness on your own authority: route the task to needs-attention with the specific provider behaviour required, so a human decides whether to widen the harness or change the test. Leaving cases behind quietly is how a repo ends up with two test realities forever, which is the exact defect this sequence exists to remove.

Preserve intent, as in batch 1: no test deleted, skipped, or weakened into a tautology.

## Acceptance criteria

- [ ] Both files use `createTestEnvironment`; no reference to `createMockEnvironment` remains in them. Nothing is parked on the legacy harness — a case that cannot be migrated bounces the task to needs-attention instead.
- [ ] Any harness addition is an explicit, per-test option, never ambient chain-state simulation, and is recorded with its rationale.
- [ ] Every migrated test's original intent is preserved; assertion changes are limited to those the old fake's shortcuts made necessary, and are noted.
- [ ] Each suite still drives the same code path it drove before (all current cases take the fresh-deployment path); no test silently stops exercising what it was written for. Do NOT add new upgrade-path tests here — that is separate work, not this migration.
- [ ] `pnpm typecheck`, `pnpm build` and `pnpm test` pass across the workspace.

## Blocked by

- `test-env-harness` — provides `createTestEnvironment`. File-orthogonal to `migrate-deploy-and-read-tests`; the two may run in parallel.

## Prompt

> Move `packages/rocketh-proxy/test/proxy.integration.test.ts` and `packages/rocketh-diamond/test/diamond.integration.test.ts` onto the real-environment `createTestEnvironment`.
>
> FIRST, check this task against current reality (launch snapshot may have DRIFTED): confirm `createTestEnvironment` landed, and read its stated non-goal about chain-state simulation before you start — it constrains how you are allowed to fix failures here.
>
> Read `packages/rocketh-proxy/src/index.ts` and `packages/rocketh-diamond/src/index.ts` around their `env.getOrNull(name)` branches before you start, so you know which path each test actually drives. Every current test builds a fresh environment with a fresh name, so all of them take the fresh-deployment path; the `eth_call` / `eth_getStorageAt` calls in the proxy source sit behind a prior-deployment check and should stay unreached. Do not add mocks for them speculatively, and do not add upgrade-path tests here.
>
> The failure to expect is mundane: the old default receipt returned one `contractAddress` for every transaction, so if `test-env-harness`'s per-transaction address did not land, every facet of a diamond will collide on one address. Check that before theorising.
>
> Resolve failures with canned per-test provider answers, or with an explicit per-test harness option (never ambient chain-state simulation, per the harness's stated non-goal). If a case genuinely cannot pass inside that fence, route this task to needs-attention with the specific provider behaviour required. Do NOT leave it on the legacy `createMockEnvironment`: you cannot mint the follow-up task that would track it, so it would simply become a permanent second test reality.
>
> Watch for the failure that matters more than a red test: a migrated suite that still passes while no longer driving what it was written for. Check what each test actually exercises, not just that it is green.
>
> Done means: both suites run against a genuine environment, still drive the same paths, and nothing is left behind on the old harness.
