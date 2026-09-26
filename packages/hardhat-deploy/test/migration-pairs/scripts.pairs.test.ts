/**
 * Migration pairs 7, 8 and 10: `execute` and `read` by deployment name; a run-once script and
 * the replacement for v1's `skip`; a tagged fixture in a test.
 *
 * Pairs 8 and 10 are about what the EXECUTOR does with a script (its `id`, its tags, its
 * dependencies), so they run through `rocketh/environment.ts`, which drives rocketh's real
 * executor over every script in `deploy/`. The provider comes from `createTestEnvironment`, the
 * way a hardhat test gets its provider from `network.connect()`.
 */

import {describe, it, expect} from 'vitest';
import {encodeFunctionData, parseEther} from 'viem';
import {createTestEnvironment, createMapDeploymentStore, NODE_HELD_ACCOUNTS} from '@rocketh/test-utils';

import {createChain, createWorld, run, runScript, sent, DEPLOYER, FAUCET_OWNER, TOKEN_OWNER} from './harness.js';
import greeter from './deploy/08_greeter.js';
import {config} from './rocketh/config.js';
import {loadAndExecuteDeploymentsFromFiles} from './rocketh/environment.js';
import {setupFixtures} from './test/fixtures.js';
import {artifacts} from './mock-artifacts.js';

/** A node over `chain`, as `network.connect()` hands a hardhat test its provider. */
async function connect(options: {chainId?: number} = {}) {
	const {provider} = await createTestEnvironment({
		accounts: config.accounts,
		nodeAccounts: NODE_HELD_ACCOUNTS,
		chainId: options.chainId,
		providerConfig: {responses: createChain().responses},
	});
	provider.clearRequests();
	return provider;
}

describe('migration pair 7: execute and read by deployment name', () => {
	it('reads the greeting and, since it is not "hello", sets it from the deployer', async () => {
		const world = createWorld();
		world.chain.state.greeting = 'hi';
		const {env, provider} = await run(world);

		await runScript(greeter, env);

		const [, setGreeting] = sent(provider);
		expect(setGreeting).toEqual({
			from: DEPLOYER,
			to: env.get('Greeter').address.toLowerCase(),
			data: encodeFunctionData({abi: artifacts.Greeter.abi, functionName: 'setGreeting', args: ['hello']}),
		});
	});

	it('sends nothing more when the read already returns "hello"', async () => {
		const world = createWorld();
		world.chain.state.greeting = 'hello';
		const {env, provider} = await run(world);

		await runScript(greeter, env);

		expect(sent(provider)).toHaveLength(1); // the Greeter deployment only
	});
});

describe('migration pair 8: a run-once script, and the early return that replaces `skip`', () => {
	it('`id` + `return true`: the seeding transfer is sent on the first run and never again', async () => {
		const provider = await connect();
		const deploymentStore = createMapDeploymentStore();
		const transfer = encodeFunctionData({
			abi: artifacts.Token.abi,
			functionName: 'transfer',
			args: [DEPLOYER, parseEther('100')],
		});

		const first = await loadAndExecuteDeploymentsFromFiles({provider, tags: ['Seed'], deploymentStore});
		const token = first.get('Token').address.toLowerCase();
		// `dependencies: ['Token']` pulled the Token script in first
		expect(sent(provider)).toEqual([
			expect.objectContaining({from: DEPLOYER, to: undefined}),
			{from: TOKEN_OWNER, to: token, data: transfer},
		]);
		expect(first.hasMigrationBeenDone('seed_deployer_balance')).toBe(true);

		provider.clearRequests();
		await loadAndExecuteDeploymentsFromFiles({provider, tags: ['Seed'], deploymentStore});
		expect(sent(provider).filter((tx) => tx.data === transfer)).toEqual([]);
	});

	it('early return: no Faucet on mainnet, where `faucetOwner` is null', async () => {
		const provider = await connect({chainId: 1});

		const env = await loadAndExecuteDeploymentsFromFiles({provider, tags: ['Faucet'], environment: 'mainnet'});

		expect(env.namedAccounts.faucetOwner).toBeUndefined();
		expect(env.getOrNull('Token')).not.toBeNull(); // the dependency still ran
		expect(env.getOrNull('Faucet')).toBeNull();
	});

	it('elsewhere, `faucetOwner` exists and the Faucet is deployed from it', async () => {
		const provider = await connect();

		const env = await loadAndExecuteDeploymentsFromFiles({provider, tags: ['Faucet']});

		expect(env.getOrNull('Faucet')).not.toBeNull();
		expect(sent(provider).map((tx) => tx.from)).toEqual([DEPLOYER, FAUCET_OWNER]);
	});
});

describe('migration pair 10: a tagged fixture in a test', () => {
	it('`deployToken` runs the `Token`-tagged scripts only, and hands back the typed deployment', async () => {
		const provider = await connect();
		const {deployToken} = setupFixtures(provider);

		const {env, Token} = await deployToken();

		expect(Object.keys(env.deployments)).toEqual(['Token']);
		expect(Token.address).toBe(env.get('Token').address);
		// the fixture's environment carries the extensions, as the test snippet in fixtures.ts uses
		expect(typeof env.read).toBe('function');
	});
});
