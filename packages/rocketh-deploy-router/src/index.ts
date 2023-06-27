import {Abi} from 'abitype';
import type {Artifact, DeploymentConstruction, Deployment, Environment} from 'rocketh';
import 'rocketh-deploy';
import {extendEnvironment} from 'rocketh';
import {GetConstructorArgs, getFunctionSelector} from 'viem';
import artifactsAsModule from 'solidity-proxy/generated/artifacts';
import {logs} from 'named-logs';

const logger = logs('rocketh-deploy-proxy');

// fix for weird loading issue
const artifacts = (artifactsAsModule as any).default
	? ((artifactsAsModule as any).default as typeof artifactsAsModule)
	: artifactsAsModule;

export type Route<TAbi extends Abi = Abi> = {
	name: string;
	artifact: Artifact<TAbi>;
} & GetConstructorArgs<TAbi>;

export type DeployViaRouterFunction = <TAbi extends Abi>(
	name: string,
	args: Omit<DeploymentConstruction<typeof artifacts.Router10X60.abi>, 'artifact'>,
	routes: Route<TAbi>[]
) => Promise<Deployment<TAbi>>;

declare module 'rocketh' {
	interface Environment {
		deployViaRouter: DeployViaRouterFunction;
	}
}
type CreateMutable<Type> = {
	-readonly [Property in keyof Type]: Type[Property];
};

type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
	? ElementType
	: never;

extendEnvironment((env: Environment) => {
	async function deployViaRouter<TAbi extends Abi>(
		name: string,
		args: Omit<DeploymentConstruction<typeof artifacts.Router10X60.abi>, 'artifact'>,
		routes: Route<TAbi>[]
	): Promise<Deployment<TAbi>> {
		const implementations: `0x${string}`[] = [];

		const sigJSMap: Map<`0x${string}`, {index: number; routeName: string; functionName: string}> = new Map();

		const mergedABI: CreateMutable<Abi> = [];
		const added: Map<string, ArrayElement<Abi>> = new Map();

		for (let i = 0; i < routes.length; i++) {
			const route = routes[i];
			for (const element of route.artifact.abi) {
				if (element.type === 'function') {
					const selector = getFunctionSelector(element);
					if (sigJSMap.has(selector)) {
						const existing = sigJSMap.get(selector);
						throw new Error(
							`ABI conflict: ${existing!.routeName} has function "${existing!.functionName}" which conflict with ${
								route.name
							}'s "${element.name}" (selector: "${selector}")  `
						);
					}
					sigJSMap.set(selector, {index: i, routeName: route.name, functionName: element.name});

					const exists = added.has(element.name);
					if (exists) {
						// TODO check if same
					} else {
						added.set(element.name, element);
						mergedABI.push(element);
					}
				} else if (element.type === 'constructor') {
					// we skip it
				} else if (element.type === 'error') {
					const exists = added.has(element.name);
					if (exists) {
						// TODO check if same
					} else {
						added.set(element.name, element);
						mergedABI.push(element);
					}
				} else if (element.type === 'event') {
					const exists = added.has(element.name);
					if (exists) {
						// TODO check if same
					} else {
						added.set(element.name, element);
						mergedABI.push(element);
					}
				} else if (element.type === 'fallback') {
				} else if (element.type === 'receive') {
				} else {
					// if ('name' in element) {
					// 	const exists = added.has(element.name);
					// 	if (exists) {
					// 		// TODO check if same
					// 	} else {
					// 		added.set(element.name, element);
					// 		mergedABI.push(element);
					// 	}
					// }
				}
			}
		}

		for (const route of routes) {
			const deployedRoute = await env.deploy<Abi>(`${name}_route_${route.name}`, {
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

		let existingDeployment = env.get(name);

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

		if (!existingDeployment || existingDeployment.address.toLowerCase() !== router.address.toLowerCase()) {
			existingDeployment = await env.save(name, {
				...router,
				abi: mergedABI,
			});

			logger.info(`save with merged ABI: ${name}`);
		}

		return existingDeployment as Deployment<TAbi>;
	}

	env.deployViaRouter = deployViaRouter;
	return env;
});
