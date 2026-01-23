# Getting Started

In this guide, we will create a new project using Rocketh.

This mardkown file can be executed by [zx](https://github.com/google/zx)

## Prerequisites

- [Node.js](https://nodejs.org/en/download/) (v20 or later)
- [pnpm](https://pnpm.io/installation) (v9 or later)

## Create a new project

### create a new directory and initialize a new project
```bash
mkdir my-rocketh-project
cd my-rocketh-project
```

### initialize a new project

```bash
cd my-rocketh-project
cat <<EOF > package.json
{
  "name": "my-rocketh-project",
  "version": "0.0.0",
  "type": "module"
}
EOF
```

### install dependencies
```bash
cd my-rocketh-project
pnpm add -D hardhat @types/node typescript forge-std@github:foundry-rs/forge-std#v1.9.4 hardhat-deploy@next rocketh @rocketh/node @rocketh/deploy @rocketh/read-execute
```

### create a new solidity file
```bash
cd my-rocketh-project
mkdir src
cat <<EOF > src/Counter.sol
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
EOF
```
### create a new hardhat config file
```bash
cd my-rocketh-project
cat <<EOF > hardhat.config.ts
import {defineConfig} from 'hardhat/config';
import HardhatDeploy from "hardhat-deploy";

export default defineConfig({
  plugins: [HardhatDeploy],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
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
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    }
  },
  paths: {
    sources: ['src'],
  },
  generateTypedArtifacts: {
    destinations: [{
      folder: './generated',
        mode: 'typescript'
    }]
  }
});
EOF
```
### create a new rocketh directory
```bash
cd my-rocketh-project
mkdir rocketh
```
### create a new rocketh config file
```bash
cd my-rocketh-project
cat <<EOF > rocketh/config.ts
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
    data: {}
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
EOF
```

### create a new rocketh deploy file
```bash
cd my-rocketh-project
cat <<EOF > rocketh/deploy.ts
import {type Accounts, type Data, type Extensions, extensions} from './config.js';

// ----------------------------------------------------------------------------
// we re-export the artifacts, so they are easily available from the alias
import * as artifacts from '../generated/artifacts/index.js';
export {artifacts};
// ----------------------------------------------------------------------------
// we create the rocketh functions we need by passing the extensions to the
//  setup function
import {setupDeployScripts} from 'rocketh';
const {deployScript} = setupDeployScripts<Extensions,Accounts,Data>(extensions);

export {deployScript};
EOF
```

### create a new rocketh environment file
```bash
cd my-rocketh-project
cat <<EOF > rocketh/environment.ts
import {type Accounts, type Data, type Extensions, extensions} from './config.js';
import {setupEnvironmentFromFiles} from '@rocketh/node';
import {setupHardhatDeploy} from 'hardhat-deploy/helpers';

// useful for test and scripts, uses file-system
const {loadAndExecuteDeploymentsFromFiles} = setupEnvironmentFromFiles<Extensions,Accounts,Data>(extensions);
const {loadEnvironmentFromHardhat} = setupHardhatDeploy<Extensions,Accounts,Data>(extensions)

export {loadEnvironmentFromHardhat, loadAndExecuteDeploymentsFromFiles};
EOF
```

### create a new deploy directory
```bash
cd my-rocketh-project
mkdir deploy
```

### create a new deploy script
```bash
cd my-rocketh-project
cat <<EOF > deploy/deploy_Counter.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy('Counter', {
			account: deployer,
			artifact: artifacts.Counter
		});
	},
	{tags: ['Counter', 'Counter_deploy']}
);
EOF
```

### compile 
```bash
cd my-rocketh-project
pnpm hardhat compile
```

### deploy
```bash
cd my-rocketh-project
pnpm hardhat deploy
```