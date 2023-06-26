import {Abi, AbiFunction} from 'abitype';
import type {Artifact, DeploymentConstruction, Deployment, Environment} from 'rocketh';
import 'rocketh-deploy';
import type {EIP1193Account} from 'eip-1193';
import {extendEnvironment} from 'rocketh';
import {Chain, DeployContractParameters, encodeAbiParameters, encodeDeployData, encodeFunctionData} from 'viem';
import artifactsAsModule from 'solidity-proxy/generated/artifacts';

// fix for weird loading issue
const artifacts = (artifactsAsModule as any).default
	? ((artifactsAsModule as any).default as typeof artifactsAsModule)
	: artifactsAsModule;

export type ProxyDeployOptions = {
	disabled?: boolean;
	owner: EIP1193Account;
	execute?: string; // TODO
	deployImplementation?: <TAbi extends Abi, TChain extends Chain>(
		name: string,
		args: DeploymentConstruction<TAbi, TChain>
	) => Promise<Deployment<TAbi>>;
};

export type DeployViaProxyFunction = <TAbi extends Abi, TChain extends Chain = Chain>(
	name: string,
	args: DeploymentConstruction<TAbi, TChain>,
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
		args: DeploymentConstruction<TAbi>, // TODO omit nonce ? // TODO omit chain ? same for rocketh-deploy
		options?: ProxyDeployOptions
	): Promise<Deployment<TAbi>> {
		const proxyName = `${name}_Proxy`;
		const implementationName = `${name}_Implementation`;

		const {account, artifact, ...viemArgs} = args;
		// TODO throw specific error if artifact not found
		const artifactToUse = (typeof artifact === 'string' ? env.artifacts[artifact] : artifact) as Artifact<TAbi>;

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

		const implementation = options?.deployImplementation
			? await options?.deployImplementation(implementationName, {...args})
			: await env.deploy(implementationName, {
					...args,
			  });

		let existingDeployment = env.get<TAbi>(name);

		const owner = options?.owner || address;

		// TODO better way to get args Data :D
		const bytecode = artifactToUse.bytecode;
		const abi = artifactToUse.abi;
		const argsToUse: DeployContractParameters<TAbi, TChain> = {
			...viemArgs,
			account,
			abi,
			bytecode,
		} as unknown as DeployContractParameters<TAbi, TChain>; // TODO why casting necessary here
		const calldata = encodeDeployData(argsToUse);
		const argsData = `0x${calldata.replace(bytecode, '')}` as `0x${string}`;

		let methodCallData: `0x${string}` | undefined;
		if (options?.execute) {
			const method: AbiFunction | undefined = abi.find(
				(v) => v.type === 'function' && v.name === options.execute
			) as AbiFunction;
			if (method) {
				methodCallData = encodeFunctionData({abi: [method], functionName: method.name, args: argsToUse as any});
			}
		}

		if (!existingDeployment) {
			const proxy = await env.deploy<typeof proxyArtifact.abi>(proxyName, {
				...args,
				artifact: proxyArtifact,
				args: [implementation.address, owner, methodCallData ? methodCallData : '0x'], // TODO upgradeToAndCall argsData],
			});

			existingDeployment = await env.save<TAbi>(name, {
				...proxy,
				...artifactToUse,
			});
		} else {
			const proxyDeployment = env.get(proxyName);
			if (!proxyDeployment) {
				throw new Error(`deployment for "${name}" exits but there is no proxy`);
			}

			const implementationSlotData = await env.network.provider.request({
				method: 'eth_getStorageAt',
				params: [proxyDeployment.address, '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'],
			});
			const currentImplementationAddress = `0x${implementationSlotData.substr(-40)}`;

			if (currentImplementationAddress.toLowerCase() !== implementation.address.toLowerCase()) {
				if (methodCallData) {
					await env.execute<typeof proxyArtifact.abi, 'upgradeToAndCall'>(proxyName, {
						account: address,
						functionName: 'upgradeToAndCall',
						args: [implementation.address, methodCallData],
						value: 0n, // TODO
					});
				} else {
					await env.execute<typeof proxyArtifact.abi, 'upgradeTo'>(proxyName, {
						account: address,
						functionName: 'upgradeTo',
						args: [implementation.address],
					});
				}
			}
			existingDeployment = await env.save(name, {
				...proxyDeployment,
				...artifactToUse,
			});
		}
		return existingDeployment;
	}

	env.deployViaProxy = deployViaProxy;
	return env;
});
