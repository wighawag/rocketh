# Deployment records

Every contract a run deploys is recorded: a JSON file per deployment, per environment, in `deployments/<environment>/`. The records are what make a re-run converge (`deploy` compares against them), what `env.get('Name')` reads, and what `@rocketh/export`, `@rocketh/verifier` and `@rocketh/doc` turn into frontend files, verified source and documentation. Commit them: they are your project's memory of what is deployed where.

## The folder

```text
deployments/
  sepolia/
    .chain                       the chain id and genesis hash this folder belongs to
    .migrations.json             the ids of run-once scripts that completed (see Running once)
    GreetingsRegistry.json       one record per deployment name
    GreetingsRegistry_Implementation.json
    GreetingsRegistry_Proxy.json
  sepolia2/                      a second environment on the same chain: its own records
    .chain
    GreetingsRegistry.json
```

The folder is `deployments` by default: set `deployments` in `rocketh/config.ts`, or pass `-d, --deployments <folder>` to the `rocketh` CLI and to `rocketh-export`, `rocketh-verify` and `rocketh-doc`.

- **`.chain`** holds `{"chainId": "11155111", "genesisHash": "0x..."}`. A run refuses to read a folder whose chain id or genesis hash is not the node's, so renaming a network to point at another chain cannot make rocketh believe a contract is deployed when it is not, and `rocketh-export` knows the chain without connecting to it. A hardhat-deploy v1 `.chainId` file (the id alone) is accepted and replaced by a `.chain` file on the next run. On a local development chain (31337, 1337) a different genesis hash means the node was restarted, and the folder's records are deleted instead (`deleteDeploymentsIfDifferentGenesisHash`, see [Environments and chains](../environments/#local-development-chains)).
- **`.migrations.json`** is the run-once record, see [Running once, and running last](../script-lifecycle/#where-the-record-lives).
- **`.pending_transactions.json`** exists only while a transaction is in flight: rocketh writes it before waiting for a deployment or a call and deletes it once mined, so a run that was interrupted adopts the transaction on the next run instead of sending it again. Do not build anything on it.
- **Every other `.json` file** is a deployment record, named after the deployment.

A [fork run](../fork-runs/#deployment-records) reads the forked network's folder and writes nothing back. A run against an in-memory network (hardhat's default network, `memory`) keeps its records in memory only.

## What a record holds

The record format is published: the fields below are not removed, renamed or given another meaning in any 0.x release ([ADR 0015](https://github.com/wighawag/rocketh/blob/main/docs/adr/0015-the-deployment-record-is-a-published-format.md), which also lists the code that writes each one). A tool that reads the files can rely on them.

| Field                                                                                                                              | Holds                                                                                              | Present                    |
| ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------- |
| `address`                                                                                                                          | where the contract is                                                                              | always                     |
| `abi`                                                                                                                              | its ABI; on a proxy, a diamond or a router record, the merged ABI callers use                      | always                     |
| `bytecode`, `metadata`                                                                                                             | creation code and solc metadata of what was deployed (on a proxy's record, the implementation's)   | always                     |
| `argsData`                                                                                                                         | the ABI-encoded constructor arguments                                                              | always                     |
| `deployedBytecode`                                                                                                                 | the runtime code from the artifact                                                                 | when the artifact has it   |
| `transaction` `{hash, origin?, nonce?}`                                                                                            | the deployment transaction rocketh saw land                                                        | when one was observed      |
| `receipt` `{blockHash, blockNumber, transactionIndex}`                                                                             | where it landed (an export's `startBlock`)                                                         | with `transaction`         |
| `numDeployments`                                                                                                                   | how many times the record changed (proxy upgrades included); `upgradeIndex` reads it               | when greater than 1        |
| `libraries`                                                                                                                        | the library addresses linked into the bytecode                                                     | when libraries were linked |
| `linkedData`                                                                                                                       | the data you attached to the deployment (public: it reaches every export)                          | when given                 |
| `implementation`                                                                                                                   | on a proxy's `<name>` record: the implementation the record describes, as of the run that wrote it | on proxy records           |
| `facets`                                                                                                                           | on a diamond's record: the facets and selectors it was cut to                                      | on diamond records         |
| `contractName`, `sourceName`, `devdoc`, `userdoc`, `storageLayout`, `linkReferences`, `deployedLinkReferences`, `evm.gasEstimates` | copied from the artifact                                                                           | when the artifact has them |

A record asserts what rocketh observed when it wrote it, not the chain at the time you read it ([ADR 0012](https://github.com/wighawag/rocketh/blob/main/docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md)). The clearest case is `implementation`: an upgrade a Safe has yet to execute leaves it on the old implementation. Read the chain when you need the live value.

A field that is not in the table (one an extension adds with `env.save`, or one an artifact happens to carry) is promised nothing. The TypeScript type is `Deployment` in [`@rocketh/core/types`](https://github.com/wighawag/rocketh/blob/main/packages/rocketh-core/src/types.ts); the table, not the type, is the promise.

## Reading records

In a deploy script, a test or a script, through the environment:

```typescript
const registry = env.get<typeof artifacts.GreetingsRegistry.abi>('GreetingsRegistry'); // throws when absent
const maybe = env.getOrNull('Treasury'); // null when absent
const all = env.deployments; // every record of the environment, by name
```

Deployments are untyped on purpose (what is on chain can differ from your current artifacts), so give `get` the ABI type you expect. Outside a run, `loadDeploymentsFromFiles` from `@rocketh/node` reads a folder, and a frontend reads an [export](../exporting-and-verifying/#exporting-deployments) rather than the records themselves.

## Saving a record yourself

`env.save(name, deployment)` writes a record, which is how an extension (or a script) records a contract it deployed by other means. Each save counts as a change and increments `numDeployments`, with two opt-outs:

- `{considerItAsFreshDeployment: true}` records a count of 1, for something deployed exactly once.
- `{keepNumDeployments: true}` keeps the stored count, for a rewrite that only adds a field the record was missing while nothing changed on chain.

The two cannot be combined.

## Importing deployments made elsewhere

A project that already has contracts deployed, by hand or by another tool, can hand them to rocketh by writing the records. A project coming from hardhat-deploy v1 has nothing to do: v2 reads v1's folders (what changed in the fields is listed in [the capability map](/hardhat-deploy/migration/#the-deployment-files)).

For each environment, create `deployments/<environment>/.chain` with the chain id (in decimal, as a string) and the genesis hash (the hash of block 0). The genesis hash may be left out: the next run against the chain fills it in.

```json
{
	"chainId": "11155111",
	"genesisHash": "0x25a5cc106eea7138acab33231d7160d69cb777ee0c2c553fcddf5138993e6dd9"
}
```

Then one `<Name>.json` per contract. `address`, `abi`, `bytecode`, `argsData` and `metadata` are what a re-run compares against and what verification submits, so provide them when you have them; the rest of the table is optional. With the records in place, a deploy script that deploys the same contract with the same arguments finds it deployed and does nothing.
