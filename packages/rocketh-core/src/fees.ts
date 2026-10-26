import type {ChainTransactionType} from './types.js';

/**
 * The fee options a caller can put on a transaction rocketh builds, as viem spells them.
 *
 * `type` is `unknown` because the callers' argument types (viem's) accept more values than rocketh
 * sends; an unsupported one is refused here rather than narrowed away by the type.
 */
export type TransactionFeeOptions = {
	type?: unknown;
	gasPrice?: bigint;
	maxFeePerGas?: bigint;
	maxPriorityFeePerGas?: bigint;
	accessList?: unknown;
};

/**
 * The type and fee fields of a transaction, ready for the wire. Unset fees are left to whoever
 * signs: the node for a `remote` or `wallet` account, rocketh's local-signing preparation for a
 * `signerOnly` one.
 *
 * The EIP-1559 arm carries both fee keys even when they are `undefined`, because that is the shape
 * rocketh has always sent and a chain left at the default must keep receiving exactly that.
 */
export type TransactionFees =
	| {type: '0x0'; gasPrice?: `0x${string}`}
	| {
			type: '0x2';
			maxFeePerGas: `0x${string}` | undefined;
			maxPriorityFeePerGas: `0x${string}` | undefined;
	  };

function toQuantity(value: bigint): `0x${string}` {
	return `0x${value.toString(16)}`;
}

/**
 * Decide the type and fee fields of a transaction rocketh builds, from the call's options, the
 * run-level fee defaults and the chain's `transactionType`, or throw naming the conflict.
 *
 * Precedence, highest first:
 *
 * 1. The call decides when it says anything: `gasPrice` or `type: 'legacy'` makes a legacy
 *    (type 0) transaction, an EIP-1559 fee field or `type: 'eip1559'` an EIP-1559 (type 2) one.
 *    A call stating ANY of `type`, `gasPrice`, `maxFeePerGas` or `maxPriorityFeePerGas` decides
 *    its WHOLE fee set: none of the run-level values is merged into it.
 * 2. Otherwise the run-level values (`runFees`, from `ExecutionParams` / `--gas-price`,
 *    `--max-fee-per-gas`, `--max-priority-fee-per-gas`) apply exactly as if the call had passed
 *    them: a run-level `gasPrice` makes a legacy transaction on any chain, a run-level EIP-1559
 *    value an EIP-1559 one even on a chain declared legacy.
 * 3. Only a call that says nothing, in a run that set nothing, takes the chain's default, and an
 *    absent default is `'eip1559'`.
 *
 * The run-level values are validated once, at startup, by `resolveExecutionParams` in `rocketh`
 * (a run-level `gasPrice` with an EIP-1559 value is refused there), so they never meet a
 * contradiction here other than an `accessList` on a call that the run-level `gasPrice` makes
 * legacy, which is refused like the same `accessList` next to a per-call `gasPrice`.
 *
 * Contradictions are REFUSED, never resolved one way or the other: `gasPrice` with an EIP-1559 fee
 * field or with `type: 'eip1559'`, an EIP-1559 fee field with `type: 'legacy'`, and an
 * `accessList` on a legacy transaction, which cannot carry one. Any `type` other than `'eip1559'`
 * and `'legacy'` is refused too: rocketh sends no other kind.
 *
 * `label` prefixes every message so it names the call, e.g. `deploy "Registry"`.
 *
 * Pure, so a caller can run it before any early return and get an answer that does not depend on
 * chain state.
 */
export function resolveTransactionFees(
	label: string,
	callOptions: TransactionFeeOptions,
	chainTransactionType: ChainTransactionType | undefined,
	runFees?: Pick<TransactionFeeOptions, 'gasPrice' | 'maxFeePerGas' | 'maxPriorityFeePerGas'>,
): TransactionFees {
	const callStatesFees =
		callOptions.type !== undefined ||
		callOptions.gasPrice !== undefined ||
		callOptions.maxFeePerGas !== undefined ||
		callOptions.maxPriorityFeePerGas !== undefined;
	const runGasPrice = callStatesFees ? undefined : runFees?.gasPrice;
	const options: TransactionFeeOptions = callStatesFees
		? callOptions
		: {
				accessList: callOptions.accessList,
				gasPrice: runFees?.gasPrice,
				maxFeePerGas: runFees?.maxFeePerGas,
				maxPriorityFeePerGas: runFees?.maxPriorityFeePerGas,
			};
	const {type, gasPrice, maxFeePerGas, maxPriorityFeePerGas, accessList} = options;

	if (type !== undefined && type !== 'eip1559' && type !== 'legacy') {
		throw new Error(
			`${label}: "type: ${String(type)}" is not supported: rocketh sends an EIP-1559 (type 2) or a legacy (type 0) transaction. Use \`type: 'eip1559'\` or \`type: 'legacy'\`, or remove \`type\`.`,
		);
	}

	const eip1559Fields = [
		...(maxFeePerGas !== undefined ? ['"maxFeePerGas"'] : []),
		...(maxPriorityFeePerGas !== undefined ? ['"maxPriorityFeePerGas"'] : []),
	];

	if (gasPrice !== undefined && eip1559Fields.length > 0) {
		throw new Error(
			`${label}: "gasPrice" cannot be combined with ${eip1559Fields.join(' and ')}: "gasPrice" prices a legacy (type 0) transaction and ${eip1559Fields.join(' and ')} an EIP-1559 (type 2) one. Pass one or the other.`,
		);
	}
	if (gasPrice !== undefined && type === 'eip1559') {
		throw new Error(
			`${label}: "gasPrice" cannot be combined with "type: eip1559": an EIP-1559 (type 2) transaction is priced with "maxFeePerGas" and "maxPriorityFeePerGas". Remove one of them.`,
		);
	}
	if (eip1559Fields.length > 0 && type === 'legacy') {
		throw new Error(
			`${label}: ${eip1559Fields.join(' and ')} cannot be combined with "type: legacy": a legacy (type 0) transaction is priced with "gasPrice". Remove one of them.`,
		);
	}

	const legacy =
		type === 'legacy' ||
		gasPrice !== undefined ||
		(type === undefined && eip1559Fields.length === 0 && chainTransactionType === 'legacy');

	if (legacy) {
		if (accessList !== undefined) {
			throw new Error(
				runGasPrice !== undefined
					? `${label}: "accessList" is not supported on a legacy (type 0) transaction, which cannot carry one, and the run-level "gasPrice" makes this call legacy. Remove it, or give this call \`type: 'eip1559'\` (or its own EIP-1559 fees) so the run-level values do not apply to it.`
					: `${label}: "accessList" is not supported on a legacy (type 0) transaction, which cannot carry one. Remove it, or send an EIP-1559 transaction.`,
			);
		}
		return gasPrice !== undefined ? {type: '0x0', gasPrice: toQuantity(gasPrice)} : {type: '0x0'};
	}

	return {
		type: '0x2',
		maxFeePerGas: maxFeePerGas !== undefined ? toQuantity(maxFeePerGas) : undefined,
		maxPriorityFeePerGas: maxPriorityFeePerGas !== undefined ? toQuantity(maxPriorityFeePerGas) : undefined,
	};
}
