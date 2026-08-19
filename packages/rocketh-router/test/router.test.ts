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
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
} from '@rocketh/test-utils';
import {toFunctionSelector} from 'viem';
import type {Abi} from 'abitype';

const DEPLOYER = STANDARD_NAMED_ACCOUNTS.deployer;

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
