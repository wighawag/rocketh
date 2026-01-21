# @rocketh/test-utils

Test utilities for rocketh packages. This package provides helpers for creating test environments and mock artifacts.

## Features

- **Mock Provider**: Create a configurable EIP-1193 provider that simulates blockchain responses
- **Test Environment Creation**: Create mock environments with named accounts and providers for testing
- **Mock Artifacts**: Generate mock contract artifacts for testing deployments
- **Library Support**: Create mock artifacts with library references for testing library linking

## Installation

```bash
pnpm add @rocketh/test-utils --dev
```

## Usage

### Creating a Test Environment

```typescript
import {createMockEnvironment} from '@rocketh/test-utils';

const {env, provider, deployments} = createMockEnvironment();

// env: A fully configured Environment object
// provider: A mock EIP1193 provider (with configurable responses)
// deployments: A record to track saved deployments
```

The test environment includes:
- Pre-configured named accounts (deployer, user1, user2)
- A mock provider with sensible default responses
- Mock deployment tracking
- Auto-mine support for testing

### Configuring Custom Provider Responses

You can configure the mock provider to return specific values for testing different scenarios:

```typescript
import {createMockEnvironment} from '@rocketh/test-utils';

// Configure responses at creation time
const {env, provider} = createMockEnvironment({
  providerConfig: {
    responses: {
      eth_getCode: '0x6080...', // Return deployed bytecode
      eth_getBalance: '0x0', // Return zero balance
    },
  },
});

// Or update responses dynamically during tests
provider.setResponse('eth_getCode', '0x'); // Reset to empty
provider.setResponse('eth_getBalance', (params) => {
  const address = params?.[0];
  return address === '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' 
    ? '0x0' 
    : '0x1000';
});
```

### Inspecting Provider Requests

The mock provider records all requests, which you can inspect in tests:

```typescript
const {provider} = createMockEnvironment();

// ... perform operations ...

// Get all recorded requests
const requests = provider.getRequests();
console.log(requests);
// [
//   { method: 'eth_sendTransaction', params: [...] },
//   { method: 'eth_getCode', params: ['0x...', 'latest'] },
// ]

// Clear requests between test cases
provider.clearRequests();
```

### Creating Mock Artifacts

```typescript
import {createMockArtifact} from '@rocketh/test-utils';

const artifact = createMockArtifact('MyContract', [
  {
    type: 'function',
    name: 'getValue',
    inputs: [],
    outputs: [{type: 'uint256'}],
    stateMutability: 'view',
  },
  {
    type: 'constructor',
    inputs: [{type: 'uint256', name: '_initialValue'}],
    stateMutability: 'nonpayable',
  },
]);
```

### Creating Mock Artifacts with Libraries

```typescript
import {createMockArtifactWithLibrary} from '@rocketh/test-utils';

const artifact = createMockArtifactWithLibrary('Calculator', 'MathLib');
```

## Example: Writing Integration Tests

```typescript
import {describe, it, expect} from 'vitest';
import {deploy} from '@rocketh/deploy';
import {createMockEnvironment, createMockArtifact} from '@rocketh/test-utils';

describe('My Contract Tests', () => {
  it('should deploy a contract', async () => {
    const {env} = createMockEnvironment();
    const _deploy = deploy(env);

    const artifact = createMockArtifact('MyContract');

    const deployment = await _deploy('MyContract', {
      account: 'deployer',
      artifact,
      args: [42n],
    });

    expect(deployment.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('should test deterministic deployment with existing code', async () => {
    const {env, provider} = createMockEnvironment();
    
    // Simulate that a contract is already deployed at the deterministic address
    provider.setResponse('eth_getCode', '0x6080604052...');
    
    const _deploy = deploy(env);
    const artifact = createMockArtifact('MyContract');

    const deployment = await _deploy('MyContract', {
      account: 'deployer',
      artifact,
      args: [],
    }, {
      deterministic: {
        type: 'create2',
        salt: '0x1234...',
      },
    });

    // Contract was found, not newly deployed
    expect(deployment.newlyDeployed).toBe(false);
  });
});
```

## Default Provider Responses

The mock provider includes sensible defaults for common RPC methods:

| Method | Default Response |
|--------|------------------|
| `eth_sendTransaction` | Returns incrementing tx hashes |
| `eth_sendRawTransaction` | Returns incrementing tx hashes |
| `eth_getCode` | Returns `'0x'` (no code deployed) |
| `eth_getBalance` | Returns high balance (1000 ETH) |
| `evm_mine` | No-op |
| `eth_getTransactionReceipt` | Returns mock receipt with contract address |
| `eth_chainId` | Returns `'0x7a69'` (31337) |
| `eth_blockNumber` | Returns `'0x1'` |
| `eth_gasPrice` | Returns `'0x3b9aca00'` (1 gwei) |
| `eth_estimateGas` | Returns `'0x5208'` (21000) |
| `eth_getTransactionCount` | Returns `'0x0'` |

## API Reference

### `createMockEnvironment(options?)`

Creates a mock environment for testing.

**Options:**
- `providerConfig`: Configuration for the mock provider
  - `responses`: Object mapping RPC methods to responses (static values or functions)
  - `onUnmockedMethod`: Callback for handling unmocked methods
- `namedAccounts`: Custom named accounts (default: deployer, user1, user2)
- `chainId`: Chain ID (default: 31337)
- `chainName`: Chain name (default: 'localhost')
- `tags`: Environment tags

**Returns:** `{ env, provider, deployments }`

### `createMockProvider(config?)`

Creates a standalone mock EIP-1193 provider.

**Methods:**
- `request({ method, params })`: Make an RPC request
- `setConfig(config)`: Update the full configuration
- `setResponse(method, response)`: Set a specific method response
- `getRequests()`: Get all recorded requests
- `clearRequests()`: Clear recorded requests

### `createMockArtifact(name, abi?)`

Creates a mock contract artifact.

### `createMockArtifactWithLibrary(name, libraryName, abi?)`

Creates a mock contract artifact with library references.

## License

MIT