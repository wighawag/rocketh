# @rocketh/core

Shared types and utilities for the rocketh packages. This is the bottom of the dependency graph: it defines the `Environment`, `Deployment`, `Artifact` and `Signer` types every other package speaks, plus the helpers they all need (ABI merging, bigint-safe JSON, the extension mechanism).

**Most users never install this directly.** You get it transitively through `rocketh`, `@rocketh/node` and the extension packages, and the types are re-exported from those. Install it when you are **writing your own rocketh extension** and need the types without pulling in a runtime.

## Installation

```bash
# Using pnpm
pnpm add @rocketh/core

# Using npm
npm install @rocketh/core

# Using yarn
yarn add @rocketh/core
```

## Subpath exports

The package is split so a consumer can import just the slice it needs.

| Subpath                     | Contents                                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `@rocketh/core`             | Everything below, re-exported.                                                                        |
| `@rocketh/core/types`       | All types: `Environment`, `Deployment`, `Artifact`, `Signer`, `DeploymentConstruction`, and the rest. |
| `@rocketh/core/artifacts`   | `mergeABIs`, `mergeArtifacts`.                                                                        |
| `@rocketh/core/json`        | bigint-safe JSON helpers.                                                                             |
| `@rocketh/core/environment` | `withEnvironment`, `enhanceEnvIfNeeded`.                                                              |
| `@rocketh/core/providers`   | `TransactionHashTrackerProvider`.                                                                     |

Account resolution is not a standalone helper: `resolveAccount` and `resolveAccountOrUndefined` are **methods on `Environment`**.

```typescript
const deployer = env.resolveAccount('deployer'); // -> `0x${string}`
```

Type-only imports should use `@rocketh/core/types`:

```typescript
import type {Environment, Deployment, Artifact} from '@rocketh/core/types';
```

## Writing an extension

An **extension** is a package whose root exports curried `(env) => …` functions. `withEnvironment` turns each one into a method on the environment a deploy script receives, which is why a script writes `deploy(...)` and never threads `env` by hand.

```typescript
// my-extension/src/index.ts
import type {Environment} from '@rocketh/core/types';

export function greet(env: Environment): (name: string) => void {
	return (name: string) => {
		env.showMessage(`hello ${name} on chain ${env.network.chain.id}`);
	};
}
```

Users spread it alongside the others:

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';
import * as myExtension from 'my-extension';

const extensions = {...deployExtension, ...myExtension};
```

### The root export surface may contain only curried functions

`withEnvironment` calls `value(env)` on **every** entry it is given. A class or a plain constant on the root is therefore refused by name:

```
extension entry "Foo" is a class, which cannot be called with the environment
```

Since this surfaces when a deploy script runs rather than at build time, the naming is what makes it diagnosable. Put anything that is not a curried function on a **subpath export**. `@rocketh/unknown-signer` keeps `UnknownSignerError` on `./errors` for exactly this reason.

A _getter_, meaning `(env) => value` returning a non-function, is a supported second shape and becomes a property. The check is on the entry being callable, never on what it returns.

## Utilities

### `mergeABIs(abis, options?)` / `mergeArtifacts(artifacts)`

Combine several ABIs into one, detecting selector collisions. This is what lets `@rocketh/diamond` present a set of facets as a single contract.

### JSON helpers

Deployment records contain `bigint` values, which `JSON.stringify` refuses. `JSONToString` and `stringToJSON` round-trip them, with `postfixBigIntReplacer` / `postfixBigIntReviver` as the underlying replacer/reviver pair, and `toJSONCompatibleLinkedData` for `linkedData`.

### `UnknownSignerError`

Thrown when a transaction's `from` is an address rocketh cannot get a signature for. Carries the transaction and, where the call site knew it, the contract method and arguments, so the message names the call to run out of band rather than just an address. See [`@rocketh/unknown-signer`](https://www.npmjs.com/package/@rocketh/unknown-signer) for the `catchUnknownSigner` helper built on it.

### `TransactionHashTrackerProvider`

An EIP-1193 provider wrapper that records the transaction hashes passing through it.

## A note on `Signer`

The `Signer` union has **three** variants, and they are easy to get backwards:

| Variant      | Meaning                                                             | Broadcast path                                       |
| ------------ | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `signerOnly` | We hold the signing material and sign **locally**.                  | `eth_signTransaction`, then `eth_sendRawTransaction` |
| `wallet`     | An external wallet signs on the user's behalf (browser / injected). | `eth_sendTransaction`                                |
| `remote`     | The node or provider signs.                                         | `eth_sendTransaction`                                |

`signerOnly`, not `wallet`, is the locally-signing one. [`@rocketh/signer`](https://www.npmjs.com/package/@rocketh/signer)'s `privateKey` protocol returns it, as should any user-supplied protocol exposing `eth_signTransaction` (a hardware wallet, an HSM).

Note also that **signability is not the same as having an entry in `addressSigners`**: a named account declared as a bare address resolves to a `remote` signer whether or not the node actually knows it.

## Related packages

- [`rocketh`](https://www.npmjs.com/package/rocketh) - the environment and executor built on these types
- [`@rocketh/node`](https://www.npmjs.com/package/@rocketh/node) - Node.js executor adapter
- [`@rocketh/web`](https://www.npmjs.com/package/@rocketh/web) - browser executor adapter
- [`@rocketh/test-utils`](https://www.npmjs.com/package/@rocketh/test-utils) - test helpers for extension authors

For full documentation, visit [rocketh.dev](https://rocketh.dev).

For hardhat-deploy documentation, see [rocketh.dev/hardhat-deploy/](https://rocketh.dev/hardhat-deploy/).
