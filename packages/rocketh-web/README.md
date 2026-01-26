# @rocketh/web

Browser-compatible deployment execution for Rocketh. This package allows you to run Rocketh deploy scripts directly in web browsers.

## Features

- 🌐 **Browser-First** - Execute deploy scripts in any web browser
- 💾 **IndexedDB Storage** - Load deployments from browser storage (planned)
- 🔌 **Wallet Integration** - Works with browser wallet providers
- 🔧 **Full Rocketh Compatibility** - Same API as Node.js environment

## Installation

```bash
# Using pnpm
pnpm add @rocketh/web

# Using npm
npm install @rocketh/web

# Using yarn
yarn add @rocketh/web
```

## Usage

### Setting Up the Environment

```typescript
import { setupEnvironment } from '@rocketh/web';
import { config, extensions } from './rocketh/config.js';

const { loadAndExecuteDeploymentsFromModules, loadEnvironment } = setupEnvironment(config, extensions);
```

### Loading an Environment

Use `loadEnvironment` to create an environment without executing deploy scripts:

```typescript
import { setupEnvironment } from '@rocketh/web';
import { config, extensions } from './rocketh/config.js';

const { loadEnvironment } = setupEnvironment(config, extensions);

// Connect to a network via the browser provider
const env = await loadEnvironment({
  environment: 'mainnet',
  provider: window.ethereum, // Use browser wallet provider
});

// Access deployments
const myContract = env.get('MyContract');
console.log('Contract address:', myContract.address);
```

### Executing Deploy Scripts

Use `loadAndExecuteDeploymentsFromModules` to run deploy scripts in the browser:

```typescript
import { setupEnvironment } from '@rocketh/web';
import { config, extensions } from './rocketh/config.js';
import deployMyContract from './deploy/deploy_MyContract.js';

const { loadAndExecuteDeploymentsFromModules } = setupEnvironment(config, extensions);

// Execute deploy scripts
const env = await loadAndExecuteDeploymentsFromModules(
  [
    { id: 'deploy_MyContract', module: deployMyContract },
  ],
  {
    environment: 'sepolia',
    provider: window.ethereum,
  }
);
```

### Loading Deployments from IndexedDB

```typescript
import { loadDeploymentsFromIndexedDB } from '@rocketh/web';

const { deployments, migrations, chainId, genesisHash } = await loadDeploymentsFromIndexedDB(
  'deployments',
  'mainnet',
  true, // onlyABIAndAddress - load minimal data
  {
    chainId: '1',
    genesisHash: '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3',
  }
);
```

## API Reference

### `setupEnvironment(config, extensions)`

Creates environment helpers for browser deployment.

**Parameters:**
- `config` - Rocketh user configuration
- `extensions` - Extension functions (e.g., deploy, read, execute)

**Returns:**
- `loadAndExecuteDeploymentsFromModules` - Execute deploy scripts
- `loadEnvironment` - Load environment without executing scripts

### `loadDeploymentsFromIndexedDB(deploymentsPath, networkName, onlyABIAndAddress?, expectedChain?)`

Loads deployments from IndexedDB storage.

**Parameters:**
- `deploymentsPath` - Path/key for deployments in storage
- `networkName` - Name of the network/environment
- `onlyABIAndAddress` - If true, load only essential data
- `expectedChain` - Optional chain validation

**Returns:**
- `deployments` - Record of deployed contracts
- `migrations` - Record of executed migrations
- `chainId` - Chain ID string
- `genesisHash` - Genesis block hash

## Use Cases

### In-Browser Deployment Tools

Build deployment dashboards that allow users to deploy contracts directly from the browser:

```typescript
async function deployFromBrowser() {
  const { loadAndExecuteDeploymentsFromModules } = setupEnvironment(config, extensions);
  
  try {
    const env = await loadAndExecuteDeploymentsFromModules(
      deployModules,
      {
        environment: 'sepolia',
        provider: window.ethereum,
        tags: ['MyContract'], // Deploy specific tags
      }
    );
    
    console.log('Deployment complete!');
    return env.deployments;
  } catch (error) {
    console.error('Deployment failed:', error);
  }
}
```

### DApp Development

Load existing deployments in your DApp frontend:

```typescript
import { setupEnvironment } from '@rocketh/web';
import { createPublicClient, custom } from 'viem';

const { loadEnvironment } = setupEnvironment(config, extensions);

async function initializeApp() {
  const env = await loadEnvironment({
    environment: 'mainnet',
    provider: window.ethereum,
  });
  
  // Use deployed contracts
  const token = env.get('Token');
  
  // Create viem client for interactions
  const client = createPublicClient({
    chain: env.network.chain,
    transport: custom(window.ethereum),
  });
  
  // Read contract data
  const balance = await client.readContract({
    address: token.address,
    abi: token.abi,
    functionName: 'balanceOf',
    args: [userAddress],
  });
}
```

## Limitations

- **Storage**: IndexedDB storage implementation is currently a stub. Deployments must be bundled or fetched from an API.
- **No File System**: Cannot read deploy scripts from filesystem - scripts must be imported directly.

## Related Packages

- [`rocketh`](../rocketh) - Core deployment environment
- [`@rocketh/deploy`](../rocketh-deploy) - Standard deployment functions
- [`@rocketh/node`](../rocketh-node) - Node.js deployment executor

## License

[MIT](../../LICENSE)