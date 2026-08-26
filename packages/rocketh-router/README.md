# @rocketh/router

Router-based proxy deployment for Rocketh. Deploy contracts using a selector-based routing pattern where multiple implementation contracts are accessed through a single entry point.

## Features

- 🔀 **Selector Routing** - Route function calls to different implementations based on function selectors
- 📦 **ABI Merging** - Automatically merge ABIs from all route contracts
- 🔄 **Deterministic Deployment** - Support for CREATE2 deterministic addresses
- 📄 **Documentation Merging** - Merge devdoc and userdoc from all routes

## Installation

```bash
# Using pnpm
pnpm add @rocketh/router

# Using npm
npm install @rocketh/router

# Using yarn
yarn add @rocketh/router
```

## Usage

### Basic Router Deployment

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaRouter, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deployViaRouter(
			'MyRouter',
			{
				account: deployer,
			},
			[
				{
					name: 'UserModule',
					artifact: artifacts.UserModule,
					args: [],
				},
				{
					name: 'PaymentModule',
					artifact: artifacts.PaymentModule,
					args: [],
				},
				{
					name: 'AdminModule',
					artifact: artifacts.AdminModule,
					args: [],
				},
			],
		);
	},
	{tags: ['MyRouter']},
);
```

### Using the Extension

First, add the router extension to your Rocketh config:

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';
import * as routerExtension from '@rocketh/router';

const extensions = {
	...deployExtension,
	...routerExtension,
};
export {extensions};
```

Then use it in your deploy scripts:

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async (env) => {
		const {deployer} = env.namedAccounts;

		// deployViaRouter is now available on env
		await env.deployViaRouter('MyRouter', {account: deployer}, [
			{name: 'ModuleA', artifact: artifacts.ModuleA, args: []},
			{name: 'ModuleB', artifact: artifacts.ModuleB, args: []},
		]);
	},
	{tags: ['MyRouter']},
);
```

## API Reference

### `deployViaRouter(env)`

Creates a router deployment function.

**Parameters:**

- `env` - The Rocketh environment

**Returns:** A deployment function with the signature:

```typescript
function deployViaRouter<TAbi extends Abi>(
	name: string,
	params: RouterEnhancedDeploymentConstruction,
	routes: Route<Abi>[],
	options?: RouterDeployOptions,
): Promise<DeployResult<TAbi>>;
```

### Deployment Parameters

#### `name`

The name for the router deployment.

#### `params`

- `account` - The deployer account (named account or address)

#### `routes`

Array of route definitions:

```typescript
interface Route<TAbi extends Abi> {
	name: string; // Name for this route implementation
	artifact: Artifact<TAbi>; // Contract artifact
	args?: unknown[]; // Constructor arguments
}
```

#### `options`

```typescript
interface RouterDeployOptions extends DeployOptions {
	extraABIs?: Abi[]; // Additional ABIs to merge
	routerContract?: {
		// Custom router contract
		type: 'custom';
		artifact: Artifact;
	};
}
```

The staleness options from `DeployOptions` mean what they mean everywhere else. Since this deploys several contracts, what each one needs is the **level** it applies at.

By default every route and the router itself are compared on code and constructor arguments, and redeployed only if they differ. Because the route addresses are constructor arguments of the router, redeploying any route redeploys the router too: a router is immutable, so a new router is the only thing that can point at a new route.

`skipIfAlreadyDeployed` applies to the deployment **as a whole**. If a deployment already exists under `name`, it is returned untouched and nothing is deployed, routes included. It is deliberately not applied per contract: skipping only some of them would deploy a route that the router does not name, leaving live code that nothing can reach. Because the stack is returned untouched, a change that affects only the recorded ABI (adding `extraABIs`, say) is not picked up either while this option is set.

`alwaysOverride` and `strictBytecodeMatch` apply per contract, as they would to any deploy. `alwaysOverride` redeploys everything unconditionally, and throws if combined with `skipIfAlreadyDeployed`. `strictBytecodeMatch` applies to your route contracts; it is not applied to the router contract itself, so a compiler metadata difference in the bundled router artifact does not cascade into an upgrade of whatever proxy fronts it.

## How It Works

1. **Deploy Routes**: Each route contract is deployed separately as `{name}_Router_{routeName}_Route`
2. **Build Selector Map**: Function selectors from all routes are collected and mapped to implementation indices
3. **Deploy Router**: The router contract is deployed with the selector map and implementation addresses
4. **Merge ABIs**: All route ABIs are merged into a single ABI for the final deployment

### Selector Map Format

The router uses a sorted array of `bytes6` values where:

- First 4 bytes: Function selector
- Last 2 bytes: Implementation index (1-based, 0 means no implementation)

```
[0x12345678 + 0x0001] -> Function 0x12345678 routes to implementation 1
[0xabcdef01 + 0x0002] -> Function 0xabcdef01 routes to implementation 2
```

## Example: Multi-Module Token

```typescript
// deploy/deploy_MultiModuleToken.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaRouter, namedAccounts}) => {
		const {deployer, treasury} = namedAccounts;

		await deployViaRouter(
			'MultiModuleToken',
			{
				account: deployer,
			},
			[
				{
					name: 'ERC20Core',
					artifact: artifacts.ERC20CoreModule,
					args: ['My Token', 'MTK', 18],
				},
				{
					name: 'Mintable',
					artifact: artifacts.MintableModule,
					args: [treasury],
				},
				{
					name: 'Burnable',
					artifact: artifacts.BurnableModule,
					args: [],
				},
				{
					name: 'Pausable',
					artifact: artifacts.PausableModule,
					args: [deployer], // Admin address
				},
			],
			{
				deterministic: true, // Deploy deterministically
			},
		);
	},
	{tags: ['MultiModuleToken']},
);
```

## Custom Router Contract

You can provide a custom router contract that follows the same interface:

```typescript
await deployViaRouter('MyRouter', {account: deployer}, routes, {
	routerContract: {
		type: 'custom',
		artifact: myCustomRouterArtifact,
	},
});
```

The custom router must accept constructor arguments in the format:

```solidity
struct RouterParams {
    address fallbackImplementation;
    address[] implementations;
    bytes6[] sigMap;
}
```

## Deployment Artifacts

After deployment, several artifacts are created:

- `{name}` - The main router with merged ABI
- `{name}_Router` - The router proxy contract
- `{name}_Router_{routeName}_Route` - Each route implementation

## Related Packages

- [`rocketh`](../rocketh) - Core deployment environment
- [`@rocketh/deploy`](../rocketh-deploy) - Standard deployment functions
- [`@rocketh/proxy`](../rocketh-proxy) - Proxy deployment patterns

## License

[MIT](../../LICENSE)
