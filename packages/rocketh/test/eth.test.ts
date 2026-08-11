import {describe, it, expect} from 'vitest';

import {formatUnits, formatEther, etherUnits, getGasPriceEstimate, getRoughGasPriceEstimate} from '../src/utils/eth.js';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

/**
 * `eth.ts` holds the gas-price estimation and ether-formatting helpers the executor
 * uses to build the "proceed?" prompt and the final gas summary. Nothing here needs a
 * real environment — a bare `{request}` object is enough for the estimation
 * functions, and the formatters are pure.
 *
 * Before this file there was NO test for this module anywhere; its incidental coverage
 * came only from `prompt-capability.test.ts` mocking `eth_feeHistory` because the
 * executor asks for a gas estimate before running scripts.
 */

/** Minimal provider whose `request` dispatches on the method name. */
function mockProvider(responses: Record<string, (params?: unknown[]) => unknown>): EIP1193ProviderWithoutEvents {
	return {
		request: async ({method, params}: {method: string; params?: unknown[]}) => {
			const fn = responses[method];
			if (!fn) throw new Error(`unmocked method: ${method}`);
			return fn(params);
		},
	} as EIP1193ProviderWithoutEvents;
}

describe('formatUnits', () => {
	it('formats a value smaller than one unit with zero-padding', () => {
		expect(formatUnits(1n, 18)).toBe('0.000000000000000001');
	});

	it('formats a whole-unit value', () => {
		expect(formatUnits(10n ** 18n, 18)).toBe('1');
	});

	it('formats gwei (9 decimals)', () => {
		expect(formatUnits(420000000000n, 9)).toBe('420');
	});

	it('trims trailing zeros in the fraction', () => {
		expect(formatUnits(1500000000000000000n, 18)).toBe('1.5');
	});

	it('returns "0" for zero', () => {
		expect(formatUnits(0n, 18)).toBe('0');
	});

	it('handles negative values', () => {
		expect(formatUnits(-1000000000000000000n, 18)).toBe('-1');
	});
});

describe('formatEther', () => {
	it('formats wei (default) by dividing by 1e18', () => {
		expect(formatEther(10n ** 18n)).toBe('1');
	});

	it('formats gwei by dividing by 1e9', () => {
		expect(formatEther(10n ** 9n, 'gwei')).toBe('1');
	});

	it('uses 18 decimals for the default "wei" unit', () => {
		// `etherUnits.wei = 18` reads backwards from viem's convention; pin it.
		expect(etherUnits.wei).toBe(18);
		expect(etherUnits.gwei).toBe(9);
	});
});

describe('getGasPriceEstimate', () => {
	it('averages priority fees across multiple blocks and adds the last baseFee', async () => {
		// Two blocks, one percentile. reward[i][0] is the priority fee for block i.
		const provider = mockProvider({
			eth_feeHistory: () => ({
				oldestBlock: '0xa',
				baseFeePerGas: ['0x10', '0x20'], // 16, 32
				gasUsedRatio: [0.5, 0.5],
				reward: [['0x1'], ['0x3']], // priority fees 1, 3
			}),
		});

		const result = await getGasPriceEstimate(provider, {blockCount: 2, rewardPercentiles: [10]});

		// avg of [1, 3] = 2; last baseFee = 32
		expect(result).toHaveLength(1);
		expect(result[0].maxPriorityFeePerGas).toBe(2n);
		expect(result[0].maxFeePerGas).toBe(34n); // 2 + 32
	});

	it('hex-encodes the blockCount into the eth_feeHistory params', async () => {
		let receivedParams: unknown[] | undefined;
		const provider = mockProvider({
			eth_feeHistory: (params) => {
				receivedParams = params;
				return {oldestBlock: '0x0', baseFeePerGas: ['0x1'], gasUsedRatio: [0.1], reward: [['0x1']]};
			},
		});

		await getGasPriceEstimate(provider, {blockCount: 5, rewardPercentiles: [10]});

		expect(receivedParams?.[0]).toBe('0x5');
	});

	it('falls back to eth_gasPrice when the node does not implement eth_feeHistory', async () => {
		const provider = mockProvider({
			eth_feeHistory: () => {
				const err: Error & {details?: string} = new Error('boom');
				err.details = 'unknown method eth_feeHistory';
				throw err;
			},
			eth_gasPrice: () => '0x3b9aca00', // 1 gwei
		});

		const result = await getGasPriceEstimate(provider, {rewardPercentiles: [10, 50, 80]});

		// One entry per requested percentile, maxFee == maxPriority == gasPrice.
		expect(result).toHaveLength(3);
		for (const entry of result) {
			expect(entry.maxFeePerGas).toBe(1000000000n);
			expect(entry.maxPriorityFeePerGas).toBe(1000000000n);
		}
	});

	it('also recognises the viem-style "The method does not exist" message', async () => {
		const provider = mockProvider({
			eth_feeHistory: () => {
				throw new Error('The method "eth_feeHistory" does not exist');
			},
			eth_gasPrice: () => '0x1',
		});

		const result = await getGasPriceEstimate(provider, {rewardPercentiles: [10]});
		expect(result[0].maxFeePerGas).toBe(1n);
	});

	it('rethrows any other error unchanged (no silent fallback)', async () => {
		const provider = mockProvider({
			eth_feeHistory: () => {
				throw new Error('something completely different');
			},
		});

		await expect(getGasPriceEstimate(provider, {rewardPercentiles: [10]})).rejects.toThrow(
			'something completely different',
		);
	});
});

describe('getRoughGasPriceEstimate', () => {
	it('throws when rewardPercentiles does not have exactly 3 entries', async () => {
		const provider = mockProvider({eth_feeHistory: () => ({}) as any});

		await expect(getRoughGasPriceEstimate(provider, {rewardPercentiles: [10, 50] as any})).rejects.toThrow(
			'rough gas estimate require 3 percentile',
		);
	});

	it('maps the three-percentile estimate to slow / average / fast', async () => {
		const provider = mockProvider({
			eth_feeHistory: () => ({
				oldestBlock: '0x0',
				baseFeePerGas: ['0x10'],
				gasUsedRatio: [0.1],
				reward: [['0x1', '0x2', '0x4']],
			}),
		});

		const result = await getRoughGasPriceEstimate(provider);

		expect(result.slow.maxPriorityFeePerGas).toBe(1n);
		expect(result.average.maxPriorityFeePerGas).toBe(2n);
		expect(result.fast.maxPriorityFeePerGas).toBe(4n);
		// last baseFee = 16 added to each
		expect(result.slow.maxFeePerGas).toBe(17n);
		expect(result.fast.maxFeePerGas).toBe(20n);
	});
});
