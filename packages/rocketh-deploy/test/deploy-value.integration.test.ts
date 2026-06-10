/**
 * Integration Tests for @rocketh/deploy - Deployment `value`
 *
 * These tests serve as documentation for how `value` flows through the
 * deployment system so that payable constructors receive `msg.value`.
 *
 * They demonstrate:
 * - Deploying a contract WITH a `value` (e.g. funding a payable constructor).
 * - Deploying a contract WITHOUT a `value` (the field must be omitted, not
 *   sent as `0x0`/`0xundefined`/`0xNaN`).
 *
 * The mock provider records every request, so we inspect the params sent to
 * `eth_sendTransaction` to assert on the dispatched transaction.
 */

import {describe, it, expect} from 'vitest';
import {deploy} from '../src/index.js';
import {createMockEnvironment, createMockArtifact} from '@rocketh/test-utils';

/**
 * Returns the transaction object passed to the last `eth_sendTransaction`
 * (or `eth_sendRawTransaction`) call recorded by the mock provider.
 */
function getLastDispatchedTransaction(
	provider: ReturnType<typeof createMockEnvironment>['provider'],
): Record<string, unknown> | undefined {
	const requests = provider.getRequests();
	const sendRequest = [...requests]
		.reverse()
		.find((r) => r.method === 'eth_sendTransaction' || r.method === 'eth_sendRawTransaction');
	return sendRequest?.params?.[0] as Record<string, unknown> | undefined;
}

describe('@rocketh/deploy - Deployment value', () => {
	describe('Payable Constructor Funding', () => {
		it('should include value (hex-encoded) on the dispatched transaction when value is set', async () => {
			/**
			 * Example: Deploying a contract that requires `msg.value` in its
			 * constructor (a payable constructor).
			 *
			 * The `value` you pass to `deploy()` is sent on the deployment
			 * transaction so the constructor runs with the funds it expects.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _deploy('FundedContract', {
			 *   account: 'deployer',
			 *   artifact: FundedContract,
			 *   args: [],
			 *   value: 1000000000000000000n, // 1 ETH funds the payable constructor
			 * });
			 * ```
			 */
			const {env, provider} = createMockEnvironment();
			const _deploy = deploy(env);

			const artifact = createMockArtifact('FundedContract');

			const value = 1000000000000000000n; // 1 ETH

			const deployment = await _deploy('FundedContract', {
				account: 'deployer',
				artifact,
				args: [42n],
				value,
			});

			expect(deployment.newlyDeployed).toBe(true);

			const tx = getLastDispatchedTransaction(provider);
			expect(tx).toBeDefined();
			expect(tx?.value).toBe(`0x${value.toString(16)}`);
		});

		it('should omit the value field entirely when no value is passed', async () => {
			/**
			 * Example: A normal (non-payable) deployment.
			 *
			 * When no `value` is passed, the deployment transaction must NOT
			 * carry a `value` field at all — it must not be sent as `0x0`,
			 * `0xundefined`, or `0xNaN`.
			 *
			 * Usage in real scenario:
			 * ```typescript
			 * const deployment = await _deploy('PlainContract', {
			 *   account: 'deployer',
			 *   artifact: PlainContract,
			 *   args: [42n],
			 * });
			 * ```
			 */
			const {env, provider} = createMockEnvironment();
			const _deploy = deploy(env);

			const artifact = createMockArtifact('PlainContract');

			const deployment = await _deploy('PlainContract', {
				account: 'deployer',
				artifact,
				args: [42n],
			});

			expect(deployment.newlyDeployed).toBe(true);

			const tx = getLastDispatchedTransaction(provider);
			expect(tx).toBeDefined();
			expect(tx && 'value' in tx).toBe(false);
		});
	});
});
