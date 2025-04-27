import {Abi, AbiFunction} from 'abitype';
import type {Artifact, DeploymentConstruction, Deployment, Environment} from 'rocketh';
import '@rocketh/deploy';
import '@rocketh/read-execute';
import type {EIP1193Account} from 'eip-1193';
import {extendEnvironment} from 'rocketh';
import {Chain, encodeFunctionData, zeroAddress} from 'viem';
import {logs} from 'named-logs';
import {DeployOptions} from '@rocketh/deploy';
import {checkUpgradeIndex, replaceTemplateArgs} from './utils.js';
import ERC1967Proxy from './hardhat-deploy-v1-artifacts/ERC1967Proxy.js';
import ERC173Proxy from './hardhat-deploy-v1-artifacts/EIP173Proxy.js';
import ERC173ProxyWithReceive from './hardhat-deploy-v1-artifacts/EIP173ProxyWithReceive.js';
import TransparentUpgradeableProxy from './hardhat-deploy-v1-artifacts/TransparentUpgradeableProxy.js';
import OptimizedTransparentUpgradeableProxy from './hardhat-deploy-v1-artifacts/OptimizedTransparentUpgradeableProxy.js';
import DefaultProxyAdmin from './hardhat-deploy-v1-artifacts/ProxyAdmin.js';

const logger = logs('@rocketh/proxy');

export type PredefinedProxyContract =
	| 'ERC173Proxy'
	| 'ERC173ProxyWithReceive'
	| 'UUPS'
	| 'SharedAdminOpenZeppelinTransparentProxy'
	| 'SharedAdminOptimizedTransparentProxy';

export type ProxyDeployOptions = Omit<DeployOptions, 'skipIfAlreadyDeployed' | 'alwaysOverride'> & {
	proxyDisabled?: boolean;
	owner?: EIP1193Account;
	execute?: string;
	upgradeIndex?: number;
	proxyContract?:
		| PredefinedProxyContract
		| ({type: PredefinedProxyContract} & {
				type: 'SharedAdminOpenZeppelinTransparentProxy' | 'SharedAdminOptimizedTransparentProxy';
				proxyAdminName?: string;
		  });
	// | {
	// 		type: 'custom';
	// 		artifact: Artifact;
	// 		args?: any[]; // default to ["{implementation}", "{admin}", "{data}"]
	// viaAdminContract?:
	// 	| string
	// 	| {
	// 			name: string;
	// 			artifact?: string | ArtifactData;
	// 	  }
	//   };
};

export type ImplementationDeployer<TAbi extends Abi, TChain extends Chain> = (
	name: string,
	args: Omit<DeploymentConstruction<TAbi>, 'artifact'>
) => Promise<Deployment<TAbi>>;

// TODO omit nonce ? // TODO omit chain ? same for rocketh-deploy
export type ProxyEnhancedDeploymentConstruction<TAbi extends Abi, TChain extends Chain = Chain> = Omit<
	DeploymentConstruction<TAbi>,
	'artifact'
> & {
	artifact: Artifact<TAbi> | ImplementationDeployer<TAbi, TChain>;
};

export type ProxyEnhancedDeploymentConstructionWithoutFunction<TAbi extends Abi, TChain extends Chain = Chain> = Omit<
	DeploymentConstruction<TAbi>,
	'artifact'
> & {
	artifact: Artifact<TAbi>;
};

export type DeployViaProxyFunction = <TAbi extends Abi, TChain extends Chain = Chain>(
	name: string,
	params: ProxyEnhancedDeploymentConstruction<TAbi, TChain>,
	options?: ProxyDeployOptions
) => Promise<Deployment<TAbi>>;

declare module 'rocketh' {
	interface Environment {
		deployViaProxy: DeployViaProxyFunction;
	}
}

extendEnvironment((env: Environment) => {
	async function deployViaProxy<TAbi extends Abi, TChain extends Chain = Chain>(
		name: string,
		params: ProxyEnhancedDeploymentConstruction<TAbi, TChain>,
		options?: ProxyDeployOptions
	): Promise<Deployment<TAbi>> {
		const proxyName = `${name}_Proxy`;
		const implementationName = `${name}_Implementation`;

		let existingDeployment = env.getOrNull<TAbi>(name);

		if (options?.proxyDisabled) {
			if (existingDeployment) {
				throw new Error(`cannot deploy ${name} with proxyDisabled, already deployed`);
			} else {
				if (typeof params.artifact === 'function') {
					return params.artifact(name, params);
				} else {
					// TODO any ?
					return env.deploy<TAbi, TChain>(name, params as any, options);
				}
			}
		}
		const deployResult = checkUpgradeIndex(existingDeployment, options?.upgradeIndex);
		if (deployResult) {
			return deployResult;
		}

		const {account, artifact, args, ...viemArgs} = params;
		let address: `0x${string}`;

		if (!account) {
			throw new Error(`no account specified`);
		}
		if (account.startsWith('0x')) {
			address = account as `0x${string}`;
		} else {
			if (env.namedAccounts) {
				address = env.namedAccounts[account];
				if (!address) {
					throw new Error(`no address for ${account}`);
				}
			} else {
				throw new Error(`no accounts setup, cannot get address for ${account}`);
			}
		}

		let viaAdminContract: {artifactName: 'DefaultProxyAdmin'; proxyAdminName: string} | undefined;

		let proxyArgsTemplate = ['{implementation}', '{admin}', '{data}'];
		let proxyArtifact: Artifact = ERC173Proxy;
		if (options?.proxyContract) {
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
					proxyArtifact = ERC1967Proxy;
					proxyArgsTemplate = ['{implementation}', '{data}'];
					break;
				case 'SharedAdminOpenZeppelinTransparentProxy':
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

		const implementationDeployment =
			typeof params.artifact === 'function'
				? await params.artifact(implementationName, {...params})
				: await env.deploy(
						implementationName,
						{
							...viemArgs,
							args,
							artifact,
							account: address,
						} as DeploymentConstruction<TAbi>,
						{alwaysOverride: true, deterministic: true, libraries: options?.libraries}
				  );

		logger.info(`implementation at ${implementationDeployment.address}`, `${implementationName}`);

		const {
			address: implementationAddress,
			argsData: implementationArgsData,
			transaction,
			...artifactFromImplementationDeployment
		} = implementationDeployment;

		// TODO throw specific error if artifact not found
		const artifactToUse = artifactFromImplementationDeployment;

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
				const proxyAdminDeployment = await env.deploy(
					proxyAdminName,
					{
						...params,
						artifact: DefaultProxyAdmin,
						args: [proxyAdminOwner],
					},
					{
						deterministic: options?.deterministic,
					}
				);
				proxyAdminDeployed = proxyAdminDeployment;
			}

			const currentProxyAdminOwner = await env.read(proxyAdminDeployed, {functionName: 'owner'});

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
			const method: AbiFunction | undefined = artifactToUse.abi.find(
				(v) => v.type === 'function' && v.name === options.execute
			) as AbiFunction;
			if (method) {
				postUpgradeCalldata = encodeFunctionData({
					...viemArgs,
					args: args as unknown[],
					account: address,
					abi: [method],
					functionName: method.name,
				});
			} else {
				throw new Error(`Method ${options.execute} not found in artifact ${artifactToUse.abi}`);
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
			const {newlyDeployed, ...proxy} = await env.deploy<typeof proxyArtifact.abi>(
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
				}
			);

			logger.info(`proxy deployed at ${proxy.address}`);

			existingDeployment = await env.save<TAbi>(name, {
				...proxy,
				...artifactToUse,
				linkedData: options?.linkedData,
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
					`different implementation old: ${currentImplementationAddress} new: ${implementationDeployment.address}, upgrade...`
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
						const owner = await env.read(existingDeployment as any, {functionName: 'owner'});
						currentOwner = (owner as string).toLowerCase() as `0x${string}`;
					} catch (err) {
						throw new Error(`could not get owner of UUPS Proxy, tried ERC-1967 and ERC-173`, {cause: err});
					}
					// } else {
					// 	throw new Error(
					// 		`as per ERC-1967, proxy owner is zero address. We only support ERC-1967 proxies for now, unless you used proxyContract:"UUPS"`
					// 	);
					// }
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
						await env.execute(proxyAdminContract.deployment, {
							account: proxyAdminContract.owner,
							functionName: 'upgradeAndCall',
							args: [proxyDeployment.address, implementationDeployment.address, postUpgradeCalldata || '0x'],
							value: 0n, // TODO
						});
					} else {
						await env.execute(proxyAdminContract.deployment, {
							account: proxyAdminContract.owner,
							functionName: 'upgrade',
							args: [proxyDeployment.address, implementationDeployment.address],
						});
					}
				} else {
					if (useUpgradeToAndCall) {
						await env.execute(deploymentToUseForUpgrade, {
							account: currentOwner,
							functionName: 'upgradeToAndCall',
							args: [implementationDeployment.address, postUpgradeCalldata || '0x'],
							value: 0n, // TODO
						});
					} else {
						await env.execute(deploymentToUseForUpgrade, {
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
				linkedData: options?.linkedData,
			});
			logger.info(`saving as ${name}`);
		}
		return existingDeployment;
	}

	env.deployViaProxy = deployViaProxy;
	return env;
});
