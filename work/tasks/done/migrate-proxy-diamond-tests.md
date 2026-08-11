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

## Requeue 2026-08-10

Gate-3 BLOCK (conductor), 2026-08-10: the new facet-address block's inline rationale in packages/rocketh-diamond/test/diamond.integration.test.ts:114-127 is FALSE and must be reworded. Facets default to deterministic (packages/rocketh-diamond/src/index.ts:124), their address is create2-computed (packages/rocketh-deploy/src/index.ts:438), and the environment PREFERS it over the receipt (packages/rocketh/src/environment/index.ts:846: pendingDeployment.expectedAddress || receipt.contractAddress). So those four addresses would have been distinct under the OLD single-address receipt too; the comment is not the guard it claims to be, and it contradicts this file's own (correct) header. Reword it to state what the block really pins: four DISTINCT CREATE2 facet contracts, plus the diamond itself as a SEPARATE, RECEIPT-DERIVED proxy in front of them. Keep every assertion; weaken nothing. The proxy test's equivalent comment at :84-95 IS accurate (implementation and proxy are non-deterministic) - leave it alone. Also record the two ADDED assertion blocks in the commit body as deliberate strengthenings of toBeDefined-only cases, since acceptance criterion 3 fences assertion changes to those the old fake's shortcuts made necessary and the diamond block sits outside that fence. Everything else in the PR was verified good and must NOT be redone: no legacy harness reference remains, zero harness change, fresh path still driven (no eth_call/eth_getStorageAt), commented-out transparent cases still commented, create2 fixture collision correctly left as an observation, lockfile clean, empty changeset correct.

## Decisions

_Transcribed from `work/notes/observations/decision-added-assertions-migrate-proxy-diamond-tests-2026-08-10.md`, deleted in the same commit. That note predated the protocol rule (synced 2026-08-11) that gives a builder's rationale exactly ONE home: a `## Decisions` block in the done record. The rationale is reproduced unchanged below, followed by the human's ratification._

### Added two assertion blocks beyond a pure port

**Chosen:** while migrating the proxy and diamond integration suites onto `createTestEnvironment`, two new assertion blocks were added on top of the mechanical harness swap:

- `packages/rocketh-proxy/test/proxy.integration.test.ts` (basic ERC173 case): implementation address != proxy address, `deployment.address === <name>_Proxy.address`, merged ABI is larger than the artifact ABI.
- `packages/rocketh-diamond/test/diamond.integration.test.ts` (basic diamond case): four facets are four distinct create2 addresses matching their saved deployments, and the diamond itself is a separate, receipt-derived proxy address that is not one of the facets.

**Why:** both cases previously asserted only `toBeDefined()` on the deployment and its address, so they were green for any address the harness happened to return and documented nothing about the deployment graph the code builds. The migration is exactly the moment those addresses become real, so pinning the graph is cheap here.

**What it touches:** acceptance criterion 3 of `work/tasks/done/migrate-proxy-diamond-tests.md` fences assertion changes to "those the old fake's shortcuts made necessary". The proxy block sits inside that fence (under the old single-`contractAddress` receipt the implementation and the proxy genuinely collapsed onto one address, so the assertion could not have existed). The diamond facet block sits OUTSIDE it: facets default to `deterministic: true` (`packages/rocketh-diamond/src/index.ts:124`), their address is the computed create2 address (`packages/rocketh-deploy/src/index.ts:438`) and the environment prefers it over the receipt (`packages/rocketh/src/environment/index.ts:846`), so those four addresses were already distinct under the old fake. It is a deliberate strengthening, not a necessity.

**Alternative considered:** port the two cases verbatim and leave them `toBeDefined()`-only, which keeps the diff strictly mechanical and inside the fence, at the cost of leaving two of the weakest cases in the suite unable to detect a collapsed deployment graph. A human may trim the diamond block back to that if the fence is meant strictly.

Related: `work/notes/observations/review-nits-migrate-proxy-diamond-tests-2026-08-10.md` (the review nit that asked for this ratification), and `work/notes/observations/example-artifact-facets-share-one-create2-address-2026-08-10.md`.

### Ratification (2026-08-11 observation triage)

**Ratify both blocks; do not trim.** Reviewed the actual assertions.

The PROXY block (`packages/rocketh-proxy/test/proxy.integration.test.ts:84-95`) is inside acceptance criterion 3's fence and demonstrably so: under the old fake's single-`contractAddress` receipt the implementation and the proxy genuinely collapsed onto one address, so `expect(implementation.address).not.toBe(proxy.address)` could not have been written before the migration.

The DIAMOND block (`diamond.integration.test.ts:113-131`) is outside the fence, as the note itself says - facets default to `deterministic: true`, so those four addresses were already distinct under the old fake. Ratified anyway, as a deliberate strengthening. Trimming it back would restore a `toBeDefined()`-only case in exactly the file where such a case has already been shown to hide a real defect: the multi-facet example had three differently-named facets deploying to ONE create2 address and stayed green (now fixed, and asserted). The fence is worth enforcing against behaviour changes; enforcing it against added coverage costs more than it protects.
