/**
 * How much evidence is there that a PASTED transaction is the one rocketh asked for?
 *
 * When rocketh cannot sign, the interactive path prints the transaction, the user executes
 * it out-of-band and pastes back a hash. Until now the only thing checked for an EXECUTION
 * was that the hash existed on this network and its receipt reported success, so pasting the
 * hash of an unrelated successful transaction was accepted at face value. For a proxy
 * upgrade, a diamond cut or an ownership transfer, that is the wrong thing to be relaxed
 * about.
 *
 * THE PROBLEM IS THAT "WRONG" AND "INDIRECT" LOOK THE SAME. A Safe execution is not the
 * transaction rocketh described: it goes to the Safe, carrying rocketh's call as an inner
 * payload, signed by an owner who is not the `from` at all. A timelock adds another layer. So
 * a mismatch cannot simply be rejected, and equality cannot simply be required.
 *
 * What CAN be done is rank the evidence, and only involve the human where there is none:
 *
 *   - `direct`   the transaction IS the one described (same `to`, `data` and `value`).
 *   - `account`  it was sent TO the account rocketh needed to act as, which is exactly what a
 *                Safe execution looks like from outside.
 *   - `embedded` rocketh's calldata appears verbatim INSIDE the transaction's input, which is
 *                what a Safe `execTransaction`, a MultiSend batch or an OpenZeppelin
 *                `TimelockController.execute` payload looks like. Wallet-agnostic: no ABI is
 *                decoded and no wallet is recognised.
 *   - `none`     nothing links the two.
 *
 * `none` MUST NOT BE A REJECTION. Governance that executes by identifier (Governor Bravo's
 * `execute(uint256 proposalId)`, where the payload was queued in an earlier transaction)
 * carries no trace of the calldata, and refusing it would break a legitimate workflow. It is
 * the point at which the run stops guessing and asks.
 *
 * A note on what this is worth: an unrelated transaction essentially never contains your
 * exact calldata, so `embedded` catches the accidental paste, which is the realistic failure.
 * It is not a defence against a user who deliberately confirms the wrong thing.
 */

import type {EIP1193Account, EIP1193DATA, EIP1193Transaction} from 'eip-1193';

/** The transaction rocketh needed executed, as carried by `UnknownSignerErrorData`. */
export type IntendedTransaction = {
	/** The account rocketh could not sign for. For a Safe, the Safe's own address. */
	from: string;
	/** Absent for a contract deployment. */
	to?: string;
	/** Calldata, or init code for a deployment. */
	data?: string;
	value?: bigint | string;
};

export type PastedTransactionEvidence =
	/** Same `to`, `data` and `value`: this IS the transaction. */
	| {tier: 'direct'}
	/** Sent to the account rocketh needed to act as (the Safe/multisig itself). */
	| {tier: 'account'}
	/** The intended calldata appears verbatim inside this transaction's input. */
	| {tier: 'embedded'}
	/** Nothing links the two. Not proof of a mistake; proof of nothing. */
	| {tier: 'none'};

function sameAddress(a: string | null | undefined, b: string | null | undefined): boolean {
	if (!a || !b) return false;
	return a.toLowerCase() === b.toLowerCase();
}

/** Hex payloads compare lowercased and `undefined` reads as empty, which is what `0x` means. */
function normalizeData(data: string | null | undefined): string {
	if (!data) return '0x';
	return data.toLowerCase();
}

/**
 * Quantities compare NUMERICALLY, never as strings: the same amount is written `0x0`, `0x00`
 * and `0` by different wallets and nodes, and a string comparison would call those different.
 */
function sameValue(intended: bigint | string | undefined, actual: EIP1193DATA | undefined): boolean {
	try {
		return BigInt(intended ?? 0) === BigInt(actual ?? 0);
	} catch {
		// An unparsable quantity is not evidence of a match. Never throw from a classifier
		//  whose whole job is to inform a decision; the caller degrades to a weaker tier.
		return false;
	}
}

/**
 * Rank how strongly `transaction` looks like an execution of `intended`.
 *
 * Pure and total: every input produces a tier, and `none` is the honest answer rather than a
 * failure.
 */
export function classifyPastedTransaction(
	intended: IntendedTransaction,
	transaction: Pick<EIP1193Transaction, 'to' | 'input' | 'value'> & {from?: EIP1193Account},
): PastedTransactionEvidence {
	const intendedData = normalizeData(intended.data);
	const actualInput = normalizeData(transaction.input);

	// DIRECT. `to` is compared only when rocketh had one: a deployment has none, and a
	//  deployment is anchored by its address elsewhere (`requireDeployedContract`), not here.
	if (
		intended.to !== undefined &&
		sameAddress(transaction.to, intended.to) &&
		actualInput === intendedData &&
		sameValue(intended.value, transaction.value)
	) {
		return {tier: 'direct'};
	}

	// ACCOUNT. The transaction was sent TO the account rocketh needed to act as. That is the
	//  shape of every Safe execution: rocketh wanted the Safe to call the target, and the
	//  execution is a transaction to the Safe. Deliberately checked BEFORE `embedded`, since it
	//  identifies the executing account rather than merely finding bytes.
	if (sameAddress(transaction.to, intended.from)) {
		return {tier: 'account'};
	}

	// EMBEDDED. Safe `execTransaction`, MultiSend and OpenZeppelin's `TimelockController` all
	//  carry the inner calldata VERBATIM in their ABI encoding, so a substring test recognises
	//  them without knowing anything about the wallet. The `0x` guard matters: an empty payload
	//  is a substring of everything, and a plain ETH transfer would otherwise "match" every
	//  transaction in existence.
	if (intendedData !== '0x' && actualInput.includes(intendedData.slice(2))) {
		return {tier: 'embedded'};
	}

	return {tier: 'none'};
}

/** One line for the run's log, naming WHY the transaction was believed. */
export function describeEvidence(evidence: PastedTransactionEvidence, intended: IntendedTransaction): string {
	switch (evidence.tier) {
		case 'direct':
			return `matched the requested transaction exactly (same to, data and value)`;
		case 'account':
			return `was sent to ${intended.from}, the account this transaction had to come from`;
		case 'embedded':
			return `carries the requested calldata inside its own input, as a Safe or timelock execution does`;
		case 'none':
			return `carries nothing linking it to the requested transaction`;
	}
}
