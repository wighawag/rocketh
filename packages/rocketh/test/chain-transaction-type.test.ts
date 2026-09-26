/**
 * How a chain's `transactionType` reaches the environment.
 *
 * `chains[id].transactionType: 'legacy'` declares a chain whose node rejects EIP-1559
 * transactions, so that `deploy`, `execute` and `tx` send legacy (type 0) transactions there when a
 * call states no fee option. It is a chain SEMANTIC, layered like the others: chain config, then
 * the environment's `overrides`, then (on a fork) `whenForked`, and on a fork it follows the
 * SIMULATED network. Unset, it is `'eip1559'`, which is what rocketh always sent.
 *
 * Like the other tests in this folder these do NOT use `@rocketh/test-utils` (nx cycle) and go
 * through the real `resolveExecutionParams`.
 */

import {describe, it, expect} from 'vitest';
import {resolveConfig, resolveExecutionParams} from '../src/executor/index.js';
import type {ChainInfo, UserConfig} from '@rocketh/core/types';

const LEGACY_CHAIN_ID = 424242;

const chainInfo = (id: number): ChainInfo => ({
	id,
	name: `chain-${id}`,
	nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
	rpcUrls: {default: {http: ['http://127.0.0.1:9999']}},
	chainType: 'default',
});

function resolve(config: UserConfig, environment: string | {fork: string}, computedChainId: number) {
	return resolveExecutionParams(resolveConfig(config), {environment}, computedChainId);
}

describe('chains[id].transactionType', () => {
	it("defaults to 'eip1559' for a chain that does not mention it", () => {
		const config = {
			environments: {plain: {chain: 1}},
			chains: {1: {rpcUrl: 'http://127.0.0.1:9999', info: chainInfo(1)}},
		} as const satisfies UserConfig;

		expect(resolve(config, 'plain', 1).environment.transactionType).toBe('eip1559');
	});

	it("is 'legacy' for a chain declared legacy", () => {
		/**
		 * Example: a chain whose node rejects EIP-1559.
		 *
		 * ```typescript
		 * chains: {424242: {transactionType: 'legacy'}}
		 * ```
		 */
		const config = {
			environments: {old: {chain: LEGACY_CHAIN_ID}},
			chains: {
				[LEGACY_CHAIN_ID]: {
					rpcUrl: 'http://127.0.0.1:9999',
					info: chainInfo(LEGACY_CHAIN_ID),
					transactionType: 'legacy',
				},
			},
		} as const satisfies UserConfig;

		expect(resolve(config, 'old', LEGACY_CHAIN_ID).environment.transactionType).toBe('legacy');
	});

	it("can be set per environment through 'overrides'", () => {
		const config = {
			environments: {old: {chain: 1, overrides: {transactionType: 'legacy'}}},
			chains: {1: {rpcUrl: 'http://127.0.0.1:9999', info: chainInfo(1)}},
		} as const satisfies UserConfig;

		expect(resolve(config, 'old', 1).environment.transactionType).toBe('legacy');
	});

	it('follows the SIMULATED network on a fork', () => {
		/**
		 * A fork of a legacy chain rehearses that chain, and legacy transactions run on the fork
		 * node as well, so the fork keeps the setting even though the local bucket does not say it.
		 */
		const config = {
			environments: {old: {chain: LEGACY_CHAIN_ID, whenForked: {rpcUrl: 'http://127.0.0.1:8546'}}},
			chains: {
				[LEGACY_CHAIN_ID]: {
					rpcUrl: 'http://127.0.0.1:9999',
					info: chainInfo(LEGACY_CHAIN_ID),
					transactionType: 'legacy',
				},
				31337: {rpcUrl: 'http://127.0.0.1:8545', info: chainInfo(31337)},
			},
		} as const satisfies UserConfig;

		expect(resolve(config, {fork: 'old'}, 31337).environment.transactionType).toBe('legacy');
	});
});
