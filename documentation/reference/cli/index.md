# CLI

Every command rocketh ships, with all its options. Each section names the file it mirrors, so a change to a command can be checked against this page.

All of them read `rocketh/config.ts` (or `rocketh.ts`) from the current directory. `rocketh` and `rocketh-verify` load `.env` and `.env.local` first, so an endpoint or an API key can live there.

## `rocketh`

From `@rocketh/node` (`packages/rocketh-node/src/cli-options.ts`). Runs the deploy scripts against an environment and records the deployments.

```bash
npx rocketh -e sepolia
npx rocketh -e sepolia --tags Token
npx rocketh -e mainnet --is-fork --write-transactions ./batch.json
```

| Option                                                     | Meaning                                                                                                                                                          |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-e, --environment <name>`                                 | Required. The environment to deploy to (see [Environments and chains](../../environments/)).                                                                     |
| `-t, --tags <list>`                                        | Comma-separated tags: only scripts carrying one of them run, with their dependencies. Spaces around commas are ignored; empty means all.                         |
| `-s, --scripts <folder>`                                   | The folder of deploy scripts, instead of `scripts` in the config (default `deploy`).                                                                             |
| `-d, --deployments <folder>`                               | The folder of deployment records, instead of `deployments` in the config (default `deployments`).                                                                |
| `--reset`                                                  | Delete the environment's deployment records first (refused on a fork).                                                                                           |
| `--save-deployments`                                       | Save the records. They are saved by default, except on a fork, where this flag is the only way to save.                                                          |
| `--is-fork`                                                | The node is a fork of the environment named by `-e`: read its records, write none, impersonate. See [Rehearse on a fork](../../fork-runs/).                      |
| `--write-transactions <file>`                              | Write the transactions the run broadcast, in order, as JSON. Only when the run succeeds. See [Captured transactions](../../captured-transactions/).              |
| `--on-unknown-signer <policy>`                             | `throw`, `ask` or `auto` (default `auto`): what to do with a transaction from an account rocketh cannot sign for. See [Unknown signers](../../unknown-signers/). |
| `--skip-prompts`                                           | Ask nothing: no confirmation, and `--on-unknown-signer throw`.                                                                                                   |
| `--gas-price <wei>` (alias `--gasprice`)                   | Legacy gas price for every transaction whose call sets no fee option. See [Fees for a whole run](../../environments/#fees-for-a-whole-run).                      |
| `--max-fee-per-gas <wei>` (alias `--maxfee`)               | EIP-1559 max fee, same rule. Cannot be combined with `--gas-price`.                                                                                              |
| `--max-priority-fee-per-gas <wei>` (alias `--priorityfee`) | EIP-1559 priority fee, same rule. Cannot be combined with `--gas-price`.                                                                                         |
| `--skip-gas-report`                                        | Do not print the gas used at the end.                                                                                                                            |
| `--log-level <level>`                                      | `error`, `warn`, `info` (default), `debug`, `trace`, or 1 to 5.                                                                                                  |

A value the command cannot accept (an unknown policy, a fee that is not decimal digits, an empty `--write-transactions` path) is refused before anything runs, with a message and exit code 1. So is a named account that cannot be resolved.

### Before the run: the confirmation

Unless `--skip-prompts` is given, the run first prints the environment, its chain and its tags, then the current range of gas prices, and asks whether to proceed; with `--reset` it asks first whether to delete the environment's deployment records (`packages/rocketh/src/executor/index.ts`). `hardhat deploy` asks the same questions, except on an in-memory network (`type: 'edr-simulated'`, Hardhat's default network), where it asks nothing (`packages/hardhat-deploy/src/tasks/deploy.ts`). With no terminal on stdin there is nobody to answer, so the run stops with an error that repeats the question and names `--skip-prompts`, rather than guessing an answer (`packages/rocketh-node/src/environment/prompt.ts`). `--skip-prompts` skips every one of these questions, so `--reset` with it deletes the records without asking.

## `hardhat deploy`

From hardhat-deploy (`packages/hardhat-deploy/src/index.ts`). The same run through Hardhat: it compiles first, takes the network (and so the environment) from `--network`, and the accounts from the hardhat network. Its options, how they map to the `rocketh` command, and what it does not have are on [The `hardhat deploy` task](/hardhat-deploy/deploy-task/).

```bash
npx hardhat deploy --network sepolia --tags Token
```

## `rocketh-verify`

From `@rocketh/verifier` (`packages/rocketh-verifier/src/cli.ts`). Submits the source of every deployment of an environment to a block explorer. `-e` comes before the explorer.

```bash
npx rocketh-verify -e sepolia etherscan
npx rocketh-verify -e sepolia sourcify
npx rocketh-verify -e sepolia blockscout
npx rocketh-verify -e sepolia metadata --out ./metadata
```

| Option                       | Meaning                                                |
| ---------------------------- | ------------------------------------------------------ |
| `-e, --environment <name>`   | Required. The environment whose deployments to verify. |
| `-d, --deployments <folder>` | The folder of deployment records.                      |

`etherscan` reads the API key from `ETHERSCAN_API_KEY` and uses Etherscan's V2 API (`https://api.etherscan.io/v2/api`) with the environment's chain id, so one key covers every chain that API supports:

| Option                | Meaning                                                          |
| --------------------- | ---------------------------------------------------------------- |
| `--endpoint <url>`    | another Etherscan-compatible API                                 |
| `--license <id>`      | the source license to declare (an SPDX id such as `MIT`)         |
| `--force-license`     | force the license given with `--license`                         |
| `--min-interval <ms>` | minimum time between requests                                    |
| `--fix-mispell`       | use the corrected spelling of a form field some explorers expect |

`sourcify` (default `https://sourcify.dev/server`) and `blockscout` (a default API is known for Ethereum, Sepolia, Optimism, Base, Gnosis and others) take `--endpoint <url>` and `--min-interval <ms>`. `metadata` writes each deployment's metadata into `--out <folder>` (default `_metadata`), for verifying by hand.

## `rocketh-export`

From `@rocketh/export` (`packages/rocketh-export/src/cli.ts`). Writes an environment's deployments as one file for a frontend. See [Exporting deployments](../../exporting-and-verifying/#exporting-deployments).

```bash
npx rocketh-export -e sepolia --ts ./src/contracts.ts
```

| Option                       | Meaning                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `-e, --environment <name>`   | Required. The environment to export.                                                       |
| `-d, --deployments <folder>` | The folder of deployment records.                                                          |
| `--ts <paths>`               | TypeScript files to write (comma-separated), one default-exported object.                  |
| `--js <paths>`               | JavaScript files, same shape.                                                              |
| `--json <paths>`             | JSON files, same shape.                                                                    |
| `--tsm <paths>`              | TypeScript modules with one named export per deployment (names must be valid identifiers). |
| `--jsm <paths>`              | JavaScript modules, same.                                                                  |
| `-b, --bytecode`             | Include the bytecode.                                                                      |
| `--verify`                   | Check the chain id and that every address has code before writing (needs the RPC).         |

At least one output is required. An environment with no deployments fails rather than writing an empty file.

## `rocketh-doc`

From `@rocketh/doc` (`packages/rocketh-doc/src/cli.ts`). Generates documentation from the deployments' ABIs and NatSpec. See [Generating documentation](../../exporting-and-verifying/#generating-documentation).

```bash
npx rocketh-doc -e sepolia -o ./docs/contracts --except-suffix _Implementation,_Proxy
```

| Option                       | Meaning                                                                |
| ---------------------------- | ---------------------------------------------------------------------- |
| `-e, --environment <name>`   | Required. The environment to document.                                 |
| `-d, --deployments <folder>` | The folder of deployment records.                                      |
| `-o, --output <folder>`      | Where to write the documentation.                                      |
| `-t, --template <file>`      | Your own Handlebars template.                                          |
| `--except-suffix <list>`     | Comma-separated suffixes of deployment names to leave out (one value). |

## `hardhat-deploy init`

From hardhat-deploy (`packages/hardhat-deploy/src/cli.ts`). Creates a new Hardhat project with hardhat-deploy, rocketh and a test, ready to compile and deploy.

```bash
npx hardhat-deploy init my-project --install
```

| Argument or option | Meaning                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `[folder]`         | The folder to create the project in. It must be empty or not exist. Without it, the command asks for one. |
| `--install`        | Install the dependencies with pnpm. Without a folder argument, the command asks instead.                  |

It refuses a folder that is not empty. The project's `package.json` takes the folder's name, and depends on the hardhat-deploy version that created it (as a caret range).
