# @rocketh/test-utils

Test helpers for rocketh packages and rocketh extensions. The centrepiece is `createTestEnvironment`, which builds a **real** rocketh environment wired to a mock EIP-1193 provider.

That distinction is the point of this package. The environment is the one `createEnvironment` produces, so a test using it exercises the production account-resolution, impersonation and broadcast paths rather than a stand-in that reimplements them. Only the provider is fake.

Primarily for people writing rocketh extensions. If you are testing your own **contracts and deploy scripts**, you want `loadAndExecuteDeploymentsFromFiles` from [`@rocketh/node`](https://www.npmjs.com/package/@rocketh/node) instead.

## Installation

```bash
# Using pnpm
pnpm add -D @rocketh/test-utils

# Using npm
npm install --save-dev @rocketh/test-utils

# Using yarn
yarn add -D @rocketh/test-utils
```

`rocketh` is a peer dependency.

## Usage

```typescript
import {describe, it, expect} from 'vitest';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';
import {deploy} from '@rocketh/deploy';

describe('my extension', () => {
	it('deploys a contract', async () => {
		const {env} = await createTestEnvironment({
			accounts: {deployer: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'},
			nodeAccounts: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
		});

		const deployment = await deploy(env)('SimpleContract', {
			account: 'deployer',
			artifact: createMockArtifact('SimpleContract'),
			args: [42n],
		});

		expect(deployment.newlyDeployed).toBe(true);
	});
});
```

`createTestEnvironment` is **async**, so `await` it.

## `createTestEnvironment(options?)`

| Option            | Default     | Description                                                                                                                                             |
| ----------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accounts`        | `{}`        | Named accounts, in `UserConfig.accounts` shape.                                                                                                         |
| `nodeAccounts`    | `[]`        | Addresses the node exposes through `eth_accounts`.                                                                                                      |
| `impersonation`   | `'succeed'` | Whether `hardhat_impersonateAccount` succeeds or throws.                                                                                                |
| `chainId`         | `31337`     | Chain id.                                                                                                                                               |
| `environmentName` | `'memory'`  | Environment name.                                                                                                                                       |
| `config`          | -           | A partial `UserConfig` merged into what is resolved, for settings the harness cannot enumerate (custom `chains[id]` fields, a `signerProtocols` entry). |

Returns:

| Field             | Description                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `env`             | The `Environment` your code under test receives.                                                                                 |
| `internal`        | The internal half of the environment.                                                                                            |
| `provider`        | The mock provider handle: set canned responses, inspect requests.                                                                |
| `deploymentStore` | The `Map`-backed store used. Pass it to a second `createTestEnvironment` to assert that deployments survive a fresh environment. |

### Testing signability

`accounts`, `nodeAccounts` and `impersonation` together let you construct each signability case precisely, which is what most unknown-signer and account-resolution tests need:

```typescript
// an account the node holds: signable
await createTestEnvironment({accounts: {deployer: addr}, nodeAccounts: [addr]});

// a named account the node does NOT hold, and impersonation fails: unsignable
await createTestEnvironment({accounts: {safe: addr}, nodeAccounts: [], impersonation: 'fail'});
```

`createNodeHeldEnvironment()` is the common case pre-built, using `STANDARD_NAMED_ACCOUNTS` and `NODE_HELD_ACCOUNTS` (both exported, so assertions can refer to the same addresses).

## Artifacts

| Helper                                        | Purpose                                                                           |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| `createMockArtifact(name, abi?)`              | A minimal artifact with ABI and bytecode. `abi` defaults to a small standard one. |
| `createMockArtifactWithLibrary(name, ...)`    | An artifact with unresolved library link references, for testing library linking. |
| `createExampleArtifact(name, templateNumber)` | A larger, more realistic artifact.                                                |

## Prompts

`createMockPromptExecutor` supplies scripted answers to the interactive prompts, so an interactive path can be tested without a TTY. `textAnswers` are consumed in order, and an entry may be a string, a structured answer, or an `Error` to make that prompt fail:

```typescript
import {createMockPromptExecutor} from '@rocketh/test-utils';

const prompts = createMockPromptExecutor({textAnswers: ['0xabc...']});

// after exercising the code under test
expect(prompts.textRequests).toHaveLength(1);
```

**Omitting `textAnswers` (or the options object entirely) is meaningful, not just empty.** The returned executor then has no `promptText` method at all, which is exactly what `@rocketh/web`'s confirm-only prompt and a non-TTY `@rocketh/node` run look like, and is what makes the `'ask'` policy degrade to `'throw'`. Use it to test the capability-absent path.

The executor records what it was asked: `requests` (confirm and text alike), `textRequests`, and `exited`. An **empty** `requests` array is itself a real assertion, since `catchUnknownSigner` must defer without ever consulting a prompt.

## `createMockProvider(config?)`

The provider underneath the harness, available on its own for tests that need a provider but no environment. It records the requests it received and returns canned responses.

## Two builders, on purpose

`rocketh`'s own tests build a real environment locally (see `packages/rocketh/test/`) instead of importing this package, because `@rocketh/test-utils` depends on `rocketh` and the reverse edge would close an Nx project-graph cycle that fails the build.

So there is exactly one test-environment builder per side of that dependency edge, and **neither fabricates an `Environment`**. If you are adding test infrastructure here, do not reintroduce a fabricated stand-in: the legacy `createMockEnvironment` was removed precisely because it reimplemented the broadcast path and therefore never executed the real environment module.

## Related packages

- [`rocketh`](https://www.npmjs.com/package/rocketh) - the environment being constructed
- [`@rocketh/core`](https://www.npmjs.com/package/@rocketh/core) - the types you will be writing against
- [`@rocketh/node`](https://www.npmjs.com/package/@rocketh/node) - for testing your own deploy scripts against real files

For full documentation, visit [rocketh.dev](https://rocketh.dev).

For hardhat-deploy documentation, see [rocketh.dev/hardhat-deploy/](https://rocketh.dev/hardhat-deploy/).
