# rocketh and hardhat-deploy Documentation

## Introduction

### What is rocketh?

rocketh is a framework-agnostic system for deploying smart contracts on Ethereum-compatible networks. It provides a minimal API to save and load deployments, making it easy to track and manage contract deployments across different networks.

Key features of rocketh include:

- Deployment tracking and management
- Deploy Scripts that can run anywhere, including in the browser
- Named accounts for easier contract interaction
- Deterministic deployments
- Library linking
- Support for various deployment strategies

### What is hardhat-deploy?

hardhat-deploy is a plugin for the Hardhat Ethereum development environment that leverages rocketh to provide a comprehensive deployment system. It makes it easy to deploy contracts to any network, keeping track of them and replicating the same environment for testing.

Key features of hardhat-deploy include:

- Integration with Hardhat's testing and task system
- Deployment scripts with tags and dependencies
- Named accounts for clearer tests and deployment scripts
- Support for specific deploy scripts per network
- Deployment retrying through saved pending transactions

### Relationship Between rocketh and hardhat-deploy

hardhat-deploy v2 is a complete rewrite that uses rocketh under the hood. While rocketh provides the core deployment functionality, hardhat-deploy integrates it with the Hardhat environment, making it accessible through Hardhat tasks and configuration.

rocketh is designed to be modular, with core functionality provided by separate packages like `@rocketh/deploy`, `@rocketh/proxy`, and `@rocketh/diamond`. hardhat-deploy wires these modules together and adds Hardhat-specific functionality.

## Architecture Overview

### rocketh Architecture

rocketh follows a modular architecture with several key components:

1. **Core Package (`rocketh`)**: Provides the basic environment and deployment tracking functionality.
2. **Deploy Package (`@rocketh/deploy`)**: Adds the `deploy` function to the environment.
3. **Proxy Package (`@rocketh/proxy`)**: Adds proxy deployment capabilities.
4. **Diamond Package (`@rocketh/diamond`)**: Adds diamond pattern deployment capabilities.
5. **Export Package (`@rocketh/export`)**: Provides functionality to export deployments for use in frontends.
6. **Verifier Package (`@rocketh/verifier`)**: Provides contract verification capabilities for Etherscan, Sourcify, etc.
7. **Doc Package (`@rocketh/doc`)**: Generates documentation for deployed contracts.
8. **Unknown Signer Package (`@rocketh/unknown-signer`)**: Adds `catchUnknownSigner`, for calls whose `from` is an account rocketh cannot sign for (a Safe multisig, a hardware wallet, a governance key).

Each package extends the core with additional functionality, allowing you to use only what you need.

### hardhat-deploy Architecture

hardhat-deploy integrates rocketh with Hardhat through:

1. **Plugin Registration**: Registers the `deploy` task with Hardhat.
2. **Config Hook Handler**: Processes Hardhat configuration to set up rocketh.
3. **Solidity Hook Handler**: Processes Solidity compilation results for use with rocketh.
4. **Deploy Task**: Executes deployment scripts using rocketh's `loadAndExecuteDeployments` function.

## Installation and Setup

### Installing rocketh and hardhat-deploy

```bash
# Using npm
npm install -D hardhat-deploy rocketh @rocketh/node @rocketh/deploy @rocketh/read-execute

# Using pnpm
pnpm add -D hardhat-deploy rocketh @rocketh/node @rocketh/deploy @rocketh/read-execute
```

Note that `@rocketh/node` is required for hardhat-deploy to function. this is a package that let rocketh read file and folders

For additional functionality, you can install these optional packages:

```bash
# Using npm
npm install -D @rocketh/proxy @rocketh/diamond @rocketh/export @rocketh/verifier @rocketh/doc

# Using pnpm
pnpm add -D @rocketh/proxy @rocketh/diamond @rocketh/export @rocketh/verifier @rocketh/doc
```

### Setting Up Your Project

There are several ways to configure rocketh, but here is our recommended approach

1. **Create a `rocketh` folder and add `config.ts/js` file (it has to be named this way) **

As you ll see by reading it, we also add some extra to make it easier to use later

```typescript
// rocketh/config.ts
/// ----------------------------------------------------------------------------
// Typed Config
// ----------------------------------------------------------------------------
import type {UserConfig} from 'rocketh/types';

// we define our config and export it as "config"
export const config = {
	accounts: {
		deployer: {
			default: 0,
		},
		admin: {
			default: 1,
		},
	},
	data: {},
} as const satisfies UserConfig;

// then we import each extensions we are interested in using in our deploy script or elsewhere

// this one provide a deploy function
import * as deployExtension from '@rocketh/deploy';
// this one provide read,execute functions
import * as readExecuteExtension from '@rocketh/read-execute';
// this one provide a deployViaProxy function that let you declaratively
//  deploy proxy based contracts
import * as deployProxyExtension from '@rocketh/proxy';
// this one provide a viem handle to clients and contracts
import * as viemExtension from '@rocketh/viem';

// and export them as a unified object
const extensions = {
	...deployExtension,
	...readExecuteExtension,
	...deployProxyExtension,
	...viemExtension,
};
export {extensions};

// then we also export the types that our config ehibit so other can use it

type Extensions = typeof extensions;
type Accounts = typeof config.accounts;
type Data = typeof config.data;

export type {Extensions, Accounts, Data};
```

2. **We also want to create 2 more files: `rocketh/deploy.ts/js` and `rocketh/environment.ts/js` (you can name them whatever you want)**

These files create the variosu utility functions we wll need later

- `deploy.ts` make use of only `rocketh` and allow deploy script to run in a web runtime if desired.
- `environment.ts` make use of `rocketh/node` to read the config file and is export function to be used in tests or scripts

```typescript
// rocketh/deploy.ts
import {type Accounts, type Data, type Extensions, extensions} from './config.js';

// ----------------------------------------------------------------------------
// we re-export the artifacts, so they are easily available from the alias
import * as artifacts from '../generated/artifacts/index.js';
export {artifacts};
// ----------------------------------------------------------------------------
// we create the rocketh functions we need by passing the extensions to the
//  setup function
import {setupDeployScripts} from 'rocketh';
const {deployScript} = setupDeployScripts<Extensions, Accounts, Data>(extensions);

export {deployScript};
```

```typescript
// rocketh/environment.ts
import {type Accounts, type Data, type Extensions, extensions} from './config.js';
import {setupEnvironmentFromFiles} from '@rocketh/node';
import {setupHardhatDeploy} from 'hardhat-deploy/helpers';

// useful for test and scripts, uses file-system
const {loadAndExecuteDeploymentsFromFiles} = setupEnvironmentFromFiles<Extensions, Accounts, Data>(extensions);
const {loadEnvironmentFromHardhat} = setupHardhatDeploy<Extensions, Accounts, Data>(extensions);

export {loadEnvironmentFromHardhat, loadAndExecuteDeploymentsFromFiles};
```

3. **Create a `deploy` folder** for your deployment scripts.

## Core Concepts

### Deployments and Environments

A deployment in rocketh represents a deployed contract on a specific environment.

An environment is a named network. You can thus have multiple environment for the same chain.

For example you can have sepolia environment and the sepolia2 environment both pointing to the same chain but having different deployments.

Each deployment includes:

- Contract address
- ABI
- Bytecode
- Constructor arguments
- Transaction details
- Metadata for verification

Deployments are saved to disk in the `deployments/<environment>` folder, allowing them to be tracked in version control and reused.

### Named Accounts

Named accounts allow you to refer to accounts by name rather than index or address. This makes your deployment scripts and tests more readable and maintainable.

Named accounts are configured in the `rocketh.ts` file:

```typescript
export const config = {
	accounts: {
		deployer: {
			default: 0,
			sepolia: 1,
		},
		admin: {
			default: 1,
		},
	},
} as const satisfies UserConfig;
```

In this example, `deployer` refers to the first account (index 0) on all environment except Sepolia, where it refers to the second account (index 1).

### Deploy Scripts

Deploy scripts are JavaScript or TypeScript files that define how contracts should be deployed. They use the `execute` function from rocketh to define a deployment function and its metadata (tags and dependencies).

Deploy scripts are placed in the `deploy` folder and are executed in alphabetical order when running the `hardhat deploy` task.

### Tags and Dependencies

Tags and dependencies allow you to control which deploy scripts are executed and in what order.

- **Tags**: Labels attached to deploy scripts that can be used to selectively execute them.
- **Dependencies**: Tags that a deploy script depends on, ensuring those scripts are executed first.

## Using rocketh

### The Environment Object

The environment object is passed to each deploy function and contains:

- Network information
- Named accounts and signers
- Functions to save and load deployments
- Functions provided by rocketh modules

### Deploying Contracts

The `deploy` function from `@rocketh/deploy` is used to deploy contracts:

```typescript
import {deployScript, artifacts} from '#rocketh';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy('GreetingsRegistry', {
			account: deployer,
			artifact: artifacts.GreetingsRegistry,
			args: [''],
		});
	},
	{tags: ['GreetingsRegistry', 'GreetingsRegistry_deploy']},
);
```

### Deploying Proxies

The `deployViaProxy` function from `@rocketh/proxy` allows you to deploy upgradeable contracts:

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async (env) => {
		const {deployer, admin} = env.namedAccounts;

		console.log({deployer, admin});

		const prefix = 'proxy:';
		const deployment = await env.deployViaProxy(
			'GreetingsRegistry',
			{
				account: deployer,
				artifact: artifacts.GreetingsRegistry,
				args: [prefix],
			},
			{
				owner: admin,
				linkedData: {
					prefix,
					admin,
				},
			},
		);
	},
	// execute takes as a second argument an options object where you can specify tags and dependencies
	{tags: ['GreetingsRegistry', 'GreetingsRegistry_deploy']},
);
```

### Deploying Diamonds

The `diamond` function from `@rocketh/diamond` allows you to deploy contracts using the Diamond pattern:

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({diamond, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await diamond(
			'MyDiamond',
			{
				account: deployer,
				facets: [
					{
						name: 'DiamondCutFacet',
						artifact: artifacts.DiamondCutFacet,
					},
					{
						name: 'DiamondLoupeFacet',
						artifact: artifacts.DiamondLoupeFacet,
					},
					{
						name: 'OwnershipFacet',
						artifact: artifacts.OwnershipFacet,
					},
				],
			},
			{
				owner: admin,
			},
		);
	},
	{tags: ['MyDiamond', 'MyDiamond_deploy']},
);
```

### Linking Libraries

rocketh supports linking libraries at deployment time:

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		// Deploy the library first
		const exampleLibrary = await deploy('ExampleLibrary', {
			account: deployer,
			artifact: artifacts.ExampleLibrary,
		});

		// Deploy a contract that uses the library
		await deploy(
			'Example',
			{
				account: deployer,
				artifact: artifacts.Example,
				args: ['example string argument'],
			},
			{
				libraries: {
					ExampleLibrary: exampleLibrary.address,
				},
			},
		);
	},
	{tags: ['Example', 'Example_deploy']},
);
```

### Deterministic Deployments

rocketh supports deterministic deployments using CREATE2:

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy(
			'GreetingsRegistry',
			{
				account: deployer,
				artifact: artifacts.GreetingsRegistry,
				args: [''],
			},
			{
				deterministic: true, // or a specific salt: "0x123..."
			},
		);
	},
	{tags: ['GreetingsRegistry', 'GreetingsRegistry_deploy']},
);
```

## Using hardhat-deploy with rocketh

### Configuring hardhat-deploy

hardhat-deploy is configured in your `hardhat.config.js` or `hardhat.config.ts` file:

### Running Deployments

To run your deployment scripts, use the `hardhat deploy` task:

```bash
npx hardhat deploy --network sepolia
```

You can also run specific tags:

```bash
npx hardhat deploy --network sepolia --tags GreetingsRegistry
```

### Using Deployments in Tests

You can use deployments in your Hardhat tests:

## Advanced Features

### Contract Verification

The `@rocketh/verifier` package provides contract verification capabilities:

```bash
npx rocketh-verify -e sepolia etherscan
```

### Exporting Deployments

The `@rocketh/export` package allows you to export deployments for use in frontends:

```bash
npx rocketh-export -e sepolia --ts ./src/contracts.ts
```

### Generating Documentation

The `@rocketh/doc` package generates documentation for your contracts:

```bash
npx rocketh-doc
```

### Handling unknown signers (Safe / multisig owners)

When a privileged call targets an account rocketh cannot sign for, the transaction surfaces as an `UnknownSignerError` carrying exactly what has to be executed out-of-band. The `@rocketh/unknown-signer` package lets you catch it, keep the run going, and get that transaction back:

```bash
npm install -D @rocketh/unknown-signer
```

```typescript
import {catchUnknownSigner} from '@rocketh/unknown-signer';
import {execute} from '@rocketh/read-execute';

// NOTE the call shape: the action is a FUNCTION, not an already-started promise.
//  This is the one mechanical change from a hardhat-deploy v1 script
//  (v1: `catchUnknownSigner(execute(...))`), because a promise has already begun
//  executing before the wrapper can establish its policy scope. The v1 form is a
//  compile error, and a JavaScript caller gets a runtime error naming the fix.
const deferred = await catchUnknownSigner(env)(() =>
	execute(env)(proxy, {account: 'safeOwner', functionName: 'upgradeTo', args: [newImplementation.address]}),
);

if (deferred) {
	// {from, to, value, data} — execute this on the Safe, then re-run the script.
}
```

It returns `null` when the action succeeded, and otherwise hardhat-deploy v1's exact shape: every key present even when `undefined`, `value` as a string. Pass `{log: false}` to suppress the printed block. Nothing is persisted — idempotency comes from on-chain state, so you execute the transaction on your Safe and re-run the idempotent script. One wrapper captures one transaction (the first unsignable one inside it), so deferring several steps means one `catchUnknownSigner` per step.

#### Resolving it interactively instead (`onUnknownSigner: 'ask'`)

If you are at a keyboard, rocketh can PAUSE instead of throwing: it prints the transaction, waits while you execute it out-of-band (on your Safe, a hardware wallet, an air-gapped machine), takes back the transaction hash you paste, and CONTINUES the same run with the deployment state saved. No re-run dance, and an action with several unsignable steps pauses at each one and finishes them all in a single run.

The behaviour is chosen by `onUnknownSigner`, resolved as execution parameter > chain config > the default `'auto'`:

| value     | what happens when a `from` is unsignable                                          |
| --------- | --------------------------------------------------------------------------------- |
| `'throw'` | raise `UnknownSignerError` immediately (the defer workflow above)                 |
| `'ask'`   | pause and ask, when the run can ask a human for text; otherwise behave as `throw` |
| `'auto'`  | the default: `ask` when the run can ask a human for text, `throw` when it cannot  |

Set it for a whole chain in `rocketh/config.ts`:

```typescript
export const config = {
	accounts: {
		/* ... */
	},
	chains: {
		11155111: {onUnknownSigner: 'ask'},
	},
	data: {},
} as const satisfies UserConfig;
```

or for one run, which wins over the chain config:

```typescript
await loadAndExecuteDeploymentsFromFiles({environment: 'sepolia', onUnknownSigner: 'ask'});
```

"Can the run ask a human for text?" is a CAPABILITY of the runtime, not a preference: it is true only when the run carries a `PromptExecutor` that implements `promptText`. `@rocketh/node` (the `rocketh` CLI and the hardhat-deploy path) supplies one **only when stdin is a terminal**; `@rocketh/web` deliberately never does, because a browser cannot sensibly ask you to paste a transaction hash. So a CI job, whose stdin is not a terminal, has no text capability at all and takes the `throw` path: it never blocks on a prompt, even under `'auto'` and even if a script hardcodes `'ask'`. Capability is a CEILING, not a default. (The TTY check is not politeness: the underlying prompt library, asked a question with no terminal behind it, never answers and never fails, so the only safe move is not to ask.)

At the pause you have two answers:

- **paste the transaction hash** — rocketh looks the transaction up on the network, waits for it to be mined, requires the receipt to report a SUCCESSFUL status, saves state through the same pending-transaction path a normal broadcast uses, records the hash for gas reporting, and returns the receipt to your script. It never sends a transaction of its own. A hash this node has never heard of (from the wrong network, or a typo that is still the right shape) is given a short grace period to show up and then reported as not found, with the transaction you still have to execute printed again, so the run stops rather than waiting for ever.
- **`cannot sign`** (or just press enter) — rocketh prints the full transaction and throws the same `UnknownSignerError` as the non-interactive path, so the interactive flow degrades cleanly into the defer workflow and is still caught by `catchUnknownSigner`. Aborting the prompt (Ctrl-C) does the same. A paste that is not a transaction hash is re-asked a couple of times and then also defers.

`catchUnknownSigner` always takes the throw path, whatever the ambient policy: a wrapped action never pops a prompt at you, because you already said you would handle the transaction yourself.

#### Choosing the policy for ONE call (`withUnknownSignerPolicy`)

The policy above applies to the whole run. `withUnknownSignerPolicy` overrides it for a single action — typically to REHEARSE the interactive flow on a fork before doing it on mainnet:

```typescript
import {withUnknownSignerPolicy} from '@rocketh/unknown-signer';

// this one call pauses and asks, even though the run's policy is 'throw'
const receipt = await withUnknownSignerPolicy(env)('ask', () =>
	execute(env)(proxy, {account: 'safeOwner', functionName: 'upgradeTo', args: [newImplementation.address]}),
);
```

It takes a function for the same reason `catchUnknownSigner` does, returns whatever the action returned, and propagates whatever it threw (so wrapping it in `catchUnknownSigner` still defers). Precedence is one rule: the innermost override wins, then the run parameter, then the chain config, then the default `'auto'`.

The override chooses among what the run can do; it cannot exceed it. Asking for `'ask'` where the run cannot ask a human for text still takes the `throw` path and never prompts, so a script that hardcodes the override is still safe in CI. And since it is the same policy frame, it never turns a signable account into a throw and never defeats impersonation.

A DEPLOYMENT from an unsignable `from` pauses and asks in exactly the same way, and is then held to a STRICTER standard than an execution, because it has an address to anchor on. The address rocketh records is never taken on trust from the hash you paste:

- **an ordinary deployment** is recorded at the address the pasted transaction's OWN receipt reports as created;
- **a deterministic (or factory) deployment**, whose address was computed from bytecode and salt before broadcast, is recorded at that expected address only once rocketh has seen CODE at it on-chain. It confirms by looking for the code, never by parsing the transaction, so it does not matter what wrapper your multisig executed it inside.

Anything else FAILS, saving nothing: a receipt that reports no created contract (or the zero address), an expected address with no code at it, or a transaction that did not succeed. The error names the deployment, the hash you pasted and the transaction that still needs executing, so a wrong hash cannot quietly leave you with a deployment record pointing at an address holding nothing.

This applies to the interactive path only. A deployment rocketh broadcast itself is unaffected and gains no new check: it sent that transaction, so there is nothing to distrust.

ACCEPTED RESIDUAL RISK, stated rather than engineered around: for an EXECUTION, rocketh checks that the transaction you pasted succeeded, and nothing else. It does not decode MultiSend or Timelock payloads and does not try to match `to`/`data`, because a governed execution is routinely wrapped by the multisig into a different transaction shape. A successful-but-unrelated hash would therefore be accepted. This is the same trust boundary as hardhat-deploy v1 (where the run continued after you executed the transaction, with no check at all), only stricter, and it exists because an execution has no address to anchor on.

#### In the browser, and on a fork: impersonation instead of interactivity

`@rocketh/web` deliberately implements no text prompt, so a browser run can never ask you to paste a transaction hash: `'ask'` (and `'auto'`) take the `throw` path there, exactly as in CI. That is by design, not a missing feature, and it is not a dead end. On a FORK or a dev node the browser has a better answer than interactivity anyway: let the account be IMPERSONATED, which resolves it BEFORE the unknown-signer seam so no policy is ever consulted and nothing has to be executed out-of-band.

```typescript
// rocketh/config.ts
export const config = {
	accounts: {
		deployer: {default: 0},
		// the Safe / timelock / owner you want the fork to sign for MUST be named here
		safeOwner: {default: '0x1111111111111111111111111111111111111111'},
	},
	data: {},
} as const satisfies UserConfig;
```

```typescript
// in the browser (@rocketh/web), against a fork or dev node
import {setupEnvironment} from '@rocketh/web';

const {loadAndExecuteDeploymentsFromModules} = setupEnvironment(config, {});
await loadAndExecuteDeploymentsFromModules(modules, {provider, autoImpersonate: true});
```

Three constraints make this work, and none of them is a formality:

- **Naming the addresses is MANDATORY, not merely convenient.** Only NAMED accounts are impersonation candidates. An address that appears nowhere in `accounts` (an unnamed account, or a bare `from` passed to a call) is never impersonated, however capable the node is, and still lands on the unknown-signer seam. Naming is necessary but not on its own sufficient: the candidates are the named accounts the NODE would otherwise have to sign for, so a named account that already resolves to its own signer (a private key, a wallet) signs directly and is never impersonated, which is what you want anyway.
- **It needs a node that implements the impersonation RPC**, meaning a fork or a dev node (anvil, hardhat). Against a real chain the account simply stays unsignable and the run takes the throw-and-defer path, which is the CORRECT outcome: nothing should be able to fake a signature on mainnet.
- **`autoImpersonate` is RUN-level, not per-transaction.** It is set for the whole run (execution parameter or chain config), like every other node capability. There is no per-call impersonation knob; a per-call variant is a separate, out-of-scope idea.

If you enable it against a node that does NOT implement the RPC, the attempt is swallowed (that is what lets the switch be harmless on an ordinary provider), but the unknown-signer error you eventually get SAYS SO: it tells you auto-impersonation was enabled and `hardhat_impersonateAccount` was refused, or that this account was never a candidate at all (it is not one of the named accounts the node would have to sign for). With auto-impersonation off, the error says nothing about it at all.

Note that this is a NODE CAPABILITY and `onUnknownSigner` is a POLICY: they are orthogonal, and there is no `'impersonate'` policy value. Impersonation runs first and, when it works, the policy is never reached. Conversely, `catchUnknownSigner` and `withUnknownSignerPolicy` never defeat impersonation: to exercise the unknown-signer path on a fork, set `autoImpersonate: false` for the run.

### Testing your deploy scripts

The `@rocketh/test-utils` package provides `createTestEnvironment`, an async harness
that constructs a REAL rocketh environment against a mock EIP-1193 provider. It
lets you drive `deploy` / `execute` / read calls end-to-end without a node.

```bash
npm install -D @rocketh/test-utils
```

```typescript
import {describe, it, expect} from 'vitest';
import {deploy} from '@rocketh/deploy';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';

describe('MyContract deployment', () => {
	it('deploys with a named account', async () => {
		const {env, provider} = await createTestEnvironment({
			// UserConfig.accounts shape: a numbered index, a private key, a protocol
			//  string like 'privateKey:0x...', a bare address, or a per-network map.
			accounts: {deployer: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'},
			nodeAccounts: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
		});

		const _deploy = deploy(env);
		const artifact = createMockArtifact('MyContract');
		const deployment = await _deploy('MyContract', {
			account: 'deployer',
			artifact,
			args: [],
		});

		expect(deployment.newlyDeployed).toBe(true);
		expect(provider.getRequests().some((r) => r.method === 'eth_sendTransaction')).toBe(true);
	});
});
```

The returned `provider` handle lets you set canned responses (`provider.setResponse`)
and inspect the calls the environment made (`provider.getRequests()`). The
`deploymentStore` is Map-backed and can be reused across two `createTestEnvironment`
calls to assert that deployments persist. The full options — including a partial
`UserConfig` / `ExecutionParams` pass-through, `autoImpersonate`, `autoMine`,
custom signer protocols — are documented in the package source.

## Examples

### Basic Deployment

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy('GreetingsRegistry', {
			account: deployer,
			artifact: artifacts.GreetingsRegistry,
			args: [''],
		});
	},
	{tags: ['GreetingsRegistry']},
);
```

### Proxy Deployment

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await deployViaProxy(
			'GreetingsRegistry',
			{
				account: deployer,
				artifact: artifacts.GreetingsRegistry,
				args: ['proxy:'],
			},
			{
				owner: admin,
			},
		);
	},
	{tags: ['GreetingsRegistry']},
);
```

### Diamond Deployment

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({diamond, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await diamond(
			'MyDiamond',
			{
				account: deployer,
				facets: [
					{
						name: 'DiamondCutFacet',
						artifact: artifacts.DiamondCutFacet,
					},
					{
						name: 'DiamondLoupeFacet',
						artifact: artifacts.DiamondLoupeFacet,
					},
					{
						name: 'OwnershipFacet',
						artifact: artifacts.OwnershipFacet,
					},
				],
			},
			{
				owner: admin,
			},
		);
	},
	{tags: ['MyDiamond']},
);
```

### Deployment with Dependencies

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy('Token', {
			account: deployer,
			artifact: artifacts.Token,
			args: ['My Token', 'MTK'],
		});
	},
	{tags: ['Token']},
);

// In another file
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, get, namedAccounts}) => {
		const {deployer} = namedAccounts;
		const token = await get('Token');

		await deploy('TokenSale', {
			account: deployer,
			artifact: artifacts.TokenSale,
			args: [token.address],
		});
	},
	{tags: ['TokenSale'], dependencies: ['Token']},
);
```

## Migrating from hardhat-deploy v1 to v2

### Changes in Deploy Scripts

In v1:

```typescript
// deploy/00_deploy_my_contract.js
module.exports = async ({getNamedAccounts, deployments}) => {
	const {deploy} = deployments;
	const {deployer} = await getNamedAccounts();
	await deploy('MyContract', {
		from: deployer,
		args: ['Hello'],
		log: true,
	});
};
module.exports.tags = ['MyContract'];
```

In v2:

```typescript
// deploy/00_deploy_my_contract.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy('MyContract', {
			account: deployer,
			artifact: artifacts.MyContract,
			args: ['Hello'],
		});
	},
	{tags: ['MyContract']},
);
```

### Changes in Configuration

In v1, configuration was in `hardhat.config.ts`:

```typescript
namedAccounts: {
  deployer: 0,
  ...
},
```

In v2, configuration is in `rocketh.ts`:

```typescript
export const config = {
  accounts: {
    deployer: {
      default: 0,
    },
    ...
  },
} as const satisfies UserConfig;
```

## Conclusion

rocketh and hardhat-deploy provide a powerful and flexible system for deploying and managing smart contracts on Ethereum-compatible networks. By understanding the core concepts and features, you can create robust deployment scripts that work across different environments and networks.

For more information, visit:

- [rocketh GitHub Repository](https://github.com/wighawag/rocketh)
- [hardhat-deploy GitHub Repository](https://github.com/wighawag/hardhat-deploy)
