/**
 * `resolveTransactionFees`: the one place `@rocketh/deploy` and `@rocketh/read-execute` decide
 * whether a transaction they build is EIP-1559 (type 2) or legacy (type 0), and refuse a call
 * whose fee options contradict each other.
 */

import {describe, it, expect} from 'vitest';
import {resolveTransactionFees} from '../src/fees.js';

const LABEL = 'deploy "Registry"';

describe('resolveTransactionFees', () => {
	describe('what the call says wins', () => {
		it('sends gasPrice as a legacy transaction, whatever the chain', () => {
			expect(resolveTransactionFees(LABEL, {gasPrice: 10n}, 'eip1559')).toEqual({type: '0x0', gasPrice: '0xa'});
		});

		it("sends type 'legacy' as a legacy transaction, gas price left to the signer", () => {
			expect(resolveTransactionFees(LABEL, {type: 'legacy'}, undefined)).toEqual({type: '0x0'});
		});

		it('sends an EIP-1559 fee as EIP-1559 even on a chain declared legacy', () => {
			expect(resolveTransactionFees(LABEL, {maxFeePerGas: 3n}, 'legacy')).toEqual({
				type: '0x2',
				maxFeePerGas: '0x3',
				maxPriorityFeePerGas: undefined,
			});
		});

		it("sends type 'eip1559' as EIP-1559 even on a chain declared legacy", () => {
			expect(resolveTransactionFees(LABEL, {type: 'eip1559'}, 'legacy').type).toBe('0x2');
		});

		it('keeps an explicit zero rather than treating it as missing', () => {
			expect(resolveTransactionFees(LABEL, {gasPrice: 0n}, undefined)).toEqual({type: '0x0', gasPrice: '0x0'});
		});
	});

	describe('a call that says nothing takes the chain default', () => {
		it("is EIP-1559 on an 'eip1559' chain and when the chain says nothing", () => {
			const expected = {type: '0x2', maxFeePerGas: undefined, maxPriorityFeePerGas: undefined};
			expect(resolveTransactionFees(LABEL, {}, 'eip1559')).toEqual(expected);
			expect(resolveTransactionFees(LABEL, {}, undefined)).toEqual(expected);
		});

		it("is legacy on a 'legacy' chain", () => {
			expect(resolveTransactionFees(LABEL, {}, 'legacy')).toEqual({type: '0x0'});
		});
	});

	describe('contradictions are refused, naming the call and both sides', () => {
		it('refuses gasPrice with both EIP-1559 fees', () => {
			expect(() =>
				resolveTransactionFees(LABEL, {gasPrice: 1n, maxFeePerGas: 2n, maxPriorityFeePerGas: 3n}, undefined),
			).toThrow(/^deploy "Registry": "gasPrice" cannot be combined with "maxFeePerGas" and "maxPriorityFeePerGas"/);
		});

		it("refuses gasPrice with type 'eip1559'", () => {
			expect(() => resolveTransactionFees(LABEL, {gasPrice: 1n, type: 'eip1559'}, undefined)).toThrow(
				/"gasPrice" cannot be combined with "type: eip1559"/,
			);
		});

		it("refuses an EIP-1559 fee with type 'legacy'", () => {
			expect(() => resolveTransactionFees(LABEL, {maxPriorityFeePerGas: 1n, type: 'legacy'}, undefined)).toThrow(
				/"maxPriorityFeePerGas" cannot be combined with "type: legacy"/,
			);
		});

		it('refuses an accessList on a legacy transaction', () => {
			expect(() => resolveTransactionFees(LABEL, {accessList: []}, 'legacy')).toThrow(
				/"accessList" is not supported on a legacy \(type 0\) transaction/,
			);
		});

		it("refuses a type other than 'eip1559' and 'legacy'", () => {
			expect(() => resolveTransactionFees(LABEL, {type: 'eip2930'}, undefined)).toThrow(
				/^deploy "Registry": "type: eip2930" is not supported/,
			);
		});
	});

	describe('run-level fee defaults (the 4th argument)', () => {
		it('applies them to a call that states no fee option, as if the call had passed them', () => {
			expect(resolveTransactionFees(LABEL, {}, 'eip1559', {gasPrice: 5n})).toEqual({type: '0x0', gasPrice: '0x5'});
			expect(resolveTransactionFees(LABEL, {}, 'legacy', {maxFeePerGas: 3n})).toEqual({
				type: '0x2',
				maxFeePerGas: '0x3',
				maxPriorityFeePerGas: undefined,
			});
		});

		it('merges nothing into a call that states any fee option or type', () => {
			const run = {maxFeePerGas: 30n, maxPriorityFeePerGas: 7n};
			expect(resolveTransactionFees(LABEL, {maxPriorityFeePerGas: 2n}, 'eip1559', run)).toEqual({
				type: '0x2',
				maxFeePerGas: undefined,
				maxPriorityFeePerGas: '0x2',
			});
			expect(resolveTransactionFees(LABEL, {type: 'legacy'}, 'eip1559', run)).toEqual({type: '0x0'});
			expect(resolveTransactionFees(LABEL, {type: 'eip1559'}, 'eip1559', {gasPrice: 9n})).toEqual({
				type: '0x2',
				maxFeePerGas: undefined,
				maxPriorityFeePerGas: undefined,
			});
		});

		it('treats explicitly undefined call keys as not stated', () => {
			expect(resolveTransactionFees(LABEL, {gasPrice: undefined, type: undefined}, 'eip1559', {gasPrice: 1n})).toEqual({
				type: '0x0',
				gasPrice: '0x1',
			});
		});

		it('refuses an accessList on a call the run-level gasPrice makes legacy, saying so', () => {
			expect(() => resolveTransactionFees(LABEL, {accessList: []}, 'eip1559', {gasPrice: 1n})).toThrow(
				/the run-level "gasPrice" makes this call legacy/,
			);
		});

		it('changes nothing when no run-level value is set', () => {
			expect(resolveTransactionFees(LABEL, {}, 'eip1559', {})).toEqual(resolveTransactionFees(LABEL, {}, 'eip1559'));
			expect(resolveTransactionFees(LABEL, {}, 'legacy', {})).toEqual({type: '0x0'});
		});
	});
});
