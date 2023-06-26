import {Abi} from 'abitype';
import type {Artifact, DeploymentConstruction, Deployment, Environment} from 'rocketh';
import 'rocketh-deploy';
import {extendEnvironment} from 'rocketh';
import {GetConstructorArgs, getFunctionSelector} from 'viem';
import artifactsAsModule from 'solidity-proxy/generated/artifacts';

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
	args: Omit<DeploymentConstruction<typeof artifacts.Router4X24.abi>, 'artifact'>,
	routes: Route<TAbi>[]
) => Promise<Deployment<TAbi>>;

declare module 'rocketh' {
	interface Environment {
		deployViaRouter: DeployViaRouterFunction;
	}
}

extendEnvironment((env: Environment) => {
	async function deployViaRouter<TAbi extends Abi>(
		name: string,
		args: Omit<DeploymentConstruction<typeof artifacts.Router4X24.abi>, 'artifact'>,
		routes: Route<TAbi>[]
	): Promise<Deployment<TAbi>> {
		const implementations: `0x${string}`[] = [];

		const sigJSMap: Map<`0x${string}`, {index: number; routeName: string; functionName: string}> = new Map();

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

		const sigMap = ['0x'] as `0x${string}`[];
		for (const entry of sigJSMap) {
			sigMap.push((entry[0] + entry[1].index.toString(16).padStart(2, '0')) as `0x${string}`);
		}

		const deployment = await env.deploy<typeof artifacts.Router4X24.abi>(name, {
			...args,
			artifact: artifacts.Router4X24,
			args: [
				{
					fallbackImplementation,
					implementations,
					sigMap,
				},
			],
		});

		return deployment as Deployment<TAbi>;
	}

	env.deployViaRouter = deployViaRouter;
	return env;
});
