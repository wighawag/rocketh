/**
 * `GuardEvaluationError` — the single carrier for "a guard could not produce a verdict".
 *
 * The asymmetry it exists to enforce: an error while EVALUATING a guard is NOT evidence
 * that the guarded call is still needed. A guard whose read reverts, whose target holds no
 * code, whose slot cannot be decoded or whose own `satisfied` predicate throws has told us
 * nothing at all, so the run aborts with this error rather than falling through to
 * executing a privileged call the operator may already have executed out of band. rocketh
 * cannot observe an out-of-band execution, which is exactly why the chain-derived guard is
 * the only thing that makes a re-run converge
 * (`docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md`,
 * `docs/adr/0013-the-execute-guard-is-a-declared-read.md`). Fail-loud costs a re-run and a
 * fixed script; fail-open costs a duplicated mint, transfer or governance action.
 *
 * DECISION — why a `./errors` subpath rather than the package root. Every runtime export of
 * a rocketh extension package is spread into `extensions` and fed to `withEnvironment`
 * (`@rocketh/core/environment`), which calls EVERY entry as `value(env)`. A class exported
 * from the root would be refused by name the moment a user wrote
 * `{...readExecuteExtension}`. The root surface therefore stays function-only, and the
 * subpath carries the class, exactly as `@rocketh/unknown-signer` does with
 * `UnknownSignerError`.
 */

import type {EIP1193Account, EIP1193DATA} from 'eip-1193';

/** What FAILED, in the terms the guard was declared in, so the script can be fixed. */
export type GuardEvaluationErrorData = {
	/** Which kind of guard failed, the same discriminant the guard itself carries. */
	kind: 'call' | 'storage';

	/**
	 * The address that was READ, which is usually not the contract being executed. Absent
	 * only when the guard named no `on` and no default target was available, i.e. when
	 * there was no address to read in the first place.
	 */
	target?: EIP1193Account;

	/** The view function a `call` guard reads. Absent for a `storage` guard. */
	functionName?: string;

	/** The slot a `storage` guard reads. Absent for a `call` guard. */
	slot?: EIP1193DATA;
};

/**
 * Describe the guard in the words its author wrote it in, for the head of the message.
 *
 * A guard failure is diagnosable only if the message says WHICH guard failed: a script may
 * hold many, they read contracts other than the ones being called, and a `storage` guard
 * has no function name to recognise it by at all.
 *
 * Exported so anything rendering {@link GuardEvaluationErrorData} of its own (a later
 * collector reporting the pending set, say) names a guard exactly as the error message
 * does, rather than inventing a second spelling for the same thing.
 */
export function describeGuard(data: GuardEvaluationErrorData): string {
	const what = data.kind === 'storage' ? `slot ${data.slot}` : `"${data.functionName}"`;
	return data.target ? `the guard on ${what} of ${data.target}` : `the guard on ${what}`;
}

export class GuardEvaluationError extends Error {
	/** Stable name so cross-realm identity checks (`err.name === '...'`) work. */
	override readonly name = 'GuardEvaluationError';
	readonly data: GuardEvaluationErrorData;

	/**
	 * @param data which guard failed, and what it was reading
	 * @param detail what went wrong, appended to the description of the guard
	 * @param cause the underlying failure, kept WHOLE. It is the thing that tells the user
	 *   how to fix their script (a revert reason, a node refusing an RPC, a `TypeError` in
	 *   their own predicate), so it is preserved rather than reworded away.
	 */
	constructor(data: GuardEvaluationErrorData, detail: string, cause?: unknown) {
		super(`${describeGuard(data)} ${detail}`, cause === undefined ? undefined : {cause});
		this.data = data;
		// Preserve prototype chain across transpilation targets.
		Object.setPrototypeOf(this, GuardEvaluationError.prototype);
	}
}
