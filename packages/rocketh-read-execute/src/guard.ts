/**
 * The `execute` state guard: a DECLARED read that answers "is this call still needed?".
 *
 * `deploy` compares bytecode and `deployViaProxy` compares the current implementation
 * address; `execute` compared nothing and ran whatever it was handed. A guard closes that
 * gap by DECLARING what to read (a target, a function, its arguments) and how to judge the
 * decoded value, leaving rocketh to perform the read. It is deliberately NOT an opaque
 * predicate over the chain (`guard: async () => boolean`), because a closure teaches
 * rocketh nothing: there would be nothing to report when a step is skipped, nothing for a
 * later collector to evaluate without running it, and nothing for state-change provenance
 * to consume. See `docs/adr/0013-the-execute-guard-is-a-declared-read.md`.
 *
 * Nothing here is persisted. A guard's verdict is derived from the chain on every run,
 * which is what lets a deferred (unsignable) call converge on a re-run even though rocketh
 * OBSERVED nothing when it deferred (`docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md`).
 */

import type {Abi} from 'abitype';
import type {Environment, MinimalDeployment} from '@rocketh/core/types';
import type {EIP1193Account} from 'eip-1193';
import type {ContractFunctionArgs, ContractFunctionName, DecodeFunctionResultReturnType} from 'viem';
import {read} from './read.js';

/**
 * A guard that reads by CALLING a view function through the ABI of its target.
 *
 * `kind` is present from the first commit even though `call` is the only member today,
 * so the storage kind (a raw `eth_getStorageAt` on a slot, which the commonest proxy
 * topology requires because a transparent proxy exposes no getter) is an ADDITIVE member
 * rather than a re-cut of the option.
 *
 * `TAbi` is the ABI of the contract being READ, which is usually NOT the contract being
 * executed: you call `upgrade` on a ProxyAdmin and observe the implementation on the
 * proxy, or `setPoolImpl` on a registry and observe the proxy behind it.
 */
export type CallGuard<
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
	TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'pure' | 'view',
		TFunctionName
	>,
> = {
	kind: 'call';

	/**
	 * The contract to READ. Defaults to the contract being executed, which is the minority
	 * case: the effect of a privileged call is usually observable somewhere else.
	 */
	on?: MinimalDeployment<TAbi>;

	/** The view function to call, typed against the ABI of `on`. */
	functionName: TFunctionName;

	/** Its arguments, typed against the ABI of `on`. */
	args?: TArgs;

	/**
	 * The verdict, over the DECODED value: `true` means the call is no longer needed, so it
	 * is SKIPPED. It is the primary form rather than an escape hatch, because real
	 * topologies include conditions no equality can state (a NEGATION such as "needed unless
	 * this operation reached its terminal state", or a tuple where one component matters).
	 *
	 * The value arrives RAW, so a predicate comparing addresses with `===` will be wrong the
	 * moment one side is checksummed and the other is not.
	 */
	satisfied: (value: DecodeFunctionResultReturnType<TAbi, TFunctionName>) => boolean;
};

/**
 * The guard union, discriminated on `kind`. One member today; a `storage` kind joins it.
 */
export type ExecuteGuard<
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
	TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'pure' | 'view',
		TFunctionName
	>,
> = CallGuard<TAbi, TFunctionName, TArgs>;

/**
 * What a guard EVALUATION records: what was read, from where, and the verdict.
 *
 * It is a value rather than a boolean on purpose. A skipped step has no transaction and no
 * receipt to point at, so this record is the only evidence of why nothing happened, and it
 * is what a later collector (which computes the pending set WITHOUT executing anything) and
 * state-change provenance consume.
 */
export type CallGuardEvaluation<TAbi extends Abi, TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>> = {
	kind: 'call';
	/** The address actually read, after the default-to-the-executed-contract rule. */
	target: EIP1193Account;
	functionName: TFunctionName;
	args: readonly unknown[];
	/** The decoded return value, exactly as `satisfied` received it. */
	value: DecodeFunctionResultReturnType<TAbi, TFunctionName>;
	satisfied: boolean;
};

export type GuardEvaluation<
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
> = CallGuardEvaluation<TAbi, TFunctionName>;

/**
 * Evaluate a guard, on its own, without executing anything.
 *
 * Curried like every other entry on this package's root surface, because `withEnvironment`
 * calls each one as `value(env)` at setup.
 *
 * `defaultTarget` is what the guard reads when it names no `on` of its own; `execute`
 * passes the contract it is about to call. With neither, there is nothing to read and that
 * is an error rather than a guess.
 *
 * The read goes THROUGH `read`, so the guard cannot drift from what a hand-written read
 * would do: same encoding, same decoding, same empty-return retry. Nothing here catches:
 * a guard that cannot produce a verdict must fail the run rather than be mistaken for
 * "not satisfied".
 */
export function evaluateGuard(
	env: Environment,
): <
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
	TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'pure' | 'view',
		TFunctionName
	>,
>(
	guard: ExecuteGuard<TAbi, TFunctionName, TArgs>,
	defaultTarget?: MinimalDeployment<TAbi>,
) => Promise<GuardEvaluation<TAbi, TFunctionName>> {
	return async <
		TAbi extends Abi,
		TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
		TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
			TAbi,
			'pure' | 'view',
			TFunctionName
		>,
	>(
		guard: ExecuteGuard<TAbi, TFunctionName, TArgs>,
		defaultTarget?: MinimalDeployment<TAbi>,
	) => {
		const target = guard.on ?? defaultTarget;
		if (!target) {
			throw new Error(
				`the guard on "${String(guard.functionName)}" has no target: it names no "on" and no default target was given`,
			);
		}

		const value = await read(env)<TAbi, TFunctionName, TArgs>(target, {
			functionName: guard.functionName,
			args: guard.args,
		} as any);

		return {
			kind: 'call',
			target: target.address,
			functionName: guard.functionName,
			args: (guard.args ?? []) as readonly unknown[],
			value,
			satisfied: guard.satisfied(value),
		} satisfies GuardEvaluation<TAbi, TFunctionName>;
	};
}
