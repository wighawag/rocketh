/**
 * `rocketh -e mainnet --is-fork`: telling the CLI that the node it is about to attach to is a
 * fork of the environment named by `-e`.
 *
 * The flag is an ASSERTION about somebody else's node, not an instruction to make one. rocketh
 * ATTACHES to a fork; `--fork` reads as an imperative it cannot honour and is deliberately
 * reserved for a future in-process engine that could
 * (`docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md`, naming section). Both
 * halves are pinned below: the flag exists under the right name, and the reserved name is NOT
 * accepted, so a later "improvement" to `--fork` fails here rather than in a release.
 *
 * Nothing new is being taught to core. Every fork behaviour already exists and is tested in
 * `packages/rocketh/test/fork-*.test.ts`; what this file pins is that the CLI REACHES them, which
 * is one mapping (`-e <name> --is-fork` becomes the `ForkInput` `{fork: <name>}`) and one hazard:
 * the CLI hands commander's raw options to core with a SPREAD, and the raw `environment` is a
 * string, so a transform placed before the spread is silently overwritten by it.
 *
 * The end-to-end cases go through the real `getChainIdForEnvironment` / `resolveExecutionParams`
 * with only the network boundary faked (`fetch` is stubbed), so every claim about WHICH endpoint
 * a fork run dials is made about the url the production code actually asked for. That matters
 * most for the two urls a rehearsal must never touch: the forked network's own public endpoint,
 * and the user's dev-node bucket.
 *
 * Faking that boundary is what buys the endpoint assertions, and it is also the one thing these
 * tests cannot prove, so the same three cases were additionally run against a real anvil with the
 * BUILT bin script, and the transcript kept: `docs/spikes/is-fork-flag-on-the-cli/live-anvil-smoke.md`.
 */

import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {buildCLIProgram, resolveEnvironmentInput} from '../src/cli-options.js';
import {
	CONVENTIONAL_LOCAL_RPC_URL,
	getChainIdForEnvironment,
	getEnvironmentName,
	loadEnvironmentFromStore,
	resolveConfig,
	resolveExecutionParams,
} from 'rocketh';
import type {
	ChainInfo,
	ChainUserConfig,
	Deployment,
	DeploymentStore,
	ExecutionParams,
	PromptExecutor,
	UserConfig,
} from '@rocketh/core/types';

const ACCOUNT = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' as `0x${string}`;
const EXISTING_CONTRACT = '0xabc0000000000000000000000000000000000000' as `0x${string}`;
const NEW_CONTRACT = ('0x' + 'f'.repeat(40)) as `0x${string}`;

/** Deliberately a PUBLIC endpoint: no fork run may dial it, not even to ask who it is. */
const MAINNET_RPC_URL = 'https://mainnet.example.invalid/production';
/** The user's own dev node, on a port of their choosing: not where their fork listens. */
const DEV_NODE_RPC_URL = 'http://127.0.0.1:9999';
/** Where a fork listens when it is not on the conventional port. */
const FORK_RPC_URL = 'http://127.0.0.1:8546';

/** The genesis of the network being forked, as recorded in ITS deployment folder. */
const MAINNET_GENESIS_HASH = ('0x' + '1'.repeat(64)) as `0x${string}`;
/** What the node in front of us serves, which on a hardhat-style fork is not the above. */
const NODE_GENESIS_HASH = ('0x' + '2'.repeat(64)) as `0x${string}`;

const chainInfo = (id: number, name: string, rpcUrl: string): ChainInfo => ({
	id,
	name,
	nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
	rpcUrls: {default: {http: [rpcUrl]}},
	chainType: 'default',
});

/** The network being simulated: its settings are what a rehearsal must inherit. */
const mainnetChain: ChainUserConfig = {
	rpcUrl: MAINNET_RPC_URL,
	info: chainInfo(1, 'mainnet', MAINNET_RPC_URL),
	tags: ['mainnet', 'production'],
	confirmationsRequired: 5,
};

/** The user's LOCALHOST dev node entry, whose tags must never reach a mainnet rehearsal. */
const devNodeChain: ChainUserConfig = {
	rpcUrl: DEV_NODE_RPC_URL,
	info: chainInfo(31337, 'localhost', DEV_NODE_RPC_URL),
	tags: ['local'],
};

const baseConfig: UserConfig = {
	accounts: {deployer: ACCOUNT},
	defaultPollingInterval: 0.001,
	chains: {1: mainnetChain, 31337: devNodeChain},
};

// ---------------------------------------------------------------------------------------------
// the CLI surface
// ---------------------------------------------------------------------------------------------

/** Parse an argv the way the shell hands it over, without commander exiting the test process. */
function optionsFor(argv: string[]): Record<string, unknown> {
	const program = buildCLIProgram('0.0.0-test');
	program.exitOverride();
	program.configureOutput({writeOut: () => {}, writeErr: () => {}});
	program.parse(argv, {from: 'user'});
	return program.opts();
}

/**
 * The execution parameters the CLI builds, in the CLI's own ORDER: commander's raw options
 * spread first, then the individual fields core cannot receive raw. `environment` is one of
 * those, and this mirrors `packages/rocketh-node/src/cli.ts` deliberately, because the order is
 * the thing that can regress.
 */
function executionParamsFor(argv: string[]): ExecutionParams {
	const options = optionsFor(argv);
	return {
		...(options as ExecutionParams),
		environment: resolveEnvironmentInput(options),
	};
}

function optionFlags(): string[] {
	return buildCLIProgram('0.0.0-test')
		.options.map((option) => option.long)
		.filter((long): long is string => !!long);
}

describe('the flag exists, under the name the ADR reserved for it', () => {
	/** The headline mapping: the environment name IS the forked network's name. */
	it('turns `-e mainnet --is-fork` into a fork input naming mainnet', () => {
		expect(resolveEnvironmentInput(optionsFor(['-e', 'mainnet', '--is-fork']))).toEqual({fork: 'mainnet'});
	});

	/**
	 * The flag takes NO argument, so the environment name is not swallowed by it and the order
	 * the user types the two options in cannot matter.
	 */
	it('takes no argument, in either order', () => {
		for (const argv of [
			['-e', 'mainnet', '--is-fork'],
			['--is-fork', '-e', 'mainnet'],
		]) {
			const options = optionsFor(argv);
			expect(options.isFork).toBe(true);
			expect(options.environment).toBe('mainnet');
		}
	});

	/** Without it, the same command is a plain named run: a STRING, not a fork input. */
	it('leaves the same command a plain named run when it is absent', () => {
		const options = optionsFor(['-e', 'mainnet']);
		expect(options.isFork).toBeUndefined();
		expect(resolveEnvironmentInput(options)).toBe('mainnet');
	});

	/**
	 * `--fork` is RESERVED, for a future in-process engine that could actually create one, and it
	 * would then need somewhere to fork FROM and a block to fork AT. Introducing it now as a name
	 * or an alias would force that flag to be named around it later.
	 */
	it('does not accept `--fork`, as a name or as an alias', () => {
		expect(optionFlags()).toContain('--is-fork');
		expect(optionFlags()).not.toContain('--fork');
		expect(() => optionsFor(['-e', 'mainnet', '--fork'])).toThrow(/unknown option/i);
	});

	/**
	 * `--help` has to say the same thing the name does: this describes the node being attached
	 * to. A description that opens with the verb ("fork the given network") would promise a
	 * capability rocketh does not have, whatever the flag is called.
	 */
	it('describes the flag in --help as an assertion about the node, not an instruction', () => {
		const description = buildCLIProgram('0.0.0-test').options.find(
			(option) => option.long === '--is-fork',
		)?.description;

		expect(description).toBeDefined();
		expect(description).toMatch(/fork of/i);
		expect(description).not.toMatch(/^fork\b/i);
		expect(buildCLIProgram('0.0.0-test').helpInformation()).toContain('--is-fork');
	});

	/**
	 * The hazard the CLI's shape creates, pinned rather than described: the spread carries the
	 * RAW `environment`, which is the string commander parsed. A transform written before the
	 * spread would be overwritten by it and the run would silently not be a fork.
	 */
	it('transforms `environment` AFTER the spread, which would otherwise pass the raw string', () => {
		const options = optionsFor(['-e', 'mainnet', '--is-fork']);

		expect({...(options as ExecutionParams)}.environment).toBe('mainnet');
		expect(executionParamsFor(['-e', 'mainnet', '--is-fork']).environment).toEqual({fork: 'mainnet'});
	});
});

// ---------------------------------------------------------------------------------------------
// what the flag actually gets you, driven from the parameters the CLI builds
// ---------------------------------------------------------------------------------------------

type Dial = {url: string; method: string};

/** Every url the code under test dialled, in order, with the JSON-RPC method it asked for. */
let dials: Dial[];

/** A node answering as a fork would: its own chain id, its own genesis, its own accounts. */
function stubNode(options: {chainId: number; genesisHash?: `0x${string}`}) {
	vi.stubGlobal('fetch', async (url: string | URL, init: {body: string}) => {
		const request = JSON.parse(init.body) as {id: number; method: string};
		dials.push({url: String(url), method: request.method});
		let result: unknown;
		switch (request.method) {
			case 'eth_chainId':
				result = `0x${options.chainId.toString(16)}`;
				break;
			case 'eth_getBlockByNumber':
				result = {number: '0x0', hash: options.genesisHash ?? NODE_GENESIS_HASH};
				break;
			case 'eth_accounts':
				result = [ACCOUNT];
				break;
			default:
				throw new Error(`stub node: ${request.method}`);
		}
		return new Response(JSON.stringify({jsonrpc: '2.0', id: request.id, result}), {
			status: 200,
			headers: {'content-type': 'application/json'},
		});
	});
}

function endpointOf(provider: unknown): string {
	return (provider as {endpoint: string}).endpoint;
}

/**
 * Resolve a run the way `loadAndExecuteDeploymentsFromFiles` does, from CLI argv. The environment
 * NAME is read back out of the parameters rather than off the argv, since on a fork the name IS
 * the forked network's and that identity is part of what is under test.
 */
async function runFromCLI(argv: string[], userConfig: UserConfig = baseConfig) {
	const config = resolveConfig(userConfig);
	const executionParams = executionParamsFor(argv);
	const {name} = getEnvironmentName(executionParams);
	const chainId = await getChainIdForEnvironment(config, name, executionParams);
	return {name, chainId, resolved: resolveExecutionParams(config, executionParams, chainId)};
}

beforeEach(() => {
	dials = [];
	// a chain nobody described warns, and these tests describe only what they are about
	vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('`rocketh -e mainnet --is-fork` with nothing configured', () => {
	/**
	 * The headline path, and the one a reader tries first: `anvil --fork-url <mainnet>` in one
	 * terminal, `rocketh -e mainnet --is-fork` in the other, with no configuration file change at
	 * all. anvil reports chain id 1 because it IS forking mainnet, so the forked network's
	 * settings are found without an `environments` entry.
	 */
	it('dials the conventional local endpoint and rehearses with mainnet settings', async () => {
		stubNode({chainId: 1});

		const {name, chainId, resolved} = await runFromCLI(['-e', 'mainnet', '--is-fork']);

		expect(resolved.environment.fork).toEqual({networkName: 'mainnet'});
		// the environment name IS the forked network's, which is the folder the run reads
		expect(name).toBe('mainnet');
		expect(dials).toEqual([{url: CONVENTIONAL_LOCAL_RPC_URL, method: 'eth_chainId'}]);
		expect(endpointOf(resolved.provider)).toBe(CONVENTIONAL_LOCAL_RPC_URL);
		// the SIMULATED network's settings and tags, never the dev node's
		expect(resolved.environment.tags).toEqual(['mainnet', 'production']);
		expect(resolved.environment.confirmationsRequired).toBe(5);
		// ...and the transactions declare what the NODE reports
		expect(chainId).toBe(1);
		expect(resolved.chain.id).toBe(1);
	});

	/** Rehearsing a Safe-owned step is the point, so impersonation is on without asking. */
	it('turns impersonation on, which is what makes a Safe-owned step execute', async () => {
		stubNode({chainId: 1});

		const {resolved} = await runFromCLI(['-e', 'mainnet', '--is-fork']);

		expect(resolved.environment.autoImpersonate).toBe(true);
	});
});

describe('the flag is what makes the difference', () => {
	/**
	 * The discriminating contrast: the SAME argv but for the flag, against the SAME configuration.
	 * Without it `-e mainnet` is a real mainnet run, which dials mainnet and saves into its folder.
	 */
	const declaredConfig: UserConfig = {...baseConfig, environments: {mainnet: {chain: 1}}};

	it('makes a run a fork of mainnet rather than a run against mainnet', async () => {
		stubNode({chainId: 1});
		const forked = await runFromCLI(['-e', 'mainnet', '--is-fork'], declaredConfig);

		expect(forked.resolved.environment.fork).toEqual({networkName: 'mainnet', chainId: 1});
		expect(endpointOf(forked.resolved.provider)).toBe(CONVENTIONAL_LOCAL_RPC_URL);
		expect(endpointOf(forked.resolved.provider)).not.toBe(MAINNET_RPC_URL);
	});

	it('leaves the same command without the flag a plain mainnet run', async () => {
		stubNode({chainId: 1});
		const plain = await runFromCLI(['-e', 'mainnet'], declaredConfig);

		expect(plain.resolved.environment.fork).toBeUndefined();
		expect(endpointOf(plain.resolved.provider)).toBe(MAINNET_RPC_URL);
		// a plain named run never dials to discover an id: that is fork-only, by necessity
		expect(dials).toEqual([]);
	});
});

describe('the flag composes with the configuration that already exists', () => {
	/**
	 * A fork listening somewhere else says so in `whenForked`, and an entry may carry NOTHING but
	 * that layer, so naming a port does not mean declaring a chain the user is not using.
	 */
	it('honours a `whenForked.rpcUrl` naming a fork on another port', async () => {
		stubNode({chainId: 1});

		const {resolved} = await runFromCLI(['-e', 'mainnet', '--is-fork'], {
			...baseConfig,
			environments: {mainnet: {whenForked: {rpcUrl: FORK_RPC_URL}}},
		});

		expect(dials[0]?.url).toBe(FORK_RPC_URL);
		expect(endpointOf(resolved.provider)).toBe(FORK_RPC_URL);
	});

	/**
	 * ...and the endpoint is the one field the fork does NOT inherit from `overrides`, which
	 * belongs to the REAL network. This is the path that hazard was closed for, so it is asserted
	 * from the CLI rather than only in core.
	 */
	it('never inherits the real network endpoint from `overrides`', async () => {
		stubNode({chainId: 1});

		const {resolved} = await runFromCLI(['-e', 'mainnet', '--is-fork'], {
			...baseConfig,
			environments: {mainnet: {chain: 1, overrides: {rpcUrl: MAINNET_RPC_URL, confirmationsRequired: 2}}},
		});

		expect(endpointOf(resolved.provider)).toBe(CONVENTIONAL_LOCAL_RPC_URL);
		expect(dials.every((dial) => dial.url !== MAINNET_RPC_URL)).toBe(true);
		// every OTHER override still crosses, so a fork stays configured like what it simulates
		expect(resolved.environment.confirmationsRequired).toBe(2);
	});
});

describe('a CLI fork run does not write into the forked network folder', () => {
	/**
	 * Deployment records of the network being FORKED: keyed by its NAME, and marked with ITS
	 * chain and genesis, which is exactly the marking a fork run has to be lenient about.
	 */
	function mainnetRecords(): DeploymentStore & {files: Record<string, string>} {
		const files: Record<string, string> = {
			'.chain': JSON.stringify({chainId: '1', genesisHash: MAINNET_GENESIS_HASH}),
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
	 * The trap this flag was blocked on until the rule moved into core: a caller constructing a
	 * fork input and NOT also passing `saveDeployments: false` used to write into the real
	 * network's records. The CLI passes no such thing, so the guarantee has to hold here, on the
	 * no-provider branch that the CLI is the only user of.
	 */
	it('reads the forked network records on a node that is not it, and writes none back', async () => {
		// a hardhat-style fork: another chain id AND another genesis than mainnet's records claim
		stubNode({chainId: 31337});
		const store = mainnetRecords();

		const env = await loadEnvironmentFromStore(
			baseConfig,
			{...executionParamsFor(['-e', 'mainnet', '--is-fork']), promptExecutor},
			store,
		);

		expect(env.network.fork).toEqual({networkName: 'mainnet'});
		// the whole point of forking: the real proxies, on a node that is not the real chain
		expect(env.deployments['MyContract'].address).toBe(EXISTING_CONTRACT);
		expect(env.network.chain.id).toBe(31337);

		expect(env.context.saveDeployments).toBe(false);
		await env.save('NewContract', record(NEW_CONTRACT));

		// the run sees what it deployed...
		expect(env.get('NewContract').address).toBe(NEW_CONTRACT);
		// ...and `deployments/mainnet` never heard about it
		expect(store.writeFile).not.toHaveBeenCalled();
		expect(store.writeFileWithChainInfo).not.toHaveBeenCalled();
		expect(store.files['NewContract.json']).toBeUndefined();
	});

	/**
	 * `--save-deployments` is set-only (there is no `--no-save-deployments`), so once the fork
	 * default is off it is the ONLY way to turn saving on from the command line. That has to keep
	 * working, or "I know what I am doing" becomes inexpressible.
	 */
	it('still writes when the user asked for it with --save-deployments', async () => {
		stubNode({chainId: 31337});
		const store = mainnetRecords();

		const env = await loadEnvironmentFromStore(
			baseConfig,
			{...executionParamsFor(['-e', 'mainnet', '--is-fork', '--save-deployments']), promptExecutor},
			store,
		);

		expect(env.context.saveDeployments).toBe(true);
		await env.save('NewContract', record(NEW_CONTRACT));

		expect(JSON.parse(store.files['NewContract.json']).address).toBe(NEW_CONTRACT);
	});
});
