/**
 * `rocketh -e sepolia` with named accounts given by index and no keys anywhere: what the CLI
 * prints.
 *
 * That is a configuration mistake, so it is reported the way a bad flag is: the message on stderr
 * and exit code 1, with no stack trace. The message names the environment, the chain and the
 * endpoint (redacted), lists every account that cannot be resolved, and gives the fix for this
 * entry point: the `accounts` of `rocketh/config.ts`.
 *
 * The run goes through the CLI's own option mapping (`toExecutionParams`) and the real
 * `getChainIdForEnvironment` / `loadEnvironmentFromStore`, with only the network boundary
 * (`fetch`) faked; `runFromCLI` is the function the bin script hands the run to.
 */

import {describe, it, expect, vi, afterEach} from 'vitest';
import {buildCLIProgram, toExecutionParams, type RockethCLIOptions} from '../src/cli-options.js';
import {runFromCLI, type CLIReporter} from '../src/cli-run.js';
import {getChainIdForEnvironment, getEnvironmentName, loadEnvironmentFromStore, resolveConfig} from 'rocketh';
import type {DeploymentStore, PromptExecutor, UserConfig} from '@rocketh/core/types';

const API_KEY = 'aPiKeyThatMustNotBePrinted0123456789';
const RPC_URL = `https://sepolia.example.invalid/v3/${API_KEY}`;
const OTHER_NETWORK_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

const config: UserConfig = {
	accounts: {
		deployer: {default: 0, mainnet: `privateKey:${OTHER_NETWORK_KEY}`},
		admin: {default: 1},
	},
	defaultPollingInterval: 0.001,
	chains: {11155111: {rpcUrl: RPC_URL}},
	environments: {sepolia: {chain: 11155111}},
};

function optionsFor(argv: string[]): RockethCLIOptions {
	const program = buildCLIProgram('0.0.0-test');
	program.exitOverride();
	program.configureOutput({writeOut: () => {}, writeErr: () => {}});
	program.parse(argv, {from: 'user'});
	return program.opts<RockethCLIOptions>();
}

/** A public endpoint: it answers, and holds no keys. */
function stubPublicNode() {
	vi.stubGlobal('fetch', async (_url: string | URL, init: {body: string}) => {
		const request = JSON.parse(init.body) as {id: number; method: string};
		const results: Record<string, unknown> = {
			eth_chainId: '0xaa36a7',
			eth_getBlockByNumber: {number: '0x0', hash: '0x' + '1'.repeat(64)},
			eth_accounts: [],
		};
		if (!(request.method in results)) throw new Error(`stub node: ${request.method}`);
		return new Response(JSON.stringify({jsonrpc: '2.0', id: request.id, result: results[request.method]}), {
			status: 200,
			headers: {'content-type': 'application/json'},
		});
	});
}

const emptyStore = {
	listFiles: async () => [],
	deleteAll: async () => {},
	hasFile: async () => false,
	writeFile: async () => {},
	writeFileWithChainInfo: async () => {},
	readFile: async () => '',
	deleteFile: async () => {},
} as DeploymentStore;

const promptExecutor: PromptExecutor = {
	async prompt() {
		return {proceed: true};
	},
	exit() {},
};

/** What `loadAndExecuteDeploymentsFromFiles` does before any script runs, from CLI argv. */
async function runEnvironmentFromCLI(argv: string[]) {
	const resolvedConfig = resolveConfig(config);
	const executionParams = {...toExecutionParams(optionsFor(argv)), promptExecutor};
	const {name} = getEnvironmentName(executionParams);
	await getChainIdForEnvironment(resolvedConfig, name, executionParams);
	return loadEnvironmentFromStore(config, executionParams, emptyStore);
}

function capturingReporter() {
	const output: {errors: string[]; exitCodes: number[]} = {errors: [], exitCodes: []};
	const reporter: CLIReporter = {
		error: (message) => output.errors.push(message),
		exit: (code) => output.exitCodes.push(code),
	};
	return {output, reporter};
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('`rocketh -e sepolia` with accounts given by index and no keys', () => {
	it('prints one message naming where, every account, and the rocketh/config.ts fix, then exits 1', async () => {
		stubPublicNode();
		const {output, reporter} = capturingReporter();

		await runFromCLI(() => runEnvironmentFromCLI(['-e', 'sepolia']), reporter);

		expect(output.exitCodes).toEqual([1]);
		expect(output.errors).toHaveLength(1);
		const [printed] = output.errors;
		expect(printed).toBe(
			[
				`cannot resolve 2 named accounts ("deployer", "admin") for environment "sepolia" (chain 11155111, endpoint https://sepolia.example.invalid/<redacted>):`,
				`  - "deployer" is configured as index 0, but the node lists no accounts.`,
				`  - "admin" is configured as index 1, but the node lists no accounts.`,
				`An account given by index is one of the node's own accounts, and this node holds none: nodes without keys (most public RPC endpoints) answer 'eth_accounts' with an empty list.`,
				`To fix it, in the \`accounts\` of your rocketh config (rocketh/config.ts), give each of these accounts a signer protocol or an address for "sepolia". Read any key from the environment rather than writing it in the file, for example:`,
				'    deployer: {default: 0, sepolia: `privateKey:${process.env.DEPLOYER_PRIVATE_KEY}`},',
				`The 'privateKey' protocol is registered with \`signerProtocols: {privateKey}\` (from @rocketh/signer). Or point "sepolia" at a node that holds the keys.`,
			].join('\n'),
		);
		// No stack trace, and no secret from the url or from the config.
		expect(printed).not.toMatch(/^\s+at /m);
		expect(printed).not.toContain(API_KEY);
		expect(printed).not.toContain(OTHER_NETWORK_KEY.slice(2));
	});

	it('leaves any other failure alone, so a genuine bug keeps its stack trace', async () => {
		const {output, reporter} = capturingReporter();
		const bug = new TypeError('cannot read properties of undefined');

		await expect(
			runFromCLI(async () => {
				throw bug;
			}, reporter),
		).rejects.toBe(bug);
		expect(output).toEqual({errors: [], exitCodes: []});
	});
});
