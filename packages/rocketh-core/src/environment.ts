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
		// Check if the function is a getter or a regular function
		const value = func(env);

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
