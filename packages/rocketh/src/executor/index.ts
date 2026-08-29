import {EIP1193ProviderWithoutEvents} from 'eip-1193';

import type {
	Environment,
	ExecutionParams,
	ResolvedExecutionParams,
	UnknownDeployments,
	UnresolvedNetworkSpecificData,
	UnresolvedUnknownNamedAccounts,
	DeployScriptModule,
	EnhancedDeployScriptFunction,
	EnhancedEnvironment,
	ResolvedUserConfig,
	ConfigOverrides,
	ForkDescriptor,
	UserConfig,
	PromptExecutor,
	DeploymentStore,
	ModuleObject,
	ChainInfo,
	ResolvedRetryConfig,
} from '@rocketh/core/types';
import {withEnvironment} from '@rocketh/core/environment';

import {JSONRPCHTTPProvider} from 'eip-1193-jsonrpc-provider';
import {createEnvironment} from '../environment/index.js';
import {formatEther, getRoughGasPriceEstimate} from '../utils/eth.js';
import {logger, spin} from '../internal/logging.js';
import {getChainConfigFromUserConfig, getChainSemanticsFromUserConfig} from '../environment/chains.js';

/**
 * Setup function that creates the execute function for deploy scripts. It allow to specify a set of functions that will be available in the environment.
 *
 * @param functions - An object of utility functions that expect Environment as their first parameter
 * @returns An execute function that provides an enhanced environment with curried functions
 *
 * @example
 * ```typescript
 * const functions = {
 *   deploy: (env: Environment) => ((contractName: string, args: any[]) => Promise<void>),
 *   verify: (env: Environment) => ((address: string) => Promise<boolean>)
 * };
 *
 * const {deployScript} = setup(functions);
 *
 * export default deployScript(async (env, args) => {
 *   // env now includes both the original environment AND the curried functions
 *   await env.deploy('MyContract', []); // No need to pass env
 *   await env.verify('0x123...'); // No need to pass env
 *
 *   // Original environment properties are still available
 *   console.log(env.name);
 *   const deployment = env.get('MyContract');
 * }, { tags: ['deploy'] });
 * ```
 */
export function setupDeployScripts<
	Extensions extends Record<string, (env: Environment<any, any, any>) => any> = {},
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Extra extends Record<string, unknown> = Record<string, unknown>,
>(
	extensions: Extensions,
): {
	deployScript<ArgumentsType = undefined>(
		callback: EnhancedDeployScriptFunction<NamedAccounts, Data, ArgumentsType, Deployments, Extensions>,
		options: {tags?: string[]; dependencies?: string[]; id?: string; runAtTheEnd?: boolean},
	): DeployScriptModule<NamedAccounts, Data, ArgumentsType, Deployments, Extra>;
} {
	function enhancedExecute<ArgumentsType = undefined>(
		callback: EnhancedDeployScriptFunction<NamedAccounts, Data, ArgumentsType, Deployments, Extensions>,
		options: {tags?: string[]; dependencies?: string[]; id?: string; runAtTheEnd?: boolean},
	): DeployScriptModule<NamedAccounts, Data, ArgumentsType, Deployments, Extra> {
		const scriptModule: DeployScriptModule<NamedAccounts, Data, ArgumentsType, Deployments, Extra> = (
			env: Environment<NamedAccounts, Data, Deployments, Extra>,
			args?: ArgumentsType,
		) => {
			// Create the enhanced environment by combining the original environment with extensions
			const curriedFunctions = withEnvironment(env, extensions);
			const enhancedEnv = Object.assign(
				Object.create(Object.getPrototypeOf(env)),
				env,
				curriedFunctions,
			) as EnhancedEnvironment<NamedAccounts, Data, Deployments, Extensions, Extra>;

			return callback(enhancedEnv, args);
		};

		scriptModule.tags = options.tags;
		scriptModule.dependencies = options.dependencies;
		scriptModule.id = options.id;
		scriptModule.runAtTheEnd = options.runAtTheEnd;

		return scriptModule;
	}

	return {
		deployScript: enhancedExecute,
	};
}

export function resolveConfig<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
>(configFile: UserConfig, overrides?: ConfigOverrides): ResolvedUserConfig<NamedAccounts, Data> {
	const {retry: _retry, ...configWithoutRetry} = configFile as UserConfig<NamedAccounts, Data>;
	const config: ResolvedUserConfig<NamedAccounts, Data> = {
		deployments: 'deployments',
		defaultPollingInterval: 1,
		retry: {...{maxRetries: 3, delay: 1000}, ...(_retry || {})} as ResolvedRetryConfig,
		...configWithoutRetry,
		scripts: configFile?.scripts
			? typeof configFile.scripts === 'string'
				? [configFile.scripts]
				: configFile.scripts.length == 0
					? ['deploy']
					: configFile.scripts
			: ['deploy'],
	};

	if (overrides) {
		for (const key of Object.keys(overrides)) {
			if ((overrides as any)[key] !== undefined) {
				(config as any)[key] = (overrides as any)[key];
			}
		}
	}

	return config;
}

/**
 * The chain id the run adopts: the CONNECTED one, the chain the node itself reports.
 *
 * Two things happen here and they are separate. The identity CHECK compares what the environment
 * declares with what the node answers and warns when they disagree. The ADOPTION then picks the
 * node's id whenever a node answered, because that id reaches `env.network.chain.id` and from
 * there the `chainId` field of every transaction rocketh builds, which a node rejects when it is
 * not its own.
 *
 * On a FORK the check is skipped, since a fork is exactly the situation where the two legitimately
 * differ (ADR 0014); the adoption rule is unchanged there, which is the whole point.
 */
export async function getChainIdForEnvironment(
	config: ResolvedUserConfig,
	environmentName: string,
	executionParams: ExecutionParams,
) {
	const provider = executionParams.provider;
	// Derived here rather than taken as a parameter, so every caller (`@rocketh/node`,
	// `@rocketh/web`, `@rocketh/test-utils`, hardhat-deploy) gets the fork-awareness below without
	// changing its call, and none of them can forget to pass it.
	const {fork} = getEnvironmentName(executionParams);

	let declaredChainId: number | undefined;

	if (config?.environments?.[environmentName]?.chain) {
		declaredChainId = config.environments[environmentName].chain;
	}

	const chainIdFromProvider = provider ? Number(await provider.request({method: 'eth_chainId'})) : undefined;

	// The check asks "is this node the one this environment describes?", and on a FORK that question
	// has no wrong answer: the declared id belongs to the network being SIMULATED while the node
	// reports whichever engine is running. Measured rather than assumed
	// (`work/notes/findings/fork-node-chain-identity-behaviour.md`): anvil forking mainnet reports 1,
	// hardhat reports 31337. Neither is a misconfiguration, so neither earns a notice.
	//
	// The leniency stops at forks. Off one, this warning is still the only thing that tells a user
	// their `-e mainnet` run is pointed at a local node.
	if (!fork && declaredChainId && chainIdFromProvider && chainIdFromProvider != declaredChainId) {
		console.warn(
			`provider give a different chainId (${chainIdFromProvider}) than the one expected for environment named "${environmentName}" (${declaredChainId})`,
		);
	}

	// The adoption, stated rather than left to whichever value happened to be truthy: the node's id
	// wins whenever a node answered, because it is the only id a transaction can be signed for. The
	// declared id is the fallback for a run with no provider at all. `||` rather than `??` is
	// load-bearing: it also rejects the `0`/`NaN` a node answering nonsense produces, so that run
	// fails on the error below instead of carrying a meaningless id.
	const chainIdToReturn = chainIdFromProvider || declaredChainId;

	if (chainIdToReturn === undefined) {
		throw new Error(
			`Could not find chainId for environment named "${environmentName}" ${provider ? `` : '(no provider)'}`,
		);
	}

	return chainIdToReturn;
}

export async function getChainIdForExecutionParams(
	config: ResolvedUserConfig,
	executionParams: ExecutionParams,
): Promise<number> {
	const {name: environmentName} = getEnvironmentName(executionParams);

	return getChainIdForEnvironment(config, environmentName, executionParams);
}

/**
 * The environment NAME the run uses (which is the forked network's name on a fork, since a fork
 * reads that network's deployment records), plus the fork DESCRIPTOR when there is one.
 *
 * A run is a fork because of HOW IT WAS INVOKED, so the descriptor exists exactly when the caller
 * passed a `ForkInput`. It used to be `typeof environmentProvided !== 'string'`, which made the
 * default in-memory run (no environment at all) claim to be a fork of nothing.
 *
 * The descriptor built here knows only what the INPUT carried; the chain id declared for the
 * forked network is layered on by `resolveForkDescriptor`, which has the config.
 */
export function getEnvironmentName(executionParams: ExecutionParams): {name: string; fork?: ForkDescriptor} {
	const environmentProvided = executionParams.environment || (executionParams as any).network;
	let environmentName = 'memory';
	let fork: ForkDescriptor | undefined;
	if (environmentProvided) {
		if (typeof environmentProvided === 'string') {
			environmentName = environmentProvided;
		} else if ('fork' in environmentProvided) {
			environmentName = environmentProvided.fork;
			fork =
				environmentProvided.chainId === undefined
					? {networkName: environmentProvided.fork}
					: {networkName: environmentProvided.fork, chainId: environmentProvided.chainId};
		}
	}
	return {name: environmentName, fork};
}

/**
 * The full descriptor for a run: what it simulates, and that network's chain id when it is KNOWN.
 *
 * Two honest sources, in order: supplied with the fork input (the caller has the forked network's
 * own configuration), then declared as `environments[<name>].chain`. There is deliberately no
 * third: the id the run computed from the provider is the CONNECTED chain's, and under hardhat
 * that is the local engine's 31337 while the run simulates mainnet, so adopting it here would
 * make the descriptor assert something nobody established (ADR 0014). Whoever needs a lookup key
 * may fall back to the computed id itself; the descriptor may not claim it.
 */
export function resolveForkDescriptor(
	config: ResolvedUserConfig,
	executionParams: ExecutionParams,
): ForkDescriptor | undefined {
	const {fork} = getEnvironmentName(executionParams);
	if (!fork || fork.chainId !== undefined) {
		return fork;
	}
	const declaredChainId = config?.environments?.[fork.networkName]?.chain;
	return declaredChainId === undefined ? fork : {...fork, chainId: declaredChainId};
}

/**
 * Where a local node listens when nobody said otherwise: the address anvil and `hardhat node`
 * both default to. It is the endpoint a FORK run dials with no fork configuration at all, which
 * is what keeps the zero-configuration case working, and it is a stated default here rather than
 * the coincidence it used to be (it arrived through viem's `hardhat` chain entry in
 * `chains[31337]`, a bucket that describes the user's own dev node rather than their fork).
 *
 * Named for the LOCAL NODE, not the fork: `fork` in a name is ambiguous across three parts of
 * speech, and a `FORK_RPC_URL` would read as the url to fork FROM, which is the one thing this
 * is not (see the naming section of ADR 0014).
 */
export const CONVENTIONAL_LOCAL_RPC_URL = 'http://127.0.0.1:8545';

export function resolveExecutionParams<Extra extends Record<string, unknown> = Record<string, unknown>>(
	config: ResolvedUserConfig,
	executionParameters: ExecutionParams<Extra>,
	chainId: number,
): ResolvedExecutionParams<Extra> {
	const {name: environmentName} = getEnvironmentName(executionParameters);
	const fork = resolveForkDescriptor(config, executionParameters);
	const environmentConfig = config?.environments?.[environmentName];

	// The fork's OWN layer, and the whole of the mode-switch discipline in one line: it is read
	// only when `fork` is set, which happens because of how the run was INVOKED. Declaring
	// `whenForked` says what differs ONCE a run is a fork; it never makes one (ADR 0014).
	const whenForkedOverrides = fork ? environmentConfig?.whenForked : undefined;

	// A fork run SIMULATES one chain and TALKS TO another (ADR 0014), and this one lookup used to
	// answer both questions from the connected side. It SPLITS rather than swaps.
	//
	// The CONNECTED chain is the node this run actually talks to, which on a fork is the LOCAL fork
	// node, hence 31337. This half must not move: the connection is what points a fork run at the
	// fork instead of at production, so sending the whole lookup to the forked network would connect
	// it to the real one. This bucket also stays the source of `chainInfo`, because
	// `env.network.chain.id` is what `execute` and `tx` put in a transaction's `chainId` field and a
	// node rejects an id it does not recognise as its own.
	const connectedChainId = fork ? 31337 : chainId;

	// ... but the ENDPOINT of that connection is no longer read from the bucket. `chains[31337]` is
	// where a user describes their own dev node, so its url is the port THAT node listens on, not
	// the port a fork of another network does. A fork therefore starts from the conventional local
	// endpoint and says the rest itself, in the `whenForked` layer applied below.
	const connectedChainConfig = getChainConfigFromUserConfig(
		config,
		connectedChainId,
		executionParameters.provider,
		fork ? CONVENTIONAL_LOCAL_RPC_URL : undefined,
	);

	// The SIMULATED chain is the network being forked, and its configuration is what the run
	// REHEARSES: deployment semantics, policy and TAGS (deploy scripts branch on those, so the
	// local node's `local` tag used to make a script take the local shortcut during a mainnet
	// rehearsal). The key is the descriptor's chain id when one was ESTABLISHED, else the id the
	// run computed from the provider, and that fallback is not a degraded mode: anvil forking
	// mainnet reports 1 because it IS forking mainnet, so `chains[1]` is found with nothing
	// declared at all, while hardhat's 31337 lands on exactly the previous behaviour.
	// For a non-fork run the two ids are the same one and nothing changes.
	const simulatedChainId = fork?.chainId ?? chainId;

	// Read through the semantics function even when the two ids coincide, although the connected
	// config carries the very same fields for that id: it is the SEMANTICS shape that keeps
	// `autoImpersonate` undefaulted, and reusing the connected config here would re-inject its
	// `false` and quietly outrank the fork-aware default below on the commonest fork of all (a
	// hardhat node, which reports 31337 for both ids).
	const simulatedChainSemantics = getChainSemanticsFromUserConfig(config, simulatedChainId);

	// `env.network.chain` describes what the run is CONNECTED to, and its `id` is the one thing a
	// fork run may not read off the local bucket: `execute`, `tx` and `deploy` hex-encode it into a
	// transaction's `chainId` field, a locally signed transaction COMMITS to that value, and the
	// node rejects an id it does not recognise as its own. So the id is always the one the node
	// reported (`chainId`, adopted by `getChainIdForEnvironment`), while every OTHER field keeps
	// describing the connection, above all `rpcUrls`, which must stay the local node's: a fork run
	// pointed at the forked network's public endpoint is the worst outcome this file can produce.
	//
	// Off a fork the two are the same value, since the bucket was keyed by this very id; the only
	// other case this touches is a chain entry whose declared `info.id` contradicts its own key.
	let chainInfo =
		connectedChainConfig.info.id === chainId ? connectedChainConfig.info : {...connectedChainConfig.info, id: chainId};
	// The environment-level override layer already ran on fork runs, since the environment NAME is
	// the forked network's. It sits ON TOP of both buckets, so a user's overrides keep winning.
	//
	// ...with ONE field withheld on a fork, and it is the dangerous one. `overrides` belongs to the
	// environment of a REAL network, so its `rpcUrl` is that network's own endpoint: the single
	// address a rehearsal must never dial. Inheriting it would point a fork run at production while
	// the user believed they were on their fork, which is the worst outcome this file can produce,
	// and it would do so silently. Withholding it is not an exception to the layering but the same
	// rule that already governs it: connection from the LOCAL side, everything else from the network
	// being simulated (ADR 0014). `chains[<forked id>]` does not supply the connection either.
	// Where the fork listens is said by `whenForked.rpcUrl` below, else the conventional local
	// endpoint. Every other override still crosses, so this costs a fork nothing it should inherit.
	const connectionOverrides =
		fork && environmentConfig?.overrides
			? (({rpcUrl: _theRealNetworksEndpoint, ...rest}) => rest)(environmentConfig.overrides)
			: environmentConfig?.overrides;

	const overriddenChainConfig = connectionOverrides
		? {
				...connectedChainConfig,
				...connectionOverrides,
				properties: {
					...connectedChainConfig?.properties,
					...connectionOverrides.properties,
				},
			}
		: connectedChainConfig;
	// And the fork's own layer sits on top of THAT, most specific last: the forked network's chain
	// config, then this environment's overrides, then what is true of the fork alone. It is the
	// same override bag rather than a new kind of thing, so it reaches the connection (an endpoint,
	// properties) and the semantics (tags, impersonation, ...) exactly as `overrides` does.
	const actualChainConfig = whenForkedOverrides
		? {
				...overriddenChainConfig,
				...whenForkedOverrides,
				properties: {
					...overriddenChainConfig?.properties,
					...whenForkedOverrides.properties,
				},
			}
		: overriddenChainConfig;
	const overriddenChainSemantics = environmentConfig?.overrides
		? {...simulatedChainSemantics, ...environmentConfig.overrides}
		: simulatedChainSemantics;
	const actualChainSemantics = whenForkedOverrides
		? {...overriddenChainSemantics, ...whenForkedOverrides}
		: overriddenChainSemantics;

	if (actualChainConfig?.properties) {
		chainInfo = {...chainInfo, properties: actualChainConfig.properties};
	}

	// let environmentTags: string[] = actualChainSemantics.tags.concat(environmentConfig?.tags); // TODO
	const environmentTags = actualChainSemantics.tags;

	let scripts = ['deploy'];
	if (config.scripts) {
		if (typeof config.scripts === 'string') {
			scripts = [config.scripts];
		} else {
			scripts = [...config.scripts];
		}
	}

	if (environmentConfig?.scripts) {
		if (typeof environmentConfig.scripts === 'string') {
			scripts = [environmentConfig.scripts];
		} else {
			scripts = [...environmentConfig.scripts];
		}
	}

	const provider =
		'provider' in actualChainConfig
			? actualChainConfig.provider
			: (new JSONRPCHTTPProvider(actualChainConfig.rpcUrl) as EIP1193ProviderWithoutEvents);

	// Where a run's records go, and the ONE place the fork rule lives.
	//
	// A fork run's environment NAME is the forked network's, because that is the folder it READS,
	// and reading those records is the entire point of forking (ADR 0014). Saving is the other half
	// and the name is exactly the wrong answer there: defaulting on the name alone makes a rehearsal
	// of mainnet write into `deployments/mainnet`. So a fork defaults to NOT saving, and it says so
	// here rather than in every caller that learns to fork: the knowledge used to live in
	// hardhat-deploy, which paired its fork input with `saveDeployments: false` itself, and a second
	// caller forgetting that second argument got production-record corruption with no warning.
	// Prefer making the mistake unrepresentable over documenting the pairing.
	//
	// Note this does NOT send a fork's records somewhere else. If a fork run should ever save, the
	// destination is a separate decision; this term only makes the DEFAULT safe.
	let saveDeployments = executionParameters.saveDeployments;

	if (saveDeployments === undefined) {
		// ABOVE both branches below, deliberately. The no-provider short-circuit answers `true` before
		// the environment name is ever looked at, and a fork driven WITHOUT a provider is precisely
		// the `--is-fork` case (attach to an anvil fork by rpc url), so a fork term added only to the
		// named-environment branch would leave the hazard live on the very path this exists to
		// protect. An explicit `executionParameters.saveDeployments` is still read first, so
		// "I know what I am doing, write it" stays expressible on a fork.
		if (fork) {
			saveDeployments = false;
		} else if (!executionParameters.provider) {
			saveDeployments = true;
		} else {
			if (environmentName === 'memory' || environmentName === 'hardhat' || environmentName === 'default') {
				// networkTags['memory'] = true;
				saveDeployments = false;
			} else {
				saveDeployments = true;
			}
		}
	}

	// Resolve the auto-impersonation CAPABILITY (priority: params > chain config of the SIMULATED
	// network > on for a fork, off otherwise).
	//
	// The last term is the only one that is fork-aware, and it is a default rather than a rule:
	// impersonation is what makes an account rocketh cannot sign for executable on a node that
	// supports it, so it is the only reason a Safe-owned step runs at all during a rehearsal, and a
	// fork with it off stops at the first privileged call (ADR 0014). An explicit `false` at either
	// level therefore still WINS, because turning it off is the supported way to exercise the
	// unknown-signer deferral path on a fork and the `@rocketh/unknown-signer` scenarios are built
	// on exactly that.
	//
	// This stays strictly on the CAPABILITY side of ADR 0006: `autoImpersonate` is resolved BEFORE
	// the unknown-signer seam, `onUnknownSigner` is the policy afterwards, and giving the capability
	// a fork-aware default gives the policy no new value and does not touch the seam.
	let autoImpersonate = executionParameters.autoImpersonate;
	if (autoImpersonate === undefined && actualChainSemantics.autoImpersonate !== undefined) {
		autoImpersonate = actualChainSemantics.autoImpersonate;
	}
	if (autoImpersonate === undefined) {
		autoImpersonate = fork !== undefined;
	}

	// Resolve the unknown-signer policy (priority: params > chain config > top-level config >
	// default `'auto'`), mirroring how `autoImpersonate` above is threaded. `'auto'` resolves to
	// `'ask'` only where the run can actually ask a human for text, so a CI run never prompts:
	// it is the CAPABILITY that keeps CI safe, not the absence of a resolver.
	let onUnknownSigner = executionParameters.onUnknownSigner;
	if (onUnknownSigner === undefined && actualChainSemantics.onUnknownSigner !== undefined) {
		onUnknownSigner = actualChainSemantics.onUnknownSigner;
	}
	if (onUnknownSigner === undefined && config?.onUnknownSigner !== undefined) {
		onUnknownSigner = config.onUnknownSigner;
	}
	if (onUnknownSigner === undefined) {
		onUnknownSigner = 'auto';
	}

	let autoMine = executionParameters.autoMine;
	if (autoMine === undefined && actualChainSemantics.autoMine !== undefined) {
		autoMine = actualChainSemantics.autoMine;
	}
	if (autoMine === undefined) {
		autoMine = false;
	}

	return {
		askBeforeProceeding: executionParameters.askBeforeProceeding || false,
		chain: chainInfo,
		pollingInterval: actualChainConfig.pollingInterval,
		reportGasUse: executionParameters.reportGasUse || false,
		saveDeployments,
		tags: executionParameters.tags || [],
		environment: {
			name: environmentName,
			tags: environmentTags,
			fork,
			deterministicDeployment: actualChainSemantics.deterministicDeployment,
			autoImpersonate,
			onUnknownSigner,
			confirmationsRequired: actualChainSemantics.confirmationsRequired,
			autoMine,
			deleteDeploymentsIfDifferentGenesisHash: actualChainConfig.deleteDeploymentsIfDifferentGenesisHash,
		},
		extra: executionParameters.extra,
		provider,
		scripts,
		reset: executionParameters.reset || false,
		// Passed through verbatim (by identity, no defaulting here): this single funnel is
		// what makes the prompt reach EVERY `createEnvironment` caller, `loadEnvironmentFromStore`
		// included, exactly as `autoImpersonate` above does (ADR 0007). Which runtime supplies a
		// prompt, and whether that prompt can ask for free text, is decided by the adapter
		// (`@rocketh/node` does, `@rocketh/web` deliberately does not).
		promptExecutor: executionParameters.promptExecutor,
	};
}

export async function loadEnvironmentFromStore<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Extra extends Record<string, unknown> = Record<string, unknown>,
>(
	config: UserConfig<NamedAccounts, Data>,
	executionParams: ExecutionParams<Extra>,
	deploymentStore: DeploymentStore,
): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
	const userConfig = resolveConfig<NamedAccounts, Data>(config, executionParams.config);
	const {name: environmentName, fork} = getEnvironmentName(executionParams);
	const chainId = await getChainIdForEnvironment(userConfig, environmentName, executionParams);
	const resolvedExecutionParams = resolveExecutionParams(userConfig, executionParams, chainId);
	// console.log(JSON.stringify(resolvedConfig, null, 2));
	const {external, internal} = await createEnvironment<NamedAccounts, Data, UnknownDeployments>(
		userConfig,
		resolvedExecutionParams,
		deploymentStore,
	);

	await internal.loadDeployments({reset: resolvedExecutionParams.reset});
	return external;
}

export function createExecutor(deploymentStore: DeploymentStore, promptExecutor: PromptExecutor) {
	async function resolveConfigAndExecuteDeployScriptModules<
		NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
		Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
		ArgumentsType = undefined,
		Extra extends Record<string, unknown> = Record<string, unknown>,
	>(
		moduleObjects: ModuleObject<NamedAccounts, Data, ArgumentsType>[],
		userConfig: UserConfig,
		executionParams?: ExecutionParams<Extra>,
		args?: ArgumentsType,
	): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
		executionParams = executionParams || {};
		const resolveduserConfig = resolveConfig<NamedAccounts, Data>(userConfig, executionParams.config);
		const {name: environmentName, fork} = getEnvironmentName(executionParams);
		const chainId = await getChainIdForEnvironment(resolveduserConfig, environmentName, executionParams);
		const resolvedExecutionParams = resolveExecutionParams(resolveduserConfig, executionParams, chainId);
		return executeDeployScriptModules<NamedAccounts, Data, ArgumentsType>(
			moduleObjects,
			resolveduserConfig,
			resolvedExecutionParams,
			args,
		);
	}

	async function executeDeployScriptModules<
		NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
		Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
		ArgumentsType = undefined,
	>(
		moduleObjects: ModuleObject<NamedAccounts, Data, ArgumentsType>[],
		userConfig: ResolvedUserConfig<NamedAccounts, Data>,
		resolvedExecutionParams: ResolvedExecutionParams,
		args?: ArgumentsType,
	): Promise<Environment<NamedAccounts, Data, UnknownDeployments>> {
		const scriptModuleById: {[id: string]: DeployScriptModule<NamedAccounts, Data, ArgumentsType>} = {};
		const scriptIdBags: {[tag: string]: string[]} = {};
		const ids: string[] = [];

		for (const moduleObject of moduleObjects) {
			const id = moduleObject.id;
			let scriptModule = moduleObject.module;
			scriptModuleById[id] = scriptModule;

			let scriptTags = scriptModule.tags;
			if (scriptTags !== undefined) {
				if (typeof scriptTags === 'string') {
					scriptTags = [scriptTags];
				}
				for (const tag of scriptTags) {
					if (tag.indexOf(',') >= 0) {
						throw new Error('Tag cannot contains commas');
					}
					const bag = scriptIdBags[tag] || [];
					scriptIdBags[tag] = bag;
					bag.push(id);
				}
			}

			if (resolvedExecutionParams.tags !== undefined && resolvedExecutionParams.tags.length > 0) {
				let found = false;
				if (scriptTags !== undefined) {
					for (const tagToFind of resolvedExecutionParams.tags) {
						for (const tag of scriptTags) {
							if (tag === tagToFind) {
								ids.push(id);
								found = true;
								break;
							}
						}
						if (found) {
							break;
						}
					}
				}
			} else {
				ids.push(id);
			}
		}

		// The executor was handed a `PromptExecutor` at construction, so a run driven through it
		// is interactive by default. Run parameters still WIN when they carry one (that is how a
		// test injects a fake), and callers that resolved their parameters themselves before
		// calling in (`@rocketh/node`, `@rocketh/web`) get the executor's prompt from here.
		const executionParamsWithPrompt: ResolvedExecutionParams = resolvedExecutionParams.promptExecutor
			? resolvedExecutionParams
			: {...resolvedExecutionParams, promptExecutor};

		const {internal, external} = await createEnvironment<NamedAccounts, Data, UnknownDeployments>(
			userConfig,
			executionParamsWithPrompt,
			deploymentStore,
		);

		// TODO store in the execution context
		const gasPriceEstimate = await getRoughGasPriceEstimate(external.network.provider);
		if (resolvedExecutionParams.askBeforeProceeding) {
			console.log(
				`Environment: ${external.name} \n \t Chain: ${external.network.chain.name} \n \t Tags: ${Object.keys(
					external.tags,
				).join(',')}`,
			);

			if (resolvedExecutionParams.reset) {
				const message = `This will delete all deployments for env: ${external.name}, including any successful, failed or in-flight state.${Object.keys(external.tags).length > 0 ? `\n (Note that this applies to all deployments irrespective of the tags provided)` : ''}\nDo you want to proceed?`;

				const prompt = await promptExecutor.prompt({
					type: 'confirm',
					name: 'proceed',
					message,
				});

				if (!prompt.proceed) {
					promptExecutor.exit();
				}
			}

			const prompt = await promptExecutor.prompt({
				type: 'confirm',
				name: 'proceed',
				message: `gas price is currently in this range:
slow: ${formatEther(gasPriceEstimate.slow.maxFeePerGas)} (priority: ${formatEther(
					gasPriceEstimate.slow.maxPriorityFeePerGas,
				)})
average: ${formatEther(gasPriceEstimate.average.maxFeePerGas)} (priority: ${formatEther(
					gasPriceEstimate.average.maxPriorityFeePerGas,
				)})
fast: ${formatEther(gasPriceEstimate.fast.maxFeePerGas)} (priority: ${formatEther(
					gasPriceEstimate.fast.maxPriorityFeePerGas,
				)})

Do you want to proceed (note that gas price can change for each tx)`,
			});

			if (!prompt.proceed) {
				promptExecutor.exit();
			}
		}

		await internal.loadDeployments({reset: resolvedExecutionParams.reset});

		await internal.recoverTransactionsIfAny();

		const scriptsRegisteredToRun: {[filename: string]: boolean} = {};
		const scriptsToRun: Array<{
			func: DeployScriptModule<NamedAccounts, Data, ArgumentsType>;
			id: string;
		}> = [];
		const scriptsToRunAtTheEnd: Array<{
			func: DeployScriptModule<NamedAccounts, Data, ArgumentsType>;
			id: string;
		}> = [];
		function recurseDependencies(id: string) {
			if (scriptsRegisteredToRun[id]) {
				return;
			}
			const scriptModule = scriptModuleById[id];
			if (scriptModule.dependencies) {
				for (const dependency of scriptModule.dependencies) {
					const scriptFilePathsToAdd = scriptIdBags[dependency];
					if (scriptFilePathsToAdd) {
						for (const scriptFilenameToAdd of scriptFilePathsToAdd) {
							recurseDependencies(scriptFilenameToAdd);
						}
					}
				}
			}
			if (!scriptsRegisteredToRun[id]) {
				if (scriptModule.runAtTheEnd) {
					scriptsToRunAtTheEnd.push({
						id: id,
						func: scriptModule,
					});
				} else {
					scriptsToRun.push({
						id: id,
						func: scriptModule,
					});
				}
				scriptsRegisteredToRun[id] = true;
			}
		}
		for (const id of ids) {
			recurseDependencies(id);
		}

		for (const deployScript of scriptsToRun.concat(scriptsToRunAtTheEnd)) {
			if (deployScript.func.id && external.hasMigrationBeenDone(deployScript.func.id)) {
				logger.info(`skipping ${deployScript.id} as migrations already executed and complete`);
				continue;
			}
			let skip = false;
			const spinner = spin(`- Executing ${deployScript.id}`);
			// if (deployScript.func.skip) {
			// 	const spinner = spin(`  - skip?()`);
			// 	try {
			// 		skip = await deployScript.func.skip(external, args);
			// 		spinner.succeed(skip ? `skipping ${filename}` : undefined);
			// 	} catch (e) {
			// 		spinner.fail();
			// 		throw e;
			// 	}
			// }
			if (!skip) {
				let result;

				try {
					result = await deployScript.func(external, args);
					spinner.succeed(`\n`);
				} catch (e) {
					spinner.fail();
					throw e;
				}
				if (result && typeof result === 'boolean') {
					if (!deployScript.func.id) {
						throw new Error(
							`${deployScript.id} return true to not be executed again, but does not provide an id. the script function needs to have the field "id" to be set`,
						);
					}
					internal.recordMigration(deployScript.func.id);
				}
			}
		}

		if (resolvedExecutionParams.reportGasUse) {
			const provider = external.network.provider;
			const transactionHashes = provider.transactionHashes;

			let totalGasUsed = 0;
			let totalPrice = 0n;
			let prices: bigint[] = [];
			for (const hash of transactionHashes) {
				const transactionReceipt = await provider.request({method: 'eth_getTransactionReceipt', params: [hash]});
				if (transactionReceipt) {
					const gasUsed = Number(transactionReceipt.gasUsed);
					totalGasUsed += gasUsed;
					const gasPrice = BigInt(transactionReceipt.effectiveGasPrice);
					totalPrice += gasPrice * BigInt(gasUsed);
					prices.push(gasPrice);
				}
			}

			const averageGasPrice =
				prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0n) / BigInt(prices.length) : 0n;

			console.log({totalGasUsed, totalPrice: formatEther(totalPrice), averageGasPrice: formatEther(averageGasPrice)});
		}

		return external;
	}

	return {
		executeDeployScriptModules,
		resolveConfigAndExecuteDeployScriptModules,
	};
}
