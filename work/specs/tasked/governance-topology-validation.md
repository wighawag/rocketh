---
title: 'Governance topology validation: prove the unknown-signer seam against the shapes that exist'
slug: governance-topology-validation
taskedAfter: [unknown-signer-core]
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked — they move into tasks/ADRs and this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

## Problem Statement

The unknown-signer seam is tested against a Safe-owned proxy, which is one topology out of several that real protocols use. A team evaluating rocketh for a governed upgrade cannot tell, from the current tests or docs, whether their own shape works: whether a ProxyAdmin owned by a multisig behaves, what happens when they have twelve proxies and one admin, what happens when the upgrade is followed by a migration call, or what happens during the deployer-to-governance handoff that every protocol performs exactly once and cannot rehearse.

Worse, two of those shapes are known to behave badly today and nothing records it. A handoff run hits a hard `throw` rather than a deferral, and a topology where the upgrade right is held by a CONTRACT surfaces a transaction nobody can execute. A user meets these on the day they matter most.

## Solution

Prove the seam against the topology space, as tests that run in CI and as a demo a human can actually drive.

The topology space is small, closed, and now written down (`work/notes/findings/governance-upgrade-topologies-in-the-wild.md`). The only axis that changes BEHAVIOUR is who holds the upgrade right: an EOA the runner can sign for, a multisig, or a contract that must be called through. Proxy flavour does not change anything, because every flavour funnels through the same choke point and the seam fires on the signability of `from`.

Two deliverables, deliberately different in kind:

- **An integration-test matrix** in `@rocketh/unknown-signer`, in the existing "tests as documentation" style, covering the shapes that CAN work today and PINNING the current behaviour of the two that cannot, so the gaps are recorded as tests rather than as folklore.
- **A runnable demo** (`demoes/hardhat-deploy/governance/`) where a human deploys against a local node, sees the deferred transactions printed, executes them through a real multisig contract with an operator script, and re-runs to watch the script skip the completed step. The demo is what makes the loop believable; the tests are what keep it true.

The two gaps this exposes are NOT fixed here. This spec's job is to make them visible and reproducible. The fix is `unsignable-routes`.

## User Stories

1. As a team whose proxies sit behind a ProxyAdmin owned by a multisig, I want a run over N proxies to surface exactly N deferred upgrade transactions, all with `from` set to the multisig, in a stable order, so I can execute them and know none were dropped or duplicated.
2. As a team whose upgrade is followed by a migration call from the same owner, I want BOTH to be surfaced, in the order the script performs them, so I execute them in an order that does not brick the contract.
3. As a team with a mixed run, I want signable deploys to broadcast and only the governance calls to be surfaced, with deployment state consistent afterwards, so a partial run is not a corrupted run.
4. As a team, I want to re-run BEFORE governance executes and get the same surfaced set, with no signable step broadcast twice, so re-running is free and I can do it whenever I lose my terminal.
5. As a team, I want to re-run AFTER governance executes and have the completed upgrade detected on chain and skipped with no throw, so the script converges.
6. As a team performing the deployer-to-governance handoff, I want to know exactly what rocketh does today when the on-chain owner is still the deployer but my script names the multisig, because that transition happens once and I cannot afford to discover it live.
7. As a team whose ProxyAdmin is owned by a Timelock, I want to know exactly what rocketh surfaces today, and to have it recorded, so I can judge whether the workaround (writing the `schedule` call myself) is acceptable until routing lands.
8. As an evaluator, I want to run a demo end to end on a local node, see a real deferred transaction, execute it through a real multisig, and re-run, so I believe the loop rather than trusting a README.
9. As an evaluator, I want the demo's scenarios selectable by tag, so I can run just the one that matches my governance shape.
10. As a maintainer, I want the two known-bad shapes pinned by tests that assert TODAY's behaviour with a comment naming the desired behaviour, so the fix flips a test rather than discovering an untested path.

> Implementation and testing detail moved to the tasks in `work/tasks/` (matrix entries in `packages/rocketh-unknown-signer/test/`; demo verification in `demoes/hardhat-deploy/governance/`).

> **Story coverage: 8 of the 10 stories became tasks, and the other two were REUSED rather than dropped.** Recorded here because an omission and a deliberate reuse look identical in a diff, and the next reader counting `covers:` would otherwise find a hole.
>
> - **Story 3** (a mixed run broadcasts the signable steps and defers only the governance ones) is already covered by `Story 6: a run that mixes signable and Safe-only steps` in `packages/rocketh-unknown-signer/test/scenarios.integration.test.ts`, including the wrapper variant that keeps broadcasting signable steps up to the deferred one.
> - **Story 5** (a re-run AFTER governance executed detects the completed upgrade, skips it and returns `null` rather than throwing) is already covered by `Story 7: execute on the Safe, then re-run the script`, whose first case asserts exactly that, alongside a case pinning that nothing is persisted between the two runs.
>
> Story 4 (a re-run BEFORE execution) has prior art in that same describe and IS tasked anyway, because the matrix entry extends it to the many-proxies-one-admin topology, where the property at stake is that the surfaced SET is identical rather than that a single call defers again.
>
> Verified against the file at tasking-merge time. If those describes are ever renamed or removed, these two stories lose their coverage silently, so a change there should re-check this note.

## Out of Scope

- **Fixing** the two gaps. That is `unsignable-routes`.
- v1 return-shape parity and the migration guide, which are `unknown-signer-v1-migration`.
- Safe Transaction Service proposals, MultiSend batching and a persisted batch file, all of which are `explore-unknown-signer-adapters`.
- Aave V4 specifically: it has no JavaScript deployment layer at all, so it is not a migration target. Its topology still informed the matrix; see the finding note.

## Further Notes

The topologies here were derived by reading public protocol source rather than by interviewing teams; the evidence and its caveats are in `work/notes/findings/governance-upgrade-topologies-in-the-wild.md`. The most useful thing that reading established: proxy flavour is not a variable, and the real variable is whether the holder of the upgrade right is an address that can send a transaction at all.
