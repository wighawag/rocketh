import type {
	Environment,
	ResolvedNamedAccounts,
	UnknownDeployments,
	UnknownNamedAccounts,
	UnresolvedUnknownNamedAccounts,
} from '../environment/types.js';

export type DeployScriptFunction<
	NamedAccounts extends UnknownNamedAccounts = UnknownNamedAccounts,
	ArgumentsTypes = undefined,
	Deployments extends UnknownDeployments = UnknownDeployments
> = (env: Environment<NamedAccounts, Deployments>, args?: ArgumentsTypes) => Promise<void | boolean>;

export interface DeployScriptModule<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	ArgumentsTypes = undefined,
	Deployments extends UnknownDeployments = UnknownDeployments
> {
	(env: Environment<ResolvedNamedAccounts<NamedAccounts>, Deployments>, args?: ArgumentsTypes): Promise<void | boolean>;
	tags?: string[];
	dependencies?: string[];
	runAtTheEnd?: boolean;
	id?: string;
}

export type ScriptCallback<
	NamedAccounts extends UnknownNamedAccounts = UnknownNamedAccounts,
	Deployments extends UnknownDeployments = UnknownDeployments
> = (env: Environment<NamedAccounts, Deployments>) => Promise<void>;
