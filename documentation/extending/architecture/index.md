# Architecture

rocketh is split so that each project installs what it uses, and so that the core can run anywhere: it reads no file and needs no Node API, which is what lets the same deploy scripts run from a command line, in tests and in a browser ([ADR 0002](https://github.com/wighawag/rocketh/blob/main/docs/adr/0002-framework-agnostic-browser-capable-core.md), [ADR 0005](https://github.com/wighawag/rocketh/blob/main/docs/adr/0005-fine-grained-modular-packages.md)).

## The layers

```text
@rocketh/core           types and utilities shared by everything
      |
rocketh                 the environment and the executor
      |
@rocketh/node | @rocketh/web          a runtime: where scripts and records come from
      |
hardhat-deploy          the Hardhat plugin, on @rocketh/node

extensions              @rocketh/deploy, read-execute, proxy, diamond, router,
                        unknown-signer, viem: functions added to the environment
tools                   @rocketh/export, verifier, doc: commands over the records
```

| Package                   | Role                                                                                                                                                                                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@rocketh/core`           | The types every package speaks (`Environment`, `Deployment`, `Artifact`, `Signer`, `UserConfig`) and the shared utilities: ABI merging, bigint-safe JSON, `withEnvironment` (which turns extensions into environment methods).                                 |
| `rocketh`                 | `createEnvironment` (accounts, signers and signability, the one broadcast path, records, the unknown-signer seam), and the executor that orders scripts by their dependencies and runs them (`setupDeployScripts`, `resolveConfig`, `resolveExecutionParams`). |
| `@rocketh/node`           | The filesystem runtime: reads `rocketh/config.ts` and merges viem's chain registry into it, imports the scripts of `deploy/`, stores records in `deployments/`, prompts on a terminal, and is the `rocketh` command (`loadAndExecuteDeploymentsFromFiles`).    |
| `@rocketh/web`            | The browser runtime: scripts passed as modules, records in a virtual file system (in memory or IndexedDB), no text prompt.                                                                                                                                     |
| `hardhat-deploy`          | The Hardhat plugin, below.                                                                                                                                                                                                                                     |
| `@rocketh/deploy`         | `deploy` and `computeDeterministicAddress`: create, create2 and create3 deployments, library linking, re-deployment rules.                                                                                                                                     |
| `@rocketh/read-execute`   | `read`, `execute` (with its `guard`), `tx`.                                                                                                                                                                                                                    |
| `@rocketh/proxy`          | `deployViaProxy`, with the vendored proxy contracts of hardhat-deploy v1 ([ADR 0003](https://github.com/wighawag/rocketh/blob/main/docs/adr/0003-vendor-hardhat-deploy-v1-proxy-artifacts.md)).                                                                |
| `@rocketh/diamond`        | `diamond`, with the standard facets.                                                                                                                                                                                                                           |
| `@rocketh/router`         | `deployViaRouter`, with its router contract.                                                                                                                                                                                                                   |
| `@rocketh/unknown-signer` | `catchUnknownSigner` and `withUnknownSignerPolicy`, over core's unknown-signer seam ([ADR 0006](https://github.com/wighawag/rocketh/blob/main/docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md)).                                           |
| `@rocketh/signer`         | The `privateKey` signer protocol.                                                                                                                                                                                                                              |
| `@rocketh/viem`           | viem clients and contracts on the environment's provider (a getter extension).                                                                                                                                                                                 |
| `@rocketh/export`         | `rocketh-export`: records to a frontend file.                                                                                                                                                                                                                  |
| `@rocketh/verifier`       | `rocketh-verify`: records to verified source.                                                                                                                                                                                                                  |
| `@rocketh/doc`            | `rocketh-doc`: records to documentation.                                                                                                                                                                                                                       |
| `@rocketh/test-utils`     | A real environment over a mock provider, for testing extensions.                                                                                                                                                                                               |
| `@rocketh/playground`     | The in-browser playground of this site: `@rocketh/web` over an EVM in the tab.                                                                                                                                                                                 |

## How a run goes

1. **Configuration.** The runtime reads the user's config (`@rocketh/node`: `rocketh/config.ts`, with viem's public chain information merged in; `@rocketh/web`: the object you pass) and resolves it with the run's parameters: which environment, which chain, a fork or not, which policies.
2. **The environment.** `createEnvironment` connects to the node (or the provider given), checks the chain is the one the environment declares, resolves every named account to an address and a signer, decides each account's signability (impersonating where it may), and loads the environment's records.
3. **The scripts.** The executor takes the scripts (from the folder, or as modules), selects them by tag, orders them by their dependencies, skips the run-once scripts already recorded, and calls each with the environment, its extensions applied by `withEnvironment`.
4. **Transactions.** Every transaction an extension sends goes through the environment's broadcast path: signed by the `from`'s signer, or impersonated, or handed to the unknown-signer flow; recorded as pending before the wait and as captured once sent; its deployment saved once mined.

## hardhat-deploy

hardhat-deploy (`packages/hardhat-deploy`) is a thin layer over `@rocketh/node`:

- **The `deploy` task** compiles, takes the hardhat network's connection (or creates the fork for `HARDHAT_FORK`), and calls `loadAndExecuteDeploymentsFromFiles` with that provider, the network's name as the environment, and the connection in `extra`. Its options are listed on [The `hardhat deploy` task](/hardhat-deploy/deploy-task/).
- **The config hook** reads `generateTypedArtifacts` from `hardhat.config.ts`, and **the solidity hook** writes the typed artifacts and ABIs after each compilation, see [Typed artifacts](/hardhat-deploy/typed-artifacts/).
- **`hardhat-deploy/helpers`** holds `setupHardhatDeploy` (`loadEnvironmentFromHardhat`, for scripts) and the network helpers (`addNetworksFromEnv`, `addNetworksFromKnownList`, `addForkConfiguration`), see [Networks and accounts from the environment](/hardhat-deploy/networks/).
- **`hardhat-deploy/extensions`** is hardhat-deploy as a rocketh extension: `hardhatConnection`, which gives deploy scripts `env.hardhatConnection` (the connection in `extra`, or `undefined`). The throwing form, `getHardhatConnection(env)`, is on the main export, which cannot be spread into `extensions` since it also exports the plugin; see [The Hardhat connection](/hardhat-deploy/scripts/#the-hardhat-connection).
- **`hardhat-deploy init`** copies a project template, see [Get started with hardhat-deploy](/hardhat-deploy/getting-started/).
