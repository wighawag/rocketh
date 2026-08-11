/**
 * Integration Tests for @rocketh/proxy
 *
 * These tests serve as documentation for how to use proxy deployment patterns.
 * They demonstrate real-world scenarios including different proxy types,
 * upgrades, and initialization.
 *
 * Note: These tests are primarily documentation examples. Full integration testing
 * would require a local blockchain node (like Anvil or Hardhat Network).
 *
 * They run against `createTestEnvironment` from @rocketh/test-utils, which builds a REAL
 * rocketh environment (`createEnvironment` in `packages/rocketh`) against a mock EIP-1193
 * provider. So each proxy deployment below genuinely resolves accounts and broadcasts the
 * implementation and the proxy through the single `broadcastTransaction` choke point, and
 * the two deployments get DISTINCT addresses (the mock receipt is per-transaction); only
 * the RPC answers are canned.
 *
 * Every case here builds a fresh environment under a fresh name, so `env.getOrNull(name)`
 * in `deployViaProxy` is always null and every case takes the FRESH-deployment path. The
 * upgrade branch (and its `eth_getStorageAt` implementation-slot / owner-slot reads) is
 * therefore never reached, which is why no test mocks those calls. If you add a case that
 * needs them, you are adding an upgrade test, which is separate work.
 */

import {describe, it, expect} from 'vitest';
import {deployViaProxy} from '../src/index.js';
import {
	createMockArtifact,
	createNodeHeldEnvironment,
	createTestEnvironment,
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
} from '@rocketh/test-utils';

/**
 * Named accounts in the real `UserConfig.accounts` shape, declared as bare addresses;
 * `nodeAccounts` says the node actually HOLDS them (`eth_accounts`), so they are signable
 * and broadcast through `eth_sendTransaction`.
 */
const NAMED_ACCOUNTS = STANDARD_NAMED_ACCOUNTS;

/** The environment these tests deploy from: the standard named accounts, all held by the node. */
const createEnv = createNodeHeldEnvironment;

/**
 * The SHARED-ADMIN proxy flavours (`SharedAdminOpenZeppelinTransparentProxy`,
 * `SharedAdminOptimizedTransparentProxy`) are the only two that deploy a separate
 * `DefaultProxyAdmin` contract and route the upgrade through it. Before using it,
 * `deployViaProxy` READS `owner()` off that admin and refuses if it is not the expected
 * owner - so unlike every other proxy flavour these need the node to answer an
 * `eth_call`, which the default harness does not (it answers `0x`, i.e. no data, which
 * the read path retries and then surfaces as a decode error).
 *
 * Answering it with the deployer's address, ABI-encoded as a 32-byte word, is what these
 * two cases need and is why they get their own environment.
 */
function createSharedAdminEnv() {
	const ownerWord = `0x${'0'.repeat(24)}${STANDARD_NAMED_ACCOUNTS.deployer.slice(2).toLowerCase()}` as `0x${string}`;
	return createTestEnvironment({
		accounts: STANDARD_NAMED_ACCOUNTS,
		nodeAccounts: NODE_HELD_ACCOUNTS,
		providerConfig: {responses: {eth_call: ownerWord}},
	});
}

describe('@rocketh/proxy - Integration Tests', () => {
	describe('ERC173 Proxy Pattern', () => {
		it('should demonstrate ERC173 proxy deployment', async () => {
			/**
			 * Example: Deploying with ERC173 proxy (ownable proxy)
			 *
			 * The ERC173 proxy implements a standard ownership mechanism.
			 * The proxy itself is ownable, which means:
			 * - The deployer (or specified owner) can upgrade the proxy
			 * - Ownership can be transferred
			 * - The proxy follows ERC173 standard
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * import {deployViaProxy} from '@rocketh/proxy';
			 * import {MyContract} from './artifacts/MyContract.js';
			 *
			 * const _deployViaProxy = deployViaProxy(env);
			 * const deployment = await _deployViaProxy('MyContract', {
			 *   account: 'deployer',
			 *   artifact: MyContract,
			 *   args: [],
			 * });
			 * ```
			 */
			const {env} = await createEnv();
			const _deployViaProxy = deployViaProxy(env);

			const artifact = createMockArtifact('OwnableLogic');

			const deployment = await _deployViaProxy('OwnableContract', {
				account: 'deployer',
				artifact,
				args: [],
			});

			expect(deployment).toBeDefined();
			expect(deployment.address).toBeDefined();

			// A proxy deployment is TWO contracts: the implementation and the proxy in front of
			//  it, saved under `<name>_Implementation` and `<name>_Proxy`, with `<name>` itself
			//  pointing at the proxy and carrying the merged ABI. Asserted here because the
			//  addresses now come from the real broadcast path (one receipt per transaction), so
			//  a harness that reported a single contract address for every transaction would
			//  collapse the two onto one address without any test noticing.
			const implementation = env.get('OwnableContract_Implementation');
			const proxy = env.get('OwnableContract_Proxy');
			expect(implementation.address).not.toBe(proxy.address);
			expect(deployment.address).toBe(proxy.address);
			expect(deployment.abi.length).toBeGreaterThan(artifact.abi.length);
		});

		it('should demonstrate ERC173 proxy with custom owner', async () => {
			/**
			 * Example: ERC173 proxy with custom owner
			 *
			 * You can specify a custom owner for the proxy using
			 * the 'owner' option. This is useful when you want
			 * the proxy to be owned by a different account than
			 * the deployer.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _deployViaProxy('MyContract', {
			 *   account: 'deployer',
			 *   artifact: MyContract,
			 *   args: [],
			 *   owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as any,
			 * });
			 * ```
			 */
			const {env} = await createEnv();
			const _deployViaProxy = deployViaProxy(env);

			const artifact = createMockArtifact('CustomOwnerLogic');

			const deployment = await _deployViaProxy(
				'CustomOwnerContract',
				{
					account: 'deployer',
					artifact,
					args: [],
				},
				{
					owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
				},
			);

			expect(deployment).toBeDefined();
		});

		it('should demonstrate initialization after proxy deployment', async () => {
			/**
			 * Example: Proxy with initialization
			 *
			 * You can execute a function immediately after deploying
			 * the proxy. This is commonly used to initialize the
			 * contract state. The 'execute' option specifies the
			 * function name and arguments.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _deployViaProxy('MyContract', {
			 *   account: 'deployer',
			 *   artifact: MyContract,
			 *   args: [],
			 *   execute: {
			 *     methodName: 'initialize',
			 *     args: [42n],
			 *   },
			 * });
			 * ```
			 */
			const {env} = await createEnv();
			const _deployViaProxy = deployViaProxy(env);

			const artifact = createMockArtifact('InitableLogic', [
				{
					type: 'function',
					name: 'initialize',
					inputs: [{type: 'uint256', name: '_initialValue'}],
					outputs: [],
					stateMutability: 'nonpayable',
				},
			]);

			const deployment = await _deployViaProxy(
				'InitableContract',
				{
					account: 'deployer',
					artifact,
					args: [],
				},
				{
					execute: {
						methodName: 'initialize',
						args: [42n],
					},
				},
			);

			expect(deployment).toBeDefined();
		});
	});

	describe('UUPS Proxy Pattern', () => {
		it('should demonstrate UUPS proxy deployment', async () => {
			/**
			 * Example: Deploying with UUPS (Universal Upgradeable Proxy Standard)
			 *
			 * UUPS is a more gas-efficient proxy pattern where the upgrade
			 * logic is in the implementation contract itself, not the proxy.
			 * Key characteristics:
			 * - Lower gas costs
			 * - Implementation must include upgrade functions
			 * - Cannot be upgraded if implementation doesn't support it
			 * - Follows ERC-1822 standard
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _deployViaProxy('MyContract', {
			 *   account: 'deployer',
			 *   artifact: MyContract,
			 *   args: [],
			 *   proxyContract: 'UUPS',
			 * });
			 * ```
			 */
			const {env} = await createEnv();
			const _deployViaProxy = deployViaProxy(env);

			const artifact = createMockArtifact('UUPSLogic', [
				{
					type: 'function',
					name: 'upgradeTo',
					inputs: [{type: 'address', name: 'newImplementation'}],
					outputs: [],
					stateMutability: 'nonpayable',
				},
				{
					type: 'function',
					name: 'proxiableUUID',
					inputs: [],
					outputs: [{type: 'bytes32'}],
					stateMutability: 'view',
				},
			]);

			const deployment = await _deployViaProxy(
				'UUPSContract',
				{
					account: 'deployer',
					artifact,
					args: [],
				},
				{
					proxyContract: 'UUPS',
				},
			);

			expect(deployment).toBeDefined();
		});
	});

	describe('Transparent Proxy Pattern', () => {
		it('should demonstrate OpenZeppelin Transparent Proxy', async () => {
			/**
			 * Example: Deploying with OpenZeppelin Transparent Proxy
			 *
			 * Transparent proxies use an admin contract that handles
			 * upgrades. The proxy itself delegates all calls to the
			 * implementation except when called by the admin.
			 * Key characteristics:
			 * - Uses a separate ProxyAdmin contract
			 * - Admin can upgrade the implementation
			 * - Users cannot accidentally call admin functions
			 * - More secure but higher gas cost
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _deployViaProxy('MyContract', {
			 *   account: 'deployer',
			 *   artifact: MyContract,
			 *   args: [],
			 *   proxyContract: 'SharedAdminOpenZeppelinTransparentProxy',
			 * });
			 * ```
			 */
			const {env} = await createSharedAdminEnv();
			const _deployViaProxy = deployViaProxy(env);
			const artifact = createMockArtifact('TransparentLogic');
			const deployment = await _deployViaProxy(
				'TransparentContract',
				{
					account: 'deployer',
					artifact,
					args: [],
				},
				{
					proxyContract: 'SharedAdminOpenZeppelinTransparentProxy',
				},
			);
			expect(deployment).toBeDefined();

			// What makes this flavour different from the others: a SEPARATE DefaultProxyAdmin
			//  contract is deployed and owns the upgrade rights, instead of the proxy owning
			//  them itself. Asserted here because it is the only coverage of that path.
			const proxyAdmin = env.get('DefaultProxyAdmin');
			expect(proxyAdmin.address).toBeDefined();
			const implementation = env.get('TransparentContract_Implementation');
			const proxy = env.get('TransparentContract_Proxy');
			expect(implementation.address).not.toBe(proxy.address);
			expect(proxyAdmin.address).not.toBe(proxy.address);
			expect(deployment.address).toBe(proxy.address);
		});

		it('should demonstrate Optimized Transparent Proxy', async () => {
			/**
			 * Example: Deploying with Optimized Transparent Proxy
			 *
			 * The optimized transparent proxy reduces gas costs compared
			 * to the standard OpenZeppelin version while maintaining
			 * the same security guarantees.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _deployViaProxy('MyContract', {
			 *   account: 'deployer',
			 *   artifact: MyContract,
			 *   args: [],
			 *   proxyContract: 'SharedAdminOptimizedTransparentProxy',
			 * });
			 * ```
			 */
			const {env} = await createSharedAdminEnv();
			const _deployViaProxy = deployViaProxy(env);
			const artifact = createMockArtifact('OptimizedTransparentLogic');
			const deployment = await _deployViaProxy(
				'OptimizedTransparentContract',
				{
					account: 'deployer',
					artifact,
					args: [],
				},
				{
					proxyContract: 'SharedAdminOptimizedTransparentProxy',
				},
			);
			expect(deployment).toBeDefined();

			// Same shared-admin shape as the OpenZeppelin flavour above; the difference is the
			//  proxy artifact, not the admin arrangement.
			expect(env.get('DefaultProxyAdmin').address).toBeDefined();
			const implementation = env.get('OptimizedTransparentContract_Implementation');
			const proxy = env.get('OptimizedTransparentContract_Proxy');
			expect(implementation.address).not.toBe(proxy.address);
			expect(deployment.address).toBe(proxy.address);
		});
	});

	describe('Deterministic Proxy Deployment', () => {
		it('should demonstrate deterministic proxy deployment', async () => {
			/**
			 * Example: Deterministic proxy deployment
			 *
			 * You can deploy proxies deterministically, which means
			 * the proxy address is predictable based on a salt.
			 * This is useful for cross-chain deployments and
			 * gas optimization.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _deployViaProxy('MyContract', {
			 *   account: 'deployer',
			 *   artifact: MyContract,
			 *   args: [],
			 *   deterministic: {
			 *     type: 'create2',
			 *     salt: '0x1111...',
			 *   },
			 * });
			 * ```
			 */
			const {env} = await createEnv();
			const _deployViaProxy = deployViaProxy(env);

			const artifact = createMockArtifact('DeterministicProxyLogic');

			const salt = '0x1111111111111111111111111111111111111111111111111111111111111111' as `0x${string}`;

			const deployment = await _deployViaProxy(
				'DeterministicProxyContract',
				{
					account: 'deployer',
					artifact,
					args: [],
				},
				{
					deterministic: {
						type: 'create2',
						salt,
					},
				},
			);

			expect(deployment).toBeDefined();
		});
	});

	describe('Error Handling', () => {
		it('should demonstrate error for missing account', async () => {
			/**
			 * Example: Error handling for missing account
			 */
			const {env} = await createEnv();
			const _deployViaProxy = deployViaProxy(env);

			const artifact = createMockArtifact('NoAccountContract');

			await expect(
				// @ts-expect-error - Testing error case
				_deployViaProxy('NoAccountContract', {
					artifact,
					args: [],
				}),
			).rejects.toThrow('no account specified');
		});
	});
});
