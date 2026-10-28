# @rocketh/node

The Node.js runtime of rocketh: the `rocketh` command, which runs your deploy scripts against an environment and records the deployments in `deployments/`, and the functions that build an environment from files, for tests and scripts. rocketh's core reads no file, so it can run in a browser; this package is what reads `rocketh/config.ts`, the scripts of `deploy/` and the records. hardhat-deploy runs on it.

## Installation

```bash
pnpm add -D rocketh @rocketh/node
# or
npm install --save-dev rocketh @rocketh/node
```

`rocketh` is a peer dependency.

## Example

```bash
npx rocketh -e sepolia
npx rocketh -e sepolia --tags Token
npx rocketh -e mainnet --is-fork --write-transactions ./batch.json   # rehearse against a fork you started
```

In a test or a script, bind your extensions once:

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

## Documentation

- [Get started without Hardhat](https://rocketh.dev/documentation/getting-started/)
- [The rocketh command, every option](https://rocketh.dev/documentation/reference/cli/#rocketh)
- [Rehearse on a fork](https://rocketh.dev/documentation/fork-runs/)
- [Configuration](https://rocketh.dev/documentation/reference/configuration/)

The whole documentation is at [rocketh.dev](https://rocketh.dev), the hardhat-deploy section at [rocketh.dev/hardhat-deploy](https://rocketh.dev/hardhat-deploy/).

## License

[MIT](https://github.com/wighawag/rocketh/blob/main/LICENSE)
