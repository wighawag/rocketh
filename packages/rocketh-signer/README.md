# @rocketh/signer

Signer protocol implementations for Rocketh. This package provides a way to configure and use different signing mechanisms in your deployment scripts.

## Features

- 🔐 **Private Key Signing** - Sign transactions using raw private keys
- 🔌 **Protocol-Based** - Extensible signer protocol system
- 🛡️ **Type Safe** - Full TypeScript support for signer configuration

## Installation

```bash
# Using pnpm
pnpm add @rocketh/signer

# Using npm
npm install @rocketh/signer

# Using yarn
yarn add @rocketh/signer
```

## Usage

### Configuring the Signer Protocol

Add the signer protocol to your Rocketh configuration:

```typescript
// rocketh/config.ts
import type { UserConfig } from 'rocketh/types';
import { privateKey } from '@rocketh/signer';

export const config = {
  accounts: {
    deployer: {
      default: 0,
    },
  },
  signerProtocols: {
    privateKey: privateKey,
  },
  data: {},
} as const satisfies UserConfig;
```

### Using Private Key Signer

The private key signer allows you to sign transactions using a raw private key:

```typescript
// In your environment variables or configuration
// Format: privateKey:0x{64-character-hex-string}

// Example .env file:
// DEPLOYER_SIGNER=privateKey:0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Protocol String Format

The signer uses a protocol string format:

```
{protocol}:{data}
```

For the private key signer:
```
privateKey:0x{privateKeyHex}
```

**Example:**
```
privateKey:0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## API Reference

### `privateKey`

A signer protocol function that creates a signer from a private key.

**Type:**
```typescript
const privateKey: SignerProtocolFunction
```

**Protocol String Format:**
```
privateKey:0x{64-hex-characters}
```

**Returns:**
```typescript
{
  type: 'signerOnly';
  signer: EIP1193LocalSigner;
}
```

**Throws:**
- Error if the private key doesn't start with `0x`

## Creating Custom Signer Protocols

You can create custom signer protocols by implementing the `SignerProtocolFunction` interface:

```typescript
import type { SignerProtocolFunction, Signer } from '@rocketh/core/types';

// Example: Hardware wallet signer
export const ledger: SignerProtocolFunction = async (protocolString: string) => {
  const [proto, derivationPath] = protocolString.split(':');
  
  // Connect to hardware wallet and get signer
  const hardwareSigner = await connectToLedger(derivationPath);
  
  return {
    type: 'signerOnly',
    signer: hardwareSigner,
  };
};

// Example: Cloud KMS signer
export const awsKms: SignerProtocolFunction = async (protocolString: string) => {
  const [proto, keyId] = protocolString.split(':');
  
  // Connect to AWS KMS
  const kmsSigner = await createKmsSigner(keyId);
  
  return {
    type: 'signerOnly',
    signer: kmsSigner,
  };
};
```

Then register in your config:

```typescript
// rocketh/config.ts
import { privateKey } from '@rocketh/signer';
import { ledger, awsKms } from './custom-signers.js';

export const config = {
  signerProtocols: {
    privateKey,
    ledger,
    awsKms,
  },
  // ...
} as const satisfies UserConfig;
```

## Signer Types

Rocketh supports three signer types:

### `signerOnly`
A signer that can only sign transactions (no sending capability):
```typescript
{
  type: 'signerOnly';
  signer: EIP1193SignerProvider;
}
```

### `remote`
A remote signer (e.g., JSON-RPC provider):
```typescript
{
  type: 'remote';
  signer: EIP1193ProviderWithoutEvents;
}
```

### `wallet`
A full wallet provider (e.g., MetaMask):
```typescript
{
  type: 'wallet';
  signer: EIP1193WalletProvider;
}
```

## Security Considerations

⚠️ **Important Security Notes:**

1. **Never commit private keys** - Use environment variables or secure secret management
2. **Use hardware wallets for production** - Consider implementing a hardware wallet signer for mainnet deployments
3. **Limit private key exposure** - The private key signer is best suited for development and testing

### Recommended Practices

```bash
# .env (never commit this file!)
DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# .env.example (commit this as a template)
DEPLOYER_PRIVATE_KEY=privateKey:0x...
```

```typescript
// Use environment variable
const signerString = process.env.DEPLOYER_PRIVATE_KEY;
```

## Related Packages

- [`rocketh`](../rocketh) - Core deployment environment
- [`@rocketh/core`](../rocketh-core) - Core types and utilities
- [`eip-1193-signer`](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md) - EIP-1193 signer implementation

## License

[MIT](../../LICENSE)