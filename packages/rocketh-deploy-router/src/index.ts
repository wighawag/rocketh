import {Abi} from 'abitype';
import type {Artifact, DeploymentConstruction, Deployment, Environment, DevDoc, UserDoc} from 'rocketh';
import 'rocketh-deploy';
import {extendEnvironment, mergeArtifacts} from 'rocketh';
import {DeployContractParameters} from 'viem';
import artifactsAsModule from 'solidity-proxy/generated/artifacts';
import {logs} from 'named-logs';
import {EIP1193Account} from 'eip-1193';

const logger = logs('rocketh-deploy-proxy');

// fix for weird loading issue
const artifacts = (artifactsAsModule as any).default
	? ((artifactsAsModule as any).default as typeof artifactsAsModule)
	: artifactsAsModule;

export type Route<TAbi extends Abi = Abi> = Omit<
	DeployContractParameters<TAbi>,
	'bytecode' | 'account' | 'abi' | 'chain'
> & {
	name: string;
	account: string | EIP1193Account;
	artifact: Artifact<TAbi>;
};

export type DeployViaRouterFunction = <TAbi extends Abi>(
	name: string,
	args: Omit<DeploymentConstruction<typeof artifacts.Router10X60.abi>, 'artifact'>,
	routes: Route<TAbi>[],
	extraABIs?: Abi[]
) => Promise<Deployment<TAbi>>;

declare module 'rocketh' {
	interface Environment {
		deployViaRouter: DeployViaRouterFunction;
	}
}

extendEnvironment((env: Environment) => {
	async function deployViaRouter<TAbi extends Abi>(
		name: string,
		args: Omit<DeploymentConstruction<typeof artifacts.Router10X60.abi>, 'artifact'>,
		routes: Route<TAbi>[],
		extraABIs?: Abi[]
	): Promise<Deployment<TAbi>> {
		const implementations: `0x${string}`[] = [];

		const namedAbis: {
			name: string;
			artifact: Partial<Artifact<Abi>> & {
				abi: Abi;
			};
		}[] = [];
		for (const route of routes) {
			namedAbis.push(route);
		}
		if (extraABIs) {
			for (let i = 0; i < extraABIs.length; i++) {
				const extra = extraABIs[i];
				namedAbis.push({name: `extra${i}`, artifact: {abi: extra}});
			}
		}

		const {sigJSMap, mergedABI, mergedDevDocs, mergedUserDocs} = mergeArtifacts(namedAbis);
		for (const route of routes) {
			const deployedRoute = await env.deploy<Abi>(`${name}_Router_${route.name}_Route`, {
				...args,
				artifact: route.artifact,
				args: route.args as unknown[],
			});
			implementations.push(deployedRoute.address);
		}

		const fallbackImplementation = '0x0000000000000000000000000000000000000000' as `0x${string}`;

		const unorderedSigMap: `0x${string}`[] = [];
		for (const entry of sigJSMap) {
			// we add +1 to index as 0 indicate no implementation
			unorderedSigMap.push((entry[0] + entry[1].index.toString(16).padStart(2, '0')) as `0x${string}`);
		}

		const sigMap = unorderedSigMap.sort();

		let existingDeployment = env.getOrNull(name);

		const routeParams = {
			fallbackImplementation,
			implementations,
			sigMap,
		};

		logger.info(`routes`, routeParams);

		const router = await env.deploy<typeof artifacts.Router10X60.abi>(`${name}_Router`, {
			...args,
			artifact: artifacts.Router10X60,
			args: [routeParams],
		});

		logger.info(`router deployed at ${router.address}`);

		if (!existingDeployment || router.updated) {
			existingDeployment = await env.save(name, {
				...router,
				abi: mergedABI,
				devdoc: mergedDevDocs,
				userdoc: mergedUserDocs,
			});

			logger.info(`save with merged ABI: ${name}`);
		}

		return existingDeployment as Deployment<TAbi>;
	}

	env.deployViaRouter = deployViaRouter;
	return env;
});
