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

## Implementation Decisions

- **Two homes, on purpose.** The matrix lives in `packages/rocketh-unknown-signer/test/` because that runs in CI on every change. The demo lives in `demoes/hardhat-deploy/governance/` alongside the existing demoes, which are standalone projects NOT in the pnpm workspace and therefore NOT covered by `pnpm test`. Neither can substitute for the other: the demo would rot silently if it were the only proof, and the tests would not convince anyone who wants to see it run.
- **The demo's multisig is a minimal stand-in, and says so.** A contract with owners and an `execTransaction(to, value, data)` is enough to prove `from = <a contract that can be made to send>`; pulling in the real Gnosis Safe contracts would add a large dependency for no additional evidence. The README must state this plainly so nobody reads the demo as a Safe integration.
- **The Timelock in the demo is OpenZeppelin's `TimelockController`**, not a bespoke one, because the point is to exercise a shape users actually deploy.
- **Scenarios are tag-selected** (rocketh already filters deploy scripts by tag), so one demo project can hold the whole matrix without the scenarios interfering with each other.
- **Gaps are pinned, not fixed.** The handoff case and the call-through case get tests asserting current behaviour, each with a comment stating what the behaviour should become and pointing at `unsignable-routes`.

## Testing Decisions

The matrix, each entry an integration test written as documentation:

1. Single multisig-owned ProxyAdmin upgrade: implementation deploy is signed and broadcast, the `upgrade` call is deferred.
2. N proxies behind one multisig-owned admin: N deferred transactions, ordered, deduped, all `from` the multisig.
3. Upgrade plus a dependent follow-up call from the same owner: both deferred, order preserved.
4. Mixed run: signable steps broadcast, governance steps deferred, records consistent.
5. Idempotent re-run before execution: identical surfaced set, no double broadcast.
6. Idempotent re-run after execution: on-chain state check skips the step, returns `null`, no throw.
7. Deployer-to-multisig handoff: pins the current hard error, comments the intended behaviour.
8. Timelock-owned ProxyAdmin: pins the currently-unexecutable surfaced transaction, comments the intended `schedule`/`execute` translation.

Prior art: `packages/rocketh-unknown-signer/test/scenarios.integration.test.ts` already covers the single-proxy, mixed-run and re-run stories, so several entries extend existing describes rather than starting fresh. `createTestEnvironment` from `@rocketh/test-utils` is the environment builder; do not hand-build one.

Demo verification is manual and documented as a numbered walkthrough in its README, since the demo is outside CI.

## Out of Scope

- **Fixing** the two gaps. That is `unsignable-routes`.
- v1 return-shape parity and the migration guide, which are `unknown-signer-v1-migration`.
- Safe Transaction Service proposals, MultiSend batching and a persisted batch file, all of which are `explore-unknown-signer-adapters`.
- Aave V4 specifically: it has no JavaScript deployment layer at all, so it is not a migration target. Its topology still informed the matrix; see the finding note.

## Further Notes

The topologies here were derived by reading public protocol source rather than by interviewing teams; the evidence and its caveats are in `work/notes/findings/governance-upgrade-topologies-in-the-wild.md`. The most useful thing that reading established: proxy flavour is not a variable, and the real variable is whether the holder of the upgrade right is an address that can send a transaction at all.
