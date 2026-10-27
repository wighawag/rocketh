# @rocketh/read-execute

`read`, `execute` and `tx` for rocketh deploy scripts, tests and scripts: calls and transactions against your deployments, typed from their ABIs, sent through rocketh so that a transaction from an account it cannot sign for (a Safe) is handed to you rather than failing. `execute` takes a `guard`, the on-chain condition under which the call is still needed, which is what makes a privileged step converge on a re-run.

## Installation

```bash
pnpm add -D @rocketh/read-execute
# or
npm install --save-dev @rocketh/read-execute
```

## Wiring it up

`@rocketh/read-execute` is an extension: spread it into `extensions` in `rocketh/config.ts`, and your deploy scripts receive its functions.

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';
import * as readExecuteExtension from '@rocketh/read-execute';

const extensions = {...deployExtension, ...readExecuteExtension};
export {extensions};
```

## Example

```typescript
// deploy/001_deploy_token.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, read, execute, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;
		const token = await deploy('Token', {account: deployer, artifact: artifacts.Token, args: ['Token', 'TKN']});
		await execute(token, {
			account: deployer,
			functionName: 'transferOwnership',
			args: [admin],
			guard: {kind: 'call', functionName: 'owner', equals: admin}, // skipped once the owner is admin
		});
	},
	{tags: ['Token']},
);
```

`GuardEvaluationError` is on the `@rocketh/read-execute/errors` subpath.

## Documentation

- [Calling your contracts](https://rocketh.dev/documentation/deploy-contracts/#calling-your-contracts-read-execute-tx)
- [Guard execute calls](https://rocketh.dev/documentation/execute-guard/)
- [Unknown signers](https://rocketh.dev/documentation/unknown-signers/)

The whole documentation is at [rocketh.dev](https://rocketh.dev), the hardhat-deploy section at [rocketh.dev/hardhat-deploy](https://rocketh.dev/hardhat-deploy/).

## License

[MIT](https://github.com/wighawag/rocketh/blob/main/LICENSE)
