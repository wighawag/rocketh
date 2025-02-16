# rocketh

The deployer tool for ethereum smart contract

## migration from hardhat-deploy v1

hardhat-deploy v2 now uses rocketh, (a modular system to handle deployment) under the hood and use a similar mechanism as hardhat-deploy v1 to deploy contracts. But the api is different.

> Fun fact: hardhat-deploy started as "rocketh" in 2018 before it became a plugin for hardhat (called buidler back then).

In hardhat-deploy v1 the scripts where exported functions with optional fields (tags, dependencies, skip, etc...)

In V2 the scripts are also functions but hey are created by calling the `execute` function from `rocketh`

In v2 we do this:

```typescript
import {execute} from 'rocketh';
import '@rocketh/deploy';
import {context} from './_context.js';

export default execute(
	context,
	async ({deploy, namedAccounts, artifacts}) => {
		const {deployer} = namedAccounts;

		await deploy('GreetingsRegistry', {
			account: deployer,
			artifact: artifacts.GreetingsRegistry,
			args: [''],
		});
	},
	{tags: ['GreetingsRegistry', 'GreetingsRegistry_deploy']}
);
```

in hardhat-deploy v1 we did that instead:

```typescript
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const {deployer} = await hre.getNamedAccounts();
	const {deploy} = hre.deployments;

	// proxy only in non-live network (localhost and hardhat network) enabling HCR (Hot Contract Replacement)
	// in live network, proxy is disabled and constructor is invoked
	await deploy('GreetingsRegistry', {
		from: deployer,
		args: [''],
	});
};
export default func;
func.id = 'deploy_greetings_registry'; // id required to prevent reexecution
func.tags = ['GreetingsRegistry'];
```

Few notes:

Notice the following import:

```typescript
import '@rocketh/deploy';
```

`rocketh` core library is very simple and it does not even know how to deploy contract, just to save deployment information, read it and managed them.

`@rocketh/deploy` is a rocketh plugin that adds the `deploy` function.

Also notice this import:

```typescript
import {context} from './_context.js';
```

This is a context shared by all sript, but you can manage it the way you want, it is just a file you managed. In our case we name it \_context.ts and put in the named account and artifacts configuration.

This allows teh system to have type safety on this configuration too. Plus it allows rocketh to be completely independent of the runtime like harhdat.
