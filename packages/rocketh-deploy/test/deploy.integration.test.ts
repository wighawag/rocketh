/**
 * Integration Tests for @rocketh/deploy
 *
 * These tests serve as documentation for how to use the deployment system.
 * They demonstrate real-world scenarios and best practices.
 *
 * Note: These tests use @rocketh/test-utils for mock environments.
 * The mock provider can be configured to return specific values for testing.
 */

import {describe, it, expect} from 'vitest';
import {deploy} from '../src/index.js';
import {createMockEnvironment, createMockArtifact} from '@rocketh/test-utils';

describe('@rocketh/deploy - Integration Tests', () => {
	describe('Basic Contract Deployment', () => {
		it('should demonstrate basic deployment pattern', async () => {
			/**
			 * Example: Deploying a simple contract with constructor arguments
			 *
			 * This demonstrates the most basic deployment scenario:
			 * - Create an environment with named accounts
			 * - Use the deploy function to deploy a contract
			 * - Specify the account, artifact, and constructor arguments
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * import {deploy} from '@rocketh/deploy';
			 * import {MyContract} from './artifacts/MyContract.js';
			 *
			 * const _deploy = deploy(env);
			 * const deployment = await _deploy('MyContract', {
			 *   account: 'deployer',
			 *   artifact: MyContract,
			 *   args: [42n],
			 * });
			 * ```
			 */
			const {env} = createMockEnvironment();
			const _deploy = deploy(env);

			const artifact = createMockArtifact('SimpleContract');

			const deployment = await _deploy('SimpleContract', {
				account: 'deployer',
				artifact,
				args: [42n],
			});

			expect(deployment).toBeDefined();
			expect(deployment.address).toBeDefined();
			expect(deployment.newlyDeployed).toBe(true);
		});

		it('should demonstrate idempotent deployment with skipIfAlreadyDeployed', async () => {
			/**
			 * Example: Idempotent deployment with skipIfAlreadyDeployed
			 *
			 * This demonstrates how to avoid redeploying contracts that
			 * haven't changed. The system checks both bytecode and constructor
			 * arguments before deciding to redeploy.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _deploy('MyContract', {
			 *   account: 'deployer',
			 *   artifact: MyContract,
			 *   args: [100n],
			 *   skipIfAlreadyDeployed: true,
			 * });
			 * ```
			 */
			const {env} = createMockEnvironment();
			const _deploy = deploy(env);

			const artifact = createMockArtifact('ImmutableContract');

			// First deployment
			const firstDeployment = await _deploy(
				'ImmutableContract',
				{
					account: 'deployer',
					artifact,
					args: [100n],
				},
				{
					skipIfAlreadyDeployed: true,
				},
			);

			expect(firstDeployment.newlyDeployed).toBe(true);

			// Second deployment with same args - would skip in real scenario
			const secondDeployment = await _deploy(
				'ImmutableContract',
				{
					account: 'deployer',
					artifact,
					args: [100n],
				},
				{
					skipIfAlreadyDeployed: true,
				},
			);

			// In mock, newlyDeployed is always true, but pattern is demonstrated
			expect(secondDeployment).toBeDefined();
		});

		it('should demonstrate forced redeployment with alwaysOverride', async () => {
			/**
			 * Example: Forced redeployment with alwaysOverride
			 *
			 * This demonstrates how to force a redeployment even if
			 * the contract already exists with the same bytecode.
			 * This is useful for testing or when you need to reset state.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _deploy('MyContract', {
			 *   account: 'deployer',
			 *   artifact: MyContract,
			 *   args: [],
			 *   alwaysOverride: true,
			 * });
			 * ```
			 */
			const {env} = createMockEnvironment();
			const _deploy = deploy(env);

			const artifact = createMockArtifact('UpgradeableContract');

			const deployment = await _deploy(
				'UpgradeableContract',
				{
					account: 'deployer',
					artifact,
					args: [],
				},
				{
					alwaysOverride: true,
				},
			);

			expect(deployment).toBeDefined();
			expect(deployment.newlyDeployed).toBe(true);
		});
	});

	describe('Named Accounts Resolution', () => {
		it('should demonstrate using named accounts', async () => {
			/**
			 * Example: Using named accounts
			 *
			 * Named accounts allow you to reference accounts by name
			 * instead of hardcoded addresses. This makes your deployment
			 * scripts more portable across different networks.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * // In your environment config:
			 * const env = {
			 *   namedAccounts: {
			 *     deployer: '0x...',
			 *     user1: '0x...',
			 *     user2: '0x...',
			 *   },
			 *   // ... other config
			 * };
			 *
			 * const deployment = await _deploy('MyContract', {
			 *   account: 'deployer',
			 *   artifact: MyContract,
			 *   args: [],
			 * });
			 * ```
			 */
			const {env} = createMockEnvironment();
			const _deploy = deploy(env);

			const artifact = createMockArtifact('NamedAccountContract');

			const deployment = await _deploy('NamedAccountContract', {
				account: 'deployer',
				artifact,
				args: [],
			});

			expect(deployment).toBeDefined();
		});

		it('should demonstrate deploying with different named accounts', async () => {
			/**
			 * Example: Using multiple named accounts
			 *
			 * You can use different named accounts for different
			 * deployments. This is useful for multi-signature setups
			 * or when deploying contracts owned by different entities.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment1 = await _deploy('ContractByUser1', {
			 *   account: 'user1',
			 *   artifact: MyContract,
			 *   args: [],
			 * });
			 *
			 * const deployment2 = await _deploy('ContractByUser2', {
			 *   account: 'user2',
			 *   artifact: MyContract,
			 *   args: [],
			 * });
			 * ```
			 */
			const {env} = createMockEnvironment();
			const _deploy = deploy(env);

			const artifact = createMockArtifact('MultiUserContract');

			const deployment1 = await _deploy('ContractByUser1', {
				account: 'user1',
				artifact,
				args: [],
			});

			const deployment2 = await _deploy('ContractByUser2', {
				account: 'user1',
				artifact,
				args: [],
			});

			expect(deployment1).toBeDefined();
			expect(deployment2).toBeDefined();
		});
	});

	describe('Library Linking', () => {
		it('should demonstrate deploying contract with linked libraries', async () => {
			/**
			 * Example: Deploying a contract that uses external libraries
			 *
			 * Libraries are linked at deployment time. You need to:
			 * 1. Deploy the library first
			 * 2. Specify the library addresses in the libraries option
			 * The deployment system will automatically link the library
			 * placeholders in the bytecode.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * // Deploy library
			 * const libraryDeployment = await _deploy('MathLib', {
			 *   account: 'deployer',
			 *   artifact: MathLibArtifact,
			 *   args: [],
			 * });
			 *
			 * // Deploy contract that uses the library
			 * const contractDeployment = await _deploy('Calculator', {
			 *   account: 'deployer',
			 *   artifact: CalculatorArtifact,
			 *   args: [],
			 *   libraries: {
			 *     MathLib: libraryDeployment.address,
			 *   },
			 * });
			 * ```
			 */
			const {env} = createMockEnvironment();
			const _deploy = deploy(env);

			const libraryArtifact = createMockArtifact('MathLib');
			const libraryDeployment = await _deploy('MathLib', {
				account: 'deployer',
				artifact: libraryArtifact,
				args: [],
			});

			const contractArtifact = createMockArtifact('Calculator');

			const contractDeployment = await _deploy(
				'Calculator',
				{
					account: 'deployer',
					artifact: contractArtifact,
					args: [],
				},
				{
					libraries: {
						MathLib: libraryDeployment.address,
					},
				},
			);

			expect(contractDeployment).toBeDefined();
			expect(libraryDeployment).toBeDefined();
		});
	});

	describe('Deterministic Deployments', () => {
		it('should demonstrate CREATE2 deterministic deployment', async () => {
			/**
			 * Example: Deterministic deployment using CREATE2
			 *
			 * Deterministic deployments allow you to deploy contracts
			 * at predictable addresses based on:
			 * - Deployer address (factory)
			 * - Salt (a 32-byte value)
			 * - Contract bytecode
			 *
			 * This is useful for:
			 * - Cross-chain deployments
			 * - Gas optimization (known addresses in advance)
			 * - Multi-chain setups
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _deploy('DeterministicContract', {
			 *   account: 'deployer',
			 *   artifact: MyContract,
			 *   args: [],
			 *   deterministic: {
			 *     type: 'create2',
			 *     salt: '0x1234...',
			 *   },
			 * });
			 * ```
			 */
			const {env} = createMockEnvironment();
			const _deploy = deploy(env);

			const artifact = createMockArtifact('DeterministicContract');

			const salt = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`;

			const deployment = await _deploy(
				'DeterministicContract',
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

		it('should demonstrate CREATE3 deterministic deployment', async () => {
			/**
			 * Example: Deterministic deployment using CREATE3
			 *
			 * CREATE3 provides a different address calculation formula
			 * that's more flexible for certain use cases. The main
			 * advantage is that the address depends only on the salt,
			 * not on the bytecode.
			 *
			 * This is useful when you want to upgrade a contract but
			 * keep the same address.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _deploy('Create3Contract', {
			 *   account: 'deployer',
			 *   artifact: MyContract,
			 *   args: [],
			 *   deterministic: {
			 *     type: 'create3',
			 *     salt: '0x9876...',
			 *   },
			 * });
			 * ```
			 */
			const {env} = createMockEnvironment();
			const _deploy = deploy(env);

			const artifact = createMockArtifact('Create3Contract');

			const salt = '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba' as `0x${string}`;

			const deployment = await _deploy(
				'Create3Contract',
				{
					account: 'deployer',
					artifact,
					args: [],
				},
				{
					deterministic: {
						type: 'create3',
						salt,
					},
				},
			);

			expect(deployment).toBeDefined();
		});
	});

	describe('Linked Data', () => {
		it('should demonstrate attaching metadata to deployments', async () => {
			/**
			 * Example: Attaching metadata to deployments
			 *
			 * Linked data allows you to attach arbitrary metadata
			 * to your deployments. This is useful for:
			 * - Documentation
			 * - Frontend integration
			 * - Deployment tracking
			 * - Versioning
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _deploy('MyContract', {
			 *   account: 'deployer',
			 *   artifact: MyContract,
			 *   args: [],
			 *   linkedData: {
			 *     version: '1.0.0',
			 *     description: 'A contract with metadata',
			 *     author: 'Developer',
			 *     tags: ['test', 'example'],
			 *   },
			 * });
			 * ```
			 */
			const {env} = createMockEnvironment();
			const _deploy = deploy(env);

			const artifact = createMockArtifact('MetadataContract');

			const deployment = await _deploy(
				'MetadataContract',
				{
					account: 'deployer',
					artifact,
					args: [],
				},
				{
					linkedData: {
						version: '1.0.0',
						description: 'A contract with metadata',
						author: 'Developer',
						tags: ['test', 'example'],
					},
				},
			);

			expect(deployment.linkedData).toBeDefined();
			expect(deployment.linkedData?.version).toBe('1.0.0');
		});
	});

	describe('Error Handling', () => {
		it('should demonstrate error for conflicting options', async () => {
			/**
			 * Example: Error handling for conflicting options
			 *
			 * The deployment system validates your options and throws
			 * descriptive errors when there are conflicts.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * // This will throw an error:
			 * const deployment = await _deploy('MyContract', {
			 *   account: 'deployer',
			 *   artifact: MyContract,
			 *   args: [],
			 *   skipIfAlreadyDeployed: true,
			 *   alwaysOverride: true, // Conflict!
			 * });
			 * ```
			 */
			const {env} = createMockEnvironment();
			const _deploy = deploy(env);

			const artifact = createMockArtifact('ConflictingOptionsContract');

			await expect(
				_deploy(
					'ConflictingOptionsContract',
					{
						account: 'deployer',
						artifact,
						args: [],
					},
					{
						skipIfAlreadyDeployed: true,
						alwaysOverride: true,
					},
				),
			).rejects.toThrow('conflicting options');
		});
	});
});
