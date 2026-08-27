/**
 * The `execute` state guard: a DECLARED read that answers "is this call still needed?".
 *
 * Two kinds, discriminated on `kind`: a {@link CallGuard} (an `eth_call` against an ABI)
 * and a {@link StorageGuard} (an `eth_getStorageAt` on a slot, for the topologies where
 * there is no getter to call at all).
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
import type {EIP1193Account, EIP1193DATA} from 'eip-1193';
import type {ContractFunctionArgs, ContractFunctionName, DecodeFunctionResultReturnType} from 'viem';
import {getAbiItem} from 'viem';
import {read} from './read.js';
import {returnValueEquals, valuesEqualForAbiType} from './abi-comparison.js';
import {decodeSlotWord, readSlot} from './slot.js';
import type {SlotInterpretation, SlotValue} from './slot.js';
import {GuardEvaluationError, describeGuard} from './errors.js';
import type {GuardEvaluationErrorData} from './errors.js';

export type {SlotInterpretation, SlotValue} from './slot.js';

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
 * `kind` was present from the first commit, before there was anything to discriminate
 * against, which is what let {@link StorageGuard} join as an ADDITIVE member rather than a
 * re-cut of the option.
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

/** What a STORAGE guard reads: a target and a slot on it, plus how to read the word. */
type StorageGuardRead<TAbi extends Abi, TInterpretation extends SlotInterpretation> = {
	kind: 'storage';

	/**
	 * The contract whose slot to READ. Defaults to the contract being executed, which for
	 * this kind is the rare case: you call the ProxyAdmin and read the PROXY, or call the
	 * registry and read the proxy behind it. Its ABI is unused here (a slot has none); it is
	 * the same target shape only so a deployment can be handed to either kind.
	 */
	on?: MinimalDeployment<TAbi>;

	/** The slot to read: a `bytes32`, usually a standardised constant such as EIP-1967's. */
	slot: EIP1193DATA;

	/**
	 * How to read the 32-byte word, from a CLOSED set. NOT optional and not a convenience:
	 * a slot carries no ABI, so without this there is neither a decoded value to judge nor a
	 * type for the comparison rule to key off, and both would have to be guessed.
	 */
	as: TInterpretation;
};

/**
 * A guard that reads a raw STORAGE SLOT.
 *
 * Required rather than convenient: an OZ transparent proxy exposes no getter for its
 * implementation, so the effect of the commonest privileged call there is (upgrade through
 * a ProxyAdmin, from an owner that is usually a Safe) is observable ONLY in the EIP-1967
 * implementation slot, and a call-only guard could not express it at all. The same shape
 * is reached from designs with no ProxyAdmin anywhere, such as Aave's
 * `PoolAddressesProvider`, whose own `getPool()` returns the same proxy before and after
 * an upgrade and therefore observes nothing
 * (`work/notes/findings/governance-upgrade-topologies-in-the-wild.md`).
 *
 * There is no `output` here, because a slot declares no outputs to select from.
 */
export type StorageGuard<
	TAbi extends Abi = Abi,
	TInterpretation extends SlotInterpretation = SlotInterpretation,
> = GuardVariants<StorageGuardRead<TAbi, TInterpretation>, GuardVerdict<SlotValue<TInterpretation>>>;

/**
 * The guard union, discriminated on `kind`: an `eth_call` against an ABI, or an
 * `eth_getStorageAt` on a slot.
 */
export type ExecuteGuard<
	TAbi extends Abi = Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'> = ContractFunctionName<TAbi, 'pure' | 'view'>,
	TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'pure' | 'view',
		TFunctionName
	>,
	TInterpretation extends SlotInterpretation = SlotInterpretation,
> = CallGuard<TAbi, TFunctionName, TArgs> | StorageGuard<TAbi, TInterpretation>;

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

/**
 * What a STORAGE guard's evaluation records.
 *
 * It carries the undecoded `word` AS WELL AS the decoded `value` on purpose: the word is
 * the evidence, and the value is the thing the author wrote in their script, so a reader
 * of a skip can check the decoding rather than having to trust it.
 */
export type StorageGuardEvaluation<TInterpretation extends SlotInterpretation = SlotInterpretation> = {
	kind: 'storage';
	/** The address actually read, after the default-to-the-executed-contract rule. */
	target: EIP1193Account;
	slot: EIP1193DATA;
	/**
	 * The word as it came off the chain, before interpretation, left-padded to a full 32
	 * bytes because nodes disagree about how to spell an empty slot.
	 */
	word: `0x${string}`;
	/** The interpretation that was declared, which decoded the word and keyed the comparison. */
	as: TInterpretation;
	/** The decoded value, i.e. what the verdict actually judged. */
	value: SlotValue<TInterpretation>;
	/** What it was compared against. Absent when the verdict was a `satisfied` predicate. */
	expected?: SlotValue<TInterpretation>;
	satisfied: boolean;
};

/** The evaluation union, one member per guard kind, discriminated on the same `kind`. */
export type GuardEvaluation<
	TAbi extends Abi = Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'> = ContractFunctionName<TAbi, 'pure' | 'view'>,
	TInterpretation extends SlotInterpretation = SlotInterpretation,
> = CallGuardEvaluation<TAbi, TFunctionName> | StorageGuardEvaluation<TInterpretation>;

/**
 * What `evaluateGuard(env)` returns: one call signature per guard KIND, so a caller gets
 * back the evaluation its own guard produces rather than the union of both.
 */
export type GuardEvaluator = {
	<TAbi extends Abi, TInterpretation extends SlotInterpretation>(
		guard: StorageGuard<TAbi, TInterpretation>,
		defaultTarget?: MinimalDeployment<TAbi>,
	): Promise<StorageGuardEvaluation<TInterpretation>>;
	<
		TAbi extends Abi,
		TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
		TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
			TAbi,
			'pure' | 'view',
			TFunctionName
		>,
	>(
		guard: CallGuard<TAbi, TFunctionName, TArgs>,
		defaultTarget?: MinimalDeployment<TAbi>,
	): Promise<CallGuardEvaluation<TAbi, TFunctionName>>;
};

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
 * A `call` guard's read goes THROUGH `read`, so it cannot drift from what a hand-written
 * read would do: same encoding, same decoding, same empty-return retry (a momentarily
 * unreadable known deployment is retried, and only the EXHAUSTED read is fatal). A
 * `storage` guard has no such sibling to stay in step with, so it owns its read
 * (`./slot.ts`).
 *
 * This function is the ONE place a guard failure is turned into a
 * {@link GuardEvaluationError}, and it never turns one into a verdict. The asymmetry is
 * deliberate: an error while evaluating is NOT evidence that the call is needed, so a
 * `catch` that answered "not satisfied" would hand the operator a privileged transaction
 * they may already have executed out of band, which is the double-execution loss the guard
 * exists to prevent (ADR 0012). Fail-loud costs a re-run and a fixed script; fail-open
 * costs a duplicated mint, transfer or nonce-bearing governance action. Having a single
 * seam is what keeps that true for `execute` and for a standalone collector alike: two
 * seams would be two chances for one of them to fall through.
 *
 * A declared TYPE is what makes `equals` possible at all, and each kind has its own source
 * for it: the function's declared OUTPUTS for a call (which also supply the selection
 * `output` names), and the interpretation the guard itself declared for a slot, since a
 * slot has no ABI. Both then compare through `./abi-comparison.ts`, so there is one rule
 * rather than two.
 */
export function evaluateGuard(env: Environment): GuardEvaluator {
	const evaluate = async (guard: ExecuteGuard, defaultTarget?: MinimalDeployment<Abi>): Promise<GuardEvaluation> => {
		try {
			// awaited INSIDE the try on purpose: returning the promise would put every asynchronous
			// failure (the revert, the exhausted retry, the refused `eth_getStorageAt`) outside this
			// catch, which is most of what can go wrong.
			return guard.kind === 'storage'
				? await evaluateStorageGuard(env, guard, defaultTarget)
				: await evaluateCallGuard(env, guard, defaultTarget);
		} catch (error) {
			// Already ours (a guard that states no target, no verdict, or selects an output the ABI
			// does not declare): it names the guard correctly, so re-wrapping would only say it twice.
			if (error instanceof GuardEvaluationError) {
				throw error;
			}
			// WRAPPED rather than rethrown, and wrapped rather than reworded: a bare
			// `AbiDecodingZeroDataError` or a node's "method not available" does not say which of a
			// script's guards asked, nor which contract it read, and those are the two facts needed
			// to fix the script. The underlying failure is kept whole on `cause` AND quoted in the
			// message, so nothing it said is lost.
			throw new GuardEvaluationError(
				guardErrorData(guard, defaultTarget),
				`could not be evaluated, so nothing was executed: ${error instanceof Error ? error.message : String(error)}`,
				error,
			);
		}
	};

	// One implementation, two call signatures: the generics of the two kinds have nothing in
	// common (one is keyed off an ABI and a function name, the other off a declared word
	// interpretation), and a single signature returning the evaluation UNION would force every
	// caller to discriminate on `kind` to reach a field their own guard already determined.
	return evaluate as GuardEvaluator;
}

/** The `call` kind: an `eth_call` through `read`, judged against the function's declared outputs. */
async function evaluateCallGuard(
	env: Environment,
	guard: CallGuard<Abi, ContractFunctionName<Abi, 'pure' | 'view'>>,
	defaultTarget?: MinimalDeployment<Abi>,
): Promise<CallGuardEvaluation<Abi, ContractFunctionName<Abi, 'pure' | 'view'>>> {
	const target = guard.on ?? defaultTarget;
	if (!target) {
		throw new GuardEvaluationError(
			{kind: 'call', functionName: String(guard.functionName)},
			'has no target: it names no "on" and no default target was given',
		);
	}
	const errorData: GuardEvaluationErrorData = {
		kind: 'call',
		target: target.address,
		functionName: String(guard.functionName),
	};

	const value = await read(env)(target, {
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

	const {satisfied, ...judged} = judge(guard, errorData, outputs, value);

	return {
		kind: 'call',
		target: target.address,
		functionName: guard.functionName,
		args: (guard.args ?? []) as readonly unknown[],
		value,
		...judged,
		satisfied,
	} as CallGuardEvaluation<Abi, ContractFunctionName<Abi, 'pure' | 'view'>>;
}

/**
 * The `storage` kind: an `eth_getStorageAt`, decoded under the DECLARED interpretation.
 *
 * The comparison goes through the very same module the call kind uses, handed the declared
 * interpretation as the ABI type it keys off. That is what makes an address read from a
 * slot fold case exactly as an address returned from a getter does, instead of this kind
 * growing a second comparison vocabulary of its own.
 */
async function evaluateStorageGuard(
	env: Environment,
	guard: StorageGuard,
	defaultTarget?: MinimalDeployment<Abi>,
): Promise<StorageGuardEvaluation> {
	const target = guard.on ?? defaultTarget;
	if (!target) {
		throw new GuardEvaluationError(
			{kind: 'storage', slot: guard.slot},
			'has no target: it names no "on" and no default target was given',
		);
	}
	const errorData: GuardEvaluationErrorData = {kind: 'storage', target: target.address, slot: guard.slot};

	const where = describeGuard(errorData);
	const word = await readSlot(env, target.address, guard.slot);
	const value = decodeSlotWord(guard.as, word, where);

	const slotRead = {
		kind: 'storage',
		target: target.address,
		slot: guard.slot,
		word,
		as: guard.as,
		value,
	} as const;

	if (typeof guard.satisfied === 'function') {
		return {...slotRead, satisfied: guard.satisfied(value as never)};
	}

	if ('equals' in guard) {
		const expected = guard.equals;
		return {
			...slotRead,
			expected,
			// `{type: guard.as}` IS the ABI parameter here: the interpretation was declared with
			// ABI type names precisely so it can stand in for the one an ABI would have supplied.
			satisfied: valuesEqualForAbiType({type: guard.as} as AbiParameter, value, expected),
		};
	}

	throw new GuardEvaluationError(errorData, 'states no verdict: it declares neither "equals" nor "satisfied"');
}

/** What the {@link GuardEvaluationError} seam knows about a guard BEFORE evaluating it. */
function guardErrorData(guard: ExecuteGuard, defaultTarget?: MinimalDeployment<Abi>): GuardEvaluationErrorData {
	const target = (guard.on ?? defaultTarget)?.address;
	const whatItReads = guard.kind === 'storage' ? {slot: guard.slot} : {functionName: String(guard.functionName)};
	return {kind: guard.kind, ...(target ? {target} : {}), ...whatItReads};
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
	errorData: GuardEvaluationErrorData,
	outputs: readonly AbiParameter[],
	value: unknown,
): Judgement {
	const selection = guard.output === undefined ? undefined : selectOutput(errorData, guard.output, outputs, value);
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

	throw new GuardEvaluationError(errorData, 'states no verdict: it declares neither "equals" nor "satisfied"');
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
	errorData: GuardEvaluationErrorData,
	selector: string | number,
	outputs: readonly AbiParameter[],
	value: unknown,
): {parameter: AbiParameter; value: unknown} {
	const position = typeof selector === 'number' ? selector : outputs.findIndex((output) => output.name === selector);
	const parameter = position < 0 ? undefined : outputs[position];
	if (!parameter) {
		const declared = outputs.map((output, index) => output.name || `#${index}`).join(', ') || 'none';
		throw new GuardEvaluationError(
			errorData,
			`selects the output "${selector}", which that function does not declare (declared outputs: ${declared})`,
		);
	}
	return {parameter, value: outputs.length === 1 ? value : (value as readonly unknown[])[position]};
}
