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
 * What CAN be done is rank the evidence, and only involve the human where it is missing or
 * points elsewhere. The ACCEPTED tiers, strongest first:
 *
 *   - `direct`   the transaction IS the one described (same `to`, `data` and `value`).
 *   - `safe`     it was sent TO the account rocketh needed to act as, its input is a Safe
 *                `execTransaction`, and the inner call it carries is exactly the requested one
 *                (same `to`, `value` and `data`, operation CALL). This is what executing the
 *                transaction from a Safe looks like, decoded rather than guessed.
 *   - `embedded` rocketh's calldata appears verbatim INSIDE the transaction's input, which is
 *                what a Safe MultiSend batch, an OpenZeppelin `TimelockController.execute` or
 *                most other wallets' `execute(to, value, data)` look like. Wallet-agnostic: no
 *                ABI is decoded and no wallet is recognised.
 *
 * And the tiers that go to the human for confirmation (`requiresConfirmation`):
 *
 *   - `safe-mismatch` a Safe `execTransaction` on the right account whose inner call is NOT the
 *                requested one (another target, another value, other calldata, or a
 *                DELEGATECALL). Carries what the Safe executed, so the human is told.
 *   - `account`  sent TO the account rocketh needed to act as, but neither a Safe
 *                `execTransaction` nor carrying the calldata, so nothing shows WHAT that account
 *                executed. A wallet that executes a previously submitted transaction by id
 *                looks like this, and so does any unrelated transaction to that account.
 *   - `none`     nothing links the two.
 *
 * WHY BEING SENT TO THE ACCOUNT IS NO LONGER ENOUGH. It used to be: `account` was accepted and
 * checked BEFORE `embedded`, so the hash of ANY successful transaction to the Safe (an unrelated
 * Safe transaction, a different upgrade) was recorded as the requested operation without a
 * word. Being sent to the account says WHO acted, not WHAT they did, and for a Safe the WHAT is
 * right there in the input, so it is decoded and compared.
 *
 * A Safe's `execTransaction` is decoded by hand (its head is fixed: `to`, `value`, an offset to
 * `data`, `operation`, then six more words) because this package does not depend on viem, and a
 * classifier that must never throw is better served by a bounds-checked reader than by a
 * general decoder: anything that does not parse is simply not treated as a Safe execution.
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

/** The call a Safe `execTransaction` made, decoded from its input. */
export type SafeExecutedCall = {
	to: `0x${string}`;
	value: bigint;
	data: `0x${string}`;
	/** 0 is CALL, 1 is DELEGATECALL. */
	operation: bigint;
};

export type PastedTransactionEvidence =
	/** Same `to`, `data` and `value`: this IS the transaction. */
	| {tier: 'direct'}
	/** A Safe `execTransaction` on the account rocketh needed, executing exactly the requested call. */
	| {tier: 'safe'}
	/** The intended calldata appears verbatim inside this transaction's input. */
	| {tier: 'embedded'}
	/** A Safe `execTransaction` on the right account that executed something ELSE. */
	| {tier: 'safe-mismatch'; executed: SafeExecutedCall}
	/** Sent to the account rocketh needed to act as, with nothing showing what it executed. */
	| {tier: 'account'}
	/** Nothing links the two. Not proof of a mistake; proof of nothing. */
	| {tier: 'none'};

/**
 * Whether a human must vouch for the pasted transaction before it is recorded. Every tier that
 * is not positive evidence of THIS call asks; none of them refuses (see `none` above).
 */
export function requiresConfirmation(evidence: PastedTransactionEvidence): boolean {
	switch (evidence.tier) {
		case 'direct':
		case 'safe':
		case 'embedded':
			return false;
		case 'safe-mismatch':
		case 'account':
		case 'none':
			return true;
	}
}

/** `execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)`. */
export const SAFE_EXEC_TRANSACTION_SELECTOR = '6a761202';
/** Words in `execTransaction`'s head: ten parameters, each one 32-byte word (or an offset). */
const SAFE_EXEC_TRANSACTION_HEAD_WORDS = 10;
const WORD = 64; // hex characters in a 32-byte word

/**
 * Decode a Safe `execTransaction` input, or `undefined` if it is not one. Bounds-checked
 * throughout and never throws: a classifier input that does not parse is not a Safe execution.
 *
 * @param input lowercased hex WITH its `0x` prefix
 */
export function decodeSafeExecTransaction(input: string): SafeExecutedCall | undefined {
	if (!input.startsWith('0x' + SAFE_EXEC_TRANSACTION_SELECTOR)) return undefined;
	const body = input.slice(2 + SAFE_EXEC_TRANSACTION_SELECTOR.length);
	if (!/^[0-9a-f]*$/.test(body) || body.length < SAFE_EXEC_TRANSACTION_HEAD_WORDS * WORD) return undefined;
	const word = (index: number) => body.slice(index * WORD, (index + 1) * WORD);

	const toWord = word(0);
	// An address occupies the low 20 bytes; anything in the high 12 is not a valid encoding.
	if (!/^0{24}/.test(toWord)) return undefined;
	const to = `0x${toWord.slice(24)}` as `0x${string}`;
	const value = BigInt('0x' + word(1));
	const operation = BigInt('0x' + word(3));

	const dataOffset = BigInt('0x' + word(2));
	// The offset is in bytes from the start of the head, and must leave room for a length word.
	if (dataOffset % 32n !== 0n || dataOffset * 2n + BigInt(WORD) > BigInt(body.length)) return undefined;
	const lengthStart = Number(dataOffset) * 2;
	const dataLength = BigInt('0x' + body.slice(lengthStart, lengthStart + WORD));
	const dataStart = lengthStart + WORD;
	if (BigInt(dataStart) + dataLength * 2n > BigInt(body.length)) return undefined;
	const data = `0x${body.slice(dataStart, dataStart + Number(dataLength) * 2)}` as `0x${string}`;

	return {to, value, data, operation};
}

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

	const sentToAccount = sameAddress(transaction.to, intended.from);
	// Only a transaction sent TO the account is decoded as that account's Safe execution: a
	//  Safe executes its own `execTransaction`, so the same input sent elsewhere is not one.
	const safeCall = sentToAccount ? decodeSafeExecTransaction(actualInput) : undefined;

	// SAFE. The account is a Safe and executed EXACTLY the requested call: the strongest
	//  evidence short of `direct`, and decoded rather than inferred. Operation must be CALL (0):
	//  the same target and calldata under DELEGATECALL runs the target's code in the Safe's own
	//  storage, which is a different (and dangerous) transaction.
	//
	//  When the inner calldata IS the requested calldata but anything else differs (another
	//  target, another value, a DELEGATECALL), it is `safe-mismatch` and never `embedded`, even
	//  though the bytes are in there: the Safe has been decoded and it says what it did.
	if (safeCall && normalizeData(safeCall.data) === intendedData) {
		if (
			intended.to !== undefined &&
			sameAddress(safeCall.to, intended.to) &&
			safeCall.operation === 0n &&
			sameValue(intended.value, `0x${safeCall.value.toString(16)}`)
		) {
			return {tier: 'safe'};
		}
		return {tier: 'safe-mismatch', executed: safeCall};
	}

	// EMBEDDED. A Safe MultiSend (the Safe DELEGATECALLs MultiSend, whose packed batch carries
	//  each call verbatim), OpenZeppelin's `TimelockController` and most wallets' `execute`
	//  carry the inner calldata VERBATIM in their encoding, so a substring test recognises them
	//  without knowing anything about the wallet. This keeps accepting what it always accepted.
	//  The `0x` guard matters: an empty payload is a substring of everything, and a plain ETH
	//  transfer would otherwise "match" every transaction in existence.
	//  For a decoded Safe call only the INNER calldata is searched, and only where the requested
	//  call can actually have run from the Safe: a DELEGATECALL (MultiSend runs each packed call
	//  as the Safe) or a CALL to the target itself (its own `multicall`). A Safe CALL to any
	//  OTHER contract that merely carries the calldata (queueing it in a timelock with
	//  `schedule`, say) did not make the call, and is `safe-mismatch` below.
	const safeCallCanCarryTheRequest =
		safeCall !== undefined &&
		(safeCall.operation === 1n || (intended.to !== undefined && sameAddress(safeCall.to, intended.to)));
	const searchedInput = safeCall ? (safeCallCanCarryTheRequest ? normalizeData(safeCall.data) : '0x') : actualInput;
	if (intendedData !== '0x' && searchedInput.includes(intendedData.slice(2))) {
		return {tier: 'embedded'};
	}

	// SAFE-MISMATCH. The Safe was decoded and executed something that neither is nor carries the
	//  requested call: the hash of ANOTHER Safe transaction, which used to pass as `account`.
	if (safeCall) {
		return {tier: 'safe-mismatch', executed: safeCall};
	}

	// ACCOUNT. Sent to the right account, but nothing shows what it executed. Asked about rather
	//  than accepted (it says who acted, not what they did) and not refused either: a wallet that
	//  executes a previously submitted transaction by id is legitimate and looks exactly like this.
	if (sentToAccount) {
		return {tier: 'account'};
	}

	return {tier: 'none'};
}

const OPERATION_NAMES: Record<string, string> = {'0': 'CALL', '1': 'DELEGATECALL'};

/** A long calldata is summarised as its selector and size: the human needs to see it differs. */
function summarizeData(data: string | undefined): string {
	const normalized = normalizeData(data);
	const bytes = (normalized.length - 2) / 2;
	return bytes <= 36 ? normalized : `${normalized.slice(0, 10)}... (${bytes} bytes)`;
}

function describeIntendedValue(value: bigint | string | undefined): string {
	try {
		return BigInt(value ?? 0).toString();
	} catch {
		return String(value);
	}
}

/** One line for the run's log, naming WHY the transaction was believed. */
export function describeEvidence(evidence: PastedTransactionEvidence, intended: IntendedTransaction): string {
	switch (evidence.tier) {
		case 'direct':
			return `matched the requested transaction exactly (same to, data and value)`;
		case 'safe':
			return (
				`is a Safe execution (execTransaction) on ${intended.from}, the account this transaction had to come ` +
				`from, and the Safe executed exactly this call (same to, value and data, operation CALL)`
			);
		case 'embedded':
			return `carries the requested calldata inside its own input, as a Safe or timelock execution does`;
		case 'safe-mismatch': {
			const {executed} = evidence;
			const operation = OPERATION_NAMES[executed.operation.toString()] ?? `operation ${executed.operation}`;
			return (
				`is a Safe execution (execTransaction) on ${intended.from}, but the Safe executed a DIFFERENT call: ` +
				`${operation} to ${executed.to}, value ${executed.value}, data ${summarizeData(executed.data)}; ` +
				`the requested call is CALL to ${intended.to ?? '<none>'}, value ${describeIntendedValue(intended.value)}, ` +
				`data ${summarizeData(intended.data)}`
			);
		}
		case 'account':
			return (
				`was sent to ${intended.from}, the account this transaction had to come from, but it is neither a Safe ` +
				`execTransaction nor carrying the requested calldata, so nothing shows what that account executed`
			);
		case 'none':
			return `carries nothing linking it to the requested transaction`;
	}
}

/**
 * The headline and explanation of the confirmation prompt, for the tiers that ask. `none` keeps
 * the prompt's own default (governance executed by proposal id), so it is unchanged.
 */
export function confirmationWording(evidence: PastedTransactionEvidence): {headline?: string; explanation?: string[]} {
	switch (evidence.tier) {
		case 'safe-mismatch':
			return {
				headline: `The transaction you pasted SUCCEEDED, but the Safe executed a DIFFERENT call than the one requested.`,
				explanation: [
					'That is what pasting the hash of another transaction of the same Safe looks like, and',
					'recording it would mark the requested operation as done when it was not. Defer unless you',
					'know this transaction really does what was requested.',
				],
			};
		case 'account':
			return {
				headline: `The transaction you pasted SUCCEEDED and was sent to the right account, but rocketh cannot see what it executed.`,
				explanation: [
					'That is expected for a wallet that executes a transaction submitted earlier by its id. It is',
					'also what pasting the hash of any other transaction to that account looks like. rocketh',
					'cannot tell those apart, so it is your call.',
				],
			};
		default:
			return {};
	}
}
