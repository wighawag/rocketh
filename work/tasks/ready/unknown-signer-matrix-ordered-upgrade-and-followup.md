---
title: 'Matrix entry: upgrade plus a dependent follow-up call from the same owner surface as an ordered pair'
slug: unknown-signer-matrix-ordered-upgrade-and-followup
spec: governance-topology-validation
blockedBy: [unknown-signer-matrix-many-proxies-one-admin]
covers: [2]
---

## What to build

Extend the `@rocketh/unknown-signer` integration-test matrix with a scenario where an unsignable owner (a multisig address) must perform BOTH a proxy upgrade AND a follow-up call (e.g. pointing a `Registrar` at the new implementation) — both from the same `from`. The test asserts:

- both operations are surfaced as deferred transactions (neither is dropped);
- the surfaced order matches the order the deploy-script performs them (upgrade first, follow-up second);
- both have `from` set to the multisig;
- the follow-up's `to`/`data` target the registrar (or equivalent) with the expected version argument;
- re-running the script AFTER only the upgrade has executed on chain surfaces JUST the follow-up (the upgrade is detected done and skipped, the follow-up still defers) — this proves the pair is idempotent through partial execution.

Written in the "tests as documentation" style of `scenarios.integration.test.ts`: header teaches the reader why ordering is a property of the SCRIPT (not something rocketh reconstructs), and demonstrates that the on-chain read is what makes each step idempotent since rocketh persists nothing.

## Acceptance criteria

- [ ] New integration test(s) in `packages/rocketh-unknown-signer/test/` cover the ordered upgrade + follow-up topology.
- [ ] Test asserts both deferrals appear in script order, both from the multisig.
- [ ] Test asserts the "upgrade executed, follow-up pending" re-run surfaces only the follow-up.
- [ ] Uses `createTestEnvironment` / `createMockArtifact`; storage-slot mutations mimic the existing scenarios' pattern for "governance executed the tx".
- [ ] `pnpm --filter @rocketh/unknown-signer test` passes.

## Blocked by

- `unknown-signer-matrix-many-proxies-one-admin` — serialized to avoid parallel edits to `scenarios.integration.test.ts`.

## Prompt

> Goal: prove that when a deploy script performs `[upgrade, follow-up]` on an unsignable owner, both are surfaced in script order, and the pair is idempotent through partial execution.
>
> FIRST, check this task against current reality. Read `packages/rocketh-unknown-signer/test/scenarios.integration.test.ts` end-to-end and the demo `demoes/hardhat-deploy/governance/deploy/003_upgrade_then_migrate.ts` plus the README section "An upgrade and a dependent follow-up" for the topology and the ordering-constraint contract shape (`Registrar` refuses any version that isn't exactly next).
>
> Domain vocabulary: `catchUnknownSigner`, `deployViaProxy`, `execute`/`tx` from `@rocketh/read-execute`, signable vs unsignable account (ADR 0006). The mock provider is not an EVM — model "the follow-up hasn't happened yet" and "the upgrade has happened" via direct slot writes / storage stubs as the prior tests do.
>
> Seam: the same `broadcastTransaction` signability branch — one deploy script issues two wrapped calls with the same unsignable `from`; both must reach the seam.
>
> "Done" means: a describe block whose two `it`s read as one narrative (surfaced pair; then re-run after upgrade only), whose assertions match the criteria, and whose narration explains WHY the ordering property is the script's responsibility (rocketh does not batch or reorder).
