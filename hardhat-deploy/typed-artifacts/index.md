# Typed artifacts

After every successful compilation (`hardhat compile`, the compilation `hardhat deploy` and `hardhat test` start with), hardhat-deploy writes your contracts' artifacts and ABIs as TypeScript or JavaScript modules, typed `as const`. A deploy script imports an artifact from them, and the type of its ABI is what checks the constructor arguments you pass to `deploy` and the function names you pass to `execute` and `read`.

## Configuring it

`generateTypedArtifacts` in `hardhat.config.ts` lists where to write them, and in which form:

```typescript
export default defineConfig({
	plugins: [HardhatDeploy],
	generateTypedArtifacts: {
		destinations: [{folder: './generated', mode: 'typescript'}],
	},
	// ...
});
```

| Key                     | Default         | Meaning                                                                           |
| ----------------------- | --------------- | --------------------------------------------------------------------------------- |
| `destinations`          | one, as below   | Where to write. Several destinations each get the full set.                       |
| `destinations[].folder` | `'./generated'` | The folder, relative to the project.                                              |
| `destinations[].mode`   | `'javascript'`  | `'typescript'` (`.ts` files), or `'javascript'` (`.js` files with `.d.ts` types). |

Without the key, the artifacts are written as JavaScript to `./generated`. The folder is generated: keep it out of version control.

## What is written

```text
generated/
  artifacts/
    GreetingsRegistry.ts     export const Artifact_GreetingsRegistry = {...} as const
    index.ts                 export {Artifact_GreetingsRegistry as GreetingsRegistry} from './GreetingsRegistry.js'
  abis/
    GreetingsRegistry.ts     export type Abi_GreetingsRegistry, export const Abi_GreetingsRegistry
    IGreetingsRegistry.ts
    index.ts
```

- `artifacts/` holds every contract that has bytecode (an interface or an abstract contract has none): the ABI, the bytecode, the metadata, and what else the compiler produced. `artifacts/index.js` exports each one under its contract name.
- `abis/` holds the ABI of every contract, interfaces included, as a type (`Abi_<Name>`) and a value.
- A contract name used in two source files is written under its path (`artifacts/<folder>/<Name>`) and exported from the index as `<folder>_<Name>`, so neither shadows the other.

## Using them

Your `rocketh/deploy.ts` re-exports the artifacts, so a deploy script imports them next to `deployScript`:

```typescript
// rocketh/deploy.ts
import * as artifacts from '../generated/artifacts/index.js';
export {artifacts};
```

```typescript
// deploy/001_deploy_greetings_registry.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		// `args` is checked against GreetingsRegistry's constructor
		await deploy('GreetingsRegistry', {
			account: namedAccounts.deployer,
			artifact: artifacts.GreetingsRegistry,
			args: [''],
		});
	},
	{tags: ['GreetingsRegistry']},
);
```

Deployments are untyped (what is on chain may be older than your artifacts), so a test or a script gives a deployment its type from the ABI module:

```typescript
import type {Abi_GreetingsRegistry} from '../generated/abis/GreetingsRegistry.js';

const registry = env.get<Abi_GreetingsRegistry>('GreetingsRegistry');
const message = await env.read(registry, {functionName: 'messages', args: [deployer]});
```

The same modules are what a frontend or another package imports, see [Share contracts between projects](/documentation/sharing-contracts/).
