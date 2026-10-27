# The `hardhat deploy` task

hardhat-deploy adds one task to Hardhat, `deploy`. It compiles your contracts, then runs the scripts of your `deploy` folder against the network you name, exactly as the `rocketh` command does, and records the deployments in `deployments/<network>/`.

```bash
npx hardhat deploy --network sepolia
npx hardhat deploy --network sepolia --tags GreetingsRegistry
npx hardhat deploy                  # Hardhat's in-memory network: a dry run, nothing kept
```

The network is Hardhat's global `--network` option, and it is also the rocketh environment: its name selects the deployment folder, the `accounts` and `data` entries, and `environments.<name>` in `rocketh/config.ts`. Its endpoint and its accounts come from `hardhat.config.ts`. Without `--network`, the task runs on Hardhat's default network. On an in-memory network (`type: 'edr-simulated'`, as the default one is) it saves nothing and asks nothing, which makes it a quick check that the scripts run.

## Options

From `packages/hardhat-deploy/src/index.ts` and `src/tasks/deploy.ts`:

| Option                              | Meaning                                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--tags <list>`                     | Comma-separated tags: only scripts carrying one of them run, with their dependencies. See [Tags](/documentation/deploy-scripts/#tags-running-part-of-the-scripts). |
| `--reset`                           | Delete the network's deployment records first.                                                                                                                     |
| `--no-compile`                      | Do not compile before deploying (the watcher of the [development workflow](../development-workflow/) uses it, having just compiled).                               |
| `--default-build-profile <profile>` | The build profile the compilation uses (default `production`). Hardhat's global `--build-profile` overrides it.                                                    |
| `--save-deployments <true\|false>`  | Save the records, or not. By default they are saved, except on an in-memory network (`true` writes them there) and on a fork (where nothing is written).           |
| `--on-unknown-signer <policy>`      | `throw`, `ask` or `auto` (default): what to do with a transaction from an account rocketh cannot sign for. See [Unknown signers](/documentation/unknown-signers/). |
| `--skip-prompts`                    | Ask nothing: no confirmation, and `--on-unknown-signer throw`. Implied on an in-memory network.                                                                    |
| `--gas-price <wei>`                 | Legacy gas price for every transaction whose call sets no fee option. See [Fees for a whole run](/documentation/environments/#fees-for-a-whole-run).               |
| `--max-fee-per-gas <wei>`           | EIP-1559 max fee, same rule. Cannot be combined with `--gas-price`.                                                                                                |
| `--max-priority-fee-per-gas <wei>`  | EIP-1559 priority fee, same rule. Cannot be combined with `--gas-price`.                                                                                           |
| `--polling-interval <seconds>`      | How often to poll for a transaction, over the config's `defaultPollingInterval`.                                                                                   |
| `--report-gas-used`                 | Print the gas used at the end.                                                                                                                                     |

The fee options are spelled as on the `rocketh` command. hardhat-deploy v1's `--gasprice`, `--maxfee` and `--priorityfee` are not accepted, since a Hardhat task option has no alias.

On a fork run (`HARDHAT_FORK`, see [Rehearse on a fork](/documentation/fork-runs/#through-hardhat-deploy-hardhat_fork)) nothing is written, whatever `--save-deployments` says: a rehearsal must not write into the forked network's records.

## The same run with the `rocketh` command

The task and the command run the same executor, so a project can use either; only the Hardhat side differs:

| `hardhat deploy`                                                              | `rocketh`                                           |
| ----------------------------------------------------------------------------- | --------------------------------------------------- |
| `--network sepolia`                                                           | `-e sepolia`                                        |
| compiles first (`--no-compile` to skip)                                       | compiles nothing: compile first                     |
| accounts from the hardhat network                                             | accounts from the node, or from `rocketh/config.ts` |
| `HARDHAT_FORK=sepolia`                                                        | `-e sepolia --is-fork` against a node you started   |
| `--tags`, `--reset`, `--skip-prompts`, `--on-unknown-signer`, the fee options | the same                                            |
| `--save-deployments true\|false`                                              | `--save-deployments` (set only)                     |
| `--report-gas-used` (off by default)                                          | gas reported by default, `--skip-gas-report`        |
| `--polling-interval`, `--default-build-profile`                               | not on the command line                             |
| not on the task                                                               | `--scripts`, `--deployments`, `--log-level`         |
| not on the task                                                               | `--write-transactions <file>`                       |

The task has no `--write-transactions`: to write a rehearsal's transactions to a file, run it with the `rocketh` command against a node you started, as the [Safe-owned project](/documentation/safe-owned-project/#4-rehearse-on-a-fork) does, or read `env.capturedTransactions` in a [`runAtTheEnd` script](/documentation/script-lifecycle/#the-batch-proposer-what-runattheend-is-really-for). Every option of the command is in [the CLI reference](/documentation/reference/cli/#rocketh).

## Other commands

Verifying, exporting and documenting are commands of their own, run after a deployment the same way whether it was deployed by the task or by `rocketh`: `rocketh-verify`, `rocketh-export` and `rocketh-doc`, see [Export, verify and document](/documentation/exporting-and-verifying/).
