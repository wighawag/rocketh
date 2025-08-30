import type {
	Environment,
	UnknownDeployments,
	UnresolvedNetworkSpecificData,
	UnresolvedUnknownNamedAccounts,
} from '../environment/types.js';
import {CurriedFunctions} from '../executor/types.js';

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
	>
>(env: Environment<NamedAccounts, Data, Deployments, Extra>, functionsAndGetters: T): CurriedFunctions<T> {
	const result = {} as CurriedFunctions<T>;

	for (const [key, func] of Object.entries(functionsAndGetters)) {
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
