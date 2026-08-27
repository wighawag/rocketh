/**
 * Equality keyed off the ABI TYPE, never off the JavaScript type.
 *
 * This is what `equals` on an `execute` guard compares with, and it exists because the
 * guard's read is DECLARED against a typed ABI rather than closed over
 * (`docs/adr/0013-the-execute-guard-is-a-declared-read.md`). An `address`, a `bytes32` and
 * a Solidity `string` all arrive as a JavaScript string, so an implementation keyed off
 * `typeof` cannot tell them apart and is guaranteed to be wrong for one of them:
 *
 * - fold case and a symbol named `Rocketh` compares equal to one named `rocketh`
 * - fold nothing and a checksummed address fails to match the same address lowercased,
 *   so a re-run re-sends an upgrade that already happened — the double-execution loss the
 *   guard exists to prevent (`docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md`)
 *
 * `@rocketh/proxy` already lowercases both sides before comparing an implementation
 * address, for the same reason; this module is that rule made general and keyed off the
 * declared type instead of applied by hand at one call site.
 */

import type {AbiParameter} from 'abitype';

/** `bytes`, `bytes1` … `bytes32`: hex whose casing carries no meaning. */
const HEX_BYTES_TYPE = /^bytes([1-9]|[12][0-9]|3[0-2])?$/;

/** `T[]`, `T[3]`: an array type, plus the element type it is an array OF. */
const ARRAY_TYPE = /^(.+)\[\d*\]$/;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Read component `index` (named `name`) out of a decoded tuple.
 *
 * viem decodes a tuple as an OBJECT when every component is named and as an ARRAY
 * otherwise, and a value supplied by the caller may legitimately use either spelling, so
 * both are accepted on both sides.
 */
function component(container: unknown, index: number, name: string | undefined): unknown {
	if (Array.isArray(container)) {
		return container[index];
	}
	if (isRecord(container) && name) {
		return container[name];
	}
	return undefined;
}

/**
 * Compare two values that are both instances of `parameter`'s ABI type.
 *
 * `actual` is the value read from the chain and `expected` the one the guard declared,
 * but the rule is symmetric: every case folds (or refuses to fold) BOTH sides, so a
 * checksummed expected value matches a lowercased read one and vice versa.
 */
export function valuesEqualForAbiType(parameter: AbiParameter, actual: unknown, expected: unknown): boolean {
	const type = parameter.type;

	const asArray = ARRAY_TYPE.exec(type);
	if (asArray) {
		if (!Array.isArray(actual) || !Array.isArray(expected)) {
			return false;
		}
		if (actual.length !== expected.length) {
			return false;
		}
		const element = {...parameter, type: asArray[1]} as AbiParameter;
		return actual.every((value, index) => valuesEqualForAbiType(element, value, expected[index]));
	}

	if (type === 'tuple') {
		const components = (parameter as {components?: readonly AbiParameter[]}).components ?? [];
		return valuesEqualForAbiParameters(components, actual, expected);
	}

	// An address differs from itself only by checksum casing, and a hex byte string's
	// casing carries no meaning at all. Both fold; a Solidity `string` deliberately does
	// not, and falls through to the identity below.
	if (type === 'address' || HEX_BYTES_TYPE.test(type)) {
		return (
			typeof actual === 'string' && typeof expected === 'string' && actual.toLowerCase() === expected.toLowerCase()
		);
	}

	// `string` (case SENSITIVE, it is user data), `bool`, and every integer type. `===` is
	// what keeps a bigint from coercing against a number of the same magnitude: a `uint256`
	// decodes to `42n` and a `uint32` to `42`, and the guard reports "not satisfied" rather
	// than deciding which one the author meant.
	return actual === expected;
}

/**
 * Compare two values against a LIST of ABI parameters, elementwise under the per-type rule.
 *
 * Used for a tuple's components and for a function's declared outputs, which viem decodes
 * into an array whenever there are several of them.
 */
export function valuesEqualForAbiParameters(
	parameters: readonly AbiParameter[],
	actual: unknown,
	expected: unknown,
): boolean {
	if (actual === expected) {
		return true;
	}
	if (actual === undefined || expected === undefined || actual === null || expected === null) {
		return false;
	}
	return parameters.every((parameter, index) =>
		valuesEqualForAbiType(
			parameter,
			component(actual, index, parameter.name),
			component(expected, index, parameter.name),
		),
	);
}

/**
 * Compare a decoded function RETURN against an expected value.
 *
 * viem decides the shape of the decoded value before the guard sees it: one declared
 * output decodes to that value UNWRAPPED, several decode to an array, none decodes to
 * `undefined`. The comparison follows that shape, which is why the single-output case is
 * keyed off the one parameter rather than treated as a one-element tuple.
 */
export function returnValueEquals(outputs: readonly AbiParameter[], actual: unknown, expected: unknown): boolean {
	if (outputs.length === 1) {
		return valuesEqualForAbiType(outputs[0], actual, expected);
	}
	if (outputs.length === 0) {
		return actual === expected;
	}
	return valuesEqualForAbiParameters(outputs, actual, expected);
}
