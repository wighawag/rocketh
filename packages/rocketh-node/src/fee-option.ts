/**
 * A run-level fee amount typed on a command line, as the `bigint` core takes, or `undefined` when
 * the option was not given. `flag` is how the option is spelled in the message.
 *
 * Accepted: a non-negative integer amount in WEI, written in decimal digits (surrounding
 * whitespace ignored). Refused, with a message naming the flag: anything else, including an
 * empty value, a sign, a decimal point, an exponent and a unit (`2gwei`). Wei and decimal only,
 * because that is what hardhat-deploy v1's `--gasprice` took and a silently different reading of
 * `2` (2 wei or 2 gwei?) is the one mistake a fee flag must not allow.
 *
 * Exported from `@rocketh/node` so hardhat-deploy's `deploy` task reads its own fee options
 * identically: the two entry points must not disagree about what a fee value is. It lives in its
 * own module, apart from `cli-options.ts`, so importing the package root does not load commander.
 */
export function parseFeeOption(flag: string, value: string | undefined): bigint | undefined {
	if (value === undefined) {
		return undefined;
	}
	const trimmed = value.trim();
	if (!/^[0-9]+$/.test(trimmed)) {
		throw new Error(
			`invalid ${flag} value: ${JSON.stringify(value)}. Expected a non-negative integer amount in wei, in decimal digits (for example 2000000000 for 2 gwei).`,
		);
	}
	return BigInt(trimmed);
}
