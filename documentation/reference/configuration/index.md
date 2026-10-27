# Configuration

Every key of `rocketh/config.ts`. The file exports `config` (and, by convention, the `extensions` your scripts use); `@rocketh/node` reads `rocketh.ts` or `rocketh/config.ts` from the current directory (or a `.js` one), and refuses to start when it finds both a TypeScript and a JavaScript configuration. The types are `UserConfig`, `ChainUserConfig` and `DeploymentEnvironmentConfig` in [`packages/rocketh-core/src/types.ts`](https://github.com/wighawag/rocketh/blob/main/packages/rocketh-core/src/types.ts), which this page mirrors.

```typescript
import type {UserConfig} from 'rocketh/types';

export const config = {
	accounts: {deployer: {default: 0}},
	environments: {sepolia: {chain: 11155111}},
	chains: {11155111: {confirmationsRequired: 2}},
	data: {},
} as const satisfies UserConfig;
```

`as const satisfies UserConfig` keeps the literal types, which is what types `env.namedAccounts` and `env.data` in your scripts. Under hardhat-deploy, the Hardhat side (networks, compilers, typed artifacts) is in `hardhat.config.ts`, see [Get started with hardhat-deploy](/hardhat-deploy/getting-started/).

## Top level (`UserConfig`)

| Key                                 | Type                                                      | Default                        | Meaning                                                                                                                                                                                                       |
| ----------------------------------- | --------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accounts`                          | `{[name]: definition}`                                    | none                           | The named accounts. A definition is an index, an address, a private key, `'<protocol>:<data>'`, another name, or a per-network map of those (`null` for absent). See [Named accounts](../../named-accounts/). |
| `signerProtocols`                   | `{[protocol]: SignerProtocolFunction}`                    | none                           | The functions that resolve `'<protocol>:<data>'` accounts; `privateKey` from `@rocketh/signer` is the usual one.                                                                                              |
| `environments`                      | `{[name]: environment}`                                   | none                           | The environments, below.                                                                                                                                                                                      |
| `chains`                            | `{[chainId]: chain}`                                      | viem's registry                | Per-chain settings, below. Under `@rocketh/node`, a chain viem knows starts from its public information, and yours is layered on top.                                                                         |
| `data`                              | `{[key]: {[environment or chainId or 'default']: value}}` | none                           | Values your scripts read as `env.data.<key>`, resolved per environment. See [Per-environment data](../../environments/#per-environment-data-data).                                                            |
| `scripts`                           | `string` or `string[]`                                    | `'deploy'`                     | The folder(s) of deploy scripts.                                                                                                                                                                              |
| `deployments`                       | `string`                                                  | `'deployments'`                | The folder of deployment records.                                                                                                                                                                             |
| `onUnknownSigner`                   | `'throw'`, `'ask'` or `'auto'`                            | `'auto'`                       | The policy for a transaction from an account rocketh cannot sign for, on every chain; a chain's own value and the run's override it. See [Unknown signers](../../unknown-signers/).                           |
| `defaultPollingInterval`            | `number` (seconds)                                        | `1`                            | How often to poll for a transaction, on chains that set no `pollingInterval`.                                                                                                                                 |
| `defaultChainProperties`            | JSON                                                      | `{}`                           | The `properties` of chains that set none.                                                                                                                                                                     |
| `retry`                             | `{maxRetries?, delay?}`                                   | `{maxRetries: 3, delay: 1000}` | How many times `read` retries a call to a recorded contract that returned no data (a node that has not caught up with the deployment yet), and the wait between tries in milliseconds.                        |
| `includeDefaultRPCUrlsInChainInfos` | `boolean`                                                 | `false`                        | Copy viem's public RPC endpoint into the serialized chain info (and so into exports). Deploying falls back to it either way.                                                                                  |

## Environments (`environments.<name>`)

| Key          | Type                      | Meaning                                                                                                                                                                                         |
| ------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chain`      | `number`                  | The chain id. Checked against the node off a fork; on a fork, the id of the network being simulated. See [Rehearse on a fork](../../fork-runs/#what-a-fork-run-inherits-and-the-one-condition). |
| `scripts`    | `string` or `string[]`    | Deploy script folder(s) for this environment, replacing the top-level `scripts`.                                                                                                                |
| `overrides`  | chain settings, no `info` | What differs from `chains[<chain>]` for this environment; applied on top of it.                                                                                                                 |
| `whenForked` | chain settings, no `info` | What differs when the run is a fork of this environment; applied on top of `overrides`, on a fork only. See [`whenForked`](../../fork-runs/#saying-what-differs-whenforked).                    |

An environment is never invented from a chain name: a name the config does not declare has no chain id, and the run stops unless the node can be asked (a provider, or a fork).

## Chains (`chains.<id>`, and `overrides` / `whenForked`) {#chains}

| Key                                       | Type                                    | Default                                | Meaning                                                                                                                                     |
| ----------------------------------------- | --------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `rpcUrl`                                  | `string`                                | the chain info's first URL             | The endpoint. Never dialled by a fork run when it comes from `overrides`.                                                                   |
| `info`                                    | `ChainInfo`                             | viem's, or a placeholder               | The chain's public information (name, currency, explorers, `testnet`). Needed for a chain viem does not know. Not allowed in `overrides`.   |
| `tags`                                    | `string[]`                              | `['testnet']` for a testnet, else none | `env.tags`. Declaring them replaces the default. See [Tags](../../environments/#tags).                                                      |
| `properties`                              | JSON                                    | `defaultChainProperties`               | Free-form chain data, exported with the chain. Merged key by key across `chains`, `overrides` and `whenForked`.                             |
| `confirmationsRequired`                   | `number`                                | none                                   | Confirmations to wait for after each transaction.                                                                                           |
| `pollingInterval`                         | `number` (seconds)                      | `defaultPollingInterval`               | How often to poll for a transaction.                                                                                                        |
| `transactionType`                         | `'eip1559'` or `'legacy'`               | `'eip1559'`                            | What to send when a call sets no fee option. See [Chains without EIP-1559](../../environments/#chains-without-eip-1559).                    |
| `deterministicDeployment`                 | create2 info, or `{create2?, create3?}` | the well-known factories               | The factories of deterministic deployments. See [The factories](../../deterministic-addresses/#the-factories).                              |
| `autoMine`                                | `boolean`                               | `false`                                | Send `evm_mine` after each transaction, for a node that does not mine on its own.                                                           |
| `autoImpersonate`                         | `boolean`                               | on for a fork, off otherwise           | Impersonate named accounts the node would otherwise have to sign for. See [Impersonation](../../fork-runs/#impersonation-is-on-by-default). |
| `fundImpersonatedAccounts`                | `boolean`                               | `false`                                | Lend an impersonated account the gas of each of its transactions.                                                                           |
| `onUnknownSigner`                         | `'throw'`, `'ask'` or `'auto'`          | the top-level value                    | The unknown-signer policy on this chain.                                                                                                    |
| `deleteDeploymentsIfDifferentGenesisHash` | `boolean`                               | `true` for 31337 and 1337              | Delete the environment's records when the chain's genesis changed (a restarted dev node), instead of refusing to read them.                 |

## Run parameters

What a command line sets for one run, the programmatic entry points (`loadAndExecuteDeploymentsFromFiles`, `loadEnvironmentFromFiles`, `@rocketh/web`'s loaders) take as `ExecutionParams`:

| Key                                                       | Meaning                                                                                                                 |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `environment`                                             | The environment's name, or `{fork: '<name>', chainId?}` for a fork run. Without it, the in-memory environment `memory`. |
| `provider`                                                | An EIP-1193 provider to use instead of the chain's `rpcUrl` (a Hardhat connection, a browser wallet, an in-tab EVM).    |
| `tags`                                                    | `string[]`: only the scripts carrying one of these, with their dependencies.                                            |
| `saveDeployments`                                         | Write the records. Defaults to `true`, except on a fork and for an in-memory environment given a provider.              |
| `reset`                                                   | Delete the environment's records first.                                                                                 |
| `askBeforeProceeding`                                     | Ask for confirmation before the run.                                                                                    |
| `reportGasUse`                                            | Print the gas used.                                                                                                     |
| `onUnknownSigner`                                         | The unknown-signer policy for the run, over the config's.                                                               |
| `autoImpersonate`, `fundImpersonatedAccounts`, `autoMine` | The chain settings of the same name, for the run.                                                                       |
| `gasPrice`, `maxFeePerGas`, `maxPriorityFeePerGas`        | Run-level fees in wei (`bigint`). See [Fees for a whole run](../../environments/#fees-for-a-whole-run).                 |
| `defaultPollingInterval`                                  | The polling interval, in seconds, over the config's.                                                                    |
| `config`                                                  | `{scripts?, deployments?}`, over the config's folders.                                                                  |
| `extra`                                                   | Anything, exposed to scripts as `env.extra` (hardhat-deploy puts its connection there).                                 |

`@rocketh/node` adds `writeTransactions` (a file path), the programmatic form of `--write-transactions`.
