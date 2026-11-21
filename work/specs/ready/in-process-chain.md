---
title: 'An in-process chain for memory runs without Hardhat'
slug: in-process-chain
taskedAfter: [environment-accounts]
---

> Launch snapshot: records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) and the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked: they move into tasks or ADRs, and this spec settles to its durable framing of Problem, Solution, User Stories and Out of Scope.)

## Problem Statement

rocketh's `memory` environment needs an EIP-1193 provider handed to it, and today the only one that comes for free is Hardhat's (EDR, through hardhat-deploy). A user without Hardhat, a Foundry user in particular, has to start a node on a port (anvil) to run their deploy scripts in a test, and has to stop it afterwards. Spec `deployments-in-solidity` makes this worse rather than incidental: producing a fixture for `forge test` means running the deploy scripts on a chain fresh from genesis, so without an in-process chain every Foundry test run needs a node on a port first.

## Solution

rocketh provides an in-process chain for `memory` runs when no provider is given: `rocketh` (and `loadAndExecuteDeploymentsFromFiles` in a test) runs the deploy scripts against a chain that lives in the same process, from genesis, with the accounts the config names, impersonation and balance setting available, and nothing to start or stop. It can also export the resulting chain state as the genesis alloc map that forge's `vm.loadAllocs` reads, which is how spec `deployments-in-solidity` hands a deployment to `forge test`.

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

Decided 2026-11-19, from `work/notes/findings/in-process-chain-without-hardhat.md`, and delivered upstream on 2026-11-20:

- **The chain is webevm.** It runs in Node and in a browser, rocketh's playground already uses it, and its state dump was loaded into a real `forge test` with `vm.loadAllocs`.
- **Hardfork: webevm 0.10.0** has a `hardfork` option on `createNode()` (`cancun`, `prague`, `osaka`), defaulting to Osaka, with Prague's EIP-7623 calldata floor, Osaka's EIP-7825 per-transaction gas cap and type-4 (EIP-7702) transactions on both engines (its README, "Hardfork"). rocketh uses the default.
- **The dev-node layer is `@webevm/devnode` 0.1.0**, a separate package in the webevm repository (its ADR 0017), not in webevm's core, whose ADRs 0002 and 0004 rule out accounts, signing and impersonation there. It provides anvil's and Hardhat's test accounts funded at genesis (so an index-declared account resolves to the same address as on anvil), `eth_sendTransaction` and the signing methods for them, opt-in `hardhat_` / `anvil_` impersonation over webevm's trusted-sender mode, the core's balance, mining and snapshot methods under their `hardhat_` / `anvil_` / `evm_` names, and `toAllocs(dump)` for `vm.loadAllocs`.
- **Checked end to end on 2026-11-20** with the published packages (rocketh 0.26.4, `@rocketh/web` 0.19.34, webevm 0.10.0, `@webevm/devnode` 0.1.0, forge 1.7.1): a contract compiled for Prague deployed from `deployer: {default: 0}`, then a call from an account declared by address and impersonated (captured as `intent:node,intent:impersonated`); the dump, passed through `toAllocs`, loaded in a real `forge test` that read the call's effect.
- **Packaging:** `@rocketh/node` reaches the chain through a dynamic import, declaring `webevm` and `@webevm/devnode` as optional peer dependencies, so a user who never runs in-process installs nothing extra; a `memory` run with no provider and neither installed fails naming the install command. No new rocketh package (a new package needs a manual first publish, CONTEXT.md). Adding the dependencies needs maintainer approval at build time (AGENTS.md), and the workspace's seven-day `minimumReleaseAge` (`pnpm-workspace.yaml`) does not resolve versions published on 2026-11-20 until 2026-11-27 unless they are exempted.
- **The dev accounts are the environment's local accounts** (spec `environment-accounts`): when the environment declares `localAccounts`, the devnode is created with them, so they are funded at genesis and an index resolves to the same address in-process as on the live network; with none declared it is created with devnode's defaults (anvil's ten). No devnode-specific account option exists in rocketh's config.
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
