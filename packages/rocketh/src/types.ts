import type {Abi, AbiConstructor, AbiError, AbiEvent, AbiFallback, AbiFunction, AbiReceive, Narrow} from 'abitype';
import {
	EIP1193Account,
	EIP1193DATA,
	EIP1193ProviderWithoutEvents,
	EIP1193QUANTITY,
	EIP1193SignerProvider,
	EIP1193TransactionReceipt,
	EIP1193WalletProvider,
} from 'eip-1193';
import type {Address, Chain, DeployContractParameters} from 'viem';
import {TransactionHashTracker} from './environment/providers/TransactionHashTracker.js';
import {ProgressIndicator} from './internal/logging.js';

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

	chainType?: 'zksync' | 'op-stack' | 'celo' | 'default';

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

export type NamedAccountExecuteFunction<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData
> = <ArgumentsType = undefined, Deployments extends UnknownDeployments = UnknownDeployments>(
	callback: DeployScriptFunction<NamedAccounts, Data, ArgumentsType, Deployments>,
	options: {tags?: string[]; dependencies?: string[]; id?: string}
) => DeployScriptModule<NamedAccounts, Data, ArgumentsType, Deployments>;

export interface UntypedRequestArguments {
	readonly method: string;
	readonly params?: readonly unknown[] | object;
}
export type UntypedEIP1193Provider = {
	request(requestArguments: UntypedRequestArguments): Promise<unknown>;
};

export type ConfigOverrides = {
	deployments?: string;
	scripts?: string | string[];
};

export type Create2DeterministicDeploymentInfo = {
	factory: `0x${string}`;
	deployer: `0x${string}`;
	funding: string;
	signedTx: `0x${string}`;
};

export type Create3DeterministicDeploymentInfo = {
	salt?: `0x${string}`;
	factory: `0x${string}`;
	bytecode: `0x${string}`;
	proxyBytecode: `0x${string}`;
};

export type DeterministicDeploymentInfo =
	| Create2DeterministicDeploymentInfo
	| {
			create2?: Create2DeterministicDeploymentInfo;
			create3?: Create3DeterministicDeploymentInfo;
	  };

export type ChainUserConfig = {
	readonly rpcUrl?: string;
	readonly tags?: readonly string[];
	readonly deterministicDeployment?: DeterministicDeploymentInfo;
	readonly info?: ChainInfo;
	readonly pollingInterval?: number;
	readonly properties?: Record<string, JSONTypePlusBigInt>;
};

export type ChainConfig = {
	readonly rpcUrl: string;
	readonly tags: readonly string[];
	readonly deterministicDeployment: DeterministicDeploymentInfo;
	readonly info: ChainInfo;
	readonly pollingInterval: number;
	readonly properties: Record<string, JSONTypePlusBigInt>;
};

export type DeploymentEnvironmentConfig = {
	readonly chain?: string | number;
	readonly scripts?: string | readonly string[];
	readonly overrides?: Omit<ChainUserConfig, 'info'>;
};

export type Chains = {
	readonly [idOrName: number | string]: ChainUserConfig;
};

export type SignerProtocolFunction = (protocolString: string) => Promise<Signer>;
export type SignerProtocol = {
	getSigner: SignerProtocolFunction;
};

export type UserConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData
> = {
	readonly environments?: {readonly [name: string]: DeploymentEnvironmentConfig};
	readonly chains?: Chains;
	readonly defaultChainProperties?: Record<string, JSONTypePlusBigInt>;
	readonly deployments?: string;
	readonly scripts?: string | readonly string[];
	readonly accounts?: NamedAccounts;
	readonly data?: Data;
	readonly signerProtocols?: Record<string, SignerProtocolFunction>;
	readonly defaultPollingInterval?: number;
};

export type ResolvedUserConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData
> = UserConfig & {
	readonly deployments: string;
	readonly scripts: readonly string[];
	readonly defaultPollingInterval: number;
};

export type ExecutionParams<Extra extends Record<string, unknown> = Record<string, unknown>> = {
	environment?: string | {fork: string};
	tags?: string[];
	saveDeployments?: boolean;
	askBeforeProceeding?: boolean;
	reportGasUse?: boolean;
	defaultPollingInterval?: number;
	extra?: Extra;
	logLevel?: number;
	provider?: EIP1193ProviderWithoutEvents;
	config?: ConfigOverrides;
};

export type {Abi, AbiConstructor, AbiError, AbiEvent, AbiFallback, AbiFunction, AbiReceive};
export type Libraries = {readonly [libraryName: string]: EIP1193Account};

export type GasEstimate = 'infinite' | `${number}`;
export type CreationGasEstimate = {
	readonly codeDepositCost: GasEstimate;
	readonly executionCost: GasEstimate;
	readonly totalCost: GasEstimate;
};

export type GasEstimates = {
	readonly creation?: CreationGasEstimate;
	readonly external?: {
		readonly [signature: string]: GasEstimate;
	};
	readonly internal?: {
		readonly [signature: string]: GasEstimate;
	};
};

export type Storage = {
	readonly astId: number;
	readonly contract: string; // canonical name <path>:<name>
	readonly label: string; // variable name
	readonly offset: number;
	readonly slot: `${number}`; // slot bytes32
	readonly type: string; // "t_mapping(t_uint256,t_struct(Cell)12382_storage)"
};
export type TypeDef = {
	readonly encoding: 'inplace' | string; // TODO
	readonly label: 'address' | 'byte24' | string; // TODO
	readonly numberOfBytes: `${number}`;
	readonly key?: string; // ref to another typedef
	readonly value?: string;
	readonly members?: readonly Storage[];
};

export type DevEventDoc = {
	readonly details?: string;
	readonly params?: {readonly [name: string]: string};
};

export type DevErrorDoc = {
	readonly details?: string; // TODO check if it can exists
	readonly params?: {readonly [name: string]: string};
};

export type DevMethodDoc = {
	readonly details?: string; // TODO check if it can exists
	readonly params?: {readonly [name: string]: string};
	readonly returns?: {
		readonly [key: string | `_${number}`]: string; // description
	};
};

export type NoticeUserDoc = {
	readonly notice?: string;
};

export type DevDoc = {
	readonly events?: {
		[signature: string]: DevEventDoc;
	};
	readonly errors?: {
		[signature: string]: readonly DevErrorDoc[];
	};
	readonly methods: {
		[signature: string]: DevMethodDoc;
	};
	readonly kind?: 'dev';
	readonly version?: number;
	readonly title?: string;
	readonly author?: string;
};

export type UserDoc = {
	readonly events?: {
		readonly [signature: string]: NoticeUserDoc;
	};
	readonly errors?: {
		readonly [signature: string]: readonly NoticeUserDoc[];
	};
	readonly kind?: 'user';
	readonly methods: {
		readonly [signature: string]: NoticeUserDoc;
	};
	readonly version?: number;
	readonly notice?: string;
};

export type JSONTypePlusBigInt =
	| bigint
	| string
	| number
	| boolean
	| null
	| JSONTypePlusBigInt[]
	| {[key: string]: JSONTypePlusBigInt};
export type LinkedData = Record<string, JSONTypePlusBigInt>;

export type StorageLayout = {
	readonly storage: readonly Storage[];
	readonly types: {
		readonly [name: string]: TypeDef;
	} | null;
};

export type MinimalDeployment<TAbi extends Abi = Abi> = {
	readonly address: EIP1193Account;
	readonly abi: Narrow<TAbi>;
};

export type Deployment<TAbi extends Abi> = MinimalDeployment<TAbi> & {
	readonly bytecode: EIP1193DATA;
	readonly argsData: EIP1193DATA;
	readonly metadata: string;

	readonly transaction?: {
		readonly hash: EIP1193DATA;
		readonly origin?: EIP1193Account;
		readonly nonce?: EIP1193DATA;
	};
	readonly receipt?: {
		blockHash: EIP1193DATA;
		blockNumber: EIP1193QUANTITY;
		transactionIndex: EIP1193QUANTITY;
	};
	readonly numDeployments?: number;
	readonly libraries?: Libraries;
	readonly linkedData?: LinkedData;
	readonly deployedBytecode?: EIP1193DATA;
	readonly linkReferences?: any; // TODO
	readonly deployedLinkReferences?: any; // TODO
	readonly contractName?: string;
	readonly sourceName?: string; // relative path
	readonly devdoc?: DevDoc;
	readonly evm?: {
		readonly gasEstimates?: GasEstimates | null;
	} & any;
	readonly storageLayout?: StorageLayout;
	readonly userdoc?: UserDoc;
} & Record<string, unknown>;

export type Artifact<TAbi extends Abi = Abi> = {
	readonly abi: TAbi;
	readonly bytecode: EIP1193DATA;
	readonly metadata: string;
	readonly deployedBytecode?: EIP1193DATA;
	readonly linkReferences?: any; // TODO
	readonly deployedLinkReferences?: any; // TODO
	readonly contractName?: string;
	readonly sourceName?: string; // relative path
	readonly devdoc?: DevDoc;
	readonly evm?: {
		readonly gasEstimates?: GasEstimates | null;
	} & any;
	readonly storageLayout?: StorageLayout;
	readonly userdoc?: UserDoc;
};

export type AccountDefinition = EIP1193Account | string | number;

export type AccountType =
	| AccountDefinition
	| {
			[networkOrChainId: string | number]: AccountDefinition;
	  };

export type ResolvedAccount = {
	address: EIP1193Account;
} & Signer;

export type UnknownDeployments = Record<string, Deployment<Abi>>;
export type UnknownNamedAccounts = {
	[name: string]: EIP1193Account;
};

export type UnresolvedUnknownNamedAccounts = {
	[name: string]: AccountType;
};

export type ResolvedNamedAccounts<T extends UnresolvedUnknownNamedAccounts> = {
	[Property in keyof T]: EIP1193Account;
};

export type DataType<T> = {
	[networkOrChainId: string | number]: T;
};

export type UnknownData = {
	[name: string]: unknown;
};

export type UnresolvedNetworkSpecificData = {
	[name: string]: DataType<unknown>;
};

export type ResolvedNetworkSpecificData<T extends UnresolvedNetworkSpecificData> = {
	[Property in keyof T]: T[Property] extends DataType<infer U> ? U : never;
};

export type Signer =
	| {type: 'signerOnly'; signer: EIP1193SignerProvider}
	| {type: 'remote'; signer: EIP1193ProviderWithoutEvents}
	| {type: 'wallet'; signer: EIP1193WalletProvider};

export type ResolvedNamedSigners<T extends UnknownNamedAccounts> = {
	[Property in keyof T]: Signer;
};

export type UnknownDeploymentsAcrossNetworks = Record<string, UnknownDeployments>;

export type ResolvedExecutionParams<Extra extends Record<string, unknown> = Record<string, unknown>> = {
	readonly environment: {
		readonly name: string;
		readonly tags: readonly string[];
		readonly fork?: boolean;
		readonly deterministicDeployment: DeterministicDeploymentInfo;
	};
	readonly chain: ChainInfo;
	readonly tags: readonly string[];
	readonly saveDeployments: boolean;
	readonly askBeforeProceeding: boolean;
	readonly reportGasUse: boolean;
	readonly pollingInterval: number;
	readonly extra?: Extra;
	readonly logLevel: number;
	readonly provider: EIP1193ProviderWithoutEvents;
	readonly scripts: readonly string[];
};

export interface Environment<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Extra extends Record<string, unknown> = Record<string, unknown>
> {
	readonly name: string;
	readonly context: {
		readonly saveDeployments: boolean;
	};
	readonly tags: {readonly [tag: string]: boolean};
	readonly network: {
		readonly chain: Chain;
		readonly provider: TransactionHashTracker;
		readonly fork?: boolean;
		readonly deterministicDeployment: DeterministicDeploymentInfo;
	};
	readonly deployments: Deployments;
	readonly namedAccounts: ResolvedNamedAccounts<NamedAccounts>;
	readonly data: ResolvedNetworkSpecificData<Data>;
	readonly namedSigners: ResolvedNamedSigners<ResolvedNamedAccounts<NamedAccounts>>;
	readonly unnamedAccounts: EIP1193Account[];
	// unnamedSigners: {type: 'remote'; signer: EIP1193ProviderWithoutEvents}[];
	readonly addressSigners: {[name: `0x${string}`]: Signer};
	save<TAbi extends Abi = Abi>(
		name: string,
		deployment: Deployment<TAbi>,
		options?: {doNotCountAsNewDeployment?: boolean}
	): Promise<Deployment<TAbi>>;
	savePendingDeployment<TAbi extends Abi = Abi>(pendingDeployment: PendingDeployment<TAbi>): Promise<Deployment<TAbi>>;
	savePendingExecution(pendingExecution: PendingExecution): Promise<EIP1193TransactionReceipt>;
	get<TAbi extends Abi>(name: string): Deployment<TAbi>;
	getOrNull<TAbi extends Abi>(name: string): Deployment<TAbi> | null;
	fromAddressToNamedABI<TAbi extends Abi>(address: Address): {mergedABI: TAbi; names: string[]};
	fromAddressToNamedABIOrNull<TAbi extends Abi>(address: Address): {mergedABI: TAbi; names: string[]} | null;
	showMessage(message: string): void;
	showProgress(message?: string): ProgressIndicator;

	hasMigrationBeenDone(id: string): boolean;
	readonly extra?: Extra;
}

export type DeploymentConstruction<TAbi extends Abi> = Omit<
	DeployContractParameters<TAbi>,
	'bytecode' | 'account' | 'abi' | 'chain'
> & {account: string | EIP1193Account; artifact: Artifact<TAbi>};

export type PartialDeployment<TAbi extends Abi = Abi> = Artifact<TAbi> & {
	argsData: EIP1193DATA;
	libraries?: Libraries;
	linkedData?: LinkedData;
};

export type PendingDeployment<TAbi extends Abi = Abi> = {
	type: 'deployment';
	name?: string;
	transaction: {
		hash: `0x${string}`;
		nonce?: `0x${string}`;
		origin?: `0x${string}`;
	};
	partialDeployment: PartialDeployment<TAbi>;
	expectedAddress?: `0x${string}`; // TODO we could make that a event specification so we can get address from factory event
};

export type PendingExecution = {
	type: 'execution';
	description?: string;
	transaction: {
		hash: `0x${string}`;
		nonce?: `0x${string}`;
		origin?: `0x${string}`;
	};
};

export type PendingTransaction = PendingDeployment | PendingExecution;
