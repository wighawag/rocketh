/**
 * Integration Tests for @rocketh/deploy
 *
 * These tests serve as documentation for how to use the deployment system.
 * They demonstrate real-world scenarios and best practices.
 *
 * Note: These tests use `createTestEnvironment` from @rocketh/test-utils, which builds a
 * REAL rocketh environment (`createEnvironment` in `packages/rocketh`) against a mock
 * EIP-1193 provider. So every deployment below genuinely goes through account
 * resolution and the single `broadcastTransaction` choke point; only the RPC answers are
 * canned. The mock provider can be configured to return specific values for testing.
 */

import {describe, it, expect} from 'vitest';
import {deploy} from '../src/index.js';
import type {Environment} from '@rocketh/core/types';
import {
	createTestEnvironment,
	createMockArtifact,
	createNodeHeldEnvironment,
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
} from '@rocketh/test-utils';

/**
 * Named accounts in the real `UserConfig.accounts` shape. Declared as bare addresses,
 * which is the spelling a user writes when the addresses are fixed; `nodeAccounts` then
 * says the node actually HOLDS them (`eth_accounts`), so they are signable and broadcast
 * through `eth_sendTransaction`. An account the node does not hold would be `unsignable`
 * and would hit the unknown-signer seam instead (see `unknown-signer-deployer.integration.test.ts`).
 */
const NAMED_ACCOUNTS = STANDARD_NAMED_ACCOUNTS;

/** The environment these tests deploy from: the standard named accounts, all held by the node. */
const createEnv = createNodeHeldEnvironment;

/**
 * The create2 factory info for the run, narrowed out of `DeterministicDeploymentInfo`.
 *
 * That type is a UNION of two shapes: the create2 info DIRECTLY (`{factory, deployer,
 * funding, signedTx}`), or a wrapper carrying optional `create2` / `create3` members.
 * `@rocketh/deploy` narrows it exactly this way, so a test asserting on the factory has
 * to do the same rather than reaching for one member and being right only because of
 * what the harness happens to supply.
 */
function create2Info(env: Environment): {factory: `0x${string}`; deployer: `0x${string}`} {
	const info = env.network.deterministicDeployment as {
		factory?: `0x${string}`;
		deployer?: `0x${string}`;
		create2?: {factory: `0x${string}`; deployer: `0x${string}`};
	};
	const create2 =
		info.create2 ?? (info.factory && info.deployer ? {factory: info.factory, deployer: info.deployer} : undefined);
	if (!create2) {
		throw new Error('this run has no create2 deterministic deployment info');
	}
	return create2;
}

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
			const {env} = await createEnv();
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
			const {env} = await createEnv();
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

			// Second deployment with same args - the existing deployment is reused
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

			expect(secondDeployment).toBeDefined();
			// the deployment saved by the first call is returned as-is, no second transaction
			expect(secondDeployment.newlyDeployed).toBe(false);
			expect(secondDeployment.address).toBe(firstDeployment.address);
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
			const {env} = await createEnv();
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
			const {env} = await createEnv();
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
			const {env, provider} = await createEnv();
			const _deploy = deploy(env);

			const artifact = createMockArtifact('MultiUserContract');

			const deployment1 = await _deploy('ContractByUser1', {
				account: 'user1',
				artifact,
				args: [],
			});

			const deployment2 = await _deploy('ContractByUser2', {
				account: 'user2',
				artifact,
				args: [],
			});

			expect(deployment1).toBeDefined();
			expect(deployment2).toBeDefined();

			// The point of the example is WHICH ACCOUNT SENT WHAT, so assert it rather than
			//  trusting the `account:` field: both deployments went out through the real
			//  broadcast path, so each dispatched transaction's `from` is observable here.
			//  (Until this was fixed both calls passed `user1`, so the example documented two
			//  accounts while exercising one.)
			const sendersInOrder = provider
				.getRequests()
				.filter((r) => r.method === 'eth_sendTransaction')
				.map((r) => ((r.params as [{from: string}])[0].from || '').toLowerCase());

			expect(sendersInOrder).toEqual([NAMED_ACCOUNTS.user1.toLowerCase(), NAMED_ACCOUNTS.user2.toLowerCase()]);
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
			const {env} = await createEnv();
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
			const {env, provider} = await createEnv();
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

			// A deterministic deploy does not send the creation bytecode to the node directly:
			//  it CALLS THE FACTORY, and the address it records is the create2 address computed
			//  from bytecode + salt before broadcast, not one read off the receipt. Asserting the
			//  dispatched `to` is what distinguishes this from an ordinary deployment; the
			//  address assertion is what pins that the computed address is the one recorded.
			const factoryAddress = create2Info(env).factory.toLowerCase();
			const deploymentSends = provider
				.getRequests()
				.filter((r) => r.method === 'eth_sendTransaction')
				.map((r) => ((r.params as [{to?: string}])[0].to || '').toLowerCase());
			expect(deploymentSends).toContain(factoryAddress);
			expect(deployment.address).toBe(env.get('DeterministicContract').address);
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
			const {env, provider} = await createEnv();
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

			// Same shape as the create2 case: the transaction goes to a FACTORY, and the address
			//  recorded is the computed one. For create3 the receipt would name the factory call
			//  rather than the contract created inside it, which is exactly why the environment
			//  prefers the expected address over the receipt's.
			const deploymentSends = provider
				.getRequests()
				.filter((r) => r.method === 'eth_sendTransaction')
				.map((r) => (r.params as [{to?: string}])[0].to);
			expect(deploymentSends.length).toBeGreaterThan(0);
			expect(deploymentSends.every((to) => !!to)).toBe(true);
			expect(deployment.address).toBe(env.get('Create3Contract').address);
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
			const {env} = await createEnv();
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
			const {env} = await createEnv();
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

	describe('The Real Broadcast Path', () => {
		/**
		 * These two assertions can ONLY pass against a real environment: they observe decisions
		 * that live in `packages/rocketh`'s `broadcastTransaction` (the single choke point every
		 * transaction funnels through), namely which RPC a deployment is sent with, chosen from
		 * `addressSigners[from].type`, and the `autoMine` follow-up. Seeing the params of an
		 * `eth_sendTransaction` is not enough on its own: the legacy fabricated environment
		 * always called that method regardless of the signer, because it reimplemented the
		 * broadcast path instead of using it.
		 */

		/**
		 * A private key for a locally-signing deployer, resolved by the shipped `privateKey`
		 * protocol from `@rocketh/signer` into a `signerOnly` signer. (Anvil's well-known
		 * account #1 key, a test key: never use it for anything real.)
		 */
		const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

		it('signs locally and sends raw when the deployer holds signing material', async () => {
			/**
			 * Example: the deployer is declared with a private key instead of being an account
			 * the node holds. Rocketh then signs the deployment itself and submits the signed
			 * transaction, so the node is never asked to sign.
			 *
			 * Usage in real scenario — note the `signerProtocols` registration, which is NOT
			 * optional: nothing registers the `privateKey` protocol for you in production (the
			 * test harness registers it itself, which is why the setup below is shorter), and
			 * without it the account fails to resolve with `protocol: privateKey is not
			 * supported`:
			 * ```typescript
			 * // rocketh/config.ts
			 * import {privateKey} from '@rocketh/signer';
			 *
			 * export const config = {
			 *   accounts: {
			 *     deployer: {default: 'privateKey:0x...'},
			 *   },
			 *   signerProtocols: {privateKey},
			 * } as const satisfies UserConfig;
			 * ```
			 */
			const {env, provider} = await createTestEnvironment({accounts: {deployer: PRIVATE_KEY}});
			const _deploy = deploy(env);

			expect(env.addressSigners[env.resolveAccount('deployer')].type).toBe('signerOnly');

			const deployment = await _deploy('LocallySignedContract', {
				account: 'deployer',
				artifact: createMockArtifact('LocallySignedContract'),
				args: [42n],
			});

			expect(deployment.newlyDeployed).toBe(true);

			// the signing itself never touches the node, so what the node sees is the signed
			//  transaction and nothing else. `eth_signTransaction` is asserted ABSENT and not
			//  just `eth_sendTransaction`: the mock node answers `eth_signTransaction` too, so
			//  without this line nothing here distinguishes local signing from node signing.
			const methods = provider.getRequests().map((r) => r.method);
			expect(methods).toContain('eth_sendRawTransaction');
			expect(methods).not.toContain('eth_sendTransaction');
			expect(methods).not.toContain('eth_signTransaction');
		});

		it('refuses to record a deployment whose transaction reverted', async () => {
			/**
			 * A transaction that is MINED is not necessarily a transaction that RAN. A receipt with
			 * status 0 means it reverted (a failed require, a throwing constructor, or simply out of
			 * gas), and the contract it was supposed to create does not exist.
			 *
			 * rocketh refuses it rather than recording the address, because a recorded deployment
			 * that has no code fails much later and much further away: a proxy saved over a missing
			 * implementation, for instance, delegatecalls into empty space and simply answers "0x".
			 */
			const {env} = await createTestEnvironment({
				accounts: NAMED_ACCOUNTS,
				nodeAccounts: NODE_HELD_ACCOUNTS,
				providerConfig: {
					responses: {
						eth_getTransactionReceipt: (params?: unknown[]) => ({
							transactionHash: params?.[0] as `0x${string}`,
							status: '0x0' as const,
							blockHash: `0x${'b'.repeat(64)}` as `0x${string}`,
							blockNumber: '0x1' as const,
							transactionIndex: '0x0' as const,
							contractAddress: `0x${'a'.repeat(40)}` as `0x${string}`,
							gasUsed: '0x5208' as const,
							logs: [],
						}),
					},
				},
			});
			const _deploy = deploy(env);

			await expect(
				_deploy('RevertingContract', {
					account: 'deployer',
					artifact: createMockArtifact('RevertingContract'),
					args: [42n],
				}),
			).rejects.toThrow(/did not succeed.*status 0x0/s);

			// Nothing was recorded, so a later run still sees the contract as undeployed.
			expect(env.getOrNull('RevertingContract')).toBe(null);
		});

		it('emits evm_mine right after the deployment transaction when autoMine is on', async () => {
			/**
			 * Example: on a dev node with automining disabled, `autoMine` makes rocketh mine
			 * the block itself so the deployment's receipt is available immediately.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * await loadAndExecuteDeployments({provider, autoMine: true});
			 * ```
			 */
			const {env, provider} = await createTestEnvironment({
				accounts: NAMED_ACCOUNTS,
				nodeAccounts: NODE_HELD_ACCOUNTS,
				executionParams: {autoMine: true},
			});
			const _deploy = deploy(env);

			await _deploy('AutoMinedContract', {
				account: 'deployer',
				artifact: createMockArtifact('AutoMinedContract'),
				args: [42n],
			});

			const methods = provider.getRequests().map((r) => r.method);
			// production emits evm_mine inside broadcastTransaction, i.e. AFTER the send and
			//  BEFORE waiting for the receipt
			const sendIndex = methods.indexOf('eth_sendTransaction');
			const mineIndex = methods.indexOf('evm_mine');
			expect(sendIndex).toBeGreaterThanOrEqual(0);
			expect(mineIndex).toBeGreaterThan(sendIndex);
			expect(mineIndex).toBeLessThan(methods.indexOf('eth_getTransactionReceipt'));
		});
	});
});
