# Share contracts between projects

A contracts project is often consumed by others: a frontend in the same monorepo, a second protocol that builds on yours, a test suite that needs your system deployed. rocketh has no special mechanism for this, on purpose: **the project being consumed is an npm package, and you depend on it.** What it publishes (its artifacts, its deployment records, its deploy scripts) is imported like any module.

## Publishing a contracts project

Expose what consumers need through the `exports` of its `package.json`. The template's contracts package does it this way:

```json
{
	"name": "template-ethereum-contracts",
	"type": "module",
	"exports": {
		"./deploy/*": "./dist/deploy/*",
		"./rocketh/*": "./dist/rocketh/*",
		"./artifacts/*": "./dist/generated/artifacts/*",
		"./abis/*": "./dist/generated/abis/*",
		"./deployments/*": "./deployments/*",
		"./src/*": "./src/*"
	},
	"files": ["dist", "src", "deployments"]
}
```

- **The generated artifacts and ABIs** (from hardhat-deploy's [typed artifacts](/hardhat-deploy/typed-artifacts/), or your own), compiled to JavaScript with their types: what a consumer deploys or calls.
- **The deployment records**, `deployments/<environment>/<Name>.json`: what is deployed where. Their fields are a [published format](../deployment-records/#what-a-record-holds).
- **The deploy scripts and the `rocketh` folder**, compiled to JavaScript (`tsc`, plus `tsc-alias` if the scripts use path aliases): so a consumer can run your deployment inside its own.
- **The Solidity sources**, for a consumer that inherits from them or verifies them.

The template builds `dist` with `pnpm contracts:build` (`hardhat compile` then `tsc`).

## Consuming one

Add it as a dependency, then use what it exports.

Its **artifacts and ABIs** are modules:

```typescript
import {Artifact_GreetingsRegistry} from 'template-ethereum-contracts/artifacts/GreetingsRegistry.js';
import {Abi_GreetingsRegistry} from 'template-ethereum-contracts/abis/GreetingsRegistry.js';
```

so a deploy script of yours can deploy a contract compiled by another package, as any artifact:

```typescript
import SolidityKit from 'solidity-kit/generated/artifacts.js';
import {deployScript} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		await deploy('Time', {account: namedAccounts.deployer, artifact: SolidityKit.Time, args: [namedAccounts.deployer]});
	},
	{tags: ['Time']},
);
```

Its **deployment records** are JSON, read for an address on a network it deployed to:

```typescript
import GreetingsRegistry from 'template-ethereum-contracts/deployments/sepolia/GreetingsRegistry.json' with {type: 'json'};
```

Its **deploy scripts** run inside your run when you list their folder before yours in `rocketh/config.ts`. Their `tags` and `dependencies` join yours, so a script of yours can depend on a tag of theirs, and a test of yours deploys both systems with one call:

```typescript
export const config = {
	accounts: {deployer: {default: 0}},
	scripts: ['node_modules/my-protocol-contracts/dist/deploy', 'deploy'],
	data: {},
} as const satisfies UserConfig;
```

The scripts run with their own `deployScript` (and so with the extensions they were built with) against your environment, your named accounts and your network. On a network where the other project is already deployed, put its records in your deployments folder (or deploy against a fork of that network) and its scripts find their contracts deployed and do nothing.

This replaces hardhat-deploy v1's `external` configuration and `export-artifacts`, see [the capability map](/hardhat-deploy/migration/#consuming-another-project).

## A frontend in the same repository

A web app in the same monorepo depends on the contracts package through the workspace (`"template-ethereum-contracts": "workspace:*"`) and imports the same modules, or a single [export](../exporting-and-verifying/#exporting-from-a-contracts-package) written into the app after each deployment. It can even import the deploy scripts and run them in the browser, against a wallet or an in-tab EVM, see [Run deploy scripts in a browser](../browser/).
