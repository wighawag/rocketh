/**
 * `createTestEnvironment` — a REAL rocketh environment wired to a mock EIP-1193 provider.
 *
 * This is the ONLY test-environment builder in this package. It replaced (and the legacy fake
 * has since been removed) a hand-built `Environment` object literal that reimplemented
 * `broadcastExecution` / `broadcastDeployment`, so no test using it ever exercised
 * `createEnvironment` in `packages/rocketh` (account resolution, `eth_accounts`,
 * auto-impersonation, the single `broadcastTransaction` choke point). Do NOT reintroduce a
 * fabricated environment literal here; see the *test environment* vs *mock environment* entry
 * in `CONTEXT.md`. This harness instead composes the exported
 * `resolveConfig` → `getChainIdForEnvironment` → `resolveExecutionParams` →
 * `createEnvironment` pipeline just like production, against a canned mock provider.
 *
 * NON-GOAL: no stateful chain simulation. The provider answers the calls real setup and
 * the real broadcast path make with canned or caller-supplied responses; it does not model
 * chain state.
 *
 * Also see `packages/rocketh/test/addressSigners-casing.test.ts`, which is the sanctioned
 * prior art for `rocketh`-internal tests: `rocketh` cannot import `@rocketh/test-utils`
 * because this file makes test-utils depend on `rocketh`, and the reverse edge would
 * close an nx project-graph cycle.
 */

import {createEnvironment, getChainIdForEnvironment, resolveConfig, resolveExecutionParams} from 'rocketh';
import {privateKey} from '@rocketh/signer';
import type {
	DeploymentStore,
	Environment,
	ExecutionParams,
	UnresolvedUnknownNamedAccounts,
	UserConfig,
} from '@rocketh/core/types';

import {createMockProvider, type MockProvider, type MockProviderConfig} from './index.js';

// ============================================================================
// Types
// ============================================================================

/**
 * `internal` handle returned by `createEnvironment` — recover pending transactions,
 * record migrations, load deployments from the store. Not exported from the
 * `rocketh` entry, so we infer it here.
 */
export type InternalTestEnvironment = Awaited<ReturnType<typeof createEnvironment>>['internal'];

/**
 * Options for {@link createTestEnvironment}.
 *
 * `accounts` uses the real `UserConfig.accounts` shape (per-account number, private key,
 * protocol string, bare address, or per-network map).
 */
export type CreateTestEnvironmentOptions = {
	/** Named accounts in `UserConfig.accounts` shape. Defaults to `{}` (no named accounts). */
	accounts?: UnresolvedUnknownNamedAccounts;

	/** Addresses the node exposes through `eth_accounts`. Defaults to `[]`. */
	nodeAccounts?: `0x${string}`[];

	/**
	 * Whether `hardhat_impersonateAccount` succeeds or throws.
	 * Defaults to `'succeed'`. Independent from {@link autoImpersonate}: setup only calls
	 * the RPC when `autoImpersonate` is on.
	 */
	impersonation?: 'succeed' | 'fail';

	/** Chain id. Defaults to `31337`. */
	chainId?: number;

	/** Environment name. Defaults to `'memory'`. */
	environmentName?: string;

	/**
	 * Generic partial `UserConfig` merged into what is resolved. Downstream tasks need
	 * settings the harness cannot enumerate in advance (e.g. custom `chains[id]` fields,
	 * a caller-supplied `signerProtocols` entry). Precedence: what you set here wins,
	 * except that the shipped `privateKey` signer protocol is always registered (any
	 * caller-supplied `signerProtocols.privateKey` overrides it).
	 */
	config?: Partial<UserConfig>;

	/**
	 * Generic partial `ExecutionParams` merged into what is resolved (`autoImpersonate`,
	 * `autoMine`, `saveDeployments`, `tags`, `extra`, ...). `provider` is always the
	 * harness's own mock provider and cannot be overridden here.
	 */
	executionParams?: Partial<Omit<ExecutionParams, 'provider'>>;

	/**
	 * Canned mock-provider responses (see {@link MockProviderConfig}). Overrides win
	 * over the harness's own defaults for the RPCs real setup / broadcast calls
	 * (`eth_chainId`, `eth_accounts`, `eth_getBlockByNumber`, `eth_getTransactionReceipt`,
	 * `hardhat_impersonateAccount`, ...).
	 */
	providerConfig?: MockProviderConfig;

	/**
	 * Reuse an existing Map-backed store across two `createTestEnvironment` calls to
	 * assert deployments survive a fresh environment (see acceptance criterion in
	 * `work/tasks/ready/test-env-harness.md`).
	 */
	deploymentStore?: DeploymentStore;
};

export type TestEnvironmentResult = {
	/** IDENTITY (not a spread) of what `createEnvironment` returned as `external`. */
	env: Environment;
	/** IDENTITY of what `createEnvironment` returned as `internal`. */
	internal: InternalTestEnvironment;
	/** The mock provider handle: set canned responses, inspect requests. */
	provider: MockProvider;
	/** The Map-backed deployment store used. Reuse it across environments to persist. */
	deploymentStore: DeploymentStore;
};

// ============================================================================
// Map-backed DeploymentStore
// ============================================================================

/**
 * A `DeploymentStore` backed by an in-memory `Map`. Deliberately not a filesystem
 * store: this file is browser-safe and callers of the harness can reuse the same
 * instance across two `createTestEnvironment` calls to assert deployment
 * persistence across a fresh environment.
 *
 * Contrast with `@rocketh/web`'s `createEmptyDeploymentStore`, whose bodies are
 * commented out: it swallows writes, so nothing survives a second environment
 * creation.
 */
export function createMapDeploymentStore(): DeploymentStore {
	const files = new Map<string, string>();
	const keyOf = (folder: string, env: string, name: string) => `${folder}\u0000${env}\u0000${name}`;
	return {
		async listFiles(folder, environmentName, filter) {
			const prefix = `${folder}\u0000${environmentName}\u0000`;
			const names: string[] = [];
			for (const k of files.keys()) {
				if (k.startsWith(prefix)) {
					const name = k.slice(prefix.length);
					if (!filter || filter(name)) names.push(name);
				}
			}
			return names;
		},
		async deleteAll(folder, environmentName) {
			const prefix = `${folder}\u0000${environmentName}\u0000`;
			for (const k of Array.from(files.keys())) if (k.startsWith(prefix)) files.delete(k);
		},
		async hasFile(folder, environmentName, name) {
			return files.has(keyOf(folder, environmentName, name));
		},
		async writeFile(folder, environmentName, name, content) {
			files.set(keyOf(folder, environmentName, name), content);
		},
		async writeFileWithChainInfo(chainInfo, folder, environmentName, name, content) {
			const chainKey = keyOf(folder, environmentName, '.chain');
			if (!files.has(chainKey)) {
				files.set(chainKey, JSON.stringify(chainInfo));
			}
			files.set(keyOf(folder, environmentName, name), content);
		},
		async readFile(folder, environmentName, name) {
			const v = files.get(keyOf(folder, environmentName, name));
			if (v === undefined) throw new Error(`no file ${name} in ${folder}/${environmentName}`);
			return v;
		},
		async deleteFile(folder, environmentName, name) {
			files.delete(keyOf(folder, environmentName, name));
		},
	};
}

// ============================================================================
// Harness
// ============================================================================

const GENESIS_HASH = `0x${'0'.repeat(63)}1` as `0x${string}`;

/**
 * Construct a real rocketh environment against a mock provider. See
 * {@link CreateTestEnvironmentOptions} for what you can express.
 *
 * The returned `env` IS the object `createEnvironment` returned — not a spread or a
 * wrapper. Every capability on it comes from the real environment module.
 */
export async function createTestEnvironment(
	options: CreateTestEnvironmentOptions = {},
): Promise<TestEnvironmentResult> {
	const chainId = options.chainId ?? 31337;
	const environmentName = options.environmentName ?? 'memory';
	const nodeAccounts = options.nodeAccounts ?? [];
	const impersonation = options.impersonation ?? 'succeed';

	// Per-tx address bookkeeping. Real production takes a deployment's address from
	//  `receipt.contractAddress`, so a receipt that returns the SAME address for every
	//  transaction collapses every deployment in a test onto one address (e.g. a diamond
	//  deploying many facets plus a proxy). The map keys the address by tx hash so a
	//  receipt lookup for tx N returns address N.
	let txCounter = 0;
	const contractAddressForHash = new Map<string, `0x${string}`>();

	function nextHashAndAddress(prefixChar: string): {hash: `0x${string}`; contractAddress: `0x${string}`} {
		txCounter++;
		const hex = txCounter.toString(16);
		const hash = `0x${prefixChar.repeat(64 - hex.length)}${hex}` as `0x${string}`;
		const contractAddress = `0x${prefixChar.repeat(40 - hex.length)}${hex}` as `0x${string}`;
		contractAddressForHash.set(hash, contractAddress);
		return {hash, contractAddress};
	}

	// Instantiate the mock provider first, THEN layer our defaults for the RPCs real setup
	//  calls (which `createMockProvider`'s built-in defaults omit or answer badly). Caller
	//  `providerConfig.responses` are re-applied last so callers can always override.
	const provider = createMockProvider();

	const harnessDefaults: MockProviderConfig['responses'] = {
		eth_chainId: () => `0x${chainId.toString(16)}` as `0x${string}`,
		eth_accounts: () => nodeAccounts,
		eth_getBlockByNumber: (params?: unknown[]) => {
			const tag = params?.[0];
			// return a genuine genesis for the '0x0' probe so the genesis fingerprint is captured
			if (tag === '0x0') return {number: '0x0', hash: GENESIS_HASH};
			return {number: '0x1', hash: `0x${'b'.repeat(64)}`};
		},
		eth_getTransactionByHash: () => null,
		eth_call: () => '0x',
		hardhat_impersonateAccount: () => {
			if (impersonation === 'fail') {
				// mimic anvil/hardhat's shape closely enough that setup's silent-fail filter
				//  (`method not supported` / `Method not found`) does NOT swallow us — we
				//  want tests to observe the failure.
				throw new Error('hardhat_impersonateAccount rejected in test harness');
			}
			return null;
		},
		// Broadcast: per-tx hash + contractAddress so multiple deployments in one test get
		//  distinct addresses (see the note on `contractAddressForHash` above).
		eth_sendTransaction: () => nextHashAndAddress('c').hash,
		eth_sendRawTransaction: () => nextHashAndAddress('d').hash,
		eth_signTransaction: () => `0x${'2'.repeat(200)}` as `0x${string}`,
		eth_getTransactionReceipt: (params?: unknown[]) => {
			const hash = params?.[0] as `0x${string}`;
			const contractAddress = contractAddressForHash.get(hash) ?? (`0x${'0'.repeat(40)}` as `0x${string}`);
			return {
				contractAddress,
				status: '0x1' as const,
				transactionHash: hash,
				blockHash: `0x${'b'.repeat(64)}` as `0x${string}`,
				blockNumber: '0x1' as const,
				transactionIndex: '0x0' as const,
				gasUsed: '0x5208' as const,
				effectiveGasPrice: '0x3b9aca00' as const,
				logs: [],
				from: '0x0000000000000000000000000000000000000000' as `0x${string}`,
			};
		},
		eth_blockNumber: () => '0x1' as `0x${string}`,
		eth_estimateGas: () => '0x5208' as `0x${string}`,
		eth_getTransactionCount: () => '0x0' as `0x${string}`,
		eth_gasPrice: () => '0x3b9aca00' as `0x${string}`,
		eth_getBalance: () => `0x${BigInt('1000000000000000000000').toString(16)}` as `0x${string}`,
		eth_getCode: () => '0x' as `0x${string}`,
		evm_mine: () => null,
	};
	for (const [method, response] of Object.entries(harnessDefaults)) {
		provider.setResponse(method, response as MockProviderConfig['responses'] extends infer R ? R : never);
	}
	if (options.providerConfig?.responses) {
		for (const [method, response] of Object.entries(options.providerConfig.responses)) {
			provider.setResponse(method, response);
		}
	}
	if (options.providerConfig?.onUnmockedMethod) {
		provider.setConfig({
			responses: {
				// merge our defaults + caller responses (setConfig replaces the whole config)
				...harnessDefaults,
				...(options.providerConfig?.responses ?? {}),
			},
			onUnmockedMethod: options.providerConfig.onUnmockedMethod,
		});
	}

	// Build the UserConfig. Enforce two things the harness cannot function without:
	//  - a tiny `defaultPollingInterval` so a mis-mocked receipt fails fast instead of
	//    hanging (waitForTransactionReceipt recurses whenever the receipt lacks
	//    `blockHash`, with no deadline);
	//  - a chain entry with a `.info`, so `getChainConfigFromUserConfig` does not
	//    console.error 'chain with id X has no public info'.
	//  A caller-supplied `config.chains[chainId]` merges over the defaults.
	const callerChain = options.config?.chains?.[chainId];
	const defaultChainInfo = {
		id: chainId,
		name: 'test',
		nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
		rpcUrls: {default: {http: [] as readonly string[]}},
	} as const;
	const chains = {
		...(options.config?.chains ?? {}),
		[chainId]: {
			...(callerChain ?? {}),
			info: {
				...defaultChainInfo,
				...(callerChain?.info ?? {}),
			},
		},
	};

	const userConfig: UserConfig = {
		...options.config,
		accounts: options.accounts ?? options.config?.accounts,
		signerProtocols: {
			// register the REAL shipped `privateKey` protocol so a private-key account can
			//  actually resolve to a `signerOnly` signer. Callers can override it, or
			//  register additional protocols alongside.
			privateKey,
			...(options.config?.signerProtocols ?? {}),
		},
		defaultPollingInterval: options.config?.defaultPollingInterval ?? 0.001,
		chains,
	};

	const executionParams: ExecutionParams = {
		environment: environmentName,
		provider,
		// default ON: the store is Map-backed and cost-free, and this is what lets a
		//  second `createTestEnvironment` on the same `deploymentStore` reload the
		//  deployments a prior env saved. `resolveExecutionParams` would otherwise
		//  force `false` for the `memory` environment when a provider is present.
		saveDeployments: true,
		...options.executionParams,
	};

	const resolvedConfig = resolveConfig(userConfig);
	const resolvedChainId = await getChainIdForEnvironment(resolvedConfig, environmentName, executionParams);
	const resolvedExecutionParams = resolveExecutionParams(resolvedConfig, executionParams, resolvedChainId);

	const deploymentStore = options.deploymentStore ?? createMapDeploymentStore();

	const {external, internal} = await createEnvironment(resolvedConfig, resolvedExecutionParams, deploymentStore);

	return {env: external, internal, provider, deploymentStore};
}
