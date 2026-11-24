/**
 * Integration tests for @rocketh/proxy - a proxy that CREATES ITS OWN ADMIN, such as
 * OpenZeppelin 5's `TransparentUpgradeableProxy`.
 *
 * OpenZeppelin 5's transparent proxy takes no admin: its constructor
 * `(logic, initialOwner, data)` deploys a `ProxyAdmin` owned by `initialOwner` and writes
 * that new contract's address into the EIP-1967 admin slot. Upgrades then go through that
 * ProxyAdmin's `upgradeAndCall(proxy, implementation, data)`, sent by its owner (the v5
 * ProxyAdmin has no `upgrade`).
 *
 * `deployViaProxy` drives it with the proxy's own artifact (compile OpenZeppelin in your
 * project, for instance with Hardhat's `npmFilesToBuild`) and `createsProxyAdmin: true`:
 *
 * ```typescript
 * await deployViaProxy('Vault', {account: deployer, artifact: artifacts.Vault, args: []}, {
 *   owner: admin,
 *   proxyContract: {
 *     type: 'custom',
 *     artifact: artifacts.TransparentUpgradeableProxy,
 *     createsProxyAdmin: true,
 *     proxyAdminArtifact: artifacts.ProxyAdmin,
 *   },
 *   execute: {init: 'initialize'},
 * });
 * ```
 *
 * The same call, with the same options, deploys the proxy on the first run and upgrades it
 * on every later one.
 *
 * The provider is a mock, not an EVM, so the chain below plays the part of the contracts:
 * it answers the EIP-1967 slots (including the admin the proxy "created") and the admin's
 * `owner()`. Same recipe as `custom-admin-and-upgrade-call.integration.test.ts`.
 */

import {describe, it, expect} from 'vitest';
import {deployViaProxy, type ProxyDeployOptions} from '../src/index.js';
import {
	createTestEnvironment,
	createMockArtifact,
	createMapDeploymentStore,
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
} from '@rocketh/test-utils';
import {encodeAbiParameters, encodeFunctionData} from 'viem';
import type {Abi, Artifact, DeploymentStore, Environment} from '@rocketh/core/types';

const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';
const ZERO_SLOT = `0x${'0'.repeat(64)}` as `0x${string}`;

const DEPLOYER = STANDARD_NAMED_ACCOUNTS.deployer;
/** Where the proxy's constructor put the ProxyAdmin it created. */
const CREATED_ADMIN = '0x00000000000000000000000000000000000ad111' as const;

// ============================================================================
// The contracts
// ============================================================================

/** OpenZeppelin 5's `TransparentUpgradeableProxy`: a constructor and no public function. */
const TUP_V5_ABI = [
	{
		type: 'constructor',
		inputs: [
			{type: 'address', name: '_logic'},
			{type: 'address', name: 'initialOwner'},
			{type: 'bytes', name: '_data'},
		],
		stateMutability: 'payable',
	},
] as const satisfies Abi;

/** OpenZeppelin 5's `ProxyAdmin`: `owner()` and `upgradeAndCall`, no `upgrade`. */
const PROXY_ADMIN_V5_ABI = [
	{type: 'constructor', inputs: [{type: 'address', name: 'initialOwner'}], stateMutability: 'nonpayable'},
	{type: 'function', name: 'owner', inputs: [], outputs: [{type: 'address'}], stateMutability: 'view'},
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

const VAULT_ABI = [
	{type: 'constructor', inputs: [], stateMutability: 'nonpayable'},
	{type: 'function', name: 'initialize', inputs: [], outputs: [], stateMutability: 'nonpayable'},
	{type: 'function', name: 'migrate', inputs: [], outputs: [], stateMutability: 'nonpayable'},
] as const satisfies Abi;

function withCode<TAbi extends Abi>(artifact: Artifact<TAbi>, marker: string): Artifact<TAbi> {
	return {
		...artifact,
		bytecode: `0x6080604052348015600f57600080fd5b50${marker}` as `0x${string}`,
		deployedBytecode: `0x6080604052${marker}dead0002` as `0x${string}`,
	};
}

const tupV5 = () => withCode(createMockArtifact('TransparentUpgradeableProxy', TUP_V5_ABI), 'c5');
const proxyAdminV5 = () => withCode(createMockArtifact('ProxyAdmin', PROXY_ADMIN_V5_ABI), 'd5');
function vault(version: 1 | 2): Artifact<typeof VAULT_ABI> {
	return withCode(createMockArtifact('Vault', VAULT_ABI), version === 1 ? '11' : '22');
}

const OPTIONS: ProxyDeployOptions = {
	proxyContract: {
		type: 'custom',
		artifact: tupV5(),
		createsProxyAdmin: true,
		proxyAdminArtifact: proxyAdminV5(),
	},
};

// ============================================================================
// The chain the mock stands in for
// ============================================================================

/**
 * What the chain holds, shared across runs. A proxy's admin slot reads as `CREATED_ADMIN`
 * once the proxy exists (that is what its constructor did), unless a test wrote it.
 * `owner()` answers for the contract recorded under `Vault_ProxyAdmin`, or under the name a
 * test gives.
 */
function createChain(
	options: {createsAdmin?: boolean; createdAdminHasCode?: boolean; adminOwner?: `0x${string}`; adminName?: string} = {},
) {
	const slots = new Map<string, `0x${string}`>();
	const keyOf = (address: string, slot: string) => `${address.toLowerCase()}:${slot.toLowerCase()}`;
	const pad = (value: string) => `0x${value.slice(2).toLowerCase().padStart(64, '0')}` as `0x${string}`;
	const chain = {
		store: createMapDeploymentStore() as DeploymentStore,
		counter: {value: 0},
		adminOwner: options.adminOwner ?? DEPLOYER,
		setSlot(address: `0x${string}`, slot: string, value: `0x${string}`) {
			slots.set(keyOf(address, slot), pad(value));
		},
		getStorageAt(params: unknown[] | undefined, env: Environment | undefined) {
			const [address, slot] = params as [string, string];
			const written = slots.get(keyOf(address, slot));
			if (written) return written;
			const proxy = env?.getOrNull('Vault_Proxy');
			if (
				options.createsAdmin !== false &&
				slot.toLowerCase() === ADMIN_SLOT &&
				proxy &&
				proxy.address.toLowerCase() === address.toLowerCase()
			) {
				return pad(CREATED_ADMIN);
			}
			return ZERO_SLOT;
		},
		getCode(params: unknown[] | undefined) {
			const [address] = params as [string];
			return options.createdAdminHasCode !== false && address.toLowerCase() === CREATED_ADMIN
				? ('0x6080604052d5' as `0x${string}`)
				: ('0x' as `0x${string}`);
		},
		call(params: unknown[] | undefined, env: Environment | undefined) {
			const [call] = params as [{to?: string; data?: string; input?: string}];
			const data = (call.data ?? call.input ?? '').toLowerCase();
			if (!env || !call.to || !data.startsWith('0x8da5cb5b' /* owner() */)) return '0x';
			const admin = env.getOrNull(options.adminName ?? 'Vault_ProxyAdmin');
			if (admin && admin.address.toLowerCase() === call.to.toLowerCase()) return pad(chain.adminOwner);
			return '0x';
		},
	};
	return chain;
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
				eth_getStorageAt: (params?: unknown[]) => chain.getStorageAt(params, thisRun),
				eth_getCode: (params?: unknown[]) => chain.getCode(params),
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

/** Deploy `Vault` at v1 and mirror the implementation slot the constructor wrote. */
async function deployV1(chain: Chain, options: ProxyDeployOptions = OPTIONS) {
	const {env, provider} = await run(chain);
	const proxy = await deployViaProxy(env)('Vault', {account: 'deployer', artifact: vault(1), args: []}, options);
	chain.setSlot(proxy.address, IMPLEMENTATION_SLOT, env.get('Vault_Implementation').address);
	return {env, provider, proxy};
}

const upgradeAndCall = (proxy: `0x${string}`, implementation: `0x${string}`, data: `0x${string}`) =>
	encodeFunctionData({abi: PROXY_ADMIN_V5_ABI, functionName: 'upgradeAndCall', args: [proxy, implementation, data]});

// ============================================================================
// The first deploy
// ============================================================================

describe('@rocketh/proxy - a proxy that creates its own ProxyAdmin (OpenZeppelin 5)', () => {
	it('deploys no admin of its own, hands the owner to the constructor, and records the admin the proxy created', async () => {
		/**
		 * Example: the first run. rocketh deploys the implementation and the proxy, and
		 * nothing else: the proxy's constructor receives the owner as `initialOwner` and creates
		 * the ProxyAdmin itself. rocketh then reads the admin slot and records that admin as
		 * `Vault_ProxyAdmin`, with the ABI of the artifact you passed.
		 */
		const chain = createChain();
		const {env, provider, proxy} = await deployV1(chain);

		const txs = sent(provider);
		// two deployments: the implementation and the proxy, no ProxyAdmin
		expect(txs).toHaveLength(2);
		expect(txs.some((tx) => tx.data?.startsWith(proxyAdminV5().bytecode))).toBe(false);
		// the proxy's constructor got the OWNER where a v4 proxy would get an admin contract
		const ownerArg = DEPLOYER.slice(2).toLowerCase();
		expect(txs[1].data?.toLowerCase()).toContain(ownerArg);

		const admin = env.get('Vault_ProxyAdmin');
		expect(admin.address.toLowerCase()).toBe(CREATED_ADMIN);
		expect(admin.abi).toStrictEqual(PROXY_ADMIN_V5_ABI);
		// what its constructor was given (`initialOwner`), and the transaction that created it
		expect(admin.argsData).toBe(encodeAbiParameters([{type: 'address'}], [DEPLOYER]));
		expect(admin.transaction?.hash).toBe(env.get('Vault_Proxy').transaction?.hash);
		expect(proxy.address).toBe(env.get('Vault_Proxy').address);
	});

	it('records it under the name you give', async () => {
		const chain = createChain({adminName: 'VaultAdmin'});
		const {env} = await deployV1(chain, {
			proxyContract: {
				type: 'custom',
				artifact: tupV5(),
				createsProxyAdmin: true,
				proxyAdminArtifact: proxyAdminV5(),
				proxyAdminName: 'VaultAdmin',
			},
		});
		expect(env.get('VaultAdmin').address.toLowerCase()).toBe(CREATED_ADMIN);
		expect(env.getOrNull('Vault_ProxyAdmin')).toBeNull();
	});

	it('refuses a proxy whose admin slot is empty: it did not create an admin', async () => {
		/**
		 * `createsProxyAdmin` on a proxy that takes its admin as a constructor argument would
		 * leave the owner itself as the admin. The empty (or owner-holding) slot is reported
		 * rather than recorded as an admin contract.
		 */
		const chain = createChain({createsAdmin: false});
		await expect(deployV1(chain)).rejects.toThrow(
			'Vault is declared with createsProxyAdmin, but the admin slot of Vault_Proxy',
		);
	});

	it('refuses a proxy whose admin slot holds an account with no code: it did not create an admin', async () => {
		/**
		 * A proxy that takes its admin as a constructor argument holds the OWNER in its admin
		 * slot, usually an account with no code. Recording the ProxyAdmin artifact there would
		 * describe a contract that does not exist, so nothing is recorded.
		 */
		const chain = createChain({createdAdminHasCode: false});
		await expect(deployV1(chain)).rejects.toThrow('which has no code: this proxy did not create an admin contract');
		const {env} = await run(chain);
		expect(env.getOrNull('Vault_ProxyAdmin')).toBeNull();
	});

	it('replaces a leftover admin record with the admin the new proxy created', async () => {
		/**
		 * The admin is only looked up once the proxy exists. On a first deploy the constructor
		 * always gets the owner, and whatever was recorded under the admin's name before is
		 * replaced by the admin this proxy created.
		 */
		const chain = createChain();
		const before = await run(chain);
		await before.env.save('Vault_ProxyAdmin', {
			...proxyAdminV5(),
			address: '0x000000000000000000000000000000000000a333',
			argsData: '0x',
		});

		const {env, provider} = await deployV1(chain);
		expect(env.get('Vault_ProxyAdmin').address.toLowerCase()).toBe(CREATED_ADMIN);
		expect(sent(provider)[1].data?.toLowerCase()).toContain(DEPLOYER.slice(2).toLowerCase());
	});

	// ============================================================================
	// Upgrades
	// ============================================================================

	it('upgrades through the created admin with `upgradeAndCall`, from its owner, with the same options', async () => {
		/**
		 * Example: a later run, the implementation changed. Same call, same options. The
		 * upgrade goes to the ProxyAdmin the proxy created, as `upgradeAndCall` (the proxy has no
		 * `upgradeTo`, and the v5 ProxyAdmin has no `upgrade`), sent by that admin's owner.
		 */
		const chain = createChain();
		const {proxy} = await deployV1(chain);

		const {env, provider} = await run(chain);
		await deployViaProxy(env)('Vault', {account: 'deployer', artifact: vault(2), args: []}, OPTIONS);

		const v2 = env.get('Vault_Implementation').address;
		const upgrade = sent(provider).find((tx) => tx.data === upgradeAndCall(proxy.address, v2, '0x'));
		expect(upgrade?.from.toLowerCase()).toBe(DEPLOYER.toLowerCase());
		expect(upgrade?.to?.toLowerCase()).toBe(CREATED_ADMIN);
	});

	it('carries the `onUpgrade` call in `upgradeAndCall`', async () => {
		const chain = createChain();
		const options: ProxyDeployOptions = {...OPTIONS, execute: {init: 'initialize', onUpgrade: 'migrate'}};
		const {proxy} = await deployV1(chain, options);

		const {env, provider} = await run(chain);
		await deployViaProxy(env)('Vault', {account: 'deployer', artifact: vault(2), args: []}, options);

		const v2 = env.get('Vault_Implementation').address;
		const migrate = encodeFunctionData({abi: VAULT_ABI, functionName: 'migrate'});
		expect(sent(provider).some((tx) => tx.data === upgradeAndCall(proxy.address, v2, migrate))).toBe(true);
	});

	it('upgrades through the created admin with your own `upgradeFunction`', async () => {
		/**
		 * `upgradeFunction` names the method on the admin contract and places its arguments,
		 * and is sent to the created admin from its owner like the built-in call.
		 */
		const chain = createChain();
		const options: ProxyDeployOptions = {
			...OPTIONS,
			upgradeFunction: {methodName: 'upgradeAndCall', args: ['{proxy}', '{implementation}', '{data}']},
		};
		const {proxy} = await deployV1(chain, options);

		const {env, provider} = await run(chain);
		await deployViaProxy(env)('Vault', {account: 'deployer', artifact: vault(2), args: []}, options);

		const v2 = env.get('Vault_Implementation').address;
		const upgrade = sent(provider).find((tx) => tx.data === upgradeAndCall(proxy.address, v2, '0x'));
		expect(upgrade?.from.toLowerCase()).toBe(DEPLOYER.toLowerCase());
		expect(upgrade?.to?.toLowerCase()).toBe(CREATED_ADMIN);
	});

	it('sends nothing when the implementation did not change', async () => {
		const chain = createChain();
		await deployV1(chain);

		const {env, provider} = await run(chain);
		await deployViaProxy(env)('Vault', {account: 'deployer', artifact: vault(1), args: []}, OPTIONS);
		expect(sent(provider)).toHaveLength(0);
	});

	// ============================================================================
	// A proxy deployed before the record existed
	// ============================================================================

	it('records the admin of a proxy deployed without it (by a v1 script, say) on its next run, then upgrades', async () => {
		/**
		 * Example: the proxy was deployed earlier with no admin record, as a hardhat-deploy v1
		 * helper or a plain `custom` proxy leaves it. Adding `createsProxyAdmin` is enough: the
		 * next run reads the admin slot, records the admin, and upgrades through it. Its
		 * construction was not observed, so the record carries no constructor arguments and no
		 * transaction.
		 */
		const chain = createChain();
		const {proxy} = await deployV1(chain, {proxyContract: {type: 'custom', artifact: tupV5()}});

		const {env, provider} = await run(chain);
		expect(env.getOrNull('Vault_ProxyAdmin')).toBeNull();
		await deployViaProxy(env)('Vault', {account: 'deployer', artifact: vault(2), args: []}, OPTIONS);

		const admin = env.get('Vault_ProxyAdmin');
		expect(admin.address.toLowerCase()).toBe(CREATED_ADMIN);
		expect(admin.argsData).toBe('0x');
		expect(admin.transaction).toBeUndefined();
		const v2 = env.get('Vault_Implementation').address;
		expect(sent(provider).some((tx) => tx.data === upgradeAndCall(proxy.address, v2, '0x'))).toBe(true);
	});

	// ============================================================================
	// The same refusals as for any admin contract
	// ============================================================================

	it('refuses when the created admin is owned by someone other than `owner`', async () => {
		const chain = createChain();
		await deployV1(chain);
		chain.adminOwner = '0x000000000000000000000000000000000000beef';

		const {env} = await run(chain);
		await expect(
			deployViaProxy(env)('Vault', {account: 'deployer', artifact: vault(2), args: []}, OPTIONS),
		).rejects.toThrow('To change owner/admin, you need to call transferOwnership on Vault_ProxyAdmin');
	});

	it('refuses when the created admin is owned by no-one', async () => {
		const chain = createChain();
		await deployV1(chain);
		chain.adminOwner = '0x0000000000000000000000000000000000000000';

		const {env} = await run(chain);
		await expect(
			deployViaProxy(env)('Vault', {account: 'deployer', artifact: vault(2), args: []}, OPTIONS),
		).rejects.toThrow('The Proxy Admin (Vault_ProxyAdmin) belongs to no-one');
	});

	it('refuses when the admin slot no longer points at the recorded admin', async () => {
		const chain = createChain();
		const {proxy} = await deployV1(chain);
		const other = '0x000000000000000000000000000000000000a222';
		chain.setSlot(proxy.address, ADMIN_SLOT, other);

		const {env} = await run(chain);
		await expect(
			deployViaProxy(env)('Vault', {account: 'deployer', artifact: vault(2), args: []}, OPTIONS),
		).rejects.toThrow(`To change owner/admin, you need to call the proxy directly, it currently is ${other}`);
	});
});
