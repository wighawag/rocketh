import type {
	Environment,
	UnknownDeployments,
	UnresolvedNetworkSpecificData,
	UnresolvedUnknownNamedAccounts,
} from '../environment/types.js';

/**
 * Utility type to remove the first parameter from a function type
 */
type RemoveFirstParameter<T> = T extends (first: any, ...rest: infer R) => infer Return
	? (...args: R) => Return
	: never;

/**
 * Utility type to transform an object of functions by removing their first parameter
 */
type CurriedFunctions<T> = {
	[K in keyof T]: RemoveFirstParameter<T[K]>;
};

/**
 * Creates a curried version of functions that automatically inject an environment as the first parameter.
 *
 * @param env - The environment object to inject as the first parameter
 * @param functions - An object containing functions that expect the environment as their first parameter
 * @returns An object with the same function names, but with the environment parameter removed
 *
 * @example
 * ```typescript
 * const functions = {
 *   deploy: (env: Environment, contractName: string, args: any[]) => Promise<void>,
 *   verify: (env: Environment, address: string) => Promise<boolean>
 * };
 *
 * const curriedFunctions = withEnvironment(env, functions);
 *
 * // Now you can call without passing env:
 * await curriedFunctions.deploy('MyContract', []);
 * await curriedFunctions.verify('0x123...');
 * ```
 */
export function withEnvironment<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments,
	T extends Record<string, (env: Environment<NamedAccounts, Data, Deployments>, ...args: any[]) => any> = Record<
		string,
		(env: Environment<NamedAccounts, Data, Deployments>, ...args: any[]) => any
	>
>(env: Environment<NamedAccounts, Data, Deployments>, functions: T): CurriedFunctions<T> {
	const result = {} as CurriedFunctions<T>;

	for (const [key, func] of Object.entries(functions)) {
		// Create a new function that automatically passes the environment as the first argument
		(result as any)[key] = (...args: any[]) => func(env, ...args);
	}

	return result;
}
