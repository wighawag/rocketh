# Under hardhat-deploy: the `hardhat deploy` task

Read this when `hardhat.config.ts` lists hardhat-deploy among its `plugins`. The deploy scripts and every rule of `SKILL.md` are the same as under the `rocketh` command; what differs is where a network comes from, how a run is started, and how the finished check is made ([The same run with the `rocketh` command](https://rocketh.dev/hardhat-deploy/deploy-task/#the-same-run-with-the-rocketh-command)).

## The network is the environment

`--network <name>` names both the Hardhat network and the rocketh environment: the records go to `deployments/<name>/`, and the `accounts` and `data` entries keyed by that name apply. The network's endpoint and accounts come from `hardhat.config.ts`, not from `rocketh/config.ts` ([The `hardhat deploy` task](https://rocketh.dev/hardhat-deploy/deploy-task/)). So before naming the environment to the user, read `hardhat.config.ts` for the network names that exist.

With hardhat-deploy's network helpers, the names are those of the known-chain list, in kebab-case from the chain's display name (`base-sepolia`, `arbitrum-one`, and `ethereum` for chain 1, not `mainnet`), plus one per `ETH_NODE_URI_<network>` variable. A variable spells the name with underscores: `base-sepolia` reads `ETH_NODE_URI_base_sepolia` and `MNEMONIC_base_sepolia` ([Network Name Conversion](https://rocketh.dev/hardhat-deploy/networks/#network-name-conversion)). Use these exact names when you tell the user which variable to set.

Declare each live network in `rocketh/config.ts` as well (`environments: {sepolia: {chain: 11155111}}`): it is what ties the name to a chain id when the network is rehearsed on a fork, where Hardhat reports 31337 ([Deploying to a network](https://rocketh.dev/hardhat-deploy/getting-started/#deploying-to-a-network)).

## Endpoints and keys

A network's endpoint is `ETH_NODE_URI_<network>`, and its accounts come from `MNEMONIC_<network>`, else `MNEMONIC`. Only `hardhat`, `localhost`, `memory` and `test` fall back to the public test mnemonic; any other network with neither variable has no accounts, and the run stops before any script, naming the variable to set ([Environment variable patterns](https://rocketh.dev/hardhat-deploy/networks/#environment-variable-patterns), [Under hardhat-deploy](https://rocketh.dev/documentation/named-accounts/#when-the-network-has-no-accounts)). Give the user that name, and let them set it in `.env.local` or as a Hardhat configuration variable: the value `SECRET` reads `SECRET_<the variable>` from Hardhat's keystore ([Secret management](https://rocketh.dev/hardhat-deploy/networks/#secret-management)). The guardrail of `SKILL.md` holds: you refer to these by name and never read their values.

## Running

```bash
npx hardhat deploy
npx hardhat deploy --network sepolia
npx hardhat deploy --network sepolia --tags Token
npx hardhat deploy --network sepolia --skip-prompts
```

- Without `--network`, the task runs on Hardhat's in-memory network: it asks nothing and saves nothing. Use it to check that the scripts run; a deployment there is finished when the run succeeds.
- With `--network`, it compiles first, prints the environment and its chain, and asks. Add `--skip-prompts` only once the user said yes to that network and its chain (`SKILL.md`, "Running and re-running").
- `--tags` runs the scripts carrying one of the tags, with their dependencies ([Options](https://rocketh.dev/hardhat-deploy/deploy-task/#options)).

## The finished check on a fork

The task has no `--write-transactions`, so the check that a live deployment is finished runs with the `rocketh` command, which the project already has: it comes with `@rocketh/node`, the package hardhat-deploy runs on ([By hand](https://rocketh.dev/hardhat-deploy/getting-started/#by-hand)). The `rocketh` command compiles nothing: compile first, or the check runs against the previous artifacts ([The same run with the `rocketh` command](https://rocketh.dev/hardhat-deploy/deploy-task/#the-same-run-with-the-rocketh-command)).

```bash
npx hardhat compile
anvil --fork-url "$ETH_NODE_URI_sepolia"
npx rocketh -e sepolia --is-fork --write-transactions ./fork-rerun.json --skip-prompts
```

anvil reports the forked chain's id, so the rehearsal takes that network's settings and tags ([Which chain id?](https://rocketh.dev/documentation/fork-runs/#which-chain-id-two-questions-two-answers)). When the endpoint is a Hardhat configuration variable (`SECRET`), the shell holds no URL to give anvil: ask the user to start the fork node themselves, and run the check against it.

`HARDHAT_FORK=sepolia npx hardhat deploy` rehearses on a fork Hardhat starts in process, with no node to run, and writes nothing back. It is a rehearsal, not the finished check, since it writes no list of what it sent; its fork reports 31337, which is why `environments.sepolia.chain` has to be declared ([Forking with `HARDHAT_FORK`](https://rocketh.dev/hardhat-deploy/networks/#forking-with-hardhat_fork)).

A script that calls `env.getHardhatConnection()` throws under the `rocketh` command, which has no Hardhat connection ([Requiring Hardhat](https://rocketh.dev/hardhat-deploy/scripts/#requiring-hardhat-envgethardhatconnection)). In such a project, tell the user the fork check could not be made with the `rocketh` command, rather than reading the task's log as a substitute.

## Tests run the deploy scripts

The project's tests deploy through the same scripts: a fixture calls `loadAndExecuteDeploymentsFromFiles({provider})` from `rocketh/environment.ts`, and `networkHelpers.loadFixture` snapshots the result ([Tests with Hardhat fixtures](https://rocketh.dev/hardhat-deploy/tests/)). So after changing a deploy script, run `npx hardhat test`: a script that breaks fails there first. A test that needs a contract deployed takes it from that fixture (`env.get`), not from a deployment written inside the test, so it tests what the scripts deploy. A fixture for part of the system passes `tags`, one fixture function per set, since `loadFixture` snapshots per function ([Part of the system: `tags`](https://rocketh.dev/hardhat-deploy/tests/#part-of-the-system-tags)). Solidity tests (`.t.sol`) do not run the deploy scripts.

## Typed artifacts

Every compilation writes `generated/artifacts/` and `generated/abis/`; a script imports `artifacts` from `rocketh/deploy.ts`, and the ABI's type checks the constructor arguments and function names ([Typed artifacts](https://rocketh.dev/hardhat-deploy/typed-artifacts/)). After changing a contract, compile before reading a type error in a script: the error may be the old artifact. `generated/` is written by the compiler, so a fix goes in the contract or the script, never in that folder. A deployment read back with `get` is untyped; give it the ABI type from `generated/abis/` (`get<Abi_Token>('Token')`) ([Using them](https://rocketh.dev/hardhat-deploy/typed-artifacts/#using-them)).

## A call made once now

A call the user wants made now on a deployed contract, which a fresh deployment should not repeat, belongs in a script under `scripts/` that loads the environment with `loadEnvironmentFromHardhat` and runs with `HARDHAT_NETWORK=<network>`, not in `deploy/` ([Scripts and the Hardhat connection](https://rocketh.dev/hardhat-deploy/scripts/)). The same confirmation of the network applies, and an unsignable account goes through the same flow (`SKILL.md`, "When rocketh cannot sign").

## A new project

For a new project in an empty folder, `hardhat-deploy init` writes a working one: the `rocketh/` files, a deploy script and a test ([With `hardhat-deploy init`](https://rocketh.dev/hardhat-deploy/getting-started/#with-hardhat-deploy-init)). It refuses a folder that is not empty; an existing Hardhat 3 project gets hardhat-deploy by hand ([By hand](https://rocketh.dev/hardhat-deploy/getting-started/#by-hand)).

```bash
npx hardhat-deploy init my-project --install
```
