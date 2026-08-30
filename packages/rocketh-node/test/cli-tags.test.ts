/**
 * `rocketh --tags <value>`: the option is documented as a "comma separated list of tags to
 * execute", and core's contract is `ExecutionParams.tags: string[]`. Nothing between the two
 * used to split, because the CLI handed commander's options to core with
 * `...(options as ExecutionParams)` — a cast that tells the compiler to stop checking, so a
 * `string` reaching a `string[]` field type-checked. The filter then iterated the CHARACTERS of
 * the value.
 *
 * Both failure modes are pinned below, and the second one is why this is more than an annoyance:
 * `--tags Token` selected NOTHING (which reads as "no scripts matched"), while `--tags cat`
 * selected a script tagged `a`, i.e. ran something nobody asked for. A fix that only splits
 * would pass the first; only the second discriminates.
 *
 * The selection cases go through the WHOLE path the CLI uses — argv, commander, the mapping in
 * `cli-options.ts`, `loadAndExecuteDeploymentsFromFiles`, and the executor's real selection loop
 * over real script files on disk — rather than calling core with an array, since handing core an
 * array is exactly what the CLI failed to do.
 *
 * The last block pins the CLASS rather than the instance: the mapping is explicit and typed, so
 * an option whose CLI shape differs from its core shape is a BUILD error now. Three options
 * needed a hand-written fix-up after that spread (`onUnknownSigner`, `environment`/`--is-fork`,
 * and this one), each found by a human noticing rather than by the compiler.
 */

import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';
import {resolveConfig} from 'rocketh';
import type {ExecutionParams, UserConfig} from '@rocketh/core/types';
import {buildCLIProgram, toExecutionParams, type RockethCLIOptions} from '../src/cli-options.js';
import {loadAndExecuteDeploymentsFromFiles} from '../src/executor/index.js';

// ---------------------------------------------------------------------------------------------
// the CLI surface
// ---------------------------------------------------------------------------------------------

/** Parse an argv the way the shell hands it over, without commander exiting the test process. */
function optionsFor(argv: string[]): RockethCLIOptions {
	const program = buildCLIProgram('0.0.0-test');
	program.exitOverride();
	program.configureOutput({writeOut: () => {}, writeErr: () => {}});
	program.parse(argv, {from: 'user'});
	return program.opts<RockethCLIOptions>();
}

/** The execution parameters the CLI builds for an argv, which is the whole of its boundary. */
function executionParamsFor(argv: string[]): ExecutionParams {
	return toExecutionParams(optionsFor(argv));
}

describe('`--tags` reaches core as a LIST', () => {
	it('splits a single tag into a one-element list, not into characters', () => {
		expect(executionParamsFor(['-e', 'memory', '--tags', 'Token']).tags).toEqual(['Token']);
	});

	it('splits a comma separated value, which is what the option documents', () => {
		expect(executionParamsFor(['-e', 'memory', '--tags', 'a,b']).tags).toEqual(['a', 'b']);
	});

	/**
	 * An empty value means NO FILTER, not "a filter for the empty tag". Splitting without this
	 * guard turns `''` into `['']`, which engages the filter (`tags.length > 0`) and matches
	 * nothing — the same do-nothing run this whole task is about, arrived at from the other side.
	 * hardhat-deploy guards it the same way (`args.tags && args.tags != '' ? args.tags : undefined`).
	 */
	it('treats an empty value, and an absent flag, as no filter at all', () => {
		expect(executionParamsFor(['-e', 'memory', '--tags', '']).tags).toBeUndefined();
		expect(executionParamsFor(['-e', 'memory']).tags).toBeUndefined();
	});

	/**
	 * The space after a comma is what a person types. Reading it literally produced the tag `' b'`,
	 * which matches nothing and then reports itself as "no scripts matched" rather than as a typo,
	 * so the flag appeared to work while selecting half of what was asked for.
	 */
	it('trims the space a person types after a comma', () => {
		expect(executionParamsFor(['-e', 'memory', '--tags', 'a, b']).tags).toEqual(['a', 'b']);
		expect(executionParamsFor(['-e', 'memory', '--tags', '  Token  ']).tags).toEqual(['Token']);
	});

	it('drops empty segments rather than turning them into unmatchable tags', () => {
		expect(executionParamsFor(['-e', 'memory', '--tags', 'a,,b']).tags).toEqual(['a', 'b']);
		expect(executionParamsFor(['-e', 'memory', '--tags', 'a,']).tags).toEqual(['a']);
	});

	/**
	 * The case the trim must not break: a value that collapses to nothing is NO filter, exactly as
	 * `''` is. Trimming without dropping would leave `[' ']` engaged and matching nothing, which is
	 * the do-nothing run this whole area exists to prevent.
	 */
	it('treats a value that is only whitespace or commas as no filter', () => {
		expect(executionParamsFor(['-e', 'memory', '--tags', '   ']).tags).toBeUndefined();
		expect(executionParamsFor(['-e', 'memory', '--tags', ',']).tags).toBeUndefined();
		expect(executionParamsFor(['-e', 'memory', '--tags', ' , ']).tags).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------------------------
// what the flag actually selects, driven from argv through the real executor
// ---------------------------------------------------------------------------------------------

let tmpDir: string;
let scriptDir: string;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rocketh-cli-tags-'));
	scriptDir = path.join(tmpDir, 'deploy');
	fs.mkdirSync(scriptDir, {recursive: true});
});

afterEach(() => {
	fs.rmSync(tmpDir, {recursive: true, force: true});
});

function mockProvider(): EIP1193ProviderWithoutEvents {
	return {
		request: (async (args: {method: string; params?: unknown}) => {
			switch (args.method) {
				case 'eth_chainId':
					return '0x7a69';
				case 'eth_accounts':
					return [];
				case 'eth_getBlockByNumber':
					return {number: '0x0', hash: '0x' + '0'.repeat(64)};
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

/** A deploy script declaring `tags`, which records its own name when it runs. */
function writeTaggedScript(name: string, tags: string[]) {
	const body = `const fn = async function(env, args) {
	const fs = await import('node:fs');
	const logFile = ${JSON.stringify(path.join(tmpDir, 'execution-log.txt'))};
	let log = '';
	try { log = fs.readFileSync(logFile, 'utf-8'); } catch {}
	log += ${JSON.stringify(name)} + '\\n';
	fs.writeFileSync(logFile, log);
};
fn.tags = ${JSON.stringify(tags)};
export default fn;`;
	fs.writeFileSync(path.join(scriptDir, `${name}.js`), body);
}

function scriptsThatRan(): string[] {
	try {
		return fs.readFileSync(path.join(tmpDir, 'execution-log.txt'), 'utf-8').trim().split('\n').filter(Boolean);
	} catch {
		return [];
	}
}

/**
 * Run the CLI's own execution parameters for an argv. Only the provider is added, because the
 * command line has no way to name one; everything the flags decide comes from `toExecutionParams`.
 */
async function runCLI(argv: string[]) {
	await loadAndExecuteDeploymentsFromFiles({
		...executionParamsFor(['-e', 'memory', '--skip-prompts', '--skip-gas-report', '-s', scriptDir, ...argv]),
		provider: mockProvider(),
	});
}

describe('`rocketh --tags <value>` selects the scripts carrying that tag', () => {
	it('runs a script tagged `Token` for `--tags Token`', async () => {
		writeTaggedScript('token', ['Token']);
		writeTaggedScript('other', ['Other']);

		await runCLI(['--tags', 'Token']);

		expect(scriptsThatRan()).toEqual(['token']);
	});

	it('runs scripts tagged `a` OR `b` for `--tags a,b`', async () => {
		writeTaggedScript('a-script', ['a']);
		writeTaggedScript('b-script', ['b']);
		writeTaggedScript('c-script', ['c']);

		await runCLI(['--tags', 'a,b']);

		expect(scriptsThatRan().sort()).toEqual(['a-script', 'b-script']);
	});

	/**
	 * The same command with the space a person actually types. Before the segments were trimmed
	 * this ran `a-script` ONLY, and said nothing about `b`: a partial run that looks like a
	 * successful one, which is worse than an error.
	 */
	it('runs both for `--tags "a, b"`, the way a person types it', async () => {
		writeTaggedScript('a-script', ['a']);
		writeTaggedScript('b-script', ['b']);
		writeTaggedScript('c-script', ['c']);

		await runCLI(['--tags', 'a, b']);

		expect(scriptsThatRan().sort()).toEqual(['a-script', 'b-script']);
	});

	/**
	 * The discriminating case, and the direction that actually deploys something: while the value
	 * was iterated by CHARACTER, `--tags cat` matched a script tagged `a` — a run doing work the
	 * user never asked for, with nothing on screen to say so. A fix that only splits still passes
	 * the two cases above; only this one fails against a character-iterating filter.
	 */
	it('does not run a single-character-tagged script for a value that merely contains it', async () => {
		writeTaggedScript('a-script', ['a']);
		writeTaggedScript('cat-script', ['cat']);

		await runCLI(['--tags', 'cat']);

		expect(scriptsThatRan()).toEqual(['cat-script']);
	});

	it('runs every script when the flag is absent', async () => {
		writeTaggedScript('a-script', ['a']);
		writeTaggedScript('cat-script', ['cat']);
		writeTaggedScript('untagged', []);

		await runCLI([]);

		expect(scriptsThatRan().sort()).toEqual(['a-script', 'cat-script', 'untagged']);
	});

	/** An empty value is the no-filter case end to end, not a filter that matches nothing. */
	it('runs every script for `--tags ""`', async () => {
		writeTaggedScript('a-script', ['a']);
		writeTaggedScript('cat-script', ['cat']);

		await runCLI(['--tags', '']);

		expect(scriptsThatRan().sort()).toEqual(['a-script', 'cat-script']);
	});
});

// ---------------------------------------------------------------------------------------------
// the other options the mapping carries, which the cast used to carry by accident (or not at all)
// ---------------------------------------------------------------------------------------------

describe('the mapping carries every option that has a home in core', () => {
	/**
	 * `--scripts` and `--deployments` are CONFIG overrides in core (`ConfigOverrides`), not run
	 * parameters, which is the same class of shape mismatch as `--tags` and was the other thing
	 * the blanket cast hid: they arrived as excess top-level properties that
	 * `resolveExecutionParams` never reads, so both documented flags did nothing. The sibling
	 * CLIs (`@rocketh/export`, `@rocketh/doc`, `@rocketh/verifier`) already route `--deployments`
	 * through `ConfigOverrides`, so this is where it was always meant to land.
	 */
	it('routes `--scripts` and `--deployments` to the config overrides core reads', () => {
		const params = executionParamsFor(['-e', 'memory', '-s', 'my-scripts', '-d', 'my-deployments']);

		expect(params.config).toEqual({scripts: 'my-scripts', deployments: 'my-deployments'});

		const config = resolveConfig({} as UserConfig, params.config);
		expect(config.scripts).toBe('my-scripts');
		expect(config.deployments).toBe('my-deployments');
	});

	/** Neither flag given leaves the config file's own answers alone. */
	it('overrides nothing when neither folder flag is given', () => {
		const config = resolveConfig(
			{deployments: 'deployments'} as UserConfig,
			executionParamsFor(['-e', 'memory']).config,
		);

		expect(config.scripts).toEqual(['deploy']);
		expect(config.deployments).toBe('deployments');
	});

	/** `--skip-prompts` and `--skip-gas-report` are NEGATIVE flags over positive parameters. */
	it('inverts the two skip flags', () => {
		const plain = executionParamsFor(['-e', 'memory']);
		expect(plain.askBeforeProceeding).toBe(true);
		expect(plain.reportGasUse).toBe(true);

		const skipped = executionParamsFor(['-e', 'memory', '--skip-prompts', '--skip-gas-report']);
		expect(skipped.askBeforeProceeding).toBe(false);
		expect(skipped.reportGasUse).toBe(false);
	});

	/**
	 * `--save-deployments` is set-only: absent must stay `undefined` so core's own default
	 * decides (which is what keeps a fork run from writing into the forked network's records).
	 */
	it('leaves `saveDeployments` unset unless the flag is given', () => {
		expect(executionParamsFor(['-e', 'memory']).saveDeployments).toBeUndefined();
		expect(executionParamsFor(['-e', 'memory', '--save-deployments']).saveDeployments).toBe(true);
	});

	it('makes `--reset` a boolean either way', () => {
		expect(executionParamsFor(['-e', 'memory']).reset).toBe(false);
		expect(executionParamsFor(['-e', 'memory', '--reset']).reset).toBe(true);
	});

	/** The two fix-ups that used to live AFTER the spread, now ordinary entries of the mapping. */
	it('keeps the `onUnknownSigner` and `--is-fork` resolutions working', () => {
		expect(executionParamsFor(['-e', 'memory']).onUnknownSigner).toBeUndefined();
		expect(executionParamsFor(['-e', 'memory', '--on-unknown-signer', 'ask']).onUnknownSigner).toBe('ask');
		// asking to be prompted AND not prompted is a contradiction; the safe half wins
		expect(executionParamsFor(['-e', 'memory', '--on-unknown-signer', 'ask', '--skip-prompts']).onUnknownSigner).toBe(
			'throw',
		);

		expect(executionParamsFor(['-e', 'mainnet']).environment).toBe('mainnet');
		expect(executionParamsFor(['-e', 'mainnet', '--is-fork']).environment).toEqual({fork: 'mainnet'});
	});

	it('refuses an `--on-unknown-signer` value that is not a policy', () => {
		expect(() => executionParamsFor(['-e', 'memory', '--on-unknown-signer', 'maybe'])).toThrow(
			/invalid --on-unknown-signer value/,
		);
	});
});

// ---------------------------------------------------------------------------------------------
// the class, not the instance
// ---------------------------------------------------------------------------------------------

describe('the boundary cannot lie again', () => {
	/**
	 * What the cast used to permit, pinned as a type-level assertion: commander's `--tags` is a
	 * STRING and core's `tags` is a `string[]`, so this must NOT compile. `pnpm typecheck` covers
	 * `test/` as well as `src/` (see the conventions in `CONTEXT.md`), which is what makes a
	 * `@ts-expect-error` here an enforced claim rather than a comment.
	 */
	it('cannot hand core a raw `--tags` string', () => {
		const params: ExecutionParams = {
			// @ts-expect-error a comma separated string is not a list of tags
			tags: 'a,b',
		};

		expect(params).toBeDefined();
	});

	/**
	 * Every option the program declares has a key in `RockethCLIOptions`, and every key of
	 * `RockethCLIOptions` is an option the program declares. The compiler enforces one direction
	 * (the record below must be exhaustive over the type) and this assertion the other, so adding
	 * a flag without declaring its parsed shape — the step at which its core shape gets thought
	 * about at all — goes red here instead of silently never reaching core.
	 */
	it('declares exactly the options the parsed shape describes', () => {
		const parsedShape: Record<keyof RockethCLIOptions, true> = {
			scripts: true,
			tags: true,
			deployments: true,
			skipGasReport: true,
			logLevel: true,
			skipPrompts: true,
			onUnknownSigner: true,
			saveDeployments: true,
			reset: true,
			environment: true,
			isFork: true,
			writeTransactions: true,
		};

		const declared = buildCLIProgram('0.0.0-test')
			.options.map((option) => option.attributeName())
			// `--version` is commander's own, and is answered before any of this runs
			.filter((name) => name !== 'version');

		expect(declared.sort()).toEqual(Object.keys(parsedShape).sort());
	});
});
