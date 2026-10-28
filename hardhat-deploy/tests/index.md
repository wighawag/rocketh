# Tests with Hardhat fixtures

The point of running deploy scripts in tests is that you test the contracts **as deployed**: wired together, initialized and owned exactly as they will be on chain, rather than a fresh set of contracts each test assembles by hand. A script that breaks is then caught by the test suite rather than at deployment time.

hardhat-deploy gives tests the same entry point a deployment uses, `loadAndExecuteDeploymentsFromFiles`, and Hardhat's `networkHelpers.loadFixture` makes it cheap: the scripts run once, the chain is snapshotted, and each test starts from the snapshot.

## A fixture

`loadAndExecuteDeploymentsFromFiles` comes from your `rocketh/environment.ts` (see [Get started](../getting-started/#by-hand)), bound to your extensions, so the environment it returns has `read`, `execute` and the rest:

```typescript
// test/utils/index.ts
import type {EthereumProvider} from 'hardhat/types/providers';
import {loadAndExecuteDeploymentsFromFiles} from '../../rocketh/environment.js';
import type {Abi_GreetingsRegistry} from '../../generated/abis/GreetingsRegistry.js';

export function setupFixtures(provider: EthereumProvider) {
	return {
		async deployAll() {
			const env = await loadAndExecuteDeploymentsFromFiles({provider});

			// Deployments are untyped, since what is on chain can differ from the current artifacts:
			//  type them here, assuming the artifact still matches.
			const GreetingsRegistry = env.get<Abi_GreetingsRegistry>('GreetingsRegistry');

			return {env, GreetingsRegistry, namedAccounts: env.namedAccounts, unnamedAccounts: env.unnamedAccounts};
		},
	};
}
```

Passing Hardhat's `provider` runs the scripts on the test's network (Hardhat's in-memory one, by default), where nothing is saved to `deployments/`.

## A test

```typescript
// test/GreetingsRegistry.test.ts
import {expect} from 'earl';
import {describe, it} from 'node:test';
import {network} from 'hardhat';
import {setupFixtures} from './utils/index.js';

const {provider, networkHelpers} = await network.connect();
const {deployAll} = setupFixtures(provider);

describe('GreetingsRegistry', function () {
	it('stores the message of the caller', async function () {
		const {env, GreetingsRegistry, unnamedAccounts} = await networkHelpers.loadFixture(deployAll);
		const greeter = unnamedAccounts[0];

		await env.execute(GreetingsRegistry, {account: greeter, functionName: 'setMessage', args: ['hello']});

		expect(await env.read(GreetingsRegistry, {functionName: 'messages', args: [greeter]})).toEqual(
			GreetingsRegistry.linkedData!.prefix + 'hello',
		);
	});
});
```

The test uses the same `read` and `execute` as the deploy scripts, the named accounts (`namedAccounts.deployer`, `namedAccounts.admin`) for the roles the scripts gave them, and `unnamedAccounts` for throwaway users. The template runs these with Hardhat's Node.js test runner (`@nomicfoundation/hardhat-node-test-runner`) and [earl](https://earl.fun) assertions; any runner Hardhat supports works.

## Part of the system: `tags`

`loadAndExecuteDeploymentsFromFiles({provider, tags: ['GreetingsRegistry']})` runs only the scripts carrying those tags, and their dependencies, for a test that needs part of the system. Give each fixture its own function, since `loadFixture` snapshots per function.

## Passing arguments to the deploy scripts

The second argument of `loadAndExecuteDeploymentsFromFiles` is handed to every script as its [arguments](/documentation/deploy-scripts/#arguments-one-run-different-parameters). A test deploys the real system with a different configuration that way, a short game phase for instance:

```typescript
import type {EthereumProvider} from 'hardhat/types/providers';
import {loadAndExecuteDeploymentsFromFiles} from '../../rocketh/environment.js';
import type {Abi_Game} from '../../generated/abis/Game.js';
import type {GameConfig} from '../../deploy/020_deploy_game.js';

export function setupFixtures(provider: EthereumProvider) {
	return {
		async deployWithFastPhases() {
			const override: Partial<GameConfig> = {commitPhaseDuration: 60n, revealPhaseDuration: 30n};
			const env = await loadAndExecuteDeploymentsFromFiles({provider}, override);
			return {env, Game: env.get<Abi_Game>('Game')};
		},
	};
}
```

## Solidity tests

Hardhat 3 also runs forge-style Solidity tests (`.t.sol` files, with `forge-std`), with `pnpm hardhat test solidity`. Such a test builds its contracts itself in `setUp()`; it does not run your deploy scripts:

```solidity
import {Test} from "forge-std/Test.sol";
import {GreetingsRegistry} from "src/GreetingsRegistry/GreetingsRegistry.sol";

contract GreetingsRegistryTest is Test {
    GreetingsRegistry internal registry;

    function setUp() public {
        registry = new GreetingsRegistry("");
    }

    function test_setMessageWorks() public {
        registry.setMessage("hello");
        assertEq(registry.messages(address(this)), "hello");
    }
}
```

To have a Solidity test start from the deployment your scripts really produce, capture the transactions a deployment sends and replay them in `setUp()`: see [Replaying the list in a Solidity test](/documentation/captured-transactions/#replaying-the-list-in-a-solidity-test).
