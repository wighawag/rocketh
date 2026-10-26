/**
 * `@rocketh/unknown-signer` and the `implementation` field of a proxied deployment's record.
 *
 * `@rocketh/proxy` writes `implementation` onto the `<name>` record: the implementation the
 * record DESCRIBES, as established by the run that wrote it (ADR 0012). The case that
 * matters most is an upgrade this run did NOT perform. When the proxy's owner is a Safe,
 * the new implementation is deployed (the deployer can sign that) but the upgrade itself
 * is deferred, either caught by `catchUnknownSigner` or thrown under the `throw` policy.
 * rocketh observed no upgrade, so the record must keep describing the OLD implementation,
 * even though `<name>_Implementation` already holds the new one. Only a later run that
 * READS the moved slot may move the field.
 *
 * Harness conventions as in `scenarios.integration.test.ts`: the Safe is a named account
 * declared as a bare address, absent from `eth_accounts`, with `autoImpersonate: false`;
 * the mock provider executes nothing, so the test writes the proxy's slots itself.
 */

import {describe, it, expect} from 'vitest';
import type {Abi, Artifact, DeploymentStore, Environment} from '@rocketh/core/types';
import {UnknownSignerError} from '@rocketh/core';
import {createMockArtifact, createTestEnvironment, createMapDeploymentStore} from '@rocketh/test-utils';
import {deployViaProxy} from '@rocketh/proxy';

import {catchUnknownSigner} from '../src/index.js';

const DEPLOYER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;
const SAFE = '0x1111111111111111111111111111111111111111' as `0x${string}`;

const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const OWNER_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';
const ZERO_SLOT = `0x${'0'.repeat(64)}` as `0x${string}`;

const VAULT_ABI = [
	{type: 'constructor', inputs: [{type: 'uint256', name: '_initialValue'}], stateMutability: 'nonpayable'},
	{type: 'function', name: 'getValue', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
] as const satisfies Abi;

function vaultArtifact(version: 1 | 2): Artifact<typeof VAULT_ABI> {
	const marker = version === 1 ? '11' : '22';
	return {
		...createMockArtifact('Vault', VAULT_ABI),
		bytecode: `0x6080604052348015600f57600080fd5b50${marker}` as `0x${string}`,
		deployedBytecode: `0x6080604052${marker}dead0002` as `0x${string}`,
	};
}

function createStorage() {
	const slots = new Map<string, `0x${string}`>();
	const keyOf = (address: string, slot: string) => `${address.toLowerCase()}:${slot.toLowerCase()}`;
	return {
		setAddress(address: `0x${string}`, slot: string, value: `0x${string}`) {
			slots.set(keyOf(address, slot), `0x${value.slice(2).toLowerCase().padStart(64, '0')}` as `0x${string}`);
		},
		respond(params?: unknown[]) {
			const [address, slot] = params as [string, string];
			return slots.get(keyOf(address, slot)) ?? ZERO_SLOT;
		},
	};
}

type World = {store: DeploymentStore; storage: ReturnType<typeof createStorage>; deployments: {count: number}};

/**
 * A distinct contract address per deployment ACROSS runs. The mock's default receipt
 * restarts with each environment, which would hand v2 the address v1 already has and so
 * make the upgrade look unnecessary.
 */
function uniqueReceipt(world: World) {
	return () => {
		world.deployments.count++;
		return {
			contractAddress: `0x${world.deployments.count.toString(16).padStart(40, 'a')}`,
			status: '0x1',
			blockNumber: '0x1',
			blockHash: `0x${'b'.repeat(64)}`,
			transactionHash: `0x${'c'.repeat(64)}`,
			gasUsed: '0x5208',
		};
	};
}

/** One run of the deploy script, over the store and storage the previous run left. */
async function run(world: World) {
	const result = await createTestEnvironment({
		accounts: {deployer: DEPLOYER, safe: SAFE},
		nodeAccounts: [DEPLOYER],
		executionParams: {autoImpersonate: false},
		deploymentStore: world.store,
		providerConfig: {
			responses: {
				eth_getStorageAt: (params?: unknown[]) => world.storage.respond(params),
				eth_getTransactionReceipt: uniqueReceipt(world),
			},
		},
	});
	await result.internal.loadDeployments();
	return result;
}

/** The script step: `Vault` behind an ERC173 proxy owned by the Safe. */
function deployVault(env: Environment, version: 1 | 2) {
	return deployViaProxy(env)(
		'Vault',
		{account: 'deployer', artifact: vaultArtifact(version), args: [42n]},
		{owner: SAFE},
	);
}

async function storedImplementation(store: DeploymentStore, env: Environment): Promise<unknown> {
	return JSON.parse(await store.readFile('deployments', env.name, 'Vault.json')).implementation;
}

/** `Vault` v1 deployed behind a proxy the Safe owns, with the proxy's slots mirrored. */
async function vaultOwnedBySafe() {
	const world: World = {store: createMapDeploymentStore(), storage: createStorage(), deployments: {count: 0}};
	const {env} = await run(world);
	const vault = await deployVault(env, 1);
	const v1 = env.get('Vault_Implementation').address;
	world.storage.setAddress(vault.address, IMPLEMENTATION_SLOT, v1);
	world.storage.setAddress(vault.address, OWNER_SLOT, SAFE);
	expect(vault.implementation).toBe(v1);
	return {world, vault, v1};
}

describe('@rocketh/unknown-signer - the proxy record keeps the implementation rocketh observed', () => {
	it('keeps the OLD implementation when the upgrade is caught by catchUnknownSigner', async () => {
		/**
		 * v2 ships. The deployer deploys it; the upgrade is the Safe's to send, so it is
		 * handed back instead of broadcast. The proxy still runs v1, and so does the record.
		 */
		const {world, v1} = await vaultOwnedBySafe();
		const {env} = await run(world);

		const deferred = await catchUnknownSigner(env)(() => deployVault(env, 2));

		expect(deferred).not.toBeNull();
		const v2 = env.get('Vault_Implementation').address;
		expect(v2).not.toBe(v1);
		expect(env.get('Vault').implementation).toBe(v1);
		expect(await storedImplementation(world.store, env)).toBe(v1);
	});

	it('keeps the OLD implementation when the upgrade is thrown under the throw policy', async () => {
		const {world, v1} = await vaultOwnedBySafe();
		const {env} = await run(world);

		await expect(deployVault(env, 2)).rejects.toBeInstanceOf(UnknownSignerError);

		expect(env.get('Vault_Implementation').address).not.toBe(v1);
		expect(env.get('Vault').implementation).toBe(v1);
		expect(await storedImplementation(world.store, env)).toBe(v1);
	});

	it('still records the old implementation when re-run before the Safe acts', async () => {
		const {world, v1} = await vaultOwnedBySafe();
		const first = await run(world);
		await catchUnknownSigner(first.env)(() => deployVault(first.env, 2));

		const {env} = await run(world);
		const deferredAgain = await catchUnknownSigner(env)(() => deployVault(env, 2));

		expect(deferredAgain).not.toBeNull();
		expect(await storedImplementation(world.store, env)).toBe(v1);
	});

	it('moves to the new implementation on the run that reads the upgraded slot', async () => {
		/**
		 * The Safe executed the upgrade out of band (the slot moved). The next run sends
		 * nothing, reads the slot, and only now writes the new implementation onto the record.
		 */
		const {world, vault} = await vaultOwnedBySafe();
		const first = await run(world);
		await catchUnknownSigner(first.env)(() => deployVault(first.env, 2));
		const v2 = first.env.get('Vault_Implementation').address;
		world.storage.setAddress(vault.address, IMPLEMENTATION_SLOT, v2);

		const {env} = await run(world);
		const deferred = await catchUnknownSigner(env)(() => deployVault(env, 2));

		expect(deferred).toBeNull();
		expect(env.get('Vault').implementation).toBe(v2);
		expect(await storedImplementation(world.store, env)).toBe(v2);
	});
});
