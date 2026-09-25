# Migrating from hardhat-deploy v1 to v2

## Changes in Deploy Scripts

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

### A v1 `skip` export is ignored

v1 let a script export `func.skip = async (hre) => boolean`, a predicate evaluated before the script ran. rocketh has no such hook, and it does not refuse one either: a `skip` export is IGNORED, so the script runs as if it were not there. Nothing warns you, which is why this is the part to check when porting a script. Two replacements cover what `skip` was used for.

To skip a script conditionally on this run, return early from its own body. The condition sees the same environment the rest of the script does:

```typescript
export default deployScript(
	async (env) => {
		// `testnet` is a tag you declared in rocketh/config.ts
		if (!env.tags['testnet']) {
			return; // what v1's skip() returning true did
		}
		// ...
	},
	{tags: ['DevOnly']},
);
```

To skip a script PERMANENTLY once it has completed, use the run-once mechanism instead of a predicate: give the script an `id` and `return true` at the end. The id is recorded, and later runs against the same environment do not call the script at all. See [Script lifecycle](../script-lifecycle/) for the rules, including why `return true` must not be reached on a path where a step was deferred.

## Changes in Configuration

In v1, configuration was in `hardhat.config.ts`:

```typescript
namedAccounts: {
  deployer: 0,
  ...
},
```

In v2, configuration is in `rocketh/config.ts`:

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
