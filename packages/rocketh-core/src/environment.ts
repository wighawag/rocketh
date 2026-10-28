import {
	EnhancedEnvironment,
	Environment,
	UnknownDeployments,
	UnresolvedNetworkSpecificData,
	UnresolvedUnknownNamedAccounts,
	CurriedFunctions,
} from './types.js';

/**
 * @param env - The environment object to inject as the first parameter
 * @param functionsAndGetters - An object containing functions that expect the environment as their first parameter,
 *                             or getter functions that return a value from the environment
 * @returns An object with the same function/property names, but with the environment parameter removed
 *
 * @example
 * ```typescript
 * const functionsAndGetters = {
 *   // Functions that expect env as first parameter
 *   deploy: (env: Environment, contractName: string, args: any[]) => Promise<void>,
 *   verify: (env: Environment, address: string) => Promise<boolean>,
 *
 *   // Getter properties that can be accessed directly
 *   myValue: (env: Environment) => env.someValue,
 *   networkId: (env: Environment) => env.network.id
 * };
 *
 * const enhancedEnv = withEnvironment(env, functionsAndGetters);
 *
 * // Now you can call functions without passing env:
 * await enhancedEnv.deploy('MyContract', []);
 * await enhancedEnv.verify('0x123...');
 *
 * // And access getter properties directly:
 * console.log(enhancedEnv.myValue);
 * console.log(enhancedEnv.networkId);
 * ```
 *
 * EVERY entry must be a FUNCTION taking the environment. That is why an extension
 * package's ROOT may export only curried `(env) => …` functions (plus `export type`s,
 * which erase): the documented user idiom is a namespace spread
 * (`{...deployExtension, ...myExtension}`), so any other runtime export lands here and
 * is called as `value(env)`. A class and a plain constant are both rejected by name,
 * because the raw failures (`Class constructor … cannot be invoked without 'new'` and
 * `func is not a function`) say nothing about WHICH export is at fault, and this runs at
 * deploy-script time rather than at build time. Put anything else on a subpath export —
 * `@rocketh/unknown-signer` keeps `UnknownSignerError` on `./errors` for exactly this.
 */
export function withEnvironment<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Extra extends Record<string, unknown> = Record<string, unknown>,
	T extends Record<
		string,
		| ((env: Environment<NamedAccounts, Data, Deployments, Extra>) => (...args: any[]) => any)
		| ((env: Environment<NamedAccounts, Data, Deployments, Extra>) => any)
	> = Record<
		string,
		| ((env: Environment<NamedAccounts, Data, Deployments>) => (...args: any[]) => any)
		| ((env: Environment<NamedAccounts, Data, Deployments>) => any)
	>,
>(env: Environment<NamedAccounts, Data, Deployments, Extra>, functionsAndGetters: T): CurriedFunctions<T> {
	const result = {} as CurriedFunctions<T>;

	for (const [key, func] of Object.entries(functionsAndGetters)) {
		// FAIL FAST, NAMING THE KEY. Both shapes below already crashed here before this guard
		//  existed (`func is not a function` / `Class constructor … cannot be invoked without
		//  'new'`), so no working configuration changes; what was missing was WHICH export is
		//  at fault and what the rule is. Deliberately narrow: a GETTER (`(env) => value`) is a
		//  supported shape and must keep working, so the check is on the ENTRY being callable,
		//  never on what it returns.
		if (typeof func !== 'function') {
			throw new Error(
				`extension entry "${key}" is a ${typeof func}, not a function. An extension package's root may export ` +
					`only curried \`(env) => \u2026\` functions (or getters \`(env) => value\`). Move a constant or other value ` +
					`to a subpath export.`,
			);
		}
		if (/^class[\s{]/.test(Function.prototype.toString.call(func))) {
			throw new Error(
				`extension entry "${key}" is a class, which cannot be called with the environment. An extension ` +
					`package's root may export only curried \`(env) => \u2026\` functions (or getters \`(env) => value\`). ` +
					`Move the class to a subpath export, as \`@rocketh/unknown-signer\` does with \`UnknownSignerError\` ` +
					`on \`./errors\`.`,
			);
		}
		// Check if the function is a getter or a regular function. This call happens for EVERY
		//  entry before the deploy script runs, so a throw here fails the script whether or not it
		//  uses that entry, and the raw error says nothing about extensions: name the entry.
		let value: unknown;
		try {
			value = func(env);
		} catch (error) {
			throw withExtensionSetupContext(key, error);
		}

		if (typeof value === 'function') {
			// Regular function case: Create a function that automatically passes the environment
			(result as any)[key] = (...args: any[]) => func(env)(...args);
		} else {
			// Getter case: Define property with getter that returns the value
			Object.defineProperty(result, key, {
				get: () => func(env),
				enumerable: true,
			});
		}
	}

	return result;
}

/**
 * The error an extension entry threw while `withEnvironment` set it up, with the entry named.
 *
 * The SAME error object is rethrown, its message prefixed, rather than a new error wrapping
 * it: a caller may catch a failure by class around a whole run (hardhat-deploy does,
 * `instanceof UnresolvableAccountsError` in `account-errors.ts`), and a wrapper would hide
 * that class. A new `Error`, with the original as `cause`, is made only for a thrown value
 * that is not an `Error`, or one whose `message` cannot be assigned.
 */
function withExtensionSetupContext(key: string, error: unknown): unknown {
	const context =
		`extension entry "${key}" threw while the environment was being set up ` +
		`(every extension entry is called with the environment before a deploy script runs, ` +
		`whether or not the script uses it)`;
	if (!(error instanceof Error)) {
		return new Error(`${context}: ${String(error)}`, {cause: error});
	}
	const original = error.message;
	// An entry that throws one SHARED error object, for every script, is named once.
	if (original.startsWith(context)) {
		return error;
	}
	try {
		error.message = `${context}: ${original}`;
	} catch {
		// A read-only `message` (a getter with no setter, as on `DOMException`): wrap instead of
		//  letting the failed assignment replace the error being reported.
		return new Error(`${context}: ${original}`, {cause: error});
	}
	// The stack was rendered with the old message; keep the two in agreement.
	if (typeof error.stack === 'string' && original !== '' && error.stack.includes(original)) {
		try {
			error.stack = error.stack.replace(original, error.message);
		} catch {
			// a read-only stack is left as it was
		}
	}
	return error;
}

/**
 * Add extensions to an environment IN PLACE, skipping any already present.
 *
 * FIRST WRITER WINS, keyed by extension NAME. If this ever ran twice over one environment
 * with two different versions of the same extension, the second would be silently dropped
 * and that script would run against the first one's implementation. It is not reachable
 * that way today: every call site (`@rocketh/node`'s executor, `@rocketh/web`,
 * `hardhat-deploy`) calls it once on an environment freshly returned from a `load*`
 * function, with a single extensions bag. The deploy-script path does NOT come through
 * here at all: `setupDeployScripts` builds a fresh layered object per script, so two
 * scripts carrying different extension versions coexist rather than clobbering.
 *
 * The `hasOwnProperty` test is deliberately a STRING KEY rather than a symbol brand or a
 * module-level `WeakSet` of seen environments. `@rocketh/core` is a regular dependency, so
 * a consumer can end up with several copies of it, and any identity-based check would
 * disagree across them and fail silently. See
 * `docs/adr/0011-duplicable-core-stays-identity-free.md`.
 */
export function enhanceEnvIfNeeded<
	Extensions extends Record<string, (env: Environment<any, any, any>) => any> = {},
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Extra extends Record<string, unknown> = Record<string, unknown>,
>(
	env: Environment,
	extensions: Extensions,
): EnhancedEnvironment<NamedAccounts, Data, UnknownDeployments, Extensions, Extra> {
	// Use the original env object as the base
	const enhancedEnv = env as EnhancedEnvironment<NamedAccounts, Data, UnknownDeployments, Extensions, Extra>;

	// Only create curried functions for extensions not already present in env
	for (const key in extensions) {
		if (!Object.prototype.hasOwnProperty.call(env, key)) {
			// Create curried function only for this specific extension
			const singleExtension: Record<string, unknown> = {};
			singleExtension[key] = (extensions as any)[key];
			const curriedFunction = withEnvironment(env, singleExtension as any);
			(enhancedEnv as any)[key] = (curriedFunction as any)[key];
		}
	}
	return enhancedEnv;
}
