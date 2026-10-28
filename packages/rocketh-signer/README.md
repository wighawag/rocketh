# @rocketh/signer

The `privateKey` signer protocol for rocketh: a named account written `privateKey:0x<64 hex>` (or the bare key) is signed for locally, with that key.

## Installation

```bash
pnpm add -D @rocketh/signer
# or
npm install --save-dev @rocketh/signer
```

## Example

```typescript
// rocketh/config.ts
import type {UserConfig} from 'rocketh/types';
import {privateKey} from '@rocketh/signer';

export const config = {
	accounts: {
		// read the key from the environment, never from the file
		deployer: {default: 0, sepolia: `privateKey:${process.env.DEPLOYER_PRIVATE_KEY}`},
	},
	signerProtocols: {privateKey},
	data: {},
} as const satisfies UserConfig;
```

A protocol of your own (a hardware wallet, a KMS) is a function registered the same way under another name.

## Documentation

- [Named accounts and signers](https://rocketh.dev/documentation/named-accounts/)
- [Signer protocols](https://rocketh.dev/documentation/named-accounts/#signer-protocols)

The whole documentation is at [rocketh.dev](https://rocketh.dev), the hardhat-deploy section at [rocketh.dev/hardhat-deploy](https://rocketh.dev/hardhat-deploy/).

## License

[MIT](https://github.com/wighawag/rocketh/blob/main/LICENSE)
