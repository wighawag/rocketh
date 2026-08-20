# Using hardhat-deploy with rocketh

hardhat-deploy v2 is a Hardhat plugin that runs rocketh under the hood. Your `rocketh/config.ts`, your extensions and your deploy scripts are the same ones described everywhere else in this documentation; hardhat-deploy adds the Hardhat wiring around them, so deployments happen through a Hardhat task and are available to Hardhat tests.

::: tip
This page covers the join between the two. The dedicated [hardhat-deploy documentation](/hardhat-deploy/) goes much deeper, including migration from v1, network helpers, fork testing and per-network scripts.
:::

## Configuring hardhat-deploy

Add the plugin to the `plugins` array in `hardhat.config.ts`. The helpers it ships pull network and account configuration out of environment variables, so RPC URLs and mnemonics stay out of the repository:

```typescript
import {HardhatUserConfig} from 'hardhat/config';
import HardhatDeploy from 'hardhat-deploy';
import {addForkConfiguration, addNetworksFromEnv} from 'hardhat-deploy/helpers';

const config: HardhatUserConfig = {
	plugins: [HardhatDeploy],
	solidity: {
		profiles: {
			default: {version: '0.8.28'},
		},
	},
	// adds a network for each `ETH_NODE_URI_<network>` env var found,
	//  reading `MNEMONIC_<network>` to populate its accounts
	networks: addForkConfiguration(addNetworksFromEnv({})),
};

export default config;
```

Everything else, named accounts, extensions and chain settings, stays in `rocketh/config.ts` as described in [Installation and Setup](../installation/). hardhat-deploy reads that file; it does not introduce a second place to configure the same things.

## Running Deployments

To run your deployment scripts, use the `hardhat deploy` task:

```bash
npx hardhat deploy --network sepolia
```

You can also run specific tags:

```bash
npx hardhat deploy --network sepolia --tags GreetingsRegistry
```

The unknown-signer flags described in [Handling unknown signers](../unknown-signers/) work here too:

```bash
npx hardhat deploy --network sepolia --on-unknown-signer throw
```

## Using Deployments in Tests

The point of running deploy scripts in tests is that you test the contracts **as deployed**, wired together exactly as they will be on chain, rather than a fresh set of contracts assembled by the test.

Wrap `loadAndExecuteDeploymentsFromFiles` (from your `rocketh/environment.ts`) in a fixture, so Hardhat can snapshot the chain after the deployment and restore it for each test instead of redeploying every time:

```typescript
// test/utils/index.ts
import {loadAndExecuteDeploymentsFromFiles, artifacts} from '../../rocketh/environment.js';
import {EthereumProvider} from 'hardhat/types/providers';

export function setupFixtures(provider: EthereumProvider) {
	return {
		async deployAll() {
			const env = await loadAndExecuteDeploymentsFromFiles({provider});

			// Deployments are inherently untyped, since what is on chain can differ from the
			//  current artifacts. Type them here, assuming the artifact still matches.
			const GreetingsRegistry = env.get<typeof artifacts.GreetingsRegistry.abi>('GreetingsRegistry');

			return {env, GreetingsRegistry, namedAccounts: env.namedAccounts, unnamedAccounts: env.unnamedAccounts};
		},
	};
}
```

The test then loads that fixture and uses the same `read` / `execute` functions your deploy scripts use:

```typescript
// test/GreetingsRegistry.test.ts
import {network} from 'hardhat';
import {setupFixtures} from './utils/index.js';

const {provider, networkHelpers} = await network.connect();
const {deployAll} = setupFixtures(provider);

describe('GreetingsRegistry', function () {
	it('stores a greeting', async function () {
		const {env, GreetingsRegistry, unnamedAccounts} = await networkHelpers.loadFixture(deployAll);
		const greeter = unnamedAccounts[0];

		await env.execute(GreetingsRegistry, {
			functionName: 'setMessage',
			args: ['hello world'],
			account: greeter,
		});

		expect(await env.read(GreetingsRegistry, {functionName: 'messages', args: [greeter]})).toEqual('hello world');
	});
});
```

Because the fixture runs your real deploy scripts, a script that breaks is caught by the test suite rather than at deployment time.
