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
 * How many times ONE unsignable transaction may be asked for a hash, in TOTAL.
 *
 * BOUNDED on purpose: a typo deserves a second chance, but an unattended or
 * mis-wired prompt that keeps answering nonsense must not be able to spin a run
 * forever. Giving up degrades to the same defer path as "cannot sign", so nothing
 * is lost but the pause.
 *
 * ONE BUDGET, SHARED BY BOTH RE-ASKS. A paste can fail two different ways — it is not
 * a well-formed hash (a SYNTAX failure, caught here) or the node has never heard of it
 * (a LOOKUP failure, caught at the seam, which then re-asks with the value pre-filled).
 * They deliberately spend the SAME counter, because two counters that each reset are
 * how an unbounded loop arrives by accident: alternating one malformed answer with one
 * unfindable hash would refill whichever budget the other kind did not touch, and the
 * run could be paused for ever. With one budget the whole pause costs at most this many
 * questions whatever the answers are, which is the property {@link HashPromptBudget}
 * exists to make provable.
 */
export const MAX_HASH_PROMPT_ATTEMPTS = 3;

/**
 * The remaining share of {@link MAX_HASH_PROMPT_ATTEMPTS} for ONE unsignable
 * transaction: created once per pause and passed to every ask, so the two re-ask paths
 * spend one counter rather than one each.
 *
 * Mutable and passed by reference on purpose. The counter has to be spent by code on
 * BOTH sides of this module's boundary (the malformed-paste loop here, the not-found
 * re-ask at the seam), and a returned-and-rethreaded number is the shape where one
 * caller forgets to thread it back and the bound quietly dies.
 */
export type HashPromptBudget = {remaining: number};

/** Open a fresh budget for one pause. Never reused across transactions. */
export function createHashPromptBudget(): HashPromptBudget {
	return {remaining: MAX_HASH_PROMPT_ATTEMPTS};
}

const TRANSACTION_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;

/**
 * The answer, already validated. `cannot-sign` carries WHY so the seam (and a log)
 * can tell a deliberate decline from an aborted prompt, a prompt that could not run
 * at all, or a pause that ran out of questions.
 *
 * `attempts-exhausted` is the {@link HashPromptBudget} reaching zero, whatever spent
 * it: malformed pastes here, hashes this node never found, or a mix of the two. It is
 * deliberately NOT named after malformed input (which it once was, as `no-valid-hash`),
 * because the budget is shared and naming it after one of its two spenders would read
 * as a lie on the other path.
 */
export type InteractiveUnknownSignerAnswer =
	| {type: 'hash'; hash: `0x${string}`}
	| {type: 'cannot-sign'; reason: 'declined' | 'cancelled' | 'prompt-failed' | 'attempts-exhausted'};

/** Normalise so `Cannot-Sign`, `cannot_sign` and `CANNOT  SIGN` all mean the same thing. */
function normaliseAnswer(value: string): string {
	return value.toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * The block a human reads before deciding. It embeds `details` — the
 * `UnknownSignerError` message, i.e. the exact transaction to execute — VERBATIM
 * and undegraded, because that message is the deliverable of the deferral workflow
 * and the interactive path must not show less than the throwing one does.
 *
 * IT ALSO STATES THAT AN OLD HASH IS WELCOME, because nothing else does and the
 * property is invisible from outside. Nothing on this path looks at WHEN the pasted
 * transaction landed: the seam requires that the node knows the hash and that its
 * receipt succeeded, and `classifyPastedTransaction` ranks evidence that it is the
 * call rocketh asked for. So the user who met this transaction under `'throw'` in an
 * earlier run, executed it on their Safe and is now being shown it again can simply
 * paste that hash, which is the documented way out of a stale deferral and does not
 * require editing the script.
 */
export function formatInteractivePresentation(details: string, from: string): string {
	return [
		SEPARATOR,
		`rocketh cannot sign for ${from}, so this run is PAUSED.`,
		'Execute the transaction below out-of-band (e.g. on your Safe), then paste the',
		`resulting transaction hash to continue this run. Answer "${CANNOT_SIGN_ANSWER}" (or press`,
		'enter) to stop here instead and get the transaction back to defer.',
		'ALREADY EXECUTED IT, after an earlier run stopped on it? Paste that hash: there is',
		'no freshness check, so a transaction executed before this run started is accepted',
		'as long as it succeeded and matches the call below.',
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
 *
 * CALLED ONCE PER ASK-AND-LOOKUP CYCLE, not once per pause: the seam calls it again
 * when the hash it got back turned out to be unknown to this node, passing that hash
 * as `previousAnswer`. Every call spends from the SAME `budget`, so the pause as a
 * whole is bounded however the two kinds of bad answer are interleaved.
 */
export async function askForExecutedTransactionHash(params: {
	promptText: NonNullable<PromptExecutor['promptText']>;
	showMessage: (message: string) => void;
	/** The `UnknownSignerError` message: the transaction to execute, undegraded. */
	details: string;
	from: string;
	/** Shared across every ask for this one transaction. See {@link HashPromptBudget}. */
	budget: HashPromptBudget;
	/**
	 * The hash asked about a moment ago, when this is a RE-ASK of a pause the human is
	 * ALREADY looking at (the seam looked it up and this node did not know it).
	 *
	 * Its PRESENCE means two things, which are one thing seen from either end: the
	 * value is offered back as the prompt's starting point, so a truncated paste or a
	 * dropped character costs an edit rather than a re-run; and the transaction banner is
	 * NOT printed again, because it is still on screen above the question that produced
	 * this value. (The malformed-paste loop below re-asks without reprinting it for the
	 * same reason.) A first ask has no previous answer and gets the banner.
	 */
	previousAnswer?: string;
}): Promise<InteractiveUnknownSignerAnswer> {
	const {promptText, showMessage, details, from, budget, previousAnswer} = params;

	if (previousAnswer === undefined) {
		showMessage(formatInteractivePresentation(details, from));
	}

	while (budget.remaining > 0) {
		budget.remaining--;
		let answer: TextPromptAnswer;
		try {
			answer = await promptText({
				type: 'text',
				name: 'transactionHash',
				message: `Transaction hash executed for ${from} (or "${CANNOT_SIGN_ANSWER}")`,
				// A HINT the runtime may ignore (see `TextPromptRequest`): where it is honoured
				// the human presses enter to try the same hash again, or types a corrected one.
				...(previousAnswer === undefined ? {} : {initial: previousAnswer}),
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

		showMessage(
			`"${value}" is not a transaction hash (expected 0x followed by 64 hex characters).` +
				describeRemainingAttempts(budget),
		);
	}

	return {type: 'cannot-sign', reason: 'attempts-exhausted'};
}

/**
 * The tail of every "that answer was no good" message: how much of the shared budget is
 * left, or that the pause is over.
 *
 * ONE phrasing for both re-ask paths, because they spend one budget: a user who met a
 * malformed-paste message and then a not-found one has to be able to read the two
 * countdowns as the same countdown, which they are.
 */
export function describeRemainingAttempts(budget: HashPromptBudget): string {
	return budget.remaining > 0
		? ` ${budget.remaining} attempt${budget.remaining === 1 ? '' : 's'} left.`
		: ' Giving up and deferring the transaction.';
}

/** What a human types to accept a transaction rocketh could not tie to the request. */
export const CONFIRM_UNRELATED_ANSWER = 'yes';

/**
 * Ask whether to accept a pasted transaction that carries NO evidence of being the requested
 * one (see `pastedTransactionIntent.ts` for what counts as evidence).
 *
 * WHY ASK RATHER THAN REFUSE. Executing governance by identifier, such as Governor Bravo's
 * `execute(uint256 proposalId)` where the payload was queued earlier, leaves no trace of the
 * calldata in the executing transaction. That is a legitimate workflow and refusing it would
 * break it. What is NOT legitimate is recording it silently, which is what happened before:
 * a successful receipt was the whole of the check, so pasting an unrelated successful hash
 * was accepted at face value.
 *
 * WHY ASK RATHER THAN WARN. The run is about to record a privileged operation as done, and a
 * warning scrolls past while the deployment record keeps the consequence. The default is
 * therefore NO: anything but an explicit yes defers the transaction, which loses nothing but
 * the pause.
 */
export async function confirmUnrelatedTransaction(params: {
	promptText: NonNullable<PromptExecutor['promptText']>;
	showMessage: (message: string) => void;
	/** What rocketh looked for and did not find, in words a human can act on. */
	finding: string;
	hash: `0x${string}`;
}): Promise<{type: 'accepted'} | {type: 'rejected'; reason: 'declined' | 'cancelled' | 'prompt-failed'}> {
	const {promptText, showMessage, finding, hash} = params;

	showMessage(
		[
			SEPARATOR,
			`The transaction you pasted SUCCEEDED, but rocketh cannot tell that it is the one it asked for.`,
			`  ${hash}`,
			`  ${finding}`,
			'',
			'That is expected for governance executed by proposal id, where the payload was queued',
			'earlier and this transaction only references it. It is also what pasting the wrong hash',
			'looks like. rocketh cannot tell those apart, so it is your call.',
			SEPARATOR,
		].join('\n'),
	);

	let answer: TextPromptAnswer;
	try {
		answer = await promptText({
			type: 'text',
			name: 'confirmUnrelatedTransaction',
			message: `Record this transaction as the requested execution? ("${CONFIRM_UNRELATED_ANSWER}" to accept, anything else to defer)`,
		});
	} catch (err) {
		showMessage(`could not ask for confirmation (${err}); deferring the transaction instead.`);
		return {type: 'rejected', reason: 'prompt-failed'};
	}

	if ('cancelled' in answer) {
		return {type: 'rejected', reason: 'cancelled'};
	}

	// Only an explicit yes accepts. A blank line, a stray keystroke or an unattended prompt all
	//  mean "do not record it", which is the safe direction: the transaction can be re-pasted.
	return normaliseAnswer(answer.value.trim()) === CONFIRM_UNRELATED_ANSWER
		? {type: 'accepted'}
		: {type: 'rejected', reason: 'declined'};
}
