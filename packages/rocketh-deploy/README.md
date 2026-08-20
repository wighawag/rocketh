# @rocketh/deploy

The standard deployment function for rocketh. `deploy` takes a compiled artifact and constructor arguments, deploys the contract if it is not already deployed, saves the deployment record, and returns it. Re-running a script that calls it is a no-op by default, which is what makes deploy scripts idempotent.

This is the package almost every rocketh project starts with. `@rocketh/proxy` and `@rocketh/diamond` build on it.

## Installation

```bash
# Using pnpm
pnpm add @rocketh/deploy

# Using npm
npm install @rocketh/deploy

# Using yarn
yarn add @rocketh/deploy
```

## Wiring it up

`@rocketh/deploy` is an **extension**: its root exports curried `(env) => …` functions, which rocketh turns into methods on the environment your deploy script receives. Spread the namespace into `extensions` in `rocketh/config.ts`:

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';

const extensions = {
	...deployExtension,
};
export {extensions};
```

Your deploy script then gets `deploy` with no `env` to thread:

```typescript
// deploy/deploy_Counter.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy('Counter', {
			account: deployer,
			artifact: artifacts.Counter,
			args: [42n],
		});
	},
	{tags: ['Counter', 'Counter_deploy']},
);
```

Outside a deploy script (in a test, or a standalone script) call the curried form directly:

```typescript
import {deploy} from '@rocketh/deploy';

const deployment = await deploy(env)('Counter', {account: 'deployer', artifact: artifacts.Counter, args: [42n]});
```

## What you get back

```typescript
type DeployResult<TAbi extends Abi> = Deployment<TAbi> & {newlyDeployed: boolean};
```

`newlyDeployed` is the flag to branch on when a follow-up step should run only on a first deployment (seeding, an initial `transferOwnership`, and so on):

```typescript
const token = await deploy('Token', {account: deployer, artifact: artifacts.Token, args: [name, symbol]});

if (token.newlyDeployed) {
	await execute(token, {account: deployer, functionName: 'mint', args: [treasury, 1000n]});
}
```

## Deployment arguments

```typescript
deploy(name, {account, artifact, args?, value?, ...}, options?)
```

| Field      | Description                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| `account`  | A **named account** (`'deployer'`) or a raw address. Named accounts are resolved per network from your config. |
| `artifact` | The compiled artifact (ABI + bytecode). Typed with `abitype`, so `args` are checked against the constructor.   |
| `args`     | Constructor arguments, type-checked against the artifact's ABI.                                                |
| `value`    | Wei to send to a `payable` constructor.                                                                        |

Remaining fields come from viem's `DeployContractParameters` (minus `bytecode`, `account`, `abi` and `chain`, which rocketh supplies).

## Options

```typescript
type DeployOptions = {
	linkedData?: LinkedDataProvided;
	deterministic?: boolean | `0x${string}` | {type: 'create2' | 'create3'; salt?: `0x${string}`};
	libraries?: {[name: string]: Address};
} & ({skipIfAlreadyDeployed?: boolean} | {alwaysOverride?: boolean} | {strictBytecodeMatch?: boolean});
```

### Re-deployment control

The last three options are **mutually exclusive** in the type, because they are three answers to one question: when should an existing deployment be replaced?

- **Default** - redeploy when the bytecode differs, ignoring the trailing CBOR metadata. Changing only a code comment does not trigger a redeployment.
- `alwaysOverride: true` - redeploy every run, no comparison.
- `strictBytecodeMatch: true` - compare bytecode byte-exactly, metadata included. Opt in only when you genuinely need it, since a comment change will then redeploy.
- `skipIfAlreadyDeployed: true` - keep any existing deployment regardless of bytecode.

See [`docs/adr/0004-non-strict-bytecode-matching-by-default.md`](https://github.com/wighawag/rocketh/blob/main/docs/adr/0004-non-strict-bytecode-matching-by-default.md) for the reasoning.

### Deterministic deployments

Deploy to an address that does not depend on the deployer's nonce, so the same contract lands on the same address across chains:

```typescript
// CREATE2 with a zero salt
await deploy('Token', {account: deployer, artifact: artifacts.Token}, {deterministic: true});

// CREATE2 with an explicit salt
await deploy('Token', {account: deployer, artifact: artifacts.Token}, {deterministic: '0x000...001'});

// CREATE3: address depends on deployer and salt only, not on the bytecode
await deploy('Token', {account: deployer, artifact: artifacts.Token}, {deterministic: {type: 'create3', salt}});
```

A bare `true` means CREATE2 with a zero salt; a hex string is a CREATE2 salt, left-padded to 32 bytes.

With `create2` the address is derived from the init code, so changing constructor arguments changes the address. With `create3` it is not: the address comes from the deployer and the salt alone, so the same address can host different bytecode across chains.

Both paths deploy through a factory that must be described by the chain's `deterministicDeployment` configuration. If it is missing, the deployment fails with `create2 deterministic deployment info not found` (or the `create3` equivalent). rocketh also checks that the code at the configured factory address really is that factory, rather than trusting an occupied address.

### Libraries

Pass the addresses of already-deployed libraries; rocketh links them into the bytecode:

```typescript
const math = await deploy('MathLib', {account: deployer, artifact: artifacts.MathLib});

await deploy('Consumer', {account: deployer, artifact: artifacts.Consumer}, {libraries: {MathLib: math.address}});
```

### Linked data

`linkedData` attaches arbitrary JSON to the deployment record, and it survives into exports consumed by a frontend. Useful for values a UI needs but cannot read from the chain cheaply.

Do **not** put secrets in `linkedData`: deployment records are committed and exported.

## Related packages

- [`rocketh`](https://www.npmjs.com/package/rocketh) - core environment and executor
- [`@rocketh/proxy`](https://www.npmjs.com/package/@rocketh/proxy) - upgradeable deployments built on this function
- [`@rocketh/diamond`](https://www.npmjs.com/package/@rocketh/diamond) - EIP-2535 Diamond deployments
- [`@rocketh/read-execute`](https://www.npmjs.com/package/@rocketh/read-execute) - call and transact against what you deployed
- [`@rocketh/node`](https://www.npmjs.com/package/@rocketh/node) - the `rocketh` CLI that runs your scripts

For full documentation, visit [rocketh.dev](https://rocketh.dev).

For hardhat-deploy documentation, see [rocketh.dev/hardhat-deploy/](https://rocketh.dev/hardhat-deploy/).
