import {
	EIP1193Account,
	EIP1193DATA,
	EIP1193ProviderWithoutEvents,
	EIP1193QUANTITY,
	EIP1193SignerProvider,
	EIP1193TransactionReceipt,
	EIP1193WalletProvider,
} from 'eip-1193';
import {Abi, Narrow, AbiError, AbiEvent, AbiConstructor, AbiFallback, AbiFunction, AbiReceive} from 'abitype';
import type {Address, DeployContractParameters} from 'viem';
import type {Chain} from 'viem';
import {ProgressIndicator} from '../internal/logging.js';
import {TransactionHashTracker} from './providers/TransactionHashTracker.js';
import {DeterministicDeploymentInfo} from '../executor/index.js';

export type {Abi, AbiError, AbiEvent, AbiConstructor, AbiFallback, AbiFunction, AbiReceive};
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

export type Deployment<TAbi extends Abi> = {
	readonly address: EIP1193Account;
	readonly abi: Narrow<TAbi>;
	readonly transaction?: {
		readonly hash: EIP1193DATA;
		readonly origin?: EIP1193Account;
		readonly nonce?: EIP1193DATA;
	};
	readonly receipt?: {
		confirmations: number;
		blockHash: EIP1193DATA;
		blockNumber: EIP1193QUANTITY;
		transactionIndex: EIP1193QUANTITY;
	};
	readonly bytecode: EIP1193DATA;
	readonly argsData: EIP1193DATA;
	readonly metadata: string;
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

type NetworkConfigBase = {
	name: string;
	tags: string[];
	fork?: boolean;
	deterministicDeployment?: DeterministicDeploymentInfo;
	scripts?: string | string[];
};
type NetworkConfigForJSONRPC = NetworkConfigBase & {
	nodeUrl: string;
};

type NetworkConfigForEIP1193Provider = NetworkConfigBase & {
	provider: EIP1193ProviderWithoutEvents;
};

export type NetworkConfig = NetworkConfigForJSONRPC | NetworkConfigForEIP1193Provider;

export type Config<
	AccountsType extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData
> = {
	network: NetworkConfig;
	networkTags?: string[];
	scripts?: string | string[];
	deployments?: string;
	saveDeployments?: boolean;

	tags?: string[];
	askBeforeProceeding?: boolean;
	reportGasUse?: boolean;

	logLevel?: number;
	// TODO
	gasPricing?: {};
	accounts?: AccountsType;

	data?: Data;
};

export type ResolvedConfig<
	AccountsType extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData
> = Config & {
	deployments: string;
	scripts: string[];
	tags: string[];
	network: {
		name: string;
		tags: string[];
		fork?: boolean;
		deterministicDeployment: DeterministicDeploymentInfo;
	};
	saveDeployments?: boolean;
	askBeforeProceeding?: boolean;
	reportGasUse?: boolean;
	accounts: AccountsType;
	data: Data;
};

export interface Environment<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments
> {
	config: ResolvedConfig;
	network: {
		chain: Chain;
		name: string;
		tags: {[tag: string]: boolean};
		provider: TransactionHashTracker;
	};
	deployments: Deployments;
	namedAccounts: ResolvedNamedAccounts<NamedAccounts>;
	data: ResolvedNetworkSpecificData<Data>;
	namedSigners: ResolvedNamedSigners<ResolvedNamedAccounts<NamedAccounts>>;
	unnamedAccounts: EIP1193Account[];
	// unnamedSigners: {type: 'remote'; signer: EIP1193ProviderWithoutEvents}[];
	addressSigners: {[name: `0x${string}`]: Signer};
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
