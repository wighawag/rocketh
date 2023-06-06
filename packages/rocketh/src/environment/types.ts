import {
	EIP1193Account,
	EIP1193DATA,
	EIP1193ProviderWithoutEvents,
	EIP1193SignerProvider,
	EIP1193TransactionEIP1193DATA,
	EIP1193WalletProvider,
} from 'eip-1193';
import {Abi, Narrow} from 'abitype';
import type {DeployContractParameters} from 'viem/contract';
import type {Chain} from 'viem';

export type Libraries = {[libraryName: string]: EIP1193Account};

export type Deployment<TAbi extends Abi> = {
	address: EIP1193Account;
	abi: Narrow<TAbi>;
	txHash: EIP1193DATA;
	txOrigin?: EIP1193Account;
	nonce?: EIP1193DATA;
	bytecode: EIP1193DATA;
	argsData: EIP1193DATA;
	metadata: string;
	libraries?: Libraries;
	deployedBytecode?: EIP1193DATA;
	linkReferences?: any;
	deployedLinkReferences?: any;
	devdoc?: any; // TODO type
	evm?: any; // TODO type
	storageLayout?: any; // TODO type
	userdoc?: any; // TODO type
};

export type Artifact<TAbi extends Abi = Abi> = {
	abi: TAbi;
	bytecode: EIP1193DATA;
	metadata: string;
	deployedBytecode?: EIP1193DATA;
	linkReferences?: any;
	deployedLinkReferences?: any;
	devdoc?: any; // TODO type
	evm?: any; // TODO type
	storageLayout?: any; // TODO type
	userdoc?: any; // TODO type
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
	saveWhilePending<TAbi extends Abi = Abi>(
		name: string,
		pendingDeployment: PendingDeployment<TAbi>
	): Promise<Deployment<TAbi>>;
	get<TAbi extends Abi>(name: string): Deployment<TAbi> | undefined;
}

export type DeploymentConstruction<TAbi extends Abi, TChain extends Chain = Chain> = Omit<
	DeployContractParameters<TAbi, TChain>,
	'bytecode' | 'account' | 'abi'
> & {account: string | EIP1193Account; artifact: string | Artifact<TAbi>};

export type PartialDeployment<TAbi extends Abi = Abi> = Artifact<TAbi> & {
	txOrigin?: EIP1193Account;
	nonce?: EIP1193DATA;
	argsData: EIP1193DATA;
	libraries?: Libraries;
};

export type PendingDeployment<TAbi extends Abi = Abi> = DeploymentConstruction<TAbi> & {
	txHash: `0x${string}`;
	partialDeployment: PartialDeployment<TAbi>;
};
