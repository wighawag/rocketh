---
title: 'An in-process chain for memory runs without Hardhat'
slug: in-process-chain
needsAnswers: true
---

> Launch snapshot: records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) and the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked: they move into tasks or ADRs, and this spec settles to its durable framing of Problem, Solution, User Stories and Out of Scope.)

<!-- open-questions -->

## Open questions

1. **Where the dev-node layer lives in the webevm repository**, and its name (see Implementation Decisions). Decided that it is NOT in rocketh and NOT in webevm's core.
2. **When webevm's Prague/Osaka work lands** relative to this spec: whether rocketh ships the in-process chain on Cancun first (documented) or waits.

<!-- /open-questions -->

## Problem Statement

rocketh's `memory` environment needs an EIP-1193 provider handed to it, and today the only one that comes for free is Hardhat's (EDR, through hardhat-deploy). A user without Hardhat, a Foundry user in particular, has to start a node on a port (anvil) to run their deploy scripts in a test, and has to stop it afterwards. Spec `deployments-in-solidity` makes this worse rather than incidental: producing a fixture for `forge test` means running the deploy scripts on a chain fresh from genesis, so without an in-process chain every Foundry test run needs a node on a port first.

## Solution

rocketh provides an in-process chain for `memory` runs when no provider is given: `rocketh` (and `loadAndExecuteDeploymentsFromFiles` in a test) runs the deploy scripts against a chain that lives in the same process, from genesis, with the accounts the config names, impersonation and balance setting available, and nothing to start or stop. It can also export the resulting chain state in the shape spec `deployments-in-solidity` hands to forge (see its open question on replay versus a state load).

## User Stories

1. As a Foundry user, I want `rocketh` to run my deploy scripts in-process with no node on a port, so that a test run needs nothing started and nothing left behind.
2. As a rocketh user writing vitest tests for my deploy scripts, I want the same in-process chain, so that I do not depend on Hardhat for it.
3. As a user, I want the accounts my config names to be funded and signable on it, so that scripts run unchanged.
4. As a user, I want impersonation and balance setting on it, so that a Safe-owned step can be rehearsed in-process as on a fork (CONTEXT.md, "signability").
5. As a user, I want it current with mainnet's hardfork, so that contracts behave as they will on mainnet.
6. As a user of spec `deployments-in-solidity`, I want the resulting state exportable, so that forge can load the deployment without replaying it.
7. As a Hardhat user, I want nothing to change: hardhat-deploy keeps giving rocketh EDR.
8. As a maintainer, I want the chain's dependency weight known and accepted before it lands (AGENTS.md, no heavy dependency without approval).

## Implementation Decisions

Decided 2026-11-19, from `work/notes/findings/in-process-chain-without-hardhat.md`:

- **The chain is webevm.** It runs in Node and in a browser, rocketh's playground already uses it, and its state dump was loaded into a real `forge test` with `vm.loadAllocs`.
- **webevm moves to Prague and Osaka, in webevm.** It is not only configuration: webevm's own backlog task `readmit-refused-hardforks-once-the-node-can-cost-them` lists the EIP-7623 calldata floor in its gas estimate, the EIP-7825 per-transaction gas cap against its read budget, a hardfork option on `createNode()`, and a check of EIP-7702 and EIP-2935 on its transaction path.
- **The dev-node layer is a separate package**, useful beyond rocketh, built on webevm's trusted-sender primitive: dev accounts answering `eth_accounts` and signing `eth_sendTransaction`, the `hardhat_*` / `anvil_*` names for balance setting, impersonation and mining, and snapshots over `dumpState` / `loadState`. Not in webevm's core, whose ADRs 0002 and 0004 rule out accounts, signing and impersonation there.
- **Fork runs stay on anvil for now.** Forking inside webevm is a later spec in the webevm repository.

Fixed regardless:

- It is used only when the run is `memory` and no provider was given; an explicit provider always wins.
- The browser-capable core stays free of it if the chosen chain is Node-only (ADR 0002).

## Testing Decisions

- The existing `memory`-environment tests run against it as well as against the mock provider.
- One end-to-end test of the `rocketh` CLI deploying in-process with no provider configured.

## Out of Scope

- Replacing EDR under hardhat-deploy.
- The Solidity hand-off itself: spec `deployments-in-solidity`.

## Further Notes

The playground already runs rocketh on webevm (`packages/rocketh-playground`), which is prior art for at least the browser side.
