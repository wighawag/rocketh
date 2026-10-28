# @rocketh/unknown-signer

`catchUnknownSigner` and `withUnknownSignerPolicy` for rocketh. When a transaction's `from` is an account rocketh cannot sign for (a Safe, a timelock, an unplugged hardware wallet), rocketh by default pauses, prints the transaction and checks the hash you paste back, with nothing to install. This package is for the other workflow: `catchUnknownSigner` hands the transaction back as a value and lets the script carry on (hardhat-deploy v1's helper, for migrating a v1 script or a run that must never block), and `withUnknownSignerPolicy` sets the policy for one call.

## Installation

```bash
pnpm add -D @rocketh/unknown-signer
# or
npm install --save-dev @rocketh/unknown-signer
```

## Wiring it up

`@rocketh/unknown-signer` is an extension: spread it into `extensions` in `rocketh/config.ts`, and your deploy scripts receive its functions.

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';
import * as unknownSignerExtension from '@rocketh/unknown-signer';

const extensions = {...deployExtension, ...unknownSignerExtension};
export {extensions};
```

## Example

```typescript
const deferred = await catchUnknownSigner(() =>
	deployViaProxy('Vault', {account: deployer, artifact: artifacts.Vault, args: []}, {owner: safe}),
);
if (deferred) {
	// {from, to, value, data}: execute it on the Safe, then run the script again
}
```

Unlike v1, the action is a function (`() => deployViaProxy(...)`), never a promise. `UnknownSignerError` is on the `@rocketh/unknown-signer/errors` subpath.

## Documentation

- [Unknown signers: deferring instead of asking](https://rocketh.dev/documentation/unknown-signers/#deferring-instead-of-asking-catchunknownsigner)
- [catchUnknownSigner in a migrated script](https://rocketh.dev/hardhat-deploy/migration/#catch-unknown-signer)
- [A Safe-owned project, end to end](https://rocketh.dev/documentation/safe-owned-project/)

The whole documentation is at [rocketh.dev](https://rocketh.dev), the hardhat-deploy section at [rocketh.dev/hardhat-deploy](https://rocketh.dev/hardhat-deploy/).

## License

[MIT](https://github.com/wighawag/rocketh/blob/main/LICENSE)
