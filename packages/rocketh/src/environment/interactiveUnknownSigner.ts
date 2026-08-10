import type {PromptExecutor, TextPromptAnswer} from '@rocketh/core/types';

/**
 * THE INTERACTIVE UNKNOWN-SIGNER PROMPT.
 *
 * Asking half of the `'ask'` policy: present the transaction rocketh cannot sign,
 * and take back either the hash of the transaction the human executed out-of-band
 * (on their Safe, a hardware wallet, an air-gapped machine) or the fact that they
 * cannot sign it right now. It does NOT touch the chain, save state or decide what
 * a hash means: the seam owns that, so this module stays drivable in a test with a
 * scripted prompt and no environment at all.
 */

const SEPARATOR = '---------------------------------------------------------------------------------------';

/** What a human types to say "not now" (case/spacing/dash insensitive; see `parseAnswer`). */
export const CANNOT_SIGN_ANSWER = 'cannot sign';

/**
 * How many times a malformed paste is re-asked before the run gives up and defers.
 * BOUNDED on purpose: a typo deserves a second chance, but an unattended or
 * mis-wired prompt that keeps answering nonsense must not be able to spin a run
 * forever. Giving up degrades to the same defer path as "cannot sign", so nothing
 * is lost but the pause.
 */
export const MAX_HASH_PROMPT_ATTEMPTS = 3;

const TRANSACTION_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;

/**
 * The answer, already validated. `cannot-sign` carries WHY so the seam (and a log)
 * can tell a deliberate decline from an aborted prompt, a prompt that could not run
 * at all, or a paste that never became a hash.
 */
export type InteractiveUnknownSignerAnswer =
	| {type: 'hash'; hash: `0x${string}`}
	| {type: 'cannot-sign'; reason: 'declined' | 'cancelled' | 'prompt-failed' | 'no-valid-hash'};

/** Normalise so `Cannot-Sign`, `cannot_sign` and `CANNOT  SIGN` all mean the same thing. */
function normaliseAnswer(value: string): string {
	return value.toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * The block a human reads before deciding. It embeds `details` — the
 * `UnknownSignerError` message, i.e. the exact transaction to execute — VERBATIM
 * and undegraded, because that message is the deliverable of the deferral workflow
 * and the interactive path must not show less than the throwing one does.
 */
export function formatInteractivePresentation(details: string, from: string): string {
	return [
		SEPARATOR,
		`rocketh cannot sign for ${from}, so this run is PAUSED.`,
		'Execute the transaction below out-of-band (e.g. on your Safe), then paste the',
		`resulting transaction hash to continue this run. Answer "${CANNOT_SIGN_ANSWER}" (or press`,
		'enter) to stop here instead and get the transaction back to defer.',
		SEPARATOR,
		details,
		SEPARATOR,
	].join('\n');
}

/**
 * Ask for the hash of the transaction executed out-of-band.
 *
 * `promptText` is passed in rather than a whole `PromptExecutor`, so a caller cannot
 * reach here without having established the text CAPABILITY first (ADR 0007: the
 * ability is the optional method, and its absence IS the signal).
 *
 * VALIDATION LIVES HERE, deliberately. `TextPromptAnswer` is a generic primitive in
 * which an EMPTY string is a VALUE, not a cancellation, precisely because only the
 * caller knows what its prompt can accept. This caller accepts a 32-byte hex hash
 * and reads everything else as a decision or a typo.
 */
export async function askForExecutedTransactionHash(params: {
	promptText: NonNullable<PromptExecutor['promptText']>;
	showMessage: (message: string) => void;
	/** The `UnknownSignerError` message: the transaction to execute, undegraded. */
	details: string;
	from: string;
}): Promise<InteractiveUnknownSignerAnswer> {
	const {promptText, showMessage, details, from} = params;

	showMessage(formatInteractivePresentation(details, from));

	for (let attempt = 1; attempt <= MAX_HASH_PROMPT_ATTEMPTS; attempt++) {
		let answer: TextPromptAnswer;
		try {
			answer = await promptText({
				type: 'text',
				name: 'transactionHash',
				message: `Transaction hash executed for ${from} (or "${CANNOT_SIGN_ANSWER}")`,
			});
		} catch (err) {
			// A prompt that cannot really reach a human (no TTY behind it) must not replace
			// the transaction the user needs with a readline error: fall back to deferring,
			// which prints that transaction and throws the error the workflow expects.
			showMessage(`could not ask for a transaction hash (${err}); deferring the transaction instead.`);
			return {type: 'cannot-sign', reason: 'prompt-failed'};
		}

		if ('cancelled' in answer) {
			return {type: 'cannot-sign', reason: 'cancelled'};
		}

		const value = answer.value.trim();
		if (value === '' || normaliseAnswer(value) === CANNOT_SIGN_ANSWER) {
			return {type: 'cannot-sign', reason: 'declined'};
		}
		if (TRANSACTION_HASH_PATTERN.test(value)) {
			// Lowercased like every other address/hash key rocketh stores, so a hash pasted
			// from a block explorer that checksums nothing still compares equal to the one
			// the node returns.
			return {type: 'hash', hash: value.toLowerCase() as `0x${string}`};
		}

		const remaining = MAX_HASH_PROMPT_ATTEMPTS - attempt;
		showMessage(
			`"${value}" is not a transaction hash (expected 0x followed by 64 hex characters).` +
				(remaining > 0
					? ` ${remaining} attempt${remaining === 1 ? '' : 's'} left.`
					: ' Giving up and deferring the transaction.'),
		);
	}

	return {type: 'cannot-sign', reason: 'no-valid-hash'};
}
