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

import type {Abi, AbiParameter, AbiParameterToPrimitiveType} from 'abitype';
import type {Environment, MinimalDeployment} from '@rocketh/core/types';
import type {EIP1193Account} from 'eip-1193';
import type {ContractFunctionArgs, ContractFunctionName, DecodeFunctionResultReturnType} from 'viem';
import {getAbiItem} from 'viem';
import {read} from './read.js';
import {returnValueEquals, valuesEqualForAbiType} from './abi-comparison.js';

/** The OUTPUTS a function declares in the ABI it is read against. */
type FunctionOutputs<TAbi extends Abi, TFunctionName> =
	Extract<TAbi[number], {type: 'function'; name: TFunctionName}> extends {
		outputs: infer TOutputs extends readonly AbiParameter[];
	}
		? TOutputs
		: readonly AbiParameter[];

/** The POSITIONS of those outputs, as number literals. */
type OutputPositions<TOutputs extends readonly AbiParameter[]> =
	Extract<keyof TOutputs, `${number}`> extends infer TKey
		? TKey extends `${infer TPosition extends number}`
			? TPosition
			: never
		: never;

/** The NAMES of those outputs, skipping the unnamed ones, which can only be selected by position. */
type OutputNames<TOutputs extends readonly AbiParameter[]> = {
	[TKey in keyof TOutputs]: TOutputs[TKey] extends {name: infer TName extends string}
		? TName extends ''
			? never
			: TName
		: never;
}[number];

/**
 * What a guard may name in `output`: an output of the read function, by name or by position.
 *
 * The boundary is deliberate. Reaching INSIDE a struct is NOT part of selection: that is
 * what `satisfied` is for, and keeping the selector to the declared outputs is what keeps
 * it typed against the ABI instead of becoming a path language.
 */
export type GuardOutputSelector<TAbi extends Abi, TFunctionName> =
	OutputPositions<FunctionOutputs<TAbi, TFunctionName>> | OutputNames<FunctionOutputs<TAbi, TFunctionName>>;

/** The value a given selector selects, typed from the ABI parameter it names. */
type SelectedOutputValue<TOutputs extends readonly AbiParameter[], TSelector> = {
	[TKey in keyof TOutputs]: TKey extends `${TSelector & number}`
		? AbiParameterToPrimitiveType<TOutputs[TKey], 'outputs'>
		: TOutputs[TKey] extends {name: TSelector}
			? AbiParameterToPrimitiveType<TOutputs[TKey], 'outputs'>
			: never;
}[number];

/** Any one of the declared outputs' values, which is what an evaluation's `selected` can hold. */
type AnyOutputValue<TOutputs extends readonly AbiParameter[]> = {
	[TKey in keyof TOutputs]: AbiParameterToPrimitiveType<TOutputs[TKey], 'outputs'>;
}[number];

/**
 * The verdict, stated ONCE: as a predicate, or as the value the read must equal.
 *
 * `satisfied` is the primary form rather than an escape hatch, because real topologies
 * include conditions no equality can state (a NEGATION such as "needed unless this
 * operation reached its terminal state"). `equals` is sugar over it for the commonest
 * guard there is, "the value on chain is already the value I want", and it is not merely
 * shorter: it compares the value the way the ABI says the value MEANS, which a predicate
 * written with `===` does not.
 *
 * The value reaches `satisfied` RAW, so a predicate comparing addresses with `===` will be
 * wrong the moment one side is checksummed and the other is not (ADR 0013).
 */
type GuardVerdict<TValue> =
	{satisfied: (value: TValue) => boolean; equals?: never} | {equals: TValue; satisfied?: never};

/** What the guard READS: the same target shape `read` accepts, plus the function and its args. */
type CallGuardRead<
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
	TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName>,
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
};

/** One guard variant per selector, so the verdict is typed against the SELECTED value. */
type SelectingVariants<TOutputs extends readonly AbiParameter[], TSelector> = TSelector extends unknown
	? {
			/**
			 * Select ONE of the read function's declared outputs, by name or by position; the
			 * verdict then applies to the selected value.
			 *
			 * viem decides the shape of the decoded value before the guard sees it: a function
			 * with ONE output decodes to that value unwrapped, several decode to an array, none
			 * decodes to `undefined`. Selection is therefore MEANINGFUL exactly when there are
			 * several; naming the only output of a single-output function is accepted and
			 * selects that same value.
			 */
			output: TSelector;
		} & GuardVerdict<SelectedOutputValue<TOutputs, TSelector>>
	: never;

/** Distribute the read half across every verdict variant, so the result is a real union. */
type GuardVariants<TRead, TVerdicts> = TVerdicts extends unknown ? TRead & TVerdicts : never;

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
> = GuardVariants<
	CallGuardRead<TAbi, TFunctionName, TArgs>,
	| ({output?: undefined} & GuardVerdict<DecodeFunctionResultReturnType<TAbi, TFunctionName>>)
	| SelectingVariants<FunctionOutputs<TAbi, TFunctionName>, GuardOutputSelector<TAbi, TFunctionName>>
>;

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
	/** The WHOLE decoded return value, whether or not one output of it was selected. */
	value: DecodeFunctionResultReturnType<TAbi, TFunctionName>;
	/** The output that was selected, if one was. Absent otherwise, never `undefined`. */
	output?: GuardOutputSelector<TAbi, TFunctionName>;
	/** The selected value, i.e. what the verdict actually judged. Absent when nothing was selected. */
	selected?: AnyOutputValue<FunctionOutputs<TAbi, TFunctionName>>;
	/** What it was compared against. Absent when the verdict was a `satisfied` predicate. */
	expected?: DecodeFunctionResultReturnType<TAbi, TFunctionName> | AnyOutputValue<FunctionOutputs<TAbi, TFunctionName>>;
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
 *
 * The ABI is what makes `equals` possible at all: the declared OUTPUTS of the function
 * being read supply both the selection (which output `output` names) and the comparison
 * rule (whether casing matters for the value at that position). See `./abi-comparison.ts`.
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

		// The SAME ABI item `decodeFunctionResult` decoded against, resolved the same way so an
		// overloaded getter cannot select one item for decoding and another for comparison.
		const abiItem = getAbiItem({
			abi: target.abi as Abi,
			name: guard.functionName as string,
			args: guard.args as readonly unknown[] | undefined,
		} as never) as {type?: string; outputs?: readonly AbiParameter[]} | undefined;
		const outputs = abiItem?.type === 'function' ? (abiItem.outputs ?? []) : [];

		const {satisfied, ...judged} = judge(guard, outputs, value);

		return {
			kind: 'call',
			target: target.address,
			functionName: guard.functionName,
			args: (guard.args ?? []) as readonly unknown[],
			value,
			...judged,
			satisfied,
		} as GuardEvaluation<TAbi, TFunctionName>;
	};
}

/** The selection-and-verdict half of an evaluation, kept apart from the read half. */
type Judgement = {
	output?: string | number;
	selected?: unknown;
	expected?: unknown;
	satisfied: boolean;
};

/**
 * Apply a guard's selection and verdict to the value that was read.
 *
 * `output`, `selected` and `expected` are only PRESENT when they mean something, so an
 * evaluation never claims a selection that was not made or an expected value that was
 * never stated: a user reading a skip sees exactly the three facts that produced it.
 */
function judge(
	guard: {
		functionName: unknown;
		output?: string | number;
		equals?: unknown;
		satisfied?: (value: never) => boolean;
	},
	outputs: readonly AbiParameter[],
	value: unknown,
): Judgement {
	const selection =
		guard.output === undefined ? undefined : selectOutput(guard.functionName, guard.output, outputs, value);
	const judged = selection ? selection.value : value;
	const selected = selection ? {output: guard.output, selected: selection.value} : {};

	if (typeof guard.satisfied === 'function') {
		return {...selected, satisfied: guard.satisfied(judged as never)};
	}

	if ('equals' in guard) {
		const expected = guard.equals;
		return {
			...selected,
			expected,
			satisfied: selection
				? valuesEqualForAbiType(selection.parameter, judged, expected)
				: returnValueEquals(outputs, value, expected),
		};
	}

	throw new Error(
		`the guard on "${String(guard.functionName)}" states no verdict: it declares neither "equals" nor "satisfied"`,
	);
}

/**
 * Pick one declared output out of a decoded return value.
 *
 * viem decides the shape before we get here: ONE declared output decodes to that value
 * UNWRAPPED, several decode to an array. So selecting the only output of a single-output
 * function is the identity rather than an index into something.
 *
 * The types already refuse a selector the ABI does not declare; this throw is what a
 * caller who defeated them gets, because a guard that cannot produce a verdict must fail
 * the run rather than be mistaken for "not satisfied".
 */
function selectOutput(
	functionName: unknown,
	selector: string | number,
	outputs: readonly AbiParameter[],
	value: unknown,
): {parameter: AbiParameter; value: unknown} {
	const position = typeof selector === 'number' ? selector : outputs.findIndex((output) => output.name === selector);
	const parameter = position < 0 ? undefined : outputs[position];
	if (!parameter) {
		const declared = outputs.map((output, index) => output.name || `#${index}`).join(', ') || 'none';
		throw new Error(
			`the guard on "${String(functionName)}" selects the output "${selector}", which that function does not declare (declared outputs: ${declared})`,
		);
	}
	return {parameter, value: outputs.length === 1 ? value : (value as readonly unknown[])[position]};
}
