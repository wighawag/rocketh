/**
 * Ranking the evidence that a pasted transaction is the one rocketh asked for.
 *
 * The classifier is pure, so every tier is testable without a chain, a prompt or an
 * environment. What matters here is not that each tier fires, but the JUDGEMENT encoded in
 * the ordering: a Safe execution of exactly the request lands in `safe`, a Safe execution of
 * anything else in `safe-mismatch` (asked about, never accepted silently), a MultiSend/timelock
 * wrapper in `embedded`, and governance-by-id in `none` WITHOUT that being treated as a mistake.
 */

import {describe, it, expect} from 'vitest';
import {
	classifyPastedTransaction,
	confirmationWording,
	decodeSafeExecTransaction,
	describeEvidence,
	requiresConfirmation,
} from '../src/environment/pastedTransactionIntent.js';
import {encodeSafeExecTransaction} from './support/safe-exec-transaction.js';

const SAFE = '0x1111111111111111111111111111111111111111';
const TARGET = '0x2222222222222222222222222222222222222222';
const UNRELATED = '0x3333333333333333333333333333333333333333';
const MULTISEND = '0x5555555555555555555555555555555555555555';

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

	describe('safe', () => {
		it('accepts a Safe execution of exactly the requested call, and says so', () => {
			// What executing the transaction from the Safe app sends: `execTransaction` TO the
			//  Safe, whose inner call is decoded and compared with the request.
			const evidence = classifyPastedTransaction(INTENT, {
				to: SAFE,
				input: encodeSafeExecTransaction({to: TARGET, data: UPGRADE_CALLDATA}),
				value: '0x0',
			});
			expect(evidence).toEqual({tier: 'safe'});
			expect(requiresConfirmation(evidence)).toBe(false);
			expect(describeEvidence(evidence, INTENT)).toContain('the Safe executed exactly this call');
		});

		it('compares the inner value, numerically', () => {
			expect(
				classifyPastedTransaction(
					{...INTENT, value: '0x1f4'},
					{to: SAFE, input: encodeSafeExecTransaction({to: TARGET, value: 500n, data: UPGRADE_CALLDATA}), value: '0x0'},
				),
			).toEqual({tier: 'safe'});
		});

		it('ignores casing of the target and the calldata', () => {
			expect(
				classifyPastedTransaction(
					{
						...INTENT,
						to: TARGET.toUpperCase().replace('0X', '0x'),
						data: UPGRADE_CALLDATA.toUpperCase().replace('0X', '0x'),
					},
					{
						to: SAFE.toUpperCase().replace('0X', '0x') as `0x${string}`,
						input: encodeSafeExecTransaction({to: TARGET, data: UPGRADE_CALLDATA}),
						value: '0x0',
					},
				),
			).toEqual({tier: 'safe'});
		});
	});

	describe('safe-mismatch', () => {
		it('does NOT accept a Safe execution of another call: it goes to confirmation', () => {
			// The hole this closes: the hash of ANOTHER transaction of the same Safe used to be
			//  accepted as `account`, whatever the Safe executed.
			const evidence = classifyPastedTransaction(INTENT, {
				to: SAFE,
				input: encodeSafeExecTransaction({to: UNRELATED, data: '0xa9059cbb'}),
				value: '0x0',
			});
			expect(evidence).toEqual({
				tier: 'safe-mismatch',
				executed: {to: UNRELATED, value: 0n, data: '0xa9059cbb', operation: 0n},
			});
			expect(requiresConfirmation(evidence)).toBe(true);
			const finding = describeEvidence(evidence, INTENT);
			expect(finding).toContain('the Safe executed a DIFFERENT call');
			expect(finding).toContain(`CALL to ${UNRELATED}`);
			expect(confirmationWording(evidence).headline).toContain('the Safe executed a DIFFERENT call');
		});

		it('does not accept the right call made as a DELEGATECALL', () => {
			// Same target and calldata, but run in the Safe's own storage: another transaction.
			//  Not `embedded` either, even though the calldata is in there.
			const evidence = classifyPastedTransaction(INTENT, {
				to: SAFE,
				input: encodeSafeExecTransaction({to: TARGET, data: UPGRADE_CALLDATA, operation: 1}),
				value: '0x0',
			});
			expect(evidence.tier).toBe('safe-mismatch');
			expect(describeEvidence(evidence, INTENT)).toContain('DELEGATECALL');
		});

		it('does not accept the right call with another value', () => {
			const evidence = classifyPastedTransaction(INTENT, {
				to: SAFE,
				input: encodeSafeExecTransaction({to: TARGET, value: 1n, data: UPGRADE_CALLDATA}),
				value: '0x0',
			});
			expect(evidence.tier).toBe('safe-mismatch');
		});

		it('does not accept the same calldata sent to another target', () => {
			const evidence = classifyPastedTransaction(INTENT, {
				to: SAFE,
				input: encodeSafeExecTransaction({to: UNRELATED, data: UPGRADE_CALLDATA}),
				value: '0x0',
			});
			expect(evidence.tier).toBe('safe-mismatch');
		});
	});

	describe('account', () => {
		it('asks about a transaction to the account that shows nothing of what it executed', () => {
			// Sent to the right account, but neither a Safe `execTransaction` nor carrying the
			//  calldata: a wallet executing a transaction submitted earlier by id looks like this,
			//  and so does any unrelated transaction to that account. Asked, not refused.
			const evidence = classifyPastedTransaction(INTENT, {
				to: SAFE,
				input: '0xc01a8c840000000000000000000000000000000000000000000000000000000000000007',
				value: '0x0',
			});
			expect(evidence).toEqual({tier: 'account'});
			expect(requiresConfirmation(evidence)).toBe(true);
		});

		it('does not take a truncated execTransaction for a Safe execution', () => {
			// The selector alone is not a decodable call: it shows nothing of what was executed.
			expect(classifyPastedTransaction(INTENT, {to: SAFE, input: '0x6a761202deadbeef', value: '0x0'})).toEqual({
				tier: 'account',
			});
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

		it('accepts a MultiSend executed through the Safe, which carries the call verbatim', () => {
			// The Safe DELEGATECALLs MultiSend, so the decoded inner call is not the request, but
			//  the packed batch carries it verbatim: accepted, exactly as before this was decoded.
			const multiSendData = `0x8d80ff0a0000000000000000${TARGET.slice(2)}${UPGRADE_CALLDATA.slice(2)}` as const;
			expect(
				classifyPastedTransaction(INTENT, {
					to: SAFE,
					input: encodeSafeExecTransaction({to: MULTISEND, data: multiSendData, operation: 1}),
					value: '0x0',
				}),
			).toEqual({tier: 'embedded'});
		});

		it('accepts a Safe call to the target itself that carries the request (its own multicall)', () => {
			expect(
				classifyPastedTransaction(INTENT, {
					to: SAFE,
					input: encodeSafeExecTransaction({
						to: TARGET,
						data: `0xac9650d8${'0'.repeat(64)}${UPGRADE_CALLDATA.slice(2)}`,
					}),
					value: '0x0',
				}),
			).toEqual({tier: 'embedded'});
		});

		it('does NOT accept a Safe CALL to another contract that merely carries the request', () => {
			// e.g. the Safe calling `TimelockController.schedule(target, 0, upgradeCalldata, ...)`:
			//  the upgrade is in there verbatim, but it was only QUEUED, not executed by the Safe.
			const evidence = classifyPastedTransaction(INTENT, {
				to: SAFE,
				input: encodeSafeExecTransaction({
					to: UNRELATED,
					data: `0x01d5062a${'0'.repeat(24)}${TARGET.slice(2)}${UPGRADE_CALLDATA.slice(2)}`,
				}),
				value: '0x0',
			});
			expect(evidence.tier).toBe('safe-mismatch');
			expect(requiresConfirmation(evidence)).toBe(true);
		});

		it('accepts a transaction to the account that carries the calldata (a timelock, another wallet)', () => {
			// `TimelockController.execute(target, value, payload, ...)` sent to the timelock that is
			//  the account: not a Safe, but the requested calldata is in there verbatim.
			expect(
				classifyPastedTransaction(INTENT, {
					to: SAFE,
					input: `0x134008d3${'0'.repeat(24)}${TARGET.slice(2)}${UPGRADE_CALLDATA.slice(2)}`,
					value: '0x0',
				}),
			).toEqual({tier: 'embedded'});
		});

		it("does not decode an execTransaction sent to another address as this account's Safe execution", () => {
			// A Safe executes its OWN `execTransaction`: the same input to another Safe is that
			//  other Safe acting. The calldata is still found in it, which is all it shows.
			expect(
				classifyPastedTransaction(INTENT, {
					to: UNRELATED,
					input: encodeSafeExecTransaction({to: TARGET, data: UPGRADE_CALLDATA}),
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

	describe('decodeSafeExecTransaction', () => {
		it('round-trips what the Safe app sends', () => {
			expect(
				decodeSafeExecTransaction(
					encodeSafeExecTransaction({to: TARGET, value: 7n, data: UPGRADE_CALLDATA, operation: 1}),
				),
			).toEqual({to: TARGET, value: 7n, data: UPGRADE_CALLDATA, operation: 1n});
		});

		it('never throws, and decodes nothing, for any truncation of a real input', () => {
			// The classifier must be total: a malformed input is simply not a Safe execution.
			const input = encodeSafeExecTransaction({to: TARGET, data: UPGRADE_CALLDATA});
			const head = 2 + 8 + 10 * 64 + 64; // up to the length word of `data`
			for (let end = 0; end < head + UPGRADE_CALLDATA.length - 2; end += 2) {
				expect(decodeSafeExecTransaction(input.slice(0, end))).toBeUndefined();
			}
		});

		it('refuses an offset pointing outside the input', () => {
			const input = encodeSafeExecTransaction({to: TARGET, data: UPGRADE_CALLDATA});
			const dataOffsetWord = 2 + 8 + 2 * 64;
			const corrupted = input.slice(0, dataOffsetWord) + 'f'.repeat(64) + input.slice(dataOffsetWord + 64);
			expect(() => decodeSafeExecTransaction(corrupted)).not.toThrow();
			expect(decodeSafeExecTransaction(corrupted)).toBeUndefined();
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
