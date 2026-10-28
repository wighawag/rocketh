<div align="center">
<a href="https://rocketh.dev"><img alt="rocketh logo" src="https://rocketh.dev/preview.png"  /></a>
<hr/>

<a href="https://npmjs.com/package/rocketh"><img alt="Version" src="https://img.shields.io/npm/v/rocketh" /></a>
<a href="https://github.com/wighawag/rocketh/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/wighawag/rocketh" /></a>
<a href="https://npmjs.com/package/rocketh"><img src="https://img.shields.io/npm/dw/rocketh" alt="weekly downloads" /></a>
<a href="https://npmjs.com/package/rocketh"><img alt="Dependents" src="https://img.shields.io/librariesio/dependents/npm/rocketh" /></a>
<a href="https://github.com/wighawag/rocketh/stargazers"><img alt="Github Stars" src="https://img.shields.io/github/stars/wighawag/rocketh" /></a>
<a href="https://npmjs.com/package/rocketh"><img alt="Node Version" src="https://img.shields.io/node/v/rocketh"></a>
<a href="https://github.com/wighawag/rocketh/issues"><img alt="Issues and PRs" src="https://img.shields.io/github/issues-pr/wighawag/rocketh" /></a>
<a href="https://github.com/wighawag/rocketh/actions"><img alt="Tests Status" src="https://img.shields.io/github/actions/workflow/status/wighawag/rocketh/test.yml?label=test" /></a>
<a href="https://github.com/wighawag/rocketh/commits/main/"><img alt="Commit activity" src="https://img.shields.io/github/commit-activity/w/wighawag/rocketh" /></a>
<a href="https://github.com/wighawag/rocketh/commits/main/"><img alt="Last commit" src="https://img.shields.io/github/last-commit/wighawag/rocketh" /></a>

<!-- <a href="https://npmjs.com/package/rocketh"><img alt="dependencies status" src="https://img.shields.io/librariesio/release/npm/rocketh" /></a>-->
</div>

# Rocketh

Framework-agnostic deployment system for EVM smart contracts, and the deployment engine behind hardhat-deploy v2.

> 📚 **The documentation is at [rocketh.dev](https://rocketh.dev)**: [Introduction](https://rocketh.dev/documentation/), [get started without Hardhat](https://rocketh.dev/documentation/getting-started/) or [with hardhat-deploy](https://rocketh.dev/hardhat-deploy/getting-started/), guides and reference.

> 🤖 **Deploying through a coding agent?** rocketh publishes skills that teach it to deploy with rocketh and hardhat-deploy v2: [Working with an AI agent](https://rocketh.dev/documentation/agent-skills/) lists them and says how to install them (`npx skills add wighawag/rocketh`).

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

| Package                                                                                                           | Description                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`rocketh`](https://github.com/wighawag/rocketh#readme)                                                           | Core deployment environment and execution                                      |
| [`hardhat-deploy`](https://github.com/wighawag/rocketh/tree/main/packages/hardhat-deploy#readme)                  | The Hardhat plugin: `hardhat deploy`, fixtures, typed artifacts                |
| [`@rocketh/core`](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-core#readme)                     | Shared types and utilities                                                     |
| [`@rocketh/deploy`](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-deploy#readme)                 | Standard contract deployment                                                   |
| [`@rocketh/proxy`](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-proxy#readme)                   | Proxy deployment patterns (UUPS, Transparent, ERC173)                          |
| [`@rocketh/diamond`](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-diamond#readme)               | EIP-2535 Diamond proxy support                                                 |
| [`@rocketh/read-execute`](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-read-execute#readme)     | Contract read/write utilities                                                  |
| [`@rocketh/unknown-signer`](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-unknown-signer#readme) | per-call unknown-signer policy, and `catchUnknownSigner` for ported v1 scripts |
| [`@rocketh/node`](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-node#readme)                     | Node.js deployment executor                                                    |
| [`@rocketh/verifier`](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-verifier#readme)             | Contract verification (Etherscan, Sourcify)                                    |
| [`@rocketh/export`](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-export#readme)                 | Export deployments for frontend consumption                                    |
| [`@rocketh/doc`](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-doc#readme)                       | Documentation generation                                                       |
| [`@rocketh/signer`](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-signer#readme)                 | Signer utilities                                                               |
| [`@rocketh/router`](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-router#readme)                 | Route-based contract deployment                                                |
| [`@rocketh/web`](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-web#readme)                       | rocketh in web browser                                                         |
| [`@rocketh/viem`](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-viem#readme)                     | viem clients and contracts from your deployments                               |
| [`@rocketh/test-utils`](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-test-utils#readme)         | Test harness (`createTestEnvironment`, artifacts)                              |
| [`@rocketh/playground`](https://github.com/wighawag/rocketh/tree/main/packages/rocketh-playground#readme)         | Run rocketh deploy scripts in the browser, as a widget                         |

## Installation

Every package and its guide are listed in [Packages](https://rocketh.dev/documentation/reference/packages/).

```bash
# Using pnpm
pnpm add rocketh @rocketh/deploy @rocketh/node

# Using npm
npm install rocketh @rocketh/deploy @rocketh/node

# Using yarn
yarn add rocketh @rocketh/deploy @rocketh/node
```

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

- [Node.js](https://nodejs.org/en/download/) (v22 or later)
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
pnpm add -D hardhat @types/node typescript forge-std@github:foundry-rs/forge-std#v1.9.4 hardhat-deploy rocketh @rocketh/node @rocketh/deploy @rocketh/read-execute --allow-build=esbuild --allow-build=@parcel/watcher
```

The two `--allow-build` flags answer a question pnpm 11 asks: it will not finish an install while a dependency's build script is neither allowed nor denied, and stops at `ERR_PNPM_IGNORED_BUILDS` instead, as does every later `pnpm` command in the project. esbuild and @parcel/watcher are the two here, and their scripts only make sure the native binary each one needs is in place. pnpm records the answer, in `pnpm-workspace.yaml` (pnpm 11) or as `onlyBuiltDependencies` (pnpm 10), so you only give it once.

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

[MIT](https://github.com/wighawag/rocketh/blob/main/LICENSE)
