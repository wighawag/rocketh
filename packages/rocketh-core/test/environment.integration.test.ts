/**
 * Integration Tests for @rocketh/core - Environment Setup
 *
 * These tests serve as documentation for how to set up and use
 * the rocketh environment. They demonstrate real-world scenarios
 * including account resolution, deployment tracking, and provider
 * integration.
 *
 * Note: These tests are primarily documentation examples. Full integration testing
 * would require a local blockchain node (like Anvil or Hardhat Network).
 */

import {describe, it, expect, vi} from 'vitest';
import {resolveAccount, resolveAccountOrUndefined} from '../src/account.js';
import {mergeABIs, mergeArtifacts} from '../src/artifacts.js';
import type {Environment, Deployment} from '../src/types.js';

describe('@rocketh/core - Environment Integration Tests', () => {
	describe('Account Resolution in Context', () => {
		it('should demonstrate account resolution in deployment workflow', async () => {
			/**
			 * Example: Using account resolution in a deployment workflow
			 *
			 * This demonstrates how named accounts are used in practice
			 * when deploying contracts. The environment provides a mapping
			 * of account names to addresses, which allows you to write
			 * deployment scripts that work across different networks.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const env = {
			 *   namedAccounts: {
			 *     deployer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as any,
			 *     alice: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as any,
			 *     bob: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as any,
			 *   },
			 *   // ... other env properties
			 * };
			 *
			 * const deployerAddress = resolveAccount('deployer', env);
			 * const aliceAddress = resolveAccount('alice', env);
			 * ```
			 */
			const env: Pick<Environment, 'namedAccounts'> = {
				namedAccounts: {
					deployer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as any,
					alice: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as any,
					bob: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as any,
				},
			};

			const deployerAddress = resolveAccount('deployer', env);
			const aliceAddress = resolveAccount('alice', env);
			const bobAddress = resolveAccount('bob', env);

			expect(deployerAddress).toBe('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
			expect(aliceAddress).toBe('0x70997970c51812dc3a010c7d01b50e0d17dc79c8');
			expect(bobAddress).toBe('0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc');
		});

		it('should demonstrate mixing named accounts and hex addresses', async () => {
			/**
			 * Example: Mixing named accounts and hex addresses
			 *
			 * In practice, you might mix named accounts and direct
			 * hex addresses in your deployment scripts. The resolution
			 * system handles both seamlessly.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * // Named account
			 * const deployer = resolveAccount('deployer', env);
			 *
			 * // Direct hex address
			 * const direct = resolveAccount(
			 *   '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as any,
			 *   env
			 * );
			 * ```
			 */
			const env: Pick<Environment, 'namedAccounts'> = {
				namedAccounts: {
					deployer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as any,
				},
			};

			const named = resolveAccount('deployer', env);
			const hexAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as any;
			const hex = resolveAccount(hexAddress, env);

			expect(named).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'.toLowerCase());
			expect(hex).toBe(hexAddress.toLowerCase());
		});
	});

	describe('Environment Setup', () => {
		describe('ABI Merging in Context', () => {
			it('should demonstrate merging ABIs for proxy deployment', async () => {
				/**
				 * Example: Merging implementation and proxy ABIs
				 *
				 * When deploying via proxy, you need to merge the
				 * implementation ABI with the proxy ABI. This is
				 * commonly done when working with upgradeable contracts.
				 *
				 * Usage in real scenario:
				 * ```typescript
				 * import {mergeABIs} from '@rocketh/core/artifacts';
				 *
				 * const result = mergeABIs([
				 *   {name: 'Implementation', abi: implementationABI},
				 *   {name: 'Proxy', abi: proxyABI},
				 * ]);
				 *
				 * // Use result.mergedABI for type-safe contract interactions
				 * ```
				 */
				const implementationABI: any[] = [
					{
						type: 'function',
						name: 'getValue',
						inputs: [],
						outputs: [{type: 'uint256'}],
						stateMutability: 'view',
					},
					{
						type: 'function',
						name: 'setValue',
						inputs: [{type: 'uint256'}],
						outputs: [],
						stateMutability: 'nonpayable',
					},
				];

				const proxyABI: any[] = [
					{
						type: 'function',
						name: 'owner',
						inputs: [],
						outputs: [{type: 'address'}],
						stateMutability: 'view',
					},
					{
						type: 'function',
						name: 'transferOwnership',
						inputs: [{type: 'address'}],
						outputs: [],
						stateMutability: 'nonpayable',
					},
				];

				const result = mergeABIs([
					{name: 'Implementation', abi: implementationABI},
					{name: 'Proxy', abi: proxyABI},
				]);

				expect(result.mergedABI).toHaveLength(4);
				expect(result.mergedABI.some((f: any) => f.name === 'getValue')).toBe(true);
				expect(result.mergedABI.some((f: any) => f.name === 'setValue')).toBe(true);
				expect(result.mergedABI.some((f: any) => f.name === 'owner')).toBe(true);
				expect(result.mergedABI.some((f: any) => f.name === 'transferOwnership')).toBe(true);
			});

			it('should demonstrate merging artifacts with documentation', async () => {
				/**
				 * Example: Merging artifacts with devdoc and userdoc
				 *
				 * When merging artifacts, you can also merge their
				 * documentation (devdoc and userdoc). This is useful
				 * for generating comprehensive documentation.
				 *
				 * Usage in real scenario:
				 * ```typescript
				 * import {mergeArtifacts} from '@rocketh/core/artifacts';
				 *
				 * const result = mergeArtifacts([
				 *   {name: 'Artifact1', artifact: artifact1},
				 *   {name: 'Artifact2', artifact: artifact2},
				 * ]);
				 *
				 * // Access merged documentation
				 * console.log(result.mergedDevDocs);
				 * console.log(result.mergedUserDocs);
				 * ```
				 */
				const artifact1: any = {
					abi: [
						{
							type: 'function',
							name: 'getValue',
							inputs: [],
							outputs: [{type: 'uint256'}],
							stateMutability: 'view',
						},
					],
					bytecode: '0x1234' as `0x${string}`,
					devdoc: {
						kind: 'dev',
						version: 1,
						methods: {
							'getValue()': {details: 'Gets the stored value'},
						},
					},
					userdoc: {
						kind: 'user',
						version: 1,
						methods: {
							'getValue()': {notice: 'Returns the current value'},
						},
					},
				};

				const artifact2: any = {
					abi: [
						{
							type: 'function',
							name: 'setValue',
							inputs: [{type: 'uint256'}],
							outputs: [],
							stateMutability: 'nonpayable',
						},
					],
					bytecode: '0x5678' as `0x${string}`,
					devdoc: {
						kind: 'dev',
						version: 1,
						methods: {
							'setValue(uint256)': {details: 'Sets a new value'},
						},
					},
					userdoc: {
						kind: 'user',
						version: 1,
						methods: {
							'setValue(uint256)': {notice: 'Updates the stored value'},
						},
					},
				};

				const result = mergeArtifacts([
					{name: 'Artifact1', artifact: artifact1},
					{name: 'Artifact2', artifact: artifact2},
				]);

				expect(result.mergedABI).toHaveLength(2);
				expect(result.mergedDevDocs).toBeDefined();
				expect(result.mergedUserDocs).toBeDefined();
			});
		});

		describe('Deployment Tracking', () => {
			it('should demonstrate tracking deployments in environment', async () => {
				/**
				 * Example: Tracking deployments through environment
				 *
				 * The environment provides methods to save and retrieve
				 * deployments. This allows you to reference previously
				 * deployed contracts in subsequent deployments.
				 *
				 * Usage in real scenario:
				 * ```typescript
				 * // Save deployment
				 * await env.save('MyContract', {
				 *   address: '0x...',
				 *   abi: [...],
				 *   bytecode: '0x...',
				 *   argsData: '0x...',
				 * });
				 *
				 * // Retrieve deployment
				 * const deployment = env.get('MyContract');
				 * ```
				 */
				// TODO
			});
		});

		describe('Account Resolution Edge Cases', () => {
			it('should demonstrate handling missing named accounts gracefully', async () => {
				/**
				 * Example: Graceful handling of missing named accounts
				 *
				 * Use resolveAccountOrUndefined when you want to check
				 * if an account exists without throwing an error.
				 *
				 * Usage in real scenario:
				 * ```typescript
				 * const env = {
				 *   namedAccounts: {
				 *     deployer: '0x...' as any,
				 *   },
				 * };
				 *
				 * // resolveAccount throws for missing accounts
				 * expect(() => resolveAccount('nonexistent', env)).toThrow();
				 *
				 * // resolveAccountOrUndefined returns undefined
				 * const result = resolveAccountOrUndefined('nonexistent', env);
				 * expect(result).toBe(undefined);
				 * ```
				 */
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {
						deployer: ('0x' + '0'.repeat(40)) as any,
					},
				};

				expect(() => resolveAccount('nonexistent', env)).toThrow('no address');

				const result = resolveAccountOrUndefined('nonexistent', env);
				expect(result).toBe(undefined);
			});
		});
	});
});
