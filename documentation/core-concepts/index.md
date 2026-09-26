# Core Concepts

## Deployments and Environments

A deployment in rocketh represents a deployed contract on a specific environment.

An environment is a named network. You can thus have multiple environment for the same chain.

For example you can have sepolia environment and the sepolia2 environment both pointing to the same chain but having different deployments.

Each deployment includes:

- Contract address
- ABI
- Bytecode
- Constructor arguments
- Transaction details
- Metadata for verification

Deployments are saved to disk in the `deployments/<environment>` folder, allowing them to be tracked in version control and reused.

## Environments and Chains

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

Then `pnpm rocketh -e sepolia` (or whichever runner you use) deploys to it and records the deployments under `deployments/sepolia`. Environments are never invented for you from a list of known chain names: an auto-generated environment would carry a public RPC endpoint nobody chose, and those go stale and get serialized into frontend builds. See `docs/adr/0010-environments-stay-explicit.md`.

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

When you run through `@rocketh/node` (the `rocketh` CLI, or `loadAndExecuteDeploymentsFromFiles`), chain METADATA for a publicly known chain is filled in for you from viem's chain registry: name, native currency, block explorers, multicall3, and so on. Anything you put in `chains[id]` is layered on top field by field, so overriding one value does not mean restating the whole chain.

One deliberate exception: viem's public default RPC (for example `https://<id>.rpc.thirdweb.com`) is NOT copied into the serialized `info.rpcUrls`. Such an endpoint is rate-limited and can stop answering, and `info` is what `@rocketh/export` writes into frontend builds and "add network" data, so a dead public URL would end up shipped in an app. Deploying still falls back to it, so zero-config runs keep working. Set `includeDefaultRPCUrlsInChainInfos: true` at the top level if you actually want it serialized.

### Declaring a chain rocketh does not know

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

### Chains without EIP-1559

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

It is only a default. A single call can decide for itself on any chain:

- `gasPrice` (or `type: 'legacy'`) sends that call as a legacy transaction carrying it.
- `maxFeePerGas` / `maxPriorityFeePerGas` (or `type: 'eip1559'`) send it as EIP-1559, even on a chain declared legacy.

```typescript
await deploy('Registry', {account: deployer, artifact: artifacts.Registry, args: [], gasPrice: 2_000_000_000n});
await execute(registry, {account: deployer, functionName: 'setValue', args: [42n], gasPrice: 2_000_000_000n});
```

Contradictory options are refused rather than resolved one way or the other: `gasPrice` together with `maxFeePerGas` or `maxPriorityFeePerGas`, `gasPrice` with `type: 'eip1559'`, an EIP-1559 fee with `type: 'legacy'`, and an `accessList` on a legacy transaction (it cannot carry one). Any `type` other than `'eip1559'` and `'legacy'` is refused too.

Note that a legacy transaction signed by a `privateKey` account is currently signed WITHOUT a chain id (the signer comes from the `eip-1193-signer` library, which does not apply EIP-155 to legacy transactions). Such a transaction could be replayed on another chain where the same account has the same nonce, and nodes configured to accept only replay-protected transactions (geth's default over RPC) refuse it. An account held by the node signs with its chain id and is not affected.

## Named Accounts

Named accounts allow you to refer to accounts by name rather than index or address. This makes your deployment scripts and tests more readable and maintainable.

Named accounts are configured in `rocketh/config.ts`:

```typescript
export const config = {
	accounts: {
		deployer: {
			default: 0,
			sepolia: 1,
		},
		admin: {
			default: 1,
		},
	},
} as const satisfies UserConfig;
```

In this example, `deployer` refers to the first account (index 0) on all environment except Sepolia, where it refers to the second account (index 1).

## Deploy Scripts

Deploy scripts are JavaScript or TypeScript files that define how contracts should be deployed. They use the `execute` function from rocketh to define a deployment function and its metadata (tags and dependencies).

Deploy scripts are placed in the `deploy` folder and are executed in alphabetical order when running the `hardhat deploy` task.

## Tags and Dependencies

Tags and dependencies allow you to control which deploy scripts are executed and in what order.

- **Tags**: Labels attached to deploy scripts that can be used to selectively execute them.
- **Dependencies**: Tags that a deploy script depends on, ensuring those scripts are executed first.

Two more options in that same declaration change WHEN a script runs rather than what it does: an `id` (with a `return true`) makes a script run once and never again, and `runAtTheEnd` moves it after every ordinary script of the run. See [Running once, and running last](../script-lifecycle/).
