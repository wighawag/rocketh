# Development workflow

While you build an app or a game on your contracts, you want the contracts running on a local node, and every edit to a contract or a deploy script live on that node a moment later, at the same address, with the state your app already put there. That is **Hot Contract Replacement**: the equivalent, for contracts, of the hot module replacement of a web app. It needs no special feature of hardhat-deploy, only three things you already have:

- contracts deployed behind a proxy with `deployViaProxy`, which upgrades the proxy in place when the implementation changes (see [Proxies](/documentation/proxies/#upgrading));
- an account that can upgrade it, which on a local node is one the node holds;
- a watcher that recompiles on every change to the sources and redeploys on every change to the artifacts or the deploy scripts.

The watcher setup below is the one of [template-ethereum-contracts](https://github.com/wighawag/template-ethereum-contracts), and was checked by running it: an edit to a contract's source recompiled it, redeployed its implementation and upgraded the proxy at the same address, with the new function callable through it; an edit to a deploy script redeployed too.

## The three processes

Each runs in its own terminal (the template's `pnpm start` opens them all in a [Zellij](https://zellij.dev) layout, along with a test watcher and a shell). The commands are the template's scripts, run from its `contracts` folder, with what each one runs.

**A local node.**

```bash
pnpm node:local
# runs: hardhat --network local node
```

`local` is an in-process Hardhat network declared in the template's `hardhat.config.ts`; `hardhat node` serves it at `http://127.0.0.1:8545`, which is the `localhost` network the other two talk to. [anvil](https://getfoundry.sh/anvil/overview) works as well.

**Recompile on change.**

```bash
pnpm compile:watch
# runs: as-soon -w src hardhat compile
```

[as-soon](https://www.npmjs.com/package/as-soon) runs the command whenever a file under `src` changes. Each compilation rewrites the [typed artifacts](../typed-artifacts/) in `generated/`.

**Redeploy on change.**

```bash
pnpm deploy:watch localhost --ts ./exports/deployments.ts
# runs: as-soon -w generated -w deploy \
#   "hardhat --network localhost deploy --no-compile --skip-prompts && rocketh-export -e localhost --ts ./exports/deployments.ts"
```

Whenever the artifacts or a deploy script change, it deploys to `localhost` without compiling again (the other watcher just did) and without asking, then exports the deployments for the app. Keep the export's destination out of the watched folders, or each export triggers the next.

The template's `localhost` environment declares `overrides: {autoMine: true}` in `rocketh/config.ts`, and its `local` node mines a block every 3 seconds (`mining: {interval: 3000}`): rocketh asks the node to mine after each transaction it sends, so a redeploy is not held up by the interval.

## What happens on an edit

Change a function of `GreetingsRegistry.sol` and save:

```text
Files changed under src
Compiled 2 Solidity files with solc 0.8.28
Files changed under generated
- Executing deploy/001_deploy_greetings_registry.ts
  - Deploying GreetingsRegistry_Implementation (deterministically) with tx:
      0xa04f...1477
    => 0xDE2928FD0FEdFC9ED72f0ff8BB9785C6BaB9b0C7
  - Broadcasting tx:
      0xa5e2...2bba
```

The new implementation is deployed, and the proxy, owned by the node's account 1 (`admin`), is upgraded to it: the second transaction. The proxy keeps its address and its storage, so the app reconnects to nothing and loses no state, and the export it imports now carries the new ABI. An edit that changes nothing deployable (a comment) changes the metadata only, which rocketh ignores, so nothing is redeployed. A change to a deploy script reruns the scripts the same way.

Storage still follows the rule of every upgrade: append new state variables, never reorder or insert them, or the new code reads the old slots as something else.

## Tests on watch

The template also reruns the tests on every change, without compiling again:

```bash
pnpm test:watch
# runs: as-soon -w generated -w test hardhat test --no-compile
```

Tests run the deploy scripts on Hardhat's in-memory network, not on the local node, see [Tests with Hardhat fixtures](../tests/).
