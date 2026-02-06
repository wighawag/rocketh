import {Abi} from 'abitype';
import type {Artifact, DeploymentConstruction, Deployment, Environment} from '@rocketh/core/types';
import '@rocketh/deploy';
import {mergeArtifacts} from '@rocketh/core/artifacts';
import {DeployContractParameters} from 'viem';
import {logs} from 'named-logs';
import {Router10X60} from 'solidity-proxy/artifacts/index.js';
import {deploy, DeployOptions, DeployResult} from '@rocketh/deploy';

const logger = logs('@rocketh/router');

export type {Abi, Artifact, DeploymentConstruction, Deployment, Environment};

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

export type RouterDeployOptions = DeployOptions & {
	extraABIs?: Abi[];
	routerContract?: {
		type: 'custom';
		artifact: Artifact<typeof Router10X60.abi>;
	};
};

export type DeployViaRouterFunction = <TAbi extends Abi>(
	name: string,
	params: RouterEnhancedDeploymentConstruction,
	routes: Route<Abi>[],
	options?: RouterDeployOptions,
) => Promise<Deployment<TAbi> & {newlyDeployed: boolean}>;

export function deployViaRouter(
	env: Environment,
): <TAbi extends Abi>(
	name: string,
	params: RouterEnhancedDeploymentConstruction,
	routes: Route<Abi>[],
	options?: RouterDeployOptions,
) => Promise<DeployResult<TAbi>> {
	return async <TAbi extends Abi>(
		name: string,
		params: RouterEnhancedDeploymentConstruction,
		routes: Route<Abi>[],
		options?: RouterDeployOptions,
	) => {
		let optionsForRoutes = options ? {deterministic: options.deterministic, libraries: options.libraries} : undefined;
		let optionsForRouter = options
			? ((options) => {
					const {extraABIs, routerContract, ...optionsForRouter} = options;
					return optionsForRouter;
				})(options)
			: undefined;
		const _deploy = deploy(env);
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
		if (options?.extraABIs) {
			for (let i = 0; i < options.extraABIs.length; i++) {
				const extra = options.extraABIs[i];
				namedAbis.push({name: `extra${i}`, artifact: {abi: extra}});
			}
		}

		const {sigJSMap, mergedABI, mergedDevDocs, mergedUserDocs} = mergeArtifacts(namedAbis);
		for (const route of routes) {
			const deployedRoute = await _deploy<Abi>(
				`${name}_Router_${route.name}_Route`,
				{
					...params,
					artifact: route.artifact,
					args: route.args as unknown[],
				},
				optionsForRoutes,
			);
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

		const router = await _deploy(
			`${name}_Router`,
			{
				...params,
				artifact: options?.routerContract?.artifact || Router10X60,
				args: [routeParams],
			},
			optionsForRouter,
		);

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
	};
}
