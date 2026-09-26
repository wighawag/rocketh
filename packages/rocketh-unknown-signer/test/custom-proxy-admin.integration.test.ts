/**
 * `@rocketh/unknown-signer` with a ProxyAdmin that is YOUR contract, upgraded through YOUR
 * method, and owned by a multisig.
 *
 * The shape: a registry-style contract administers the proxy, and its upgrade entry point
 * is not `upgrade(proxy, implementation)` but `upgradeProxy(proxy, implementation, data)`.
 * The registry is owned by a multisig the run cannot sign for. That is the case the
 * unknown-signer seam exists for (ADR 0006): the upgrade goes out FROM the admin's owner,
 * so it must surface as a deferred transaction, not fail around the seam.
 *
 * Same harness conventions as `scenarios.integration.test.ts`: the provider is a mock, so
 * the test writes the proxy's EIP-1967 slots and answers the admin's `owner()` itself.
 */

import {describe, it, expect} from 'vitest';
import {encodeFunctionData} from 'viem';
import type {Abi, Artifact, Environment} from '@rocketh/core/types';
import {createMockArtifact, createTestEnvironment, createMapDeploymentStore} from '@rocketh/test-utils';
import {deployViaProxy, type ProxyDeployOptions} from '@rocketh/proxy';

import {catchUnknownSigner} from '../src/index.js';

const DEPLOYER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;
/** The multisig: a named account with no signer material that the node does not hold. */
const SAFE = '0x1111111111111111111111111111111111111111' as `0x${string}`;

const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';
const ZERO_SLOT = `0x${'0'.repeat(64)}` as `0x${string}`;

const REGISTRY_ADMIN_ABI = [
	{type: 'constructor', inputs: [{type: 'address', name: 'initialOwner'}], stateMutability: 'nonpayable'},
	{type: 'function', name: 'owner', inputs: [], outputs: [{type: 'address'}], stateMutability: 'view'},
	{
		type: 'function',
		name: 'upgradeProxy',
		inputs: [
			{type: 'address', name: 'proxy'},
			{type: 'address', name: 'implementation'},
			{type: 'bytes', name: 'data'},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

const VAULT_ABI = [
	{type: 'constructor', inputs: [{type: 'uint256', name: '_initialValue'}], stateMutability: 'nonpayable'},
	{type: 'function', name: 'getValue', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
] as const satisfies Abi;

function withCode<TAbi extends Abi>(artifact: Artifact<TAbi>, marker: string): Artifact<TAbi> {
	return {
		...artifact,
		bytecode: `0x6080604052348015600f57600080fd5b50${marker}` as `0x${string}`,
		deployedBytecode: `0x6080604052${marker}dead0002` as `0x${string}`,
	};
}

const vault = (version: 1 | 2) => withCode(createMockArtifact('Vault', VAULT_ABI), version === 1 ? '11' : '22');

/** The deploy-script step: the proxy is administered by the registry, which the SAFE owns. */
const OPTIONS: ProxyDeployOptions = {
	owner: SAFE,
	proxyContract: {
		type: 'SharedAdminOptimizedTransparentProxy',
		proxyAdminName: 'RegistryAdmin',
		proxyAdminArtifact: withCode(createMockArtifact('RegistryAdmin', REGISTRY_ADMIN_ABI), 'a1'),
	},
	upgradeFunction: {methodName: 'upgradeProxy', args: ['{proxy}', '{implementation}', '{data}']},
};

function createChain() {
	const slots = new Map<string, `0x${string}`>();
	const keyOf = (address: string, slot: string) => `${address.toLowerCase()}:${slot.toLowerCase()}`;
	return {
		store: createMapDeploymentStore(),
		setSlot(address: `0x${string}`, slot: string, value: `0x${string}`) {
			slots.set(keyOf(address, slot), `0x${value.slice(2).toLowerCase().padStart(64, '0')}` as `0x${string}`);
		},
		getStorageAt(params?: unknown[]) {
			const [address, slot] = params as [string, string];
			return slots.get(keyOf(address, slot)) ?? ZERO_SLOT;
		},
		/** The registry's `owner()` is the SAFE, as its constructor `[owner]` wrote it. */
		call(params: unknown[] | undefined, env: Environment | undefined) {
			const [call] = params as [{to?: string; data?: string; input?: string}];
			const data = (call.data ?? call.input ?? '').toLowerCase();
			const admin = env?.getOrNull('RegistryAdmin');
			if (admin && call.to?.toLowerCase() === admin.address.toLowerCase() && data.startsWith('0x8da5cb5b')) {
				return `0x${SAFE.slice(2).padStart(64, '0')}`;
			}
			return '0x';
		},
	};
}

async function run(chain: ReturnType<typeof createChain>) {
	let thisRun: Environment | undefined;
	const result = await createTestEnvironment({
		accounts: {deployer: DEPLOYER, safe: SAFE},
		nodeAccounts: [DEPLOYER],
		executionParams: {autoImpersonate: false},
		deploymentStore: chain.store,
		providerConfig: {
			responses: {
				eth_getStorageAt: (params?: unknown[]) => chain.getStorageAt(params),
				eth_call: (params?: unknown[]) => chain.call(params, thisRun),
			},
		},
	});
	thisRun = result.env;
	await result.internal.loadDeployments();
	return result;
}

describe('@rocketh/unknown-signer - a multisig-owned ProxyAdmin of your own, with your own upgrade call', () => {
	it('surfaces the custom upgrade call, from the admin owner to the admin', async () => {
		/**
		 * Example: v2 of `Vault` ships. The deployer deploys the new implementation; the
		 * proxy then has to be repointed through the registry, which only the multisig
		 * can do. The run hands you exactly that call: the registry's own
		 * `upgradeProxy(proxy, implementation, data)`, from the multisig, to the registry.
		 */
		const chain = createChain();
		const {env} = await run(chain);
		const proxy = await deployViaProxy(env)('Vault', {account: 'deployer', artifact: vault(1), args: [42n]}, OPTIONS);
		const admin = env.get('RegistryAdmin').address;
		// the mock executes nothing, so mirror what the proxy constructor wrote
		chain.setSlot(proxy.address, IMPLEMENTATION_SLOT, env.get('Vault_Implementation').address);
		chain.setSlot(proxy.address, ADMIN_SLOT, admin);

		const deferred = await catchUnknownSigner(env)(() =>
			deployViaProxy(env)('Vault', {account: 'deployer', artifact: vault(2), args: [42n]}, OPTIONS),
		);

		const v2 = env.get('Vault_Implementation').address;
		expect(deferred).toStrictEqual({
			from: SAFE,
			to: admin,
			value: undefined,
			data: encodeFunctionData({
				abi: REGISTRY_ADMIN_ABI,
				functionName: 'upgradeProxy',
				args: [proxy.address, v2, '0x'],
			}),
		});
	});
});
