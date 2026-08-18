/**
 * `@rocketh/unknown-signer` — what happens when rocketh cannot sign, at the CALL site.
 *
 * Two wrappers, both scoping the unknown-signer policy to ONE action through the same
 * push/pop policy frame on the environment: `catchUnknownSigner` (the hardhat-deploy v1
 * helper: force the throw path and hand the transaction back) and
 * `withUnknownSignerPolicy` (choose the policy for one call, within what the run can
 * actually do).
 *
 * Wrap a privileged call whose `from` is an account rocketh cannot sign for (a Safe
 * multisig, a hardware wallet left unplugged, an air-gapped or governance key) and
 * instead of halting the run you get back the exact transaction to execute
 * out-of-band. Execute it on your Safe, then re-run the idempotent script: the
 * on-chain state check sees the change and skips the completed step.
 *
 * ```typescript
 * import {catchUnknownSigner} from '@rocketh/unknown-signer';
 * import {execute} from '@rocketh/read-execute';
 *
 * const deferred = await catchUnknownSigner(env)(() =>
 *   execute(env)(proxy, {account: 'safeOwner', functionName: 'upgradeTo', args: [newImpl.address]}),
 * );
 * if (deferred) {
 *   // {from, to, value, data} — execute this on the Safe, then re-run.
 * }
 * ```
 *
 * ONE WRAPPER CAPTURES ONE TRANSACTION. The error unwinds the wrapped action, so the
 * FIRST unsignable transaction inside it is the one you get back and everything after
 * it in that action is skipped. Deferring several steps means one
 * `catchUnknownSigner` per step.
 *
 * NOTHING IS PERSISTED. There is no unsigned-transactions file and no other side
 * effect, exactly like v1: idempotency comes from on-chain state alone.
 *
 * SCOPE OF THE POLICY FRAME (ADR 0006). The frame this wrapper pushes forces `throw`
 * over `ask` (the interactive policy), NEVER over impersonation. An account the node
 * can sign for — including one `autoImpersonate` took on — is signable, full stop, and
 * still BROADCASTS inside the wrapper. That is what keeps a mixed run working, and it
 * is why testing the throw path on a fork is done with
 * `autoImpersonate: false` for the run.
 *
 * The frame stack is dynamic scope, which suits how rocketh runs deploy scripts
 * (sequentially, one await at a time). Running `Promise.all` of two actions inside one
 * wrapper leaks the frame to the concurrent action, which under an ambient `'ask'`
 * policy means that concurrent action throws where it would have prompted. Recorded as
 * a known limitation in ADR 0006.
 *
 * DECISION — the per-call override is a WRAPPER (`withUnknownSignerPolicy`) in this
 * package, not an option on `deploy` / `execute` / `tx`. It reuses the frame stack the
 * seam already reads, so precedence stays ONE rule (innermost frame, else the run's
 * `onUnknownSigner`) and no extension package's options bag has to grow a policy field
 * that each would then thread to the choke point separately. The alternative, an
 * `onUnknownSigner` option on every call site, was rejected on that duplication: it
 * would put the same decision in four packages and make "which one wins" a second
 * precedence rule. The cost of this shape is that the override is written around the
 * call rather than inside it, and that it lives in the package a user installs for
 * `catchUnknownSigner`. Frames nest LIFO, so an override written INSIDE a
 * `catchUnknownSigner` wins over the wrapper's own frame: the deferral guarantee is
 * about the AMBIENT policy, not about an override the same script deliberately asked
 * for. See the `## Decisions` block of
 * `work/tasks/done/per-call-ask-override-and-deferral-precedence.md`.
 */

import {UnknownSignerError} from '@rocketh/core';
import type {UnknownSignerErrorData} from '@rocketh/core';
import {postfixBigIntReplacer} from '@rocketh/core/json';
import type {Environment, UnknownSignerPolicy} from '@rocketh/core/types';

/**
 * What a caught unknown signer gives you back: the transaction to execute
 * out-of-band. The shape is hardhat-deploy v1's, so a migrated script that reads,
 * compares or forwards this object needs no change — every key is PRESENT even when
 * its value is `undefined` (v1 returned a destructure), and `value` is a string.
 *
 * `contract` is deliberately absent: it exists only to enrich the printed message.
 */
export type CaughtUnknownSignerTransaction = {
	from: string;
	to?: string;
	value?: string;
	data?: string;
};

export type CatchUnknownSignerOptions = {
	/** Print the transaction to execute. Defaults to `true`, as in v1. */
	log?: boolean;
};

/**
 * The action to run.
 *
 * DELIBERATE DIVERGENCE FROM v1, and the only one: v1 accepted
 * `Promise | (() => Promise)`; here it is a THUNK only. A promise argument has
 * already started executing before this wrapper is called, so there is no moment at
 * which to push the policy frame, and accepting it would produce a wrapper that
 * silently does not do its job. Migrating a v1 script is therefore the import plus
 * one mechanical change: `catchUnknownSigner(execute(...))` becomes
 * `catchUnknownSigner(() => execute(...))`.
 */
export type UnknownSignerAction<T> = () => Promise<T> | T;

export type CatchUnknownSignerFunction = <T>(
	action: UnknownSignerAction<T>,
	options?: CatchUnknownSignerOptions,
) => Promise<CaughtUnknownSignerTransaction | null>;

const SEPARATOR = '---------------------------------------------------------------------------------------';

/**
 * v1 returned `value` as a string; `UnknownSignerErrorData.value` is `bigint | string`
 * because the seam carries whatever the transaction held. Stringify a bigint (decimal,
 * matching how `UnknownSignerError.message` renders it) and pass a string through.
 */
function stringifyValue(value: bigint | string | undefined): string | undefined {
	if (value === undefined) return undefined;
	return typeof value === 'bigint' ? value.toString() : value;
}

/**
 * Render one `contract.args` entry. `postfixBigIntReplacer` is RECURSIVE, unlike a
 * top-level `typeof === 'bigint'` check: a `uint256[]` or a tuple argument (a
 * diamondCut, a batch call) nests its bigints and plain `JSON.stringify` throws on
 * those. Printing the deferred transaction must never be able to throw — an exception
 * here would replace the very information the user needs. Strings are printed bare,
 * as v1 did, rather than JSON-quoted.
 */
function stringifyArg(arg: unknown): string {
	if (typeof arg === 'string') return arg;
	if (typeof arg === 'bigint') return arg.toString();
	try {
		return JSON.stringify(arg, postfixBigIntReplacer) ?? String(arg);
	} catch {
		return String(arg);
	}
}

/**
 * The v1-style block a user reads before opening their Safe. Kept separate from
 * `UnknownSignerError.message` (which serves the UNWRAPPED, halt-the-run path) because
 * this one is v1's layout: the method and each argument on their own line.
 */
function formatDeferredTransaction(data: UnknownSignerErrorData): string {
	const lines: string[] = [
		SEPARATOR,
		`no signer for ${data.from}`,
		'Please execute the following transaction, then re-run this script:',
		SEPARATOR,
		`from: ${data.from}`,
	];
	if (data.to !== undefined) {
		// `contract.name` is an optional reverse-lookup, so fall back to the raw address.
		lines.push(data.contract?.name ? `to: ${data.to} (${data.contract.name})` : `to: ${data.to}`);
	}
	if (data.contract) {
		lines.push(`method: ${data.contract.method}`);
		lines.push('args:');
		for (const arg of data.contract.args) {
			lines.push(`  - ${stringifyArg(arg)}`);
		}
	}
	const value = stringifyValue(data.value);
	if (value !== undefined) lines.push(`value: ${value}`);
	if (data.data !== undefined) lines.push(`data: ${data.data}`);
	lines.push(SEPARATOR);
	return lines.join('\n');
}

/**
 * Identify the error we are here to catch. `instanceof` first, then the stable `name`
 * so a cross-realm error (a duplicated `@rocketh/core` in the dependency tree, a
 * worker) is still caught rather than rethrown at a migrated v1 script. `data` must be
 * present too: an unrelated error merely NAMED like ours carries none, and returning
 * `{from: undefined}` from it would be worse than rethrowing.
 */
function isUnknownSignerError(err: unknown): err is {data: UnknownSignerErrorData} {
	if (err instanceof UnknownSignerError) return true;
	if (typeof err !== 'object' || err === null) return false;
	const candidate = err as {name?: unknown; data?: unknown};
	if (candidate.name !== 'UnknownSignerError') return false;
	return typeof candidate.data === 'object' && candidate.data !== null && 'from' in (candidate.data as object);
}

/**
 * The thunk guard, shared by both wrappers because they diverge from v1 for the same
 * reason. `callShape` is the corrected call the message shows, so a caller is told how
 * to fix the function they actually used rather than a sibling of it.
 */
function assertIsThunk(action: unknown, wrapperName: string, callShape: string): asserts action is () => unknown {
	if (typeof action === 'function') return;
	const isThenable =
		typeof action === 'object' && action !== null && typeof (action as {then?: unknown}).then === 'function';
	throw new Error(
		isThenable
			? `@rocketh/unknown-signer: ${wrapperName} takes a FUNCTION, not a promise. The promise you passed has ` +
					`already started running, so there is no moment left at which to establish the unknown-signer policy for it. ` +
					`Wrap the call in an arrow function: ${callShape}.`
			: `@rocketh/unknown-signer: ${wrapperName} takes a FUNCTION returning a promise, but received ` +
					`${typeof action}. Wrap the call in an arrow function: ${callShape}.`,
	);
}

/**
 * Run `action` with `policy` in force.
 *
 * The SINGLE scoping site of this package, so the two public wrappers cannot drift into
 * different scoping rules. Establishing and retiring the scope belong to the environment
 * (`runUnderUnknownSignerPolicy`), which is what makes it impossible for this package to
 * strand a frame over the rest of the run when an action throws, and the deferral itself
 * always throws.
 *
 * The one thing this adds is accepting a SYNCHRONOUS action, since `catchUnknownSigner`
 * accepts any thunk and a user's `() => execute(...)` need not be declared `async`.
 */
async function runUnderPolicyFrame<T>(
	env: Environment,
	policy: UnknownSignerPolicy,
	action: () => Promise<T> | T,
): Promise<T> {
	return env.runUnderUnknownSignerPolicy({policy}, async () => action());
}

export type WithUnknownSignerPolicyFunction = <T>(
	policy: UnknownSignerPolicy,
	action: UnknownSignerAction<T>,
) => Promise<T>;

/**
 * Choose the unknown-signer policy for ONE action, overriding the run's own
 * (`onUnknownSigner`, itself resolved as run parameter > chain config > `'auto'`).
 *
 * ```typescript
 * import {withUnknownSignerPolicy} from '@rocketh/unknown-signer';
 *
 * // on a fork whose run-level policy is 'throw': rehearse the interactive flow, once
 * const receipt = await withUnknownSignerPolicy(env)('ask', () =>
 *   execute(env)(proxy, {account: 'safeOwner', functionName: 'upgradeTo', args: [next.address]}),
 * );
 * ```
 *
 * It is the SAME mechanism `catchUnknownSigner` uses — a policy frame pushed on the
 * environment for the duration of the action — so the precedence is one rule rather
 * than two: the innermost frame wins, and with no frame the run's policy applies.
 * Whatever the action returns is handed back, and whatever it throws propagates (a
 * deferral under `'throw'` therefore throws `UnknownSignerError`, catchable by
 * wrapping this in `catchUnknownSigner`).
 *
 * CAPABILITY IS A CEILING, NOT A DEFAULT (ADR 0007). Asking for `'ask'` here can only
 * choose among what the run can already do: where the run cannot ask a human for text
 * (`env.canPromptForText()` is false — CI, a non-TTY shell, the browser) it degrades
 * to `'throw'` and nobody is prompted. A script that hardcodes the override therefore
 * still runs, un-hangable, in CI.
 *
 * WHAT IT DOES NOT DO: it never turns a SIGNABLE account into a throw, and never
 * defeats impersonation. The policy is read only inside the seam's `unsignable`
 * branch, so a `local` / `node` / `impersonated` account broadcasts identically inside
 * this scope (ADR 0006).
 *
 * The action is a THUNK, for the same reason `catchUnknownSigner`'s is: a promise has
 * already started before the frame could be pushed, so accepting one would silently
 * not apply the override.
 */
export function withUnknownSignerPolicy(env: Environment): WithUnknownSignerPolicyFunction {
	return async <T>(policy: UnknownSignerPolicy, action: UnknownSignerAction<T>): Promise<T> => {
		// Guard BEFORE the frame is pushed, so a rejected call shape cannot leak a frame.
		assertIsThunk(action, 'withUnknownSignerPolicy', "withUnknownSignerPolicy(env)('ask', () => execute(...))");
		return runUnderPolicyFrame(env, policy, action);
	};
}

/**
 * Run `action`, catch an `UnknownSignerError`, print the transaction to execute
 * out-of-band and return its description. Returns `null` when the action succeeded.
 * Any other error is rethrown unchanged.
 *
 * DECISION — the print goes through `env.showMessage`, not `console.log` as v1 did.
 * `showMessage` is rocketh's user-message channel (the same one the environment uses
 * to announce a deployed address), so the block respects the run's `--log-level` and
 * stays capturable in tests, and this package needs no `named-logs` dependency of its
 * own nor an entry in `@rocketh/node`'s `packagesWithLogsEnabled`. It is user-visible:
 * a run with logging turned down below `log` level will not show the block, whereas v1
 * always printed. `options.log === false` remains the explicit way to suppress it.
 */
export function catchUnknownSigner(env: Environment): CatchUnknownSignerFunction {
	return async <T>(
		action: UnknownSignerAction<T>,
		options?: CatchUnknownSignerOptions,
	): Promise<CaughtUnknownSignerTransaction | null> => {
		// Guard BEFORE the frame is pushed, so a rejected call shape cannot leak a frame.
		assertIsThunk(action, 'catchUnknownSigner', 'catchUnknownSigner(env)(() => execute(...))');

		const log = options?.log ?? true;

		try {
			// The frame is what makes the guarantee below hold: the wrapped action takes the
			//  throw path whatever the run's ambient policy is, so it never pops a prompt at a
			//  user who already said they would execute the transaction themselves.
			await runUnderPolicyFrame(env, 'throw', action);
		} catch (err) {
			if (!isUnknownSignerError(err)) {
				throw err;
			}
			const {from, to, value, data} = err.data;
			if (log) {
				env.showMessage(formatDeferredTransaction(err.data));
			}
			// Exactly v1's return: the four keys, always present, `value` stringified, and
			//  no `contract` (which exists only to enrich the message above).
			return {from, to, value: stringifyValue(value), data};
		}
		return null;
	};
}
