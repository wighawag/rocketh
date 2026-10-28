# Testing an extension

`@rocketh/test-utils` is for people writing rocketh **extensions**: it builds a REAL rocketh environment, the one `createEnvironment` produces, wired to a mock EIP-1193 provider. A test then exercises the production account resolution, impersonation and broadcast paths, and only the node is fake. No node has to run.

Testing your own contracts and deploy scripts is a different thing: run the real scripts against a real (in-memory) node with `loadAndExecuteDeploymentsFromFiles`, see [Tests with Hardhat fixtures](/hardhat-deploy/tests/).

## Setting it up

```bash
pnpm add -D @rocketh/test-utils
```

`rocketh` is a peer dependency. The examples use [vitest](https://vitest.dev); any runner works.

```typescript
import {describe, it, expect} from 'vitest';
import {deploy} from '@rocketh/deploy';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';

describe('MyContract deployment', () => {
	it('deploys with a named account', async () => {
		const {env, provider} = await createTestEnvironment({
			accounts: {deployer: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'},
			nodeAccounts: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
		});

		const deployment = await deploy(env)('MyContract', {
			account: 'deployer',
			artifact: createMockArtifact('MyContract'),
			args: [],
		});

		expect(deployment.newlyDeployed).toBe(true);
		expect(provider.getRequests().some((r) => r.method === 'eth_sendTransaction')).toBe(true);
	});
});
```

An extension is a curried function, so a test calls it with the environment directly: `deploy(env)(...)`, `myExtension(env)(...)`. `createTestEnvironment` is async: `await` it.

## `createTestEnvironment(options?)`

| Option            | Default     | Meaning                                                                                                                                |
| ----------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `accounts`        | `{}`        | Named accounts, in the shape of `accounts` in `rocketh/config.ts` (an index, an address, a key, a protocol string, a per-network map). |
| `nodeAccounts`    | `[]`        | The addresses the mock node lists in `eth_accounts`.                                                                                   |
| `impersonation`   | `'succeed'` | Whether `hardhat_impersonateAccount` succeeds or fails.                                                                                |
| `chainId`         | `31337`     | The chain id the node reports.                                                                                                         |
| `environmentName` | `'memory'`  | The environment's name.                                                                                                                |
| `config`          | none        | A partial config merged into what is resolved: `chains[id]` settings, `signerProtocols`, `data`.                                       |
| `executionParams` | none        | Run parameters (all but `provider`): `autoImpersonate`, `onUnknownSigner`, `promptExecutor`, fees, `saveDeployments`.                  |
| `providerConfig`  | none        | The mock provider's canned `responses` per method, and `onUnmockedMethod`.                                                             |
| `deploymentStore` | a new one   | The store of records. Pass the one a first environment returned, to check that records survive a fresh environment.                    |

It returns `env` (the environment your code receives), `internal` (its internal half), `provider` (the mock: `setResponse(method, value)`, `getRequests()`, `clearRequests()`) and `deploymentStore` (the `Map`-backed store used).

`createMockProvider(config?)` is the provider on its own, for a test that needs a provider and no environment.

## Constructing each signability

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

## Two builders, on purpose

`rocketh`'s own tests build a real environment locally (see `packages/rocketh/test/`) instead of importing this package, because `@rocketh/test-utils` depends on `rocketh` and the reverse edge would close an Nx project-graph cycle that fails the build.

So there is exactly one test-environment builder per side of that dependency edge, and **neither fabricates an `Environment`**. If you are adding test infrastructure to `@rocketh/test-utils`, do not reintroduce a fabricated stand-in: the legacy `createMockEnvironment` was removed precisely because it reimplemented the broadcast path and therefore never executed the real environment module.
