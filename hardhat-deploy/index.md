---
# The hardhat-deploy section's entry page. The social card and its
# description: without them, sharing this page falls back to the site-wide
# card, which shows the rocketh mark and tagline.
image: /hardhat-deploy-preview.png
description: 'A Hardhat plugin for replicable deployments and easy testing'
---

# hardhat-deploy

_A [Hardhat](https://hardhat.org) plugin for replicable deployments and easy testing._

hardhat-deploy v2 runs [rocketh](/documentation/) inside Hardhat. You write deploy scripts in your project's `deploy` folder, `hardhat deploy --network <name>` runs them against that network and records what they deployed, and your tests run the same scripts as a fixture, so they test the contracts as they are deployed. Accounts are named (`deployer`, `admin`) rather than indexed, proxies and diamonds are declared rather than hand-upgraded, and a proxy owned by a Safe is upgraded through the Safe, rehearsed on a fork first.

This is the documentation of v2, for Hardhat 3. It is a section of the rocketh documentation because hardhat-deploy is rocketh plus Hardhat: everything about deploy scripts, accounts, proxies, forks and Safes is shared with plain rocketh, and lives in the shared pages with the `hardhat deploy` command shown; the pages of this section cover what exists only because of Hardhat. The documentation of v1 is on its [v1 branch](https://github.com/wighawag/hardhat-deploy/tree/v1#readme).

::: tip Coming from hardhat-deploy v1?
Start with [Coming from hardhat-deploy v1](./migration/): what v1 has that v2 does not, what changed, and whether your project can move, then the [step-by-step migration](./migration/step-by-step/).
:::

## The path

1. [Get started with hardhat-deploy](./getting-started/): `hardhat-deploy init`, or setting up a project by hand.
2. [Deploy scripts, tags and dependencies](/documentation/deploy-scripts/) and [Deploy contracts](/documentation/deploy-contracts/): what a script is and what `deploy` does.
3. [Named accounts and signers](/documentation/named-accounts/) and [Networks and accounts from the environment](./networks/): deploying to a real network.
4. [Upgradeable contracts with proxies](/documentation/proxies/), and as you need them [Diamonds](/documentation/diamonds/), [Routers](/documentation/routers/) and [Deterministic addresses](/documentation/deterministic-addresses/).
5. [Tests with Hardhat fixtures](./tests/): your deploy scripts as a test fixture, in TypeScript and in Solidity tests.
6. [Rehearse on a fork](/documentation/fork-runs/): `HARDHAT_FORK`, and what a rehearsal inherits from the network it forks.
7. [A Safe-owned project, end to end](/documentation/safe-owned-project/): a proxy owned by a Safe, from deployment to an upgrade executed in the Safe app.
8. [Export, verify and document](/documentation/exporting-and-verifying/): your deployments for a frontend and a block explorer.

## Only in hardhat-deploy

- [The `hardhat deploy` task](./deploy-task/): its options, and how they map to the `rocketh` command.
- [Networks and accounts from the environment](./networks/): `addNetworksFromEnv`, `addNetworksFromKnownList`, `addForkConfiguration`, `HARDHAT_FORK`.
- [Typed artifacts](./typed-artifacts/): the `artifacts` and `abis` modules generated from each compilation.
- [Scripts and the Hardhat connection](./scripts/): `loadEnvironmentFromHardhat`, `env.hardhatConnection` and `env.getHardhatConnection()` (`hardhat-deploy/extensions`).
- [Development workflow](./development-workflow/): a local node, and redeploy on change (Hot Contract Replacement).

For a complete project to start from, see [template-ethereum-contracts](https://github.com/wighawag/template-ethereum-contracts). The plugin's source and issues are in the [rocketh repository](https://github.com/wighawag/rocketh/tree/main/packages/hardhat-deploy).
