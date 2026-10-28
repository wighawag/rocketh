# @rocketh/web

The browser runtime of rocketh: runs your deploy scripts in a web page, against a wallet or an EVM in the tab, with the deployment records kept in memory or in IndexedDB. The scripts are the same ones `@rocketh/node` runs; a browser cannot read a folder, so they are passed as modules.

## Installation

```bash
pnpm add rocketh @rocketh/web
# or
npm install rocketh @rocketh/web
```

`rocketh` is a peer dependency.

## Example

```typescript
import {setupEnvironment, createIndexedDBDeploymentStore} from '@rocketh/web';
import {config, extensions} from './rocketh/config.js';
import deployGreetingsRegistry from './deploy/001_deploy_greetings_registry.js';

const {loadAndExecuteDeploymentsFromModules} = setupEnvironment(config, extensions, {
	deploymentStore: await createIndexedDBDeploymentStore(),
});

const env = await loadAndExecuteDeploymentsFromModules(
	[{id: '001_deploy_greetings_registry', module: deployGreetingsRegistry}],
	{environment: 'sepolia', provider: window.ethereum},
);
```

## Documentation

- [Run deploy scripts in a browser](https://rocketh.dev/documentation/browser/)

The whole documentation is at [rocketh.dev](https://rocketh.dev), the hardhat-deploy section at [rocketh.dev/hardhat-deploy](https://rocketh.dev/hardhat-deploy/).

## License

[MIT](https://github.com/wighawag/rocketh/blob/main/LICENSE)
