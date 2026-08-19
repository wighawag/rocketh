---
title: 'Matrix entry: N proxies behind one multisig-owned ProxyAdmin surface N ordered deferred upgrades'
slug: unknown-signer-matrix-many-proxies-one-admin
spec: governance-topology-validation
blockedBy: []
covers: [1]
---

## What to build

Extend the `@rocketh/unknown-signer` integration-test-as-documentation matrix with a scenario where several proxies (choose a small representative N, e.g. three) sit behind a SINGLE `ProxyAdmin` whose on-chain owner is a multisig address the run cannot sign for. A deploy-script-shaped test wraps each per-proxy upgrade in its OWN `catchUnknownSigner` and asserts that:

- exactly N deferred transactions are surfaced (none dropped, none duplicated);
- each deferred transaction has `from` set to the multisig and `to` set to the shared `ProxyAdmin`;
- the surfaced order is stable across runs (same input → same order);
- the per-proxy `data` differs only in the proxy address argument to `upgrade`;
- nothing is persisted between runs (no unsigned-tx file appears — mirror the existing scenarios' assertion).

The test lives alongside `packages/rocketh-unknown-signer/test/scenarios.integration.test.ts` and follows its "tests as documentation" style — a header explaining what a reader should learn from the scenario, and a body shaped like a real deploy script. Reuse `createTestEnvironment` and `createMockArtifact` from `@rocketh/test-utils`; do not hand-build an environment. The mock provider is not an EVM, so storage slots (owner slot on the admin, implementation slots on each proxy) are written by hand exactly as the prior scenarios do.

Also encode the wrapper-scoping lesson the demo README calls out: a single `catchUnknownSigner` wrapping the whole batch would capture only the FIRST deferral and silently skip the rest. A companion assertion (or a second small test) demonstrating that failure mode makes the lesson survive as an executable comment, not just prose.

## Acceptance criteria

- [ ] New integration test(s) in `packages/rocketh-unknown-signer/test/` cover the N-proxies-one-admin topology.
- [ ] Test asserts exactly N surfaced deferred txs, all `from` the multisig, all `to` the shared admin, stable order across two runs of the same setup.
- [ ] Test asserts nothing persisted between runs (no unsigned-tx artefact).
- [ ] A second assertion / small test pins the "one wrapper captures one deferral" failure mode so the wrap-each-step rule is enforced, not just documented.
- [ ] Tests use `createTestEnvironment` / `createMockArtifact` — no hand-built environment.
- [ ] `pnpm --filter @rocketh/unknown-signer test` passes.

## Blocked by

- None — can start immediately.

## Prompt

> Goal: prove the unknown-signer seam handles the "many proxies, one multisig-owned ProxyAdmin" topology and record it as executable documentation.
>
> FIRST, check this task against current reality (launch snapshot). Read `packages/rocketh-unknown-signer/test/scenarios.integration.test.ts` fully — the "cast" section, the storage-slot helpers, and the existing Story 1 (single-proxy upgrade) — because your new describe blocks should match its shape, its narration style, and its slot-writing tricks. Then read the demo scenario `demoes/hardhat-deploy/governance/deploy/002_many_proxies_one_admin.ts` for the topology this test formalises, and the demo README's "Many proxies, one admin" section for the wrapper-scoping trap you must also pin.
>
> Domain vocabulary: `catchUnknownSigner` (returns `{from,to,value,data}` when `from` is unsignable, else `null`), signable vs unsignable account (see ADR 0006 and CONTEXT.md `signer`/`signability`), the ERC1967 implementation slot and the ERC173 owner slot (constants at the top of the existing scenarios file).
>
> Seams to test at: the seam is `broadcastTransaction`'s signability branch — you exercise it by declaring a bare-address named account with `autoImpersonate: false` (the "SAFE" pattern in the existing tests). Use the same pattern for the multisig-owning-admin address.
>
> "Done" means: a new describe block (or blocks) added to the existing scenarios file (or a new sibling file that follows the same conventions) whose test bodies read like deploy scripts, whose assertions match the acceptance criteria above, and whose narration teaches the reader (a) what topology this is, (b) what deferred set to expect, and (c) why each upgrade needs its own wrapper.
