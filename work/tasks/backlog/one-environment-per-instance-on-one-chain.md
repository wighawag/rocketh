---
title: 'Document and test deploying the same scripts as many instances on one chain, one environment per instance'
slug: one-environment-per-instance-on-one-chain
blockedBy: []
covers: []
---

## What to build

Some projects deploy the same scripts several times on one network, once per instance (one pool, one market, one vault family), and every instance writes records with the same names. Under hardhat-deploy v1 one project shuffled deployment folders in and out of `deployments/<network>/` around every run to make that work (`work/notes/findings/v1-protocol-deploy-and-governance-patterns.md`, Vesper section and open question 3). The rocketh answer the finding proposes is NOT verified yet:

- one environment per instance, all on the same chain (`environments: {vdai: {chain: 1, scripts: [...]}, veth: {chain: 1, scripts: [...]}}`), so each instance gets its own deployments folder (the folder is the environment name);
- per-instance parameters in `data`, which resolves by environment name before chain id (`packages/rocketh/src/environment/index.ts`, `getData`);
- contracts SHARED by every instance (an admin contract, a reused implementation) deployed deterministically, so each instance's run finds the same address already holding the code and records it without broadcasting (`packages/rocketh-deploy/src/index.ts`, the deterministic branch that saves when code is already there).

Prove it with a test, then document it. If any part does not hold (for example two environments on one chain are refused somewhere, or the `.chain` file of a folder interferes), stop and report it rather than working around it: that is a finding for `work/notes/ideas/many-instances-of-one-deployment-on-one-network.md`.

## Acceptance criteria

- [ ] A test runs the SAME scripts against two environments that share one chain, through the real executor or `createTestEnvironment`, and shows: separate deployment records per instance under the same names; per-instance `data` reaching the scripts; a deterministically deployed shared contract broadcast ONCE and recorded in both instances at the same address.
- [ ] A short section in the docs (where environments are documented, and a pointer from `documentation/migration/index.md` for v1 projects that layered deployment folders) shows the config and states the limits: a shared contract is shared only if it is deterministic with identical creation code, and nothing lists all instances at once.
- [ ] `work/notes/ideas/many-instances-of-one-deployment-on-one-network.md` is updated with what the test established (append; do not delete it unless the test shows the idea is fully answered).
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm format:check` pass, plus a changeset (empty if no package source changes).

## Blocked by

- None. Can start immediately.

## Prompt

> Goal: verify, with a test, that rocketh can deploy the same scripts as several instances on ONE chain by giving each instance its own environment, with per-instance `data` and deterministically shared contracts; then document it.
>
> FIRST, check this task against current reality: read how environments are resolved (`packages/rocketh/src/executor/index.ts`, `environments[<name>].chain`), where the deployments folder comes from (`packages/rocketh-node/src/environment/deployment-store.ts`), how `data` is resolved (`packages/rocketh/src/environment/index.ts`, `getData`), and what a deterministic deploy does when code is already at its address (`packages/rocketh-deploy/src/index.ts`). If any of the three mechanisms does not behave as the task says, route to needs-attention with the evidence instead of building around it.
>
> Read `work/notes/findings/v1-protocol-deploy-and-governance-patterns.md` (Vesper) and `work/notes/ideas/many-instances-of-one-deployment-on-one-network.md` for the real-world shape. Tests use `@rocketh/test-utils` (`createTestEnvironment`, `createMockArtifact`, the Map-backed deployment store); a mock chain that remembers which addresses hold code exists in `packages/rocketh-unknown-signer/test/ported-protocols/harness.ts` and can be copied.
>
> Style: single-line paragraphs, no em dashes. Do not name who reported the pattern.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your final report.
