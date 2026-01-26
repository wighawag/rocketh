<div align="center">
<img alt="Rocketh Logo" src="./public/logo.svg" width="100"><br/>
  <a href="https://rocketh.dev">Rocketh</a>
<hr/>

<img src="https://img.shields.io/npm/v/rocketh" alt="npm version">
<img src="https://img.shields.io/github/license/wighawag/rocketh" alt="License">
<img src="https://img.shields.io/npm/dw/rocketh" alt="weekly downloads">

</div>

# Rocketh

A framework-agnostic smart contract deployment system for Ethereum-compatible networks.

## Features

- 🔧 **Framework Agnostic** - Works with any Ethereum development toolchain
- 📝 **Deploy Scripts** - Write deployment scripts that run anywhere, including in the browser
- 🔄 **Deterministic Deployments** - Support for CREATE2 and CREATE3 deployment patterns
- 💎 **Diamond Pattern** - First-class support for EIP-2535 Diamond proxies
- 🔀 **Proxy Patterns** - Support for ERC1967, UUPS, Transparent, and ERC173 proxies
- 📦 **Named Accounts** - Reference accounts by name instead of address
- 💾 **Deployment Tracking** - Save and track deployments with transaction receipts
- ✅ **Contract Verification** - Built-in support for Etherscan and Sourcify
- 📄 **Documentation Generation** - Auto-generate documentation from deployed contracts

## Packages

| Package                                                    | Description                                           |
| ---------------------------------------------------------- | ----------------------------------------------------- |
| [`rocketh`](./packages/rocketh)                            | Core deployment environment and execution             |
| [`@rocketh/core`](./packages/rocketh-core)                 | Shared types and utilities                            |
| [`@rocketh/deploy`](./packages/rocketh-deploy)             | Standard contract deployment                          |
| [`@rocketh/proxy`](./packages/rocketh-proxy)               | Proxy deployment patterns (UUPS, Transparent, ERC173) |
| [`@rocketh/diamond`](./packages/rocketh-diamond)           | EIP-2535 Diamond proxy support                        |
| [`@rocketh/read-execute`](./packages/rocketh-read-execute) | Contract read/write utilities                         |
| [`@rocketh/node`](./packages/rocketh-node)                 | Node.js deployment executor                           |
| [`@rocketh/verifier`](./packages/rocketh-verifier)         | Contract verification (Etherscan, Sourcify)           |
| [`@rocketh/export`](./packages/rocketh-export)             | Export deployments for frontend consumption           |
| [`@rocketh/doc`](./packages/rocketh-doc)                   | Documentation generation                              |
| [`@rocketh/signer`](./packages/rocketh-signer)             | Signer utilities                                      |
| [`@rocketh/router`](./packages/rocketh-router)             | Route-based contract deployment                       |
| [`@rocketh/web`](./packages/rocketh-web)                   | rocketh in web browser                                |

## Installation

```bash
# Using pnpm
pnpm add rocketh @rocketh/deploy @rocketh/node

# Using npm
npm install rocketh @rocketh/deploy @rocketh/node

# Using yarn
yarn add rocketh @rocketh/deploy @rocketh/node
```

## Documentation

For full documentation, visit [rocketh.dev](https://rocketh.dev).

## Getting Started

In this guide, we will create a new project using Rocketh from scratch..

> **Note**
> if you want to use a full featured template, you can use the [template-ethereum-contracts](https://github.com/wighawag/template-ethereum-contracts) repository.
>
> You can also use `hardhat-deploy init`, see [hardhat-deploy](https://rocketh.dev/hardhat-deploy/) for more information.

We will be using hardhat for contract compilation and hardhat-deploy to hook hardhat with rocketh.

> **Note**
> While rocketh is agnostic to the compilation system you use, it require one and for this guide we will use hardhat.

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) (v20 or later)
- [pnpm](https://pnpm.io/installation) (v9 or later)

### create a new directory and cd into it

We will be working in that folder going forward.

```bash
mkdir my-rocketh-project
# set the current directory
cd my-rocketh-project
```

### initialize a new project

Just create a new `package.json` file with the following content:

> file: `package.json`

```json
{
	"name": "my-rocketh-project",
	"version": "0.0.0",
	"type": "module"
}
```

### install dependencies

```bash
pnpm add -D hardhat @types/node typescript forge-std@github:foundry-rs/forge-std#v1.9.4 hardhat-deploy@next rocketh @rocketh/node @rocketh/deploy @rocketh/read-execute
```

### create a new solidity file

First we create a new directory for our solidity files.

```bash
mkdir src
```

Then we create a new solidity file in that folder.

> file: `src/Counter.sol`

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Counter {
  uint public x;

  event Increment(uint by);

  function inc() public {
    x++;
    emit Increment(1);
  }

  function incBy(uint by) public {
    require(by > 0, "incBy: increment should be positive");
    x += by;
    emit Increment(by);
  }
}
```

### create a new hardhat config file

We then create a new hardhat config file.

> file: `hardhat.config.ts`

```typescript
import {defineConfig} from 'hardhat/config';
import HardhatDeploy from 'hardhat-deploy';

export default defineConfig({
	plugins: [HardhatDeploy],
	solidity: {
		profiles: {
			default: {
				version: '0.8.28',
			},
			production: {
				version: '0.8.28',
				settings: {
					optimizer: {
						enabled: true,
						runs: 200,
					},
				},
			},
		},
	},
	networks: {
		hardhatMainnet: {
			type: 'edr-simulated',
			chainType: 'l1',
		},
		hardhatOp: {
			type: 'edr-simulated',
			chainType: 'op',
		},
	},
	paths: {
		sources: ['src'],
	},
	generateTypedArtifacts: {
		destinations: [
			{
				folder: './generated',
				mode: 'typescript',
			},
		],
	},
});
```

### create a new rocketh directory

Then we setup a rocketh by first creating a new directory for rocketh configurations.

```bash
mkdir rocketh
```

### create a new rocketh config file

We create the rocketh config file.

> file: `rocketh/config.ts`

```typescript
/// ----------------------------------------------------------------------------
// Typed Config
// ----------------------------------------------------------------------------
import type {UserConfig} from 'rocketh/types';

// we define our config and export it as "config"
export const config = {
	accounts: {
		deployer: {
			default: 0,
		},
		admin: {
			default: 1,
		},
	},
	data: {},
} as const satisfies UserConfig;

// then we import each extensions we are interested in using in our deploy script or elsewhere

// this one provide a deploy function
import * as deployExtension from '@rocketh/deploy';
// this one provide read,execute functions
import * as readExecuteExtension from '@rocketh/read-execute';

// and export them as a unified object
const extensions = {
	...deployExtension,
	...readExecuteExtension,
};
export {extensions};

// then we also export the types that our config ehibit so other can use it

type Extensions = typeof extensions;
type Accounts = typeof config.accounts;
type Data = typeof config.data;

export type {Extensions, Accounts, Data};
```

### create a new rocketh deploy file

the rocketh deploy file is used to export the deploy script function and the artifacts.

> file: `rocketh/deploy.ts`

```typescript
import {type Accounts, type Data, type Extensions, extensions} from './config.js';

// ----------------------------------------------------------------------------
// we re-export the artifacts, so they are easily available from the alias
import * as artifacts from '../generated/artifacts/index.js';
export {artifacts};
// ----------------------------------------------------------------------------
// we create the rocketh functions we need by passing the extensions to the
//  setup function
import {setupDeployScripts} from 'rocketh';
const {deployScript} = setupDeployScripts<Extensions, Accounts, Data>(extensions);

export {deployScript};
```

### create a new rocketh environment file

the environment file is used to export the environment functions, to be used in test and scripts.

> file: `rocketh/environment.ts`

```typescript
import {type Accounts, type Data, type Extensions, extensions} from './config.js';
import {setupEnvironmentFromFiles} from '@rocketh/node';
import {setupHardhatDeploy} from 'hardhat-deploy/helpers';

// useful for test and scripts, uses file-system
const {loadAndExecuteDeploymentsFromFiles} = setupEnvironmentFromFiles<Extensions, Accounts, Data>(extensions);
const {loadEnvironmentFromHardhat} = setupHardhatDeploy<Extensions, Accounts, Data>(extensions);

export {loadEnvironmentFromHardhat, loadAndExecuteDeploymentsFromFiles};
```

### create a new deploy directory

Then we can create a new deploy directory where our deploy scripts will be stored.

```bash
mkdir deploy
```

### create a new deploy script

And here we create a basic deploy script for our Counter contract.

> file: `deploy/deploy_Counter.ts`

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy('Counter', {
			account: deployer,
			artifact: artifacts.Counter,
		});
	},
	{tags: ['Counter', 'Counter_deploy']},
);
```

### compile

We can now compile our contracts using the following command:

```bash
pnpm hardhat compile
```

### deploy

And finally we can deploy our contracts in a in-memory hardhat network using the following command:

```bash
pnpm hardhat deploy
```

## License

[MIT](LICENSE)
