# Get started without Hardhat

rocketh does not compile anything: it deploys from **artifacts**, the ABI and bytecode a compiler produces, and any compiler will do. This page sets up a project with the `rocketh` command line and [Foundry](https://getfoundry.sh)'s `forge` as the compiler, and deploys a contract to a local [anvil](https://getfoundry.sh/anvil/overview) node. Swap `forge` for solc or another tool and only the artifacts file changes.

Using Hardhat? [Get started with hardhat-deploy](/hardhat-deploy/getting-started/) instead: hardhat-deploy compiles, generates typed artifacts, and runs the same scripts through `hardhat deploy`.

## The project

```bash
mkdir my-project
cd my-project
```

```json
{
	"name": "my-project",
	"version": "0.0.0",
	"type": "module"
}
```

Save that as `package.json`, then install rocketh, its command line (`@rocketh/node`) and the two extensions every project uses (`deploy`, and `read` / `execute`):

::: code-group

```bash [pnpm]
pnpm add -D rocketh @rocketh/node @rocketh/deploy @rocketh/read-execute
```

```bash [npm]
npm install -D rocketh @rocketh/node @rocketh/deploy @rocketh/read-execute
```

:::

## A contract, compiled

```solidity
// src/Counter.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Counter {
    uint256 public x;

    event Increment(uint256 by);

    function inc() public {
        x++;
        emit Increment(1);
    }
}
```

```bash
forge build
```

forge writes `out/Counter.sol/Counter.json`, with the ABI, the bytecode under `bytecode.object`, and the solc metadata as a string under `rawMetadata`.

## The `rocketh` folder

rocketh reads its configuration from `rocketh/config.ts` (or `rocketh.ts` at the root). It declares the named accounts, the environments, and the extensions your scripts use:

```typescript
// rocketh/config.ts
import type {UserConfig} from 'rocketh/types';

export const config = {
	accounts: {
		deployer: {default: 0},
		admin: {default: 1},
	},
	environments: {
		// the node you start with `anvil`
		localhost: {chain: 31337},
	},
	data: {},
} as const satisfies UserConfig;

import * as deployExtension from '@rocketh/deploy';
import * as readExecuteExtension from '@rocketh/read-execute';

const extensions = {...deployExtension, ...readExecuteExtension};
export {extensions};

type Extensions = typeof extensions;
type Accounts = typeof config.accounts;
type Data = typeof config.data;
export type {Extensions, Accounts, Data};
```

`deployer: {default: 0}` is the node's first account, which anvil holds the key for; on a real network you give it a key instead, see [Named accounts and signers](../named-accounts/). An environment names a chain: `localhost` is chain 31337, and its endpoint, `http://127.0.0.1:8545`, comes from the chain's public information. See [Environments and chains](../environments/).

The artifacts your scripts deploy from are any object with `abi`, `bytecode` and `metadata`. This file turns forge's JSON into that:

```typescript
// rocketh/artifacts.ts
import type {Abi} from 'rocketh/types';
import CounterJSON from '../out/Counter.sol/Counter.json' with {type: 'json'};

function fromForge(json: {abi: unknown; bytecode: {object: string}; rawMetadata: string}) {
	return {
		abi: json.abi as Abi,
		bytecode: json.bytecode.object as `0x${string}`,
		metadata: json.rawMetadata,
	};
}

export const Counter = fromForge(CounterJSON);
```

An ABI read from JSON has no literal types, so constructor arguments and function names are not checked against it. For typed artifacts, generate a `.ts` module that exports each artifact `as const` (which is what hardhat-deploy's [typed artifacts](/hardhat-deploy/typed-artifacts/) are).

Last, the file your deploy scripts import: it binds `deployScript` to your extensions, and re-exports the artifacts.

```typescript
// rocketh/deploy.ts
import {type Accounts, type Data, type Extensions, extensions} from './config.js';
import {setupDeployScripts} from 'rocketh';

export * as artifacts from './artifacts.js';

export const {deployScript} = setupDeployScripts<Extensions, Accounts, Data>(extensions);
```

`rocketh/deploy.ts` imports nothing from Node, so the same scripts can also run [in a browser](../browser/). Tests and scripts that need the filesystem get a loader from `@rocketh/node` instead, in a third file:

```typescript
// rocketh/environment.ts
import {type Accounts, type Data, type Extensions, extensions} from './config.js';
import {setupEnvironmentFromFiles} from '@rocketh/node';

export const {loadAndExecuteDeploymentsFromFiles, loadEnvironmentFromFiles} = setupEnvironmentFromFiles<
	Extensions,
	Accounts,
	Data
>(extensions);
```

## A deploy script

```typescript
// deploy/001_deploy_counter.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy('Counter', {
			account: deployer,
			artifact: artifacts.Counter,
		});
	},
	{tags: ['Counter']},
);
```

## Deploy

Start a node in another terminal:

```bash
anvil
```

and run the scripts against it:

```bash
npx rocketh -e localhost
```

```text
- Executing deploy/001_deploy_counter.ts
  - Deploying Counter  with tx:
      0x9f56...6477
    => 0x5fbdb2315678afecb367f032d93f642f64180aa3
```

rocketh asks you to confirm the gas price before it starts (pass `--skip-prompts` in a script or CI), runs every script in `deploy/`, and records what it deployed in `deployments/localhost/`. Run it again and it finds the contract deployed with the same code and does nothing:

```text
reusing "Counter" at 0x5fbdb2315678afecb367f032d93f642f64180aa3
```

The TypeScript files are loaded as they are: the `rocketh` command runs them without a build step.

## Next

- [Deploy scripts, tags and dependencies](../deploy-scripts/): how scripts are found, ordered, selected and parameterised.
- [Deploy contracts](../deploy-contracts/): `deploy`, re-deployment, libraries, linked data.
- [Environments and chains](../environments/) and [Named accounts and signers](../named-accounts/): deploying to a real network.
- [The `rocketh` command](../reference/cli/#rocketh): every option.
- [Export, verify and document](../exporting-and-verifying/): what a frontend and a block explorer need.
