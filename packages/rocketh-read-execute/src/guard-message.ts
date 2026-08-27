/**
 * What a SKIPPED guarded step tells the user, rendered from the evaluation record.
 *
 * A guarded step whose condition is already satisfied leaves NOTHING behind: no
 * transaction, no receipt, no output. So a run where a guard is subtly wrong (it reads the
 * registry instead of the proxy behind it, or the slot the author meant to name) looks
 * exactly like a run where the work was genuinely already done, and the person debugging
 * "why did my upgrade not happen" has nothing to read. This module is the answer to that:
 * one line saying which step was skipped, what rocketh read and how, what came back, and
 * what it was compared against.
 *
 * It is the PAYOFF of the guard being a declared read rather than an opaque predicate
 * (`docs/adr/0013-the-execute-guard-is-a-declared-read.md`). A closure would have left no
 * read to name, no value to show and no expected value to quote, and this module could not
 * exist at all.
 *
 * Everything it says is READ OFF the {@link GuardEvaluation} the evaluator produced, never
 * re-derived from the guard the user wrote. Re-deriving would create a second answer to
 * "what did rocketh read", and the one the user sees would be the one nothing ever checked
 * against the chain.
 *
 * DECISION - one line, no matter the kind. A deploy script holding dozens of guarded steps
 * is a normal shape, so a paragraph per step would bury the run it is meant to explain.
 * The line is long rather than folded, because every hex value in it is quoted WHOLE: a
 * truncated address or slot is not greppable and cannot be compared against the script.
 *
 * DECISION - nothing is said on the path that SENDS. That step already leaves a
 * transaction, a receipt and (when the signer is unknown) a deferral block behind it, so
 * announcing it too would be noise on the only path that has other evidence.
 *
 * Not exported from the package root: that surface may hold only curried `(env) => ...`
 * entries, because `withEnvironment` calls every entry it is given (see `./errors.ts` for
 * the same constraint on `GuardEvaluationError`).
 */

import {postfixBigIntReplacer} from '@rocketh/core/json';
import {describeGuard} from './errors.js';
import type {GuardEvaluation} from './guard.js';

/**
 * Render one value the way the run's author wrote it, or as close as JavaScript allows.
 *
 * A string (an address, a `bytes32`, a symbol) is printed BARE rather than JSON-quoted, as
 * the deferred-transaction block does, since quoting an address only adds noise. Bigints
 * are stringified recursively through `postfixBigIntReplacer`, because a `uint256[]` or a
 * tuple return nests them and plain `JSON.stringify` throws on those. Rendering a message
 * must never be able to throw: an exception here would replace the very information the
 * user needs to understand why nothing happened.
 */
function stringifyValue(value: unknown): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'bigint') return value.toString();
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	try {
		return JSON.stringify(value, postfixBigIntReplacer) ?? String(value);
	} catch {
		return String(value);
	}
}

/**
 * Name the selected output the way the guard named it: `"isMember"` for a name, `#1` for a
 * position. The `#` spelling for a position is the one `selectOutput`'s error already uses
 * when it lists a function's declared outputs, so there is one vocabulary rather than two.
 */
function describeSelector(selector: string | number): string {
	return typeof selector === 'number' ? `#${selector}` : `"${selector}"`;
}

/**
 * The line a user reads when a guarded step was not needed.
 *
 * @param functionName the function that would have been called had the guard not been
 *   satisfied. It is the only part NOT taken from the evaluation record, because the
 *   record describes the READ and this names the step that was skipped.
 * @param evaluation what the evaluator read, selected and compared.
 */
export function describeSkippedStep(functionName: string, evaluation: GuardEvaluation): string {
	const clauses: string[] = [];

	if (evaluation.kind === 'storage') {
		clauses.push(describeGuard({kind: 'storage', target: evaluation.target, slot: evaluation.slot}));
		// The DECODED value, not the raw word: the word is a left-padded, lowercased 32 bytes,
		// while what the author wrote in their script is an address, a number or a flag. The
		// declared interpretation is named alongside it, because it is HOW the word was read and
		// a wrong `as` is one of the two ways a storage guard misleads (the other being the slot).
		clauses.push(`read the ${evaluation.as} ${stringifyValue(evaluation.value)}`);
	} else {
		clauses.push(
			describeGuard({kind: 'call', target: evaluation.target, functionName: String(evaluation.functionName)}),
		);
		// The arguments are part of what was read: a guard on `hasRole(role, alice)` is not a
		// guard on `hasRole(role, bob)`, and the function name alone cannot tell them apart.
		if (evaluation.args.length > 0) {
			clauses.push(`with args (${evaluation.args.map(stringifyValue).join(', ')})`);
		}
		clauses.push(`read ${stringifyValue(evaluation.value)}`);
	}

	// The WHOLE value is shown above and the selected component here, so a reader can see
	// which part of a multi-output return the verdict actually judged, and which parts it
	// deliberately did not.
	const selection =
		evaluation.kind === 'call' && evaluation.output !== undefined
			? `, output ${describeSelector(evaluation.output)} is ${stringifyValue(evaluation.selected)}`
			: '';

	// `expected` is absent, never `undefined`, when the verdict was a predicate: there is no
	// value to quote. Saying so beats silence, which would leave a reader wondering whether an
	// expectation existed and was dropped.
	const verdict =
		'expected' in evaluation
			? `, expected ${stringifyValue(evaluation.expected)}`
			: ', accepted by its satisfied() predicate';

	return `skipped ${functionName}: ${clauses.join(' ')}${selection}${verdict}`;
}
