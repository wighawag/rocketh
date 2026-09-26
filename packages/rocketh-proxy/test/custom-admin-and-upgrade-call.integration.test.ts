/**
 * Integration tests for @rocketh/proxy - BRING YOUR OWN ProxyAdmin, and your own UPGRADE CALL.
 *
 * Two shapes the bundled `DefaultProxyAdmin` and the four built-in upgrade methods
 * (`upgradeTo`, `upgradeToAndCall`, `upgrade`, `upgradeAndCall`) cannot drive:
 *
 * - A REGISTRY-STYLE ADMIN: the contract that holds upgrade rights over your proxies is
 *   your own (it may do more than a stock `ProxyAdmin`: keep a registry of every proxy,
 *   emit your own events, gate upgrades further). You either hand rocketh its ARTIFACT so
 *   it deploys it the first time (`proxyAdminArtifact`), or you deployed it yourself and
 *   rocketh finds it by NAME (`proxyAdminName`).
 * - A DIFFERENTLY NAMED UPGRADE ENTRY POINT: your admin (or your proxy) upgrades through
 *   `upgradeProxy(proxy, implementation, data)` or similar. `upgradeFunction` names the
 *   method and says where each value goes, with the placeholders `{proxy}`,
 *   `{implementation}`, `{data}` and `{admin}`.
 *
 * A custom admin is accepted where rocketh already routes through an admin contract (the
 * two `SharedAdmin*` transparent proxies) and on a `custom` proxy. `upgradeFunction`
 * works with every proxy kind, with or without an admin contract.
 *
 * The provider is a mock, not an EVM, so the tests write the storage the contracts would
 * hold (the EIP-1967 slots) and answer the admin's `owner()` themselves. Same recipe as
 * `upgrade.integration.test.ts` and `@rocketh/unknown-signer`'s scenarios.
 */

import {describe, it, expect} from 'vitest';
import {deployViaProxy, type ProxyDeployOptions} from '../src/index.js';
import {deploy} from '@rocketh/deploy';
import {
	createTestEnvironment,
	createMockArtifact,
	createMapDeploymentStore,
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
} from '@rocketh/test-utils';
import {encodeAbiParameters, encodeFunctionData, zeroAddress} from 'viem';
import type {Abi, Artifact, DeploymentStore, Environment} from '@rocketh/core/types';

const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';
const ZERO_SLOT = `0x${'0'.repeat(64)}` as `0x${string}`;

const DEPLOYER = STANDARD_NAMED_ACCOUNTS.deployer;

// ============================================================================
// The contracts
// ============================================================================

/** A registry-style admin: `Ownable`, and its upgrade entry point is NOT called `upgrade`. */
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

/** A stock `ProxyAdmin` shape, for the default `upgrade` / `upgradeAndCall` routing. */
const STOCK_ADMIN_ABI = [
	{type: 'constructor', inputs: [{type: 'address', name: 'initialOwner'}], stateMutability: 'nonpayable'},
	{type: 'function', name: 'owner', inputs: [], outputs: [{type: 'address'}], stateMutability: 'view'},
	{
		type: 'function',
		name: 'upgrade',
		inputs: [
			{type: 'address', name: 'proxy'},
			{type: 'address', name: 'implementation'},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'upgradeAndCall',
		inputs: [
			{type: 'address', name: 'proxy'},
			{type: 'address', name: 'implementation'},
			{type: 'bytes', name: 'data'},
		],
		outputs: [],
		stateMutability: 'payable',
	},
] as const satisfies Abi;

/** A user's own proxy, upgradeable through a method none of the built-in ones is named. */
const OWN_PROXY_ABI = [
	{
		type: 'constructor',
		inputs: [
			{type: 'address', name: 'implementation'},
			{type: 'address', name: 'admin'},
			{type: 'bytes', name: 'data'},
		],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'setImplementation',
		inputs: [
			{type: 'address', name: 'implementation'},
			{type: 'bytes', name: 'data'},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

/**
 * A user's own TRANSPARENT-style proxy: the admin upgrades it through `upgradeTo` /
 * `upgradeToAndCall`, so a stock `ProxyAdmin` can sit in front of it. (rocketh picks
 * `upgrade` over `upgradeAndCall` by whether the PROXY has `upgradeTo`.)
 */
const OWN_TRANSPARENT_PROXY_ABI = [
	OWN_PROXY_ABI[0],
	{
		type: 'function',
		name: 'upgradeTo',
		inputs: [{type: 'address', name: 'implementation'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

const CONTRACT_ABI = [
	{type: 'constructor', inputs: [{type: 'uint256', name: 'initialValue'}], stateMutability: 'nonpayable'},
	{type: 'function', name: 'getValue', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
	{type: 'function', name: 'migrate', inputs: [], outputs: [], stateMutability: 'nonpayable'},
] as const satisfies Abi;

function withCode<TAbi extends Abi>(artifact: Artifact<TAbi>, marker: string): Artifact<TAbi> {
	return {
		...artifact,
		bytecode: `0x6080604052348015600f57600080fd5b50${marker}` as `0x${string}`,
		deployedBytecode: `0x6080604052${marker}dead0002` as `0x${string}`,
	};
}

const registryAdminArtifact = () => withCode(createMockArtifact('RegistryAdmin', REGISTRY_ADMIN_ABI), 'a1');
const stockAdminArtifact = () => withCode(createMockArtifact('MyProxyAdmin', STOCK_ADMIN_ABI), 'a2');
const ownProxyArtifact = () => withCode(createMockArtifact('OwnProxy', OWN_PROXY_ABI), 'b1');
const ownTransparentProxyArtifact = () =>
	withCode(createMockArtifact('OwnTransparentProxy', OWN_TRANSPARENT_PROXY_ABI), 'b2');

/** Two versions of the implementation, differing in code ahead of the CBOR metadata. */
function vault(version: 1 | 2): Artifact<typeof CONTRACT_ABI> {
	return withCode(createMockArtifact('Vault', CONTRACT_ABI), version === 1 ? '11' : '22');
}

// ============================================================================
// The chain the mock stands in for
// ============================================================================

/**
 * What the chain holds, shared across runs: the EIP-1967 slots, and the `owner()` of each
 * admin contract (keyed by DEPLOYMENT NAME and resolved against the running environment,
 * because `deployViaProxy` deploys an admin and reads its owner in one call).
 */
function createChain() {
	const slots = new Map<string, `0x${string}`>();
	const owners = new Map<string, `0x${string}`>();
	const keyOf = (address: string, slot: string) => `${address.toLowerCase()}:${slot.toLowerCase()}`;
	return {
		store: createMapDeploymentStore() as DeploymentStore,
		counter: {value: 0},
		setSlot(address: `0x${string}`, slot: string, value: `0x${string}`) {
			slots.set(keyOf(address, slot), `0x${value.slice(2).toLowerCase().padStart(64, '0')}` as `0x${string}`);
		},
		setOwner(deploymentName: string, owner: `0x${string}`) {
			owners.set(deploymentName, owner);
		},
		getStorageAt(params?: unknown[]) {
			const [address, slot] = params as [string, string];
			return slots.get(keyOf(address, slot)) ?? ZERO_SLOT;
		},
		call(params: unknown[] | undefined, env: Environment | undefined) {
			const [call] = params as [{to?: string; data?: string; input?: string}];
			const data = (call.data ?? call.input ?? '').toLowerCase();
			if (!env || !call.to || !data.startsWith('0x8da5cb5b' /* owner() */)) return '0x';
			for (const [name, owner] of owners) {
				if (env.getOrNull(name)?.address.toLowerCase() === call.to.toLowerCase()) {
					return `0x${owner.slice(2).toLowerCase().padStart(64, '0')}`;
				}
			}
			return '0x';
		},
	};
}
type Chain = ReturnType<typeof createChain>;

/** One run of a deploy script against `chain`; a second call models RE-RUNNING it. */
async function run(chain: Chain) {
	let thisRun: Environment | undefined;
	const result = await createTestEnvironment({
		accounts: STANDARD_NAMED_ACCOUNTS,
		nodeAccounts: NODE_HELD_ACCOUNTS,
		deploymentStore: chain.store,
		providerConfig: {
			responses: {
				eth_getStorageAt: (params?: unknown[]) => chain.getStorageAt(params),
				eth_call: (params?: unknown[]) => chain.call(params, thisRun),
				eth_getTransactionReceipt: () => {
					chain.counter.value++;
					return {
						contractAddress: `0x${chain.counter.value.toString(16).padStart(40, 'a')}`,
						status: '0x1',
						blockNumber: '0x1',
						blockHash: `0x${'b'.repeat(64)}`,
						transactionHash: `0x${'c'.repeat(64)}`,
						gasUsed: '0x5208',
					};
				},
			},
		},
	});
	thisRun = result.env;
	await result.internal.loadDeployments();
	return result;
}

type SentTx = {from: string; to?: string; data?: string};
function sent(provider: {getRequests: () => {method: string; params?: unknown[]}[]}): SentTx[] {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendTransaction')
		.map((r) => r.params?.[0] as SentTx);
}

/** Deploy `Vault` at v1 and mirror what the proxy constructor wrote. */
async function deployV1(chain: Chain, options: ProxyDeployOptions) {
	const {env, provider} = await run(chain);
	const proxy = await deployViaProxy(env)('Vault', {account: 'deployer', artifact: vault(1), args: [42n]}, options);
	const admin = findAdmin(env) ?? DEPLOYER;
	chain.setSlot(proxy.address, IMPLEMENTATION_SLOT, env.get('Vault_Implementation').address);
	chain.setSlot(proxy.address, ADMIN_SLOT, admin);
	return {env, provider, proxy, admin};
}

const ADMIN_NAMES = ['RegistryAdmin', 'MyProxyAdmin', 'DefaultProxyAdmin'];
function findAdmin(env: Environment): `0x${string}` | undefined {
	for (const name of ADMIN_NAMES) {
		const d = env.getOrNull(name);
		if (d) return d.address;
	}
	return undefined;
}

// ============================================================================
// A custom admin contract
// ============================================================================

describe('@rocketh/proxy - a ProxyAdmin deployed from your own artifact', () => {
	it('deploys the admin from the artifact, owned by the proxy owner, and makes it the proxy admin', async () => {
		/**
		 * Example: your proxies are administered by your own registry-style admin. Give
		 * rocketh its artifact and a deployment name; the first run deploys it with
		 * `[owner]` as constructor arguments (the same convention as the bundled one), and
		 * every later run finds it by that name.
		 *
		 * ```typescript
		 * await deployViaProxy('Vault', {account: deployer, artifact: artifacts.Vault}, {
		 *   proxyContract: {
		 *     type: 'SharedAdminOptimizedTransparentProxy',
		 *     proxyAdminName: 'RegistryAdmin',
		 *     proxyAdminArtifact: artifacts.RegistryAdmin,
		 *   },
		 * });
		 * ```
		 */
		const chain = createChain();
		chain.setOwner('RegistryAdmin', DEPLOYER);
		const {env, provider, proxy} = await deployV1(chain, {
			proxyContract: {
				type: 'SharedAdminOptimizedTransparentProxy',
				proxyAdminName: 'RegistryAdmin',
				proxyAdminArtifact: registryAdminArtifact(),
			},
		});

		const admin = env.get('RegistryAdmin');
		// it IS the caller's contract, not the bundled one
		expect(admin.abi).toStrictEqual(REGISTRY_ADMIN_ABI);
		expect(env.getOrNull('DefaultProxyAdmin')).toBeNull();

		// deployed with `[owner]`, and the proxy constructor was handed the admin's address
		const txs = sent(provider);
		const ownerArg = encodeAbiParameters([{type: 'address'}], [DEPLOYER]).slice(2);
		expect(txs.some((tx) => tx.data === `${registryAdminArtifact().bytecode}${ownerArg}`)).toBe(true);
		const proxyTx = txs[txs.length - 1];
		expect(proxyTx.data?.toLowerCase()).toContain(admin.address.slice(2).toLowerCase());
		expect(proxy.address).toBe(env.get('Vault_Proxy').address);
	});

	it('upgrades through that admin, from its owner, with the default `upgrade` call', async () => {
		const chain = createChain();
		chain.setOwner('MyProxyAdmin', DEPLOYER);
		const options: ProxyDeployOptions = {
			proxyContract: {
				type: 'SharedAdminOpenZeppelinTransparentProxy',
				proxyAdminName: 'MyProxyAdmin',
				proxyAdminArtifact: stockAdminArtifact(),
			},
		};
		const {proxy, admin} = await deployV1(chain, options);

		const {env, provider} = await run(chain);
		await deployViaProxy(env)('Vault', {account: 'deployer', artifact: vault(2), args: [42n]}, options);

		const v2 = env.get('Vault_Implementation').address;
		const upgrade = sent(provider).find(
			(tx) =>
				tx.data === encodeFunctionData({abi: STOCK_ADMIN_ABI, functionName: 'upgrade', args: [proxy.address, v2]}),
		);
		expect(upgrade?.from.toLowerCase()).toBe(DEPLOYER.toLowerCase());
		expect(upgrade?.to?.toLowerCase()).toBe(admin.toLowerCase());
	});

	it('works on your own `custom` proxy too', async () => {
		const chain = createChain();
		chain.setOwner('MyProxyAdmin', DEPLOYER);
		const options: ProxyDeployOptions = {
			proxyContract: {
				type: 'custom',
				artifact: ownTransparentProxyArtifact(),
				proxyAdminName: 'MyProxyAdmin',
				proxyAdminArtifact: stockAdminArtifact(),
			},
		};
		const {proxy} = await deployV1(chain, options);

		const {env, provider} = await run(chain);
		await deployViaProxy(env)('Vault', {account: 'deployer', artifact: vault(2), args: [42n]}, options);

		const v2 = env.get('Vault_Implementation').address;
		const upgrade = sent(provider).find(
			(tx) =>
				tx.data === encodeFunctionData({abi: STOCK_ADMIN_ABI, functionName: 'upgrade', args: [proxy.address, v2]}),
		);
		expect(upgrade?.to?.toLowerCase()).toBe(env.get('MyProxyAdmin').address.toLowerCase());
	});

	it('refuses an admin artifact with no deployment name', async () => {
		/**
		 * Without a name the artifact would be recorded as `DefaultProxyAdmin`, and a
		 * `DefaultProxyAdmin` some other proxy already deployed would silently win over
		 * the artifact you passed. So the name is required, and the check happens before
		 * anything is deployed.
		 */
		const chain = createChain();
		const {env, provider} = await run(chain);
		await expect(
			deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact: vault(1), args: [42n]},
				{
					proxyContract: {
						type: 'SharedAdminOptimizedTransparentProxy',
						proxyAdminArtifact: stockAdminArtifact(),
					} as unknown as ProxyDeployOptions['proxyContract'],
				},
			),
		).rejects.toThrow(/proxyAdminArtifact.*proxyAdminName/);
		expect(sent(provider)).toHaveLength(0);
	});

	it('only accepts an admin contract on proxy kinds that route through one', () => {
		// ERC173 proxies and UUPS have no admin contract in front of them: the owner (or the
		//  implementation) upgrades the proxy directly. Checked at compile time.
		const erc173: ProxyDeployOptions = {
			// @ts-expect-error an ERC173 proxy takes no admin contract
			proxyContract: {type: 'ERC173Proxy', proxyAdminName: 'MyProxyAdmin'},
		};
		const uups: ProxyDeployOptions = {
			// @ts-expect-error a UUPS proxy takes no admin contract
			proxyContract: {type: 'UUPS', proxyAdminName: 'MyProxyAdmin'},
		};
		expect([erc173, uups]).toHaveLength(2);
	});
});

describe('@rocketh/proxy - an admin you already deployed, found by name', () => {
	it('uses the existing deployment and does not deploy another one', async () => {
		/**
		 * Example: the registry that administers your proxies has its own deploy script
		 * (its constructor is not `[owner]`, or it was deployed long ago). Name it, and
		 * rocketh routes the upgrade through that deployment as-is.
		 */
		const chain = createChain();
		chain.setOwner('RegistryAdmin', DEPLOYER);
		const first = await run(chain);
		const registry = await deploy(first.env)('RegistryAdmin', {
			account: 'deployer',
			artifact: registryAdminArtifact(),
			args: [DEPLOYER],
		});
		const options: ProxyDeployOptions = {
			proxyContract: {type: 'custom', artifact: ownProxyArtifact(), proxyAdminName: 'RegistryAdmin'},
			upgradeFunction: {methodName: 'upgradeProxy', args: ['{proxy}', '{implementation}', '{data}']},
		};
		const proxy = await deployViaProxy(first.env)(
			'Vault',
			{account: 'deployer', artifact: vault(1), args: [42n]},
			options,
		);
		chain.setSlot(proxy.address, IMPLEMENTATION_SLOT, first.env.get('Vault_Implementation').address);
		chain.setSlot(proxy.address, ADMIN_SLOT, registry.address);
		expect(first.env.get('RegistryAdmin').address).toBe(registry.address);

		const {env, provider} = await run(chain);
		await deployViaProxy(env)('Vault', {account: 'deployer', artifact: vault(2), args: [42n]}, options);

		const v2 = env.get('Vault_Implementation').address;
		const txs = sent(provider);
		const upgrade = txs.find(
			(tx) =>
				tx.data ===
				encodeFunctionData({abi: REGISTRY_ADMIN_ABI, functionName: 'upgradeProxy', args: [proxy.address, v2, '0x']}),
		);
		expect(upgrade?.from.toLowerCase()).toBe(DEPLOYER.toLowerCase());
		expect(upgrade?.to?.toLowerCase()).toBe(registry.address.toLowerCase());
		// nothing but the new implementation and the upgrade: no second admin
		expect(txs).toHaveLength(2);
		expect(env.get('RegistryAdmin').address).toBe(registry.address);
	});
});

describe('@rocketh/proxy - ownership refusals hold for a custom admin', () => {
	it('refuses when the admin is owned by someone other than the expected owner', async () => {
		const chain = createChain();
		chain.setOwner('RegistryAdmin', STANDARD_NAMED_ACCOUNTS.user1);
		const {env} = await run(chain);
		await expect(
			deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact: vault(1), args: [42n]},
				{
					proxyContract: {
						type: 'SharedAdminOptimizedTransparentProxy',
						proxyAdminName: 'RegistryAdmin',
						proxyAdminArtifact: registryAdminArtifact(),
					},
				},
			),
		).rejects.toThrow('To change owner/admin, you need to call transferOwnership on RegistryAdmin');
	});

	it('refuses when the admin belongs to no-one', async () => {
		const chain = createChain();
		chain.setOwner('RegistryAdmin', zeroAddress);
		const {env} = await run(chain);
		await expect(
			deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact: vault(1), args: [42n]},
				{
					owner: zeroAddress,
					proxyContract: {
						type: 'custom',
						artifact: ownProxyArtifact(),
						proxyAdminName: 'RegistryAdmin',
						proxyAdminArtifact: registryAdminArtifact(),
					},
				},
			),
		).rejects.toThrow('The Proxy Admin (RegistryAdmin) belongs to no-one. The Proxy cannot be upgraded anymore');
	});
});

// ============================================================================
// A custom upgrade call
// ============================================================================

describe('@rocketh/proxy - your own upgrade call', () => {
	it('calls the named method on the proxy, from its owner, when there is no admin contract', async () => {
		/**
		 * Example: your own proxy upgrades through `setImplementation(implementation, data)`.
		 * `upgradeFunction` names it and says where each value goes.
		 */
		const chain = createChain();
		const options: ProxyDeployOptions = {
			proxyContract: {type: 'custom', artifact: ownProxyArtifact()},
			upgradeFunction: {methodName: 'setImplementation', args: ['{implementation}', '{data}']},
			execute: {init: {methodName: 'migrate', args: []}, onUpgrade: {methodName: 'migrate', args: []}},
		};
		const {proxy} = await deployV1(chain, options);

		const {env, provider} = await run(chain);
		await deployViaProxy(env)('Vault', {account: 'deployer', artifact: vault(2), args: [42n]}, options);

		const v2 = env.get('Vault_Implementation').address;
		const migrate = encodeFunctionData({abi: CONTRACT_ABI, functionName: 'migrate'});
		const upgrade = sent(provider).find(
			(tx) =>
				tx.data === encodeFunctionData({abi: OWN_PROXY_ABI, functionName: 'setImplementation', args: [v2, migrate]}),
		);
		expect(upgrade?.from.toLowerCase()).toBe(DEPLOYER.toLowerCase());
		expect(upgrade?.to?.toLowerCase()).toBe(proxy.address.toLowerCase());
	});

	it('calls the named method on the admin contract, from its owner, when there is one', async () => {
		const chain = createChain();
		chain.setOwner('RegistryAdmin', DEPLOYER);
		const options: ProxyDeployOptions = {
			proxyContract: {
				type: 'SharedAdminOptimizedTransparentProxy',
				proxyAdminName: 'RegistryAdmin',
				proxyAdminArtifact: registryAdminArtifact(),
			},
			upgradeFunction: {methodName: 'upgradeProxy', args: ['{proxy}', '{implementation}', '{data}']},
		};
		const {proxy, admin} = await deployV1(chain, options);

		const {env, provider} = await run(chain);
		await deployViaProxy(env)('Vault', {account: 'deployer', artifact: vault(2), args: [42n]}, options);

		const v2 = env.get('Vault_Implementation').address;
		const upgrade = sent(provider).find(
			(tx) =>
				tx.data ===
				encodeFunctionData({abi: REGISTRY_ADMIN_ABI, functionName: 'upgradeProxy', args: [proxy.address, v2, '0x']}),
		);
		expect(upgrade?.from.toLowerCase()).toBe(DEPLOYER.toLowerCase());
		expect(upgrade?.to?.toLowerCase()).toBe(admin.toLowerCase());
	});

	it('refuses a method the upgrade target does not have, before sending anything', async () => {
		const chain = createChain();
		const options: ProxyDeployOptions = {
			upgradeFunction: {methodName: 'noSuchUpgrade', args: ['{implementation}']},
		};
		await deployV1(chain, options);

		const {env, provider} = await run(chain);
		await expect(
			deployViaProxy(env)('Vault', {account: 'deployer', artifact: vault(2), args: [42n]}, options),
		).rejects.toThrow(/noSuchUpgrade/);
		// only the new implementation went out
		expect(sent(provider)).toHaveLength(1);
	});

	it('refuses to drop the upgrade calldata when the template has no `{data}`', async () => {
		/**
		 * `execute.onUpgrade` produces calldata that must run with the upgrade. A template
		 * with nowhere to put it would upgrade and silently skip your migration step.
		 */
		const chain = createChain();
		const options: ProxyDeployOptions = {
			proxyContract: {type: 'custom', artifact: ownProxyArtifact()},
			upgradeFunction: {methodName: 'setImplementation', args: ['{implementation}', '{implementation}']},
		};
		await deployV1(chain, options);

		const {env} = await run(chain);
		await expect(
			deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact: vault(2), args: [42n]},
				{
					...options,
					execute: {init: {methodName: 'migrate', args: []}, onUpgrade: {methodName: 'migrate', args: []}},
				},
			),
		).rejects.toThrow(/\{data\}/);
	});

	it('refuses a template entry that is not a placeholder, before deploying anything', async () => {
		// a typo like `{implementaton}` would otherwise be sent to the chain as a literal
		const chain = createChain();
		const {env, provider} = await run(chain);
		await expect(
			deployViaProxy(env)(
				'Vault',
				{account: 'deployer', artifact: vault(1), args: [42n]},
				{
					upgradeFunction: {
						methodName: 'upgradeTo',
						args: ['{implementaton}'] as unknown as ['{implementation}'],
					},
				},
			),
		).rejects.toThrow(/\{implementaton\}/);
		expect(sent(provider)).toHaveLength(0);
	});
});
