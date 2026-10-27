# Networks and accounts from the environment

hardhat-deploy ships helpers that build the `networks` of `hardhat.config.ts` from environment variables and from a list of known chains, so an endpoint or a mnemonic never has to be written in the file, and a new network is one variable away. They are optional: a network declared by hand works the same.

## Overview

Hardhat-deploy provides three key helper functions that work together:

```typescript
import {addForkConfiguration, addNetworksFromEnv, addNetworksFromKnownList} from 'hardhat-deploy/helpers';
```

These helpers automatically:

- Configure networks from environment variables
- Add all known chains with standard naming
- Set up fork configurations for testing
- Handle account management with mnemonics or private keys

## Helper Functions

### 1. `addNetworksFromEnv`

Scans environment variables for `ETH_NODE_URI_<network>` patterns and automatically creates network configurations.

#### How it Works

```typescript
// Looks for environment variables like:
// ETH_NODE_URI_sepolia=https://sepolia.infura.io/v3/YOUR-PROJECT-ID
// ETH_NODE_URI_polygon=https://polygon-mainnet.infura.io/v3/YOUR-PROJECT-ID
// MNEMONIC_sepolia=your mnemonic here
// MNEMONIC_polygon=your mnemonic here

const networks = addNetworksFromEnv({
	// Your custom networks here
	localhost: {
		type: 'edr-simulated',
		chainType: 'l1',
	},
});
```

Each network's accounts come from `MNEMONIC_<network>`, else `MNEMONIC`. Only the local network names `hardhat`, `localhost`, `memory` and `test` fall back further, to the public test mnemonic (`test test ... junk`). Any other network with neither variable set gets no accounts, so a deploy that needs one stops and names the variable to set (see [Named accounts on a real network](/documentation/named-accounts/#when-the-network-has-no-accounts)) instead of signing with a key everyone knows. A dev node under another name (`ETH_NODE_URI_lan`, say) therefore needs its mnemonic set explicitly, for example `MNEMONIC_lan="test test test test test test test test test test test junk"`.

#### Environment Variable Patterns

```bash
# Network RPC URLs
ETH_NODE_URI_sepolia=https://sepolia.infura.io/v3/YOUR-PROJECT-ID
ETH_NODE_URI_polygon=https://polygon-mainnet.infura.io/v3/YOUR-PROJECT-ID
ETH_NODE_URI_arbitrum=https://arb1.arbitrum.io/rpc

# Network-specific mnemonics
MNEMONIC_sepolia=your testnet mnemonic here
MNEMONIC_polygon=your polygon mnemonic here

# Fallback mnemonic (used if network-specific not found)
MNEMONIC=your default mnemonic here

# Secret management (uses Hardhat's configVariable)
ETH_NODE_URI_mainnet=SECRET
MNEMONIC_mainnet=SECRET
```

#### Secret Management

For production deployments, use Hardhat's secret management:

```bash
# Set environment variable to "SECRET" to use configVariable
ETH_NODE_URI_mainnet=SECRET
MNEMONIC_mainnet=SECRET

# Or read the secret stored under another name, for example to share one across networks
ETH_NODE_URI_mainnet=SECRET:production
MNEMONIC_mainnet=SECRET:production
```

`SECRET` reads the configuration variable named after the environment variable itself, with `SECRET_` in front: `ETH_NODE_URI_mainnet=SECRET` uses `configVariable('SECRET_ETH_NODE_URI_mainnet')` and `MNEMONIC_mainnet=SECRET` uses `configVariable('SECRET_MNEMONIC_mainnet')`.

`SECRET:<name>` keeps the `SECRET_ETH_NODE_URI_` or `SECRET_MNEMONIC_` part and replaces only the network name with `<name>`: `ETH_NODE_URI_mainnet=SECRET:production` uses `configVariable('SECRET_ETH_NODE_URI_production')` and `MNEMONIC_mainnet=SECRET:production` uses `configVariable('SECRET_MNEMONIC_production')`. So `MNEMONIC_sepolia=SECRET:testnet` and `MNEMONIC_holesky=SECRET:testnet` both read `SECRET_MNEMONIC_testnet`. `<name>` is used as written (dashes are not turned into underscores, unlike in the network name) and may not contain another `:`.

### 2. `addNetworksFromKnownList`

Automatically adds configurations for all known blockchain networks using their kebab-case names.

#### How it Works

```typescript
// Adds networks for all known chains using kebab-case names:
// ethereum, polygon, arbitrum-one, op-mainnet, base, arbitrum-sepolia, etc.
const networks = addNetworksFromKnownList(
	addNetworksFromEnv({
		// Your custom networks
	}),
);
```

#### Network Name Conversion

Network names are converted from their display names to kebab-case:

- **"Arbitrum Sepolia"** → `arbitrum-sepolia`
- **"MegaETH Testnet"** → `mega-eth-testnet`
- **"Polygon Mumbai"** → `polygon-mumbai`

**Important**: Environment variables use underscores instead of dashes (since dashes aren't allowed in env var names):

- Network name: `arbitrum-sepolia`
- Environment variable: `ETH_NODE_URI_arbitrum_sepolia`
- Environment variable: `MNEMONIC_arbitrum_sepolia`

#### Supported Networks

The helper includes every chain in viem's chain list, named from the chain's display name, for example:

- **Ethereum**: `ethereum` (mainnet)
- **Layer 2s**: `polygon`, `arbitrum-one`, `op-mainnet`, `base`
- **Testnets**: `sepolia`, `holesky`, `polygon-mumbai`, `arbitrum-sepolia`
- **Other chains**: `bnb-smart-chain`, `avalanche`, `fantom`, and many more

#### Automatic Configuration

For each known network, it automatically sets:

- **Chain ID**: Correct chain ID for the network
- **RPC URL**: Default public RPC or your custom `ETH_NODE_URI_<network>`
- **Accounts**: Network-specific mnemonic or fallback

For a real network it adds, the accounts come only from `MNEMONIC_<network>` or `MNEMONIC`: unlike `hardhat`, `localhost`, `memory` and `test`, it gets no test mnemonic. With neither set, the network has no accounts and its public RPC endpoint holds none, so a named account given by index (`deployer: 0`) cannot be resolved and `hardhat deploy` stops with a message naming the network, the endpoint and the variable to set:

```
Error in community plugin hardhat-deploy: cannot resolve the named account "deployer" for environment "arbitrum-sepolia" (chain 421614, endpoint https://sepolia-rollup.arbitrum.io/<redacted>):
  - "deployer" is configured as index 0, but the node lists no accounts.
The hardhat network "arbitrum-sepolia" configures no accounts (its `accounts` is 'remote'), so hardhat asks the node for its own, and this node holds none.
To fix it, configure accounts for "arbitrum-sepolia" in your hardhat config, for example `accounts: {mnemonic: configVariable('MNEMONIC_arbitrum_sepolia')}` or `accounts: [configVariable('DEPLOYER_PRIVATE_KEY')]`. If "arbitrum-sepolia" is added by hardhat-deploy's `addNetworksFromEnv` or `addNetworksFromKnownList`, set the environment variable MNEMONIC_arbitrum_sepolia to the mnemonic (or MNEMONIC, which every network without its own falls back to); the value SECRET reads it from the configuration variable SECRET_MNEMONIC_arbitrum_sepolia instead.
Alternatively, in the `accounts` of rocketh/config.ts, give the account a signer protocol (for example 'privateKey:...', read from the environment) or an address for "arbitrum-sepolia".
```

See [Named accounts on a real network](/documentation/named-accounts/#when-the-network-has-no-accounts).

`addNetworksFromEnv` follows the same rule for the networks it adds from `ETH_NODE_URI_<network>`.

### 3. `addForkConfiguration`

Adds a network named `fork` when the `HARDHAT_FORK` environment variable names a network, see [Forking with `HARDHAT_FORK`](#forking-with-hardhat_fork) below.

## Complete Configuration Example

Here's how the template uses all three helpers together:

```typescript
// hardhat.config.ts
import {HardhatUserConfig} from 'hardhat/config';
import HardhatDeploy from 'hardhat-deploy';
import {addForkConfiguration, addNetworksFromEnv, addNetworksFromKnownList} from 'hardhat-deploy/helpers';

const config: HardhatUserConfig = {
	plugins: [HardhatDeploy],
	solidity: {
		version: '0.8.28',
		settings: {
			optimizer: {
				enabled: true,
				runs: 999999,
			},
		},
	},
	networks:
		// Step 3: Add fork configuration for chosen network
		addForkConfiguration(
			// Step 2: Add network config for all known chains using kebab-case names
			// Uses MNEMONIC_<network> (or MNEMONIC if not set) for accounts
			// Uses ETH_NODE_URI_<network> for RPC URLs
			addNetworksFromKnownList(
				// Step 1: Add networks for each ETH_NODE_URI_<network> env var found
				// Also reads MNEMONIC_<network> to populate accounts
				addNetworksFromEnv(
					// Base configuration - your custom networks
					{
						default: {
							type: 'edr-simulated',
							chainType: 'l1',
						},
					},
				),
			),
		),
	paths: {
		sources: ['src'],
	},
};

export default config;
```

## Environment Variable Setup

### Development Environment

```bash
# .env.local (not committed)
ETH_NODE_URI_sepolia=https://sepolia.infura.io/v3/YOUR-PROJECT-ID
ETH_NODE_URI_polygon=https://polygon-mainnet.infura.io/v3/YOUR-PROJECT-ID
MNEMONIC_sepolia=your testnet mnemonic here
MNEMONIC_polygon=your polygon mnemonic here

```

### Production Environment

```bash
# Production environment variables
ETH_NODE_URI_ethereum=SECRET
ETH_NODE_URI_polygon=SECRET
MNEMONIC_ethereum=SECRET
MNEMONIC_polygon=SECRET
```

With corresponding Hardhat configuration variables:

```bash
# Hardhat configuration variables (secure)
SECRET_ETH_NODE_URI_ethereum=https://mainnet.infura.io/v3/YOUR-PROJECT-ID
SECRET_ETH_NODE_URI_polygon=https://polygon-mainnet.infura.io/v3/YOUR-PROJECT-ID
SECRET_MNEMONIC_ethereum=your production mnemonic here
SECRET_MNEMONIC_polygon=your production mnemonic here
```

## Advanced Usage

### Custom Network with Helpers

```typescript
const config: HardhatUserConfig = {
	networks: addForkConfiguration(
		addNetworksFromKnownList(
			addNetworksFromEnv({
				// Custom local network
				localhost: {
					type: 'edr-simulated',
					chainType: 'l1',
				},
				// Custom testnet
				'custom-testnet': {
					type: 'http',
					url: 'https://rpc.custom-testnet.com',
					chainId: 12345,
					accounts: {mnemonic: 'your custom testnet mnemonic'},
				},
			}),
		),
	),
};
```

### Network-Specific Configuration

```typescript
// The helpers automatically handle network-specific settings
// Based on environment variables:

// ETH_NODE_URI_arbitrum=https://arb1.arbitrum.io/rpc
// MNEMONIC_arbitrum=your arbitrum mnemonic

// Results in (addNetworksFromEnv sets no chainId or chainType; addNetworksFromKnownList
// sets chainId, but only for the known names, such as `arbitrum-one`, and currently never
// sets chainType):
// networks: {
//   arbitrum: {
//     type: 'http',
//     url: 'https://arb1.arbitrum.io/rpc',
//     accounts: { mnemonic: 'your arbitrum mnemonic' },
//   }
// }
```

### Template Replacement

A network with no `ETH_NODE_URI_<network>` of its own falls back to `ETH_NODE_URI`, in which `{{networkName}}` is replaced by the network's name. One provider whose URLs follow the network names can then serve every known network:

```bash
# sepolia uses https://sepolia.example.com/rpc, base-sepolia https://base-sepolia.example.com/rpc
ETH_NODE_URI=https://{{networkName}}.example.com/rpc
```

The names are the helpers' own (`ethereum`, not `mainnet`, for chain 1), so check them against your provider's URLs.

## Forking with `HARDHAT_FORK`

`addForkConfiguration` reads `HARDHAT_FORK`. When it names a network of the config (one with a `url`, which the other two helpers add), it adds an in-process `fork` network: Hardhat's simulated network, forking that network's endpoint, with that network's mnemonic, at the latest block or at `HARDHAT_FORK_NUMBER`:

```bash
HARDHAT_FORK=sepolia npx hardhat deploy
HARDHAT_FORK=sepolia HARDHAT_FORK_NUMBER=7000000 npx hardhat deploy
```

`hardhat deploy` and `loadEnvironmentFromHardhat` (for [scripts](../scripts/)) then connect to that `fork` network, and run as a [fork run](/documentation/fork-runs/) of the network you named: they read its deployment records (`deployments/sepolia`), take its settings and tags from `rocketh/config.ts`, impersonate the accounts it names, and write nothing back. A network the config does not have, or one without a `url`, stops the run (`no rpc URL found for <network>, cannot fork`).

The fork reports chain 31337, not the forked network's id, so declare the forked network's chain in `rocketh/config.ts` (`environments: {sepolia: {chain: 11155111}}`), or the rehearsal uses your local chain's settings and tags. Why, and what else a rehearsal inherits, is in [Rehearse on a fork](/documentation/fork-runs/#through-hardhat-deploy-hardhat_fork).

In `package.json` scripts, put the variable in front of the command (the template uses [`ldenv`](https://www.npmjs.com/package/ldenv) to set it from the script's argument):

```json
{
	"scripts": {
		"fork:deploy": "HARDHAT_FORK=sepolia hardhat deploy"
	}
}
```

## Troubleshooting

### Network Not Found

If a network isn't automatically configured:

```bash
# Add explicit environment variable
ETH_NODE_URI_custom_network=https://rpc.custom-network.com
MNEMONIC_custom_network=your mnemonic here
```

### RPC URL Issues

```bash
# Check if environment variable is set
echo $ETH_NODE_URI_sepolia

# Verify template replacement
ETH_NODE_URI=https://{{networkName}}.example.com/rpc
# Should work for: sepolia.example.com, polygon.example.com, etc.
```
