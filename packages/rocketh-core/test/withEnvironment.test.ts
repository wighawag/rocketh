import {describe, it, expect} from 'vitest';

import {withEnvironment} from '../src/environment.js';
import type {Environment} from '../src/types.js';

/**
 * `withEnvironment` is what turns an EXTENSION package's curried `(env) => …` exports
 * into methods on the environment a deploy script receives. The documented user idiom
 * is a namespace spread (`{...deployExtension, ...myExtension}`), so EVERY runtime
 * export of that package's root lands here and is called as `value(env)`.
 *
 * These tests pin the two shapes that are supported and the two that are refused. The
 * refusals already crashed before the guard existed; what they add is naming the
 * offending key and stating the rule, because this runs at deploy-script time rather
 * than at build time (see `AGENTS.md`, and the `extension` entry in `CONTEXT.md`).
 */

/** Nothing here touches the real environment; only identity matters to `withEnvironment`. */
const env = {network: {chain: {id: 1}}} as unknown as Environment;

describe('withEnvironment - supported extension shapes', () => {
	/** The ordinary case: a curried function becomes a method with `env` already bound. */
	it('curries a function export into a method', () => {
		const enhanced = withEnvironment(env, {double: () => (x: number) => x * 2});
		expect(typeof enhanced.double).toBe('function');
		expect(enhanced.double(21)).toBe(42);
	});

	/**
	 * A GETTER (`(env) => value`, returning a NON-function) is an explicitly documented
	 * shape and becomes a property. This is why the guard below tests whether the ENTRY
	 * is callable and never what it RETURNS: a check on the return value would silently
	 * break every getter.
	 */
	it('exposes a getter export as a property, not a method', () => {
		const enhanced = withEnvironment(env, {chainId: (e: Environment) => e.network.chain.id});
		expect(enhanced.chainId).toBe(1);
	});
});

describe('withEnvironment - refuses a non-curried root export, naming the key', () => {
	/**
	 * The raw failure was `TypeError: func is not a function`, which names neither the
	 * export nor the rule. Each assertion checks the KEY is named, since that is the
	 * entire point of the guard: a namespace spread can carry dozens of entries.
	 */
	it.each([
		['number', 42],
		['string', 'hello'],
		['object', {a: 1}],
	])('refuses a %s constant', (_label, value) => {
		expect(() => withEnvironment(env, {SOME_CONSTANT: value} as never)).toThrow(/"SOME_CONSTANT"/);
		expect(() => withEnvironment(env, {SOME_CONSTANT: value} as never)).toThrow(/subpath export/);
	});

	/**
	 * A class IS `typeof 'function'`, so it passes the callable check and would otherwise
	 * die on `Class constructor … cannot be invoked without 'new'`. It is detected
	 * separately so the message can say what to do about it.
	 */
	it('refuses a class export and points at the subpath convention', () => {
		class MyError extends Error {}
		expect(() => withEnvironment(env, {MyError} as never)).toThrow(/"MyError" is a class/);
		expect(() => withEnvironment(env, {MyError} as never)).toThrow(/subpath export/);
	});

	/** A legitimate getter that throws must NOT be reported as a bad export shape. */
	it('lets a genuine error from inside a getter through unchanged', () => {
		const boom = () => {
			throw new Error('deployment not found');
		};
		expect(() => withEnvironment(env, {thing: boom})).toThrow('deployment not found');
	});
});
