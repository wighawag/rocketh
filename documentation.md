# rocketh and hardhat-deploy Documentation

## Introduction

### What is rocketh?

rocketh is a framework-agnostic system for deploying smart contracts on Ethereum-compatible networks. It provides a minimal API to save and load deployments, making it easy to track and manage contract deployments across different networks.

Key features of rocketh include:

- Deployment tracking and management
- Named accounts for easier contract interaction
- Deterministic deployments
- Library linking
- Support for various deployment strategies

### What is hardhat-deploy?

hardhat-deploy is a plugin for the Hardhat Ethereum development environment that leverages rocketh to provide a comprehensive deployment system. It makes it easy to deploy contracts to any network, keeping track of them and replicating the same environment for testing.

Key features of hardhat-deploy include:

- Integration with Hardhat's testing and task system
- Deployment scripts with tags and dependencies
- Named accounts for clearer tests and deployment scripts
- Support for specific deploy scripts per network
- Deployment retrying through saved pending transactions

### Relationship Between rocketh and hardhat-deploy

hardhat-deploy v2 is a complete rewrite that uses rocketh under the hood. While rocketh provides the core deployment functionality, hardhat-deploy integrates it with the Hardhat environment, making it accessible through Hardhat tasks and configuration.

rocketh is designed to be modular, with core functionality provided by separate packages like `@rocketh/deploy`, `@rocketh/proxy`, and `@rocketh/diamond`. hardhat-deploy wires these modules together and adds Hardhat-specific functionality.

## Architecture Overview

### rocketh Architecture

rocketh follows a modular architecture with several key components:

1. **Core Package (`rocketh`)**: Provides the basic environment and deployment tracking functionality.
2. **Deploy Package (`@rocketh/deploy`)**: Adds the `deploy` function to the environment.
3. **Proxy Package (`@rocketh/proxy`)**: Adds proxy deployment capabilities.
4. **Diamond Package (`@rocketh/diamond`)**: Adds diamond pattern deployment capabilities.
5. **Export Package (`@rocketh/export`)**: Provides functionality to export deployments for use in frontends.
6. **Verifier Package (`@rocketh/verifier`)**: Provides contract verification capabilities for Etherscan, Sourcify, etc.
7. **Doc Package (`@rocketh/doc`)**: Generates documentation for deployed contracts.

Each package extends the core with additional functionality, allowing you to use only what you need.

### hardhat-deploy Architecture

hardhat-deploy integrates rocketh with Hardhat through:

1. **Plugin Registration**: Registers the `deploy` task with Hardhat.
2. **Config Hook Handler**: Processes Hardhat configuration to set up rocketh.
3. **Solidity Hook Handler**: Processes Solidity compilation results for use with rocketh.
4. **Deploy Task**: Executes deployment scripts using rocketh's `loadAndExecuteDeployments` function.

## Installation and Setup

### Installing rocketh and hardhat-deploy

```bash
# Using npm
npm install -D hardhat-deploy@next rocketh @rocketh/deploy @rocketh/read-execute

# Using pnpm
pnpm add -D hardhat-deploy@next rocketh @rocketh/deploy @rocketh/read-execute
```

For additional functionality, you can install these optional packages:

```bash
# Using npm
npm install -D @rocketh/proxy @rocketh/diamond @rocketh/export @rocketh/verifier @rocketh/doc

# Using pnpm
pnpm add -D @rocketh/proxy @rocketh/diamond @rocketh/export @rocketh/verifier @rocketh/doc
```

### Setting Up Your Project

1. **Create a `rocketh.ts` or `rocketh.js` file**:

```typescript
// rocketh.ts
// ------------------------------------------------------------------------------------------------
// Typed Config
// ------------------------------------------------------------------------------------------------
import {UserConfig} from 'rocketh';
export const config = {
	accounts: {
		deployer: {
			default: 0,
		},
		admin: {
			default: 1,
		},
	},
} as const satisfies UserConfig;

// ------------------------------------------------------------------------------------------------
// Imports and Re-exports
// ------------------------------------------------------------------------------------------------
// We regroup all what is needed for the deploy scripts
// so that they just need to import this file

// we add here the extension we need, so that they are available in the deploy scripts
// extensions are simply function that accept as their first argument the Environment
// by passing them to the setup function (see below) you get to access them trhough the environment object with type-safety
import * as deployExtension from '@rocketh/deploy'; // this one provide a deploy function
import * as readExecuteExtension from '@rocketh/read-execute'; // this one provide read,execute functions
const extensions = {...deployExtension, ...readExecuteExtension};
// ------------------------------------------------------------------------------------------------
// we re-export the artifacts, so they are easily available from the alias
import artifacts from './generated/artifacts.js';
export {artifacts};
// ------------------------------------------------------------------------------------------------
// we then create the deployScript function taht we use in our deploy script, you can call it whatever you want
import {setup} from 'rocketh';
// the setup function can take functions, accounts and data and will ensure you have type-safety 
const {deployScript, loadAndExecuteDeployments} = setup<typeof extensions, typeof config.accounts>(extensions);
// we also export loadAndExecuteDeployments for tests
export {loadAndExecuteDeployments, deployScript};
```

2. **Update your `package.json` to add the `#rocketh` alias**:

```json
{
	"imports": {
		"#rocketh": "./rocketh.js"
	},
}
```

3. **Create a `deploy` folder** for your deployment scripts.

## Core Concepts

### Deployments

A deployment in rocketh represents a deployed contract on a specific network. It includes:

- Contract address
- ABI
- Bytecode
- Constructor arguments
- Transaction details
- Metadata for verification

Deployments are saved to disk in the `deployments/<network>` folder, allowing them to be tracked in version control and reused across different environments.

### Named Accounts

Named accounts allow you to refer to accounts by name rather than index or address. This makes your deployment scripts and tests more readable and maintainable.

Named accounts are configured in the `rocketh.ts` file:

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

In this example, `deployer` refers to the first account (index 0) on all networks except Sepolia, where it refers to the second account (index 1).

### Deploy Scripts

Deploy scripts are JavaScript or TypeScript files that define how contracts should be deployed. They use the `execute` function from rocketh to define a deployment function and its metadata (tags and dependencies).

Deploy scripts are placed in the `deploy` folder and are executed in alphabetical order when running the `hardhat deploy` task.

### Tags and Dependencies

Tags and dependencies allow you to control which deploy scripts are executed and in what order.

- **Tags**: Labels attached to deploy scripts that can be used to selectively execute them.
- **Dependencies**: Tags that a deploy script depends on, ensuring those scripts are executed first.

## Using rocketh

### The Environment Object

The environment object is passed to each deploy function and contains:

- Network information
- Named accounts and signers
- Functions to save and load deployments
- Functions provided by rocketh modules

### Deploying Contracts

The `deploy` function from `@rocketh/deploy` is used to deploy contracts:

```typescript
import {deployScript, artifacts} from '#rocketh';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy('GreetingsRegistry', {
			account: deployer,
			artifact: artifacts.GreetingsRegistry,
			args: [''],
		});
	},
	{tags: ['GreetingsRegistry', 'GreetingsRegistry_deploy']}
);
```

### Deploying Proxies

The `deployViaProxy` function from `@rocketh/proxy` allows you to deploy upgradeable contracts:

```typescript
import {deployScript, artifacts} from '#rocketh';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		const prefix = 'proxy:';
		await deployViaProxy(
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
			}
		);
	},
	{tags: ['GreetingsRegistry', 'GreetingsRegistry_deploy']}
);
```

### Deploying Diamonds

The `diamond` function from `@rocketh/diamond` allows you to deploy contracts using the Diamond pattern:

```typescript
import {deployScript, artifacts} from '#rocketh';

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
			}
		);
	},
	{tags: ['MyDiamond', 'MyDiamond_deploy']}
);
```

### Linking Libraries

rocketh supports linking libraries at deployment time:

```typescript
import {deployScript, artifacts} from '#rocketh';

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
			}
		);
	},
	{tags: ['Example', 'Example_deploy']}
);
```

### Deterministic Deployments

rocketh supports deterministic deployments using CREATE2:

```typescript
import {deployScript, artifacts} from '#rocketh';

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
			}
		);
	},
	{tags: ['GreetingsRegistry', 'GreetingsRegistry_deploy']}
);
```

## Using hardhat-deploy with rocketh

### Configuring hardhat-deploy

hardhat-deploy is configured in your `hardhat.config.js` or `hardhat.config.ts` file:

### Running Deployments

To run your deployment scripts, use the `hardhat deploy` task:

```bash
npx hardhat deploy --network sepolia
```

You can also run specific tags:

```bash
npx hardhat deploy --network sepolia --tags GreetingsRegistry
```

### Using Deployments in Tests

You can use deployments in your Hardhat tests:

## Advanced Features

### Contract Verification

The `@rocketh/verifier` package provides contract verification capabilities:

```bash
npx rocketh-verify -n sepolia etherscan
```

### Exporting Deployments

The `@rocketh/export` package allows you to export deployments for use in frontends:

```bash
npx rocketh-export -n sepolia --ts ./src/contracts.ts
```

### Generating Documentation

The `@rocketh/doc` package generates documentation for your contracts:

```bash
npx rocketh-doc
```

## Examples

### Basic Deployment

```typescript
import {deployScript, artifacts} from '#rocketh';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy('GreetingsRegistry', {
			account: deployer,
			artifact: artifacts.GreetingsRegistry,
			args: [''],
		});
	},
	{tags: ['GreetingsRegistry']}
);
```

### Proxy Deployment

```typescript
import {deployScript, artifacts} from '#rocketh';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await deployViaProxy(
			'GreetingsRegistry',
			{
				account: deployer,
				artifact: artifacts.GreetingsRegistry,
				args: ['proxy:'],
			},
			{
				owner: admin,
			}
		);
	},
	{tags: ['GreetingsRegistry']}
);
```

### Diamond Deployment

```typescript
import {deployScript, artifacts} from '#rocketh';

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
			}
		);
	},
	{tags: ['MyDiamond']}
);
```

### Deployment with Dependencies

```typescript
import {deployScript, artifacts} from '#rocketh';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy('Token', {
			account: deployer,
			artifact: artifacts.Token,
			args: ['My Token', 'MTK'],
		});
	},
	{tags: ['Token']}
);

// In another file
import {deployScript, artifacts} from '#rocketh';

export default deployScript(
	async ({deploy, get, namedAccounts}) => {
		const {deployer} = namedAccounts;
		const token = await get('Token');

		await deploy('TokenSale', {
			account: deployer,
			artifact: artifacts.TokenSale,
			args: [token.address],
		});
	},
	{tags: ['TokenSale'], dependencies: ['Token']}
);
```

## Migrating from hardhat-deploy v1 to v2

### Changes in Deploy Scripts

In v1:

```typescript
// deploy/00_deploy_my_contract.js
module.exports = async ({getNamedAccounts, deployments}) => {
	const {deploy} = deployments;
	const {deployer} = await getNamedAccounts();
	await deploy('MyContract', {
		from: deployer,
		args: ['Hello'],
		log: true,
	});
};
module.exports.tags = ['MyContract'];
```

In v2:

```typescript
// deploy/00_deploy_my_contract.ts
import {deployScript, artifacts} from '#rocketh';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy('MyContract', {
			account: deployer,
			artifact: artifacts.MyContract,
			args: ['Hello'],
		});
	},
	{tags: ['MyContract']}
);
```

### Changes in Configuration

In v1, configuration was in `hardhat.config.ts`:

```typescript
namedAccounts: {
  deployer: 0,
  ...
},
```

In v2, configuration is in `rocketh.ts`:

```typescript
export const config = {
  accounts: {
    deployer: {
      default: 0,
    },
    ...
  },
} as const satisfies UserConfig;
```

## Conclusion

rocketh and hardhat-deploy provide a powerful and flexible system for deploying and managing smart contracts on Ethereum-compatible networks. By understanding the core concepts and features, you can create robust deployment scripts that work across different environments and networks.

For more information, visit:

- [rocketh GitHub Repository](https://github.com/wighawag/rocketh)
- [hardhat-deploy GitHub Repository](https://github.com/wighawag/hardhat-deploy)
