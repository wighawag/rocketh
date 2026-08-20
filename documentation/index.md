# Introduction

## What is rocketh?

rocketh is a framework-agnostic system for deploying smart contracts on Ethereum-compatible networks. It provides a minimal API to save and load deployments, making it easy to track and manage contract deployments across different networks.

Key features of rocketh include:

- Deployment tracking and management
- Deploy Scripts that can run anywhere, including in the browser
- Named accounts for easier contract interaction
- Deterministic deployments
- Library linking
- Support for various deployment strategies

## Try it here

"Deploy scripts that can run anywhere, including in the browser" is easy to claim, so here it is running. Press **Start** and this page boots an EVM in your tab and walks four real deploy scripts, one step at a time.

Nothing is simulated. The contracts are compiled bytecode executed by a real EVM, the scripts are ordinary rocketh scripts using the same `@rocketh/deploy` and `@rocketh/proxy` you would use against mainnet, and every address you see really has code at it. Nothing talks to a network, so nothing is deployed anywhere but your own tab, and it all disappears when you reload.

<rocketh-playground></rocketh-playground>

### What just happened

The four steps are a story about upgradeable contracts, and the interesting part is step 2.

1. **Deploy behind a proxy.** `GreetingsRegistry` goes up with a `CREATE2` implementation and a proxy in front of it. You get two addresses: the proxy is the one you hand out, the implementation is the code behind it.
2. **Write a greeting.** You set `"hello"` and it reads back as `"hello"`, even though the script passed a `"proxy:"` prefix to the contract's constructor. This is the bug, and it is one of the most common proxy mistakes there is: a constructor runs against the _implementation's_ storage, never the proxy's, so the proxy's own `_prefix` slot was never written.
3. **Upgrade the implementation.** The same proxy is pointed at `GreetingsRegistryV2`, which sets the prefix through a `postUpgrade` call instead of a constructor. Watch the two tags in the Deployed panel: the proxy is **same as before**, the implementation is **replaced**. Your greeting from step 2 is still there.
4. **Write another greeting.** Now it comes back `"proxy:hello again"`. The greeting from step 2 keeps its old, unprefixed value.

That last asymmetry is worth sitting with. An upgrade replaces **code**, not **storage**: it changes what happens next, it does not rewrite what already happened. It is also why `GreetingsRegistryV2` may only _append_ storage variables. Reordering them, or inserting one above `messages`, would leave the new code reading the old slots and silently reinterpret every greeting anyone had stored.

::: tip Read the contracts
Both implementations live in [`packages/rocketh-playground/contracts/`](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-playground/contracts), and the four deploy scripts are in [`src/fixture/deploy-scripts.ts`](https://github.com/wighawag/rocketh/blob/main/packages/rocketh-playground/src/fixture/deploy-scripts.ts). They are compiled from that source, so what you read is what ran.
:::

## What is hardhat-deploy?

hardhat-deploy is a plugin for the Hardhat Ethereum development environment that leverages rocketh to provide a comprehensive deployment system. It makes it easy to deploy contracts to any network, keeping track of them and replicating the same environment for testing.

Key features of hardhat-deploy include:

- Integration with Hardhat's testing and task system
- Deployment scripts with tags and dependencies
- Named accounts for clearer tests and deployment scripts
- Support for specific deploy scripts per network
- Deployment retrying through saved pending transactions

## Relationship Between rocketh and hardhat-deploy

hardhat-deploy v2 is a complete rewrite that uses rocketh under the hood. While rocketh provides the core deployment functionality, hardhat-deploy integrates it with the Hardhat environment, making it accessible through Hardhat tasks and configuration.

rocketh is designed to be modular, with core functionality provided by separate packages like `@rocketh/deploy`, `@rocketh/proxy`, and `@rocketh/diamond`. hardhat-deploy wires these modules together and adds Hardhat-specific functionality.

## Where to go next

If you are starting a project, read these in order:

1. [Installation and Setup](./installation/) - install the packages and create the three files rocketh expects.
2. [Core Concepts](./core-concepts/) - deployments, environments, chains, named accounts, tags and dependencies.
3. [Using rocketh](./deploying/) - deploy contracts, proxies and diamonds, link libraries, deploy deterministically.
4. [Examples](./examples/) - complete deploy scripts to copy from.

Then, as you need them:

- [Using hardhat-deploy with rocketh](./hardhat-deploy/) - the Hardhat plugin, and running deploy scripts in tests.
- [Testing your deploy scripts](./testing/) - the `@rocketh/test-utils` harness, no node required.
- [Exporting, verifying and documenting](./exporting-and-verifying/) - getting addresses and ABIs to a frontend, and source to a block explorer.
- [Handling unknown signers](./unknown-signers/) - privileged calls owned by a Safe, multisig or governance key.
- [Production hardening](./production-hardening/) - what to check before a deployment touches a live chain.
- [Architecture Overview](./architecture/) - how the packages fit together.

Migrating an existing project? See [Migrating from hardhat-deploy v1 to v2](./migration/), and the dedicated [hardhat-deploy documentation](/hardhat-deploy/).

## Source

- [rocketh GitHub repository](https://github.com/wighawag/rocketh)
- [hardhat-deploy GitHub repository](https://github.com/wighawag/hardhat-deploy)
