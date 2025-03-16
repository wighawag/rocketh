import {Abi, AbiFunction} from 'abitype';
import type {Artifact, DeploymentConstruction, Deployment, Environment} from 'rocketh';
import '@rocketh/deploy';
import '@rocketh/read-execute';
import type {EIP1193Account} from 'eip-1193';
import {extendEnvironment} from 'rocketh';
import {Chain, encodeFunctionData} from 'viem';
import {logs} from 'named-logs';
import {DeployOptions} from '@rocketh/deploy';
import {checkUpgradeIndex, replaceTemplateArgs} from './utils.js';
import ERC1967Proxy from './hardhat-deploy-v1-artifacts/ERC1967Proxy.js';
import ERC173Proxy from './solidity-proxy-artifacts/ERC173Proxy.js';
import ERC173ProxyWithReceive from './solidity-proxy-artifacts/ERC173ProxyWithReceive.js';

const logger = logs('@rocketh/deploy-proxy');

export type ProxyDeployOptions = Omit<DeployOptions, 'skipIfAlreadyDeployed' | 'alwaysOverride'> & {
	owner?: EIP1193Account;
	execute?: string;
	upgradeIndex?: number;
	proxyContract?: // | {
	// 		type: 'custom';
	// 		artifact: Artifact;
	// 		args?: any[]; // default to ["{implementation}", "{admin}", "{data}"]
	//   }
	'ERC173Proxy' | 'ERC173ProxyWithReceive' | 'UUPS';
	// | 'Transparent' // default to ERC173Proxy
	// viaAdminContract?:
	// 	| string
	// 	| {
	// 			name: string;
	// 			artifact?: string | ArtifactData;
	// 	  };
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
	artifact: string | Artifact<TAbi> | ImplementationDeployer<TAbi, TChain>;
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
		const deployResult = checkUpgradeIndex(existingDeployment, options?.upgradeIndex);
		if (deployResult) {
			return deployResult;
		}

		const {account, artifact, args, ...viemArgs} = params;
		let address: `0x${string}`;
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

		let proxyArgsTemplate = ['{implementation}', '{admin}', '{data}'];
		let proxyArtifact: Artifact = ERC173Proxy;
		if (options?.proxyContract) {
			if (typeof options.proxyContract === 'string') {
				switch (options.proxyContract) {
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
					default:
						throw new Error(`unknown proxy contract ${options.proxyContract}`);
				}
				proxyArtifact = env.artifacts[options.proxyContract];
			}
			// else {
			// 	proxyArtifact = options.proxyContract;
			// }
		}

		const implementation =
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

		logger.info(`implementation at ${implementation.address}`, `${implementationName}`);

		const {
			address: implementationAddress,
			argsData: implementationArgsData,
			transaction,
			...artifactFromImplementation
		} = implementation;

		// TODO throw specific error if artifact not found
		const artifactToUse =
			typeof params.artifact === 'function'
				? artifactFromImplementation
				: ((typeof artifact === 'string' ? env.artifacts[artifact] : artifact) as Artifact<TAbi>);

		logger.info(`existingDeployment at ${existingDeployment?.address}`);

		const owner = options?.owner || address;

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
			const proxy = await env.deploy<typeof proxyArtifact.abi>(
				proxyName,
				{
					...params,
					artifact: proxyArtifact,
					args: replaceTemplateArgs(proxyArgsTemplate, {
						implementationAddress: implementation.address,
						proxyAdmin: owner,
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

			if (currentImplementationAddress.toLowerCase() !== implementation.address.toLowerCase()) {
				logger.info(
					`different implementation old: ${currentImplementationAddress} new: ${implementation.address}, upgrade...`
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
				const currentOwner = `0x${ownerSlotData.substr(-40)}`;

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
				if (postUpgradeCalldata) {
					await env.execute(proxyDeployment, {
						account: currentOwner,
						functionName: 'upgradeToAndCall',
						args: [implementation.address, postUpgradeCalldata],
						value: 0n, // TODO
					});
				} else {
					await env.execute(proxyDeployment, {
						account: currentOwner,
						functionName: 'upgradeTo',
						args: [implementation.address],
					});
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
