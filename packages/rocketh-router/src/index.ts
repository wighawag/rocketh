import {Abi} from 'abitype';
import type {Artifact, DeploymentConstruction, Deployment, Environment, DevDoc, UserDoc} from 'rocketh';
import '@rocketh/deploy';
import {extendEnvironment, mergeArtifacts} from 'rocketh';
import {DeployContractParameters} from 'viem';
import {logs} from 'named-logs';
import {EIP1193Account} from 'eip-1193';
import Router10X60 from './solidity-proxy-artifacts/Router10x60.js';

const logger = logs('@rocketh/router');

export type Route<TAbi extends Abi = Abi> = Omit<
	DeployContractParameters<TAbi>,
	'bytecode' | 'account' | 'abi' | 'chain'
> & {
	name: string;
	artifact: Artifact<TAbi>;
};

export type RouterEnhancedDeploymentConstruction = Omit<
	DeploymentConstruction<typeof Router10X60.abi>,
	'artifact' | 'args'
>;

export type DeployViaRouterFunction = <TAbi extends Abi>(
	name: string,
	params: RouterEnhancedDeploymentConstruction,
	routes: Route<Abi>[],
	extraABIs?: Abi[]
) => Promise<Deployment<TAbi> & {newlyDeployed: boolean}>;

declare module 'rocketh' {
	interface Environment {
		deployViaRouter: DeployViaRouterFunction;
	}
}

extendEnvironment((env: Environment) => {
	async function deployViaRouter<TAbi extends Abi>(
		name: string,
		params: RouterEnhancedDeploymentConstruction,
		routes: Route<Abi>[],
		extraABIs?: Abi[]
	): Promise<Deployment<TAbi> & {newlyDeployed: boolean}> {
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
				...params,
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

		let existingDeployment = env.getOrNull<TAbi>(name);

		const routeParams = {
			fallbackImplementation,
			implementations,
			sigMap,
		};

		logger.info(`routes`, routeParams);

		const router = await env.deploy<typeof Router10X60.abi>(`${name}_Router`, {
			...params,
			artifact: Router10X60,
			args: [routeParams],
		});

		logger.info(`router deployed at ${router.address}`);

		if (!existingDeployment || router.newlyDeployed) {
			const {newlyDeployed, ...routerWithoutDeployedFlag} = router;
			existingDeployment = await env.save<TAbi>(name, {
				...routerWithoutDeployedFlag,
				abi: mergedABI as unknown as TAbi,
				devdoc: mergedDevDocs,
				userdoc: mergedUserDocs,
			});

			logger.info(`save with merged ABI: ${name}`);

			return {...existingDeployment, newlyDeployed: true};
		}

		return {...existingDeployment, newlyDeployed: false};
	}

	env.deployViaRouter = deployViaRouter;
	return env;
});
