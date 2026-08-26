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

/**
 * Exactly `DeployOptions`, plus the two options that are specific to routing.
 *
 * A router is a plain immutable deployment, not a proxy, so it takes the same staleness
 * options as any other contract and they mean the same thing. This type used to omit all
 * three and re-add a hand-rolled `alwaysOverride | strictBytecodeMatch` union, which
 * encoded "a router is special" into the surface; the only thing actually special about a
 * router is that it deploys SEVERAL contracts, which is a question of the LEVEL an option
 * applies at, not of which options exist. See `deployViaRouter` for how that level is
 * chosen.
 */
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
		const skipIfAlreadyDeployed = options && 'skipIfAlreadyDeployed' in options && options.skipIfAlreadyDeployed;
		const alwaysOverride = options && 'alwaysOverride' in options && options.alwaysOverride;
		const strictBytecodeMatch =
			!alwaysOverride && options && 'strictBytecodeMatch' in options && options.strictBytecodeMatch;

		// Same conflict, same wording, as `@rocketh/deploy`. Worth restating here because the
		//  composite skip below RETURNS before any child deploy runs, so the check inside
		//  `deploy` would never be reached for this combination.
		if (alwaysOverride && skipIfAlreadyDeployed) {
			throw new Error(`conflicting options: "alwaysOverride" and "skipIfAlreadyDeployed"`);
		}

		// THE RECORD FOR THE COMPOSITE, read once. Routes save under `${name}_Router_…_Route`
		//  and the router under `${name}_Router`, so nothing below changes this key.
		let existingDeployment = env.getOrNull<TAbi>(name);

		// `skipIfAlreadyDeployed` APPLIES TO THE WHOLE COMPOSITE, not to any one contract in it.
		//  `deploy` keys the skip on a NAME existing, and this writes several names, so pushing
		//  it down to the children gives each its own staleness policy and any name that is new
		//  escapes the skip while the rest are frozen. That seam is the bug this replaced (see
		//  the tests, which pin both doors into it). At the composite level there is no seam:
		//  the whole stack is left alone, or all of it is considered.
		if (existingDeployment && skipIfAlreadyDeployed) {
			return {...existingDeployment, newlyDeployed: false};
		}

		// Both bags name every option they forward, so a new `DeployOptions` field reaches a
		//  child only when someone decides it should. They are also built UNCONDITIONALLY: they
		//  used to hang off `options ? … : undefined`, which is what made the original bug
		//  depend on whether an options object was passed at all, its content irrelevant.
		const optionsForRoutes = {
			alwaysOverride,
			strictBytecodeMatch,
			deterministic: options?.deterministic,
			libraries: options?.libraries,
			// no linkedData: it describes the deployment the caller named, which is the router,
			//  and copying it onto every route record would be a change in what gets recorded.
		};

		const optionsForRouter = {
			alwaysOverride,
			// never applied to the router: it is a fixed artifact this package supplies, so a
			//  metadata-only difference in it would redeploy the router and cascade into an
			//  upgrade of whatever proxy fronts it.
			strictBytecodeMatch: false,
			deterministic: options?.deterministic,
			libraries: options?.libraries,
			linkedData: options?.linkedData,
		};

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

		// The guard above asks "was the ROUTER contract (re)deployed?", which is not the same
		//  question as "does the stored record still describe this router". The two come apart
		//  through `extraABIs`: they widen the merged ABI but never reach the router's
		//  constructor args, so the router is not redeployed and nothing was saved. Adding one
		//  used to be a silent no-op leaving a record whose ABI omits it. Unlike the proxy and
		//  diamond cases this needs no governance to reach: it is a plain second run.
		//
		//  `newlyDeployed` stays FALSE here, deliberately: nothing was deployed, only the
		//  record caught up.
		if (!recordDescribesRoutes(existingDeployment, recordPayload)) {
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
 * Whether the stored record already describes the routes we are about to record.
 *
 * Guards the refresh above; see `Environment.save` in `@rocketh/core` for the counter
 * rule this protects. Covers the documentation as well as the ABI, because `extraABIs`
 * carry devdoc/userdoc into the merged result and a doc-only change is still a change
 * to what we publish. Missing or unserialisable counts as NOT described.
 */
function recordDescribesRoutes(
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
