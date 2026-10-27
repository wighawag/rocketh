# Deploy scripts, tags and dependencies

A deploy script is a TypeScript (or JavaScript) module that says what should be deployed. The executor imports every script in your `deploy` folder, orders them by their dependencies, and calls each one with the **environment**: the named accounts, the network, the deployment records, and the functions your extensions add (`deploy`, `deployViaProxy`, `read`, `execute` and so on). The same scripts run from the `rocketh` CLI, from `hardhat deploy`, in your tests, and in a browser.

## A deploy script

A script default-exports what `deployScript` returns. `deployScript` comes from your `rocketh/deploy.ts` (it is `setupDeployScripts(extensions)` from `rocketh`, bound to your extensions, see [Get started](../getting-started/)), and it takes two arguments: the function to run, and the script's options.

```typescript
// deploy/001_deploy_greetings_registry.ts
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
	{tags: ['GreetingsRegistry', 'GreetingsRegistry_deploy']},
);
```

The second argument is required, and holds four optional keys:

| Option         | What it does                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `tags`         | Labels that select the script (`--tags`) and that other scripts depend on.                                               |
| `dependencies` | Tags whose scripts must run before this one.                                                                             |
| `id`           | Names the script so that a `return true` records it as done. See [Running once, and running last](../script-lifecycle/). |
| `runAtTheEnd`  | Runs the script after every ordinary script of the run. Same page.                                                       |

The first argument receives the environment. Destructure what you need (`{deploy, namedAccounts}`) or keep it whole (`env`) and call `env.deploy(...)`. Which functions it has depends on the extensions you spread into `extensions` in `rocketh/config.ts`; the built-in fields are listed in [The environment](../reference/environment/).

## Which files run, and in what order

The executor reads the `deploy` folder by default. Set `scripts` in `rocketh/config.ts` to a folder (or a list of folders), `environments.<name>.scripts` to use other folders for one environment, or pass `--scripts <folder>` to the `rocketh` CLI.

- **Sub-folders are walked.** `deploy/000_debug/001_deploy_time.ts` is a script like any other.
- **A name starting with `.` is skipped**, file or folder, so a helper module can sit beside the scripts in `deploy/.config/`.
- **A file whose name starts with `_` is skipped** (a folder starting with `_` is still walked).
- **Every other file is imported as a script**, so keep anything that is not a module (a README, a JSON fixture) out of the folder, or give it a skipped name.
- **Scripts run in the alphabetical order of their paths**, which is why they are usually numbered (`001_`, `002_`), except that a script's dependencies run before it.

## Tags: running part of the scripts

Tags are labels. Give a script as many as you like, and select scripts by tag when you run:

::: code-group

```bash [hardhat-deploy]
npx hardhat deploy --network sepolia --tags tokens
npx hardhat deploy --network sepolia --tags tokens,governance
```

```bash [rocketh CLI]
npx rocketh -e sepolia --tags tokens
npx rocketh -e sepolia --tags tokens,governance
```

:::

`--tags` takes a comma-separated list, and a script runs when it carries any of them (spaces around a comma are ignored, and an empty value means no filter). Without `--tags`, every script runs. A tag cannot contain a comma.

The usual convention is a tag named after the contract the script deploys (`GreetingsRegistry`) for others to depend on, plus a `<Name>_deploy` tag to select that one script, plus group tags (`tokens`, `core`) for running a slice of the system.

## Dependencies: running another script first

`dependencies` lists tags. Before the script runs, every script that carries one of those tags runs, and so on recursively:

```typescript
// deploy/001_deploy_token.ts
export default deployScript(
	async ({deploy, namedAccounts}) => {
		await deploy('Token', {account: namedAccounts.deployer, artifact: artifacts.Token, args: ['My Token', 'MTK']});
	},
	{tags: ['Token', 'tokens']},
);
```

```typescript
// deploy/002_deploy_token_sale.ts
export default deployScript(
	async ({deploy, get, namedAccounts}) => {
		const token = get('Token');
		await deploy('TokenSale', {account: namedAccounts.deployer, artifact: artifacts.TokenSale, args: [token.address]});
	},
	{tags: ['TokenSale'], dependencies: ['Token']},
);
```

`--tags TokenSale` therefore runs both, `Token` first. Three things the executor does not do:

- **It does not check that a dependency exists.** A tag no script carries is ignored, so a typo in `dependencies` runs nothing and says nothing. The numbered file order usually hides the mistake until a `--tags` run exposes it.
- **It does not detect a cycle.** Two scripts that depend on each other make the run fail with a stack overflow rather than with a message naming them.
- **It does not run a script twice.** A script reached through several dependencies runs once, at the first place it is needed.

## Deciding from the environment

A script can branch on where it runs: `env.name` is the environment's name, `env.tags` the tags its chain declares (`env.tags['mainnet']` is `true` or absent), `env.network.chain` the chain, and `env.network.fork` is set on a [fork run](../fork-runs/). Several environments can share one chain and differ only by their tags, see [Environments and chains](../environments/#several-environments-on-one-chain).

When several scripts take the same decision, put it in a helper module that the executor skips, and import it from each script:

```typescript
// deploy/.config/index.ts (skipped by the executor: the folder name starts with `.`)
import type {Environment} from 'rocketh/types';

export function getConfig(env: Pick<Environment, 'name' | 'tags'>) {
	return {
		useTimeContract: !env.tags['mainnet'] && env.name !== 'fast',
	};
}
```

Values that differ per environment and that a script only reads (an address, a duration, a policy) are better declared as [`data`](../environments/#per-environment-data-data) in `rocketh/config.ts`.

## Arguments: one run, different parameters

A deploy script's function takes a second parameter, the run's **arguments**. Whoever starts the run supplies them, as the second argument of `loadAndExecuteDeploymentsFromFiles`, and every script of the run receives the same value. The CLIs supply none, so a script must work with `undefined`.

This is how a test deploys the real system with a different configuration, without a second set of scripts:

```typescript
// deploy/020_deploy_game.ts
export type GameConfig = {commitPhaseDuration: bigint; revealPhaseDuration: bigint};

export default deployScript(
	async ({deploy, namedAccounts}, configOverride?: Partial<GameConfig>) => {
		const config: GameConfig = {
			commitPhaseDuration: 23n * 3600n,
			revealPhaseDuration: 3600n,
			...configOverride,
		};
		await deploy('Game', {account: namedAccounts.deployer, artifact: artifacts.Game, args: [config]});
	},
	{tags: ['Game']},
);
```

```typescript
// in a test: the same scripts, with a shorter commit phase
const env = await loadAndExecuteDeploymentsFromFiles({provider}, {commitPhaseDuration: 60n});
```

See [Tests with Hardhat fixtures](/hardhat-deploy/tests/#passing-arguments-to-the-deploy-scripts) for the fixture around it.

## A script must be safe to re-run

Scripts are run again and again: on every test, after a change, and to finish a deployment that stopped halfway. Write each one so that running it twice leaves the chain as running it once would. The extensions do most of it: `deploy` deploys only when the code or the constructor arguments changed ([When does a re-run redeploy?](../deploy-contracts/#when-does-a-re-run-redeploy)), `deployViaProxy` upgrades only when the implementation changed, and a `diamond` cuts only what differs. What they cannot know is whether an `execute` you wrote is still needed: say so with a [`guard`](../execute-guard/).

A script that must run only once, ever, returns `true` and carries an `id`, see [Running once, and running last](../script-lifecycle/).
