# Installation and Setup

## Installing rocketh and hardhat-deploy

```bash
# Using npm
npm install -D hardhat-deploy rocketh @rocketh/node @rocketh/deploy @rocketh/read-execute

# Using pnpm
pnpm add -D hardhat-deploy rocketh @rocketh/node @rocketh/deploy @rocketh/read-execute
```

Note that `@rocketh/node` is required for hardhat-deploy to function. this is a package that let rocketh read file and folders

For additional functionality, you can install these optional packages:

```bash
# Using npm
npm install -D @rocketh/proxy @rocketh/diamond @rocketh/export @rocketh/verifier @rocketh/doc

# Using pnpm
pnpm add -D @rocketh/proxy @rocketh/diamond @rocketh/export @rocketh/verifier @rocketh/doc
```

## Setting Up Your Project

There are several ways to configure rocketh, but here is our recommended approach

1. **Create a `rocketh` folder and add `config.ts/js` file (it has to be named this way) **

As you ll see by reading it, we also add some extra to make it easier to use later

```typescript
// rocketh/config.ts
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
// this one provide a deployViaProxy function that let you declaratively
//  deploy proxy based contracts
import * as deployProxyExtension from '@rocketh/proxy';
// this one provide a viem handle to clients and contracts
import * as viemExtension from '@rocketh/viem';

// and export them as a unified object
const extensions = {
	...deployExtension,
	...readExecuteExtension,
	...deployProxyExtension,
	...viemExtension,
};
export {extensions};

// then we also export the types that our config ehibit so other can use it

type Extensions = typeof extensions;
type Accounts = typeof config.accounts;
type Data = typeof config.data;

export type {Extensions, Accounts, Data};
```

2. **We also want to create 2 more files: `rocketh/deploy.ts/js` and `rocketh/environment.ts/js` (you can name them whatever you want)**

These files create the variosu utility functions we wll need later

- `deploy.ts` make use of only `rocketh` and allow deploy script to run in a web runtime if desired.
- `environment.ts` make use of `rocketh/node` to read the config file and is export function to be used in tests or scripts

```typescript
// rocketh/deploy.ts
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

```typescript
// rocketh/environment.ts
import {type Accounts, type Data, type Extensions, extensions} from './config.js';
import {setupEnvironmentFromFiles} from '@rocketh/node';
import {setupHardhatDeploy} from 'hardhat-deploy/helpers';

// useful for test and scripts, uses file-system
const {loadAndExecuteDeploymentsFromFiles} = setupEnvironmentFromFiles<Extensions, Accounts, Data>(extensions);
const {loadEnvironmentFromHardhat} = setupHardhatDeploy<Extensions, Accounts, Data>(extensions);

export {loadEnvironmentFromHardhat, loadAndExecuteDeploymentsFromFiles};
```

3. **Create a `deploy` folder** for your deployment scripts.
