import {Abi, AbiFunction} from 'abitype';
import type {Artifact, DeploymentConstruction, Deployment, Environment, Libraries} from 'rocketh';
import '@rocketh/deploy';
import '@rocketh/read-execute';
import type {EIP1193Account} from 'eip-1193';
import {extendEnvironment} from 'rocketh';
import {Chain, encodeFunctionData} from 'viem';
import {logs} from 'named-logs';
import artifactDiamond from './hardhat-deploy-v1-artifacts/Diamond.js';
import artifactDiamondLoupeFact from './hardhat-deploy-v1-artifacts/DiamondLoupeFacet.js';
import artifactDiamondCutFact from './hardhat-deploy-v1-artifacts/DiamondCutFacet.js';
import artifactOwnershipFacet from './hardhat-deploy-v1-artifacts/OwnershipFacet.js';

const logger = logs('@rocketh/diamond');

type DiamondABI = typeof artifactDiamond.abi;

export type Facet = {
	facetAddress: string;
	functionSelectors: string[];
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
	name: string;
	contract: Artifact;
	args?: any[];
	linkedData?: any; // JSONable ?
	libraries?: Libraries;
	deterministic?: boolean | `0x${string}`;
};
export type DiamondFacets = Array<FacetOptions>;

export type DiamondDeployOptions = {
	linkedData?: any;
	disabled?: boolean;
	owner?: EIP1193Account;
	execute?: string;
	defaultCutFacet?: boolean;
	defaultOwnershipFacet?: boolean;
	excludeSelectors?: {
		[facetName: string]: string[];
	};
	libraries?: Libraries;
	facetsArgs?: any[];
};

// TODO omit nonce ? // TODO omit chain ? same for rocketh-deploy
export type DiamondDeploymentConstruction<TAbi extends Abi> = Omit<DeploymentConstruction<TAbi>, 'artifact'> & {
	facets: DiamondFacets;
};

export type DeployViaProxyFunction = <TAbi extends Abi>(
	name: string,
	params: DiamondDeploymentConstruction<TAbi>,
	options?: DiamondDeployOptions
) => Promise<Deployment<TAbi>>;

declare module 'rocketh' {
	interface Environment {
		diamond: DeployViaProxyFunction;
	}
}

extendEnvironment((env: Environment) => {
	async function diamond<TAbi extends Abi, TChain extends Chain = Chain>(
		name: string,
		params: DiamondDeploymentConstruction<TAbi>,
		options?: DiamondDeployOptions
	): Promise<Deployment<TAbi>> {
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

		const {account, args, ...viemArgs} = params;
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
		let oldFacets: Facet[] = [];
		if (proxy) {
			oldFacets = await env.read(proxy, {functionName: 'facets'});
		}
		// console.log({ oldFacets: JSON.stringify(oldFacets, null, "  ") });

		const facetsSet = [...params.facets];
		if (options?.defaultCutFacet === undefined || options.defaultCutFacet) {
			facetsSet.push({
				name: '_DefaultDiamondCutFacet',
				contract: artifactDiamondCutFact,
				args: [],
				deterministic: true,
			});
		}
		if (options?.defaultOwnershipFacet === undefined || options.defaultOwnershipFacet) {
			facetsSet.push({
				name: '_DefaultDiamondOwnershipFacet',
				contract: artifactOwnershipFacet,
				args: [],
				deterministic: true,
			});
		}
		facetsSet.push({
			name: '_DefaultDiamondLoupeFacet',
			contract: artifactDiamondLoupeFact,
			args: [],
			deterministic: true,
		});

		let changesDetected = !oldDeployment;
		let abi: any[] = artifactDiamond.abi.concat([]);
		const facetCuts: FacetCut[] = [];
		let facetFound: string | undefined;
		const excludeSelectors: Record<string, string[]> = options?.excludeSelectors || {};
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
			const artifact = facet.contract;

			const facetName = facet.name;
			const constructor = artifact.abi.find((fragment) => fragment.type === 'constructor');
			if (!argsSpecific && (!constructor || constructor.inputs.length === 0)) {
				// reset args for case where facet do not expect any and there was no specific args set on it
				facetArgs = [];
			}
			let excludeSighashes: Set<string> = new Set();
			if (facetName in excludeSelectors) {
				const iface = new Interface(artifact.abi);
				excludeSighashes = new Set(excludeSelectors[facetName].map((selector) => iface.getSighash(selector)));
			}
			abi = mergeABIs([abi, filterABI(artifact.abi, excludeSighashes)], {
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

			let facetAddress: string;
			// TODO updated, check if it is correct, seem to be trigger if linkedData get updated
			if (implementation.updated) {
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

			// TODO
			// if (options.execute && !options.execute.contract) {
			// 	const methods = artifact.abi.filter((v) => v.name === options.execute?.methodName);
			// 	if (methods.length > 0) {
			// 		if (methods.length > 1) {
			// 			throw new Error(`multiple method named "${options.execute.methodName}" found in facet`);
			// 		} else {
			// 			if (facetFound) {
			// 				throw new Error(`multiple facet with method named "${options.execute.methodName}"`);
			// 			} else {
			// 				facetFound = facetAddress;
			// 			}
			// 		}
			// 	}
			// }
		}

		const oldSelectors: string[] = [];
		const oldSelectorsFacetAddress: {[selector: string]: string} = {};
		for (const oldFacet of oldFacets) {
			for (const selector of oldFacet.functionSelectors) {
				oldSelectors.push(selector);
				oldSelectorsFacetAddress[selector] = oldFacet.facetAddress;
			}
		}

		for (const newFacet of facetSnapshot) {
			const selectorsToAdd: string[] = [];
			const selectorsToReplace: string[] = [];

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

		const selectorsToDelete: string[] = [];
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

		// TODO
		// let executeData = '0x';
		// let executeAddress = '0x0000000000000000000000000000000000000000';
		// if (options.execute) {
		// 	let addressSpecified: string | undefined;
		// 	let executionContract = new Contract('0x0000000000000000000000000000000000000001', abi);
		// 	if (options.execute.contract) {
		// 		if (typeof options.execute.contract === 'string') {
		// 			const executionDeployment = await _deployOne(options.execute.contract, {
		// 				from: options.from,
		// 				autoMine: options.autoMine,
		// 				estimateGasExtra: options.estimateGasExtra,
		// 				estimatedGasLimit: options.estimatedGasLimit,
		// 				gasPrice: options.gasPrice,
		// 				maxFeePerGas: options.maxFeePerGas,
		// 				maxPriorityFeePerGas: options.maxPriorityFeePerGas,
		// 				log: options.log,
		// 				deterministicDeployment: true,
		// 			});
		// 			executionContract = new Contract(executionDeployment.address, executionDeployment.abi);
		// 			addressSpecified = executionContract.address;
		// 		} else {
		// 			const executionDeployment = await _deployOne(options.execute.contract.name, {
		// 				from: options.from,
		// 				contract: options.execute.contract.artifact,
		// 				args: options.execute.contract.args,
		// 				autoMine: options.autoMine,
		// 				estimateGasExtra: options.estimateGasExtra,
		// 				estimatedGasLimit: options.estimatedGasLimit,
		// 				gasPrice: options.gasPrice,
		// 				maxFeePerGas: options.maxFeePerGas,
		// 				maxPriorityFeePerGas: options.maxPriorityFeePerGas,
		// 				log: options.log,
		// 				deterministicDeployment: true,
		// 			});
		// 			executionContract = new Contract(executionDeployment.address, executionDeployment.abi);
		// 		}
		// 	}
		// 	const txData = await executionContract.populateTransaction[options.execute.methodName](...options.execute.args);
		// 	executeData = txData.data || '0x';
		// 	executeAddress = addressSpecified || facetFound || '0x0000000000000000000000000000000000000000';
		// }

		if (changesDetected) {
			if (!proxy) {
				const diamondConstructorArgs = options.diamondContractArgs || ['{owner}', '{facetCuts}', '{initializations}'];

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
				const interfaceList = ['0x48e2b093'];
				if (options?.defaultCutFacet) {
					interfaceList.push('0x1f931c1c');
				}
				if (options?.defaultOwnershipFacet) {
					interfaceList.push('0x7f5828d0');
				}

				if (initializationsArgIndex >= 0 || erc165InitArgIndex >= 0) {
					// TODO:TMP
					const diamondERC165InitDeployment = await env.deploy('_DefaultDiamondERC165Init', {});
					const diamondERC165InitDeployment = await _deployOne('_DefaultDiamondERC165Init', {
						from: options.from,
						deterministicDeployment: true,
						contract: diamondERC165Init,
						autoMine: options.autoMine,
						estimateGasExtra: options.estimateGasExtra,
						estimatedGasLimit: options.estimatedGasLimit,
						gasPrice: options.gasPrice,
						maxFeePerGas: options.maxFeePerGas,
						maxPriorityFeePerGas: options.maxPriorityFeePerGas,
						log: options.log,
					});
					const diamondERC165InitContract = new Contract(
						diamondERC165InitDeployment.address,
						diamondERC165InitDeployment.abi
					);
					const interfaceInitTx = await diamondERC165InitContract.populateTransaction.setERC165(interfaceList, []);
					if (initializationsArgIndex >= 0) {
						const initializations = [];
						initializations.push({
							initContract: interfaceInitTx.to,
							initData: interfaceInitTx.data,
						});
						diamondConstructorArgs[initializationsArgIndex] = initializations;
					} else {
						diamondConstructorArgs[erc165InitArgIndex] = {
							initContract: interfaceInitTx.to,
							initData: interfaceInitTx.data,
						};
					}
				}

				if (ownerArgIndex >= 0) {
					diamondConstructorArgs[ownerArgIndex] = owner;
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

				let deterministicDiamondAlreadyDeployed = false;
				let expectedAddress: string | undefined = undefined;
				let salt = '0x0000000000000000000000000000000000000000000000000000000000000000';
				if (typeof options.deterministicSalt !== 'undefined') {
					if (typeof options.deterministicSalt === 'string') {
						if (options.deterministicSalt === salt) {
							throw new Error(
								`deterministicSalt cannot be 0x000..., it needs to be a non-zero bytes32 salt. This is to ensure you are explicitly specifying different addresses for multiple diamonds`
							);
						} else {
							if (options.deterministicSalt.length !== 66) {
								throw new Error(
									`deterministicSalt needs to be a string of 66 hexadecimal characters (including the 0x prefix)`
								);
							}
							salt = options.deterministicSalt;

							const factory = new DeploymentFactory(getArtifact, diamondArtifact, diamondConstructorArgs, network);

							const create2DeployerAddress = await deploymentManager.getDeterministicDeploymentFactoryAddress();
							expectedAddress = await factory.getCreate2Address(create2DeployerAddress, salt);
							const code = await provider.getCode(expectedAddress);
							if (code !== '0x') {
								deterministicDiamondAlreadyDeployed = true;
							}
						}
					} else {
						throw new Error(`deterministicSalt need to be a string, an non-zero bytes32 salt`);
					}
				}

				if (expectedAddress && deterministicDiamondAlreadyDeployed) {
					proxy = {
						...diamondArtifact,
						address: expectedAddress,
						args: diamondConstructorArgs,
					};
					await saveDeployment(proxyName, proxy);
					await saveDeployment(name, {
						...proxy,
						linkedData: options.linkedData,
						facets: facetSnapshot,
						abi,
					});
					await _deployViaDiamondProxy(name, options); // this would not recurse again as the name and proxyName are now saved
				} else {
					proxy = await _deployOne(proxyName, {
						contract: diamondArtifact,
						from: options.from,
						args: diamondConstructorArgs,
						autoMine: options.autoMine,
						deterministicDeployment: options.deterministicSalt,
						estimateGasExtra: options.estimateGasExtra,
						estimatedGasLimit: options.estimatedGasLimit,
						gasLimit: options.gasLimit,
						gasPrice: options.gasPrice,
						log: options.log,
						nonce: options.nonce,
						maxFeePerGas: options.maxFeePerGas,
						maxPriorityFeePerGas: options.maxPriorityFeePerGas,
						value: options.value,
					});

					await saveDeployment(proxyName, {...proxy, abi});
					await saveDeployment(name, {
						...proxy,
						linkedData: options.linkedData,
						facets: facetSnapshot,
						abi,
						execute: options.execute,
					});
				}
			} else {
				if (!oldDeployment) {
					throw new Error(`Cannot find Deployment for ${name}`);
				}
				const currentOwner = await read(proxyName, 'owner');
				if (currentOwner.toLowerCase() !== owner.toLowerCase()) {
					throw new Error('To change owner, you need to call `transferOwnership`');
				}
				if (currentOwner === AddressZero) {
					throw new Error('The Diamond belongs to no-one. It cannot be upgraded anymore');
				}

				const executeReceipt = await execute(
					name,
					{...options, from: currentOwner},
					'diamondCut',
					facetCuts,
					executeData === '0x' ? '0x0000000000000000000000000000000000000000' : executeAddress || proxy.address, // TODO  || proxy.address should not be required, the facet should have been found
					executeData
				);
				if (!executeReceipt) {
					throw new Error('failed to execute');
				}

				const diamondDeployment: DeploymentSubmission = {
					...oldDeployment,
					linkedData: options.linkedData,
					address: proxy.address,
					abi,
					facets: facetSnapshot,
					execute: options.execute, // TODO add receipt + tx hash
				};

				// TODO reenable history with options
				if (oldDeployment.history) {
					diamondDeployment.history = diamondDeployment.history
						? diamondDeployment.history.concat([oldDeployment])
						: [oldDeployment];
				}

				await saveDeployment(name, diamondDeployment);
			}

			const deployment = await partialExtension.get(name);
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

			const deployment = await partialExtension.get(name);
			return {
				...deployment,
				newlyDeployed: false,
			};
		}
	}

	env.diamond = diamond;
	return env;
});
