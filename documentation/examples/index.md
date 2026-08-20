# Examples

## Basic Deployment

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
	{tags: ['GreetingsRegistry']},
);
```

## Proxy Deployment

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

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
			},
		);
	},
	{tags: ['GreetingsRegistry']},
);
```

## Diamond Deployment

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
	{tags: ['MyDiamond']},
);
```

## Deployment with Dependencies

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy('Token', {
			account: deployer,
			artifact: artifacts.Token,
			args: ['My Token', 'MTK'],
		});
	},
	{tags: ['Token']},
);

// In another file
import {deployScript, artifacts} from '../rocketh/deploy.js';

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
	{tags: ['TokenSale'], dependencies: ['Token']},
);
```
