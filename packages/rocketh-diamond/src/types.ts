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

export type {Artifact, Deployment, DeploymentConstruction, Libraries, Abi, LinkedDataProvided};
export type {ContractFunctionArgs, ContractFunctionName, WriteContractParameters};

type DeployMutuallyExclusiveOptions = {alwaysOverride?: boolean} | {strictBytecodeMatch?: boolean};

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
> = Omit<DeployOptions, 'skipIfAlreadyDeployed' | 'alwaysOverride' | 'deterministic' | 'strictBytecodeMatch'> &
	DeployMutuallyExclusiveOptions & {
		facets: DiamondFacets;
		owner?: EIP1193Account;
		/**
		 * The initialization call attached to a cut: the `_init` / `_calldata` pair of
		 * EIP-2535's `diamondCut`, delegatecalled in the diamond's storage context.
		 *
		 * IT RIDES A CHANGE, IT IS NOT A CALL YOU SCHEDULE. A run that produces no facet
		 * cut performs no `diamondCut`, so this is not executed. Deploy scripts are
		 * re-run, and an initializer that fired on every re-run would not be idempotent.
		 * `@rocketh/proxy` gates its own `execute` the same way (nothing happens when the
		 * implementation is unchanged), and this is the flat form of that option: the call
		 * is made on the fresh deploy AND on every later cut, with the same args.
		 *
		 * A migration that must run exactly once, or only on upgrades, is therefore NOT
		 * expressible yet: that is the `{init, onUpgrade}` split `@rocketh/proxy` already
		 * has. See `work/notes/ideas/diamond-execute-init-on-upgrade.md`.
		 */
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

/**
 * NO `artifact`: the base diamond deployed here is always this package's bundled one.
 *
 * This type used to accept an optional `artifact` that the deploy path then IGNORED (it
 * always passes the bundled `artifactDiamond`), so a caller could believe they had
 * replaced the diamond base (with an independently audited one, say) while the
 * bundled implementation was what landed on chain. Supporting a user-provided base is a
 * real feature, tracked in `work/notes/ideas/custom-diamond-base-artifact.md`; until it
 * exists the type does not promise it.
 */
// TODO omit nonce ? // TODO omit chain ? same for rocketh-deploy
export type DiamondDeploymentConstruction<TAbi extends Abi> = Omit<DeploymentConstruction<TAbi>, 'artifact' | 'args'>;

export type DeployViaDiamondFunction = <TAbi extends Abi>(
	name: string,
	params: DiamondDeploymentConstruction<TAbi>,
	options: DiamondDeployOptions,
) => Promise<Deployment<TAbi> & {newlyDeployed: boolean}>;
