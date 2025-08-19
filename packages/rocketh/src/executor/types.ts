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
	Deployments extends UnknownDeployments = UnknownDeployments
> = (env: Environment<NamedAccounts, Data, Deployments>, args?: ArgumentsTypes) => Promise<void | boolean>;

export interface DeployScriptModule<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	ArgumentsTypes = undefined,
	Deployments extends UnknownDeployments = UnknownDeployments
> {
	(env: Environment<NamedAccounts, Data, Deployments>, args?: ArgumentsTypes): Promise<void | boolean>;
	tags?: string[];
	dependencies?: string[];
	runAtTheEnd?: boolean;
	id?: string;
}

export type ScriptCallback<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments
> = (env: Environment<NamedAccounts, Data, Deployments>) => Promise<void>;

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
 * Type for the enhanced environment proxy that includes both the original environment
 * and the curried functions
 */
export type EnhancedEnvironment<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Functions extends Record<
		string,
		(env: Environment<NamedAccounts, Data, Deployments>, ...args: any[]) => any
	> = Record<string, (env: Environment<NamedAccounts, Data, Deployments>, ...args: any[]) => any>
> = Environment<NamedAccounts, Data, Deployments> & CurriedFunctions<Functions>;

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
	> = Record<string, (env: Environment<NamedAccounts, Data, Deployments>, ...args: any[]) => any>
> = (
	env: EnhancedEnvironment<NamedAccounts, Data, Deployments, Functions>,
	args?: ArgumentsTypes
) => Promise<void | boolean>;
