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

/**
 * ONE call attached to a diamond event: the `_init` / `_calldata` pair of EIP-2535's
 * `diamondCut` (or an entry of the constructor's initializations on the first deploy),
 * delegatecalled in the diamond's storage context.
 *
 * - `{type: 'facet'}` finds `functionName` among the facets being cut in, and calls it there.
 * - `{type: 'artifact'}` deploys `artifact` deterministically (no constructor args) and calls
 *   `functionName` on it.
 */
export type DiamondCall<
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
> = ExecuteOptions<TAbi, TFunctionName, TArgs> | {type: 'facet'; functionName: string; args: unknown[]};

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
		 * The initialization call(s) attached to a cut (see {@link DiamondCall}).
		 *
		 * IT RIDES A CHANGE, IT IS NOT A CALL YOU SCHEDULE. A run that produces no facet
		 * cut performs no `diamondCut`, so nothing here is executed. Deploy scripts are
		 * re-run, and an initializer that fired on every re-run would not be idempotent.
		 * `@rocketh/proxy` gates its own `execute` the same way (nothing happens when the
		 * implementation is unchanged), and the two forms below mirror its two forms:
		 *
		 * - FLAT, a single {@link DiamondCall}: made on the first deploy AND again on every
		 *   later cut that changes something, with the same method and args.
		 * - EXPLICIT, `{init?, onUpgrade?}`: `init` is made only when the diamond is first
		 *   created (in the constructor's initializations), `onUpgrade` only on a later cut that
		 *   actually changes facets. Each names its own target, so they may call different
		 *   functions, even on different contracts. Anything that must run exactly once (an
		 *   initializer) belongs in `init`: in the flat form it would re-fire on every later cut.
		 *
		 * A value that mixes the two (a `type` / `functionName` next to `init` / `onUpgrade`)
		 * is refused. There is no form that runs a call on a run that cuts nothing.
		 */
		execute?:
			| DiamondCall<TAbi, TFunctionName, TArgs>
			| {init?: DiamondCall<TAbi, TFunctionName, TArgs>; onUpgrade?: DiamondCall<TAbi, TFunctionName, TArgs>};
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
