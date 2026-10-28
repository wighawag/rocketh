/**
 * The fixture test of `skills/rocketh-deploy/references/proxies.md`. It runs the proxy scripts of
 * the `upgrades/` miniature project through rocketh's real executor (`../../_shared/executor.ts`)
 * on the shared node, and checks what the reference claims:
 *
 * - an upgrade is a re-run of the same script: after the source changed, the same name deploys a
 *   new implementation and upgrades the proxy at the same address, from the `owner`;
 * - `execute: {init, onUpgrade}` makes `init` on the first deployment only (through the proxy) and
 *   `onUpgrade` on the upgrade only;
 * - with `upgradeIndex`, a fresh chain replays the steps in order, and a re-run sends nothing.
 *
 * The node does not execute anything. Its proxies answer the EIP-1967 implementation slot with
 * the implementation the last completed run established (the `implementation` of the proxy's
 * record, as the chain would hold it once that run's transactions landed), and the admin slot
 * with `admin`.
 */

import {describe, it, expect} from 'vitest';
import {encodeFunctionData} from 'viem';
import type {Abi, DeploymentStore} from 'rocketh/types';
import {createMapDeploymentStore} from '@rocketh/test-utils';

import {createNode, sent, NODE_HELD_ACCOUNTS} from '../../_shared/node.js';
import {executeScripts} from '../../_shared/executor.js';
import {config, extensions} from './rocketh/config.js';
import {artifacts} from './rocketh/deploy.js';
import vault from './deploy/01_vault.js';
import counter from './deploy/02_counter.js';

const DEPLOYER = NODE_HELD_ACCOUNTS[0].toLowerCase();
const ADMIN = NODE_HELD_ACCOUNTS[1].toLowerCase();
const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';

const UPGRADE_TO_AND_CALL = [
	{
		type: 'function',
		name: 'upgradeToAndCall',
		inputs: [
			{type: 'address', name: 'implementation'},
			{type: 'bytes', name: 'data'},
		],
		outputs: [],
		stateMutability: 'payable',
	},
] as const satisfies Abi;

const INIT = encodeFunctionData({abi: artifacts.Vault.abi, functionName: 'init', args: [ADMIN as `0x${string}`]});
const POST_UPGRADE = encodeFunctionData({abi: artifacts.Vault.abi, functionName: 'postUpgrade', args: []});

function word(address: string): `0x${string}` {
	return `0x${address.slice(2).toLowerCase().padStart(64, '0')}`;
}

/**
 * A deployment store that also keeps, per proxy address, the implementation its latest record
 * established: what the proxy's implementation slot holds once that run's transactions landed.
 */
function storeWithProxyState() {
	const store = createMapDeploymentStore();
	const implementationOf = new Map<string, string>();
	const track = (content: string) => {
		const record = JSON.parse(content) as {address?: string; implementation?: string};
		if (record.address && record.implementation) {
			implementationOf.set(record.address.toLowerCase(), record.implementation);
		}
	};
	const deploymentStore: DeploymentStore = {
		...store,
		async writeFile(folder, environmentName, name, content) {
			if (name.endsWith('.json')) track(content);
			return store.writeFile(folder, environmentName, name, content);
		},
		async writeFileWithChainInfo(chainInfo, folder, environmentName, name, content) {
			if (name.endsWith('.json')) track(content);
			return store.writeFileWithChainInfo(chainInfo, folder, environmentName, name, content);
		},
	};
	return {deploymentStore, implementationOf};
}

async function proxyChain() {
	const {deploymentStore, implementationOf} = storeWithProxyState();
	const {provider} = await createNode({
		accounts: config.accounts,
		responses: {
			eth_getStorageAt: (params?: unknown[]) => {
				const [address, slot] = params as [string, string];
				if (slot.toLowerCase() === ADMIN_SLOT) return word(ADMIN);
				if (slot.toLowerCase() === IMPLEMENTATION_SLOT) {
					return word(implementationOf.get(address.toLowerCase()) ?? `0x${'0'.repeat(40)}`);
				}
				return word(`0x${'0'.repeat(40)}`);
			},
		},
	});
	return {provider, deploymentStore};
}

describe('rocketh-deploy, proxies: an upgrade is a re-run of the same script', () => {
	it('the first run deploys and initializes through the proxy; the re-run sends nothing', async () => {
		const {provider, deploymentStore} = await proxyChain();
		const scripts = {'01_vault.ts': vault};

		const first = await executeScripts({config, extensions, scripts, provider, deploymentStore});

		const [implementation, proxy] = sent(provider);
		expect(sent(provider)).toHaveLength(2);
		expect(implementation).toMatchObject({from: DEPLOYER, to: undefined});
		// the proxy is created with `init(admin)` as its initialization call: state written through the proxy
		expect(proxy).toMatchObject({from: DEPLOYER, to: undefined});
		expect(proxy.data).toContain(INIT.slice(2));
		expect(first.get('Vault').implementation).toBe(first.get('Vault_Implementation').address);

		await executeScripts({config, extensions, scripts, provider, deploymentStore});

		expect(sent(provider)).toHaveLength(2);
	});

	it('after the source changed, the same script deploys the new implementation and upgrades from `owner`, calling `onUpgrade`, not `init`', async () => {
		const {provider, deploymentStore} = await proxyChain();
		const scripts = {'01_vault.ts': vault};
		const first = await executeScripts({config, extensions, scripts, provider, deploymentStore});
		const proxyAddress = first.get('Vault').address.toLowerCase();
		const sentBefore = sent(provider).length;

		// Vault.sol changed and the project was recompiled: the same script runs again, unchanged
		const original = artifacts.Vault;
		artifacts.Vault = {
			...original,
			deployedBytecode: `${original.deployedBytecode!}b3`,
			bytecode: `${original.bytecode}b3`,
		};
		try {
			const second = await executeScripts({config, extensions, scripts, provider, deploymentStore});
			const newImplementation = second.get('Vault_Implementation').address;

			expect(newImplementation).not.toBe(first.get('Vault_Implementation').address);
			expect(sent(provider).slice(sentBefore)).toEqual([
				expect.objectContaining({from: DEPLOYER, to: undefined}), // the new implementation
				{
					from: ADMIN,
					to: proxyAddress,
					data: encodeFunctionData({
						abi: UPGRADE_TO_AND_CALL,
						functionName: 'upgradeToAndCall',
						args: [newImplementation, POST_UPGRADE],
					}),
				},
			]);
			// the same address, now recorded on the new implementation
			expect(second.get('Vault').address.toLowerCase()).toBe(proxyAddress);
			expect(second.get('Vault').implementation).toBe(newImplementation);

			// and the re-run of the upgraded project converges
			const sentAfterUpgrade = sent(provider).length;
			await executeScripts({config, extensions, scripts, provider, deploymentStore});
			expect(sent(provider)).toHaveLength(sentAfterUpgrade);
		} finally {
			artifacts.Vault = original;
		}
	});
});

describe('rocketh-deploy, proxies: an upgrade story kept with `upgradeIndex`', () => {
	it('a fresh chain replays step 0 then step 1; the re-run sends nothing', async () => {
		const {provider, deploymentStore} = await proxyChain();
		const scripts = {'02_counter.ts': counter};

		const env = await executeScripts({config, extensions, scripts, provider, deploymentStore});

		const proxyAddress = env.get('Counter').address.toLowerCase();
		const v2 = env.get('Counter_Implementation').address;
		expect(sent(provider)).toEqual([
			expect.objectContaining({from: DEPLOYER, to: undefined}), // CounterV1
			expect.objectContaining({from: DEPLOYER, to: undefined}), // the proxy, initialized with `init`
			expect.objectContaining({from: DEPLOYER, to: undefined}), // CounterV2
			{
				from: ADMIN,
				to: proxyAddress,
				data: encodeFunctionData({
					abi: UPGRADE_TO_AND_CALL,
					functionName: 'upgradeToAndCall',
					args: [v2, POST_UPGRADE],
				}),
			},
		]);
		expect(env.get('Counter').numDeployments).toBe(2);

		const sentBefore = sent(provider).length;
		await executeScripts({config, extensions, scripts, provider, deploymentStore});
		expect(sent(provider)).toHaveLength(sentBefore);
	});
});
