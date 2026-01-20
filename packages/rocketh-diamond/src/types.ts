import type {DeployOptions} from '@rocketh/deploy';
import type {EIP1193Account} from 'eip-1193';
import type {
	Artifact,
	Deployment,
	DeploymentConstruction,
	Libraries,
	Abi,
	LinkedDataProvided,
} from '@rocketh/core/types';
import type {ContractFunctionArgs, ContractFunctionName, WriteContractParameters} from 'viem';

export type Facet = {
	facetAddress: `0x${string}`;
	functionSelectors: readonly `0x${string}`[];
};

export enum FacetCutAction {
	Add,
	Replace,
	Remove,
}

export type FacetCut = Facet & {
	action: FacetCutAction;
};

export type FacetOptions = {
	name?: string;
	artifact: Artifact;
	args?: any[];
	linkedData?: LinkedDataProvided;
	libraries?: Libraries;
	deterministic?: boolean | `0x${string}`;
};
export type DiamondFacets = Array<FacetOptions>;

export type ExecutionArgs<
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
	TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'nonpayable' | 'payable',
		TFunctionName
	>,
> = Pick<WriteContractParameters<TAbi, TFunctionName, TArgs>, 'args' | 'functionName'>;

export type ExecuteOptions<
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
	TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'nonpayable' | 'payable',
		TFunctionName
	>,
> = ExecutionArgs<TAbi, TFunctionName, TArgs> & {
	type: 'artifact';
	artifact: Artifact<TAbi>;
};

export type DiamondDeployOptions<
	TAbi extends Abi = Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'> = ContractFunctionName<
		TAbi,
		'nonpayable' | 'payable'
	>,
	TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'nonpayable' | 'payable',
		TFunctionName
	>,
> = Omit<DeployOptions, 'skipIfAlreadyDeployed' | 'alwaysOverride' | 'deterministic'> & {
	facets: DiamondFacets;
	owner?: EIP1193Account;
	execute?: ExecuteOptions<TAbi, TFunctionName, TArgs> | {type: 'facet'; functionName: string; args: any[]};
	defaultCutFacet?: boolean;
	defaultOwnershipFacet?: boolean;
	diamondContractArgs?: any[];
	excludeSelectors?: {
		[facetName: string]: `0x${string}`[];
	};
	facetsArgs?: any[];
	deterministicSalt?: `0x${string}`;
};

// TODO omit nonce ? // TODO omit chain ? same for rocketh-deploy
export type DiamondDeploymentConstruction<TAbi extends Abi> = Omit<
	DeploymentConstruction<TAbi>,
	'artifact' | 'args'
> & {
	artifact?: Artifact;
};

export type DeployViaDiamondFunction = <TAbi extends Abi>(
	name: string,
	params: DiamondDeploymentConstruction<TAbi>,
	options: DiamondDeployOptions,
) => Promise<Deployment<TAbi> & {newlyDeployed: boolean}>;
