# Get started with hardhat-deploy

Two ways in: let `hardhat-deploy init` create a project, or add hardhat-deploy to a Hardhat 3 project by hand. Either way you end with a `rocketh` folder of three small files, a `deploy` folder of scripts, and `hardhat deploy`. For a fuller starting point (a monorepo with a frontend slot, watchers, verification, scripts) use the [template-ethereum-contracts](https://github.com/wighawag/template-ethereum-contracts) repository instead.

You need [Node.js](https://nodejs.org) 22 or later and [pnpm](https://pnpm.io).

## With `hardhat-deploy init`

::: code-group

```bash [pnpm]
pnpm dlx hardhat-deploy init --install my-project
```

```bash [npm] skip
npx hardhat-deploy init --install my-project
```

:::

The folder must be empty or not exist; `--install` installs the dependencies with pnpm (without it, run `pnpm install` yourself). Then:

```bash
# set the current directory
cd my-project
pnpm hardhat compile
pnpm hardhat deploy
```

`hardhat deploy` with no `--network` deploys to Hardhat's in-memory network: nothing is kept, which makes it a quick check that the scripts work. The project also has a test that runs the deploy scripts as a fixture (`pnpm hardhat test`), and a Solidity test.

## By hand

The step-by-step setup, every file and command included, is the [Getting Started of the rocketh README](https://github.com/wighawag/rocketh#getting-started), which is run as a test on every change, so it stays correct. In short, a project needs:

1. **The packages.** `hardhat`, `hardhat-deploy`, `rocketh`, `@rocketh/node` (which hardhat-deploy runs on), and the extensions your scripts call, usually `@rocketh/deploy` and `@rocketh/read-execute`:

   ```bash
   pnpm add -D hardhat hardhat-deploy rocketh @rocketh/node @rocketh/deploy @rocketh/read-execute --allow-build=esbuild --allow-build=@parcel/watcher
   ```

   The `--allow-build` flags settle the dependencies' build scripts, which pnpm 11 requires before it finishes an install; see [Get started without Hardhat](/documentation/getting-started/#the-project).

2. **The plugin**, in `hardhat.config.ts`, and where the [typed artifacts](../typed-artifacts/) go:

   ```typescript
   import {defineConfig} from 'hardhat/config';
   import HardhatDeploy from 'hardhat-deploy';

   export default defineConfig({
   	plugins: [HardhatDeploy],
   	solidity: {profiles: {default: {version: '0.8.28'}}},
   	generateTypedArtifacts: {destinations: [{folder: './generated', mode: 'typescript'}]},
   });
   ```

   Networks are declared as usual in Hardhat, or read from environment variables by hardhat-deploy's [network helpers](../networks/).

3. **`rocketh/config.ts`**: the named accounts, the environments, and the extensions. It is the same file as without Hardhat, see [Get started without Hardhat](/documentation/getting-started/#the-rocketh-folder); hardhat-deploy reads it, and adds no second place to configure accounts.

4. **`rocketh/deploy.ts`**: `deployScript`, bound to your extensions, and the artifacts, re-exported from what hardhat-deploy generates:

   ```typescript
   import {type Accounts, type Data, type Extensions, extensions} from './config.js';
   import * as artifacts from '../generated/artifacts/index.js';
   import {setupDeployScripts} from 'rocketh';

   export {artifacts};
   export const {deployScript} = setupDeployScripts<Extensions, Accounts, Data>(extensions);
   ```

5. **`rocketh/environment.ts`**: the loaders tests and scripts use, the filesystem one from `@rocketh/node` and the Hardhat one from `hardhat-deploy/helpers`:

   ```typescript
   import {type Accounts, type Data, type Extensions, extensions} from './config.js';
   import {setupEnvironmentFromFiles} from '@rocketh/node';
   import {setupHardhatDeploy} from 'hardhat-deploy/helpers';

   const {loadAndExecuteDeploymentsFromFiles} = setupEnvironmentFromFiles<Extensions, Accounts, Data>(extensions);
   const {loadEnvironmentFromHardhat} = setupHardhatDeploy<Extensions, Accounts, Data>(extensions);

   export {loadEnvironmentFromHardhat, loadAndExecuteDeploymentsFromFiles};
   ```

6. **A deploy script** in `deploy/`, see [Deploy scripts](/documentation/deploy-scripts/).

## Deploying to a network

```bash
pnpm hardhat deploy --network sepolia
```

The network is the environment: its records go to `deployments/sepolia/`, its accounts come from that network's `accounts` in `hardhat.config.ts`, and a named account given by index (`deployer: {default: 0}`) is that network's first account. A network with no accounts configured stops the run with a message naming what to set, see [Named accounts on a real network](/documentation/named-accounts/#when-the-network-has-no-accounts). Declare the network in `rocketh/config.ts` too (`environments: {sepolia: {chain: 11155111}}`), which is what ties it to a chain id when you [rehearse it on a fork](/documentation/fork-runs/#through-hardhat-deploy-hardhat_fork).

## Next

- [The `hardhat deploy` task](../deploy-task/): every option.
- [Tests with Hardhat fixtures](../tests/): the deploy scripts in your tests.
- [Development workflow](../development-workflow/): a local node, and redeploy on change.
- [Working with an AI agent](/documentation/agent-skills/): the skills that teach a coding agent to deploy with hardhat-deploy, and how to install them.
- Already deployed contracts with another tool? [Importing deployments made elsewhere](/documentation/deployment-records/#importing-deployments-made-elsewhere).
