# Use viem

`@rocketh/viem` gives a deploy script, a test or a script [viem](https://viem.sh) clients on the environment's provider, and typed viem contracts for its deployments. It is a getter extension: it adds a `viem` property to the environment, not a function.

## Setting it up

`viem` is a peer dependency:

::: code-group

```bash [pnpm]
pnpm add -D @rocketh/viem viem
```

```bash [npm]
npm install -D @rocketh/viem viem
```

:::

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';
import * as readExecuteExtension from '@rocketh/read-execute';
import * as viemExtension from '@rocketh/viem';

const extensions = {...deployExtension, ...readExecuteExtension, ...viemExtension};
export {extensions};
```

## Typed contracts

`env.viem.getContract` takes a deployment, or a deployment name with the ABI type as its generic (a name alone says nothing about the type):

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, viem, namedAccounts}) => {
		const {deployer} = namedAccounts;

		const deployment = await deploy('GreetingsRegistry', {
			account: deployer,
			artifact: artifacts.GreetingsRegistry,
			args: [''],
		});

		// typed from the deployment
		const registry = viem.getContract(deployment);
		const message = await registry.read.messages([deployer]);

		// typed from the generic
		const sameRegistry = viem.getContract<typeof artifacts.GreetingsRegistry.abi>('GreetingsRegistry');
	},
	{tags: ['GreetingsRegistry']},
);
```

## The clients

| Member                                              | What it is                                                    |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `publicClient`                                      | a viem `PublicClient` on the environment's chain and provider |
| `walletClient`                                      | a viem `WalletClient` on the same transport                   |
| `getContract(nameOrDeployment)`                     | a read-only viem contract                                     |
| `getWritableContract(nameOrDeployment, {account?})` | a writable viem contract; `account` sets the sender           |

Both clients use viem's `custom` transport over `env.network.provider`, so they talk to the same node as the rest of the run, an in-memory or forked chain included:

```typescript
const blockNumber = await viem.publicClient.getBlockNumber();
const balance = await viem.publicClient.getBalance({address: deployer});
```

## Write with `execute`, read with viem

A transaction written through a viem contract goes through viem's wallet client, not through rocketh's broadcast path. So it gets none of what rocketh adds to a transaction: the [unknown-signer handling](../unknown-signers/) (an account rocketh cannot sign for fails as a provider error, which `catchUnknownSigner` cannot catch), the pending-transaction record that lets an interrupted run resume, the [captured transactions](../captured-transactions/), the gas report and the messages.

For a call that is part of a deployment, use `execute` from `@rocketh/read-execute`:

```typescript
await execute(deployment, {account: deployer, functionName: 'setMessage', args: ['hello']});
```

Keep `getWritableContract` for a write you specifically want through viem, from an account you can definitely sign for. Reads have no such caveat.
