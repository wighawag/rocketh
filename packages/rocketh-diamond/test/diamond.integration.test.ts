/**
 * Integration Tests for @rocketh/diamond
 *
 * These tests serve as documentation for how to use the Diamond proxy pattern.
 * They demonstrate real-world scenarios including facet deployment, diamond
 * creation, facet upgrades, and diamondLoupe functionality.
 *
 * Note: These tests are primarily documentation examples. Full integration testing
 * would require a local blockchain node (like Anvil or Hardhat Network).
 *
 * They run against `createTestEnvironment` from @rocketh/test-utils, which builds a REAL
 * rocketh environment (`createEnvironment` in `packages/rocketh`) against a mock EIP-1193
 * provider. Every facet and the diamond proxy below therefore go through production's
 * account resolution and its single `broadcastTransaction` choke point (facets through the
 * create2 factory, since a facet defaults to `deterministic: true`); only the RPC answers
 * are canned.
 *
 * Every case here builds a fresh environment under a fresh name, so `env.getOrNull(name)`
 * in `diamond` is always null and every case takes the FRESH-deployment path: no
 * `diamondCut` upgrade, no `facets()` loupe read, no `owner()` read. That is why no test
 * mocks `eth_call`. A case that needed those answers would be an upgrade test, which is
 * separate work.
 */

import {describe, it, expect} from 'vitest';
import {diamond} from '../src/index.js';
import {createMockArtifact, createExampleArtifact, createTestEnvironment} from '@rocketh/test-utils';

/**
 * Named accounts in the real `UserConfig.accounts` shape, declared as bare addresses;
 * `nodeAccounts` says the node actually HOLDS them (`eth_accounts`), so they are signable
 * and every facet + the diamond proxy broadcast through `eth_sendTransaction`.
 */
const NAMED_ACCOUNTS = {
	deployer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
	user1: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
	user2: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
} as const;
const NODE_ACCOUNTS = Object.values(NAMED_ACCOUNTS) as `0x${string}`[];

/** The environment these tests deploy from: three named accounts the node holds. */
function createEnv() {
	return createTestEnvironment({accounts: NAMED_ACCOUNTS, nodeAccounts: NODE_ACCOUNTS});
}

describe('@rocketh/diamond - Integration Tests', () => {
	describe('Basic Diamond Deployment', () => {
		it('should demonstrate basic diamond deployment with default facets', async () => {
			/**
			 * Example: Deploying a basic diamond with default facets
			 *
			 * When deploying a diamond, the system automatically includes
			 * three default facets if not disabled:
			 * 1. DiamondCutFacet - for upgrading the diamond
			 * 2. DiamondLoupeFacet - for inspecting diamond structure
			 * 3. OwnershipFacet - for diamond ownership management
			 *
			 * These provide the core functionality needed for a functional diamond.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * import {diamond} from '@rocketh/diamond';
			 * import {MyFacet} from './artifacts/MyFacet.js';
			 *
			 * const _diamond = diamond(env);
			 * const deployment = await _diamond('MyDiamond', {
			 *   account: 'deployer',
			 *   facets: [
			 *     {
			 *       name: 'MyFacet',
			 *       artifact: MyFacet,
			 *       args: [],
			 *     },
			 *   ],
			 * }, {
			 *   facetCuts: [],
			 *   execute: undefined,
			 * });
			 * ```
			 */
			const {env} = await createEnv();
			const _diamond = diamond(env);

			const customFacet = createMockArtifact('MyFacet', [
				{
					type: 'function',
					name: 'myFunction',
					inputs: [],
					outputs: [{type: 'uint256'}],
					stateMutability: 'view',
				},
			]);

			const deployment = await _diamond(
				'MyDiamond',
				{
					account: 'deployer',
				},
				{
					facets: [
						{
							name: 'MyFacet',
							artifact: customFacet,
							args: [],
						},
					],
					execute: undefined,
				},
			);

			expect(deployment).toBeDefined();
			expect(deployment.address).toBeDefined();

			// What this pins: the custom facet plus the three default facets are four DISTINCT
			//  create2 contracts (a facet defaults to `deterministic: true`, so each address is the
			//  create2 address computed from its own bytecode, which the environment prefers over
			//  the receipt), and the diamond itself is a SEPARATE, RECEIPT-DERIVED proxy in front of
			//  them (deployed non-deterministically here, since no `deterministicSalt` is given).
			//  So this is a shape assertion about the deployment graph the fresh path builds, not a
			//  guard against a single-address receipt; it replaces a `toBeDefined()`-only case that
			//  never checked the graph at all.
			const facetAddresses = (deployment.facets ?? []).map((f) => f.facetAddress.toLowerCase());
			expect(facetAddresses.length).toBe(4);
			expect(new Set(facetAddresses).size).toBe(4);
			expect(facetAddresses).toContain(env.get('MyFacet').address.toLowerCase());
			expect(facetAddresses).toContain(env.get('_DefaultDiamondCutFacet').address.toLowerCase());
			expect(facetAddresses).toContain(env.get('_DefaultDiamondOwnershipFacet').address.toLowerCase());
			expect(facetAddresses).toContain(env.get('_DefaultDiamondLoupeFacet').address.toLowerCase());
			expect(deployment.address).toBe(env.get('MyDiamond_DiamondProxy').address);
			expect(facetAddresses).not.toContain(deployment.address.toLowerCase());
		});

		it('should demonstrate diamond with custom owner', async () => {
			/**
			 * Example: Diamond with custom owner
			 *
			 * By default, the diamond is owned by the deployer account.
			 * You can specify a different owner using the 'owner' option.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _diamond('MyDiamond', {
			 *   account: 'deployer',
			 *   facets: [
			 *     {
			 *       name: 'MyFacet',
			 *       artifact: MyFacet,
			 *       args: [],
			 *     },
			 *   ],
			 * }, {
			 *   facetCuts: [],
			 *   execute: undefined,
			 *   owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as any,
			 * });
			 * ```
			 */
			const {env} = await createEnv();
			const _diamond = diamond(env);

			const customFacet = createMockArtifact('OwnedFacet');

			const deployment = await _diamond(
				'OwnedDiamond',
				{
					account: 'deployer',
				},
				{
					facets: [
						{
							name: 'OwnedFacet',
							artifact: customFacet,
							args: [],
						},
					],
					owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as any,
				},
			);

			expect(deployment).toBeDefined();
		});

		it('should demonstrate diamond with initialization call', async () => {
			/**
			 * Example: Diamond with initialization
			 *
			 * You can execute a function immediately after deploying
			 * the diamond. This is commonly used to initialize the
			 * diamond state.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _diamond('MyDiamond', {
			 *   account: 'deployer',
			 *   facets: [
			 *     {
			 *       name: 'InitFacet',
			 *       artifact: InitFacet,
			 *       args: [],
			 *     },
			 *   ],
			 * }, {
			 *   facetCuts: [],
			 *   execute: {
			 *     type: 'facet',
			 *     functionName: 'initialize',
			 *     args: [42n],
			 *   },
			 * });
			 * ```
			 */
			const {env} = await createEnv();
			const _diamond = diamond(env);

			const initFacet = createMockArtifact('InitFacet', [
				{
					type: 'function',
					name: 'initialize',
					inputs: [{type: 'uint256', name: '_initialValue'}],
					outputs: [],
					stateMutability: 'nonpayable',
				},
			]);

			const deployment = await _diamond(
				'InitDiamond',
				{
					account: 'deployer',
				},
				{
					facets: [
						{
							name: 'InitFacet',
							artifact: initFacet,
							args: [],
						},
					],
					execute: {
						type: 'facet',
						functionName: 'initialize',
						args: [42n],
					},
				},
			);

			expect(deployment).toBeDefined();
		});
	});

	describe('Facet Management', () => {
		it('should demonstrate diamond with multiple facets', async () => {
			/**
			 * Example: Diamond with multiple custom facets
			 *
			 * Diamonds can have multiple facets, each providing
			 * different functionality. This demonstrates how to
			 * organize your diamond into logical modules.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _diamond('MyDiamond', {
			 *   account: 'deployer',
			 *   facets: [
			 *     {
			 *       name: 'UserFacet',
			 *       artifact: UserFacet,
			 *       args: [],
			 *     },
			 *     {
			 *       name: 'PaymentFacet',
			 *       artifact: PaymentFacet,
			 *       args: [],
			 *     },
			 *     {
			 *       name: 'AdminFacet',
			 *       artifact: AdminFacet,
			 *       args: [],
			 *     },
			 *   ],
			 * }, {
			 *   facetCuts: [],
			 *   execute: undefined,
			 * });
			 * ```
			 */
			const {env} = await createEnv();
			const _diamond = diamond(env);

			const facet1 = createExampleArtifact('UserFacet', 0);
			const facet2 = createExampleArtifact('PaymentFacet', 1);
			const facet3 = createExampleArtifact('AdminFacet', 2);

			const deployment = await _diamond(
				'MultiFacetDiamond',
				{
					account: 'deployer',
				},
				{
					facets: [
						{
							name: 'UserFacet',
							artifact: facet1,
							args: [],
						},
						{
							name: 'PaymentFacet',
							artifact: facet2,
							args: [],
						},
						{
							name: 'AdminFacet',
							artifact: facet3,
							args: [],
						},
					],
					execute: undefined,
				},
			);

			expect(deployment).toBeDefined();
		});

		it('should demonstrate facets with constructor arguments', async () => {
			/**
			 * Example: Facets with constructor arguments
			 *
			 * Facets can have constructor arguments just like regular
			 * contracts. These are passed in the 'args' property.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _diamond('MyDiamond', {
			 *   account: 'deployer',
			 *   facets: [
			 *     {
			 *       name: 'FacetWithArgs',
			 *       artifact: FacetWithArgs,
			 *       args: ['0x123...', 100n],
			 *     },
			 *   ],
			 * }, {
			 *   facetCuts: [],
			 *   execute: undefined,
			 * });
			 * ```
			 */
			const {env} = await createEnv();
			const _diamond = diamond(env);

			const facetWithArgs = createMockArtifact('FacetWithArgs', [
				{
					type: 'constructor',
					inputs: [
						{type: 'address', name: '_token'},
						{type: 'uint256', name: '_fee'},
					],
					stateMutability: 'nonpayable',
				},
			]);

			const deployment = await _diamond(
				'DiamondWithArgs',
				{
					account: 'deployer',
				},
				{
					facets: [
						{
							name: 'FacetWithArgs',
							artifact: facetWithArgs,
							args: [('0x' + '0'.repeat(40)) as `0x${string}`, 100n],
						},
					],
				},
			);

			expect(deployment).toBeDefined();
		});
	});

	describe('Deterministic Diamond Deployment', () => {
		it('should demonstrate deterministic diamond deployment with salt', async () => {
			/**
			 * Example: Deterministic diamond deployment
			 *
			 * You can deploy diamonds deterministically using a salt.
			 * This means the diamond address is predictable based on:
			 * - The salt value
			 * - The deployer address
			 * - The diamond bytecode
			 *
			 * This is useful for cross-chain deployments and gas optimization.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _diamond('MyDiamond', {
			 *   account: 'deployer',
			 *   facets: [
			 *     {
			 *       name: 'MyFacet',
			 *       artifact: MyFacet,
			 *       args: [],
			 *     },
			 *   ],
			 * }, {
			 *   facetCuts: [],
			 *   execute: undefined,
			 *   deterministicSalt: '0x1234...',
			 * });
			 * ```
			 */
			const {env} = await createEnv();
			const _diamond = diamond(env);

			const facet = createMockArtifact('DeterministicFacet');

			const salt = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`;

			const deployment = await _diamond(
				'DeterministicDiamond',
				{
					account: 'deployer',
				},
				{
					facets: [
						{
							name: 'DeterministicFacet',
							artifact: facet,
							args: [],
						},
					],
					deterministicSalt: salt,
				},
			);

			expect(deployment).toBeDefined();
		});
	});

	describe('Default Facets Control', () => {
		it('should demonstrate diamond without default cut facet', async () => {
			/**
			 * Example: Diamond without default DiamondCutFacet
			 *
			 * You can disable default facets individually. This example
			 * shows how to deploy without the DiamondCutFacet.
			 * Note: Without DiamondCutFacet, the diamond cannot be upgraded.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _diamond('MyDiamond', {
			 *   account: 'deployer',
			 *   facets: [
			 *     {
			 *       name: 'MyFacet',
			 *       artifact: MyFacet,
			 *       args: [],
			 *     },
			 *   ],
			 * }, {
			 *   facetCuts: [],
			 *   execute: undefined,
			 *   defaultCutFacet: false,
			 * });
			 * ```
			 */
			const {env} = await createEnv();
			const _diamond = diamond(env);

			const facet = createMockArtifact('NoCutFacet');

			const deployment = await _diamond(
				'NoCutFacetDiamond',
				{
					account: 'deployer',
				},
				{
					facets: [
						{
							name: 'NoCutFacet',
							artifact: facet,
							args: [],
						},
					],
					defaultCutFacet: false,
				},
			);

			expect(deployment).toBeDefined();
		});
	});

	describe('Error Handling', () => {
		it('should demonstrate error for zero deterministic salt', async () => {
			/**
			 * Example: Error handling for zero salt
			 *
			 * The deterministic salt cannot be zero bytes32, as this
			 * would lead to collisions when deploying multiple diamonds.
			 */
			const {env} = await createEnv();
			const _diamond = diamond(env);

			const facet = createMockArtifact('ZeroSaltFacet');

			await expect(
				_diamond(
					'ZeroSaltDiamond',
					{
						account: 'deployer',
					},
					{
						facets: [
							{
								name: 'ZeroSaltFacet',
								artifact: facet,
								args: [],
							},
						],
						deterministicSalt: ('0x' + '0'.repeat(64)) as `0x${string}`,
					},
				),
			).rejects.toThrow('deterministicSalt cannot be 0x000');
		});
	});
});
