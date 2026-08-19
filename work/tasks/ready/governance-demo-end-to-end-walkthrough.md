---
title: 'Governance demo: verify the end-to-end walkthrough runs against a local node for every tag'
slug: governance-demo-end-to-end-walkthrough
spec: governance-topology-validation
blockedBy: []
covers: [8, 9]
---

## What to build

The demo project `demoes/hardhat-deploy/governance/` already has the contracts (`SimpleMultisig`, `Registrar`, `GovernanceTimelock`), the tag-selected deploy scripts (000–005), the operator script (`scripts/act-as-governance.ts`), the target/pending helpers under `demo/`, and a README with a numbered walkthrough for each of the five scenarios (`scenario-multisig`, `scenario-multi`, `scenario-ordered`, `scenario-timelock`, `scenario-handoff`).

This task's job is to VERIFY, end to end against a local hardhat node, that the walkthrough in the README holds today for every tag — and to fix whatever is required to make it hold. Concretely, for each scenario:

1. Fresh start (delete `deployments/localhost` and `pending/`).
2. Run the initial deploy at `REGISTRY_VERSION=1` (or the scenario's initial state), observe the expected outcome the README describes (nothing deferred; or the handoff-scenario's throw; etc.).
3. Bump to `REGISTRY_VERSION=2`, run again, observe the deferred transaction(s) exactly as the README describes.
4. Run `pnpm act-as-governance <tag>`, observe the on-chain execution.
5. Re-run the deploy, observe convergence (nothing deferred).
6. For the Timelock scenario, exercise both the `schedule` step, the delay wait, and the `execute` step as the README lays out.
7. For the handoff scenario, confirm the current hard-throw behaviour and the working pattern the README documents.

Where the actual behaviour diverges from the README, fix whichever is wrong — the code or the README — and record the divergence in your `## Decisions` block. Where a scenario is genuinely blocked by a bug in the demo scaffolding (not in the seam being demonstrated), fix it if small; escalate as needs-attention if not.

Also confirm the tag-selection mechanism actually isolates scenarios: running one tag must not accidentally execute another scenario's deploy scripts.

## Acceptance criteria

- [ ] Every scenario tag runs its README walkthrough successfully on a fresh local node, in a repeatable way.
- [ ] Any drift between the README walkthrough and actual behaviour is resolved (code or README updated).
- [ ] Tag selection is confirmed to isolate scenarios (a scenario's deploy scripts run only under its own tag).
- [ ] The README's tag table and per-scenario command blocks match what a reader can actually type and see.
- [ ] The `## Decisions` block in the final report records any code/README changes you made and why.
- [ ] No changes leak into other demos or into the workspace packages beyond what is necessary to make the walkthrough true.

## Blocked by

- None — can start immediately. (Independent of the matrix-test tasks: this touches `demoes/hardhat-deploy/governance/` only.)

## Prompt

> Goal: make the numbered README walkthrough in `demoes/hardhat-deploy/governance/README.md` HOLD end-to-end on a fresh local hardhat node, for every one of the five tags. This is the "an evaluator can see the loop run" deliverable the spec calls for.
>
> FIRST, check this task against current reality (launch snapshot). The demo is largely built — contracts under `src/governance/`, deploy scripts `deploy/000..005`, operator script `scripts/act-as-governance.ts`, helpers under `demo/`. Read the README fully before doing anything; it is the specification for the walkthrough you must make true. Read the spec `work/specs/ready/governance-topology-validation.md` for the framing.
>
> The demo is a standalone pnpm project NOT part of the workspace, so its dependencies install alongside the workspace via the repo-root `pnpm install`, and it is not covered by `pnpm test`. Follow the README's own setup ("install from the repo root, then `pnpm local_node` here in its own terminal, then `pnpm deploy:dev localhost --tags <tag>`").
>
> Domain vocabulary: `catchUnknownSigner`, `deployViaProxy`, tag-selected deploy scripts (rocketh already supports `--tags`), signable/unsignable account (ADR 0006), the two known gaps (Timelock — impossible-tx surfaced today; handoff — plain `Error` thrown today, not `UnknownSignerError`). The demo is a stand-in for a real Safe on purpose — `SimpleMultisig` has no threshold and any owner can execute; the point is a contract that CAN be made to send a transaction.
>
> Seams to test at: this is manual verification, not automated test authoring — you drive the CLI and observe. The matrix tests (sibling tasks in this spec) cover the same behaviours in CI.
>
> "Done" means: you have successfully executed every scenario's README walkthrough on a fresh local node, and either observed the described behaviour or fixed the drift so the next reader will too. Record what you changed and why in your `## Decisions` block.
