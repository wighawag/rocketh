# @rocketh/deploy

`deploy` for rocketh deploy scripts: deploys a contract from its artifact, records it, and on the next run does nothing unless the code or the constructor arguments changed. Also `computeDeterministicAddress`, the address of a create2 or create3 deployment before it exists. Almost every rocketh project uses it, and `@rocketh/proxy`, `@rocketh/diamond` and `@rocketh/router` build on it.

## Installation

```bash
pnpm add -D @rocketh/deploy
# or
npm install --save-dev @rocketh/deploy
```

## Wiring it up

`@rocketh/deploy` is an extension: spread it into `extensions` in `rocketh/config.ts`, and your deploy scripts receive its functions.

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';

const extensions = {...deployExtension};
export {extensions};
```

## Example

```typescript
// deploy/001_deploy_counter.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		await deploy('Counter', {account: namedAccounts.deployer, artifact: artifacts.Counter, args: [42n]});
	},
	{tags: ['Counter']},
);
```

## Documentation

- [Deploy contracts](https://rocketh.dev/documentation/deploy-contracts/)
- [Deterministic addresses](https://rocketh.dev/documentation/deterministic-addresses/)
- [Deploy scripts, tags and dependencies](https://rocketh.dev/documentation/deploy-scripts/)

The whole documentation is at [rocketh.dev](https://rocketh.dev), the hardhat-deploy section at [rocketh.dev/hardhat-deploy](https://rocketh.dev/hardhat-deploy/).

## License

[MIT](https://github.com/wighawag/rocketh/blob/main/LICENSE)
