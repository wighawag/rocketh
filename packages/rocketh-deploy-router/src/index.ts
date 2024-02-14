import {Abi} from 'abitype';
import type {Artifact, DeploymentConstruction, Deployment, Environment, DevDoc, UserDoc} from 'rocketh';
import 'rocketh-deploy';
import {extendEnvironment} from 'rocketh';
import {DeployContractParameters} from 'viem';
import {FunctionFragment} from 'ethers';
import artifactsAsModule from 'solidity-proxy/generated/artifacts';
import {logs} from 'named-logs';
import {EIP1193Account} from 'eip-1193';

const logger = logs('rocketh-deploy-proxy');

// fix for weird loading issue
const artifacts = (artifactsAsModule as any).default
	? ((artifactsAsModule as any).default as typeof artifactsAsModule)
	: artifactsAsModule;

export type Route<TAbi extends Abi = Abi> = Omit<DeployContractParameters<TAbi>, 'bytecode' | 'account' | 'abi'> & {
	name: string;
	account: string | EIP1193Account;
	artifact: Artifact<TAbi>;
};

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

// from https://gist.github.com/egardner/efd34f270cc33db67c0246e837689cb9
function deepEqual(obj1: any, obj2: any): boolean {
	// Private
	function isObject(obj: any) {
		if (typeof obj === 'object' && obj != null) {
			return true;
		} else {
			return false;
		}
	}

	if (obj1 === obj2) {
		return true;
	} else if (isObject(obj1) && isObject(obj2)) {
		if (Object.keys(obj1).length !== Object.keys(obj2).length) {
			return false;
		}
		for (var prop in obj1) {
			if (!deepEqual(obj1[prop], obj2[prop])) {
				return false;
			}
		}
		return true;
	}
	return false;
}

function mergeDoc(values: any, mergedDevDocs: any, field: string) {
	if (values[field]) {
		const mergedEventDocs = (mergedDevDocs[field] = mergedDevDocs[field] || {});
		for (const signature of Object.keys(values[field])) {
			if (mergedEventDocs[signature] && !deepEqual(mergedEventDocs[signature], values[field][signature])) {
				throw new Error(`Doc ${field} conflict: "${signature}" `);
			}
			mergedEventDocs[signature] = values[field][signature];
		}
	}
}

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
		const mergedDevDocs: CreateMutable<DevDoc> = {kind: 'dev', version: 1, methods: {}};
		const mergedUserDocs: CreateMutable<UserDoc> = {kind: 'user', version: 1, methods: {}};

		for (let i = 0; i < routes.length; i++) {
			const route = routes[i];
			for (const element of route.artifact.abi) {
				if (element.type === 'function') {
					// const selector = getFunctionSelector(element);
					const selector = FunctionFragment.from(element).selector as `0x${string}`;
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
			const devdoc = route.artifact.devdoc;
			if (devdoc) {
				mergeDoc(devdoc, mergedDevDocs, 'events');
				mergeDoc(devdoc, mergedDevDocs, 'errors');
				mergeDoc(devdoc, mergedDevDocs, 'methods');
				if (devdoc.author) {
					if (mergedDevDocs.author && mergedDevDocs.author != devdoc.author) {
						throw new Error(`DevDoc author conflict `);
					}
					mergedDevDocs.author = devdoc.author;
					if (mergedDevDocs.title && mergedDevDocs.title != devdoc.title) {
						throw new Error(`DevDoc title conflict `);
					}
					mergedDevDocs.title = devdoc.title;
				}
			}

			const userdoc = route.artifact.userdoc;
			if (userdoc) {
				mergeDoc(userdoc, mergedUserDocs, 'events');
				mergeDoc(userdoc, mergedUserDocs, 'errors');
				mergeDoc(userdoc, mergedUserDocs, 'methods');
				if (userdoc.notice) {
					if (mergedUserDocs.notice && mergedUserDocs.notice != userdoc.notice) {
						throw new Error(`UserDoc notice conflict `);
					}
					mergedUserDocs.notice = userdoc.notice;
				}
			}
		}

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
