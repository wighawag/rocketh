---
title: Migrate deploy and read-execute tests onto createTestEnvironment
slug: migrate-deploy-and-read-tests
blockedBy: [test-env-harness]
covers: []
---

## What to build

MIGRATE step, batch 1 of 2 (`TASKING-PROTOCOL.md` §3a). Move the three lower-risk integration test files off the fabricated `createMockEnvironment` and onto the real-environment `createTestEnvironment`:

- `packages/rocketh-deploy/test/deploy.integration.test.ts`
- `packages/rocketh-deploy/test/deploy-value.integration.test.ts`
- `packages/rocketh-read-execute/test/read.integration.test.ts`

This batch stays green on its own because the old harness still exists; it is removed later by `remove-legacy-mock-environment`. It is file-orthogonal to batch 2 (`migrate-proxy-diamond-tests`), so the two can run in parallel without conflicting.

These three are the batch that MATTERS most: the two deploy files are the evidence that a transaction actually reaches the real broadcast path. They are also the ones expected to port most cleanly, since they do not exercise upgrade paths.

Mechanical shape of the migration: `await` the now-async constructor, and where an assertion depended on a shortcut of the old fake (a fabricated deployment address, a receipt that always reports a contract address, an absent `eth_call`), fix it by making the mock PROVIDER answer the call, never by reaching back around the real code path. Preserve each test's INTENT — this is a harness change, not a rewrite of what is being asserted.

If a test cannot be ported without stateful chain simulation, do NOT bend the harness's non-goal to fit it. Stop and route to needs-attention with the specific provider behaviour required, so the trade-off is decided deliberately rather than by widening the harness inside a migration batch.

One likely snag worth knowing up front: the old default receipt returned the same `contractAddress` for every transaction, and a real environment reads a deployment's address from it. `test-env-harness` gives the default a per-transaction address; if a test asserts the old fixed address, that assertion is an artefact of the fake and should follow the new behaviour.

## Acceptance criteria

- [ ] All three files use `createTestEnvironment`; no reference to `createMockEnvironment` remains in them.
- [ ] Every test's original intent is preserved: no test deleted, skipped, or weakened to a tautology. Assertions may change only where the old fake's shortcut was what made the previous form possible, and each such change is noted in the done record.
- [ ] At least one deploy test asserts the transaction reached the real broadcast path (e.g. signer selection followed `addressSigners`, or `evm_mine` on `autoMine`), so the batch demonstrably proves the point of the migration.
- [ ] No stateful chain simulation was added to the harness to make these pass.
- [ ] `createMockEnvironment` still exists and other tests still use it — this batch does not remove it.
- [ ] `pnpm typecheck`, `pnpm build` and `pnpm test` pass across the workspace.

## Blocked by

- `test-env-harness` — provides `createTestEnvironment`.

## Prompt

> Move `packages/rocketh-deploy/test/deploy.integration.test.ts`, `packages/rocketh-deploy/test/deploy-value.integration.test.ts` and `packages/rocketh-read-execute/test/read.integration.test.ts` from the fabricated `createMockEnvironment` onto the real-environment `createTestEnvironment` added by `test-env-harness`.
>
> FIRST, check this task against current reality (launch snapshot may have DRIFTED): confirm `createTestEnvironment` landed with the options this migration needs (named-account setups, `eth_accounts` contents, `autoImpersonate`, the generic config pass-through). If it landed differently, route to needs-attention rather than working around it.
>
> Why these three first: they are the evidence that transactions reach the real broadcast path, and they avoid the upgrade paths that make proxy and diamond harder. The other two files are a separate, parallel batch — do not touch them.
>
> The rule that matters: when a test fails after the switch, make the mock PROVIDER answer the RPC. Do NOT re-introduce a shortcut that bypasses production code, and do NOT add stateful chain simulation (the harness has an explicit non-goal about that: canned or per-test-configurable responses, never an in-memory chain). If a test genuinely cannot pass within that fence, stop and route to needs-attention with the specific provider behaviour required.
>
> Preserve intent. This is a harness swap, not a chance to rewrite assertions. If you must change what a test asserts because the old fake's shortcut was load-bearing for the old form, record that in the done record.
>
> Done means: three files run against a genuine environment, at least one of them proves a transaction took the real broadcast path, and everything else in the workspace is untouched and green.
