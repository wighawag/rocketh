/**
 * Integration Tests for @rocketh/proxy
 *
 * These tests serve as documentation for how to use proxy deployment patterns.
 * They demonstrate real-world scenarios including different proxy types,
 * upgrades, and initialization.
 *
 * Note: These tests are primarily documentation examples. Full integration testing
 * would require a local blockchain node (like Anvil or Hardhat Network).
 */

import {describe, it, expect} from 'vitest';
import {deployViaProxy} from '../src/index.js';
import {createMockArtifact, createMockEnvironment} from '@rocketh/test-utils';

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
			const {env} = createMockEnvironment();
			const _deployViaProxy = deployViaProxy(env);

			const artifact = createMockArtifact('OwnableLogic');

			const deployment = await _deployViaProxy('OwnableContract', {
				account: 'deployer',
				artifact,
				args: [],
			});

			expect(deployment).toBeDefined();
			expect(deployment.address).toBeDefined();
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
			const {env} = createMockEnvironment();
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
			const {env} = createMockEnvironment();
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
			const {env} = createMockEnvironment();
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
			// TODO
			// const {env} = createMockEnvironment();
			// const _deployViaProxy = deployViaProxy(env);
			// const artifact = createMockArtifact('TransparentLogic');
			// const deployment = await _deployViaProxy(
			// 	'TransparentContract',
			// 	{
			// 		account: 'deployer',
			// 		artifact,
			// 		args: [],
			// 	},
			// 	{
			// 		proxyContract: 'SharedAdminOpenZeppelinTransparentProxy',
			// 	},
			// );
			// expect(deployment).toBeDefined();
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
			// TODO
			// const {env} = createMockEnvironment();
			// const _deployViaProxy = deployViaProxy(env);
			// const artifact = createMockArtifact('OptimizedTransparentLogic');
			// const deployment = await _deployViaProxy(
			// 	'OptimizedTransparentContract',
			// 	{
			// 		account: 'deployer',
			// 		artifact,
			// 		args: [],
			// 	},
			// 	{
			// 		proxyContract: 'SharedAdminOptimizedTransparentProxy',
			// 	},
			// );
			// expect(deployment).toBeDefined();
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
			const {env} = createMockEnvironment();
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
			const {env} = createMockEnvironment();
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
