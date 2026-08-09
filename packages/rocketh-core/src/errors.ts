/**
 * UnknownSignerError — the single carrier for "the transaction a human or
 * multisig must execute out-of-band", surfaced when a privileged call targets
 * an account rocketh cannot sign for (for example a Safe that owns a proxy).
 *
 * Shape ported from hardhat-deploy v1's `errors.ts`, with one deliberate
 * divergence: `contract.name` is OPTIONAL here. `MinimalDeployment` carries no
 * name; downstream code resolves it opportunistically by reverse-lookup and it
 * is simply absent when the target address matches no known deployment (see
 * ADR 0006).
 */

import {postfixBigIntReplacer} from './json.js';

export type UnknownSignerContractCall = {
	/** Optional — resolved downstream by reverse-lookup; absent when unknown. */
	name?: string;
	method: string;
	args: readonly unknown[];
};

export type UnknownSignerErrorData = {
	/** The unsignable `from` account. */
	from: string;
	/** Omitted for contract deploys. */
	to?: string;
	/** Calldata or init code. */
	data?: string;
	value?: bigint | string;
	/** Populated only when the tx originated from an `execute` call. */
	contract?: UnknownSignerContractCall;
};

function formatValue(value: bigint | string | undefined): string | undefined {
	if (value === undefined) return undefined;
	return typeof value === 'bigint' ? value.toString() : value;
}

function buildMessage(data: UnknownSignerErrorData): string {
	const lines: string[] = [
		'Unknown signer for account ' + data.from,
		'  Execute the following transaction out-of-band, then re-run:',
	];
	if (data.contract) {
		const target = data.contract.name ?? data.to ?? '<unknown>';
		// `postfixBigIntReplacer` is RECURSIVE, which a top-level `typeof a === 'bigint'`
		//  check is not: a `uint256[]` or any tuple argument (a diamondCut, a batch call)
		//  nests its bigints, and plain `JSON.stringify` throws on those. Rendering the
		//  error must never be able to throw — an exception here would replace the very
		//  error the user needs with an opaque TypeError.
		const args = data.contract.args.map((a) => JSON.stringify(a, postfixBigIntReplacer)).join(', ');
		lines.push(`  contract: ${target}.${data.contract.method}(${args})`);
	}
	lines.push(`  from: ${data.from}`);
	if (data.to !== undefined) lines.push(`  to: ${data.to}`);
	const v = formatValue(data.value);
	if (v !== undefined) lines.push(`  value: ${v}`);
	if (data.data !== undefined) lines.push(`  data: ${data.data}`);
	return lines.join('\n');
}

export class UnknownSignerError extends Error {
	/** Stable name so cross-realm identity checks (`err.name === '...'`) work. */
	override readonly name = 'UnknownSignerError';
	readonly data: UnknownSignerErrorData;

	constructor(data: UnknownSignerErrorData, message?: string) {
		super(message ?? buildMessage(data));
		this.data = data;
		// Preserve prototype chain across transpilation targets.
		Object.setPrototypeOf(this, UnknownSignerError.prototype);
	}
}
