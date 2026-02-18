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
import {mergeABIs, mergeArtifacts} from '../src/artifacts.js';
import type {Environment, Deployment} from '../src/types.js';

describe('@rocketh/core - Environment Integration Tests', () => {
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
	});
});
