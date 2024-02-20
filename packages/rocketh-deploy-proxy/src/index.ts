import {Abi, AbiFunction} from 'abitype';
import type {Artifact, DeploymentConstruction, Deployment, Environment} from 'rocketh';
import 'rocketh-deploy';
import type {EIP1193Account} from 'eip-1193';
import {extendEnvironment} from 'rocketh';
import {Chain, DeployContractParameters, encodeAbiParameters, encodeDeployData, encodeFunctionData} from 'viem';
import artifactsAsModule from 'solidity-proxy/generated/artifacts';
import {logs} from 'named-logs';

const logger = logs('rocketh-deploy-proxy');

// fix for weird loading issue
const artifacts = (artifactsAsModule as any).default
	? ((artifactsAsModule as any).default as typeof artifactsAsModule)
	: artifactsAsModule;

export type ProxyDeployOptions = {
	linkedData?: any;
	disabled?: boolean;
	owner: EIP1193Account;
	execute?: string;
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
	args: ProxyEnhancedDeploymentConstruction<TAbi, TChain>,
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
		args: ProxyEnhancedDeploymentConstruction<TAbi, TChain>,
		options?: ProxyDeployOptions
	): Promise<Deployment<TAbi>> {
		const proxyName = `${name}_Proxy`;
		const implementationName = `${name}_Implementation`;

		const {account, artifact, ...viemArgs} = args;

		let address: `0x${string}`;
		if (account.startsWith('0x')) {
			address = account as `0x${string}`;
		} else {
			if (env.accounts) {
				address = env.accounts[account];
				if (!address) {
					throw new Error(`no address for ${account}`);
				}
			} else {
				throw new Error(`no accounts setup, cannot get address for ${account}`);
			}
		}

		const proxyArtifact = artifacts.EIP173Proxy;

		const implementation =
			typeof args.artifact === 'function'
				? await args.artifact(implementationName, {...args})
				: await env.deploy(implementationName, {
						...args,
				  } as DeploymentConstruction<TAbi>);

		logger.info(`implementation at ${implementation.address}`, `${implementationName}`);

		const {
			address: implementationAddress,
			argsData: implementationArgsData,
			transaction,
			...artifactFromImplementation
		} = implementation;

		// TODO throw specific error if artifact not found
		const artifactToUse =
			typeof args.artifact === 'function'
				? artifactFromImplementation
				: ((typeof artifact === 'string' ? env.artifacts[artifact] : artifact) as Artifact<TAbi>);

		let existingDeployment = env.get<TAbi>(name);

		logger.info(`existingDeployment at ${existingDeployment?.address}`);

		const owner = options?.owner || address;

		let methodCallData: `0x${string}` | undefined;
		if (options?.execute) {
			const method: AbiFunction | undefined = artifactToUse.abi.find(
				(v) => v.type === 'function' && v.name === options.execute
			) as AbiFunction;
			if (method) {
				// TODO better way to get args Data :D
				const bytecode = artifactToUse.bytecode;
				const abi = artifactToUse.abi;
				const argsToUse: DeployContractParameters<TAbi, TChain> = {
					...viemArgs,
					account,
					abi,
					bytecode,
					chain: env.network.chain,
				} as unknown as DeployContractParameters<TAbi, TChain>; // TODO why casting necessary here

				methodCallData = encodeFunctionData({abi: [method], functionName: method.name, args: argsToUse as any});
			}
		}

		if (!existingDeployment) {
			const proxy = await env.deploy<typeof proxyArtifact.abi>(proxyName, {
				...args,
				artifact: proxyArtifact,
				args: [implementation.address, owner, methodCallData ? methodCallData : '0x'], // TODO upgradeToAndCall argsData],
			});

			logger.info(`proxy deployed at ${proxy.address}`);

			existingDeployment = await env.save<TAbi>(name, {
				...proxy,
				...artifactToUse,
				linkedData: options?.linkedData,
			});

			logger.info(`saving as ${name}`);
		} else {
			const proxyDeployment = env.get(proxyName) as Deployment<typeof proxyArtifact.abi>;
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

				if (methodCallData) {
					await env.execute(proxyDeployment, {
						account: address,
						functionName: 'upgradeToAndCall',
						args: [implementation.address, methodCallData],
						value: 0n, // TODO
					});
				} else {
					await env.execute(proxyDeployment, {
						account: address,
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
