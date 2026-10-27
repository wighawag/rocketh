# How to Deploy with Proxies

Proxies enable contract upgrades by separating logic and storage. This guide covers deploying upgradeable contracts using hardhat-deploy's proxy features.

## Prerequisites

Install the proxy extension:

::: code-group

```bash [npm]
npm install -D @rocketh/proxy
```

```bash [pnpm]
pnpm add -D @rocketh/proxy
```

:::

Add it to your `rocketh/config.ts`:

```typescript
import * as proxyExtensions from '@rocketh/proxy';
import * as deployExtensions from '@rocketh/deploy';

const extensions = {...deployExtensions, ...proxyExtensions};
export {extensions};
```

## Proxy Types

hardhat-deploy supports several proxy patterns:

### 1. Transparent Proxy (OpenZeppelin)

- Admin can upgrade, users can call functions
- Gas overhead on every call
- Most secure for production

### 2. UUPS (Universal Upgradeable Proxy Standard)

- Upgrade logic in implementation contract
- Lower gas costs
- Implementation must include upgrade functionality

### 3. ERC-173 Proxy (the default)

- An ownable proxy (`ERC173Proxy`, or `ERC173ProxyWithReceive` to accept plain ETH)
- Its owner upgrades it directly, with no admin contract
- Used when you do not set `proxyContract`

Beacon proxies are not built in. To have several proxies run one implementation, see [one implementation behind many proxies](/documentation/migration/#one-implementation-behind-many-proxies).

## Basic Proxy Deployment

### Transparent Proxy

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await deployViaProxy(
			'MyContract', // Contract name
			{
				account: deployer,
				artifact: artifacts.Greeter,
				args: ['initialValue'], // Constructor arguments
			},
			{
				owner: admin, // Proxy admin
				proxyContract: 'SharedAdminOptimizedTransparentProxy', // Proxy type
			},
		);
	},
	{tags: ['MyContract']},
);
```

### UUPS Proxy

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await deployViaProxy(
			'MyUUPSContract',
			{
				account: deployer,
				artifact: artifacts.MyUUPSContract,
				args: [admin, 'initialValue'],
			},
			{
				owner: admin,
				proxyContract: 'UUPS', // UUPS proxy type
				execute: 'initialize', // Initialization function
			},
		);
	},
	{tags: ['MyUUPSContract']},
);
```

## Contract Upgrades

### Upgrading Implementation

When you modify your contract and redeploy, hardhat-deploy automatically detects changes and upgrades the implementation:

```typescript
// After modifying your contract source code:
// 1. Recompile: npx hardhat compile
// 2. Redeploy: npx hardhat deploy

// hardhat-deploy will:
// - Detect that the implementation bytecode has changed
// - Deploy a new implementation contract
// - Call upgradeToAndCall (or upgrade) on the proxy
// - Keep the same proxy address and storage
```

### Checking for Upgrades

You can also tell whether a run deployed or upgraded the proxy:

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, getOrNull, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		const before = getOrNull('MyContract');

		const result = await deployViaProxy(
			'MyContract',
			{
				account: deployer,
				artifact: artifacts.MyContract,
				args: ['initialValue'],
			},
			{
				owner: admin,
				proxyContract: 'SharedAdminOptimizedTransparentProxy',
			},
		);

		// `deployViaProxy` returns the proxy's record, which has no `newlyDeployed` flag: compare
		// the implementation the record describes before and after instead
		if (!before) {
			console.log('Contract newly deployed');
		} else if (before.implementation !== result.implementation) {
			console.log('Contract upgraded');
		} else {
			console.log('Contract unchanged, no upgrade needed');
		}
	},
	{tags: ['MyContract']},
);
```

## Advanced Proxy Patterns

### Initialization Function

For contracts that need initialization after deployment:

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await deployViaProxy(
			'MyContract',
			{
				account: deployer,
				artifact: artifacts.Greeter,
				args: [''], // No constructor args
			},
			{
				owner: admin,
				proxyContract: 'SharedAdminOptimizedTransparentProxy',
				execute: {
					methodName: 'initialize',
					args: [admin, deployer, 1000], // Initialization parameters
				},
			},
		);
	},
	{tags: ['MyContract']},
);
```

## Next Steps

- [Deploy Diamond Contracts](../deploy-diamond-contracts/) for modular upgrades
- [Deployment Fixtures in Tests](../deployment-fixtures-in-tests/) for testing proxy deployments
