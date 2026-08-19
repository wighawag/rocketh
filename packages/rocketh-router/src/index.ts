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

type DeployMutuallyExclusiveOptions = {alwaysOverride?: boolean} | {strictBytecodeMatch?: boolean};

export type RouterDeployOptions = Omit<
	DeployOptions,
	'skipIfAlreadyDeployed' | 'alwaysOverride' | 'strictBytecodeMatch'
> &
	DeployMutuallyExclusiveOptions & {
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
		const alwaysOverride = options && 'alwaysOverride' in options && options.alwaysOverride;
		const strictBytecodeMatch =
			!alwaysOverride && options && 'strictBytecodeMatch' in options && options.strictBytecodeMatch;
		const skipIfAlreadyDeployed = alwaysOverride ? false : true;

		let optionsForRoutes = options
			? {
					alwaysOverride,
					strictBytecodeMatch,
					deterministic: options.deterministic,
					libraries: options.libraries,
				}
			: undefined;

		let optionsForRouter = options
			? ((options) => {
					const {extraABIs, routerContract, ...rest} = options;
					return {...rest, alwaysOverride, strictBytecodeMatch: false, skipIfAlreadyDeployed};
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

		// logger.info(`routes`, routeParams);

		const router = await _deploy(
			`${name}_Router`,
			{
				...params,
				artifact: options?.routerContract?.artifact || Router10X60,
				args: [routeParams],
			},
			optionsForRouter,
		);

		// logger.info(`router deployed at ${router.address}`);

		const recordPayload = {
			abi: mergedABI as unknown as TAbi,
			devdoc: mergedDevDocs,
			userdoc: mergedUserDocs,
		};

		if (!existingDeployment || router.newlyDeployed) {
			const {newlyDeployed, ...routerWithoutDeployedFlag} = router;
			existingDeployment = await env.save<TAbi>(name, {
				...routerWithoutDeployedFlag,
				...recordPayload,
			});

			// logger.info(`save with merged ABI: ${name}`);

			return {...existingDeployment, newlyDeployed: true};
		}

		// THE RECORD DESCRIBES WHAT WAS DECLARED, NOT WHAT THIS RUN DEPLOYED.
		//
		//  The guard above asks "was the ROUTER contract (re)deployed?", which is not the
		//  same question as "does the stored record still describe this router?". The two
		//  come apart through `extraABIs`: they contribute to the merged ABI but never to
		//  the implementations, so they cannot reach the router's constructor args, so the
		//  router is not redeployed, so nothing was saved. Adding one used to be a silent
		//  no-op, leaving a record whose ABI omits it, which is then what `@rocketh/export`
		//  ships and what `env.get<Abi>()` hands the next script.
		//
		//  Unlike the proxy and diamond cases this needs no governance to reach: it is a
		//  plain second run with a wider declared interface.
		//
		//  `newlyDeployed` stays FALSE here, deliberately: nothing was deployed. Only the
		//  record caught up. But `env.save` does bump `numDeployments`, on the same rule the
		//  proxy and diamond fixes use, that the counter tracks changes to the RECORD.
		if (!sameRouterRecord(existingDeployment, recordPayload)) {
			const {newlyDeployed, ...routerWithoutDeployedFlag} = router;
			existingDeployment = await env.save<TAbi>(name, {
				...routerWithoutDeployedFlag,
				...recordPayload,
			});
		}

		return {...existingDeployment, newlyDeployed: false};
	};
}

/**
 * Whether the stored record already describes the router we are about to record.
 *
 * Guards the record refresh above so that `env.save`, which bumps `numDeployments`
 * and rewrites the file, only fires when something genuinely differs. Covers the
 * documentation as well as the ABI, because `extraABIs` carry devdoc/userdoc into
 * the merged result and a doc-only change is still a change to what we publish.
 *
 * Compared as order-sensitive JSON: both sides come from `mergeArtifacts` over the
 * same inputs in the same order, so a genuine no-op reproduces identical output.
 * A missing stored ABI, or a comparison that throws, counts as different: a
 * redundant save is recoverable, a skipped one is the bug this exists to fix.
 */
function sameRouterRecord(
	stored: {abi?: unknown; devdoc?: unknown; userdoc?: unknown} | null | undefined,
	candidate: {abi: unknown; devdoc: unknown; userdoc: unknown},
): boolean {
	if (!stored || !stored.abi) {
		return false;
	}
	try {
		return (
			JSON.stringify(stored.abi) === JSON.stringify(candidate.abi) &&
			JSON.stringify(stored.devdoc) === JSON.stringify(candidate.devdoc) &&
			JSON.stringify(stored.userdoc) === JSON.stringify(candidate.userdoc)
		);
	} catch {
		return false;
	}
}
