import type {
	Environment,
	UnknownDeployments,
	UnresolvedNetworkSpecificData,
	UnresolvedUnknownNamedAccounts,
} from '../environment/types.js';

export type DeployScriptFunction<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	ArgumentsTypes = undefined,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Extra extends Record<string, unknown> = Record<string, unknown>
> = (env: Environment<NamedAccounts, Data, Deployments, Extra>, args?: ArgumentsTypes) => Promise<void | boolean>;

export interface DeployScriptModule<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	ArgumentsTypes = undefined,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Extra extends Record<string, unknown> = Record<string, unknown>
> {
	(env: Environment<NamedAccounts, Data, Deployments, Extra>, args?: ArgumentsTypes): Promise<void | boolean>;
	tags?: string[];
	dependencies?: string[];
	runAtTheEnd?: boolean;
	id?: string;
}

export type ScriptCallback<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Extra extends Record<string, unknown> = Record<string, unknown>
> = (env: Environment<NamedAccounts, Data, Deployments, Extra>) => Promise<void>;

/**
 * Utility type to extract the return value from a higher-order function
 * For functions of type (firstParam: T) => (...args: any[]) => V or (firstParam: T) => V
 */
export type ExtractReturnFunction<T> = T extends (first: any) => infer Return ? Return : never;

/**
 * Utility type to transform an object of higher-order functions by extracting their return types
 * This handles both regular functions and getter functions
 */
export type CurriedFunctions<T> = {
	[K in keyof T]: ExtractReturnFunction<T[K]>;
};

/**
 * Type for the enhanced environment proxy that includes both the original environment
 * and the curried functions
 */
export type EnhancedEnvironment<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Extensions extends Record<
		string,
		(env: Environment<NamedAccounts, Data, Deployments>, ...args: any[]) => any
	> = Record<string, (env: Environment<NamedAccounts, Data, Deployments>, ...args: any[]) => any>,
	Extra extends Record<string, unknown> = Record<string, unknown>
> = Environment<NamedAccounts, Data, Deployments, Extra> & CurriedFunctions<Extensions>;

/**
 * Type for a deploy script function that receives an enhanced environment
 */
export type EnhancedDeployScriptFunction<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	ArgumentsTypes = undefined,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Functions extends Record<
		string,
		(env: Environment<NamedAccounts, Data, Deployments>, ...args: any[]) => any
	> = Record<string, (env: Environment<NamedAccounts, Data, Deployments>, ...args: any[]) => any>,
	Extra extends Record<string, unknown> = Record<string, unknown>
> = (
	env: EnhancedEnvironment<NamedAccounts, Data, Deployments, Functions, Extra>,
	args?: ArgumentsTypes
) => Promise<void | boolean>;
