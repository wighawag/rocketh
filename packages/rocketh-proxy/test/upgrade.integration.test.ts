/**
 * Integration tests for @rocketh/proxy - the UPGRADE path.
 *
 * Every existing test in `proxy.integration.test.ts` builds a fresh environment, so
 * `env.getOrNull(name)` is always null and the fresh-deployment path is all that runs.
 * The upgrade branch (`src/index.ts:460-572`, ~110 lines) was never reached.
 *
 * These tests model a RE-RUN: a shared `deploymentStore` across two environments, with
 * `eth_getStorageAt` answering the proxy's implementation and admin slots. The recipe
 * is the one already proven in `packages/rocketh-unknown-signer/test/scenarios.integration.test.ts:87-166`.
 *
 * Two versions of the same contract differ in their deployedBytecode (a marker byte
 * before the CBOR metadata), so `deploy` treats v2 as a new implementation rather than
 * reusing v1, which is what triggers an upgrade.
 */

import {describe, it, expect} from 'vitest';
import {deployViaProxy} from '../src/index.js';
import {
	createTestEnvironment,
	createMockArtifact,
	createMapDeploymentStore,
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
} from '@rocketh/test-utils';
import {encodeFunctionData} from 'viem';
import type {Abi, Artifact} from '@rocketh/core/types';
import type {DeploymentStore} from '@rocketh/core/types';

const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';
const ZERO_ADDRESS = '0x' + '0'.repeat(40);
const ZERO_SLOT = '0x' + '0'.repeat(64);

const DEPLOYER = STANDARD_NAMED_ACCOUNTS.deployer;

const UPGRADE_ABI = [
	{
		type: 'function',
		name: 'upgradeTo',
		inputs: [{type: 'address', name: 'impl'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'upgradeToAndCall',
		inputs: [
			{type: 'address', name: 'impl'},
			{type: 'bytes', name: 'data'},
		],
		outputs: [],
		stateMutability: 'payable',
	},
] as const satisfies Abi;

const CONTRACT_ABI = [
	{
		type: 'constructor',
		inputs: [{type: 'uint256', name: 'initialValue'}],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'getValue',
		inputs: [],
		outputs: [{type: 'uint256'}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

/** Storage that answers eth_getStorageAt from a Map. */
function createStorage() {
	const slots = new Map<string, `0x${string}`>();
	const keyOf = (addr: string, slot: string) => `${addr.toLowerCase()}:${slot.toLowerCase()}`;
	return {
		setAddress(addr: `0x${string}`, slot: string, value: `0x${string}`) {
			slots.set(keyOf(addr, slot), `0x${value.slice(2).toLowerCase().padStart(64, '0')}` as `0x${string}`);
		},
		respond(params?: unknown[]) {
			const [addr, slot] = params as [string, string];
			return slots.get(keyOf(addr, slot)) ?? (ZERO_SLOT as `0x${string}`);
		},
	};
}

/** Two versions of the same contract, differing in deployedBytecode ahead of the CBOR metadata. */
function artifactV(version: 1 | 2): Artifact<typeof CONTRACT_ABI> {
	const marker = version === 1 ? '11' : '22';
	return {
		...createMockArtifact('Vault', CONTRACT_ABI),
		bytecode: `0x6080604052348015600f57600080fd5b50${marker}` as `0x${string}`,
		deployedBytecode: `0x6080604052${marker}dead0002` as `0x${string}`,
	};
}

/** Override eth_getTransactionReceipt to return a unique contractAddress per tx, using a SHARED counter. */
function uniqueReceiptsConfig(counter: {value: number}, extra?: Record<string, unknown>) {
	return {
		responses: {
			eth_getTransactionReceipt: () => {
				counter.value++;
				const addr = '0x' + counter.value.toString(16).padStart(40, 'a');
				return {
					contractAddress: addr as `0x${string}`,
					status: '0x1',
					blockNumber: '0x1',
					blockHash: `0x${'b'.repeat(64)}`,
					transactionHash: `0x${'c'.repeat(64)}`,
					gasUsed: '0x5208',
				};
			},
			...(extra || {}),
		},
	};
}

async function firstDeploy(
	storage: ReturnType<typeof createStorage>,
	deploymentStore: DeploymentStore,
	counter: {value: number},
) {
	const {env, provider} = await createTestEnvironment({
		accounts: STANDARD_NAMED_ACCOUNTS,
		nodeAccounts: NODE_HELD_ACCOUNTS,
		deploymentStore,
		providerConfig: uniqueReceiptsConfig(counter, {eth_getStorageAt: (params?: unknown[]) => storage.respond(params)}),
	});
	const vault = await deployViaProxy(env)('Vault', {account: 'deployer', artifact: artifactV(1), args: [42n]}, {});
	// Mirror what the proxy constructor wrote
	const impl = env.get('Vault_Implementation').address;
	storage.setAddress(vault.address, IMPLEMENTATION_SLOT, impl);
	storage.setAddress(vault.address, ADMIN_SLOT, DEPLOYER);
	return {env, provider, vault, impl};
}

async function secondRun(
	storage: ReturnType<typeof createStorage>,
	deploymentStore: DeploymentStore,
	counter: {value: number},
	extraResponses?: Record<string, unknown>,
) {
	const result = await createTestEnvironment({
		accounts: STANDARD_NAMED_ACCOUNTS,
		nodeAccounts: NODE_HELD_ACCOUNTS,
		deploymentStore,
		providerConfig: uniqueReceiptsConfig(counter, {
			eth_getStorageAt: (params?: unknown[]) => storage.respond(params),
			...(extraResponses || {}),
		}),
	});
	await result.internal.loadDeployments();
	return {env: result.env, provider: result.provider};
}

/** All eth_sendTransaction `from` addresses, in order. */
function broadcastFrom(provider: {getRequests: () => {method: string; params?: unknown[]}[]}): string[] {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendTransaction')
		.map((r) => ((r.params?.[0] as {from: string}).from ?? '').toLowerCase());
}

describe('@rocketh/proxy - upgrade path', () => {
	it('sends upgradeTo when the implementation changed (ERC173 default)', async () => {
		const storage = createStorage();
		const counter = {value: 0};
		const store = createMapDeploymentStore();
		const first = await firstDeploy(storage, store, counter);

		// Re-run with v2
		const {env, provider} = await secondRun(storage, store, counter);
		await deployViaProxy(env)('Vault', {account: 'deployer', artifact: artifactV(2), args: [42n]}, {});

		const newImpl = env.get('Vault_Implementation').address;

		// An upgradeTo tx was broadcast by the deployer (the admin slot owner)
		const upgrades = provider
			.getRequests()
			.filter((r) => r.method === 'eth_sendTransaction')
			.map((r) => r.params?.[0] as any)
			.filter((tx) => tx.data === encodeFunctionData({abi: UPGRADE_ABI, functionName: 'upgradeTo', args: [newImpl]}));

		expect(upgrades.length).toBe(1);
		expect(upgrades[0].from.toLowerCase()).toBe(DEPLOYER.toLowerCase());
		expect(upgrades[0].to.toLowerCase()).toBe(first.vault.address.toLowerCase());
	});

	it('reuses the existing deployment when the implementation has not changed', async () => {
		const storage = createStorage();
		const counter = {value: 0};
		const store = createMapDeploymentStore();
		await firstDeploy(storage, store, counter);

		const {env, provider} = await secondRun(storage, store, counter);
		const result = await deployViaProxy(env)('Vault', {account: 'deployer', artifact: artifactV(1), args: [42n]}, {});

		expect(result.newlyDeployed).toBeFalsy();
		// No upgradeTo tx should have been sent
		const upgrades = provider
			.getRequests()
			.filter((r) => r.method === 'eth_sendTransaction')
			.map((r) => r.params?.[0] as any)
			.filter((tx) => tx.data?.startsWith?.('0x3659cfe6') /* upgradeTo selector */);
		expect(upgrades.length).toBe(0);
	});

	it('throws when the proxy record is missing but the deployment exists', async () => {
		const storage = createStorage();
		const counter = {value: 0};
		const store = createMapDeploymentStore();
		const first = await firstDeploy(storage, store, counter);

		// Delete the _Proxy deployment from the store to simulate a missing proxy record
		const {env} = await secondRun(storage, store, counter);
		// The deployment exists (Vault) but the _Proxy deployment was never saved
		// We simulate this by removing the proxy record from the env's deployments
		// Actually, deployViaProxy checks env.getOrNull(proxyName) where proxyName = name + '_Proxy'
		// If we deployed with a different name but saved as 'Vault', the proxy is 'Vault_Proxy'
		// To test the throw, we need 'Vault' to exist but 'Vault_Proxy' to not exist.
		// This happens naturally if someone saved a deployment named 'Vault' without using deployViaProxy.
		// Instead, let's directly test by deploying a non-proxy deployment first.
		const {deploy} = await import('@rocketh/deploy');
		const _deploy = deploy(env);
		// 'Vault' already exists from the first deploy. Let's try to use deployViaProxy
		// which will find the existing 'Vault' but no 'Vault_Proxy'.
		// Actually Vault_Proxy WAS saved by the first deployViaProxy. Let me remove it.
		// The simplest approach: just test the error by having an existing deployment without a proxy.
		// Let's use a fresh store where we manually save a non-proxy deployment.
		const store2 = createMapDeploymentStore();
		const {env: env2} = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			deploymentStore: store2,
			providerConfig: {responses: {eth_getStorageAt: (params?: unknown[]) => storage.respond(params)}},
		});
		const {deploy: deploy2} = await import('@rocketh/deploy');
		await deploy2(env2)('Standalone', {account: 'deployer', artifact: artifactV(1), args: [1n]});

		await expect(
			deployViaProxy(env2)('Standalone', {account: 'deployer', artifact: artifactV(2), args: [1n]}, {}),
		).rejects.toThrow(/no proxy/);
	});

	it('throws when the owner does not match the admin', async () => {
		const storage = createStorage();
		const counter = {value: 0};
		const store = createMapDeploymentStore();
		const first = await firstDeploy(storage, store, counter);

		// Set the admin slot to a different address
		const wrongOwner = ('0x' + 'e'.repeat(40)) as `0x${string}`;
		storage.setAddress(first.vault.address, ADMIN_SLOT, wrongOwner);

		const {env} = await secondRun(storage, store, counter);

		await expect(
			deployViaProxy(env)('Vault', {account: 'deployer', artifact: artifactV(2), args: [42n]}, {}),
		).rejects.toThrow(/To change owner\/admin/);
	});

	it('throws when the proxy belongs to no-one and checkProxyAdmin is true', async () => {
		const storage = createStorage();
		const counter = {value: 0};
		const store = createMapDeploymentStore();
		const first = await firstDeploy(storage, store, counter);

		// Set the admin slot to zero address
		storage.setAddress(first.vault.address, ADMIN_SLOT, ZERO_ADDRESS as `0x${string}`);

		const {env} = await secondRun(storage, store, counter);

		await expect(
			deployViaProxy(env)('Vault', {account: 'deployer', artifact: artifactV(2), args: [42n]}, {}),
		).rejects.toThrow(/belongs to no-one/);
	});

	it('uses upgradeToAndCall when execute provides calldata', async () => {
		const storage = createStorage();
		const counter = {value: 0};
		const store = createMapDeploymentStore();
		const first = await firstDeploy(storage, store, counter);

		const {env, provider} = await secondRun(storage, store, counter);

		// Use execute with an init method to generate postUpgradeCalldata
		await deployViaProxy(env)(
			'Vault',
			{account: 'deployer', artifact: artifactV(2), args: [42n]},
			{execute: {methodName: 'getValue', args: []}},
		);

		const newImpl = env.get('Vault_Implementation').address;

		// An upgradeToAndCall tx should have been sent
		const upgrades = provider
			.getRequests()
			.filter((r) => r.method === 'eth_sendTransaction')
			.map((r) => r.params?.[0] as any)
			.filter((tx) => tx.data?.startsWith?.('0x4f1ef286') /* upgradeToAndCall selector */);

		expect(upgrades.length).toBe(1);
		expect(upgrades[0].to.toLowerCase()).toBe(first.vault.address.toLowerCase());
	});

	it('falls back to owner() when the admin slot is zero', async () => {
		const storage = createStorage();
		const counter = {value: 0};
		const store = createMapDeploymentStore();
		const first = await firstDeploy(storage, store, counter);

		// Set admin slot to zero but provide an owner() response
		storage.setAddress(first.vault.address, ADMIN_SLOT, ZERO_ADDRESS as `0x${string}`);

		// Set up eth_call to return the deployer as owner
		const ownerWord = `0x${'0'.repeat(24)}${DEPLOYER.slice(2).toLowerCase()}` as `0x${string}`;
		const result = await createTestEnvironment({
			accounts: STANDARD_NAMED_ACCOUNTS,
			nodeAccounts: NODE_HELD_ACCOUNTS,
			deploymentStore: store,
			providerConfig: uniqueReceiptsConfig(counter, {
				eth_getStorageAt: (params?: unknown[]) => storage.respond(params),
				eth_call: () => ownerWord,
			}),
		});
		const {env, provider} = result;
		await result.internal.loadDeployments();

		await deployViaProxy(env)('Vault', {account: 'deployer', artifact: artifactV(2), args: [42n]}, {});

		const newImpl = env.get('Vault_Implementation').address;
		const upgrades = provider
			.getRequests()
			.filter((r) => r.method === 'eth_sendTransaction')
			.map((r) => r.params?.[0] as any)
			.filter((tx) => tx.data === encodeFunctionData({abi: UPGRADE_ABI, functionName: 'upgradeTo', args: [newImpl]}));

		// The owner() fallback resolved the owner, so the upgrade succeeded
		expect(upgrades.length).toBe(1);
		expect(upgrades[0].from.toLowerCase()).toBe(DEPLOYER.toLowerCase());
	});
});

/**
 * THE RECORD MUST DESCRIBE WHAT IS ON CHAIN, not what this run happened to do.
 *
 * `deployViaProxy` writes the proxy record only on a run that PERFORMS an upgrade.
 * That is a different condition, and the two come apart the moment the upgrade
 * happens somewhere else: a Safe executing a deferred upgrade, a governance
 * timelock, or a plain manual `upgradeTo`. The run that wanted the upgrade throws
 * before the save; the run after it finds the implementation slot already correct
 * and skips the whole branch, save included. No run writes the record, so it keeps
 * the OLD implementation's ABI forever.
 *
 * That record is what `@rocketh/export` ships to a frontend, what `env.get<Abi>()`
 * hands a later script, and what `@rocketh/doc` documents. All three go silently
 * stale, and only for users whose upgrades are governed, which is why it survived.
 *
 * `numDeployments` counts how many times the recorded deployment CHANGED, whether
 * rocketh made the change or merely observed it. So an out-of-band upgrade counts,
 * and the deferred path must end up with the same record the signable path
 * produces, that field included.
 */
const CONTRACT_ABI_V2 = [
	...CONTRACT_ABI,
	{
		type: 'function',
		name: 'getExtra',
		inputs: [],
		outputs: [{type: 'uint256'}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

/** v2, and its ABI genuinely differs: `getExtra` exists only here. */
function artifactV2WithWiderAbi(): Artifact<typeof CONTRACT_ABI_V2> {
	return {
		...createMockArtifact('Vault', CONTRACT_ABI_V2),
		bytecode: `0x6080604052348015600f57600080fd5b5022` as `0x${string}`,
		deployedBytecode: `0x608060405222dead0002` as `0x${string}`,
	};
}

const hasExtra = (abi: readonly unknown[]) => abi.some((entry) => (entry as {name?: string}).name === 'getExtra');

describe('@rocketh/proxy - the record tracks the chain, not this run', () => {
	it('refreshes the ABI when the upgrade happened out-of-band', async () => {
		/**
		 * The purest statement of the bug: no `catchUnknownSigner`, no deferral
		 * machinery. Someone upgraded the proxy outside rocketh, to an implementation
		 * rocketh then deploys and recognises. The next run must record it.
		 */
		const storage = createStorage();
		const counter = {value: 0};
		const store = createMapDeploymentStore();
		await firstDeploy(storage, store, counter);

		// Run 2 deploys the v2 implementation, then upgrades, then saves. Ordinary path.
		const {env: envSignable} = await secondRun(storage, store, counter);
		await deployViaProxy(envSignable)(
			'Vault',
			{account: 'deployer', artifact: artifactV2WithWiderAbi(), args: [42n]},
			{},
		);
		const signableRecord = envSignable.get('Vault');

		// Now the same journey with the upgrade performed elsewhere. Fresh store.
		const storage2 = createStorage();
		const counter2 = {value: 0};
		const store2 = createMapDeploymentStore();
		const first = await firstDeploy(storage2, store2, counter2);

		// Run 2: deploy the new implementation but let the upgrade happen OUT OF BAND,
		//  by writing the implementation slot directly before rocketh looks at it.
		const {env} = await secondRun(storage2, store2, counter2);
		const {deploy} = await import('@rocketh/deploy');
		const newImpl = await deploy(env)('Vault_Implementation', {
			account: 'deployer',
			artifact: artifactV2WithWiderAbi(),
			args: [42n],
		});
		storage2.setAddress(first.vault.address, IMPLEMENTATION_SLOT, newImpl.address);

		// Run 3: rocketh is asked for the same v2 implementation. The slot already
		//  matches, so it performs no upgrade. It must still record the truth.
		const {env: env3, provider} = await secondRun(storage2, store2, counter2);
		await deployViaProxy(env3)('Vault', {account: 'deployer', artifact: artifactV2WithWiderAbi(), args: [42n]}, {});

		const record = env3.get('Vault');

		// It did NOT upgrade: the chain was already where it should be.
		expect(broadcastFrom(provider).length).toBe(0);
		// ...but the record now describes the implementation the proxy actually runs.
		expect(hasExtra(record.abi)).toBe(true);
		expect(record.address.toLowerCase()).toBe(first.vault.address.toLowerCase());
		// An out-of-band upgrade IS a new deployment as far as the record is concerned,
		//  so the two journeys must agree on the count as well as on the ABI.
		expect(record.numDeployments).toBe(signableRecord.numDeployments);
	});

	it('does not rewrite the record, or move the counter, when nothing changed', async () => {
		/**
		 * The guard on the fix. Refreshing unconditionally would rewrite the file and
		 * tick `numDeployments` on every single run, turning a counter of real changes
		 * into a counter of invocations.
		 */
		const storage = createStorage();
		const counter = {value: 0};
		const store = createMapDeploymentStore();
		await firstDeploy(storage, store, counter);

		const {env: envA} = await secondRun(storage, store, counter);
		await deployViaProxy(envA)('Vault', {account: 'deployer', artifact: artifactV(1), args: [42n]}, {});
		const after1 = envA.get('Vault');

		const {env: envB} = await secondRun(storage, store, counter);
		await deployViaProxy(envB)('Vault', {account: 'deployer', artifact: artifactV(1), args: [42n]}, {});
		const after2 = envB.get('Vault');

		expect(after2.numDeployments).toBe(after1.numDeployments);
	});
});
