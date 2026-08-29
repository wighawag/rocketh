/**
 * A fork run does NOT save, unless somebody asked it to.
 *
 * A fork run IS the forked network for the purposes of deployment RECORDS
 * (`docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md`), which is exactly right
 * for READING and exactly wrong for WRITING: the environment NAME is the forked network's, so the
 * name-based default made a rehearsal of mainnet write into `deployments/mainnet`. The rule now
 * lives in core, in `resolveExecutionParams`, rather than in each caller that learns to fork: it
 * used to live in hardhat-deploy, which paired its fork input with `saveDeployments: false`
 * itself, and any second caller forgetting that argument corrupted production records silently.
 *
 * Three properties are pinned here, and the middle one is the reason the test file exists:
 *
 * - a fork does not save BY DEFAULT, on BOTH default branches. The no-provider branch
 *   short-circuits to `true` before the environment name is looked at, and a fork driven without a
 *   provider is precisely the `--is-fork` case, so a fix applied to only one branch still passes a
 *   single-path test. Both are asserted.
 * - an explicit `saveDeployments: true` still saves on a fork, because "I know what I am doing,
 *   write it" has to stay expressible (and the CLI's `--save-deployments` is set-only, so on a
 *   fork it is the ONLY way to turn saving on, which is the right shape once the default is off).
 * - a NON-fork run is completely unchanged, `memory`/`hardhat`/`default` and the no-provider case
 *   included, so nothing was loosened while the fork case was tightened.
 *
 * The assertions are DISCRIMINATING by construction: each fork case is contrasted with the
 * otherwise-identical run that is not a fork, so a regression to a hardcoded value fails.
 *
 * The READ path is asserted here too, although it is untouched, because it sits next to the code
 * being changed and it is the property the whole feature exists for: a fork still loads the forked
 * network's records, and still skips the chain-identity check to do it.
 *
 * Like the other tests in this folder these do NOT use `@rocketh/test-utils` (nx cycle) and build
 * a REAL environment locally, through `loadEnvironmentFromStore`, which is also the path
 * hardhat-deploy takes.
 */

import {describe, it, expect, vi} from 'vitest';
import {resolveConfig, resolveExecutionParams, loadEnvironmentFromStore} from '../src/executor/index.js';
import type {
	ChainInfo,
	ChainUserConfig,
	Deployment,
	DeploymentStore,
	ExecutionParams,
	PromptExecutor,
	UserConfig,
} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

const ACCOUNT = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' as `0x${string}`;
const GENESIS_HASH = ('0x' + '0'.repeat(64)) as `0x${string}`;
const EXISTING_CONTRACT = '0xabc0000000000000000000000000000000000000' as `0x${string}`;
const NEW_CONTRACT = ('0x' + 'f'.repeat(40)) as `0x${string}`;

const LOCAL_RPC_URL = 'http://127.0.0.1:8545';
/** Deliberately a PUBLIC endpoint: no fork run may ever end up pointed at it. */
const MAINNET_RPC_URL = 'https://mainnet.example.invalid/production';

const chainInfo = (id: number, name: string, rpcUrl: string): ChainInfo => ({
	id,
	name,
	nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
	rpcUrls: {default: {http: [rpcUrl]}},
	chainType: 'default',
});

/** The user's LOCALHOST dev node entry. Fully described, so no test can see a stray notice. */
const localChain: ChainUserConfig = {
	rpcUrl: LOCAL_RPC_URL,
	info: chainInfo(31337, 'localhost', LOCAL_RPC_URL),
	tags: ['local'],
};

/** The network being simulated, whose records a fork reads and must not write. */
const mainnetChain: ChainUserConfig = {
	rpcUrl: MAINNET_RPC_URL,
	info: chainInfo(1, 'mainnet', MAINNET_RPC_URL),
	tags: ['mainnet'],
};

const config: UserConfig = {
	accounts: {deployer: ACCOUNT},
	defaultPollingInterval: 0.001,
	chains: {31337: localChain, 1: mainnetChain},
};

/** A node reporting `chainId` (the CONNECTED chain), whatever the run simulates. */
function mockProvider(chainId: number): EIP1193ProviderWithoutEvents {
	return {
		request: (async (args: {method: string; params?: unknown}) => {
			switch (args.method) {
				case 'eth_chainId':
					return `0x${chainId.toString(16)}`;
				case 'eth_accounts':
					return [ACCOUNT];
				case 'eth_getBlockByNumber':
					return {number: '0x0', hash: GENESIS_HASH};
				default:
					throw new Error(`mock: ${args.method}`);
			}
		}) as any,
	} as EIP1193ProviderWithoutEvents;
}

/**
 * Deployment records of the network being FORKED: keyed by its name, and marked with ITS chain,
 * which is the marking a fork run has to be lenient about to read them at all.
 */
function mainnetRecords(): DeploymentStore & {files: Record<string, string>} {
	const files: Record<string, string> = {
		'.chain': JSON.stringify({chainId: '1', genesisHash: GENESIS_HASH}),
		'MyContract.json': JSON.stringify({address: EXISTING_CONTRACT, abi: []}),
	};
	return {
		files,
		listFiles: vi.fn(async (_f: unknown, _e: unknown, filter?: (name: string) => boolean) =>
			Object.keys(files).filter((name) => (filter ? filter(name) : true)),
		),
		deleteAll: vi.fn(async () => {
			for (const key of Object.keys(files)) delete files[key];
		}),
		hasFile: vi.fn(async (_f: unknown, _e: unknown, name: string) => files[name] !== undefined),
		writeFile: vi.fn(async (_f: unknown, _e: unknown, name: string, content: string) => {
			files[name] = content;
		}),
		writeFileWithChainInfo: vi.fn(async (_i: unknown, _f: unknown, _e: unknown, name: string, content: string) => {
			files[name] = content;
		}),
		readFile: vi.fn(async (_f: unknown, _e: unknown, name: string) => files[name] ?? ''),
		deleteFile: vi.fn(async (_f: unknown, _e: unknown, name: string) => {
			delete files[name];
		}),
	} as unknown as DeploymentStore & {files: Record<string, string>};
}

const promptExecutor: PromptExecutor = {
	async prompt() {
		return {proceed: true};
	},
	exit() {},
};

const record = (address: `0x${string}`) =>
	({
		abi: [] as any,
		address,
		argsData: '0x',
		bytecode: '0x',
		deployedBytecode: '0x',
		linkReferences: {},
	}) as unknown as Deployment<[]>;

/**
 * Resolve the params the way a run does. `provider` is OMITTED on purpose in half the cases:
 * that is the `--is-fork` shape (attach to a node by rpc url), and it is the branch that
 * short-circuits before the environment name.
 */
function resolve(options: {
	environment: ExecutionParams['environment'];
	withProvider: boolean;
	saveDeployments?: boolean;
	computedChainId?: number;
}) {
	const computedChainId = options.computedChainId ?? 31337;
	return resolveExecutionParams(
		resolveConfig(config),
		{
			environment: options.environment,
			provider: options.withProvider ? mockProvider(computedChainId) : undefined,
			saveDeployments: options.saveDeployments,
		},
		computedChainId,
	);
}

describe('a fork does not save by default', () => {
	/**
	 * The headline, and the contrast that makes it discriminating: the SAME configuration run
	 * against the SAME environment name differs only in being a fork, and differs in the answer.
	 * `mainnet` as a plain named run still saves, which is what makes the fork answer meaningful.
	 */
	it('leaves saving off for a fork of mainnet, while a plain mainnet run still saves', () => {
		const forked = resolve({environment: {fork: 'mainnet', chainId: 1}, withProvider: true});
		const notForked = resolve({environment: 'mainnet', withProvider: true, computedChainId: 1});

		expect(forked.saveDeployments).toBe(false);
		expect(notForked.saveDeployments).toBe(true);
	});

	/**
	 * The branch a fix could easily miss, and the one that matters most. With NO provider the
	 * default short-circuits to `true` before the environment name is consulted, and no provider
	 * is exactly how the `--is-fork` path attaches to an anvil fork. A fork term placed only on
	 * the named-environment branch leaves the hazard live here while the test above goes green.
	 */
	it('leaves saving off for a fork driven with NO provider, where the default short-circuits', () => {
		const forked = resolve({environment: {fork: 'mainnet', chainId: 1}, withProvider: false});
		const notForked = resolve({environment: 'mainnet', withProvider: false, computedChainId: 1});

		expect(forked.saveDeployments).toBe(false);
		expect(notForked.saveDeployments).toBe(true);
	});

	/**
	 * The fork input WITHOUT a declared chain id is the zero-configuration shape (and the one
	 * hardhat-deploy builds), so the rule must key off the fork descriptor's existence and never
	 * off a chain id being known.
	 */
	it('leaves saving off for a fork input that declares no chain id at all', () => {
		expect(resolve({environment: {fork: 'mainnet'}, withProvider: true}).saveDeployments).toBe(false);
		expect(resolve({environment: {fork: 'mainnet'}, withProvider: false}).saveDeployments).toBe(false);
	});
});

describe('an explicit value still wins on a fork', () => {
	/**
	 * The escape hatch, on both branches. Turning saving ON for a fork stays expressible, because
	 * the explicit parameter is read BEFORE any default; the run simply has to say so, which is
	 * the whole difference between a decision and an accident.
	 */
	it('saves when the run explicitly asks for it, with or without a provider', () => {
		expect(
			resolve({environment: {fork: 'mainnet', chainId: 1}, withProvider: true, saveDeployments: true}).saveDeployments,
		).toBe(true);
		expect(
			resolve({environment: {fork: 'mainnet', chainId: 1}, withProvider: false, saveDeployments: true}).saveDeployments,
		).toBe(true);
	});

	/** And an explicit `false` is honoured on a fork exactly as it always was. */
	it('honours an explicit false, which is what every caller passes today', () => {
		expect(
			resolve({environment: {fork: 'mainnet', chainId: 1}, withProvider: true, saveDeployments: false}).saveDeployments,
		).toBe(false);
	});
});

describe('a non-fork run is untouched', () => {
	/** The three ephemeral names still resolve to `false` with a provider. */
	it.each(['memory', 'hardhat', 'default'])('keeps saving off for the ephemeral name "%s"', (name) => {
		expect(resolve({environment: name, withProvider: true}).saveDeployments).toBe(false);
	});

	/** Any other name still saves with a provider. */
	it('keeps saving on for a named environment with a provider', () => {
		expect(resolve({environment: 'sepolia', withProvider: true}).saveDeployments).toBe(true);
	});

	/**
	 * The no-provider short-circuit is intact for a non-fork run: it answers `true` even for a
	 * name that would resolve to `false` with a provider. Odd, and deliberately preserved, since
	 * the fork term was added ABOVE it rather than instead of it.
	 */
	it('keeps the no-provider short-circuit, ephemeral names included', () => {
		expect(resolve({environment: 'memory', withProvider: false}).saveDeployments).toBe(true);
		expect(resolve({environment: 'sepolia', withProvider: false}).saveDeployments).toBe(true);
	});
});

describe('what the default is FOR', () => {
	async function buildEnvironment(environment: ExecutionParams['environment'], saveDeployments?: boolean) {
		const store = mainnetRecords();
		const env = await loadEnvironmentFromStore(
			config,
			{provider: mockProvider(31337), environment, saveDeployments, promptExecutor},
			store,
		);
		return {env, store};
	}

	/**
	 * The user-visible point: a rehearsal on a fork of mainnet writes NOTHING into
	 * `deployments/mainnet`, and it takes no argument from the caller to get that.
	 */
	it('makes a save during a fork rehearsal an in-memory one, leaving the records on disk alone', async () => {
		const {env, store} = await buildEnvironment({fork: 'mainnet', chainId: 1});

		expect(env.context.saveDeployments).toBe(false);
		await env.save('NewContract', record(NEW_CONTRACT));

		// the run sees its own deployment...
		expect(env.get('NewContract').address).toBe(NEW_CONTRACT);
		// ...and the forked network's folder never heard about it
		expect(store.writeFile).not.toHaveBeenCalled();
		expect(store.writeFileWithChainInfo).not.toHaveBeenCalled();
		expect(store.files['NewContract.json']).toBeUndefined();
	});

	/** The escape hatch reaches the environment, so a caller that means it still writes. */
	it('still writes when the run explicitly asked to save', async () => {
		const {env, store} = await buildEnvironment({fork: 'mainnet', chainId: 1}, true);

		expect(env.context.saveDeployments).toBe(true);
		await env.save('NewContract', record(NEW_CONTRACT));

		expect(JSON.parse(store.files['NewContract.json']).address).toBe(NEW_CONTRACT);
	});

	/**
	 * The READ half, untouched and asserted next to the write half because they are one sentence:
	 * a fork run still loads the forked network's records, on a node whose id is not that
	 * network's, which means the chain-identity check is still skipped for it.
	 */
	it('still READS the forked network records, on a node that is not that network', async () => {
		const {env} = await buildEnvironment({fork: 'mainnet', chainId: 1});

		expect(env.deployments['MyContract'].address).toBe(EXISTING_CONTRACT);
		expect(env.network.chain.id).toBe(31337);
		expect(env.network.fork).toEqual({networkName: 'mainnet', chainId: 1});
	});
});
