/**
 * Integration tests for @rocketh/router - route-based contract deployment.
 *
 * `deployViaRouter` deploys one contract per route, merges their ABIs, builds a selector
 * `sigMap`, and deploys a `Router10X60` contract that dispatches calls to the right
 * implementation based on the first 4 bytes of calldata. The merged ABI is saved as
 * the deployment's ABI so consumers see a single contract interface.
 *
 * These tests use `createTestEnvironment` with `createExampleArtifact` (whose per-template
 * distinct bytecode ensures different routes get different create2 addresses).
 */

import {describe, it, expect} from 'vitest';
import {deployViaRouter} from '../src/index.js';
import {
	createTestEnvironment,
	createExampleArtifact,
	createMapDeploymentStore,
	withChangedBytecode,
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
} from '@rocketh/test-utils';
import type {Environment} from '@rocketh/core/types';
import {decodeAbiParameters, toFunctionSelector} from 'viem';
import type {Abi} from 'abitype';
import {Router10X60} from 'solidity-proxy/artifacts/index.js';

const DEPLOYER = STANDARD_NAMED_ACCOUNTS.deployer;

/**
 * The route addresses the router will actually dispatch to, read back from the
 * router's RECORDED constructor args rather than from anything this run computed.
 *
 * The only question that matters after a route changes is whether the router on chain
 * names the new route, and the constructor args are where a `Router10X60` keeps that:
 * it is immutable, so there is no storage slot or wiring call to consult instead.
 */
function recordedRouteAddresses(env: Environment, routerName: string): string[] {
	const constructor = Router10X60.abi.find((entry) => entry.type === 'constructor');
	if (!constructor) {
		throw new Error('the router artifact has no constructor');
	}
	const [routes] = decodeAbiParameters(constructor.inputs, env.get(routerName).argsData as `0x${string}`);
	return (routes as {implementations: readonly string[]}).implementations.map((a) => a.toLowerCase());
}

/** Each route's ABI has a distinct function so the selectors don't conflict. */
const ROUTE0_ABI = [
	{type: 'function', name: 'getValue0', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
] as const satisfies Abi;

const ROUTE1_ABI = [
	{type: 'function', name: 'getValue1', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
] as const satisfies Abi;

describe('@rocketh/router - deployViaRouter', () => {
	it('deploys one implementation per route and a router contract', async () => {
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
		});

		const result = await deployViaRouter(env)('MyRouter', {account: 'deployer'}, [
			{name: 'RouteA', artifact: createExampleArtifact('ImplA', 0), args: []},
			{name: 'RouteB', artifact: createExampleArtifact('ImplB', 1), args: []},
		]);

		expect(result).toBeDefined();
		expect(result.newlyDeployed).toBe(true);
		expect(result.address).toBeDefined();

		// Route implementations are saved as `${name}_Router_${route.name}_Route`
		const routeA = env.getOrNull('MyRouter_Router_RouteA_Route');
		const routeB = env.getOrNull('MyRouter_Router_RouteB_Route');
		expect(routeA).toBeDefined();
		expect(routeB).toBeDefined();
		expect(routeA!.address).not.toBe(routeB!.address);
	});

	it('saves the router with the merged ABI containing all route functions', async () => {
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
		});

		const result = await deployViaRouter(env)('MyRouter', {account: 'deployer'}, [
			{name: 'RouteA', artifact: createExampleArtifact('ImplA', 0), args: []},
			{name: 'RouteB', artifact: createExampleArtifact('ImplB', 1), args: []},
		]);

		// The merged ABI should contain both getValue0 and getValue1
		const functionNames = (result.abi as any[]).filter((f) => f.type === 'function').map((f) => f.name);
		expect(functionNames).toContain('getValue0');
		expect(functionNames).toContain('getValue1');
	});

	it('returns newlyDeployed: false on a second call with the same store', async () => {
		const store = createMapDeploymentStore();

		const env1 = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			deploymentStore: store,
		});
		await deployViaRouter(env1.env)('MyRouter', {account: 'deployer'}, [
			{name: 'RouteA', artifact: createExampleArtifact('ImplA', 0), args: []},
			{name: 'RouteB', artifact: createExampleArtifact('ImplB', 1), args: []},
		]);

		// Second run with the same store — should reuse
		const env2 = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			deploymentStore: store,
		});
		await env2.internal.loadDeployments();

		const result2 = await deployViaRouter(env2.env)('MyRouter', {account: 'deployer'}, [
			{name: 'RouteA', artifact: createExampleArtifact('ImplA', 0), args: []},
			{name: 'RouteB', artifact: createExampleArtifact('ImplB', 1), args: []},
		]);

		expect(result2.newlyDeployed).toBe(false);
	});

	it('accepts extraABIs that contribute to the merged ABI but not to implementations', async () => {
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
		});

		const EXTRA_ABI = [
			{type: 'function', name: 'extraFunction', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
		] as const satisfies Abi;

		const result = await deployViaRouter(env)(
			'MyRouter',
			{account: 'deployer'},
			[{name: 'RouteA', artifact: createExampleArtifact('ImplA', 0), args: []}],
			{extraABIs: [EXTRA_ABI as Abi]},
		);

		const functionNames = (result.abi as any[]).filter((f) => f.type === 'function').map((f) => f.name);
		expect(functionNames).toContain('getValue0');
		expect(functionNames).toContain('extraFunction');
	});

	it('throws when two routes share a function selector', async () => {
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
		});

		// Both templates use the same function name, so selectors conflict
		await expect(
			deployViaRouter(env)('MyRouter', {account: 'deployer'}, [
				{name: 'RouteA', artifact: createExampleArtifact('ImplA', 0), args: []},
				{name: 'RouteB', artifact: createExampleArtifact('ImplB', 0), args: []},
			]),
		).rejects.toThrow();
	});
});

/**
 * THE RECORD MUST DESCRIBE WHAT IS ON CHAIN, not what this run happened to do.
 *
 * `@rocketh/proxy` and `@rocketh/diamond` both had a version of this: the record was
 * written only on a run that changed something, which is a different condition from
 * "the record disagrees with reality". Router guards its save with
 * `!existingDeployment || router.newlyDeployed`, so the question is whether the
 * merged ABI can change while the ROUTER contract does not.
 *
 * It can. `extraABIs` contribute to the merged ABI but not to the implementations,
 * so they never reach the router's constructor args, so the router is not
 * redeployed, so nothing is saved. No deferral or governance needed to reach it.
 */
describe('@rocketh/router - the record tracks the merged ABI, not just the router', () => {
	it('refreshes the record when extraABIs change but the router does not', async () => {
		const store = createMapDeploymentStore();

		const EXTRA_ABI = [
			{type: 'function', name: 'extraFunction', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
		] as const satisfies Abi;

		const routes = () => [{name: 'RouteA', artifact: createExampleArtifact('ImplA', 0), args: []}];

		const env1 = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			deploymentStore: store,
		});
		await deployViaRouter(env1.env)('MyRouter', {account: 'deployer'}, routes());

		// Same routes, so the router contract is unchanged, but the declared interface grew.
		const env2 = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			deploymentStore: store,
		});
		await env2.internal.loadDeployments();
		await deployViaRouter(env2.env)('MyRouter', {account: 'deployer'}, routes(), {extraABIs: [EXTRA_ABI as Abi]});

		const names = (env2.env.get('MyRouter').abi as any[]).filter((f) => f.type === 'function').map((f) => f.name);
		expect(names).toContain('extraFunction');
	});

	it('does not rewrite the record, or move the counter, when nothing changed', async () => {
		const store = createMapDeploymentStore();
		const routes = () => [{name: 'RouteA', artifact: createExampleArtifact('ImplA', 0), args: []}];

		const env1 = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			deploymentStore: store,
		});
		await deployViaRouter(env1.env)('MyRouter', {account: 'deployer'}, routes());

		const env2 = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			deploymentStore: store,
		});
		await env2.internal.loadDeployments();
		await deployViaRouter(env2.env)('MyRouter', {account: 'deployer'}, routes());
		const after1 = env2.env.get('MyRouter').numDeployments;

		const env3 = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			deploymentStore: store,
		});
		await env3.internal.loadDeployments();
		await deployViaRouter(env3.env)('MyRouter', {account: 'deployer'}, routes());

		expect(env3.env.get('MyRouter').numDeployments).toBe(after1);
	});
});

/**
 * A CHANGED ROUTE MUST REACH THE ROUTER, and passing options must not decide whether it does.
 *
 * A router is not a proxy. It is immutable and the route addresses live in its
 * CONSTRUCTOR ARGS, so a redeployed route makes the existing router stale by definition:
 * there is no upgrade call that could fix it up afterwards, only a new router. Skipping
 * the router because a deployment under its name already exists therefore strands the new
 * route: the code is on chain, the router still names the previous address, and nothing
 * errors.
 *
 * All three spellings are asserted because the bug was reachable only through one of them:
 * the router's options were built inside `options ? … : undefined`, so any options object
 * at all, its content irrelevant, turned the router's comparison off.
 *
 * The two runs share ONE environment on purpose: what carries between runs is the
 * deployment store, and the harness numbers addresses per environment, so a second
 * environment would hand run two the same addresses run one already used.
 */
describe('@rocketh/router - a redeployed route is wired into the router', () => {
	for (const [label, options] of [
		['with no options', undefined],
		['with an options object', {}],
		['with unrelated options', {deterministic: false}],
	] as const) {
		/** One route's source changes; the router must move with it and name the new address. */
		it(`redeploys the router naming the new route ${label}`, async () => {
			const {env} = await createTestEnvironment({
				accounts: STANDARD_NAMED_ACCOUNTS,
				nodeAccounts: NODE_HELD_ACCOUNTS,
			});
			const routeB = {name: 'RouteB', artifact: createExampleArtifact('ImplB', 1), args: []};

			const first = await deployViaRouter(env)(
				'MyRouter',
				{account: 'deployer'},
				[{name: 'RouteA', artifact: createExampleArtifact('ImplA', 0), args: []}, routeB],
				options,
			);

			const routeAddressBefore = env.get('MyRouter_Router_RouteA_Route').address.toLowerCase();
			expect(recordedRouteAddresses(env, 'MyRouter_Router')).toContain(routeAddressBefore);

			// Second run: RouteA's source changed, everything else is identical.
			const second = await deployViaRouter(env)(
				'MyRouter',
				{account: 'deployer'},
				[{name: 'RouteA', artifact: withChangedBytecode(createExampleArtifact('ImplA', 0)), args: []}, routeB],
				options,
			);

			const routeAddressAfter = env.get('MyRouter_Router_RouteA_Route').address.toLowerCase();
			expect(routeAddressAfter).not.toBe(routeAddressBefore);

			// THE ASSERTION THAT MATTERS. A test that only checked the route moved passes even
			//  when the router was skipped, which is exactly how this survived.
			const recorded = recordedRouteAddresses(env, 'MyRouter_Router');
			expect(recorded).toContain(routeAddressAfter);
			expect(recorded).not.toContain(routeAddressBefore);

			// And the record for the composed name must follow the router it describes, so a
			//  caller that gates a proxy upgrade on `newlyDeployed` still upgrades.
			expect(env.get('MyRouter').address).toBe(env.get('MyRouter_Router').address);
			expect(second.address).not.toBe(first.address);
			expect(second.newlyDeployed).toBe(true);
		});
	}

	/** The other direction: comparing on every run must not cause a spurious redeploy. */
	it('leaves an unchanged router alone when options are passed', async () => {
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
		});
		const routes = () => [{name: 'RouteA', artifact: createExampleArtifact('ImplA', 0), args: []}];

		const first = await deployViaRouter(env)('MyRouter', {account: 'deployer'}, routes(), {});
		const second = await deployViaRouter(env)('MyRouter', {account: 'deployer'}, routes(), {});

		expect(second.newlyDeployed).toBe(false);
		expect(second.address).toBe(first.address);
		// ONE deployment across both runs, not two: `numDeployments` counts them, so it is
		//  what distinguishes "reused" from "redeployed to the same place".
		expect(env.get('MyRouter_Router').numDeployments).toBe(1);
	});
});

/**
 * `skipIfAlreadyDeployed` FREEZES THE WHOLE COMPOSITE, and is never pushed down to a child.
 *
 * A router takes `deploy`'s options unchanged, because it is a plain immutable deployment
 * rather than a proxy. What it does NOT share with a single deploy is that it writes
 * several names, and `deploy` keys this option on a name existing, so the only level at
 * which the option keeps its meaning is the composite: leave the stack alone entirely, or
 * consider all of it. Any per-child application leaves a seam where one contract is frozen
 * and another moves, which is precisely how a route gets stranded.
 */
describe('@rocketh/router - skipIfAlreadyDeployed applies to the whole composite', () => {
	/** With no record under `name` there is nothing to skip, so a first run still deploys. */
	it('deploys normally when there is nothing to skip', async () => {
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
		});

		const result = await deployViaRouter(env)(
			'MyRouter',
			{account: 'deployer'},
			[{name: 'RouteA', artifact: createExampleArtifact('ImplA', 0), args: []}],
			{skipIfAlreadyDeployed: true},
		);

		expect(result.newlyDeployed).toBe(true);
		expect(recordedRouteAddresses(env, 'MyRouter_Router')).toContain(
			env.get('MyRouter_Router_RouteA_Route').address.toLowerCase(),
		);
	});

	/** A changed route inside a frozen stack: the freeze wins, and nothing moves at all. */
	it('leaves a changed route undeployed rather than deploying it and not wiring it', async () => {
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
		});

		const first = await deployViaRouter(env)('MyRouter', {account: 'deployer'}, [
			{name: 'RouteA', artifact: createExampleArtifact('ImplA', 0), args: []},
		]);
		const routeAddressBefore = env.get('MyRouter_Router_RouteA_Route').address;

		const second = await deployViaRouter(env)(
			'MyRouter',
			{account: 'deployer'},
			[{name: 'RouteA', artifact: withChangedBytecode(createExampleArtifact('ImplA', 0)), args: []}],
			{skipIfAlreadyDeployed: true},
		);

		// Nothing moved: not the router, and not the route either. A frozen stack is the
		//  point of the option; a route deployed into a frozen stack would be unreachable.
		expect(second.newlyDeployed).toBe(false);
		expect(second.address).toBe(first.address);
		expect(env.get('MyRouter_Router_RouteA_Route').address).toBe(routeAddressBefore);
		expect(recordedRouteAddresses(env, 'MyRouter_Router')).toContain(routeAddressBefore.toLowerCase());
	});

	/**
	 * The case that rules out simply forwarding the option to the children. A route being
	 * ADDED has no record under its own name, so a per-child skip would not apply to it and
	 * it would deploy, while the router, which does have a record, would be skipped: a new
	 * route the router does not name.
	 */
	it('does not deploy an added route while the router is frozen', async () => {
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
		});

		await deployViaRouter(env)('MyRouter', {account: 'deployer'}, [
			{name: 'RouteA', artifact: createExampleArtifact('ImplA', 0), args: []},
		]);

		const second = await deployViaRouter(env)(
			'MyRouter',
			{account: 'deployer'},
			[
				{name: 'RouteA', artifact: createExampleArtifact('ImplA', 0), args: []},
				{name: 'RouteB', artifact: createExampleArtifact('ImplB', 1), args: []},
			],
			{skipIfAlreadyDeployed: true},
		);

		expect(second.newlyDeployed).toBe(false);
		expect(env.getOrNull('MyRouter_Router_RouteB_Route')).toBeNull();
		expect(recordedRouteAddresses(env, 'MyRouter_Router')).toHaveLength(1);
	});

	/** `deploy` rejects this pair; the composite skip returns first, so it is restated here. */
	it('throws on the same conflicting pair as deploy, which the composite skip would otherwise hide', async () => {
		const {env} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
		});
		const routes = () => [{name: 'RouteA', artifact: createExampleArtifact('ImplA', 0), args: []}];

		await deployViaRouter(env)('MyRouter', {account: 'deployer'}, routes());

		await expect(
			deployViaRouter(env)('MyRouter', {account: 'deployer'}, routes(), {
				alwaysOverride: true,
				skipIfAlreadyDeployed: true,
			}),
		).rejects.toThrow(/conflicting options/);
	});
});
