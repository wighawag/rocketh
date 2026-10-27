# @rocketh/diamond

`diamond` for rocketh deploy scripts: deploys an [EIP-2535](https://eips.ethereum.org/EIPS/eip-2535) diamond from the set of facets you declare, and on later runs performs the `diamondCut` that brings the diamond to that set, adding, replacing and removing selectors. Removing a facet from the list removes its functions from the live diamond, and the cut is printed, removals first, before it is sent.

## Installation

```bash
pnpm add -D @rocketh/diamond
# or
npm install --save-dev @rocketh/diamond
```

## Wiring it up

`@rocketh/diamond` is an extension: spread it into `extensions` in `rocketh/config.ts`, and your deploy scripts receive its functions.

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';
import * as diamondExtension from '@rocketh/diamond';

const extensions = {...deployExtension, ...diamondExtension};
export {extensions};
```

## Example

```typescript
// deploy/001_deploy_my_diamond.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({diamond, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;
		await diamond(
			'MyDiamond',
			{account: deployer},
			{facets: [{artifact: artifacts.CounterFacet}, {artifact: artifacts.AdminFacet}], owner: admin},
		);
	},
	{tags: ['MyDiamond']},
);
```

The bundled facet and diamond artifacts are on the `./artifacts/*` and `./solc_0_8/*` subpaths.

## Documentation

- [Diamonds](https://rocketh.dev/documentation/diamonds/)

The whole documentation is at [rocketh.dev](https://rocketh.dev), the hardhat-deploy section at [rocketh.dev/hardhat-deploy](https://rocketh.dev/hardhat-deploy/).

## License

[MIT](https://github.com/wighawag/rocketh/blob/main/LICENSE)
