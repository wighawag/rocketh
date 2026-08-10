/**
 * `@rocketh/unknown-signer` — the hardhat-deploy v1 `catchUnknownSigner` helper.
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
 */

import {UnknownSignerError} from '@rocketh/core';
import type {UnknownSignerErrorData} from '@rocketh/core';
import {postfixBigIntReplacer} from '@rocketh/core/json';
import type {Environment} from '@rocketh/core/types';

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

function assertIsThunk(action: unknown): asserts action is () => unknown {
	if (typeof action === 'function') return;
	const isThenable =
		typeof action === 'object' && action !== null && typeof (action as {then?: unknown}).then === 'function';
	throw new Error(
		isThenable
			? `@rocketh/unknown-signer: catchUnknownSigner takes a FUNCTION, not a promise. The promise you passed has ` +
					`already started running, so there is no moment left at which to establish the unknown-signer policy for it. ` +
					`Wrap the call in an arrow function: catchUnknownSigner(env)(() => execute(...)).`
			: `@rocketh/unknown-signer: catchUnknownSigner takes a FUNCTION returning a promise, but received ` +
					`${typeof action}. Wrap the call in an arrow function: catchUnknownSigner(env)(() => execute(...)).`,
	);
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
		assertIsThunk(action);

		const log = options?.log ?? true;

		env.pushUnknownSignerPolicy({policy: 'throw'});
		try {
			await action();
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
		} finally {
			env.popUnknownSignerPolicy();
		}
		return null;
	};
}
