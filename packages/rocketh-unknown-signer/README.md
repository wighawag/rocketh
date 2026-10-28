# @rocketh/unknown-signer

`withUnknownSignerPolicy` and `catchUnknownSigner` for rocketh. When a transaction's `from` is an account rocketh cannot sign for (a Safe, a timelock, an unplugged hardware wallet), rocketh handles it with nothing to install: from a terminal it pauses, prints the transaction and checks the hash you paste back; unattended it defers and stops the run, and a `guard` makes the re-run converge. This package adds two helpers on top:

- `withUnknownSignerPolicy` sets the policy (`ask`, `throw`, `auto`) for one call, for example to rehearse the pause on a fork.
- `catchUnknownSigner` is hardhat-deploy v1's helper, kept for ported v1 scripts: it hands the deferred transaction back as a value and lets the script carry on.

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
// this one call pauses and asks, even though the run's policy is 'throw'
const receipt = await withUnknownSignerPolicy('ask', () =>
	execute(proxy, {account: 'safeOwner', functionName: 'upgradeTo', args: [newImplementation.address]}),
);
```

Both helpers take a function (`() => execute(...)`), never a promise. `UnknownSignerError` is on the `@rocketh/unknown-signer/errors` subpath.

## Documentation

- [Handling unknown signers](https://rocketh.dev/documentation/unknown-signers/)
- [catchUnknownSigner in a migrated script](https://rocketh.dev/hardhat-deploy/migration/#catch-unknown-signer)
- [A Safe-owned project, end to end](https://rocketh.dev/documentation/safe-owned-project/)

The whole documentation is at [rocketh.dev](https://rocketh.dev), the hardhat-deploy section at [rocketh.dev/hardhat-deploy](https://rocketh.dev/hardhat-deploy/).
