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

## The Hardhat connection: `getHardhatConnection`

A deploy script normally needs nothing from Hardhat. When one does (a Hardhat plugin's client, the network's name as Hardhat knows it), `getHardhatConnection(env)` from `hardhat-deploy` returns the network connection the run was given:

```typescript
import {getHardhatConnection} from 'hardhat-deploy';
import {deployScript} from '../rocketh/deploy.js';

export default deployScript(
	async (env) => {
		const connection = getHardhatConnection(env);
		console.log(connection.networkName);
	},
	{tags: ['Debug']},
);
```

The connection is there when the environment came from Hardhat: under the `deploy` task and from `loadEnvironmentFromHardhat`. Elsewhere (the `rocketh` command, `loadAndExecuteDeploymentsFromFiles` in a test, a browser) there is none, and `getHardhatConnection` throws `Hardhat deploy connection not found in the environment`. A script that uses it therefore only runs under Hardhat, which is a reason to keep it out of the scripts everything else runs.

Call it as a function, with the environment, where it is needed. Do not spread it into `extensions`: every extension is called with the environment for every script, so it would throw in every run that is not a Hardhat one.
