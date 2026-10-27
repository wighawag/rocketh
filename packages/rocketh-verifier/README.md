# @rocketh/verifier

Contract verification tool for Rocketh. Submit your deployed contracts for verification on Etherscan, Sourcify, Blockscout, and other verification services.

## Features

- ✅ **Multi-Platform** - Support for Etherscan, Sourcify, and Blockscout
- 🔧 **CLI Tool** - Easy-to-use command line interface
- 📦 **Automatic Metadata** - Uses deployment metadata for verification
- ⚙️ **Configurable** - Custom endpoints, API keys, and options

## Installation

```bash
# Using pnpm
pnpm add @rocketh/verifier

# Using npm
npm install @rocketh/verifier

# Using yarn
yarn add @rocketh/verifier
```

## CLI Usage

The package provides a `rocketh-verify` CLI command.

### Verify on Etherscan

```bash
# Basic usage
rocketh-verify -e mainnet etherscan

# With custom options
rocketh-verify -e mainnet etherscan --license MIT --force-license

# Any chain Etherscan's V2 API covers (Polygon, Arbitrum, Base, ...) needs no endpoint:
#  the default one is used with the environment's chain id
rocketh-verify -e polygon etherscan

# With custom endpoint (for another Etherscan-compatible explorer)
rocketh-verify -e mychain etherscan --endpoint https://explorer.example/api
```

### Verify on Sourcify

```bash
# Basic usage
rocketh-verify -e mainnet sourcify

# With custom endpoint
rocketh-verify -e mainnet sourcify --endpoint https://sourcify.dev/server
```

### Verify on Blockscout

```bash
# Basic usage
rocketh-verify -e mainnet blockscout

# With custom endpoint (a Blockscout API v2 base url)
rocketh-verify -e mychain blockscout --endpoint https://blockscout.example/api/v2
```

### Export Metadata

Export contract metadata for manual verification:

```bash
rocketh-verify -e mainnet metadata --out ./metadata
```

## CLI Options

### Global Options

| Option                      | Description                             |
| --------------------------- | --------------------------------------- |
| `-e, --environment <value>` | **(Required)** Environment/network name |
| `-d, --deployments <value>` | Deployments folder path                 |

### Etherscan Options

| Option                   | Description                              |
| ------------------------ | ---------------------------------------- |
| `--endpoint <value>`     | Custom API endpoint                      |
| `--license <value>`      | Source code license (e.g., MIT, GPL-3.0) |
| `--force-license`        | Force the specified license              |
| `--min-interval <value>` | Minimum interval between requests (ms)   |
| `--fix-mispell`          | Fix misspelled form fields (some APIs)   |

**Environment Variable:** `ETHERSCAN_API_KEY`

### Sourcify Options

| Option                   | Description                            |
| ------------------------ | -------------------------------------- |
| `--endpoint <value>`     | Custom Sourcify endpoint               |
| `--min-interval <value>` | Minimum interval between requests (ms) |

### Blockscout Options

| Option                   | Description                            |
| ------------------------ | -------------------------------------- |
| `--endpoint <value>`     | Custom Blockscout API endpoint         |
| `--min-interval <value>` | Minimum interval between requests (ms) |

## Programmatic Usage

You can also use the verifier programmatically:

```typescript
import {run} from '@rocketh/verifier';

await run(resolvedConfig, 'mainnet', {
	verifier: {
		type: 'etherscan',
		apiKey: process.env.ETHERSCAN_API_KEY,
		license: 'MIT',
	},
	deploymentNames: ['MyContract', 'MyToken'], // Optional: specific contracts
	minInterval: 1000, // Optional: rate limiting
	logErrorOnFailure: true,
});
```

## API Reference

### `run(config, environmentName, options)`

Runs the verification process.

**Parameters:**

- `config: ResolvedUserConfig` - Resolved Rocketh configuration
- `environmentName: string` - Name of the environment (e.g., 'mainnet', 'sepolia')
- `options: VerificationOptions` - Verification options

### Verification Options

```typescript
interface VerificationOptions {
	verifier: EtherscanOptions | SourcifyOptions | BlockscoutOptions;
	deploymentNames?: string[]; // Specific contracts to verify
	minInterval?: number; // Rate limiting (ms between requests)
	logErrorOnFailure?: boolean; // Log errors instead of throwing
}
```

### Etherscan Options

```typescript
interface EtherscanOptions {
	type: 'etherscan';
	endpoint?: string; // Custom API endpoint
	apiKey?: string; // Etherscan API key
	license?: string; // SPDX license identifier
	forceLicense?: boolean; // Override contract license
	fixMispell?: boolean; // Fix API form field spelling
}
```

### Sourcify Options

```typescript
interface SourcifyOptions {
	type: 'sourcify';
	endpoint?: string; // Custom Sourcify endpoint
}
```

### Blockscout Options

```typescript
interface BlockscoutOptions {
	type: 'blockscout';
	endpoint?: string; // Custom Blockscout API endpoint
}
```

## Supported Networks

### Etherscan Networks

The verifier uses Etherscan's V2 API, `https://api.etherscan.io/v2/api`, for every chain, passing the environment's chain id as `chainid`. One Etherscan API key covers every chain that API supports.

For an explorer that is not on Etherscan's V2 API, use the `--endpoint` option.

### Sourcify

Sourcify supports all EVM chains. The default endpoint is `https://sourcify.dev/server`.

### Blockscout

Blockscout is self-hosted by many chains. A default API url is known for Ethereum, Sepolia, Optimism, OP Sepolia, Base, Base Sepolia, Gnosis, Gnosis Chiado, Ethereum Classic and zkSync Era (among others); for any other chain, use the `--endpoint` option to give the chain's Blockscout API v2 url.

## Examples

### Verify All Contracts on Mainnet

```bash
# Set your API key
export ETHERSCAN_API_KEY=your-api-key

# Verify all deployed contracts
rocketh-verify -e mainnet etherscan
```

### Verify Specific Contracts

```typescript
import {run} from '@rocketh/verifier';

await run(config, 'mainnet', {
	verifier: {
		type: 'etherscan',
		apiKey: process.env.ETHERSCAN_API_KEY,
	},
	deploymentNames: ['Token', 'TokenSale'], // Only verify these
});
```

### Verify on Multiple Platforms

```bash
# Verify on Etherscan
rocketh-verify -e mainnet etherscan

# Also verify on Sourcify for decentralized verification
rocketh-verify -e mainnet sourcify
```

### Custom Deployments Folder

```bash
rocketh-verify -d ./custom-deployments -e mainnet etherscan
```

## Troubleshooting

### "Already Verified"

This is not an error - it means the contract is already verified on the platform.

### Rate Limiting

Use `--min-interval` to add delays between verification requests:

```bash
rocketh-verify -e mainnet etherscan --min-interval 5000
```

### Missing API Key

Etherscan requires an API key, set as `ETHERSCAN_API_KEY`. Get one at [Etherscan](https://etherscan.io/apis): with the V2 API the same key works for every chain it supports.

### Wrong Network Endpoint

For an Etherscan-compatible explorer outside Etherscan's V2 API, pass its API endpoint (the verifier appends `?chainid=<id>` and the usual query parameters to it):

```bash
rocketh-verify -e mychain etherscan --endpoint https://explorer.example/api
```

## Related Packages

- [`rocketh`](../rocketh) - Core deployment environment
- [`@rocketh/node`](../rocketh-node) - Node.js deployment executor
- [`@rocketh/deploy`](../rocketh-deploy) - Standard deployment functions

## License

[MIT](../../LICENSE)
