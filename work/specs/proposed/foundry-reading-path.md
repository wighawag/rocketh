---
title: 'A Foundry reading path: docs, a demo and a skill for forge users'
slug: foundry-reading-path
taskedAfter: [forge-artifacts, deployments-in-solidity, in-process-chain]
---

> Launch snapshot: records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) and the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked: they move into tasks or ADRs, and this spec settles to its durable framing of Problem, Solution, User Stories and Out of Scope.)

## Problem Statement

A Foundry user arriving at rocketh.dev finds one page for them, "Get started without Hardhat" (`documentation/getting-started/`), and then a documentation written for the `rocketh` CLI in general and a whole `hardhat-deploy/` section that does not apply. Nothing tells them how to test their deploy scripts with `forge test`, how their `foundry.toml` has to be set, or where forge's conventions and rocketh's meet. The agent skills have the same gap: `rocketh-deploy` knows hardhat-deploy projects and the CLI, not a Foundry project.

## Solution

Once specs `forge-artifacts`, `in-process-chain` and `deployments-in-solidity` land, a Foundry project gets what hardhat-deploy projects got: a reading path on the site, a demo in `demoes/`, and the skills taught to recognise and work in a Foundry project.

## User Stories

1. As a Foundry user, I want a getting-started page that goes from `forge init` to a deploy script, a deployment and a `forge test` that reads it, so that I see the whole loop once.
2. As a Foundry user, I want a page on testing deploy scripts with `forge test` (the fixture, the accessors, fork tests, regeneration), so that I can set up my test suite.
3. As a Foundry user, I want the `foundry.toml` settings rocketh needs (`fs_permissions`, `out`, the gitignored generated folder) stated in one place, so that I can check my project against them.
4. As a Foundry user, I want the landing page and the documentation index to send me to this path, so that I do not start in the hardhat-deploy section.
5. As a forge-deploy user, I want a page mapping forge-deploy's concepts to rocketh's (Solidity deploy scripts to TypeScript ones, `deployer.getAddress` kept, `DEPLOYMENT_CONTEXT` to environments), so that I can move over.
6. As a Foundry user, I want a demo project in the repository that CI builds and tests with forge, so that the docs' code is known to work.
7. As a Foundry user working with a coding agent, I want the `rocketh-deploy` skill to recognise a Foundry project (`foundry.toml`, `out/`) and follow this path, so that the agent does not set up Hardhat.
8. As a maintainer, I want the getting-started page for Foundry to run as a test in CI like the existing ones (`scripts/test-doc.sh`), so that it cannot drift from what a reader installs.

## Implementation Decisions

- The site already has two reading paths (`hardhat-deploy/` and `documentation/`); whether Foundry gets a third top-level section or a sub-path of `documentation/` is decided when the pages are written, following `work/specs/tasked/documentation-information-architecture.md`.
- The demo joins `demoes/` as a workspace member like the others (see `pnpm-workspace.yaml`), with its forge dependencies vendored the way forge expects.

## Testing Decisions

- The Foundry getting-started page runs through the doc-test harness in CI (Foundry is already installed in `test.yml`).
- The demo's `forge test` runs in CI.
- The skill change gets a baseline prompt in the skill fixtures like the existing ones.

## Out of Scope

- The features themselves (the three specs this follows).
- A `rocketh init` template for Foundry projects: worth a separate decision once the path exists.
