# @rocketh/core

The types and utilities every rocketh package shares: `Environment`, `Deployment`, `Artifact`, `Signer`, `UserConfig` and the rest, plus ABI merging, bigint-safe JSON and `withEnvironment`, which turns extensions into methods of the environment a deploy script receives. It is the bottom of the dependency graph and has no runtime of its own.

Most projects never install it: it comes with `rocketh` and the extensions, which re-export its types. Install it to write your own extension against the types without pulling in a runtime.

## Installation

```bash
pnpm add @rocketh/core
# or
npm install @rocketh/core
```

## Example

```typescript
// my-extension/src/index.ts
import type {Environment} from '@rocketh/core/types';

export function greet(env: Environment): (name: string) => void {
	return (name) => env.showMessage(`hello ${name} on chain ${env.network.chain.id}`);
}
```

An extension package's root may export only such curried `(env) => ...` functions (or getters); anything else goes on a subpath. The subpaths are `@rocketh/core/types`, `/artifacts`, `/json`, `/environment` and `/providers`.

## Documentation

- [Writing an extension](https://rocketh.dev/documentation/extending/)
- [The environment](https://rocketh.dev/documentation/reference/environment/)
- [Architecture](https://rocketh.dev/documentation/extending/architecture/)

The whole documentation is at [rocketh.dev](https://rocketh.dev), the hardhat-deploy section at [rocketh.dev/hardhat-deploy](https://rocketh.dev/hardhat-deploy/).

## License

[MIT](https://github.com/wighawag/rocketh/blob/main/LICENSE)
