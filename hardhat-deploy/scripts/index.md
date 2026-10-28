# Scripts and the Hardhat connection

Not everything is a deployment: a one-off call to a deployed contract, a migration of data, a check you run before an upgrade. Such a script loads the environment of a network, with its records and named accounts, and uses the same `read` and `execute` the deploy scripts use.

## A script: `loadEnvironmentFromHardhat`

`loadEnvironmentFromHardhat` comes from your `rocketh/environment.ts` (`setupHardhatDeploy(extensions)` from `hardhat-deploy/helpers`, see [Get started](../getting-started/#by-hand)). It connects to the network Hardhat was asked for and returns its environment, with your extensions applied and the records loaded, without running any deploy script:

```typescript
// scripts/setMessage.ts
import hre from 'hardhat';
import type {Abi_GreetingsRegistry} from '../generated/abis/GreetingsRegistry.js';
import {loadEnvironmentFromHardhat} from '../rocketh/environment.js';

async function main(args: string[]) {
	const env = await loadEnvironmentFromHardhat({hre});
	const GreetingsRegistry = env.get<Abi_GreetingsRegistry>('GreetingsRegistry');

	await env.execute(GreetingsRegistry, {
		account: env.namedAccounts.deployer,
		functionName: 'setMessage',
		args: [args[0] ?? ''],
	});

	console.log(await env.read(GreetingsRegistry, {functionName: 'messages', args: [env.namedAccounts.deployer]}));
}

main(process.argv.slice(2));
```

Run it with the network named by `HARDHAT_NETWORK`, which is how Hardhat picks the network of a script it did not start itself:

```bash
HARDHAT_NETWORK=sepolia npx tsx scripts/setMessage.ts "hello"
# the template: pnpm contracts:execute sepolia scripts/setMessage.ts "hello"
```

With `HARDHAT_FORK=<network>` set as well, the script runs on a fork of that network, as [`hardhat deploy` does](../networks/#forking-with-hardhat_fork), and sends nothing to the real one (the template's `contracts:fork:execute`). A transaction from an account rocketh cannot sign for goes through the [unknown-signer flow](/documentation/unknown-signers/) here too.

`loadEnvironmentFromHardhat` takes `{hre}`, and optionally `connection`, a network connection you already opened, to reuse it.

## The Hardhat connection

A deploy script normally needs nothing from Hardhat. When one does (a Hardhat plugin's client, the network's name as Hardhat knows it), it reads the network connection of the run from `env.hardhatConnection`, after you add hardhat-deploy's extension to the others in `rocketh/config.ts`:

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';
import * as hardhatExtension from 'hardhat-deploy/extensions';

const extensions = {...deployExtension, ...hardhatExtension};
```

```typescript
// deploy/000_debug.ts
import {deployScript} from '../rocketh/deploy.js';

export default deployScript(
	async (env) => {
		const connection = env.hardhatConnection;
		if (connection) {
			console.log(connection.networkName);
		}
	},
	{tags: ['Debug']},
);
```

`env.hardhatConnection` is a property, not a method, typed `NetworkConnection | undefined`. The connection is there when the environment came from Hardhat: under the `deploy` task, from `loadEnvironmentFromHardhat`, and in a test fixture that passes it (see [Tests](../tests/#the-hardhat-connection-in-a-fixture)). Elsewhere (the `rocketh` command, a fixture that passes only a provider, a browser) it is `undefined`, and the script decides what to do without it, so the same scripts keep running everywhere.

The extension comes from `hardhat-deploy/extensions`, not from `hardhat-deploy`: every entry spread into `extensions` is called with the environment, and the package root also exports the Hardhat plugin itself. The subpath loads no part of Hardhat, so the `rocketh` command and a browser build load a `rocketh/config.ts` that spreads it like any other.

### Requiring Hardhat: `env.getHardhatConnection()`

For a script that only makes sense under Hardhat, the same extension gives `env.getHardhatConnection()`, a method that returns the connection and throws `Hardhat deploy connection not found in the environment` when there is none:

```typescript
import {deployScript} from '../rocketh/deploy.js';

export default deployScript(
	async (env) => {
		const connection = env.getHardhatConnection();
		console.log(connection.networkName);
	},
	{tags: ['HardhatOnly']},
);
```

It checks when the script calls it, so in a run without a connection only that script fails; the others run as usual.

Without the extension, `getHardhatConnection(env)` from `hardhat-deploy` does the same as a plain function: call it with the environment where it is needed. Do not spread that one into `extensions`. It returns the connection rather than a method, so `env.getHardhatConnection()` would not be callable, and every extension is called with the environment before every script, so in a run without a connection it would fail every script, including those that never use it. The one to spread is `hardhat-deploy/extensions`.
