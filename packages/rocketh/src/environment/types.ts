import {
	EIP1193Account,
	EIP1193DATA,
	EIP1193ProviderWithoutEvents,
	EIP1193SignerProvider,
	EIP1193TransactionEIP1193DATA,
	EIP1193TransactionReceipt,
	EIP1193WalletProvider,
} from 'eip-1193';
import {Abi, Narrow, AbiError, AbiEvent, AbiConstructor, AbiFallback, AbiFunction, AbiReceive} from 'abitype';
import type {DeployContractParameters} from 'viem/contract';
import type {Chain} from 'viem';

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
	readonly kind: 'dev';
	readonly version: number;
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
	readonly kind: 'user';
	readonly methods: {
		readonly [signature: string]: NoticeUserDoc;
	};
	readonly version: number;
	readonly notice?: string;
};

export type StorageLayout = {
	readonly storage: readonly Storage[];
	readonly types: {
		readonly [name: string]: TypeDef;
	} | null;
};

export type Deployment<TAbi extends Abi> = {
	readonly address: EIP1193Account;
	readonly abi: Narrow<TAbi>;
	readonly transaction: {
		readonly hash: EIP1193DATA;
		readonly origin?: EIP1193Account;
		readonly nonce?: EIP1193DATA;
	};
	readonly bytecode: EIP1193DATA;
	readonly argsData: EIP1193DATA;
	readonly metadata: string;
	readonly libraries?: Libraries;
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
} & NamedSigner;

export type UnknownDeployments = Record<string, Deployment<Abi>>;
export type UnknownArtifacts = {[name: string]: Artifact};
export type UnknownNamedAccounts = {
	[name: string]: EIP1193Account;
};

export type UnresolvedUnknownNamedAccounts = {
	[name: string]: AccountType;
};

export type ResolvedNamedAccounts<T extends UnresolvedUnknownNamedAccounts> = {
	[Property in keyof T]: EIP1193Account;
};

export type NamedSigner =
	| {type: 'signerOnly'; signer: EIP1193SignerProvider}
	| {type: 'remote'; signer: EIP1193ProviderWithoutEvents}
	| {type: 'wallet'; signer: EIP1193WalletProvider};

export type ResolvedNamedSigners<T extends UnknownNamedAccounts> = {
	[Property in keyof T]: NamedSigner;
};

export type UnknownDeploymentsAcrossNetworks = Record<string, UnknownDeployments>;

export type Context<
	Artifacts extends UnknownArtifacts = UnknownArtifacts,
	NamedAccounts extends UnknownNamedAccounts = UnknownNamedAccounts
> = {
	network: {
		name: string;
		tags: {[tag: string]: boolean};
		saveDeployments: boolean;
	};
	accounts: NamedAccounts;
	artifacts: Artifacts;
};

type BaseConfig = {
	networkName?: string;
	scripts?: string;
	deployments?: string;

	tags?: string[];
	logLevel?: number;
	// TODO
	gasPricing?: {};
};

type ConfigForJSONRPC = BaseConfig & {
	networkName: string;
	nodeUrl: string;
};

type ConfigForEIP1193Provider = BaseConfig & {
	provider: EIP1193ProviderWithoutEvents;
};

export type Config = ConfigForJSONRPC | ConfigForEIP1193Provider;

export type ResolvedConfig = Config & {deployments: string; scripts: string; tags: string[]; networkName: string};

export interface Environment<
	Artifacts extends UnknownArtifacts = UnknownArtifacts,
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Deployments extends UnknownDeployments = UnknownDeployments
> {
	config: ResolvedConfig;
	network: {
		chainId: string;
		name: string;
		tags: {[tag: string]: boolean};
		provider: EIP1193ProviderWithoutEvents;
	};
	deployments: Deployments;
	accounts: ResolvedNamedAccounts<NamedAccounts>;
	signers: ResolvedNamedSigners<ResolvedNamedAccounts<NamedAccounts>>;
	addressSigners: {[name: `0x${string}`]: NamedSigner};
	artifacts: Artifacts;
	save<TAbi extends Abi = Abi>(name: string, deployment: Deployment<TAbi>): Promise<Deployment<TAbi>>;
	savePendingDeployment<TAbi extends Abi = Abi>(pendingDeployment: PendingDeployment<TAbi>): Promise<Deployment<TAbi>>;
	savePendingExecution(pendingExecution: PendingExecution): Promise<EIP1193TransactionReceipt>;
	get<TAbi extends Abi>(name: string): Deployment<TAbi> | undefined;
}

export type DeploymentConstruction<TAbi extends Abi, TChain extends Chain = Chain> = Omit<
	DeployContractParameters<TAbi, TChain>,
	'bytecode' | 'account' | 'abi'
> & {account: string | EIP1193Account; artifact: string | Artifact<TAbi>};

export type PartialDeployment<TAbi extends Abi = Abi> = Artifact<TAbi> & {
	argsData: EIP1193DATA;
	libraries?: Libraries;
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
