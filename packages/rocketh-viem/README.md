# @rocketh/viem

[viem](https://viem.sh) for rocketh deploy scripts, tests and scripts: a public and a wallet client on the environment's provider, and typed viem contracts for your deployments. It is a getter extension: it adds a `viem` property to the environment.

## Installation

```bash
pnpm add -D @rocketh/viem viem
# or
npm install --save-dev @rocketh/viem viem
```

`viem` is a peer dependency.

## Wiring it up

`@rocketh/viem` is an extension: spread it into `extensions` in `rocketh/config.ts`, and your deploy scripts receive its functions.

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';
import * as viemExtension from '@rocketh/viem';

const extensions = {...deployExtension, ...viemExtension};
export {extensions};
```

## Example

```typescript
export default deployScript(
	async ({deploy, viem, namedAccounts}) => {
		const deployment = await deploy('GreetingsRegistry', {
			account: namedAccounts.deployer,
			artifact: artifacts.GreetingsRegistry,
			args: [''],
		});
		const message = await viem.getContract(deployment).read.messages([namedAccounts.deployer]);
	},
	{tags: ['GreetingsRegistry']},
);
```

Write with `execute` (`@rocketh/read-execute`) rather than through a viem contract: a viem write bypasses rocketh's broadcast path, so an account rocketh cannot sign for fails instead of being handed to you.

## Documentation

- [Use viem](https://rocketh.dev/documentation/viem/)

The whole documentation is at [rocketh.dev](https://rocketh.dev), the hardhat-deploy section at [rocketh.dev/hardhat-deploy](https://rocketh.dev/hardhat-deploy/).

## License

[MIT](https://github.com/wighawag/rocketh/blob/main/LICENSE)
