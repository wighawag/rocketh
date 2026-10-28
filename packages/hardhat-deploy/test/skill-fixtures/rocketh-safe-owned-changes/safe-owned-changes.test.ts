/**
 * The fixture tests of `skills/rocketh-safe-owned-changes/`: they run the fixture's deploy
 * scripts through rocketh's real executor (`../_shared/executor.ts`) on the shared node
 * (`../_shared/node.ts`), with the Registry's owner `admin` declared by an address the node
 * neither holds nor impersonates, so every deferral and convergence claim of the skill is
 * executed rather than asserted:
 *
 * - a deferred step did not happen: unattended, the run throws at it and records nothing for it,
 *   neither a deployment record nor its run-once id, and every re-run surfaces the same
 *   transaction until it landed;
 * - from a terminal the run pauses, and the hash the user pastes resolves the step in that run;
 * - once the Safe acted, the `guard` makes the re-run converge: it sends nothing;
 * - a run that can sign for `admin` refuses to start (`addressSignability`);
 * - a fork rehearsal (a hardhat fork reporting 31337) takes mainnet's records, impersonates the
 *   Safe, lends it gas, captures its transaction as `impersonated`, and writes no record.
 *
 * The node does not execute anything: the Registry's `value()` is a variable of the test, set to
 * 42 at the moment the Safe "executes" the printed transaction out of band.
 */

import {describe, it, expect} from 'vitest';
import {encodeFunctionData, encodeAbiParameters, toFunctionSelector} from 'viem';
import type {DeploymentStore} from 'rocketh/types';
import {createMapDeploymentStore, createMockPromptExecutor} from '@rocketh/test-utils';

import {createNode, sent, NODE_HELD_ACCOUNTS} from '../_shared/node.js';
import {executeScripts} from '../_shared/executor.js';
import {config, extensions} from './rocketh/config.js';
import {artifacts} from './rocketh/deploy.js';
import adminStaysExternal from './deploy/00_admin_stays_external.js';
import registry from './deploy/01_registry.js';
import setValue from './deploy/02_set_value.js';

const scripts = {
	'00_admin_stays_external.ts': adminStaysExternal,
	'01_registry.ts': registry,
	'02_set_value.ts': setValue,
};
const DEPLOYER = NODE_HELD_ACCOUNTS[0].toLowerCase();
const ADMIN = config.accounts.admin.toLowerCase();
const SET_VALUE = encodeFunctionData({abi: artifacts.Registry.abi, functionName: 'setValue', args: [42n]});
const VALUE_SELECTOR = toFunctionSelector('value()');
const SAFE_EXECUTION_HASH = `0x${'5a'.repeat(32)}` as const;

/** The chain the test stands in for: what `value()` of the Registry returns, 0 until the Safe acts. */
function chain() {
	const state = {value: 0n, registry: undefined as string | undefined};
	return {
		state,
		responses: {
			eth_call: (params?: unknown[]) => {
				const call = params?.[0] as {to?: string; data?: `0x${string}`};
				if (call.data?.startsWith(VALUE_SELECTOR)) {
					state.registry = call.to?.toLowerCase();
					return encodeAbiParameters([{type: 'uint256'}], [state.value]);
				}
				return '0x';
			},
			eth_getCode: () => artifacts.Registry.deployedBytecode,
			// the Safe's execution, once the user pasted its hash: the requested call itself
			eth_getTransactionByHash: (params?: unknown[]) =>
				params?.[0] === SAFE_EXECUTION_HASH && state.registry
					? {
							hash: SAFE_EXECUTION_HASH,
							nonce: '0x0',
							from: ADMIN,
							to: state.registry,
							input: SET_VALUE,
							value: '0x0',
							gasPrice: '0x1',
							type: '0x0',
						}
					: null,
		},
	};
}

/** The records a run left in the store for an environment: deployment names and run-once ids. */
async function recordsIn(store: DeploymentStore, environment: string) {
	const files = await store.listFiles('deployments', environment);
	const migrations = files.includes('.migrations.json')
		? Object.keys(JSON.parse(await store.readFile('deployments', environment, '.migrations.json')))
		: [];
	return {
		deployments: files.filter((name) => name.endsWith('.json') && !name.startsWith('.')).sort(),
		migrations,
	};
}

describe('rocketh-safe-owned-changes: a step whose from is unsignable', () => {
	it('unattended, the deferred step throws, sends nothing and records nothing; a re-run surfaces it again', async () => {
		const {state, responses} = chain();
		const {provider} = await createNode({accounts: config.accounts, responses});
		const deploymentStore = createMapDeploymentStore();

		await expect(executeScripts({config, extensions, scripts, provider, deploymentStore})).rejects.toMatchObject({
			name: 'UnknownSignerError',
			message: expect.stringContaining('Unknown signer for account'),
			data: {from: expect.stringMatching(new RegExp(ADMIN, 'i')), data: SET_VALUE},
		});
		// only the Registry was sent, by the deployer
		expect(sent(provider)).toEqual([expect.objectContaining({from: DEPLOYER, to: undefined})]);
		// the deferred step left no record of its own and no run-once id
		expect(await recordsIn(deploymentStore, 'memory')).toEqual({deployments: ['Registry.json'], migrations: []});

		// the Safe has not acted: the re-run hands over the SAME transaction, and sends nothing
		expect(state.value).toBe(0n);
		const {provider: again} = await createNode({accounts: config.accounts, responses});
		await expect(executeScripts({config, extensions, scripts, provider: again, deploymentStore})).rejects.toMatchObject(
			{name: 'UnknownSignerError', data: {data: SET_VALUE}},
		);
		expect(sent(again)).toEqual([]);
		expect((await recordsIn(deploymentStore, 'memory')).migrations).toEqual([]);
	});

	it('once the Safe executed the printed transaction, the guarded re-run converges: it sends nothing', async () => {
		const {state, responses} = chain();
		const deploymentStore = createMapDeploymentStore();
		const {provider} = await createNode({accounts: config.accounts, responses});
		await expect(executeScripts({config, extensions, scripts, provider, deploymentStore})).rejects.toMatchObject({
			name: 'UnknownSignerError',
		});

		// out of band: the Safe executes {to, data}; rocketh observes nothing
		state.value = 42n;

		const {provider: later} = await createNode({accounts: config.accounts, responses});
		const env = await executeScripts({config, extensions, scripts, provider: later, deploymentStore});
		expect(sent(later)).toEqual([]);
		expect(env.hasMigrationBeenDone('set_value')).toBe(true);

		// and the run after that is skipped by its run-once id, still sending nothing
		const {provider: last} = await createNode({accounts: config.accounts, responses});
		await executeScripts({config, extensions, scripts, provider: last, deploymentStore});
		expect(sent(last)).toEqual([]);
	});

	it('from a terminal, the run pauses and the hash the user pastes resolves the step in that run', async () => {
		const {state, responses} = chain();
		const {provider} = await createNode({accounts: config.accounts, responses});
		const deploymentStore = createMapDeploymentStore();
		// the user executes the printed transaction on the Safe while the run waits, then pastes its hash
		const promptExecutor = createMockPromptExecutor({textAnswers: [SAFE_EXECUTION_HASH]});

		const env = await executeScripts({config, extensions, scripts, provider, deploymentStore, promptExecutor});

		expect(promptExecutor.textRequests).toHaveLength(1);
		// rocketh sent nothing for the step: the Safe did, and the run saw it land
		expect(sent(provider)).toEqual([expect.objectContaining({from: DEPLOYER, to: undefined})]);
		expect(env.hasMigrationBeenDone('set_value')).toBe(true);
		expect(state.registry).toBe(env.get('Registry').address.toLowerCase());
	});

	it('a run that can sign for the admin refuses to start, so the Safe-owned step is never sent by rocketh', async () => {
		const {responses} = chain();
		// a node that impersonates the Safe, with impersonation switched on for a live run
		const {provider} = await createNode({accounts: config.accounts, impersonable: [ADMIN], responses});

		await expect(executeScripts({config, extensions, scripts, provider, autoImpersonate: true})).rejects.toThrow(
			/refusing to run: rocketh can sign for .*, which must stay external/,
		);
		expect(sent(provider)).toEqual([]);
	});
});

describe('rocketh-safe-owned-changes: rehearsing the privileged change on a fork', () => {
	it('a hardhat fork of mainnet reads its records, executes the Safe step as impersonated, lends its gas, and writes nothing', async () => {
		const {state, responses} = chain();
		const deploymentStore = createMapDeploymentStore();

		// the real mainnet run: the Registry is deployed and recorded, the Safe step is deferred
		const {provider: mainnet} = await createNode({accounts: config.accounts, chainId: 1, responses});
		await expect(
			executeScripts({config, extensions, scripts, provider: mainnet, deploymentStore, environment: 'mainnet'}),
		).rejects.toMatchObject({name: 'UnknownSignerError', data: {data: SET_VALUE}});
		const before = await recordsIn(deploymentStore, 'mainnet');
		expect(before).toEqual({deployments: ['Registry.json'], migrations: []});

		// the rehearsal: `HARDHAT_FORK=mainnet`, a node reporting 31337 that impersonates the Safe
		const {provider: fork} = await createNode({
			accounts: config.accounts,
			chainId: 31337,
			impersonable: [ADMIN],
			responses: {...responses, hardhat_setBalance: () => null},
		});
		const env = await executeScripts({
			config,
			extensions,
			scripts,
			provider: fork,
			deploymentStore,
			environment: {fork: 'mainnet'},
		});

		// what it simulates comes from `environments.mainnet.chain`, what it talks to from the node
		expect(env.network.fork).toEqual({networkName: 'mainnet', chainId: 1});
		expect(env.network.chain.id).toBe(31337);
		// the Registry came from mainnet's records: only the Safe's step was sent, as the Safe
		const registryAddress = env.get('Registry').address.toLowerCase();
		expect(sent(fork)).toEqual([{from: ADMIN, to: registryAddress, data: SET_VALUE}]);
		expect(env.capturedTransactions).toEqual([
			expect.objectContaining({
				type: 'intent',
				from: expect.stringMatching(new RegExp(ADMIN, 'i')),
				data: SET_VALUE,
				signability: 'impersonated',
			}),
		]);
		// `fundImpersonatedAccounts` lent the Safe its gas, and took it back
		const balances = fork.getRequests().filter((r) => r.method === 'hardhat_setBalance');
		expect(balances.length).toBeGreaterThanOrEqual(2);
		expect(balances.every((r) => String(r.params?.[0]).toLowerCase() === ADMIN)).toBe(true);
		// records read, not written: mainnet's folder is as the real run left it
		expect(await recordsIn(deploymentStore, 'mainnet')).toEqual(before);
		expect(state.value).toBe(0n);
	});
});
