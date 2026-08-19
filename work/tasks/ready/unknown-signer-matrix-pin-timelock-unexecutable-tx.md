---
title: 'Matrix entry: pin today''s unexecutable surfaced transaction when a Timelock owns the ProxyAdmin'
slug: unknown-signer-matrix-pin-timelock-unexecutable-tx
spec: governance-topology-validation
blockedBy: [unknown-signer-matrix-pin-handoff-hard-error]
covers: [7, 10]
---

## What to build

Extend the matrix with a scenario where the `ProxyAdmin`'s on-chain owner is a Timelock contract (address). Run a `deployViaProxy` whose `owner` matches that Timelock; assert the surfaced deferred transaction TODAY reads as `{from: <the timelock>, to: <the admin>, data: upgrade(...)}` — an accurate statement of intent and an impossible transaction, because nobody can send a tx FROM a contract.

The test is a PIN of current behaviour; add a comment describing the desired future behaviour (surface a `schedule(...)` call from the Timelock's admin/proposer, then, after the delay, an `execute(...)` — three states: not scheduled / scheduled but waiting / done — never a duplicate schedule) and pointing at the `unsignable-routes` spec.

Use the mock provider's `eth_call` handler to make the admin report the Timelock address as its owner (mirror the storage-slot patterns in the existing scenarios file). The Timelock does NOT need to be a real OZ `TimelockController` for the test — the pin is about what the seam SURFACES given the on-chain owner is a plain contract address; the demo separately exercises the real OZ Timelock.

## Acceptance criteria

- [ ] New integration test(s) in `packages/rocketh-unknown-signer/test/` pin the Timelock-owned-admin surfaced-transaction behaviour.
- [ ] Test asserts the surfaced `{from, to, data}` shape today (from = Timelock address; data = `upgrade(...)` on the admin).
- [ ] Test carries a comment naming the intended future `schedule` / `execute` translation and pointing at the `unsignable-routes` spec.
- [ ] Uses `createTestEnvironment` / `createMockArtifact`.
- [ ] `pnpm --filter @rocketh/unknown-signer test` passes.

## Blocked by

- `unknown-signer-matrix-pin-handoff-hard-error` — serialized to avoid parallel edits to `scenarios.integration.test.ts`.

## Prompt

> Goal: record today's Timelock-owned-admin behaviour (an unexecutable surfaced transaction) as an executable pin, so the eventual `unsignable-routes` fix flips a test rather than discovers an untested path.
>
> FIRST, check this task against current reality. Read the demo `demoes/hardhat-deploy/governance/deploy/004_timelock_owned_admin.ts` and the README section "A Timelock in the path" — it lays out the impossible-transaction problem, the by-hand workaround, the deterministic-salt requirement and the three states (not scheduled / scheduled but waiting / done). Read `packages/rocketh-unknown-signer/test/scenarios.integration.test.ts` for style. Read `work/specs/proposed/unsignable-routes.md` (or search `work/specs/`) for the slug your pinning comment must reference.
>
> Domain vocabulary: `catchUnknownSigner`, ProxyAdmin owner slot (ERC173), timelock as a "call-through" contract (a contract that must be CALLED THROUGH, not sent FROM — the load-bearing observation from `work/notes/findings/governance-upgrade-topologies-in-the-wild.md`).
>
> Seam: same `broadcastTransaction` signability branch; the Timelock address is unsignable, so the seam fires and returns the same shape as it would for any other unsignable `from`. The pin asserts that shape.
>
> "Done" means: a describe block that stubs an admin owned by a plausible Timelock address, runs the wrapped upgrade, and asserts today's surfaced `{from, to, data}` shape, with a comment naming the intended `schedule`/`execute` translation and citing `unsignable-routes`.
