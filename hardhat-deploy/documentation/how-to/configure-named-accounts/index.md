# How to Configure Named Accounts

Named accounts allow you to define accounts by name and configure them differently per network, making your deploy scripts more readable and flexible.

## What are Named Accounts?

Instead of using `accounts[0]`, `accounts[1]`, etc., you can use meaningful names like `deployer`, `admin`, `treasury`, making your code more maintainable and less error-prone.

## Basic Configuration

Configure named accounts in your `rocketh/config.ts` file:

```typescript
import type {UserConfig} from 'rocketh/types';

export const config = {
	accounts: {
		deployer: {
			default: 0, // Use first account by default
		},
		admin: {
			default: 1, // Use second account by default
		},
		treasury: {
			default: 2, // Use third account by default
		},
	},
} as const satisfies UserConfig;
```

## Network-Specific Configuration

You can override account assignments for specific networks:

```typescript
import type {UserConfig} from 'rocketh/types';
export const config = {
	accounts: {
		deployer: {
			default: 0,
			sepolia: 1, // Use second account on Sepolia
			mainnet: '0x1234567890123456789012345678901234567890', // Specific address on mainnet
		},
		admin: {
			default: 1,
			sepolia: 0, // Use first account on Sepolia
			mainnet: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', // Specific address on mainnet
		},
		treasury: {
			default: 2,
			mainnet: '0x9876543210987654321098765432109876543210', // Treasury multisig on mainnet
		},
	},
} as const satisfies UserConfig;
```

## Accounts on a Real Network

An index (`deployer: 0`) is the account at that index on the hardhat network you deploy to, and those accounts come from that network's `accounts` in `hardhat.config.ts`: a mnemonic or a list of private keys. A network with no `accounts` configured asks its node, and a public RPC endpoint holds no keys, so the index points at nothing. `npx hardhat deploy --network sepolia` then stops before running any script:

```
Error in community plugin hardhat-deploy: cannot resolve 2 named accounts ("deployer", "admin") for environment "sepolia" (chain 11155111, endpoint https://11155111.rpc.thirdweb.com):
  - "deployer" is configured as index 0, but the node lists no accounts.
  - "admin" is configured as index 1, but the node lists no accounts.
The hardhat network "sepolia" configures no accounts (its `accounts` is 'remote'), so hardhat asks the node for its own, and this node holds none.
To fix it, configure accounts for "sepolia" in your hardhat config, for example `accounts: {mnemonic: configVariable('MNEMONIC_sepolia')}` or `accounts: [configVariable('DEPLOYER_PRIVATE_KEY')]`. If "sepolia" is added by hardhat-deploy's `addNetworksFromKnownList`, set the environment variable MNEMONIC_sepolia to the mnemonic (or MNEMONIC, which every network without its own falls back to); the value SECRET reads it from the configuration variable SECRET_MNEMONIC_sepolia instead.
Alternatively, in the `accounts` of rocketh/config.ts, give the account a signer protocol (for example 'privateKey:...', read from the environment) or an address for "sepolia".
```

The usual fix is the first one: give the network its keys. With the [network helpers](../configure-network-helpers/), that is one environment variable, `MNEMONIC_<network>` (dashes in the network name become underscores, so `arbitrum-sepolia` reads `MNEMONIC_arbitrum_sepolia`). Every account that cannot be resolved is listed at once, and the endpoint is shown with any path, query string or credentials replaced by `<redacted>`, so an API key in the RPC url is never printed.

If instead an account should not use the network's keys at all (a multisig, say), give it an address for that network in `rocketh/config.ts`, as in the mainnet entries above.

## Using Named Accounts in Deploy Scripts

Access named accounts in your deploy scripts:

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, execute, namedAccounts}) => {
		const {deployer, admin, treasury} = namedAccounts;

		// Deploy contract with deployer account
		const token = await deploy('MyToken', {
			account: deployer,
			artifact: artifacts.MyToken,
			args: ['My Token', 'MTK', treasury], // Treasury as initial owner
		});

		// Transfer ownership to admin
		await execute(token, {
			functionName: 'transferOwnership',
			args: [admin],
			account: deployer,
		});
	},
	{tags: ['MyToken']},
);
```

## Using Named Accounts in Tests

Named accounts are also available in your test fixtures:

```typescript
import {setupFixtures} from './utils/index.js';

const {deployAll} = setupFixtures(provider);

describe('MyContract', function () {
	it('should work with named accounts', async function () {
		const {env, MyContract, namedAccounts} = await networkHelpers.loadFixture(deployAll);
		const {deployer, admin, alice, bob} = namedAccounts;

		// Use named accounts in tests
		await env.execute(MyContract, {
			functionName: 'transfer',
			args: [bob, 1000],
			account: alice,
		});
	});
});
```

## Next Steps

- [Use Tags and Dependencies](../use-tags-and-dependencies/) for organizing deployments
- [Deploy with Proxies](../deploy-with-proxies/) for upgradeable contracts
