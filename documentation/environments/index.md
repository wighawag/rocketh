# Environments and chains

An **environment** is where a run deploys: a name (`sepolia`, `localhost`, `staging`) with its own deployment records, its own named accounts and its own data. A **chain** is the network underneath it, keyed by chain id. Several environments can share one chain, which is how a project keeps a staging and a production deployment on the same network, so the two are configured separately, in `environments` and `chains` of `rocketh/config.ts`.

## Environments

An environment is explicit: you name it and say which chain it is. Declare it under `environments` in `rocketh/config.ts`:

```typescript
export const config = {
	environments: {
		sepolia: {chain: 11155111},
		// a second environment on the SAME chain, with its own deployments folder
		sepolia2: {chain: 11155111},
	},
	data: {},
} as const satisfies UserConfig;
```

Then `rocketh -e sepolia` (or `hardhat deploy --network sepolia`) deploys to it and records the deployments under `deployments/sepolia`. Environments are never invented for you from a list of known chain names: an auto-generated environment would carry a public RPC endpoint nobody chose, and those go stale and get serialized into frontend builds. See [ADR 0010](https://github.com/wighawag/rocketh/blob/main/docs/adr/0010-environments-stay-explicit.md).

Under hardhat-deploy the environment is the hardhat network you deploy to (`--network sepolia` is the environment `sepolia`), and its endpoint and keys come from `hardhat.config.ts`. Declaring the environment in `rocketh/config.ts` too is still what ties it to a chain id, which matters on a [fork](../fork-runs/#what-a-fork-run-inherits-and-the-one-condition).

## Chains

Chain-level settings live separately, under `chains`, keyed by chain id, because several environments can share one chain:

```typescript
export const config = {
	environments: {sepolia: {chain: 11155111}},
	chains: {
		11155111: {
			rpcUrl: 'https://my-own-node.example/rpc',
			confirmationsRequired: 2,
		},
	},
	data: {},
} as const satisfies UserConfig;
```

An endpoint whose URL carries an API key is a secret, like a private key: read it from the environment instead of writing it in the file (`rpcUrl: process.env.SEPOLIA_RPC_URL`), and keep the value in `.env.local`, which the `rocketh` command loads before it reads the config ([CLI](../reference/cli/)).

When you run through `@rocketh/node` (the `rocketh` CLI, or `loadAndExecuteDeploymentsFromFiles`), chain METADATA for a publicly known chain is filled in for you from viem's chain registry: name, native currency, block explorers, multicall3, and so on. Anything you put in `chains[id]` is layered on top field by field, so overriding one value does not mean restating the whole chain.

One deliberate exception: viem's public default RPC (for example `https://<id>.rpc.thirdweb.com`) is NOT copied into the serialized `info.rpcUrls`. Such an endpoint is rate-limited and can stop answering, and `info` is what `@rocketh/export` writes into frontend builds and "add network" data, so a dead public URL would end up shipped in an app. Deploying still falls back to it, so zero-config runs keep working. Set `includeDefaultRPCUrlsInChainInfos: true` at the top level if you actually want it serialized.

What a chain entry holds, besides the endpoint: `tags` (see below), the number of confirmations to wait for (`confirmationsRequired`), the polling interval in seconds (`pollingInterval`), the deterministic-deployment factories (`deterministicDeployment`, see [Deterministic addresses](../deterministic-addresses/#the-factories)), the unknown-signer policy (`onUnknownSigner`), impersonation (`autoImpersonate`, `fundImpersonatedAccounts`), `autoMine` for a dev node that needs telling to mine, and free-form `properties`. Every key is listed in [Configuration](../reference/configuration/#chains).

## Tags

`env.tags` is the set of tags of the run's chain, read by scripts to decide what to do (`if (env.tags['mainnet']) ...`). They come from `chains[<id>].tags`. With none declared, a chain whose chain information marks it as a testnet gets `testnet`, and any other chain gets no tag at all: there is no built-in `live` or `local` tag, so declare the ones your scripts read. Declaring `tags` replaces the default, so list `testnet` again if a script relies on it.

```typescript
export const config = {
	chains: {
		1: {tags: ['mainnet', 'live']},
		11155111: {tags: ['testnet', 'live']},
		31337: {tags: ['local']},
	},
	data: {},
} as const satisfies UserConfig;
```

## Overriding the chain for one environment: `overrides`

Anything a chain entry says (except `info`) can be said again for one environment, in `environments.<name>.overrides`, and it wins for that environment only. A local node that needs mining, a staging deployment with its own endpoint, a production environment tagged differently:

```typescript
export const config = {
	environments: {
		localhost: {chain: 31337, overrides: {autoMine: true}},
		staging: {chain: 11155111, overrides: {rpcUrl: 'https://staging-node.example/rpc', confirmationsRequired: 1}},
	},
	data: {},
} as const satisfies UserConfig;
```

The order is `chains[<id>]`, then `overrides`, most specific last, and `properties` are merged key by key rather than replaced. A fork run adds a third layer, `whenForked`, described in [Rehearse on a fork](../fork-runs/#saying-what-differs-whenforked).

## Several environments on one chain

Because the deployment records, named accounts and data key on the environment NAME, two environments on one chain are two independent deployments. Give them the chain's tags, or tags of their own, through `overrides.tags`:

```typescript
export const config = {
	environments: {
		alpha1: {chain: 8453, overrides: {tags: ['mainnet']}},
		base: {chain: 8453, overrides: {tags: ['mainnet']}},
	},
	data: {},
} as const satisfies UserConfig;
```

`rocketh -e alpha1` and `rocketh -e base` then deploy to Base with separate `deployments/alpha1` and `deployments/base` folders, and a script reads `env.name` where the two must differ and `env.tags['mainnet']` where they must not.

## Per-environment data (`data`)

`data` holds the values your deploy scripts read and that differ per environment: an address of a contract deployed by someone else, a duration, a policy. Its shape is `{[key]: {[environment]: value}}`, and a script reads the resolved value as `env.data.<key>`:

```typescript
export const config = {
	data: {
		Game: {
			default: {commitPhaseDuration: 82800, revealPhaseDuration: 3600},
			localhost: {commitPhaseDuration: 60, revealPhaseDuration: 30},
		},
		usdc: {
			mainnet: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
			sepolia: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
		},
	},
} as const satisfies UserConfig;
```

```typescript
export default deployScript(
	async ({deploy, data, namedAccounts}) => {
		const {commitPhaseDuration, revealPhaseDuration} = data.Game;
		// ...
	},
	{tags: ['Game']},
);
```

Each key is resolved on its own, with the first of: an entry under the environment's name, an entry under its chain id, the `default` entry. A key with none of them resolves to `undefined`, without an error, which is the difference from a named account. Prefer the environment name over the chain id: a chain id entry also matches every other environment on that chain, and on a fork it follows the id the node reports, which is 31337 on a hardhat fork (see [Which chain id?](../fork-runs/#which-chain-id-two-questions-two-answers)).

Because the shape is per key, a program that builds a config for an extra environment (an in-browser deployment, say) adds its entry to each key it changes rather than replacing `data`: `{...data, Game: {...data.Game, myEnvironment: value}}`.

## Chain properties (`properties`)

`properties` is free-form JSON about the chain that rocketh does not interpret: the average block time, how many blocks your app treats as final, the gas price a client should expect. It is copied into `env.network.chain.properties` during a run and into the `chain` of every [export](../exporting-and-verifying/#chain-properties-in-the-export), which is how a frontend reads it.

```typescript
export const config = {
	chains: {
		8453: {properties: {averageBlockTimeMs: 2000, finality: 12}},
	},
	defaultChainProperties: {averageBlockTimeMs: 12000, finality: 12},
	data: {},
} as const satisfies UserConfig;
```

A chain with no `properties` takes `defaultChainProperties`. `overrides.properties` (and `whenForked.properties` on a fork) are merged on top of them, key by key.

## Local development chains

The chain ids 31337 (hardhat and anvil) and 1337 are treated as your own machine:

- their deployment records are deleted when the chain's genesis changed, which is what a restarted dev node looks like (`deleteDeploymentsIfDifferentGenesisHash`, on by default for these ids, configurable on any chain);
- an environment that declares one of them but finds a node reporting another id (an `anvil --fork-url` serving as `localhost`) gets a warning and continues with the node's id, where any other environment is refused.

`autoMine: true`, on the chain or in the environment's `overrides` as in the `localhost` example above, makes rocketh send `evm_mine` after each transaction it broadcasts, for a node that mines on an interval and would otherwise keep the run waiting. A node that mines every transaction by itself does not need it, and a node that has no `evm_mine` at all (an execution-only EVM in a browser) fails the run with it, so leave it off there.

## Declaring a chain rocketh does not know

For a chain outside viem's registry (a private network, an in-house devnet, a brand-new rollup) there is no metadata to fill in, so describe it yourself with an `info` block:

```typescript
export const config = {
	environments: {
		privatenet: {chain: 424242},
	},
	chains: {
		424242: {
			rpcUrl: 'http://localhost:9999',
			info: {
				id: 424242,
				name: 'My Private Chain',
				nativeCurrency: {name: 'Custom', symbol: 'CUS', decimals: 18},
				rpcUrls: {default: {http: ['http://localhost:9999']}},
				testnet: true,
			},
		},
	},
	data: {},
} as const satisfies UserConfig;
```

`info` is optional. Leave it out and rocketh warns

```
chain with id 424242 has no public info: falling back to placeholder metadata (name 'unknown', symbol 'UNKNOWN')
```

and then carries on with that placeholder, so a deploy still works. It is only worth fixing when the metadata is actually consumed: `@rocketh/export` writes it into frontend exports, and `info.testnet` gives the chain a `testnet` tag your deploy scripts can branch on. For a throwaway local chain, the placeholder is usually fine.

## Chains without EIP-1559

By default every transaction rocketh builds is an EIP-1559 (type 2) transaction. Some chains reject those. Declare such a chain with `transactionType: 'legacy'` and rocketh sends legacy (type 0) transactions there instead, so the same deploy scripts run unchanged:

```typescript
export const config = {
	environments: {oldchain: {chain: 424242}},
	chains: {
		424242: {
			rpcUrl: 'https://my-node.example/rpc',
			transactionType: 'legacy',
		},
	},
	data: {},
} as const satisfies UserConfig;
```

`transactionType` accepts `'eip1559'` (the default, used when the key is absent) and `'legacy'`. Like the other chain settings it can also be set per environment in `overrides`, and on a fork it follows the network being forked.

It applies to every transaction `deploy`, `execute` and `tx` build, including the ones rocketh sends by itself to bootstrap deterministic deployment (funding the create2 factory deployer, deploying the create3 factory). The canonical create2 factory's own deployment is a pre-signed legacy transaction, so it needs nothing. The gas price is left to whoever signs: the node for an account it holds, and `eth_gasPrice` for a `privateKey` account, which rocketh signs locally.

It is only a default. A run can override it for every call that sets no fee option (see [Fees for a whole run](#fees-for-a-whole-run)), and a single call can decide for itself on any chain:

- `gasPrice` (or `type: 'legacy'`) sends that call as a legacy transaction carrying it.
- `maxFeePerGas` / `maxPriorityFeePerGas` (or `type: 'eip1559'`) send it as EIP-1559, even on a chain declared legacy.

```typescript
await deploy('Registry', {account: deployer, artifact: artifacts.Registry, args: [], gasPrice: 2_000_000_000n});
await execute(registry, {account: deployer, functionName: 'setValue', args: [42n], gasPrice: 2_000_000_000n});
```

Contradictory options are refused rather than resolved one way or the other: `gasPrice` together with `maxFeePerGas` or `maxPriorityFeePerGas`, `gasPrice` with `type: 'eip1559'`, an EIP-1559 fee with `type: 'legacy'`, and an `accessList` on a legacy transaction (it cannot carry one). Any `type` other than `'eip1559'` and `'legacy'` is refused too.

## Fees for a whole run

A deploy command can set the fees of every transaction its run builds, without editing a script. There are three run-level values, all optional, all integers in wei:

| Value                  | `rocketh` CLI                                          | `hardhat deploy`             | Sends             |
| ---------------------- | ------------------------------------------------------ | ---------------------------- | ----------------- |
| `gasPrice`             | `--gas-price` (or v1's `--gasprice`)                   | `--gas-price`                | legacy (type 0)   |
| `maxFeePerGas`         | `--max-fee-per-gas` (or v1's `--maxfee`)               | `--max-fee-per-gas`          | EIP-1559 (type 2) |
| `maxPriorityFeePerGas` | `--max-priority-fee-per-gas` (or v1's `--priorityfee`) | `--max-priority-fee-per-gas` | EIP-1559 (type 2) |

::: code-group

```bash [hardhat-deploy]
npx hardhat deploy --network mainnet --max-fee-per-gas 30000000000 --max-priority-fee-per-gas 1000000000
```

```bash [rocketh CLI]
npx rocketh -e mainnet --max-fee-per-gas 30000000000 --max-priority-fee-per-gas 1000000000
```

:::

Programmatically, they are the `gasPrice`, `maxFeePerGas` and `maxPriorityFeePerGas` keys of the execution parameters, as `bigint`s:

```typescript
await loadAndExecuteDeploymentsFromFiles({environment: 'mainnet', gasPrice: 2_000_000_000n});
```

The precedence, highest first:

1. **The call's own fee options.** A call that states ANY of `type`, `gasPrice`, `maxFeePerGas` or `maxPriorityFeePerGas` decides its whole fee set, and none of the run-level values apply to it. There is no per-field merge: a call passing only `maxPriorityFeePerGas` does not pick up a run-level `maxFeePerGas`.
2. **The run-level values**, applied exactly as if the call had passed them. A run-level `gasPrice` sends a legacy transaction on any chain. A run-level `maxFeePerGas` or `maxPriorityFeePerGas` sends EIP-1559 even on a chain declared `transactionType: 'legacy'`, like the per-call fields. Either EIP-1559 value may be given alone; whoever signs fills the other.
3. **The chain's `transactionType`** (above).

They reach every transaction `deploy`, `execute` and `tx` build, so proxies, diamonds and routers inherit them, as do the transactions rocketh sends by itself to bootstrap deterministic deployment. Once set, the run's values are readable as `env.network.gasPrice`, `env.network.maxFeePerGas` and `env.network.maxPriorityFeePerGas` (absent when not set; they are the run's settings, not the chain's current price).

Refused before the run starts, with a message naming both values: a run-level `gasPrice` together with `maxFeePerGas` or `maxPriorityFeePerGas` (hardhat-deploy v1 silently preferred the gas price). A value that is not a non-negative integer is refused too: on the command line only decimal digits are accepted, so `2gwei`, `1e9` or `0x10` are errors rather than guesses. With none of the three set, a run sends exactly what it sent before.

Note that a call carrying an `accessList` but no fee option takes the run-level values, so under a run-level `gasPrice` it is refused (a legacy transaction cannot carry an access list); give that call `type: 'eip1559'` to keep it out of the run-level values.
