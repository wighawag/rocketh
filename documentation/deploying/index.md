# Using rocketh

## The Environment Object

The environment object is passed to each deploy function and contains:

- Network information
- Named accounts and signers
- Functions to save and load deployments
- Functions provided by rocketh modules

## Deploying Contracts

The `deploy` function from `@rocketh/deploy` is used to deploy contracts:

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy('GreetingsRegistry', {
			account: deployer,
			artifact: artifacts.GreetingsRegistry,
			args: [''],
		});
	},
	{tags: ['GreetingsRegistry', 'GreetingsRegistry_deploy']},
);
```

### When does a re-run REDEPLOY?

A deploy script is meant to be re-runnable, so `deploy` first asks whether the contract it is about to deploy is already deployed. Three options control that question:

| option | effect |
| --- | --- |
| `skipIfAlreadyDeployed` | if a deployment with this name exists, return it and look no further — the code is never compared |
| `alwaysOverride` | redeploy unconditionally, comparing nothing (mutually exclusive with `skipIfAlreadyDeployed`, which throws) |
| `strictBytecodeMatch` | how to compare, when comparing happens — see below |

With neither `skipIfAlreadyDeployed` nor `alwaysOverride`, rocketh compares the saved deployment's code and constructor arguments against what you are deploying now, and redeploys only if they differ.

By default that comparison **ignores the contract metadata**. Solidity appends a CBOR metadata blob to a contract's runtime bytecode, and that blob changes when things that do not affect behaviour change: a comment, an absolute source path, a compiler patch version. Comparing raw bytes would therefore redeploy — or, worse, UPGRADE A PROXY — because someone reformatted a file. So rocketh strips the metadata from both sides before comparing (`docs/adr/0004-non-strict-bytecode-matching-by-default.md`). `@rocketh/proxy` forces this off for exactly that reason and does not let you change it.

Set `strictBytecodeMatch: true` to compare the bytes verbatim instead, metadata included:

```typescript
await deploy(
	'GreetingsRegistry',
	{account: deployer, artifact: artifacts.GreetingsRegistry, args: ['']},
	{strictBytecodeMatch: true},
);
```

Use it when you need the deployed contract to correspond to one exact compilation — typically because a verification or attestation flow pins the metadata hash, so a metadata-only difference genuinely IS a different artifact to you. The cost is that recompiling on a different machine, or with a patch-level compiler bump, will redeploy.

## Deploying Proxies

The `deployViaProxy` function from `@rocketh/proxy` allows you to deploy upgradeable contracts:

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async (env) => {
		const {deployer, admin} = env.namedAccounts;

		console.log({deployer, admin});

		const prefix = 'proxy:';
		const deployment = await env.deployViaProxy(
			'GreetingsRegistry',
			{
				account: deployer,
				artifact: artifacts.GreetingsRegistry,
				args: [prefix],
			},
			{
				owner: admin,
				linkedData: {
					prefix,
					admin,
				},
			},
		);
	},
	// execute takes as a second argument an options object where you can specify tags and dependencies
	{tags: ['GreetingsRegistry', 'GreetingsRegistry_deploy']},
);
```

## Deploying Diamonds

The `diamond` function from `@rocketh/diamond` allows you to deploy contracts using the Diamond pattern:

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({diamond, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await diamond(
			'MyDiamond',
			{
				account: deployer,
				facets: [
					{
						name: 'DiamondCutFacet',
						artifact: artifacts.DiamondCutFacet,
					},
					{
						name: 'DiamondLoupeFacet',
						artifact: artifacts.DiamondLoupeFacet,
					},
					{
						name: 'OwnershipFacet',
						artifact: artifacts.OwnershipFacet,
					},
				],
			},
			{
				owner: admin,
			},
		);
	},
	{tags: ['MyDiamond', 'MyDiamond_deploy']},
);
```

A diamond upgrade is DECLARATIVE: rocketh compares the selectors the diamond currently serves against the ones your declared facet set produces, and anything on chain that your facets no longer produce is REMOVED. That is what makes re-running a script converge on the state you described, and it is also the sharp edge: a commented-out facet, a typo in `facets`, or a half-finished refactor deletes live functions, and removing the cut function itself makes the diamond permanently un-upgradeable.

So the cut is printed before it is sent, with removals in their own block and selectors resolved to signatures:

```text
  diamondCut on MyDiamond:
  REMOVING 1 function from the diamond:
    0x55241077  setValue(uint256)
  A removed function stops existing at this address. If any of the above was not meant to go,
  stop now: check that every facet you expect is in `facets`, since anything the declared set
  does not produce is removed by design.
  adding 2 functions:
    0x20965255  getValue()  ->  0xaaa...
```

Nothing is refused: the removal block is there so an unintended one is visible while it is still cheap to stop. For a high-value diamond, rehearse the upgrade on a fork and read that block before running it for real.

## Linking Libraries

rocketh supports linking libraries at deployment time:

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

## Deterministic Deployments

rocketh supports deterministic deployments using CREATE2:

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy(
			'GreetingsRegistry',
			{
				account: deployer,
				artifact: artifacts.GreetingsRegistry,
				args: [''],
			},
			{
				deterministic: true, // or a specific salt: "0x123..."
			},
		);
	},
	{tags: ['GreetingsRegistry', 'GreetingsRegistry_deploy']},
);
```
