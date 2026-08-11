import type {Abi, AbiConstructor, AbiError, AbiEvent, AbiFallback, AbiFunction, AbiReceive, Narrow} from 'abitype';
import {
	EIP1193Account,
	EIP1193DATA,
	EIP1193ProviderWithoutEvents,
	EIP1193QUANTITY,
	EIP1193SignerProvider,
	EIP1193TransactionData,
	EIP1193TransactionReceipt,
	EIP1193WalletProvider,
} from 'eip-1193';
import type {Address, Chain, DeployContractParameters} from 'viem';
import {TransactionHashTracker} from './providers/TransactionHashTracker.js';
import type {UnknownSignerContractCall} from './errors.js';

export type ProgressIndicator = {
	start(msg?: string): ProgressIndicator;
	stop(): ProgressIndicator;
	succeed(msg?: string): ProgressIndicator;
	fail(msg?: string): ProgressIndicator;
};

export type DeployScriptFunction<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	ArgumentsTypes = undefined,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Extra extends Record<string, unknown> = Record<string, unknown>,
> = (env: Environment<NamedAccounts, Data, Deployments, Extra>, args?: ArgumentsTypes) => Promise<void | boolean>;

export interface DeployScriptModule<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	ArgumentsTypes = undefined,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Extra extends Record<string, unknown> = Record<string, unknown>,
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
	Extra extends Record<string, unknown> = Record<string, unknown>,
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
	Extensions extends Record<string, (env: Environment<NamedAccounts, Data, Deployments>, ...args: any[]) => any> =
		Record<string, (env: Environment<NamedAccounts, Data, Deployments>, ...args: any[]) => any>,
	Extra extends Record<string, unknown> = Record<string, unknown>,
> = Environment<NamedAccounts, Data, Deployments, Extra> & CurriedFunctions<Extensions>;

/**
 * Type for a deploy script function that receives an enhanced environment
 */
export type EnhancedDeployScriptFunction<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	ArgumentsTypes = undefined,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Functions extends Record<string, (env: Environment<NamedAccounts, Data, Deployments>, ...args: any[]) => any> =
		Record<string, (env: Environment<NamedAccounts, Data, Deployments>, ...args: any[]) => any>,
	Extra extends Record<string, unknown> = Record<string, unknown>,
> = (
	env: EnhancedEnvironment<NamedAccounts, Data, Deployments, Functions, Extra>,
	args?: ArgumentsTypes,
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
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
> = <ArgumentsType = undefined, Deployments extends UnknownDeployments = UnknownDeployments>(
	callback: DeployScriptFunction<NamedAccounts, Data, ArgumentsType, Deployments>,
	options: {tags?: string[]; dependencies?: string[]; id?: string},
) => DeployScriptModule<NamedAccounts, Data, ArgumentsType, Deployments>;

export interface UntypedRequestArguments {
	readonly method: string;
	readonly params?: readonly unknown[] | object;
}
export type UntypedEIP1193Provider = {
	request(requestArguments: UntypedRequestArguments): Promise<unknown>;
};

export type RetryConfig = {
	readonly maxRetries?: number;
	readonly delay?: number;
};

export type ResolvedRetryConfig = Required<Pick<RetryConfig, 'maxRetries' | 'delay'>>;

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
	readonly autoImpersonate?: boolean;
	/** Policy for an `unsignable` `from` at this chain; see `UnknownSignerPolicy`. */
	readonly onUnknownSigner?: UnknownSignerPolicy;
	readonly autoMine?: boolean;
	readonly confirmationsRequired?: number;
	/**
	 * If true, rocketh auto-deletes the deployments folder when the recorded
	 * genesisHash no longer matches the chain's genesis. Intended for
	 * ephemeral/dev chains that get reset. Defaults to true for the recognised
	 * dev chain ids (1337, 31337); override with `false` to opt out, or `true`
	 * to enable on a custom dev chain.
	 */
	readonly deleteDeploymentsIfDifferentGenesisHash?: boolean;
};

export type ChainConfig = {
	readonly tags: readonly string[];
	readonly deterministicDeployment: DeterministicDeploymentInfo;
	readonly info: ChainInfo;
	readonly pollingInterval: number;
	readonly properties: Record<string, JSONTypePlusBigInt>;
	readonly autoImpersonate: boolean;
	/**
	 * Left OPTIONAL (unlike `autoImpersonate`, which defaults to `false` here) so the
	 * `'auto'` default has exactly ONE home, `resolveExecutionParams`. Defaulting it
	 * here too would make "no chain-level policy" indistinguishable from "chain-level
	 * policy of `'auto'`" and quietly outrank a future higher-level default.
	 */
	readonly onUnknownSigner?: UnknownSignerPolicy;
	readonly autoMine: boolean;
	readonly confirmationsRequired?: number;
	readonly deleteDeploymentsIfDifferentGenesisHash: boolean;
} & (
	| {
			readonly rpcUrl: string;
	  }
	| {
			readonly provider: EIP1193ProviderWithoutEvents;
	  }
);

export type DeploymentEnvironmentConfig = {
	readonly chain: number;
	readonly scripts?: string | readonly string[];
	readonly overrides?: Omit<ChainUserConfig, 'info'>;
};

export type Chains = {
	readonly [id: number]: ChainUserConfig;
};

export type Environments = {
	readonly [name: string]: DeploymentEnvironmentConfig;
};

export type SignerProtocolFunction = (protocolString: string) => Promise<Signer>;
export type SignerProtocol = {
	getSigner: SignerProtocolFunction;
};

export type UserConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
> = {
	readonly environments?: Environments;
	readonly chains?: Chains;
	/**
	 * When true, viem's default public RPC endpoint for a chain (e.g.
	 * `https://<id>.rpc.thirdweb.com`) is merged into that chain's
	 * `info.rpcUrls`. Defaults to false: only an RPC url set explicitly in the
	 * config appears in `info.rpcUrls`, so a default/public endpoint is never
	 * baked into serialized chain info (e.g. a frontend export or wallet
	 * "add network" data). Deploying still falls back to viem's default RPC
	 * regardless of this flag (it is provided separately, not via `info`).
	 */
	readonly includeDefaultRPCUrlsInChainInfos?: boolean;
	readonly defaultChainProperties?: Record<string, JSONTypePlusBigInt>;
	readonly deployments?: string;
	readonly scripts?: string | readonly string[];
	readonly accounts?: NamedAccounts;
	readonly data?: Data;
	readonly signerProtocols?: Record<string, SignerProtocolFunction>;
	readonly defaultPollingInterval?: number;
	readonly retry?: RetryConfig;
	/**
	 * Default policy for an `unsignable` `from`, across EVERY chain (see
	 * `UnknownSignerPolicy`). A per-chain `chains[id].onUnknownSigner` overrides it,
	 * and a run-level `ExecutionParams.onUnknownSigner` overrides both.
	 *
	 * Exists so "never prompt me anywhere" is ONE line rather than one per chain
	 * entry. Omitted means the built-in default `'auto'`.
	 */
	readonly onUnknownSigner?: UnknownSignerPolicy;
};

export type ResolvedUserConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
> = Omit<UserConfig<NamedAccounts, Data>, 'retry'> & {
	readonly retry: ResolvedRetryConfig;
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
	provider?: EIP1193ProviderWithoutEvents;
	config?: ConfigOverrides;
	autoImpersonate?: boolean;
	/** Run-level policy for an `unsignable` `from`; wins over the chain config. */
	onUnknownSigner?: UnknownSignerPolicy;
	autoMine?: boolean;
	reset?: boolean;
	/**
	 * How this run may ask a human something. Carried HERE, on the run parameters,
	 * rather than only on the executor, so it reaches the environment on every
	 * construction path — including `loadEnvironmentFromStore`, which is how
	 * hardhat-deploy gets an environment and where no executor is in scope (ADR 0007).
	 * This is the road `autoImpersonate` already travels.
	 *
	 * A runtime that supplies one (`@rocketh/node`) may still be unable to ask for
	 * free text, so what matters downstream is the per-CAPABILITY predicate
	 * `env.canPromptForText()`, not the presence of this field.
	 */
	promptExecutor?: PromptExecutor;
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
	// Allow arbitrary `@custom:*` natspec tags (e.g. `@custom:oz-upgrades-unsafe-allow`).
	// See issue #44.
	readonly [key: `@custom:${string}`]: string;
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
	bigint | string | number | boolean | null | JSONTypePlusBigInt[] | {[key: string]: JSONTypePlusBigInt};
export type LinkedDataProvided = Record<string, JSONTypePlusBigInt>;

export type JSONType = string | number | boolean | null | JSONType[] | {[key: string]: JSONType};
export type LinkedData = Record<string, JSONType>;

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

/**
 * Whether rocketh can actually sign a transaction for an address, and how.
 *
 * Derived from the resolved `Signer` variant plus node state, in this precedence:
 * `local` > `node` > `impersonated` > `unsignable`.
 *
 * - `local` — the resolved signer is `signerOnly` OR `wallet`; a signature is
 *   produced without the node's help. `signerOnly` is what the `privateKey`
 *   protocol and hardware/remote signer protocols return. `wallet` is an
 *   external wallet provider and is currently never constructed in this repo.
 * - `node` — the resolved signer is `remote` and the address is present in
 *   `eth_accounts` (the node holds the key).
 * - `impersonated` — the resolved signer is `remote`, the address is absent
 *   from `eth_accounts`, and auto-impersonation succeeded for it.
 * - `unsignable` — none of the above (an address never seen during setup, or a
 *   named account with a `remote` signer that neither the node holds nor
 *   impersonation could take on).
 */
export type Signability = 'local' | 'node' | 'impersonated' | 'unsignable';

/**
 * What rocketh does when a transaction's `from` is still `unsignable` after
 * auto-impersonation ran (see ADR 0006).
 *
 * - `throw` — surface an `UnknownSignerError` carrying the transaction a human
 *   or multisig must execute out-of-band.
 * - `ask` — PAUSE and resolve interactively: present the transaction, let the
 *   human execute it out-of-band (on their Safe) and paste back the resulting
 *   transaction hash, then continue the run with that transaction. Requires the
 *   run to be able to ask a human for text (`env.canPromptForText()`); where it
 *   cannot, `ask` degrades to `throw`. CAPABILITY IS A CEILING: asking for `ask`
 *   can never make a run interactive that has no way to reach a human, which is
 *   what keeps CI un-hangable even when a script hardcodes the value.
 * - `auto` — the default, and CAPABILITY-AWARE: it resolves to `ask` when a text
 *   prompt is available for the run and to `throw` when it is not.
 *
 * This is a POLICY, deliberately orthogonal to `autoImpersonate`, which is a
 * NODE CAPABILITY switch that runs BEFORE the seam: if impersonation resolved
 * the account, the account is signable and no policy is consulted. There is
 * therefore no `'impersonate'` value here — that would conflate "can this node
 * fake signatures?" with "what should happen when we genuinely cannot sign?".
 */
export type UnknownSignerPolicy = 'throw' | 'ask' | 'auto';

/**
 * A scoped override of the resolved `onUnknownSigner` policy, pushed on the
 * environment for the duration of one action (this is what
 * `@rocketh/unknown-signer`'s `catchUnknownSigner` does).
 *
 * It is an OBJECT rather than a bare policy string so a later slice can carry
 * extra per-scope fields (e.g. what to do with a prompt's answer) without
 * re-cutting the seam.
 *
 * A frame forces `throw` over `ask`, NEVER over impersonation: it is read only
 * inside the seam's `unsignable` branch, so a signable account broadcasts
 * identically whether or not a frame is pushed (ADR 0006).
 */
export type UnknownSignerPolicyFrame = {
	readonly policy: UnknownSignerPolicy;
};

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
		readonly autoImpersonate?: boolean;
		/** Resolved as: execution param > chain config > `'auto'`. */
		readonly onUnknownSigner: UnknownSignerPolicy;
		readonly confirmationsRequired?: number;
		readonly autoMine: boolean;
		readonly deleteDeploymentsIfDifferentGenesisHash: boolean;
	};
	readonly chain: ChainInfo;
	readonly tags: readonly string[];
	readonly saveDeployments: boolean;
	readonly reset: boolean;
	readonly askBeforeProceeding: boolean;
	readonly reportGasUse: boolean;
	readonly pollingInterval: number;
	readonly extra?: Extra;
	readonly provider: EIP1193ProviderWithoutEvents;
	readonly scripts: readonly string[];
	/** Passed through verbatim from `ExecutionParams.promptExecutor` (see there). */
	readonly promptExecutor?: PromptExecutor;
};

export type TransactionToBroadcast =
	{type: 'object'; data: EIP1193TransactionData} | {type: 'raw'; from: `0x${string}`; raw: `0x${string}`};

export interface Environment<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Extra extends Record<string, unknown> = Record<string, unknown>,
> {
	readonly name: string;
	readonly context: {
		readonly saveDeployments: boolean;
		readonly autoMine: boolean;
		readonly retry: ResolvedRetryConfig;
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
	/**
	 * Signers indexed by address. The keys are always LOWERCASE, so index it with a lowercased
	 * address (`resolveAccount` already returns one). The address VALUES exposed by
	 * `namedAccounts`/`unnamedAccounts` are left as resolved and may be checksummed.
	 */
	readonly addressSigners: {[name: `0x${string}`]: Signer};
	/**
	 * Signability indexed by address, computed after auto-impersonation runs.
	 * The keys are always LOWERCASE, matching `addressSigners`. Looking up an
	 * address that was never seen during setup returns `'unsignable'` rather than
	 * `undefined`, so callers never have to handle a third case.
	 */
	readonly addressSignability: {[address: `0x${string}`]: Signability};

	/**
	 * Push a policy frame that overrides the resolved `onUnknownSigner` for the
	 * duration of a scoped action, and pop it again. `@rocketh/unknown-signer`
	 * calls these (it depends on `@rocketh/core` only, which is why they are typed
	 * here rather than left as an untyped environment internal).
	 *
	 * ALWAYS pop in a `finally`, or the frame leaks into the rest of the run.
	 *
	 * A frame changes what happens to an `unsignable` account ONLY. It never turns
	 * a `local` / `node` / `impersonated` account into a throw: the frame is
	 * consulted INSIDE the unsignable branch of the seam (ADR 0006).
	 */
	pushUnknownSignerPolicy(frame: UnknownSignerPolicyFrame): void;
	popUnknownSignerPolicy(): void;

	save<TAbi extends Abi = Abi>(
		name: string,
		deployment: Deployment<TAbi>,
		options?: {doNotCountAsNewDeployment?: boolean},
	): Promise<Deployment<TAbi>>;
	/**
	 * Broadcast a transaction that is not a contract deployment (`execute`, `executeByName`
	 * and `tx` all funnel here).
	 *
	 * `options.contract` is the ORIGIN metadata of a contract call: pass it when the
	 * transaction encodes a function call, so an `UnknownSignerError` raised for an
	 * unsignable `from` can name the function the user must execute out-of-band rather
	 * than showing only an address. Leave it out for a plain transaction, a value
	 * transfer or a deploy — there is no function to name. It carries no `name`: the
	 * deployment name is resolved at the throw site through `fromAddressToNamedABIOrNull`,
	 * so callers never have to look it up (ADR 0006).
	 */
	broadcastExecution(
		transaction: TransactionToBroadcast,
		options?: {message?: string; contract?: Omit<UnknownSignerContractCall, 'name'>},
	): Promise<EIP1193TransactionReceipt>;
	broadcastDeployment<TAbi extends Abi = Abi>(
		name: string,
		transaction: TransactionToBroadcast,
		partialDeployment: PartialDeployment<TAbi>,
		options?: {message?: string; expectedAddress?: `0x${string}`},
	): Promise<Deployment<TAbi>>;
	get<TAbi extends Abi>(name: string): Deployment<TAbi>;
	getOrNull<TAbi extends Abi>(name: string): Deployment<TAbi> | null;
	fromAddressToNamedABI<TAbi extends Abi>(address: Address): {mergedABI: TAbi; names: string[]};
	fromAddressToNamedABIOrNull<TAbi extends Abi>(address: Address): {mergedABI: TAbi; names: string[]} | null;
	/**
	 * Whether this run can ask a human for free TEXT (e.g. "paste the transaction
	 * hash you executed on your Safe").
	 *
	 * Per-CAPABILITY, never per-executor: it is true only when the run's
	 * `PromptExecutor` actually implements `promptText`. `@rocketh/web`'s prompt
	 * exists but returns `{proceed: true}` without asking anyone, so presence proves
	 * nothing (ADR 0007). Capability is a CEILING: a policy or a per-call override
	 * may narrow what is done, but can never ask a human where this reports false.
	 */
	canPromptForText(): boolean;
	showMessage(message: string): void;
	showProgress(message?: string): ProgressIndicator;
	resolveAccountOrUndefined(account: string | EIP1193Account): `0x${string}` | undefined;
	resolveAccount(account: string | EIP1193Account): `0x${string}`;
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
	name: string;
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

export type DeploymentStore = {
	listFiles(deploymentsFolder: string, environmentName: string, filter?: (name: string) => boolean): Promise<string[]>;
	deleteAll(deploymentsFolder: string, environmentName: string): Promise<void>;
	hasFile(deploymentsFolder: string, environmentName: string, name: string): Promise<boolean>;
	writeFile(deploymentsFolder: string, environmentName: string, name: string, content: string): Promise<void>;
	writeFileWithChainInfo(
		chainInfo: {chainId: string; genesisHash?: string},
		deploymentsFolder: string,
		environmentName: string,
		name: string,
		content: string,
	): Promise<void>;
	readFile(deploymentsFolder: string, environmentName: string, name: string): Promise<string>;
	deleteFile(deploymentsFolder: string, environmentName: string, name: string): Promise<void>;
};

export type ModuleObject<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	ArgumentsType = undefined,
> = {id: string; module: DeployScriptModule<NamedAccounts, Data, ArgumentsType>};

export type PromptAnswer = {
	proceed: boolean;
};

/**
 * What asking a human for free TEXT can yield: the text they typed, or the fact
 * that they aborted (Ctrl-C, or a runtime that gave up). A caller must handle
 * both; there is deliberately no "undefined means cancelled" convention, which is
 * the shape that hides mistakes.
 *
 * This is a GENERIC text primitive, so it does not judge the text: an EMPTY string
 * is a VALUE (`{value: ''}`), NOT a cancellation. Only the caller knows what its
 * prompt makes sense to receive, so the caller VALIDATES: a resolver asking for a
 * transaction hash must reject `''` (and anything else malformed) itself, and
 * decide whether that means re-ask, abort or defer.
 */
export type TextPromptAnswer = {value: string} | {cancelled: true};

export interface PromptExecutor {
	prompt(request: {type: 'confirm'; name: string; message: string}): Promise<PromptAnswer>;
	/**
	 * Ask a human for free TEXT (e.g. "paste the transaction hash").
	 *
	 * OPTIONAL, and its ABSENCE IS the capability signal: a runtime that cannot
	 * sensibly ask a human to type a hash (the browser) simply does not implement it
	 * (ADR 0007). Never infer the ability from the mere presence of a
	 * `PromptExecutor`: `@rocketh/web` ships one whose confirm auto-proceeds without
	 * asking anyone. Check `env.canPromptForText()` instead.
	 */
	promptText?(request: {type: 'text'; name: string; message: string}): Promise<TextPromptAnswer>;
	exit(): void;
}
