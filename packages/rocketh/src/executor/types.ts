import {Address} from 'abitype';
import type {
	Environment,
	JSONTypePlusBigInt,
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

type ChainBlockExplorer = {
	name: string;
	url: string;
	apiUrl?: string | undefined;
};
type ChainContract = {
	address: Address;
	blockCreated?: number | undefined;
};

type ChainNativeCurrency = {
	name: string;
	/** 2-6 characters long */
	symbol: string;
	decimals: number;
};

type ChainRpcUrls = {
	http: readonly string[];
	webSocket?: readonly string[] | undefined;
};

/**
 * @description Combines members of an intersection into a readable type.
 *
 * @see {@link https://twitter.com/mattpocockuk/status/1622730173446557697?s=20&t=NdpAcmEFXY01xkqU3KO0Mg}
 * @example
 * Prettify<{ a: string } & { b: string } & { c: number, d: bigint }>
 * => { a: string, b: string, c: number, d: bigint }
 */
type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

export type ChainInfo = {
	/** ID in number form */
	id: number;
	/** Human-readable name */
	name: string;
	/** Collection of block explorers */
	blockExplorers?:
		| {
				[key: string]: ChainBlockExplorer;
				default: ChainBlockExplorer;
		  }
		| undefined;
	/** Collection of contracts */
	contracts?:
		| Prettify<
				{
					[key: string]: ChainContract | {[sourceId: number]: ChainContract | undefined} | undefined;
				} & {
					ensRegistry?: ChainContract | undefined;
					ensUniversalResolver?: ChainContract | undefined;
					multicall3?: ChainContract | undefined;
				}
		  >
		| undefined;
	/** Currency used by chain */
	nativeCurrency: ChainNativeCurrency;
	/** Collection of RPC endpoints */
	rpcUrls: {
		[key: string]: ChainRpcUrls;
		default: ChainRpcUrls;
	};
	/** Source Chain ID (ie. the L1 chain) */
	sourceId?: number | undefined;
	/** Flag for test networks */
	testnet?: boolean | undefined;

	chainType: 'zksync' | 'op-stack' | 'celo' | 'default';

	genesisHash?: string;

	properties?: Record<string, JSONTypePlusBigInt>;

	// this will bring in the following when reconstructed from the data above

	// /** Custom chain data. */
	// custom?: any;

	// /**
	//  * Modifies how chain data structures (ie. Blocks, Transactions, etc)
	//  * are formatted & typed.
	//  */
	// formatters?: any | undefined;
	// /** Modifies how data (ie. Transactions) is serialized. */
	// serializers?: any | undefined;
	// /** Modifies how fees are derived. */
	// fees?: any | undefined;
};
