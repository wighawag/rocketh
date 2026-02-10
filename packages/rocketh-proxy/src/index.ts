import {Abi, AbiFunction} from 'abitype';
import type {Artifact, DeploymentConstruction, Deployment, Environment} from '@rocketh/core/types';
import {resolveAccount} from '@rocketh/core/account';
import type {EIP1193Account} from 'eip-1193';
import {Chain, encodeFunctionData, zeroAddress} from 'viem';
import {logs} from 'named-logs';
import {deploy, DeployOptions} from '@rocketh/deploy';
import {checkUpgradeIndex, replaceTemplateArgs} from './utils.js';
import ERC1967Proxy from './hardhat-deploy-v1-artifacts/ERC1967Proxy.js';
import ERC173Proxy from './hardhat-deploy-v1-artifacts/EIP173Proxy.js';
import ERC173ProxyWithReceive from './hardhat-deploy-v1-artifacts/EIP173ProxyWithReceive.js';
import TransparentUpgradeableProxy from './hardhat-deploy-v1-artifacts/TransparentUpgradeableProxy.js';
import OptimizedTransparentUpgradeableProxy from './hardhat-deploy-v1-artifacts/OptimizedTransparentUpgradeableProxy.js';
import DefaultProxyAdmin from './hardhat-deploy-v1-artifacts/ProxyAdmin.js';
import {execute, read} from '@rocketh/read-execute';
import {mergeABIs} from '@rocketh/core/artifacts';
import {toJSONCompatibleLinkedData} from '@rocketh/core/json';

const logger = logs('@rocketh/proxy');

export type {Abi, AbiFunction, Artifact, DeploymentConstruction, Deployment, Environment};

export type PredefinedProxyContract =
	| 'ERC173Proxy'
	| 'ERC173ProxyWithReceive'
	| 'UUPS'
	| 'SharedAdminOpenZeppelinTransparentProxy'
	| 'SharedAdminOptimizedTransparentProxy';

export type ProxyDeployOptions = Omit<DeployOptions, 'skipIfAlreadyDeployed' | 'alwaysOverride'> & {
	proxyDisabled?: boolean;
	owner?: EIP1193Account;
	execute?:
		| string
		| {
				methodName: string;
				args: unknown[]; // TODO types
		  };
	upgradeIndex?: number;
	checkProxyAdmin?: boolean;
	checkABIConflict?: boolean;
	deterministicImplementation?: boolean;
	proxyContract?:
		| PredefinedProxyContract
		| ({type: PredefinedProxyContract} & {
				type: 'SharedAdminOpenZeppelinTransparentProxy' | 'SharedAdminOptimizedTransparentProxy';
				proxyAdminName?: string;
				// TODO allow custom proxyAdmin artifact?
		  })
		| {
				type: 'custom';
				artifact: Artifact;
				args?: ('{implementation}' | '{admin}' | '{data}')[]; // default to  ['{implementation}', '{admin}', '{data}']
				// TODO allow viaAdminContract for custom proxy artifacts
				// We could just use boolean | {proxyAdminName: string}
				// viaAdminContract?:
				// 	| string
				// 	| {
				// 			name: string;
				// 			artifact?: string | ArtifactData;
				// 	  };
				// viaAdminContract = {
				// 			artifactName: 'DefaultProxyAdmin',
				// 			proxyAdminName:
				// 				(typeof options.proxyContract === 'object' && options.proxyContract.proxyAdminName) ||
				// 				'DefaultProxyAdmin',
				// 		};
		  };
};

export type ImplementationDeployer<TAbi extends Abi> = (
	name: string,
	args: Omit<DeploymentConstruction<TAbi>, 'artifact'>,
	options?: DeployOptions,
) => Promise<Deployment<TAbi>>;

// TODO omit nonce ? // TODO omit chain ? same for rocketh-deploy
export type ProxyEnhancedDeploymentConstruction<TAbi extends Abi> = Omit<DeploymentConstruction<TAbi>, 'artifact'> & {
	artifact: Artifact<TAbi> | ImplementationDeployer<TAbi>;
};

export type ProxyEnhancedDeploymentConstructionWithoutFunction<TAbi extends Abi> = Omit<
	DeploymentConstruction<TAbi>,
	'artifact'
> & {
	artifact: Artifact<TAbi>;
};

export type DeployViaProxyFunction = <TAbi extends Abi>(
	name: string,
	params: ProxyEnhancedDeploymentConstruction<TAbi>,
	options?: ProxyDeployOptions,
) => Promise<Deployment<TAbi>>;

export function deployViaProxy(
	env: Environment,
): <TAbi extends Abi>(
	name: string,
	params: ProxyEnhancedDeploymentConstruction<TAbi>,
	options?: ProxyDeployOptions,
) => Promise<Deployment<TAbi>> {
	const _deploy = deploy(env);
	const _read = read(env);
	const _execute = execute(env);
	return async <TAbi extends Abi>(
		name: string,
		params: ProxyEnhancedDeploymentConstruction<TAbi>,
		options?: ProxyDeployOptions,
	) => {
		let optionsForImplementation = options
			? {
					alwaysOverride: false,
					deterministic: options.deterministic || options.deterministicImplementation,
					libraries: options.libraries,
				}
			: undefined;
		let optionsForProxy = options
			? ((options) => {
					const {
						owner,
						checkABIConflict,
						checkProxyAdmin,
						execute,
						deterministicImplementation,
						proxyContract,
						proxyDisabled,
						upgradeIndex,
						linkedData,
						...optionsForProxy
					} = options;
					return optionsForProxy;
				})(options)
			: undefined;

		const proxyName = `${name}_Proxy`;
		const implementationName = `${name}_Implementation`;

		let existingDeployment = env.getOrNull<TAbi>(name);

		if (options?.proxyDisabled) {
			if (existingDeployment) {
				throw new Error(`cannot deploy ${name} with proxyDisabled, already deployed`);
			} else {
				if (typeof params.artifact === 'function') {
					return params.artifact(name, params, {...optionsForProxy, linkedData: options.linkedData});
				} else {
					// TODO any ?
					return _deploy<TAbi>(name, params as any, {...optionsForProxy, linkedData: options.linkedData});
				}
			}
		}
		const deployResult = checkUpgradeIndex(existingDeployment, options?.upgradeIndex);
		if (deployResult) {
			return deployResult;
		}

		const {account, artifact, args, ...viemArgs} = params;

		if (!account) {
			throw new Error(`no account specified`);
		}
		const address = resolveAccount(account, env);

		let viaAdminContract: {artifactName: 'DefaultProxyAdmin'; proxyAdminName: string} | undefined;

		let proxyArgsTemplate = ['{implementation}', '{admin}', '{data}'];
		let proxyArtifact: Artifact = ERC173Proxy;
		let checkABIConflict: boolean | string[] = ['supportsInterface'];
		let checkProxyAdmin = true;
		if (options?.proxyContract) {
			if (typeof options.proxyContract !== 'string' && options.proxyContract.type === 'custom') {
				proxyArtifact = options.proxyContract.artifact;
				proxyArgsTemplate = options.proxyContract.args || ['{implementation}', '{admin}', '{data}'];
			} else {
				const proxyContractDefinition =
					typeof options.proxyContract === 'string' ? options.proxyContract : options.proxyContract.type;

				switch (proxyContractDefinition) {
					case 'ERC173Proxy':
						proxyArtifact = ERC173Proxy;
						proxyArgsTemplate = ['{implementation}', '{admin}', '{data}'];
						break;
					case 'ERC173ProxyWithReceive':
						proxyArtifact = ERC173ProxyWithReceive;
						proxyArgsTemplate = ['{implementation}', '{admin}', '{data}'];
						break;
					case 'UUPS':
						checkABIConflict = false;
						checkProxyAdmin = false;
						proxyArtifact = ERC1967Proxy;
						proxyArgsTemplate = ['{implementation}', '{data}'];
						break;
					case 'SharedAdminOpenZeppelinTransparentProxy':
						checkABIConflict = false;
						proxyArtifact = TransparentUpgradeableProxy;
						proxyArgsTemplate = ['{implementation}', '{admin}', '{data}'];
						viaAdminContract = {
							artifactName: 'DefaultProxyAdmin',
							proxyAdminName:
								(typeof options.proxyContract === 'object' && options.proxyContract.proxyAdminName) ||
								'DefaultProxyAdmin',
						};
						break;
					case 'SharedAdminOptimizedTransparentProxy':
						checkABIConflict = false;
						proxyArtifact = OptimizedTransparentUpgradeableProxy;
						proxyArgsTemplate = ['{implementation}', '{admin}', '{data}'];
						viaAdminContract = {
							artifactName: 'DefaultProxyAdmin',
							proxyAdminName:
								(typeof options.proxyContract === 'object' && options.proxyContract.proxyAdminName) ||
								'DefaultProxyAdmin',
						};
						break;
					default:
						throw new Error(`unknown proxy contract ${options.proxyContract}`);
				}
			}
		}

		checkABIConflict = options?.checkABIConflict ?? checkABIConflict;
		checkProxyAdmin = options?.checkProxyAdmin ?? checkProxyAdmin;

		const implementationDeployment =
			typeof params.artifact === 'function'
				? await params.artifact(implementationName, {...params}, optionsForImplementation)
				: await _deploy(
						implementationName,
						{
							...viemArgs,
							args,
							artifact,
							account: address,
						} as DeploymentConstruction<TAbi>,
						optionsForImplementation,
					);

		logger.info(`implementation at ${implementationDeployment.address}`, `${implementationName}`);

		const {
			address: implementationAddress,
			argsData: implementationArgsData,
			transaction,
			newlyDeployed: implementationNewlyDeployed,
			...artifactFromImplementationDeployment
		} = implementationDeployment;

		// TODO throw specific error if artifact not found
		const artifactToUse = artifactFromImplementationDeployment;
		const {mergedABI} = mergeABIs(
			[
				{name: implementationName, abi: artifactFromImplementationDeployment.abi},
				{name: proxyName, abi: proxyArtifact.abi},
			],
			{checkForConflicts: checkABIConflict},
		);

		logger.info(`existingDeployment at ${existingDeployment?.address}`);

		const expectedOwner = options?.owner || address;
		let proxyAdmin = expectedOwner;

		let proxyAdminContract:
			| {
					deployment: Deployment<typeof DefaultProxyAdmin.abi>;
					owner: `0x${string}`;
			  }
			| undefined;
		if (viaAdminContract?.artifactName === 'DefaultProxyAdmin') {
			const proxyAdminOwner = expectedOwner;
			const proxyAdminName = viaAdminContract.proxyAdminName;
			let proxyAdminDeployed: Deployment<typeof DefaultProxyAdmin.abi> | null = env.getOrNull(proxyAdminName);

			if (!proxyAdminDeployed) {
				const proxyAdminDeployment = await _deploy(
					proxyAdminName,
					{
						...params,
						artifact: DefaultProxyAdmin,
						args: [proxyAdminOwner],
					},
					{
						deterministic: options?.deterministic,
					},
				);
				proxyAdminDeployed = proxyAdminDeployment;
			}

			const currentProxyAdminOwner = await _read(proxyAdminDeployed, {functionName: 'owner'});

			if (currentProxyAdminOwner.toLowerCase() !== expectedOwner.toLowerCase()) {
				throw new Error(`To change owner/admin, you need to call transferOwnership on ${proxyAdminName}`);
			}
			if (currentProxyAdminOwner === zeroAddress) {
				throw new Error(`The Proxy Admin (${proxyAdminName}) belongs to no-one. The Proxy cannot be upgraded anymore`);
			}
			proxyAdmin = proxyAdminDeployed.address;

			proxyAdminContract = {
				deployment: proxyAdminDeployed,
				owner: currentProxyAdminOwner.toLowerCase() as `0x${string}`,
			};
		}

		let postUpgradeCalldata: `0x${string}` | undefined;
		if (options?.execute) {
			const methodName = typeof options.execute === 'string' ? options.execute : options.execute.methodName;
			const argsToExecute = typeof options.execute === 'string' ? (args as unknown[]) : options.execute.args;
			const method: AbiFunction | undefined = artifactToUse.abi.find(
				(v) => v.type === 'function' && v.name === methodName,
			) as AbiFunction;
			if (method) {
				postUpgradeCalldata = encodeFunctionData({
					...viemArgs,
					args: argsToExecute,
					account: address,
					abi: [method],
					functionName: method.name,
				});
			} else {
				throw new Error(`Method ${methodName} not found in artifact provided for ${name}`);
			}
		}
		// let preUpgradeCalldata: `0x${string}` | undefined;
		// if (options?.preExecute) {
		// 	const method: AbiFunction | undefined = artifactToUse.abi.find(
		// 		(v) => v.type === 'function' && v.name === options.preExecute
		// 	) as AbiFunction;
		// 	if (method) {
		// 		preUpgradeCalldata = encodeFunctionData({...viemArgs, account, abi: [method], functionName: method.name});
		// 	}
		// }

		if (!existingDeployment) {
			const {newlyDeployed, ...proxy} = await _deploy<typeof proxyArtifact.abi>(
				proxyName,
				{
					...params,
					artifact: proxyArtifact,
					args: replaceTemplateArgs(proxyArgsTemplate, {
						implementationAddress: implementationDeployment.address,
						proxyAdmin: proxyAdmin,
						data: postUpgradeCalldata ? postUpgradeCalldata : '0x',
					}),
				},
				{
					skipIfAlreadyDeployed: true,
					deterministic: options?.deterministic,
				},
			);

			logger.info(`proxy deployed at ${proxy.address}`);

			existingDeployment = await env.save<TAbi>(name, {
				...proxy,
				...artifactToUse,
				abi: mergedABI as unknown as TAbi,
				linkedData: toJSONCompatibleLinkedData(options?.linkedData),
			});

			logger.info(`saving as ${name}`);
		} else {
			const proxyDeployment = env.getOrNull<typeof proxyArtifact.abi>(proxyName);
			if (!proxyDeployment) {
				throw new Error(`deployment for "${name}" exits but there is no proxy`);
			}

			const implementationSlotData = await env.network.provider.request({
				method: 'eth_getStorageAt',
				params: [
					proxyDeployment.address,
					'0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
					'latest',
				],
			});
			const currentImplementationAddress = `0x${implementationSlotData.substr(-40)}`;

			if (currentImplementationAddress.toLowerCase() !== implementationDeployment.address.toLowerCase()) {
				logger.info(
					`different implementation old: ${currentImplementationAddress} new: ${implementationDeployment.address}, upgrade...`,
				);

				// let currentOwner: `0x${string}` | undefined;
				// try {
				// 	currentOwner = await env.read(proxyDeployment, {functionName: 'owner'});
				// 	console.log({currentOwner});
				// } catch {
				// 	currentOwner = undefined;
				// }
				// if (!currentOwner) {
				const ownerSlotData = await env.network.provider.request({
					method: 'eth_getStorageAt',
					params: [
						proxyDeployment.address,
						'0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103',
						'latest',
					],
				});
				let currentOwner = `0x${ownerSlotData.substr(-40)}`;

				if (currentOwner === zeroAddress) {
					try {
						const owner = await _read(existingDeployment as any, {functionName: 'owner'});
						currentOwner = (owner as string).toLowerCase() as `0x${string}`;
					} catch (err) {}
				}

				if (currentOwner === zeroAddress) {
					if (checkProxyAdmin) {
						throw new Error('The Proxy belongs to no-one. It cannot be upgraded anymore');
					}
				} else if (currentOwner.toLowerCase() !== proxyAdmin.toLowerCase()) {
					throw new Error(
						`To change owner/admin, you need to call the proxy directly, it currently is ${currentOwner}`,
					);
				}

				// if (preUpgradeCalldata) {
				// 	if (postUpgradeCalldata) {
				// 		await env.execute(proxyDeployment, {
				// 			account: address,
				// 			functionName: 'callAndUpgradeToAndCall',
				// 			args: [implementation.address, preUpgradeCalldata, postUpgradeCalldata],
				// 			value: 0n, // TODO
				// 		});
				// 	} else {
				// 		await env.execute(proxyDeployment, {
				// 			account: address,
				// 			functionName: 'callAndUpgradeToAndCall',
				// 			args: [implementation.address, preUpgradeCalldata, '0x'],
				// 			value: 0n, // TODO
				// 		});
				// 	}
				// } else

				const deploymentToUseForUpgrade = options?.proxyContract === 'UUPS' ? existingDeployment : proxyDeployment;

				let useUpgradeToAndCall = !!postUpgradeCalldata;
				if (!useUpgradeToAndCall) {
					if (!deploymentToUseForUpgrade.abi.find((v) => v.type === 'function' && v.name === 'upgradeTo')) {
						useUpgradeToAndCall = true;
					}
				}

				if (proxyAdminContract) {
					if (useUpgradeToAndCall) {
						await _execute(proxyAdminContract.deployment, {
							account: proxyAdminContract.owner,
							functionName: 'upgradeAndCall',
							args: [proxyDeployment.address, implementationDeployment.address, postUpgradeCalldata || '0x'],
							value: 0n, // TODO
						});
					} else {
						await _execute(proxyAdminContract.deployment, {
							account: proxyAdminContract.owner,
							functionName: 'upgrade',
							args: [proxyDeployment.address, implementationDeployment.address],
						});
					}
				} else {
					if (useUpgradeToAndCall) {
						await _execute(deploymentToUseForUpgrade, {
							account: currentOwner,
							functionName: 'upgradeToAndCall',
							args: [implementationDeployment.address, postUpgradeCalldata || '0x'],
							value: 0n, // TODO
						});
					} else {
						await _execute(deploymentToUseForUpgrade, {
							account: currentOwner,
							functionName: 'upgradeTo',
							args: [implementationDeployment.address],
						});
					}
				}
			}
			existingDeployment = await env.save(name, {
				...proxyDeployment,
				...artifactToUse,
				linkedData: toJSONCompatibleLinkedData(options?.linkedData),
			});
			logger.info(`saving as ${name}`);
		}
		return existingDeployment;
	};
}
