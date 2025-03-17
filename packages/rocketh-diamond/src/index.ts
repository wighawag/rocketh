import {Abi} from 'abitype';
import type {Artifact, DeploymentConstruction, Deployment, Environment, Libraries} from 'rocketh';
import '@rocketh/deploy';
import '@rocketh/read-execute';
import type {EIP1193Account} from 'eip-1193';
import {extendEnvironment} from 'rocketh';
import {
	ContractFunctionArgs,
	ContractFunctionName,
	encodeFunctionData,
	WriteContractParameters,
	zeroAddress,
} from 'viem';
import {logs} from 'named-logs';
import artifactPureDiamond from './hardhat-deploy-v1-artifacts/Diamond.js';
import artifactDiamondLoupeFact from './hardhat-deploy-v1-artifacts/DiamondLoupeFacet.js';
import artifactDiamondCutFact from './hardhat-deploy-v1-artifacts/DiamondCutFacet.js';
import artifactOwnershipFacet from './hardhat-deploy-v1-artifacts/OwnershipFacet.js';
import artifactDiamondERC165Init from './hardhat-deploy-v1-artifacts/DiamondERC165Init.js';
import {filterABI, mergeABIs, sigsFromABI} from './utils.js';
import {DeployOptions} from '@rocketh/deploy';

const logger = logs('@rocketh/diamond');

type OwnershipFacetABI = typeof artifactOwnershipFacet.abi;
type DiamondLoupeABI = typeof artifactDiamondLoupeFact.abi;
type DiamondCutABI = typeof artifactDiamondCutFact.abi;
type PureDiamondABI = typeof artifactPureDiamond.abi;

// TODO merge type of PureDiamondABI & OwnershipFacetABI & DiamondLoupeABI & DiamondCutABI;
type DiamondABI = PureDiamondABI;
const diamondAbi = mergeABIs(
	[artifactPureDiamond.abi, artifactOwnershipFacet.abi, artifactDiamondLoupeFact.abi, artifactDiamondCutFact.abi],
	{
		check: true,
		skipSupportsInterface: true,
	}
);
const artifactDiamond = {
	...artifactPureDiamond,
	abi: diamondAbi,
};

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
	linkedData?: any; // JSONable ?
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
	>
> = Pick<WriteContractParameters<TAbi, TFunctionName, TArgs>, 'args' | 'functionName'>;

export type ExecuteOptions<
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
	TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'nonpayable' | 'payable',
		TFunctionName
	>
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
	>
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
	options: DiamondDeployOptions
) => Promise<Deployment<TAbi> & {newlyDeployed: boolean}>;

declare module 'rocketh' {
	interface Environment {
		diamond: DeployViaDiamondFunction;
	}
}

extendEnvironment((env: Environment) => {
	async function diamond<TAbi extends Abi>(
		name: string,
		params: DiamondDeploymentConstruction<TAbi>,
		options: DiamondDeployOptions
	): Promise<Deployment<TAbi> & {newlyDeployed: boolean}> {
		let proxy: Deployment<DiamondABI> | undefined;
		const proxyName = `${name}_DiamondProxy`;

		const oldDeployment = env.getOrNull(name);
		if (oldDeployment) {
			proxy = env.get<DiamondABI>(proxyName);
		}
		// TODO ?
		// if (proxy && proxy.deployedBytecode === oldDiamonBase.deployedBytecode) {
		// return _old_deployViaDiamondProxy(name, options);
		// }

		const {account, ...viemArgs} = params;
		let deployerAddress: `0x${string}`;
		if (account.startsWith('0x')) {
			deployerAddress = account as `0x${string}`;
		} else {
			if (env.namedAccounts) {
				deployerAddress = env.namedAccounts[account];
				if (!deployerAddress) {
					throw new Error(`no address for ${account}`);
				}
			} else {
				throw new Error(`no accounts setup, cannot get address for ${account}`);
			}
		}

		// TODO
		// if (options.diamondContract) {
		// 	diamondArtifact = options.diamondContract;
		// }

		const expectedOwner = options?.owner || deployerAddress;

		const newSelectors: string[] = [];
		const facetSnapshot: Facet[] = [];
		let oldFacets: readonly Facet[] = [];
		if (proxy) {
			oldFacets = await env.read(proxy as unknown as Deployment<DiamondLoupeABI>, {
				functionName: 'facets',
			});
		}
		// console.log({ oldFacets: JSON.stringify(oldFacets, null, "  ") });

		const facetsSet = options.facets;
		if (options?.defaultCutFacet === undefined || options.defaultCutFacet) {
			facetsSet.push({
				name: '_DefaultDiamondCutFacet',
				artifact: artifactDiamondCutFact,
				args: [],
				deterministic: true,
			});
		}
		if (options?.defaultOwnershipFacet === undefined || options.defaultOwnershipFacet) {
			facetsSet.push({
				name: '_DefaultDiamondOwnershipFacet',
				artifact: artifactOwnershipFacet,
				args: [],
				deterministic: true,
			});
		}
		facetsSet.push({
			name: '_DefaultDiamondLoupeFacet',
			artifact: artifactDiamondLoupeFact,
			args: [],
			deterministic: true,
		});

		let changesDetected = !oldDeployment;
		// will be populated
		let abi: TAbi = artifactPureDiamond.abi.concat([]) as unknown as TAbi;
		const facetCuts: FacetCut[] = [];
		let executionFacetFound: `0x${string}` | undefined;
		const excludeSelectors: Record<string, `0x${string}`[]> = options?.excludeSelectors || {};
		let i = 0;
		for (const facet of facetsSet) {
			let deterministicFacet: `0x${string}` | boolean = true;

			let linkedData = options?.linkedData;
			let libraries = options?.libraries;
			let facetArgs = options?.facetsArgs;
			if (typeof facet !== 'string') {
				if (facet.deterministic !== undefined) {
					deterministicFacet = facet.deterministic;
				}
			}
			let argsSpecific = false;

			if (facet.linkedData) {
				linkedData = facet.linkedData;
			}
			if (facet.libraries) {
				libraries = facet.libraries;
			}
			if (facet.args !== undefined) {
				// TODO fix in master
				facetArgs = facet.args;
				argsSpecific = true;
			}
			const artifact = facet.artifact;

			const facetName = facet.name || artifact.contractName;
			if (!facetName) {
				throw new Error(`artifact for facet at index: ${i} has no name, specify a name for the facet`);
			}
			const constructor = artifact.abi.find((fragment) => fragment.type === 'constructor');
			if (!argsSpecific && (!constructor || constructor.inputs.length === 0)) {
				// reset args for case where facet do not expect any and there was no specific args set on it
				facetArgs = [];
			}
			let excludeSighashes: Set<`0x${string}`> = new Set();
			if (facetName in excludeSelectors) {
				excludeSighashes = new Set(excludeSelectors[facetName]);
			}
			abi = mergeABIs<TAbi>([abi, filterABI(artifact.abi, excludeSighashes)], {
				check: true,
				skipSupportsInterface: false,
			});

			const implementation = await env.deploy<typeof artifact.abi>(
				facetName,
				{
					...params,
					account: deployerAddress,
					artifact,
					args: facetArgs,
				},
				{libraries, linkedData, deterministic: deterministicFacet}
			);

			let facetAddress: `0x${string}`;
			// TODO updated, check if it is correct, seem to be trigger if linkedData get updated
			if (implementation.newlyDeployed) {
				// console.log(`facet ${facet} deployed at ${implementation.address}`);
				facetAddress = implementation.address;
				const newFacet = {
					facetAddress,
					functionSelectors: sigsFromABI(filterABI(implementation.abi, excludeSighashes)),
				};
				facetSnapshot.push(newFacet);
				newSelectors.push(...newFacet.functionSelectors);
			} else {
				const oldImpl = env.get(facetName);
				facetAddress = oldImpl.address;
				const newFacet = {
					facetAddress,
					functionSelectors: sigsFromABI(filterABI(oldImpl.abi, excludeSighashes)),
				};
				facetSnapshot.push(newFacet);
				newSelectors.push(...newFacet.functionSelectors);
			}

			if (options.execute && options.execute.type == 'facet') {
				const methods = artifact.abi.filter((v) => (v as any).name === options.execute?.functionName);
				if (methods.length > 0) {
					if (methods.length > 1) {
						throw new Error(`multiple method named "${options.execute.functionName}" found in facet`);
					} else {
						if (executionFacetFound) {
							throw new Error(`multiple facet with method named "${options.execute.functionName}"`);
						} else {
							executionFacetFound = facetAddress;
						}
					}
				}
			}

			i++;
		}

		const oldSelectors: `0x${string}`[] = [];
		const oldSelectorsFacetAddress: {[selector: `0x${string}`]: `0x${string}`} = {};
		for (const oldFacet of oldFacets) {
			for (const selector of oldFacet.functionSelectors) {
				oldSelectors.push(selector);
				oldSelectorsFacetAddress[selector] = oldFacet.facetAddress;
			}
		}

		for (const newFacet of facetSnapshot) {
			const selectorsToAdd: `0x${string}`[] = [];
			const selectorsToReplace: `0x${string}`[] = [];

			for (const selector of newFacet.functionSelectors) {
				// TODO fix in master >0 to transform into >= 0
				if (oldSelectors.indexOf(selector) >= 0) {
					if (oldSelectorsFacetAddress[selector].toLowerCase() !== newFacet.facetAddress.toLowerCase()) {
						selectorsToReplace.push(selector);
					}
				} else {
					selectorsToAdd.push(selector);
				}
			}

			if (selectorsToReplace.length > 0) {
				changesDetected = true;
				facetCuts.push({
					facetAddress: newFacet.facetAddress,
					functionSelectors: selectorsToReplace,
					action: FacetCutAction.Replace,
				});
			}

			if (selectorsToAdd.length > 0) {
				changesDetected = true;
				facetCuts.push({
					facetAddress: newFacet.facetAddress,
					functionSelectors: selectorsToAdd,
					action: FacetCutAction.Add,
				});
			}
		}

		const selectorsToDelete: `0x${string}`[] = [];
		for (const selector of oldSelectors) {
			if (newSelectors.indexOf(selector) === -1) {
				selectorsToDelete.push(selector);
			}
		}

		if (selectorsToDelete.length > 0) {
			changesDetected = true;
			facetCuts.unshift({
				facetAddress: '0x0000000000000000000000000000000000000000',
				functionSelectors: selectorsToDelete,
				action: FacetCutAction.Remove,
			});
		}

		let executeData: `0x${string}` = '0x';
		let executeAddress: `0x${string}` = '0x0000000000000000000000000000000000000000';

		if (options.execute) {
			let addressSpecified: `0x${string}` | undefined;
			if (options.execute.type === 'artifact') {
				const executionDeployment = await env.deploy(
					'', // we do not save it as it is deterministic anyway
					{
						...params,
						artifact: options.execute.artifact,
						args: [], // we expect artifact use for execute to have no contructor args
						// TODO support these with constructor arguments ?
					},
					{
						deterministic: true,
					}
				);

				addressSpecified = executionDeployment.address;

				executeData = encodeFunctionData({
					abi: executionDeployment.abi,
					functionName: options.execute.functionName,
					args: options.execute.args,
				});
			}
			executeAddress = addressSpecified || executionFacetFound || '0x0000000000000000000000000000000000000000';
		}

		if (changesDetected) {
			if (!proxy) {
				const diamondConstructorArgs = options?.diamondContractArgs || ['{owner}', '{facetCuts}', '{initializations}'];

				const initializationsArgIndex = diamondConstructorArgs.indexOf('{initializations}');
				const erc165InitArgIndex = diamondConstructorArgs.indexOf('{erc165}');
				const initArgIndex = diamondConstructorArgs.indexOf('{init}');
				const initAddressArgIndex = diamondConstructorArgs.indexOf('{initAddress}');
				const initDataArgIndex = diamondConstructorArgs.indexOf('{initData}');
				const ownerArgIndex = diamondConstructorArgs.indexOf('{owner}');
				const facetCutsArgIndex = diamondConstructorArgs.indexOf('{facetCuts}');
				if (initializationsArgIndex >= 0 && (initArgIndex >= 0 || erc165InitArgIndex >= 0 || initDataArgIndex >= 0)) {
					throw new Error(`{initializations} found but also one or more of {init} {erc165} {initData}`);
				}

				// TODO option to add more to the list
				// else mechanism to set it up differently ? LoupeFacet without supportsInterface
				const interfaceList: `0x${string}`[] = ['0x48e2b093'];
				if (options?.defaultCutFacet) {
					interfaceList.push('0x1f931c1c');
				}
				if (options?.defaultOwnershipFacet) {
					interfaceList.push('0x7f5828d0');
				}

				if (initializationsArgIndex >= 0 || erc165InitArgIndex >= 0) {
					// TODO:TMP
					const diamondERC165InitDeployment = await env.deploy(
						'_DefaultDiamondERC165Init',
						{
							...params,
							artifact: artifactDiamondERC165Init,
							args: [],
						},
						{deterministic: true}
					);

					const interfaceInitCallData = encodeFunctionData({
						abi: artifactDiamondERC165Init.abi,
						functionName: 'setERC165',
						args: [interfaceList, []],
					});

					if (initializationsArgIndex >= 0) {
						const initializations = [];
						initializations.push({
							initContract: diamondERC165InitDeployment.address,
							initData: interfaceInitCallData,
						});
						diamondConstructorArgs[initializationsArgIndex] = initializations;
					} else {
						diamondConstructorArgs[erc165InitArgIndex] = {
							initContract: diamondERC165InitDeployment.address,
							initData: interfaceInitCallData,
						};
					}
				}

				if (ownerArgIndex >= 0) {
					diamondConstructorArgs[ownerArgIndex] = expectedOwner;
				} else {
					// TODO ?
				}

				if (facetCutsArgIndex >= 0) {
					diamondConstructorArgs[facetCutsArgIndex] = facetCuts;
				} else {
					throw new Error(`diamond constructor needs a {facetCuts} argument`);
				}

				if (executeData) {
					if (initializationsArgIndex >= 0) {
						if (executeData !== '0x') {
							diamondConstructorArgs[initializationsArgIndex].push({
								initContract: executeAddress,
								initData: executeData,
							});
						}
					} else {
						if (initArgIndex >= 0) {
							diamondConstructorArgs[initArgIndex] = {
								initContract: executeAddress,
								initData: executeData,
							};
						} else if (initDataArgIndex >= 0) {
							diamondConstructorArgs[initDataArgIndex] = executeData;
							if (initAddressArgIndex >= 0) {
								diamondConstructorArgs[initAddressArgIndex] = executeAddress;
							}
						} else {
							throw new Error(`no {init} or {initData} found in list of args even though execute is set in option`);
						}
					}
				}

				let salt = '0x0000000000000000000000000000000000000000000000000000000000000000';
				if (typeof options.deterministicSalt !== 'undefined') {
					if (typeof options.deterministicSalt === 'string') {
						if (options.deterministicSalt === salt) {
							throw new Error(
								`deterministicSalt cannot be 0x000..., it needs to be a non-zero bytes32 salt. This is to ensure you are explicitly specifying different addresses for multiple diamonds`
							);
						}
						if (options.deterministicSalt.length !== 66) {
							throw new Error(
								`deterministicSalt needs to be a string of 66 hexadecimal characters (including the 0x prefix)`
							);
						}
						salt = options.deterministicSalt;
					} else {
						throw new Error(`deterministicSalt need to be a string, an non-zero bytes32 salt`);
					}
				}

				proxy = await env.deploy(
					proxyName,
					{
						...params,
						artifact: artifactDiamond as unknown as Artifact<DiamondABI>,
						args: diamondConstructorArgs as any,
					},
					{
						deterministic: options.deterministicSalt,
						skipIfAlreadyDeployed: true,
					}
				);

				await env.save<TAbi>(
					name,
					{
						...proxy,
						abi,
						linkedData: options.linkedData,
						facets: facetSnapshot,
						execute: options.execute,
					},
					{
						doNotCountAsNewDeployment: proxy.newlyDeployed ? false : true,
					}
				);
			} else {
				if (!oldDeployment) {
					throw new Error(`Cannot find Deployment for ${name}`);
				}
				const currentOwner = await env.read(proxy as unknown as Deployment<OwnershipFacetABI>, {
					functionName: 'owner',
				});
				if (currentOwner.toLowerCase() !== expectedOwner.toLowerCase()) {
					throw new Error('To change owner, you need to call `transferOwnership`');
				}
				if (currentOwner === zeroAddress) {
					throw new Error('The Diamond belongs to no-one. It cannot be upgraded anymore');
				}

				const txHash = await env.execute(proxy as unknown as Deployment<DiamondCutABI>, {
					...params,
					account: expectedOwner,
					functionName: 'diamondCut',
					args: [
						facetCuts,
						executeData === '0x'
							? ('0x0000000000000000000000000000000000000000' as `0x${string}`)
							: executeAddress || proxy.address, // TODO  || proxy.address should not be required, the facet should have been found
						executeData,
					],
					value: undefined,
				});

				const diamondDeployment: Deployment<TAbi> = {
					...oldDeployment,
					linkedData: options.linkedData,
					address: proxy.address,
					abi,
					facets: facetSnapshot,
					execute: options.execute, // TODO add receipt + tx hash
				};

				// // TODO reenable history with options
				// if (oldDeployment.history && oldDeployment.history) {
				// 	diamondDeployment.history = diamondDeployment.history
				// 		? diamondDeployment.history.concat([oldDeployment])
				// 		: [oldDeployment];
				// }

				await env.save(name, diamondDeployment);
			}

			const deployment = env.get<TAbi>(name);
			return {
				...deployment,
				newlyDeployed: true,
			};
		} else {
			// const oldDeployment = await partialExtension.get(name);

			// const proxiedDeployment: DeploymentSubmission = {
			//   ...oldDeployment,
			//   facets: facetSnapshot,
			//   abi,
			//   execute: options.execute,
			// };
			// // TODO ?
			// // proxiedDeployment.history = proxiedDeployment.history
			// //   ? proxiedDeployment.history.concat([oldDeployment])
			// //   : [oldDeployment];
			// await saveDeployment(name, proxiedDeployment);

			const deployment = await env.get<TAbi>(name);
			return {
				...deployment,
				newlyDeployed: false,
			};
		}
	}

	env.diamond = diamond;
	return env;
});
