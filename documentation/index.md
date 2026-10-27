# Introduction

rocketh is a deployment system for smart contracts on Ethereum-compatible networks. You write **deploy scripts**, plain TypeScript functions that say what should be deployed and configured, and rocketh runs them against a network, records what it deployed, and on the next run does only what changed. The same scripts run from a command line, inside your tests, and in a browser.

**hardhat-deploy** v2 is the [Hardhat](https://hardhat.org) plugin built on it: the same scripts, the same configuration and the same records, run through `hardhat deploy` and available to Hardhat's tests. Most projects that use rocketh use it this way.

## What it does for you

- **Deploy scripts that converge.** A script states the result (this contract, behind this proxy, owned by this account), and running it again deploys, upgrades or cuts only what differs from the chain. Re-running is how a stopped deployment finishes and how tests get a deployed system.
- **Named accounts.** Scripts say `deployer` and `admin`, never `accounts[0]`; each environment says which account each name is and how it signs: a dev node's key, a private key from the environment, a hardware wallet, or a Safe that rocketh hands its transactions to.
- **Accounts rocketh cannot sign for.** A proxy owned by a Safe, a diamond cut by a timelock: the run pauses, prints the transaction, and checks the hash you paste back, or rehearses it all on a fork by impersonating the owner. See [A Safe-owned project, end to end](./safe-owned-project/).
- **Records you can rely on.** Every deployment is saved per environment in a [published format](./deployment-records/), which exports to a frontend, verifies on a block explorer and generates documentation.
- **Upgradeable patterns, declaratively.** Proxies (ERC-173, UUPS, transparent), [EIP-2535](https://eips.ethereum.org/EIPS/eip-2535) diamonds and routers: you declare the new implementation or facet set, rocketh works out the upgrade.
- **Deterministic addresses**, with create2 and create3, and the address known before deploying.
- **Hot Contract Replacement** during development: edit a contract and the proxy behind your running app is upgraded in place, the way HMR swaps a module. See [Development workflow](/hardhat-deploy/development-workflow/).
- **Modular.** At its core rocketh only saves and reads deployments; `deploy`, `deployViaProxy`, `diamond`, `read` and `execute` are extensions you choose, and you can write your own.

Where Hardhat's [Ignition](https://hardhat.org/ignition) asks you to describe a deployment in its module DSL, a rocketh deploy script is ordinary code: any logic, any library, any condition on the network it runs on.

## A deploy script

```typescript
// deploy/001_deploy_greetings_registry.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	// the environment: the functions of your extensions, the named accounts, the network
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await deployViaProxy(
			'GreetingsRegistry',
			{account: deployer, artifact: artifacts.GreetingsRegistry, args: ['hello: ']},
			{owner: admin, execute: {init: {methodName: 'init', args: ['hello: ']}}},
		);
	},
	// tags select the script, dependencies run other scripts first
	{tags: ['GreetingsRegistry']},
);
```

Every script in the `deploy` folder runs in turn when you deploy (`npx hardhat deploy --network sepolia`, or `npx rocketh -e sepolia`), and a test gets the deployed system with one call, `loadAndExecuteDeploymentsFromFiles({provider})`, so it tests the contracts as they are deployed rather than a copy assembled by the test.

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

## Which one to start with

- **You use Hardhat**, or have no preference: start with hardhat-deploy. It compiles your contracts, generates typed artifacts, and gives your tests deployment fixtures. [Get started with hardhat-deploy](/hardhat-deploy/getting-started/).
- **You compile with something else** (Foundry, solc, another framework), or want deploy scripts with no framework around them: use the `rocketh` command line directly. [Get started without Hardhat](./getting-started/).
- **You use hardhat-deploy v1**: [Coming from hardhat-deploy v1](/hardhat-deploy/migration/) says what changed and whether your project can move.

The rest of the documentation is shared: every page that is true of both shows both commands.

## Reading paths

**With hardhat-deploy**, start at [the hardhat-deploy section](/hardhat-deploy/), which has its own numbered path through its pages and into the shared guides.

**With the `rocketh` command line:**

1. [Get started without Hardhat](./getting-started/): a project from nothing, deployed to a local node.
2. [Deploy scripts, tags and dependencies](./deploy-scripts/), then [Named accounts and signers](./named-accounts/) and [Environments and chains](./environments/).
3. [Deploy contracts](./deploy-contracts/), and as you need them [Upgradeable contracts with proxies](./proxies/), [Diamonds](./diamonds/), [Routers](./routers/) and [Deterministic addresses](./deterministic-addresses/).
4. [Rehearse on a fork](./fork-runs/), then [A Safe-owned project, end to end](./safe-owned-project/) if anything you deploy is owned by a Safe, a multisig or a timelock.
5. [Export, verify and document](./exporting-and-verifying/), so a frontend and a block explorer see what you deployed.
6. Before a live privileged change: [Production hardening](./production-hardening/).

Reference: [the CLI](./reference/cli/), [the configuration](./reference/configuration/), [the environment](./reference/environment/) and [the packages](./reference/packages/). Writing your own extension: [Extending rocketh](./extending/).

## Source

- [rocketh on GitHub](https://github.com/wighawag/rocketh): the core, every package, hardhat-deploy, and this documentation.
- [template-ethereum-contracts](https://github.com/wighawag/template-ethereum-contracts): a complete project to start from.
