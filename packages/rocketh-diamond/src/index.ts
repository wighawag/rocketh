import type {Abi, Artifact, Deployment, Environment} from '@rocketh/core/types';

import {encodeFunctionData, zeroAddress} from 'viem';
import {logs} from 'named-logs';
import artifactPureDiamond from './hardhat-deploy-v1-artifacts/Diamond.js';
import artifactDiamondLoupeFact from './hardhat-deploy-v1-artifacts/DiamondLoupeFacet.js';
import artifactDiamondCutFact from './hardhat-deploy-v1-artifacts/DiamondCutFacet.js';
import artifactOwnershipFacet from './hardhat-deploy-v1-artifacts/OwnershipFacet.js';
import artifactDiamondERC165Init from './hardhat-deploy-v1-artifacts/DiamondERC165Init.js';
import {filterABI, mergeABIs, sigsFromABI, sameDiamondRecord} from './utils.js';
import {formatDiamondCutPlan, selectorSignatures} from './report.js';
import {deploy, DeployResult} from '@rocketh/deploy';

import {read, execute} from '@rocketh/read-execute';
import {DiamondDeploymentConstruction, DiamondDeployOptions, Facet, FacetCut, FacetCutAction} from './types.js';
import {toJSONCompatibleLinkedData} from '@rocketh/core/json';

const logger = logs('@rocketh/diamond');

export type {Abi, Artifact, Deployment, Environment};

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
	},
);
const artifactDiamond = {
	...artifactPureDiamond,
	abi: diamondAbi,
};

export function diamond(
	env: Environment,
): <TAbi extends Abi>(
	name: string,
	params: DiamondDeploymentConstruction<TAbi>,
	options: DiamondDeployOptions,
) => Promise<DeployResult<TAbi>> {
	const _read = read(env);
	const _deploy = deploy(env);
	const _execute = execute(env);
	return async <TAbi extends Abi>(
		name: string,
		params: DiamondDeploymentConstruction<TAbi>,
		options: DiamondDeployOptions,
	) => {
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
		const deployerAddress = env.resolveAccount(account);

		const alwaysOverride = options && 'alwaysOverride' in options && options.alwaysOverride;
		const strictBytecodeMatch =
			!alwaysOverride && options && 'strictBytecodeMatch' in options && options.strictBytecodeMatch;
		const skipIfAlreadyDeployed = alwaysOverride ? false : true;

		const expectedOwner = options?.owner || deployerAddress;

		const newSelectors: string[] = [];
		const facetSnapshot: Facet[] = [];
		let oldFacets: readonly Facet[] = [];
		if (proxy) {
			oldFacets = await _read(proxy as unknown as Deployment<DiamondLoupeABI>, {
				functionName: 'facets',
			});
		}
		// console.log({ oldFacets: JSON.stringify(oldFacets, null, "  ") });

		// A COPY: the default facets are appended below, and appending them to the caller's own
		//  array mutates the options object they passed. Reusing one options object across two
		//  `diamond(...)` calls then appends the defaults twice, which puts the same selector in
		//  one Add cut twice and reverts on chain (`mergeABIs({check: true})` may throw first).
		const facetsSet = [...options.facets];

		// A default facet is installed unless the caller EXPLICITLY opted out, so `undefined`
		//  means installed. The ERC-165 interface list further down must use the SAME rule:
		//  reading these flags for plain truthiness there advertised neither interface under the
		//  default (omitted) config while installing both facets.
		const withDefaultCutFacet = options?.defaultCutFacet === undefined || options.defaultCutFacet;
		const withDefaultOwnershipFacet = options?.defaultOwnershipFacet === undefined || options.defaultOwnershipFacet;

		if (withDefaultCutFacet) {
			facetsSet.push({
				name: '_DefaultDiamondCutFacet',
				artifact: artifactDiamondCutFact,
				args: [],
				deterministic: true,
			});
		}
		if (withDefaultOwnershipFacet) {
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
		let executionFacetFound: {address: `0x${string}`; artifact: Artifact} | undefined;
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

			const implementation = await _deploy<typeof artifact.abi>(
				facetName,
				{
					...params,
					account: deployerAddress,
					artifact,
					args: facetArgs,
				},
				{
					libraries,
					linkedData,
					deterministic: deterministicFacet,
					alwaysOverride: deterministicFacet ? false : alwaysOverride,
					strictBytecodeMatch,
				},
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
							executionFacetFound = {address: facetAddress, artifact: facet.artifact};
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
			if (options.execute.type === 'artifact') {
				const executionDeployment = await _deploy(
					'', // we do not save it as it is deterministic anyway
					{
						...params,
						artifact: options.execute.artifact,
						args: [], // we expect artifact use for execute to have no contructor args
						// TODO support these with constructor arguments ?
					},
					{
						deterministic: true,
					},
				);

				executeAddress = executionDeployment.address;

				executeData = encodeFunctionData({
					abi: executionDeployment.abi,
					functionName: options.execute.functionName,
					args: options.execute.args,
				});
			} else if (options.execute.type === 'facet') {
				if (!executionFacetFound) {
					throw new Error('Facet not found for execute');
				} else {
					executeData = encodeFunctionData({
						abi: executionFacetFound.artifact.abi,
						functionName: options.execute.functionName,
						args: options.execute.args,
					});
					executeAddress = executionFacetFound.address;
				}
			}
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
				if (withDefaultCutFacet) {
					interfaceList.push('0x1f931c1c');
				}
				if (withDefaultOwnershipFacet) {
					interfaceList.push('0x7f5828d0');
				}

				if (initializationsArgIndex >= 0 || erc165InitArgIndex >= 0) {
					// TODO:TMP
					const diamondERC165InitDeployment = await _deploy(
						'_DefaultDiamondERC165Init',
						{
							...params,
							artifact: artifactDiamondERC165Init,
							args: [],
						},
						{deterministic: true},
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

				// `executeData` is the STRING '0x' when there is no `execute`, and that is truthy: the
				//  guard here used to be `if (executeData)`, so a diamond with no `execute` at all still
				//  entered this block and, given custom `diamondContractArgs` carrying no init
				//  placeholder, threw "even though execute is set in option" at a caller who had set no
				//  such option. The placeholders must still be SUBSTITUTED when there is no call (an
				//  unreplaced '{init}' string would reach the constructor encoder), so only the throw
				//  hangs off there actually being one.
				const hasInitCall = executeData !== '0x';
				if (initializationsArgIndex >= 0) {
					if (hasInitCall) {
						diamondConstructorArgs[initializationsArgIndex].push({
							initContract: executeAddress,
							initData: executeData,
						});
					}
				} else if (initArgIndex >= 0) {
					diamondConstructorArgs[initArgIndex] = {
						initContract: executeAddress,
						initData: executeData,
					};
				} else if (initDataArgIndex >= 0) {
					diamondConstructorArgs[initDataArgIndex] = executeData;
					if (initAddressArgIndex >= 0) {
						diamondConstructorArgs[initAddressArgIndex] = executeAddress;
					}
				} else if (hasInitCall) {
					throw new Error(`no {init} or {initData} found in list of args even though execute is set in option`);
				}

				let salt = '0x0000000000000000000000000000000000000000000000000000000000000000';
				if (typeof options.deterministicSalt !== 'undefined') {
					if (typeof options.deterministicSalt === 'string') {
						if (options.deterministicSalt === salt) {
							throw new Error(
								`deterministicSalt cannot be 0x000..., it needs to be a non-zero bytes32 salt. This is to ensure you are explicitly specifying different addresses for multiple diamonds`,
							);
						}
						if (options.deterministicSalt.length !== 66) {
							throw new Error(
								`deterministicSalt needs to be a string of 66 hexadecimal characters (including the 0x prefix)`,
							);
						}
						salt = options.deterministicSalt;
					} else {
						throw new Error(`deterministicSalt need to be a string, an non-zero bytes32 salt`);
					}
				}

				proxy = await _deploy(
					proxyName,
					{
						...params,
						artifact: artifactDiamond as unknown as Artifact<DiamondABI>,
						args: diamondConstructorArgs as any,
					},
					{
						deterministic: options.deterministicSalt,
						alwaysOverride,
						strictBytecodeMatch: false,
						skipIfAlreadyDeployed,
					},
				);

				await env.save<TAbi>(
					name,
					{
						...proxy,
						abi,
						linkedData: toJSONCompatibleLinkedData(options.linkedData),
						facets: facetSnapshot,
						execute: options.execute,
					},
					{
						considerItAsFreshDeployment: proxy.newlyDeployed ? false : true,
					},
				);
			} else {
				if (!oldDeployment) {
					throw new Error(`Cannot find Deployment for ${name}`);
				}
				const currentOwner = await _read(proxy as unknown as Deployment<OwnershipFacetABI>, {
					functionName: 'owner',
				});
				if (currentOwner.toLowerCase() !== expectedOwner.toLowerCase()) {
					throw new Error('To change owner, you need to call `transferOwnership`');
				}
				if (currentOwner === zeroAddress) {
					throw new Error('The Diamond belongs to no-one. It cannot be upgraded anymore');
				}

				// SAY WHAT THE CUT WILL DO, BEFORE DOING IT. The selector diff is declarative, so
				//  anything the declared facet set does not produce is REMOVED: a typo, a
				//  commented-out facet or a half-finished refactor deletes live functions, and the
				//  worst case removes the only way to upgrade. Until now the transaction went out with
				//  nothing printed and the selectors were four-byte hex inside the calldata.
				//
				//  The signatures come from BOTH ABIs on purpose: the merged new one names what is
				//  arriving, and the old deployment's names what is leaving, which by definition is no
				//  longer in the new one.
				const plan = formatDiamondCutPlan(name, facetCuts, selectorSignatures([abi, oldDeployment.abi as Abi]));
				if (plan) {
					env.showMessage(plan);
				}

				await _execute(proxy as unknown as Deployment<DiamondCutABI>, {
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
					linkedData: toJSONCompatibleLinkedData(options.linkedData),
					libraries: options.libraries,
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
			// THE RECORD DESCRIBES THE CHAIN, NOT THIS RUN.
			//
			//  `changesDetected` answers "is there a cut to perform?", correctly and from the
			//  on-chain loupe rather than from this record. Saving only inside it answers a
			//  DIFFERENT question: "did THIS run change anything?". The two come apart whenever
			//  the cut happens somewhere else, which for a governed diamond is always: the run
			//  that wants the cut throws at `_execute` before saving, and the run after it finds
			//  the facets already correct and takes this branch. Until now this branch wrote
			//  nothing, so the record kept the old facet addresses and the old merged ABI
			//  indefinitely, and that record is what `@rocketh/export` ships to a frontend and
			//  what `env.get<Abi>()` hands the next script.
			//
			//  Guarded, because `env.save` bumps `numDeployments` and rewrites the file. That
			//  counter means "how many times the recorded deployment CHANGED", so a cut rocketh
			//  is only now observing must tick it while an ordinary converged re-run must not.
			//  The comparison covers the facet snapshot as well as the ABI: replacing a facet
			//  with a new build of the same contract moves the addresses while leaving the ABI
			//  byte-identical, and an ABI-only check would call that unchanged.
			if (proxy && oldDeployment && !sameDiamondRecord(oldDeployment, {abi, facets: facetSnapshot})) {
				await env.save<TAbi>(name, {
					...(oldDeployment as Deployment<TAbi>),
					linkedData: toJSONCompatibleLinkedData(options.linkedData),
					libraries: options.libraries,
					address: proxy.address,
					abi,
					facets: facetSnapshot,
					execute: options.execute,
				});
			}

			const deployment = await env.get<TAbi>(name);
			return {
				...deployment,
				newlyDeployed: false,
			};
		}
	};
}
