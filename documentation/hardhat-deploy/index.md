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

To set the fees of every transaction the run builds without editing a script, pass `--gas-price` (legacy) or `--max-fee-per-gas` and `--max-priority-fee-per-gas` (EIP-1559), in wei. They apply only to calls that set no fee option of their own; see [Fees for a whole run](../core-concepts/#fees-for-a-whole-run). hardhat-deploy v1's `--gasprice`, `--maxfee` and `--priorityfee` are spelled this way now, since a hardhat task option cannot have an alias.

```bash
npx hardhat deploy --network sepolia --gas-price 2000000000
```

### When the network has no accounts

A named account given by index (`deployer: 0` in `rocketh/config.ts`) is the account at that index on the **hardhat network**, which comes from that network's `accounts` in `hardhat.config.ts`. A network with no `accounts` configured (hardhat resolves it to `'remote'`) asks the node instead, and a public RPC endpoint holds no keys. This is what happens with hardhat-deploy's network helpers (`addNetworksFromEnv`, `addNetworksFromKnownList`) when neither `MNEMONIC_sepolia` nor `MNEMONIC` is set. The deploy then stops before any script runs, with a plugin error rather than a crash:

```
Error in community plugin hardhat-deploy: cannot resolve 2 named accounts ("deployer", "admin") for environment "sepolia" (chain 11155111, endpoint https://11155111.rpc.thirdweb.com):
  - "deployer" is configured as index 0, but the node lists no accounts.
  - "admin" is configured as index 1, but the node lists no accounts.
The hardhat network "sepolia" configures no accounts (its `accounts` is 'remote'), so hardhat asks the node for its own, and this node holds none.
To fix it, configure accounts for "sepolia" in your hardhat config, for example `accounts: {mnemonic: configVariable('MNEMONIC_sepolia')}` or `accounts: [configVariable('DEPLOYER_PRIVATE_KEY')]`. If "sepolia" is added by hardhat-deploy's `addNetworksFromEnv` or `addNetworksFromKnownList`, set the environment variable MNEMONIC_sepolia to the mnemonic (or MNEMONIC, which every network without its own falls back to); the value SECRET reads it from the configuration variable SECRET_MNEMONIC_sepolia instead.
Alternatively, in the `accounts` of rocketh/config.ts, give the account a signer protocol (for example 'privateKey:...', read from the environment) or an address for "sepolia".

For more info run Hardhat with --show-stack-traces
```

The message names the environment, the chain id and the endpoint (with any path, query string or credentials replaced by `<redacted>`, since that is where RPC providers put API keys), and lists every account that cannot be resolved, so fixing one does not reveal the next on the following run. So, with the network helpers:

```bash
# .env.local (not committed)
MNEMONIC_sepolia=your testnet mnemonic here
```

When the network does configure accounts but fewer than the index asks for, the message says how many it has and points at `accounts.count` (for a mnemonic) or the list of keys instead.

## Using Deployments in Tests

The point of running deploy scripts in tests is that you test the contracts **as deployed**, wired together exactly as they will be on chain, rather than a fresh set of contracts assembled by the test.

Wrap `loadAndExecuteDeploymentsFromFiles` (from your `rocketh/environment.ts`; the artifacts come from `rocketh/deploy.ts`) in a fixture, so Hardhat can snapshot the chain after the deployment and restore it for each test instead of redeploying every time:

```typescript
// test/utils/index.ts
import {loadAndExecuteDeploymentsFromFiles} from '../../rocketh/environment.js';
import {artifacts} from '../../rocketh/deploy.js';
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
