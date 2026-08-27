/**
 * Reading a raw STORAGE SLOT, and interpreting the 32-byte word that comes back.
 *
 * This exists because of the transparent proxy. It exposes NO getter for its
 * implementation, so the effect of the commonest privileged call there is (upgrade a
 * proxy through its ProxyAdmin) is observable only in the EIP-1967 implementation slot.
 * `@rocketh/proxy` already reads exactly that slot to decide whether an upgrade is
 * needed, taking the address out of the word with a `substr(-40)` inline in a much larger
 * function; this module is that read made reusable, and its `address` interpretation is
 * the same rule: the LOW 20 bytes of the word.
 *
 * A slot carries no ABI, so the caller DECLARES how to read the word. The closed set is
 * spelled with ABI type names on purpose: the same string that decodes the word is handed
 * to `./abi-comparison.ts` as the type the comparison keys off, so an address read out of
 * a slot folds case exactly as an address returned from a getter does, and there is one
 * comparison vocabulary rather than two.
 */

import type {Environment} from '@rocketh/core/types';
import type {EIP1193Account, EIP1193DATA} from 'eip-1193';
import {getAddress} from 'viem';

/**
 * How to read the 32-byte word a slot holds. CLOSED: a fifth member is additive, an open
 * string is not, since every member has to be a type `./abi-comparison.ts` can compare.
 */
export type SlotInterpretation = 'address' | 'bytes32' | 'uint256' | 'bool';

/** The value each declared interpretation decodes to. */
export type SlotValue<TInterpretation extends SlotInterpretation> = TInterpretation extends 'address' | 'bytes32'
	? `0x${string}`
	: TInterpretation extends 'uint256'
		? bigint
		: TInterpretation extends 'bool'
			? boolean
			: never;

/** `0x` followed by hex digits, which is all a word can be. */
const HEX = /^0x[0-9a-fA-F]*$/;

const ZERO_WORD = `0x${'0'.repeat(64)}` as const;
const ONE_WORD = `0x${'0'.repeat(63)}1` as const;

/**
 * Read one slot of one contract, as a full 32-byte word.
 *
 * The word is PADDED to 32 bytes rather than passed through, because nodes disagree about
 * an empty slot: some answer with 64 zeros and some with `0x0`. Normalising here is what
 * keeps the evaluation record (which carries the word) the same for one chain state
 * whatever node was asked.
 */
export async function readSlot(env: Environment, target: EIP1193Account, slot: EIP1193DATA): Promise<`0x${string}`> {
	const raw = await env.network.provider.request({
		method: 'eth_getStorageAt',
		params: [target, slot, 'latest'],
	});
	return toWord(raw, `the slot ${slot} of ${target}`);
}

/** Normalise whatever a provider answered into a full 32-byte word, or say why it cannot be one. */
export function toWord(raw: unknown, where: string): `0x${string}` {
	if (typeof raw !== 'string' || !HEX.test(raw)) {
		throw new Error(`reading ${where} returned ${JSON.stringify(raw)}, which is not hex data`);
	}
	const digits = raw.slice(2);
	if (digits.length > 64) {
		throw new Error(`reading ${where} returned ${raw}, which is longer than a 32-byte word`);
	}
	return `0x${digits.toLowerCase().padStart(64, '0')}`;
}

/**
 * Decode a word under the interpretation the caller declared.
 *
 * A word that does not FIT its declared interpretation throws, naming both. That is the
 * ADR 0013 rule applied to decoding: a guard which cannot produce a verdict must fail the
 * run rather than be mistaken for "not satisfied", because falling through to executing a
 * privileged call that may already have happened is the loss the guard exists to prevent.
 * The commonest cause is a PACKED slot, which holds several variables and simply cannot be
 * read as one whole-word value.
 *
 * `address` is the exception, and deliberately so: it takes the low 20 bytes and ignores
 * whatever sits above them, which is what `@rocketh/proxy` has always done and what every
 * EIP-1967 reader in the ecosystem does. The result is CHECKSUMMED, so a value read from a
 * slot is spelled the way viem spells one decoded from a getter.
 */
export function decodeSlotWord<TInterpretation extends SlotInterpretation>(
	interpretation: TInterpretation,
	word: `0x${string}`,
	where: string,
): SlotValue<TInterpretation> {
	// Widened on purpose: the `never` in the default branch below is what makes a fifth
	// member of the union fail to compile here instead of falling through at runtime.
	const declared: SlotInterpretation = interpretation;
	switch (declared) {
		case 'address':
			return getAddress(`0x${word.slice(-40)}`) as SlotValue<TInterpretation>;
		case 'bytes32':
			return word as SlotValue<TInterpretation>;
		case 'uint256':
			return BigInt(word) as SlotValue<TInterpretation>;
		case 'bool':
			if (word === ZERO_WORD) {
				return false as SlotValue<TInterpretation>;
			}
			if (word === ONE_WORD) {
				return true as SlotValue<TInterpretation>;
			}
			throw new Error(
				`${where} holds ${word}, which is not a "bool": a bool slot holds 0 or 1, so this slot holds something else (a packed slot cannot be read as one value)`,
			);
		default: {
			// Exhaustive over `SlotInterpretation`. The runtime throw covers the cast /
			// JS-caller paths that defeat the type. Mirrors the idiom in `packages/rocketh`.
			const exhaustive: never = declared;
			throw new Error(
				`${where} was declared as "${String(exhaustive)}", which is not one of address, bytes32, uint256, bool`,
			);
		}
	}
}
