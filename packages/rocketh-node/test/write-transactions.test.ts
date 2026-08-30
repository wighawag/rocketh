/**
 * `rocketh -e mainnet --is-fork --write-transactions ./batch.json`: the FILE SINK over the list
 * a run already keeps in memory (`env.capturedTransactions`, see `CapturedTransaction` in
 * `@rocketh/core/types`).
 *
 * It exists for two consumers who are outside this process and outside JavaScript: an operator
 * taking a rehearsed batch to their Safe, and a team rebuilding a deployment sequence inside a
 * Solidity test. Both read the file with a plain JSON parser, so what the file HOLDS is a
 * contract and is pinned here byte for byte.
 *
 * Three seams, in the order the sections below go through them:
 *
 * 1. the OPTION SURFACE: the flag exists, takes the output path, and says in `--help` what it
 *    does (`cli-is-fork-flag.test.ts` is the model, and `cli-tags.test.ts` holds the assertion
 *    that every declared option has a key in the parsed shape);
 * 2. the SERIALIZATION: a known list through the writer, asserting the exact bytes, since a
 *    consumer that is not JavaScript cannot be handed "whatever `JSON.stringify` did";
 * 3. the LIFECYCLE: written ONCE, ATOMICALLY, at the end of a SUCCESSFUL run, driven from argv
 *    through the real `loadAndExecuteDeploymentsFromFiles` with only the node faked.
 *
 * The lifecycle is the half worth stating plainly: a run that throws writes NOTHING and leaves
 * any previous file untouched. On a fork or a memory node nothing real happened, so a halted run
 * has not produced a smaller truth, it has produced a misleading one, and an operator who
 * executes a partial batch sends a subset of the work believing it is the whole.
 *
 * Every filesystem assertion happens inside a per-test temp directory, and the directory is
 * listed rather than only stat-ed, so a stray temp file (the write-then-rename leftover) or a
 * file written somewhere it should not be fails here.
 */

import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';
import type {CapturedTransaction} from '@rocketh/core/types';
import {buildCLIProgram, toExecutionParams, type RockethCLIOptions} from '../src/cli-options.js';
import type {NodeExecutionParams} from '../src/execution-params.js';
import {serializeCapturedTransactions, writeCapturedTransactions} from '../src/executor/write-transactions.js';
import {loadAndExecuteDeploymentsFromFiles} from '../src/executor/index.js';

/** A node account: `eth_accounts` lists it, so the run classifies it `node`. */
const NODE_ACCOUNT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`;
const TARGET_CONTRACT = '0x0000000000000000000000000000000000000001' as `0x${string}`;
/** The Nick's-method relayer of the deterministic-deployment factory: never a run account. */
const FACTORY_DEPLOYER = '0x3fab184622dc19b6109349b94811493bf2a45362' as `0x${string}`;
const FACTORY_SIGNED_TX = '0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe' as `0x${string}`;

let tmpDir: string;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rocketh-write-transactions-'));
});

afterEach(() => {
	fs.rmSync(tmpDir, {recursive: true, force: true});
});

// ---------------------------------------------------------------------------------------------
// the option surface
// ---------------------------------------------------------------------------------------------

/** Parse an argv the way the shell hands it over, without commander exiting the test process. */
function optionsFor(argv: string[]): RockethCLIOptions {
	const program = buildCLIProgram('0.0.0-test');
	program.exitOverride();
	program.configureOutput({writeOut: () => {}, writeErr: () => {}});
	program.parse(argv, {from: 'user'});
	return program.opts<RockethCLIOptions>();
}

/** The run parameters the CLI builds, through the production boundary rather than a copy of it. */
function executionParamsFor(argv: string[]): NodeExecutionParams {
	return toExecutionParams(optionsFor(argv));
}

function descriptionOf(long: string): string | undefined {
	return buildCLIProgram('0.0.0-test').options.find((option) => option.long === long)?.description;
}

describe('the flag names WHERE the transactions go', () => {
	/** The headline: the flag takes the output PATH, and that path reaches the run parameters. */
	it('carries the path from argv to the run parameters', () => {
		const options = optionsFor(['-e', 'mainnet', '--is-fork', '--write-transactions', './batch.json']);

		expect(options.writeTransactions).toBe('./batch.json');
		expect(executionParamsFor(['-e', 'mainnet', '--is-fork', '--write-transactions', './batch.json'])).toMatchObject({
			writeTransactions: './batch.json',
		});
	});

	/** Absent, it stays absent: the run then writes no new file anywhere (see the lifecycle). */
	it('is absent when the flag is not given', () => {
		expect(optionsFor(['-e', 'mainnet']).writeTransactions).toBeUndefined();
		expect(executionParamsFor(['-e', 'mainnet']).writeTransactions).toBeUndefined();
	});

	/**
	 * An empty value is REFUSED rather than read as "no file". It is the one interpretation an
	 * operator cannot detect: silently skipping the write ends a successful rehearsal with no
	 * batch and nothing on screen to say why. Refusing costs the run nothing, because it happens
	 * at the boundary, BEFORE the run, rather than after a rehearsal has already completed.
	 */
	it('refuses an empty path instead of quietly writing nothing', () => {
		expect(() => executionParamsFor(['-e', 'mainnet', '--write-transactions', ''])).toThrow(
			/--write-transactions needs a file path/,
		);
		expect(() => executionParamsFor(['-e', 'mainnet', '--write-transactions', '   '])).toThrow(
			/--write-transactions needs a file path/,
		);
	});

	/**
	 * `--help` has to describe what the flag DOES with what the run captured, and must not
	 * promise more than that. Capture itself is unconditional and flagless, so a description
	 * claiming to turn capture on would send a plugin author looking for a flag to get the
	 * in-process list; and the write is atomic (write-then-rename, which REPLACES the path), so
	 * nothing here may suggest the path can be a stream or a pipe to append into.
	 */
	it('describes the write in --help, and promises nothing else', () => {
		const description = descriptionOf('--write-transactions');

		expect(description).toBeDefined();
		expect(description).toMatch(/only when the run succeeds/i);
		expect(description).not.toMatch(/stream|pipe|fifo|append/i);
		expect(buildCLIProgram('0.0.0-test').helpInformation()).toContain('--write-transactions <file>');
	});
});

// ---------------------------------------------------------------------------------------------
// the serialization: what a consumer outside JavaScript actually reads
// ---------------------------------------------------------------------------------------------

/** One entry of each shape a run can produce, in an order a real run could produce them in. */
const CAPTURED: CapturedTransaction[] = [
	// a contract creation: no `to`
	{type: 'intent', from: NODE_ACCOUNT, data: '0x60016000', signability: 'node'},
	// the Safe-owned step a fork rehearsal exists for
	{
		type: 'intent',
		from: TARGET_CONTRACT,
		to: TARGET_CONTRACT,
		value: '0x1f4',
		data: '0xdeadbeef',
		signability: 'impersonated',
	},
	// the deterministic-factory funding transfer: no `data`
	{type: 'intent', from: NODE_ACCOUNT, to: FACTORY_DEPLOYER, value: '0x1f4', signability: 'node'},
	// the pre-signed factory bootstrap, relayed as itself and carrying no signability
	{type: 'raw', from: FACTORY_DEPLOYER, raw: FACTORY_SIGNED_TX},
];

const CAPTURED_AS_JSON = `[
  {
    "type": "intent",
    "from": "${NODE_ACCOUNT}",
    "data": "0x60016000",
    "signability": "node"
  },
  {
    "type": "intent",
    "from": "${TARGET_CONTRACT}",
    "to": "${TARGET_CONTRACT}",
    "value": "0x1f4",
    "data": "0xdeadbeef",
    "signability": "impersonated"
  },
  {
    "type": "intent",
    "from": "${NODE_ACCOUNT}",
    "to": "${FACTORY_DEPLOYER}",
    "value": "0x1f4",
    "signability": "node"
  },
  {
    "type": "raw",
    "from": "${FACTORY_DEPLOYER}",
    "raw": "${FACTORY_SIGNED_TX}"
  }
]
`;

describe('the file a consumer reads', () => {
	/** The exact bytes, because the consumer is a Safe tool or a Solidity test, not this repo. */
	it('serialises both arms faithfully, in broadcast order', () => {
		expect(serializeCapturedTransactions(CAPTURED)).toBe(CAPTURED_AS_JSON);
	});

	/** ...and it is JSON, which is the whole point of the format choice. */
	it('is parseable by a plain JSON parser', () => {
		expect(JSON.parse(serializeCapturedTransactions(CAPTURED))).toEqual(CAPTURED);
	});

	/**
	 * `value` is the 0x QUANTITY the broadcast choke point saw, never a bigint and never a
	 * decimal string. That is the form every call site already builds, and the form a replay
	 * hands straight back to a node.
	 */
	it('keeps `value` as the 0x quantity, as a JSON string', () => {
		const parsed = JSON.parse(serializeCapturedTransactions(CAPTURED)) as {value?: string}[];

		expect(parsed[1].value).toBe('0x1f4');
		expect(typeof parsed[1].value).toBe('string');
	});

	/**
	 * The full set of keys an entry may carry, per arm. `signability` is on the INTENT arm only:
	 * a raw relay has no signer question to answer, and labelling it would tell a fixture
	 * consumer to skip the one entry it must replay.
	 */
	it('carries exactly the keys of the arm, and no others', () => {
		const parsed = JSON.parse(serializeCapturedTransactions(CAPTURED)) as Record<string, unknown>[];

		expect(Object.keys(parsed[0]).sort()).toEqual(['data', 'from', 'signability', 'type']);
		expect(Object.keys(parsed[1]).sort()).toEqual(['data', 'from', 'signability', 'to', 'type', 'value']);
		expect(Object.keys(parsed[2]).sort()).toEqual(['from', 'signability', 'to', 'type', 'value']);
		expect(Object.keys(parsed[3]).sort()).toEqual(['from', 'raw', 'type']);
	});

	/**
	 * A field the transaction did not carry stays ABSENT, rather than becoming `null` or `'0x'`.
	 * A contract creation has no `to`, and `'0x'` data on the deterministic-factory funding
	 * transfer would turn a replay of it into an empty CALL rather than a plain transfer.
	 */
	it('omits absent fields instead of nulling them', () => {
		const creation = serializeCapturedTransactions([CAPTURED[0]]);
		const transfer = serializeCapturedTransactions([CAPTURED[2]]);

		expect(creation).not.toContain('null');
		expect(creation).not.toContain('"to"');
		expect(transfer).not.toContain('null');
		expect(transfer).not.toContain('"data"');
	});

	/**
	 * Nothing a consumer should not replay may appear, and the serializer enumerates the keys it
	 * emits rather than passing the entry through, so a field that ever lands on an entry cannot
	 * reach the file by accident. Fees and nonces must never become a contract with a consumer
	 * (nobody wants the fee market of the moment the fork ran), and a hash or receipt describes
	 * the rehearsal, not the plan.
	 */
	it('drops anything the entry shape does not promise, gas and fees above all', () => {
		const contaminated = [
			{
				...CAPTURED[1],
				gas: '0x5208',
				gasPrice: '0x1',
				maxFeePerGas: '0x2',
				nonce: '0x3',
				hash: '0x4',
				receipt: {status: '0x1'},
			},
			{...CAPTURED[3], gas: '0x5208', nonce: '0x3'},
		] as unknown as CapturedTransaction[];

		const serialized = serializeCapturedTransactions(contaminated);

		for (const forbidden of ['gas', 'gasPrice', 'maxFeePerGas', 'nonce', 'hash', 'receipt']) {
			expect(serialized).not.toContain(`"${forbidden}"`);
		}
	});

	/** A run that broadcast nothing is an EMPTY list, which is a true answer and not a missing one. */
	it('serialises an empty run as an empty list', () => {
		expect(serializeCapturedTransactions([])).toBe('[]\n');
	});
});

// ---------------------------------------------------------------------------------------------
// the write itself
// ---------------------------------------------------------------------------------------------

describe('the write leaves no half-written file behind', () => {
	/** Its own directory, so the listing below is the whole of what the write produced. */
	let outDir: string;

	beforeEach(() => {
		outDir = path.join(tmpDir, 'output');
		fs.mkdirSync(outDir, {recursive: true});
	});

	it('writes the file at the named path, and nothing else in that directory', () => {
		const target = path.join(outDir, 'batch.json');

		writeCapturedTransactions(target, CAPTURED);

		expect(fs.readFileSync(target, 'utf-8')).toBe(CAPTURED_AS_JSON);
		expect(fs.readdirSync(outDir)).toEqual(['batch.json']);
	});

	/**
	 * ATOMICITY, observed rather than described: the write goes to a temp file in the SAME
	 * directory and is then RENAMED over the target, so the path only ever points at a complete
	 * file. A rename replaces the directory entry, which gives the file a new inode; writing in
	 * place would keep the old one (and would expose a truncated file to any consumer reading at
	 * that moment).
	 */
	it('replaces an existing file by rename rather than truncating it in place', () => {
		const target = path.join(outDir, 'batch.json');
		writeCapturedTransactions(target, CAPTURED);
		const before = fs.statSync(target).ino;

		writeCapturedTransactions(target, []);

		expect(fs.statSync(target).ino).not.toBe(before);
		expect(fs.readFileSync(target, 'utf-8')).toBe('[]\n');
		expect(fs.readdirSync(outDir)).toEqual(['batch.json']);
	});

	/** A path the user names inside a folder that does not exist yet is still their answer. */
	it('creates the directory the user named', () => {
		const target = path.join(outDir, 'nested', 'batch.json');

		writeCapturedTransactions(target, CAPTURED);

		expect(fs.readFileSync(target, 'utf-8')).toBe(CAPTURED_AS_JSON);
	});
});

// ---------------------------------------------------------------------------------------------
// the lifecycle, driven from argv through the real run assembly
// ---------------------------------------------------------------------------------------------

let scriptDir: string;
let deploymentsDir: string;

beforeEach(() => {
	scriptDir = path.join(tmpDir, 'deploy');
	deploymentsDir = path.join(tmpDir, 'deployments');
	fs.mkdirSync(scriptDir, {recursive: true});
});

function mockProvider(): EIP1193ProviderWithoutEvents {
	let sent = 0;
	return {
		request: (async (args: {method: string; params?: unknown}) => {
			switch (args.method) {
				case 'eth_chainId':
					return '0x7a69';
				case 'eth_accounts':
					return [NODE_ACCOUNT];
				case 'eth_getBlockByNumber':
					return {number: '0x0', hash: '0x' + '0'.repeat(64)};
				case 'eth_blockNumber':
					return '0x1';
				case 'eth_sendTransaction':
				case 'eth_sendRawTransaction':
					return `0x${(++sent).toString(16).padStart(64, '0')}`;
				case 'eth_getTransactionByHash':
					return null;
				case 'eth_getTransactionReceipt':
					return {
						transactionHash: (args.params as string[])[0],
						blockHash: '0x' + '1'.repeat(64),
						blockNumber: '0x1',
						transactionIndex: '0x0',
						status: '0x1',
						logs: [],
					};
				case 'eth_feeHistory':
					return {
						oldestBlock: '0x1',
						baseFeePerGas: ['0x1', '0x1'],
						gasUsedRatio: [0.5],
						reward: [['0x1', '0x1', '0x1']],
					};
				default:
					throw new Error(`mock: ${args.method}`);
			}
		}) as any,
	} as EIP1193ProviderWithoutEvents;
}

/**
 * A deploy script that broadcasts through the environment's own funnel, which is the same choke
 * point a `deploy` or an `execute` reaches, and then optionally fails the run.
 */
function writeBroadcastingScript(options?: {thenThrow?: boolean}) {
	const body = `const fn = async function(env) {
	await env.broadcastExecution({
		type: 'object',
		data: {type: '0x2', from: ${JSON.stringify(NODE_ACCOUNT)}, to: ${JSON.stringify(TARGET_CONTRACT)}, data: '0xaaaa', chainId: '0x7a69'},
	});
	await env.broadcastExecution({
		type: 'object',
		data: {type: '0x2', from: ${JSON.stringify(NODE_ACCOUNT)}, to: ${JSON.stringify(TARGET_CONTRACT)}, data: '0xbbbb', chainId: '0x7a69'},
	});
	${options?.thenThrow ? `throw new Error('the rehearsal failed halfway');` : ''}
};
fn.tags = ['all'];
export default fn;`;
	fs.writeFileSync(path.join(scriptDir, 'broadcast.js'), body);
}

/** A script that deploys nothing and sends nothing: the repeat-rehearsal case, which is common. */
function writeIdempotentScript() {
	fs.writeFileSync(path.join(scriptDir, 'nothing.js'), `export default async function () {};`);
}

/** Run the CLI's own parameters for an argv; only the provider is added, as `cli-tags` does. */
async function runCLI(argv: string[]) {
	await loadAndExecuteDeploymentsFromFiles({
		...toExecutionParams(
			optionsFor([
				'-e',
				'memory',
				'--skip-prompts',
				'--skip-gas-report',
				'-s',
				scriptDir,
				'-d',
				deploymentsDir,
				...argv,
			]),
		),
		provider: mockProvider(),
	});
}

describe('one file, written once, at the end of a successful run', () => {
	/** THE HEADLINE: what an operator hands to their Safe tool, in the order the run sent it. */
	it('holds every captured entry, in broadcast order', async () => {
		writeBroadcastingScript();
		const target = path.join(tmpDir, 'batch.json');

		await runCLI(['--write-transactions', target]);

		expect(JSON.parse(fs.readFileSync(target, 'utf-8'))).toEqual([
			{type: 'intent', from: NODE_ACCOUNT, to: TARGET_CONTRACT, data: '0xaaaa', signability: 'node'},
			{type: 'intent', from: NODE_ACCOUNT, to: TARGET_CONTRACT, data: '0xbbbb', signability: 'node'},
		]);
	});

	/**
	 * A successful run that broadcast NOTHING writes an EMPTY list, and REPLACES whatever was
	 * there. rocketh is idempotent, so a repeat rehearsal capturing nothing is the common case
	 * rather than a corner: leaving yesterday's batch in place would let an operator hand a Safe
	 * a plan this run did not produce.
	 */
	it('writes an empty list rather than leaving yesterday`s batch in place', async () => {
		writeIdempotentScript();
		const target = path.join(tmpDir, 'batch.json');
		fs.writeFileSync(target, '[{"type":"intent","from":"0xdead","data":"0xbeef","signability":"node"}]');

		await runCLI(['--write-transactions', target]);

		expect(fs.readFileSync(target, 'utf-8')).toBe('[]\n');
	});

	/** Without the flag the run is the run it is today: no new file, anywhere. */
	it('writes no new file at all when the flag is absent', async () => {
		writeBroadcastingScript();
		const before = fs.readdirSync(tmpDir).sort();

		await runCLI([]);

		expect(fs.readdirSync(tmpDir).sort()).toEqual(before);
	});

	/**
	 * A run that throws writes NOTHING. A partial batch is not a smaller truth, it is a
	 * misleading one: an operator who executes it sends a subset of the work believing it is the
	 * whole. So the previous file survives BYTE FOR BYTE, even though this run did broadcast
	 * before it failed.
	 */
	it('leaves an existing file byte-identical when the run throws', async () => {
		writeBroadcastingScript({thenThrow: true});
		const target = path.join(tmpDir, 'batch.json');
		const previous = '[{"type":"raw","from":"0xdead","raw":"0xbeef"}]';
		fs.writeFileSync(target, previous);

		await expect(runCLI(['--write-transactions', target])).rejects.toThrow(/rehearsal failed halfway/);

		expect(fs.readFileSync(target, 'utf-8')).toBe(previous);
	});

	/** ...and where there was no file, a failed run leaves none, not an empty or partial one. */
	it('creates no file at all when the run throws', async () => {
		writeBroadcastingScript({thenThrow: true});
		const target = path.join(tmpDir, 'batch.json');

		await expect(runCLI(['--write-transactions', target])).rejects.toThrow(/rehearsal failed halfway/);

		expect(fs.existsSync(target)).toBe(false);
	});

	/**
	 * Capture is not a fork feature, and neither is the file: the memory run above and the fork
	 * run here produce one the same way. The two consumers ARE two run modes (a Safe batch off a
	 * fork of the target network, a Solidity fixture off a fresh memory node), so gating on
	 * either would break the other.
	 */
	it('writes on a fork run exactly as on a memory run', async () => {
		writeBroadcastingScript();
		const target = path.join(tmpDir, 'fork-batch.json');

		await loadAndExecuteDeploymentsFromFiles({
			...toExecutionParams(
				optionsFor([
					'-e',
					'mainnet',
					'--is-fork',
					'--skip-prompts',
					'--skip-gas-report',
					'-s',
					scriptDir,
					'-d',
					deploymentsDir,
					'--write-transactions',
					target,
				]),
			),
			provider: mockProvider(),
		});

		expect(JSON.parse(fs.readFileSync(target, 'utf-8'))).toHaveLength(2);
	});
});
