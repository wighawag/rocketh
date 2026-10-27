# Deploy contracts

`deploy`, from `@rocketh/deploy`, deploys a contract from its artifact, records it, and returns the record. Run it again and it compares what is recorded with what you ask for, and does nothing when they match. Almost every project starts with it, and `@rocketh/proxy`, `@rocketh/diamond` and `@rocketh/router` are built on it.

It is an extension: spread it into `extensions` in `rocketh/config.ts`, as in [Get started](../getting-started/).

## Deploying a contract

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, execute, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		const registry = await deploy('GreetingsRegistry', {
			account: deployer,
			artifact: artifacts.GreetingsRegistry,
			args: [''],
		});

		// only on the run that actually deployed it
		if (registry.newlyDeployed) {
			await execute(registry, {account: deployer, functionName: 'setMessage', args: ['hello']});
		}
	},
	{tags: ['GreetingsRegistry', 'GreetingsRegistry_deploy']},
);
```

`deploy(name, construction, options?)`:

- **`name`** is the deployment's name: the record is `deployments/<environment>/<name>.json`, and `get(name)` reads it back. It does not have to be the contract's name, which is how one artifact is deployed several times.
- **`construction`** says what to deploy and from whom: `account` (a named account, or an address), `artifact` (the ABI and bytecode, typed, so `args` are checked against the constructor), `args`, and `value` (wei for a payable constructor). Any other field of viem's `deployContract` parameters can be given too (`gas`, `nonce`, the fee fields).
- **`options`** are `deterministic` (see [Deterministic addresses](../deterministic-addresses/)), `libraries` (below), `linkedData` (below), and the re-deployment controls (below).

It returns the record with one extra field, `newlyDeployed`, which is `true` only on the run that sent the deployment transaction. Branch on it for a step that must follow a first deployment.

## When does a re-run redeploy?

A deploy script is meant to be re-runnable, so `deploy` first asks whether the contract it is about to deploy is already deployed. Three options control that question, and the type lets you set only one of them:

| option                  | effect                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| `skipIfAlreadyDeployed` | if a deployment with this name exists, return it and look no further: the code is never compared |
| `alwaysOverride`        | redeploy unconditionally, comparing nothing (combined with `skipIfAlreadyDeployed`, it throws)   |
| `strictBytecodeMatch`   | how to compare, when comparing happens (see below)                                               |

With neither `skipIfAlreadyDeployed` nor `alwaysOverride`, rocketh compares the saved deployment's code and constructor arguments against what you are deploying now, and redeploys only if they differ.

By default that comparison **ignores the contract metadata**. Solidity appends a CBOR metadata blob to a contract's runtime bytecode, and that blob changes when things that do not affect behaviour change: a comment, an absolute source path, a compiler patch version. Comparing raw bytes would therefore redeploy (or, worse, UPGRADE A PROXY) because someone reformatted a file. So rocketh strips the metadata from both sides before comparing ([ADR 0004](https://github.com/wighawag/rocketh/blob/main/docs/adr/0004-non-strict-bytecode-matching-by-default.md)). For the proxy contract itself, `@rocketh/proxy` forces this off for exactly that reason and does not let you change it; a `strictBytecodeMatch` you pass to `deployViaProxy` still applies to the implementation.

Set `strictBytecodeMatch: true` to compare the bytes verbatim instead, metadata included:

```typescript
await deploy(
	'GreetingsRegistry',
	{account: deployer, artifact: artifacts.GreetingsRegistry, args: ['']},
	{strictBytecodeMatch: true},
);
```

Use it when you need the deployed contract to correspond to one exact compilation, typically because a verification or attestation flow pins the metadata hash, so a metadata-only difference genuinely IS a different artifact to you. The cost is that recompiling on a different machine, or with a patch-level compiler bump, will redeploy.

## Linking libraries

A contract that calls an external library is deployed with the library's address linked into its bytecode. Deploy the library first, then pass `libraries`, a map from each library's name to its address (several can be given):

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		// Deploy the library first
		const exampleLibrary = await deploy('ExampleLibrary', {
			account: deployer,
			artifact: artifacts.ExampleLibrary,
		});

		// Deploy a contract that uses the library
		await deploy(
			'Example',
			{
				account: deployer,
				artifact: artifacts.Example,
				args: ['example string argument'],
			},
			{
				libraries: {
					ExampleLibrary: exampleLibrary.address,
				},
			},
		);
	},
	{tags: ['Example', 'Example_deploy']},
);
```

## Attaching data to a deployment: `linkedData`

`linkedData` stores JSON next to the record, for values a frontend or a later script needs and cannot cheaply read from the chain (a prefix, an admin, a start block):

```typescript
await deploy(
	'GreetingsRegistry',
	{account: deployer, artifact: artifacts.GreetingsRegistry, args: [prefix]},
	{linkedData: {prefix, admin}},
);
```

It is copied into every [export](../exporting-and-verifying/#linkeddata-is-public), so it is public: never put a secret in it. `bigint` values are stored as strings.

## Beyond a plain contract

- [Deterministic addresses](../deterministic-addresses/): the same address on every chain, with create2 or create3, and knowing an address before deploying.
- [Upgradeable contracts with proxies](../proxies/): `deployViaProxy`.
- [Diamonds](../diamonds/): EIP-2535, upgraded facet by facet.
- [Routers](../routers/): one entry point over several implementation contracts, for a contract above the size limit.
- [Guard execute calls](../execute-guard/): calls after a deployment that converge on a re-run.
