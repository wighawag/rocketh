/**
 * Which router contract `deployViaRouter` deploys, and how a caller chooses another.
 *
 * `solidity-proxy` ships three routers, all constructed with the same routes (the route
 * implementations, a sorted `bytes5` selector map, a fallback):
 *
 * - `Router`, the DEFAULT: no fixed limit on routes (up to 256 implementations, and as many
 *   selectors as the init code limit allows), its routes kept in a data contract it creates,
 *   so its own runtime code is its compiled code and every block explorer, Etherscan
 *   included, can verify it;
 * - `InlineRouter`: the cheapest to call and to deploy, its routes appended to its own code,
 *   so it verifies by its creation code only (Sourcify, Blockscout), not on Etherscan;
 * - `Router10X60`: the previous default, at most 10 implementations and 60 selectors.
 *
 * ```typescript
 * await deployViaRouter('Game', {account: deployer}, routes);                                   // Router
 * await deployViaRouter('Game', {account: deployer}, routes, {routerContract: 'InlineRouter'});
 * await deployViaRouter('Game', {account: deployer}, routes, {routerContract: 'Router10X60'});
 * await deployViaRouter('Game', {account: deployer}, routes, {routerContract: {type: 'custom', artifact}});
 * ```
 *
 * The test environment's provider does not execute code, so these tests pin what is SENT:
 * the router record's bytecode is the chosen artifact's, and its constructor arguments
 * decode as the routes. What each router does with them on chain is solidity-proxy's suite.
 */

import {describe, it, expect} from 'vitest';
import {deployViaRouter} from '../src/index.js';
import {
	createTestEnvironment,
	createExampleArtifact,
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
} from '@rocketh/test-utils';
import type {Environment} from '@rocketh/core/types';
import {decodeAbiParameters} from 'viem';
import {InlineRouter, Router, Router10X60} from 'solidity-proxy/artifacts/index.js';

const ROUTES = () => [
	{name: 'RouteA', artifact: createExampleArtifact('ImplA', 0), args: []},
	{name: 'RouteB', artifact: createExampleArtifact('ImplB', 1), args: []},
];

async function freshEnvironment(): Promise<Environment> {
	const {env} = await createTestEnvironment({
		accounts: STANDARD_NAMED_ACCOUNTS,
		nodeAccounts: NODE_HELD_ACCOUNTS,
	});
	return env;
}

/** The routes the router was constructed with, decoded with `Router`'s constructor ABI. */
function recordedRoutes(env: Environment, routerName: string) {
	const constructor = Router.abi.find((entry) => entry.type === 'constructor');
	if (!constructor) {
		throw new Error('the router artifact has no constructor');
	}
	const [routes] = decodeAbiParameters(constructor.inputs, env.get(routerName).argsData as `0x${string}`);
	return routes;
}

describe('@rocketh/router - the router contract', () => {
	it('deploys `Router` by default', async () => {
		const env = await freshEnvironment();

		await deployViaRouter(env)('MyRouter', {account: 'deployer'}, ROUTES());

		expect(env.get('MyRouter_Router').bytecode).toBe(Router.bytecode);
	});

	it('constructs it with the routes: every implementation, the selectors sorted, no fallback', async () => {
		const env = await freshEnvironment();

		await deployViaRouter(env)('MyRouter', {account: 'deployer'}, ROUTES());

		const routes = recordedRoutes(env, 'MyRouter_Router');
		expect(routes.implementations.map((a) => a.toLowerCase())).toEqual([
			env.get('MyRouter_Router_RouteA_Route').address.toLowerCase(),
			env.get('MyRouter_Router_RouteB_Route').address.toLowerCase(),
		]);
		expect(routes.sigMap.length).toBe(2);
		expect([...routes.sigMap].sort()).toEqual([...routes.sigMap]);
		// the lowest byte of an entry is its implementation's index
		expect(routes.sigMap.map((entry) => Number(BigInt(entry) & 0xffn)).sort()).toEqual([0, 1]);
		expect(routes.fallbackImplementation).toBe('0x0000000000000000000000000000000000000000');
	});

	for (const [name, artifact] of [
		['Router', Router],
		['InlineRouter', InlineRouter],
		['Router10X60', Router10X60],
	] as const) {
		it(`deploys \`${name}\` when the caller names it`, async () => {
			const env = await freshEnvironment();

			await deployViaRouter(env)('MyRouter', {account: 'deployer'}, ROUTES(), {routerContract: name});

			expect(env.get('MyRouter_Router').bytecode).toBe(artifact.bytecode);
		});

		it(`deploys \`${name}\` when the caller passes its artifact as a custom router`, async () => {
			const env = await freshEnvironment();

			await deployViaRouter(env)('MyRouter', {account: 'deployer'}, ROUTES(), {
				routerContract: {type: 'custom', artifact},
			});

			expect(env.get('MyRouter_Router').bytecode).toBe(artifact.bytecode);
		});
	}

	it('refuses a router name it does not know, before deploying anything', async () => {
		const env = await freshEnvironment();

		await expect(
			deployViaRouter(env)('MyRouter', {account: 'deployer'}, ROUTES(), {
				// a caller without the types, or a typo
				routerContract: 'Router10X61' as 'Router',
			}),
		).rejects.toThrow(/unknown router contract "Router10X61"/);
		expect(env.getOrNull('MyRouter_Router_RouteA_Route')).toBeNull();
	});
});
