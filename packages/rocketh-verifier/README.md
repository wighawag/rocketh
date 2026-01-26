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

# With custom endpoint (for Etherscan-compatible explorers)
rocketh-verify -e polygon etherscan --endpoint https://api.polygonscan.com/api
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

# With custom endpoint
rocketh-verify -e gnosis blockscout --endpoint https://blockscout.com/xdai/mainnet/api
```

### Export Metadata

Export contract metadata for manual verification:

```bash
rocketh-verify -e mainnet metadata --out ./metadata
```

## CLI Options

### Global Options

| Option | Description |
|--------|-------------|
| `-e, --environment <value>` | **(Required)** Environment/network name |
| `-d, --deployments <value>` | Deployments folder path |

### Etherscan Options

| Option | Description |
|--------|-------------|
| `--endpoint <value>` | Custom API endpoint |
| `--license <value>` | Source code license (e.g., MIT, GPL-3.0) |
| `--force-license` | Force the specified license |
| `--min-interval <value>` | Minimum interval between requests (ms) |
| `--fix-mispell` | Fix misspelled form fields (some APIs) |

**Environment Variable:** `ETHERSCAN_API_KEY`

### Sourcify Options

| Option | Description |
|--------|-------------|
| `--endpoint <value>` | Custom Sourcify endpoint |
| `--min-interval <value>` | Minimum interval between requests (ms) |

### Blockscout Options

| Option | Description |
|--------|-------------|
| `--endpoint <value>` | Custom Blockscout API endpoint |
| `--min-interval <value>` | Minimum interval between requests (ms) |

## Programmatic Usage

You can also use the verifier programmatically:

```typescript
import { run } from '@rocketh/verifier';

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
  deploymentNames?: string[];   // Specific contracts to verify
  minInterval?: number;         // Rate limiting (ms between requests)
  logErrorOnFailure?: boolean;  // Log errors instead of throwing
}
```

### Etherscan Options

```typescript
interface EtherscanOptions {
  type: 'etherscan';
  endpoint?: string;      // Custom API endpoint
  apiKey?: string;        // Etherscan API key
  license?: string;       // SPDX license identifier
  forceLicense?: boolean; // Override contract license
  fixMispell?: boolean;   // Fix API form field spelling
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

The verifier automatically detects the correct Etherscan endpoint for common networks:

| Network | Chain ID | Endpoint |
|---------|----------|----------|
| Ethereum Mainnet | 1 | api.etherscan.io |
| Goerli | 5 | api-goerli.etherscan.io |
| Sepolia | 11155111 | api-sepolia.etherscan.io |
| Polygon | 137 | api.polygonscan.com |
| Arbitrum | 42161 | api.arbiscan.io |
| Optimism | 10 | api-optimistic.etherscan.io |
| Base | 8453 | api.basescan.org |

For other networks, use the `--endpoint` option.

### Sourcify

Sourcify supports all EVM chains. The default endpoint is `https://sourcify.dev/server`.

### Blockscout

Blockscout is self-hosted by many chains. Use the `--endpoint` option to specify the correct API URL for your chain.

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
import { run } from '@rocketh/verifier';

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

Etherscan requires an API key. Get one at:
- [Etherscan](https://etherscan.io/apis)
- [Polygonscan](https://polygonscan.com/apis)
- [Arbiscan](https://arbiscan.io/apis)

### Wrong Network Endpoint

For Etherscan-compatible explorers, ensure you're using the correct API endpoint:

```bash
rocketh-verify -e bsc etherscan --endpoint https://api.bscscan.com/api
```

## Related Packages

- [`rocketh`](../rocketh) - Core deployment environment
- [`@rocketh/node`](../rocketh-node) - Node.js deployment executor
- [`@rocketh/deploy`](../rocketh-deploy) - Standard deployment functions

## License

[MIT](../../LICENSE)