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
