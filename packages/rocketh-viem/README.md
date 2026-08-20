# @rocketh/viem

[viem](https://viem.sh) clients and contract objects built from your rocketh deployments. Call `viem(env)` and you get a `publicClient`, a `walletClient`, and `getContract(name)` / `getWritableContract(name)` that resolve a deployment by name into a fully typed viem contract.

Use this when you want viem's own API (its multicall, its event log handling, its simulation) rather than rocketh's `read`/`execute`. Both operate on the same deployments and the same EIP-1193 provider.

## Installation

```bash
# Using pnpm
pnpm add @rocketh/viem

# Using npm
npm install @rocketh/viem

# Using yarn
yarn add @rocketh/viem
```

`viem` is a peer dependency, so you supply the version.

## Wiring it up

`@rocketh/viem` is an **extension**: spread its namespace into `extensions` in `rocketh/config.ts`.

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';
import * as viemExtension from '@rocketh/viem';

const extensions = {
	...deployExtension,
	...viemExtension,
};
export {extensions};
```

## Usage

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, viem, namedAccounts}) => {
		const {deployer} = namedAccounts;

		await deploy('Token', {account: deployer, artifact: artifacts.Token, args: ['Token', 'TKN']});

		const {publicClient, getContract, getWritableContract} = viem();

		// read-only contract, typed from the deployment's ABI
		const token = getContract('Token');
		const supply = await token.read.totalSupply();

		// writable contract, sending from a chosen account
		const writable = getWritableContract('Token', {account: deployer});
		await writable.write.mint([deployer, 1000n]);

		// or use the clients directly
		const block = await publicClient.getBlockNumber();
	},
	{tags: ['Token']},
);
```

## API

`viem(env)` returns a `ViemHandle`:

| Member | Description |
| --- | --- |
| `publicClient` | A viem `PublicClient` on the environment's chain and provider. |
| `walletClient` | A viem `WalletClient` on the same transport. |
| `getContract(nameOrDeployment)` | A read-only viem contract. Accepts a deployment name or a deployment object. |
| `getWritableContract(nameOrDeployment, {account?})` | A writable viem contract. `account` sets the sender; omit it to use the default wallet client. |

Both clients use viem's `custom` transport over `env.network.provider`, so they talk to exactly the same provider as the rest of the deployment, including any in-memory or forked chain.

Types `ViemContract<TAbi>` and `ViemWritableContract<TAbi>` are exported for annotating variables.

## Transactions here bypass rocketh's broadcast path

This is the trade-off to understand. Writing through a viem contract sends the transaction through viem's wallet client, **not** through rocketh's broadcast choke point. That means such a transaction does not get:

- the unknown-signer handling (an unsignable `from` will fail as a provider error, not as an `UnknownSignerError` you can catch with `catchUnknownSigner`)
- rocketh's gas reporting and transaction messages

For contract calls that are part of a deployment, prefer [`@rocketh/read-execute`](https://www.npmjs.com/package/@rocketh/read-execute). Reach for `getWritableContract` when you specifically need viem's write API and the account is one you can definitely sign for.

Reads have no such caveat: `getContract(...).read` and `publicClient` are free of it.

## Related packages

- [`@rocketh/read-execute`](https://www.npmjs.com/package/@rocketh/read-execute) - rocketh's own read/execute, on the managed broadcast path
- [`@rocketh/deploy`](https://www.npmjs.com/package/@rocketh/deploy) - deploy the contracts you then wrap
- [`rocketh`](https://www.npmjs.com/package/rocketh) - core environment and executor

For full documentation, visit [rocketh.dev](https://rocketh.dev).

For hardhat-deploy documentation, see [rocketh.dev/hardhat-deploy/](https://rocketh.dev/hardhat-deploy/).
