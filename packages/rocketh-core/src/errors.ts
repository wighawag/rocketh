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
	/**
	 * What AUTO-IMPERSONATION did for this `from`, present only when `autoImpersonate` was
	 * ENABLED for the run. It is a MESSAGE detail and nothing else: auto-impersonation is a
	 * NODE CAPABILITY resolved before the unknown-signer seam and `onUnknownSigner` is the
	 * POLICY afterwards (ADR 0006), so recording the outcome here never feeds the policy
	 * decision. It exists because the impersonation attempt deliberately SWALLOWS failure, so
	 * a user who enabled the feature against a node that does not implement the RPC otherwise
	 * had no signal at all that it had been tried.
	 *
	 * - `'attempted'`: the account WAS an impersonation candidate and
	 *   `hardhat_impersonateAccount` was sent for it, but it did not resolve the account
	 *   (the node does not implement that RPC, or refused).
	 * - `'not-a-candidate'`: impersonation was never attempted for this account, because the
	 *   candidates are the NAMED accounts the node would otherwise have to sign for, i.e. named
	 *   AND resolving to a `remote` signer AND absent from `eth_accounts`.
	 *
	 * ABSENT means auto-impersonation was off for the run, and the message is then exactly
	 * what it always was: no new noise on the common path.
	 */
	autoImpersonation?: 'attempted' | 'not-a-candidate';
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
	// The note goes HERE, directly under the header and ABOVE the transaction fields, because it
	//  explains why the user is reading this error at all. Below `data:` it would be unreadable
	//  in the case it exists for: for a DEPLOYMENT `data` is the entire creation bytecode, so an
	//  appended note sits thousands of characters past where anyone stops reading.
	// Prefer TRUE and SPECIFIC over reassuring: "could not sign" is what the user already knew,
	//  whereas "you switched auto-impersonation on and this node does not implement it" names the
	//  actual mismatch and its fix. Absent field ⇒ not a word about impersonation.
	if (data.autoImpersonation === 'attempted') {
		lines.push(
			'  note: auto-impersonation was enabled for this run and `hardhat_impersonateAccount` was sent for this ' +
				'account, but the node did not accept it (only a fork or dev node, such as anvil or hardhat, implements ' +
				'that RPC), so the account remains unsignable.',
		);
	} else if (data.autoImpersonation === 'not-a-candidate') {
		lines.push(
			'  note: auto-impersonation was enabled for this run but was never attempted for this account: the ' +
				'candidates are the NAMED accounts (declared in the `accounts` config) that the node would otherwise ' +
				'have to sign for, so an unnamed account, a bare `from`, or an account that already has its own signer ' +
				'is never impersonated.',
		);
	}
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
