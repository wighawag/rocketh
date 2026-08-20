# @rocketh/node

The Node.js runtime for rocketh: the `rocketh` CLI that runs your deploy scripts, and the functions that build an environment from files on disk.

rocketh's core is deliberately filesystem-free so it can run in a browser. This package is the **executor adapter** that supplies the filesystem: it reads your config, loads deploy scripts from a folder, and writes deployment records back out. Most projects install it as the thing that actually runs a deployment.

## Installation

```bash
# Using pnpm
pnpm add -D @rocketh/node

# Using npm
npm install --save-dev @rocketh/node

# Using yarn
yarn add -D @rocketh/node
```

It expects `rocketh` as a peer dependency.

## CLI

The package provides the `rocketh` command, which executes deploy scripts and stores the resulting deployments.

```bash
# run every deploy script against the "sepolia" environment
rocketh -e sepolia

# only the scripts tagged "Token"
rocketh -e sepolia --tags Token

# start from scratch: delete existing deployment records first
rocketh -e localhost --reset
```

### Options

| Option                        | Description                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `-e, --environment <value>`   | **(Required)** Environment to use.                                                                      |
| `-s, --scripts <value>`       | Folder containing the deploy scripts to execute.                                                        |
| `-t, --tags <value>`          | Comma-separated list of tags to execute.                                                                |
| `-d, --deployments <value>`   | Folder where deployments are saved.                                                                     |
| `--save-deployments`          | Save deployments.                                                                                       |
| `--reset`                     | Delete all deployments first.                                                                           |
| `--skip-gas-report`           | Skip the gas report.                                                                                    |
| `--log-level <value>`         | Set the log level.                                                                                      |
| `--skip-prompts`              | Skip any prompts. Also forces `--on-unknown-signer throw`.                                              |
| `--on-unknown-signer <value>` | What to do when a transaction's `from` cannot be signed for: `throw`, `ask` or `auto` (default `auto`). |

### Unattended runs

In CI, `--skip-prompts` is the flag that matters. It guarantees nothing waits for a human, and forces the unknown-signer policy to `throw` so a transaction rocketh cannot sign for fails the run instead of hanging it.

Note that rocketh does not hang when there is no TTY even without the flag: the `ask` unknown-signer policy degrades to `throw`, and a confirmation prompt fails with a message saying stdin is not a terminal. `--skip-prompts` makes the intent explicit rather than incidental.

Capability is a ceiling, not a default: asking for `ask` only chooses among what the run can already do, so a script that requests it still runs unattended in CI.

## Programmatic API

### `setupEnvironmentFromFiles(extensions)`

The usual entry point. Bind your extensions and account/data types once, and get back file-backed environment loaders to use in tests and scripts:

```typescript
// rocketh/environment.ts
import {type Accounts, type Data, type Extensions, extensions} from './config.js';
import {setupEnvironmentFromFiles} from '@rocketh/node';

const {loadAndExecuteDeploymentsFromFiles} = setupEnvironmentFromFiles<Extensions, Accounts, Data>(extensions);

export {loadAndExecuteDeploymentsFromFiles};
```

Then in a test:

```typescript
const {deployments, accounts} = await loadAndExecuteDeploymentsFromFiles({provider, network: 'localhost'});
```

### Other exports

| Export                               | Purpose                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `setupEnvironmentFromFiles`          | Bind extensions/types and get the file-backed loaders below.                               |
| `loadEnvironmentFromFiles`           | Build an environment from config and existing deployment records, without running scripts. |
| `loadAndExecuteDeploymentsFromFiles` | Build the environment **and** run the deploy scripts.                                      |
| `loadDeploymentsFromFiles`           | Read deployment records only.                                                              |
| `readAndResolveConfig`               | Read `rocketh/config.ts` and resolve it, applying overrides.                               |
| `mergeChainConfig`                   | Merge chain configuration.                                                                 |
| `setupDeployScripts`                 | Re-exported from `rocketh` for convenience.                                                |
| `chainByCanonicalName`               | Look up a chain by its canonical name.                                                     |

Types from `@rocketh/core` are re-exported, so `import type {Environment} from '@rocketh/node'` works.

## Running in a browser instead

If your deploy scripts need to run in a browser, use [`@rocketh/web`](https://www.npmjs.com/package/@rocketh/web) as the executor adapter. Deployment logic stays the same; only the adapter changes.

## Related packages

- [`rocketh`](https://www.npmjs.com/package/rocketh) - core environment and executor
- [`@rocketh/web`](https://www.npmjs.com/package/@rocketh/web) - the browser executor adapter
- [`@rocketh/deploy`](https://www.npmjs.com/package/@rocketh/deploy) - the deployment function your scripts call
- [`@rocketh/export`](https://www.npmjs.com/package/@rocketh/export) - export deployments for a frontend
- [`@rocketh/verifier`](https://www.npmjs.com/package/@rocketh/verifier) - verify deployed contracts on block explorers

For full documentation, visit [rocketh.dev](https://rocketh.dev).

For hardhat-deploy documentation, see [rocketh.dev/hardhat-deploy/](https://rocketh.dev/hardhat-deploy/).
