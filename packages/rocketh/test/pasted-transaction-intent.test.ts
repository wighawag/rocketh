/**
 * Ranking the evidence that a pasted transaction is the one rocketh asked for.
 *
 * The classifier is pure, so every tier is testable without a chain, a prompt or an
 * environment. What matters here is not that each tier fires, but the JUDGEMENT encoded in
 * the ordering: a Safe execution must land in `account`, a MultiSend/timelock wrapper in
 * `embedded`, and governance-by-id in `none` WITHOUT that being treated as a mistake.
 */

import {describe, it, expect} from 'vitest';
import {classifyPastedTransaction} from '../src/environment/pastedTransactionIntent.js';

const SAFE = '0x1111111111111111111111111111111111111111';
const TARGET = '0x2222222222222222222222222222222222222222';
const UNRELATED = '0x3333333333333333333333333333333333333333';

/** `upgradeTo(0x4444...)`, the kind of privileged call this whole path exists for. */
const UPGRADE_CALLDATA = '0x3659cfe60000000000000000000000004444444444444444444444444444444444444444';

const INTENT = {from: SAFE, to: TARGET, data: UPGRADE_CALLDATA, value: 0n};

describe('classifyPastedTransaction', () => {
	describe('direct', () => {
		it('recognises the exact transaction rocketh described', () => {
			expect(classifyPastedTransaction(INTENT, {to: TARGET, input: UPGRADE_CALLDATA, value: '0x0'})).toEqual({
				tier: 'direct',
			});
		});

		it('ignores address and calldata casing', () => {
			// A hash or address pasted from a block explorer may be checksummed; the node's is not.
			expect(
				classifyPastedTransaction(INTENT, {
					to: TARGET.toUpperCase().replace('0X', '0x') as `0x${string}`,
					input: UPGRADE_CALLDATA.toUpperCase().replace('0X', '0x') as `0x${string}`,
					value: '0x0',
				}),
			).toEqual({tier: 'direct'});
		});

		it('compares value numerically, not textually', () => {
			// The same amount is written `0x0`, `0x00` and `0` by different tools. A string
			//  comparison would call an exact match a mismatch and pointlessly prompt.
			expect(
				classifyPastedTransaction({...INTENT, value: '0x0'}, {to: TARGET, input: UPGRADE_CALLDATA, value: '0x00'}),
			).toEqual({tier: 'direct'});
		});

		it('does not call it direct when the value differs', () => {
			// Same target, same calldata, different ETH: that is a different transaction, and
			//  quietly accepting it is how value goes missing.
			expect(
				classifyPastedTransaction(
					{...INTENT, value: 0n},
					{to: TARGET, input: UPGRADE_CALLDATA, value: '0xde0b6b3a7640000'},
				),
			).not.toEqual({tier: 'direct'});
		});
	});

	describe('account', () => {
		it('recognises a transaction sent to the account rocketh needed to act as', () => {
			// What every Safe execution looks like from outside: an owner sends to the Safe, and
			//  the Safe makes the inner call. Neither `to` nor `data` matches the request.
			expect(classifyPastedTransaction(INTENT, {to: SAFE, input: '0x6a761202deadbeef', value: '0x0'})).toEqual({
				tier: 'account',
			});
		});

		it('outranks embedded, so a Safe execution is identified by its target', () => {
			// Both signals are present here. `account` is the stronger statement (it names the
			//  executing account) and the message the user reads should say that.
			expect(
				classifyPastedTransaction(INTENT, {to: SAFE, input: `0x6a761202${UPGRADE_CALLDATA.slice(2)}`, value: '0x0'}),
			).toEqual({tier: 'account'});
		});
	});

	describe('embedded', () => {
		it('finds the requested calldata inside a wrapper transaction', () => {
			// MultiSend, a timelock, a relayer: all carry the inner calldata verbatim in their ABI
			//  encoding, so a substring test recognises them without decoding any wallet's ABI.
			expect(
				classifyPastedTransaction(INTENT, {
					to: UNRELATED,
					input: `0x8d80ff0a0000000000000000${UPGRADE_CALLDATA.slice(2)}0000`,
					value: '0x0',
				}),
			).toEqual({tier: 'embedded'});
		});

		it('does not treat empty calldata as embedded in everything', () => {
			// The guard that matters: '0x' is a substring of every input, so a plain ETH transfer
			//  would otherwise "match" any transaction ever mined.
			expect(
				classifyPastedTransaction(
					{from: SAFE, to: TARGET, data: '0x', value: 0n},
					{to: UNRELATED, input: '0xdeadbeef', value: '0x0'},
				),
			).toEqual({tier: 'none'});
		});
	});

	describe('none', () => {
		it('reports no evidence for an unrelated successful transaction', () => {
			// The realistic accident: the user pastes the hash of something else that succeeded.
			expect(classifyPastedTransaction(INTENT, {to: UNRELATED, input: '0xa9059cbb', value: '0x0'})).toEqual({
				tier: 'none',
			});
		});

		it('reports no evidence for governance executed by proposal id', () => {
			// `execute(uint256)` on a Governor: the payload was queued earlier, so nothing here
			//  links to the calldata. This is LEGITIMATE, which is exactly why `none` asks the
			//  human rather than refusing.
			expect(
				classifyPastedTransaction(INTENT, {
					to: UNRELATED,
					input: '0xfe0d94c10000000000000000000000000000000000000000000000000000000000000007',
					value: '0x0',
				}),
			).toEqual({tier: 'none'});
		});

		it('never throws on a malformed quantity, it just finds no match', () => {
			// A classifier that informs a decision must always return one.
			expect(() =>
				classifyPastedTransaction(
					{...INTENT, value: 'not-a-number'},
					{to: TARGET, input: UPGRADE_CALLDATA, value: '0x0'},
				),
			).not.toThrow();
		});
	});

	describe('deployments', () => {
		it('does not claim a direct match when rocketh had no target', () => {
			// A deployment has no `to`, and is anchored by `requireDeployedContract` instead: the
			//  contract must exist at the expected address. Claiming `direct` here would let a
			//  weaker argument stand in for a stronger check.
			expect(
				classifyPastedTransaction(
					{from: SAFE, data: '0x60806040', value: 0n},
					{to: null, input: '0x60806040', value: '0x0'},
				),
			).not.toEqual({tier: 'direct'});
		});
	});
});
