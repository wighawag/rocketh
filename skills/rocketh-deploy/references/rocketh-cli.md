# Without Hardhat: the `rocketh` command

Read this when the project runs its deploy scripts with the `rocketh` command (from `@rocketh/node`) and has no hardhat-deploy plugin. The deploy scripts and every rule of `SKILL.md` are the same as under `hardhat deploy`; what differs is that `rocketh/config.ts` alone describes the networks and the accounts, and that nothing compiles for you ([Get started without Hardhat](https://rocketh.dev/documentation/getting-started/)).

## An environment is declared before it is deployed to

`-e <name>` names an entry of `environments` in `rocketh/config.ts`, which says its chain (`sepolia: {chain: 11155111}`). Environments are never derived from a chain's name, so a name that is not declared stops the run ([Environments](https://rocketh.dev/documentation/environments/#environments)). When the user asks for a network the config does not declare, add the environment with its chain id, and tell them you did.

The endpoint is the chain's `rpcUrl` (`chains[<id>].rpcUrl`, or `environments.<name>.overrides.rpcUrl` for one environment); with none, the run falls back to the chain's public default endpoint, which is rate-limited ([Chains](https://rocketh.dev/documentation/environments/#chains)). For a live deployment, ask the user which endpoint to use and have the config read it from `process.env`, under the variable name they choose; an endpoint carrying a token is a secret like a key.

## Accounts on a real network

An index (`deployer: 0`) is one of the node's own accounts, and a public endpoint holds none, so on a real network the run stops before any script, listing each account it cannot resolve and the fix ([Named accounts on a real network](https://rocketh.dev/documentation/named-accounts/#named-accounts-on-a-real-network)). The fix is in `rocketh/config.ts`, per environment: a key read from the environment (`` sepolia: `privateKey:${process.env.DEPLOYER_PRIVATE_KEY}` ``, with `privateKey` from `@rocketh/signer` registered in `signerProtocols`), or an address. An address rocketh cannot sign for (a Safe) is _unsignable_, which `SKILL.md` routes to `rocketh-safe-owned-changes`. Give the user the variable's name; the `rocketh` command loads `.env` and `.env.local` before it reads the config, so that is where they put the value ([CLI](https://rocketh.dev/documentation/reference/cli/)).

## Compile first

rocketh deploys from artifacts and compiles nothing. After a contract changes, run the project's compiler (`forge build`, or whatever writes the artifacts `rocketh/deploy.ts` re-exports) before re-running: a re-run on the old artifacts finds every record matching and sends nothing, which is not an upgrade ([A contract, compiled](https://rocketh.dev/documentation/getting-started/#a-contract-compiled)).

## Running

```bash
npx rocketh -e sepolia
npx rocketh -e sepolia --tags Token
npx rocketh -e sepolia --skip-prompts
```

The run prints the environment, its chain and its tags, and asks; add `--skip-prompts` only once the user said yes to that environment and its chain (`SKILL.md`, "Running and re-running"). Every option is in `npx rocketh --help` and [the CLI reference](https://rocketh.dev/documentation/reference/cli/#rocketh). On a local `anvil` declared as `localhost: {chain: 31337}`, `npx rocketh -e localhost --skip-prompts` is the quick check that the scripts run.

## The finished check on a fork

```bash
anvil --fork-url "$SEPOLIA_RPC_URL"
npx rocketh -e sepolia --is-fork --write-transactions ./fork-rerun.json --skip-prompts
```

`$SEPOLIA_RPC_URL` stands for the variable the config reads the endpoint from. `--is-fork` says the node at `http://127.0.0.1:8545` forks the environment named by `-e`: the run reads that environment's records, impersonates its accounts, and writes no record back ([From the command line: `--is-fork`](https://rocketh.dev/documentation/fork-runs/#from-the-command-line---is-fork)). anvil reports the forked chain's id, so the rehearsal takes that chain's settings and tags with nothing to declare ([What a fork run inherits](https://rocketh.dev/documentation/fork-runs/#what-a-fork-run-inherits-and-the-one-condition)). A fork node on another port is named in `whenForked.rpcUrl` ([Saying what differs](https://rocketh.dev/documentation/fork-runs/#saying-what-differs-whenforked)). Keep `--save-deployments` off this command: on a fork it is the one flag that writes the rehearsal into the live network's records ([A fork does not save](https://rocketh.dev/documentation/fork-runs/#a-fork-does-not-save-and-you-do-not-have-to-remember-that)).

`fork-rerun.json` holding `[]` is the criterion of `SKILL.md`: the deployment is finished.
