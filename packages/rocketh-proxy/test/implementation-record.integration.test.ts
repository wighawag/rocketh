/**
 * Integration tests for @rocketh/proxy - the `implementation` field of a proxied
 * deployment's `<name>` record.
 *
 * hardhat-deploy v1 wrote `implementation: <address>` onto the record of a proxied
 * contract, and frontends and scripts read it (`get('Vault').implementation`). rocketh
 * writes it too, with one precise meaning (ADR 0012, ADR 0015): the implementation THIS
 * RECORD DESCRIBES, as established by the run that wrote it. Never a promise about the
 * chain at read time.
 *
 * Same harness as `upgrade.integration.test.ts`: two environments over one shared
 * `deploymentStore` model a RE-RUN, and `eth_getStorageAt` answers the proxy's EIP-1967
 * slots from a map the test writes, because the mock provider executes nothing.
 *
 * The case where an upgrade is DEFERRED to an unsignable owner (the record must keep the
 * old implementation) lives with the seam that defers it, in
 * `packages/rocketh-unknown-signer/test/proxy-implementation-record.integration.test.ts`.
 */

import {describe, it, expect} from 'vitest';
import {deployViaProxy} from '../src/index.js';
import {deploy} from '@rocketh/deploy';
import {
	createTestEnvironment,
	createMockArtifact,
	createMapDeploymentStore,
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
} from '@rocketh/test-utils';
import type {Abi, Artifact, DeploymentStore, Environment} from '@rocketh/core/types';

const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';
const ZERO_SLOT = '0x' + '0'.repeat(64);

const DEPLOYER = STANDARD_NAMED_ACCOUNTS.deployer;

const CONTRACT_ABI = [
	{type: 'constructor', inputs: [{type: 'uint256', name: 'initialValue'}], stateMutability: 'nonpayable'},
	{type: 'function', name: 'getValue', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
] as const satisfies Abi;

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

/** Versions of the same contract, differing in deployedBytecode ahead of the CBOR metadata. */
function artifactV(version: 1 | 2): Artifact<typeof CONTRACT_ABI> {
	const marker = version === 1 ? '11' : '22';
	return {
		...createMockArtifact('Vault', CONTRACT_ABI),
		bytecode: `0x6080604052348015600f57600080fd5b50${marker}` as `0x${string}`,
		deployedBytecode: `0x6080604052${marker}dead0002` as `0x${string}`,
	};
}

/** A unique contractAddress per deployment transaction, counted across runs. */
function uniqueReceipts(counter: {value: number}) {
	return () => {
		counter.value++;
		return {
			contractAddress: ('0x' + counter.value.toString(16).padStart(40, 'a')) as `0x${string}`,
			status: '0x1',
			blockNumber: '0x1',
			blockHash: `0x${'b'.repeat(64)}`,
			transactionHash: `0x${'c'.repeat(64)}`,
			gasUsed: '0x5208',
		};
	};
}

/** One run of a deploy script: a fresh environment over the shared store and storage. */
async function run(world: {
	storage: ReturnType<typeof createStorage>;
	store: DeploymentStore;
	counter: {value: number};
}) {
	const result = await createTestEnvironment({
		accounts: STANDARD_NAMED_ACCOUNTS,
		nodeAccounts: NODE_HELD_ACCOUNTS,
		deploymentStore: world.store,
		providerConfig: {
			responses: {
				eth_getTransactionReceipt: uniqueReceipts(world.counter),
				eth_getStorageAt: (params?: unknown[]) => world.storage.respond(params),
			},
		},
	});
	await result.internal.loadDeployments();
	return result;
}

function createWorld() {
	return {storage: createStorage(), store: createMapDeploymentStore(), counter: {value: 0}};
}

/** The `<name>` record as it sits in the deployment store, i.e. as the next run will read it. */
async function storedRecord(store: DeploymentStore, env: Environment, name: string): Promise<Record<string, unknown>> {
	return JSON.parse(await store.readFile('deployments', env.name, `${name}.json`));
}

/** Turn a stored record into one written before `implementation` existed. */
async function stripImplementation(store: DeploymentStore, env: Environment, name: string) {
	const {implementation: _, ...old} = await storedRecord(store, env, name);
	await store.writeFile('deployments', env.name, `${name}.json`, JSON.stringify(old, null, 2));
}

/** The script step every test runs, with the version of the implementation it ships. */
function deployVault(env: Environment, version: 1 | 2, options?: {upgradeIndex?: number}) {
	return deployViaProxy(env)('Vault', {account: 'deployer', artifact: artifactV(version), args: [42n]}, options ?? {});
}

/** What the proxy constructor (or an upgrade) wrote, mirrored into the mock storage. */
function mirrorProxy(world: ReturnType<typeof createWorld>, proxy: `0x${string}`, implementation: `0x${string}`) {
	world.storage.setAddress(proxy, IMPLEMENTATION_SLOT, implementation);
	world.storage.setAddress(proxy, ADMIN_SLOT, DEPLOYER);
}

describe('@rocketh/proxy - the implementation address on the record', () => {
	it('records the freshly deployed implementation on a fresh deploy', async () => {
		/**
		 * Example: a frontend or a later script reads `get('Vault').implementation` to find
		 * the logic contract behind the proxy, without knowing rocketh's
		 * `<name>_Implementation` naming convention.
		 */
		const world = createWorld();
		const {env} = await run(world);
		const vault = await deployVault(env, 1);

		const implementation = env.get('Vault_Implementation').address;
		expect(vault.implementation).toBe(implementation);
		expect(env.get('Vault').implementation).toBe(implementation);
		// and it reaches the file, which is what a frontend or `@rocketh/export` reads
		expect((await storedRecord(world.store, env, 'Vault')).implementation).toBe(implementation);
	});

	it('records the implementation it upgraded to, on the run that upgrades', async () => {
		const world = createWorld();
		const first = await run(world);
		const vault = await deployVault(first.env, 1);
		const v1 = first.env.get('Vault_Implementation').address;
		mirrorProxy(world, vault.address, v1);

		const {env} = await run(world);
		const upgraded = await deployVault(env, 2);
		const v2 = env.get('Vault_Implementation').address;

		expect(v2).not.toBe(v1);
		expect(upgraded.implementation).toBe(v2);
		expect((await storedRecord(world.store, env, 'Vault')).implementation).toBe(v2);
		// an upgrade is a step, and is counted as one
		expect(env.get('Vault').numDeployments).toBe(2);
	});

	it('records the implementation it read from the slot when the chain was upgraded out of band', async () => {
		/**
		 * Someone else upgraded the proxy (a Safe executing what an earlier run deferred).
		 * This run finds the slot already pointing at v2, sends nothing, and brings the record
		 * in line with what it READ.
		 */
		const world = createWorld();
		const first = await run(world);
		const vault = await deployVault(first.env, 1);
		mirrorProxy(world, vault.address, first.env.get('Vault_Implementation').address);

		// v2 is deployed, and the proxy is pointed at it by someone else: the slot moves
		//  while the `Vault` record still describes v1
		const v2 = (
			await deploy(first.env)('Vault_Implementation', {account: 'deployer', artifact: artifactV(2), args: [42n]})
		).address;
		mirrorProxy(world, vault.address, v2);
		expect(first.env.get('Vault').implementation).not.toBe(v2);

		const {env, provider} = await run(world);
		provider.clearRequests();
		const reconciled = await deployVault(env, 2);

		expect(provider.getRequests().filter((r) => r.method === 'eth_sendTransaction')).toHaveLength(0);
		expect(reconciled.implementation).toBe(v2);
		expect((await storedRecord(world.store, env, 'Vault')).implementation).toBe(v2);
		// the chain changed, so the record did: this one is counted
		expect(env.get('Vault').numDeployments).toBe(2);
	});
});

describe('@rocketh/proxy - a record written before the field existed', () => {
	it('gains the field on the next run, without the rewrite counting as an upgrade', async () => {
		/**
		 * A project upgrades @rocketh/proxy. Its `Vault.json` has no `implementation`. The
		 * next run that reaches the proxy, with nothing to upgrade, rewrites the record with
		 * the field. It does NOT move `numDeployments`, because nothing happened on chain.
		 */
		const world = createWorld();
		const first = await run(world);
		const vault = await deployVault(first.env, 1);
		const v1 = first.env.get('Vault_Implementation').address;
		mirrorProxy(world, vault.address, v1);
		await stripImplementation(world.store, first.env, 'Vault');

		const {env, provider} = await run(world);
		expect(env.get('Vault').implementation).toBeUndefined();
		provider.clearRequests();

		await deployVault(env, 1);

		expect(env.get('Vault').implementation).toBe(v1);
		const stored = await storedRecord(world.store, env, 'Vault');
		expect(stored.implementation).toBe(v1);
		// still one: absent while it is 1
		expect(stored.numDeployments).toBeUndefined();
		// nothing was broadcast to get there
		expect(provider.getRequests().filter((r) => r.method === 'eth_sendTransaction')).toHaveLength(0);
	});

	it('keeps a count above one as it was', async () => {
		const world = createWorld();
		const first = await run(world);
		const vault = await deployVault(first.env, 1);
		mirrorProxy(world, vault.address, first.env.get('Vault_Implementation').address);

		const second = await run(world);
		await deployVault(second.env, 2);
		const v2 = second.env.get('Vault_Implementation').address;
		mirrorProxy(world, vault.address, v2);
		await stripImplementation(world.store, second.env, 'Vault');

		const {env} = await run(world);
		await deployVault(env, 2);

		const stored = await storedRecord(world.store, env, 'Vault');
		expect(stored.implementation).toBe(v2);
		expect(stored.numDeployments).toBe(2);
	});

	it('still lets the next upgradeIndex step run after the backfill', async () => {
		/**
		 * Why the backfill keeps the count: `upgradeIndex` reads `numDeployments` as the
		 * number of upgrade steps that ran. Had the backfill counted, a project that later
		 * writes its upgrade story as `[0: v1, 1: v2]` would see step 1 as already done and
		 * silently never upgrade.
		 */
		const world = createWorld();
		const first = await run(world);
		const vault = await deployVault(first.env, 1);
		const v1 = first.env.get('Vault_Implementation').address;
		mirrorProxy(world, vault.address, v1);
		await stripImplementation(world.store, first.env, 'Vault');

		const second = await run(world);
		await deployVault(second.env, 1);
		expect(second.env.get('Vault').implementation).toBe(v1);

		const {env, provider} = await run(world);
		provider.clearRequests();
		await deployVault(env, 1, {upgradeIndex: 0});
		const upgraded = await deployVault(env, 2, {upgradeIndex: 1});

		const v2 = env.get('Vault_Implementation').address;
		expect(v2).not.toBe(v1);
		expect(upgraded.implementation).toBe(v2);
		expect(provider.getRequests().filter((r) => r.method === 'eth_sendTransaction').length).toBeGreaterThan(0);
	});

	it('does not rewrite a record that already describes the live implementation', async () => {
		const world = createWorld();
		const first = await run(world);
		const vault = await deployVault(first.env, 1);
		mirrorProxy(world, vault.address, first.env.get('Vault_Implementation').address);
		const before = await world.store.readFile('deployments', first.env.name, 'Vault.json');

		const {env} = await run(world);
		await deployVault(env, 1);

		expect(await world.store.readFile('deployments', env.name, 'Vault.json')).toBe(before);
	});
});
