import {describe, it, expect} from 'vitest';

import {enhanceEnvIfNeeded} from '../src/environment.js';
import type {Environment} from '../src/types.js';

/**
 * `enhanceEnvIfNeeded` is what every executor entry point uses to attach extensions to
 * an environment (`rocketh-node/src/executor/index.ts`, `rocketh-web/src/index.ts`,
 * `hardhat-deploy/src/helpers.ts`). It is built on `withEnvironment` but adds one rule
 * the base function does not have: it must NOT clobber a key already present on `env`.
 * That is the "do not overwrite a built-in" guarantee — an extension named `save` or
 * `get` must leave the real implementation alone.
 *
 * These tests pin the three properties the call sites rely on: same-reference mutation,
 * the `hasOwnProperty` skip, and per-key currying that reuses `withEnvironment`'s
 * getter-vs-method distinction.
 */

/** Nothing here touches the real environment; only identity and key-presence matter. */
const baseEnv = {network: {chain: {id: 1}}, builtIn: 'original'} as unknown as Environment;

describe('enhanceEnvIfNeeded', () => {
	it('returns the SAME object reference it was given, with the extension attached', () => {
		const env = {...baseEnv} as Environment;
		const result = enhanceEnvIfNeeded(env, {double: () => (x: number) => x * 2});

		expect(result).toBe(env);
		expect(typeof (result as any).double).toBe('function');
		expect((result as any).double(21)).toBe(42);
	});

	it('does NOT overwrite a key that already exists on the env', () => {
		const env = {builtIn: 'original'} as unknown as Environment;
		const result = enhanceEnvIfNeeded(env, {builtIn: () => 'would-be-overwrite'});

		expect((result as any).builtIn).toBe('original');
	});

	it('exposes a getter-shaped extension as a property, not a method', () => {
		const env = {...baseEnv} as Environment;
		const result = enhanceEnvIfNeeded(env, {chainId: (e: Environment) => e.network.chain.id});

		// A getter (returns a non-function) becomes a property.
		expect((result as any).chainId).toBe(1);
		expect(typeof (result as any).chainId).not.toBe('function');
	});

	it('attaches two extensions independently', () => {
		const env = {...baseEnv} as Environment;
		const result = enhanceEnvIfNeeded(env, {
			double: () => (x: number) => x * 2,
			chainId: (e: Environment) => e.network.chain.id,
		});

		expect((result as any).double(5)).toBe(10);
		expect((result as any).chainId).toBe(1);
	});

	it('propagates a bad-extension error from withEnvironment, naming the key', () => {
		const env = {...baseEnv} as Environment;

		// A constant (non-function) entry is refused by `withEnvironment`'s guard.
		expect(() => enhanceEnvIfNeeded(env, {SOME_CONSTANT: 42 as never})).toThrow(/"SOME_CONSTANT"/);
	});

	it('refuses a class entry, naming it and pointing at the subpath convention', () => {
		const env = {...baseEnv} as Environment;
		class MyError extends Error {}

		expect(() => enhanceEnvIfNeeded(env, {MyError} as never)).toThrow(/"MyError" is a class/);
	});
});
