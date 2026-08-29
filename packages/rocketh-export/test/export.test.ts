/**
 * Tests for @rocketh/export - deployment export to TS/JS/JSON.
 *
 * `run` reads deployments from the filesystem (via `@rocketh/node`'s
 * `loadDeploymentsFromFiles`), builds an `ExportedDeployments` object, and writes it to
 * one or more output files. These tests use a real temp directory laid out as
 * `<deployments>/<env>/<Name>.json` plus a `.chain` file.
 */

import {describe, it, expect, beforeEach, afterEach, beforeAll, afterAll} from 'vitest';
import {
	ExportError,
	InvalidModuleExportNameError,
	NoDeploymentsError,
	NoOutputPathError,
	OnChainVerificationError,
	run,
} from '../src/index.js';
import {resolveConfig} from 'rocketh';
import type {ResolvedUserConfig} from '@rocketh/core/types';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {execFileSync, spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const CHAIN_ID = '31337';
const GENESIS_HASH = '0x0000000000000000000000000000000000000000000000000000000000000042';
const ENV_NAME = 'testenv';

let tmpDir: string;
let deploymentsDir: string;
let config: ResolvedUserConfig;

function writeDeployment(name: string, content: Record<string, unknown>) {
	fs.writeFileSync(path.join(deploymentsDir, ENV_NAME, `${name}.json`), JSON.stringify(content));
}

function readOutput(file: string): string {
	return fs.readFileSync(file, 'utf-8');
}

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rocketh-export-'));
	deploymentsDir = path.join(tmpDir, 'deployments');
	fs.mkdirSync(path.join(deploymentsDir, ENV_NAME), {recursive: true});
	fs.writeFileSync(
		path.join(deploymentsDir, ENV_NAME, '.chain'),
		JSON.stringify({chainId: CHAIN_ID, genesisHash: GENESIS_HASH}),
	);

	config = resolveConfig({
		deployments: deploymentsDir,
		chains: {
			[31337]: {
				info: {
					id: 31337,
					name: 'hardhat',
					nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
					rpcUrls: {default: {http: ['http://localhost:8545']}},
				},
			},
		},
	});
});

afterEach(() => {
	fs.rmSync(tmpDir, {recursive: true, force: true});
});

describe('@rocketh/export - run', () => {
	it('rejects when no output path is specified, naming the environment and the flags to pass', async () => {
		// Same bug shape as an environment with nothing in it: a request that cannot be satisfied
		// used to print on stdout and exit 0, so a chained `export && dev` carried on with a file
		// that was never regenerated.
		writeDeployment('Token', {abi: [], address: '0x' + 'a'.repeat(40)});

		const error = await run(config, ENV_NAME, {}).catch((err) => err);

		expect(error).toBeInstanceOf(NoOutputPathError);
		expect(error.environmentName).toBe(ENV_NAME);
		expect(error.message).toContain(`'${ENV_NAME}'`);
		expect(error.message).toContain('--ts');
		expect(fs.readdirSync(tmpDir)).not.toContain('exported');
	});

	it('reports the missing output path even when the environment is also empty', async () => {
		// Precedence, pinned: the caller's own arguments are wrong whatever the deployments hold,
		// and that is the first thing they have to fix.
		const error = await run(config, 'nosuchnet', {}).catch((err) => err);

		expect(error).toBeInstanceOf(NoOutputPathError);
	});

	it('reports both user-facing failures through one base class, which is what the CLI branches on', () => {
		// The CLI reports an `ExportError` as a message and keeps the stack trace for everything
		// else, so a failure that forgets to extend it would regress to a stack trace unnoticed.
		expect(new NoOutputPathError(ENV_NAME)).toBeInstanceOf(ExportError);
		expect(
			new NoDeploymentsError({
				environmentName: ENV_NAME,
				environmentPath: '/somewhere',
				reason: 'missing-folder',
				message: 'x',
			}),
		).toBeInstanceOf(ExportError);
	});

	it('throws when no .chain file is present but deployments exist', async () => {
		// Remove the .chain file so loadDeploymentsFromStore throws about the missing chain record.
		fs.unlinkSync(path.join(deploymentsDir, ENV_NAME, '.chain'));
		writeDeployment('Token', {abi: [], address: '0x' + 'a'.repeat(40)});

		await expect(run(config, ENV_NAME, {tots: [path.join(tmpDir, 'out.ts')]})).rejects.toThrow(
			/\.chain.*\.chainId.*expected to be present/,
		);
	});

	it('writes a TS file with `export default ... as const`', async () => {
		writeDeployment('Token', {
			abi: [{type: 'function', name: 'getValue', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'}],
			address: '0x' + 'a'.repeat(40),
			receipt: {blockNumber: '0x10'},
		});

		const outFile = path.join(tmpDir, 'exported.ts');
		await run(config, ENV_NAME, {tots: [outFile]});

		expect(fs.existsSync(outFile)).toBe(true);
		const content = readOutput(outFile);
		expect(content).toContain('export default');
		expect(content).toContain('as const');
		expect(content).toContain('Token');
		expect(content).toContain(CHAIN_ID);
	});

	it('writes a JS file with a JSDoc type annotation and a .d.ts sidecar', async () => {
		writeDeployment('Token', {abi: [], address: '0x' + 'a'.repeat(40)});

		const outFile = path.join(tmpDir, 'exported.js');
		await run(config, ENV_NAME, {tojs: [outFile]});

		expect(fs.existsSync(outFile)).toBe(true);
		const content = readOutput(outFile);
		expect(content).toContain('@type {const}');
		expect(content).toContain('export default');

		const dtsFile = outFile.replace('.js', '.d.ts');
		expect(fs.existsSync(dtsFile)).toBe(true);
		expect(readOutput(dtsFile)).toContain('export default');
	});

	it('writes a raw JSON file', async () => {
		writeDeployment('Token', {abi: [], address: '0x' + 'a'.repeat(40)});

		const outFile = path.join(tmpDir, 'exported.json');
		await run(config, ENV_NAME, {tojson: [outFile]});

		expect(fs.existsSync(outFile)).toBe(true);
		const parsed = JSON.parse(readOutput(outFile));
		expect(parsed.chain.id).toBe(31337);
		expect(parsed.contracts.Token).toBeDefined();
	});

	it('includes bytecode and argsData when includeBytecode is true', async () => {
		writeDeployment('Token', {
			abi: [],
			address: '0x' + 'a'.repeat(40),
			bytecode: '0xdeadbeef',
			argsData: '0xcafe',
		});

		const outFile = path.join(tmpDir, 'exported.json');
		await run(config, ENV_NAME, {tojson: [outFile], includeBytecode: true});

		const parsed = JSON.parse(readOutput(outFile));
		expect(parsed.contracts.Token.bytecode).toBe('0xdeadbeef');
		expect(parsed.contracts.Token.argsData).toBe('0xcafe');
	});

	it('omits bytecode and argsData when includeBytecode is not set', async () => {
		writeDeployment('Token', {
			abi: [],
			address: '0x' + 'a'.repeat(40),
			bytecode: '0xdeadbeef',
			argsData: '0xcafe',
		});

		const outFile = path.join(tmpDir, 'exported.json');
		await run(config, ENV_NAME, {tojson: [outFile]});

		const parsed = JSON.parse(readOutput(outFile));
		expect(parsed.contracts.Token.bytecode).toBeUndefined();
		expect(parsed.contracts.Token.argsData).toBeUndefined();
	});

	it('decodes startBlock from a hex block number', async () => {
		writeDeployment('Token', {
			abi: [],
			address: '0x' + 'a'.repeat(40),
			receipt: {blockNumber: '0x10'},
		});

		const outFile = path.join(tmpDir, 'exported.json');
		await run(config, ENV_NAME, {tojson: [outFile]});

		const parsed = JSON.parse(readOutput(outFile));
		expect(parsed.contracts.Token.startBlock).toBe(16); // 0x10 = 16
	});

	it('decodes startBlock from a decimal string block number', async () => {
		writeDeployment('Token', {
			abi: [],
			address: '0x' + 'a'.repeat(40),
			receipt: {blockNumber: '42'},
		});

		const outFile = path.join(tmpDir, 'exported.json');
		await run(config, ENV_NAME, {tojson: [outFile]});

		const parsed = JSON.parse(readOutput(outFile));
		expect(parsed.contracts.Token.startBlock).toBe(42);
	});

	it('decodes startBlock from a hardhat-deploy-v1 numeric block number', async () => {
		writeDeployment('Token', {
			abi: [],
			address: '0x' + 'a'.repeat(40),
			receipt: {blockNumber: 99},
		});

		const outFile = path.join(tmpDir, 'exported.json');
		await run(config, ENV_NAME, {tojson: [outFile]});

		const parsed = JSON.parse(readOutput(outFile));
		expect(parsed.contracts.Token.startBlock).toBe(99);
	});

	it('writes a TS module file with per-contract named exports', async () => {
		writeDeployment('Token', {abi: [], address: '0x' + 'a'.repeat(40)});
		writeDeployment('Vault', {abi: [], address: '0x' + 'b'.repeat(40)});

		const outFile = path.join(tmpDir, 'exported.tsm');
		await run(config, ENV_NAME, {totsm: [outFile]});

		const content = readOutput(outFile);
		expect(content).toContain('export const chain');
		expect(content).toContain('export const Token');
		expect(content).toContain('export const Vault');
	});

	it('refuses to write a module file when a deployment name is not a JS identifier', async () => {
		// The module modes turn each deployment name into SOURCE (`export const <name> = ...`), so a
		// name that is a fine file name is not necessarily a fine identifier. Left unchecked this
		// wrote a file that does not parse, and the error surfaced in the consuming app's build,
		// pointing at generated code, naming no deployment.
		writeDeployment('Token', {abi: [], address: '0x' + 'a'.repeat(40)});
		writeDeployment('Token-V2', {abi: [], address: '0x' + 'b'.repeat(40)});

		const outFile = path.join(tmpDir, 'exported.tsm');
		const error = await run(config, ENV_NAME, {totsm: [outFile]}).catch((err) => err);

		expect(error).toBeInstanceOf(InvalidModuleExportNameError);
		expect(error).toBeInstanceOf(ExportError);
		expect(error.deploymentNames).toEqual(['Token-V2']);
		expect(error.environmentName).toBe(ENV_NAME);
		// It names the offender and the way out, since renaming a deployment is not always an option.
		expect(error.message).toContain('Token-V2');
		expect(error.message).toContain('--ts/--js/--json');
		// Nothing half-written: the file the consumer would import must not exist at all.
		expect(fs.existsSync(outFile)).toBe(false);
	});

	it('reports every offending deployment name, and reserved words among them', async () => {
		writeDeployment('Token', {abi: [], address: '0x' + 'a'.repeat(40)});
		writeDeployment('My Registry', {abi: [], address: '0x' + 'b'.repeat(40)});
		writeDeployment('default', {abi: [], address: '0x' + 'c'.repeat(40)});

		const error = await run(config, ENV_NAME, {tojsm: [path.join(tmpDir, 'exported.jsm')]}).catch((err) => err);

		expect(error).toBeInstanceOf(InvalidModuleExportNameError);
		// `default` has an identifier's SHAPE but cannot follow `export const`; one run should
		// surface every name to fix, not just the first.
		expect(error.deploymentNames.sort()).toEqual(['My Registry', 'default']);
	});

	it('still exports such a deployment through the object modes, which have no identifier constraint', async () => {
		writeDeployment('Token-V2', {abi: [], address: '0x' + 'b'.repeat(40)});

		const jsonFile = path.join(tmpDir, 'exported.json');
		const tsFile = path.join(tmpDir, 'exported.ts');
		await run(config, ENV_NAME, {tojson: [jsonFile], tots: [tsFile]});

		// The name stays EXACT as an object key: this is the escape hatch the error points at, so
		// it has to keep working, and it must not quietly rename anything either.
		expect(JSON.parse(readOutput(jsonFile)).contracts['Token-V2']).toBeDefined();
		expect(readOutput(tsFile)).toContain('"Token-V2"');
	});

	it('accepts a string instead of an array for output paths', async () => {
		writeDeployment('Token', {abi: [], address: '0x' + 'a'.repeat(40)});

		const outFile = path.join(tmpDir, 'exported.json');
		await run(config, ENV_NAME, {tojson: outFile as any});

		expect(fs.existsSync(outFile)).toBe(true);
	});
});

/**
 * An environment with nothing in it is a FAILURE, not a silent success.
 *
 * What made the old no-op dangerous was never the missing write on its own: it was that the
 * output file is the consuming app's source of truth for addresses, and it is normally already
 * there from an export against a DIFFERENT environment. Succeeding without writing therefore
 * hands the app another network's addresses. These tests pin both halves: the failure is raised,
 * and it is raised before anything on disk moves.
 */
describe('@rocketh/export - an environment with nothing to export fails', () => {
	it('rejects when the environment folder does not exist at all, naming the environment and the path', async () => {
		const outFile = path.join(tmpDir, 'out.ts');

		const error = await run(config, 'nosuchnet', {tots: [outFile]}).catch((err) => err);

		expect(error).toBeInstanceOf(NoDeploymentsError);
		expect(error.reason).toBe('missing-folder');
		expect(error.environmentName).toBe('nosuchnet');
		expect(error.environmentPath).toBe(path.join(deploymentsDir, 'nosuchnet'));
		// What was asked for, and where it was looked for: `no deployments to export` named neither.
		expect(error.message).toContain(`'nosuchnet'`);
		expect(error.message).toContain(path.join(deploymentsDir, 'nosuchnet'));
		// The typo case is the common one, so the environments that DO exist are listed.
		expect(error.message).toContain(ENV_NAME);
	});

	it('rejects with a different reason when the folder exists but holds no deployment record', async () => {
		// `beforeEach` creates <deployments>/testenv with a .chain file and nothing else. This is
		// a different situation from a typo (the environment is real, it just has no contracts),
		// so it gets its own reason and its own message, but it is equally fatal: the consumer
		// would otherwise keep reading a previous environment's addresses either way.
		const error = await run(config, ENV_NAME, {tots: [path.join(tmpDir, 'out.ts')]}).catch((err) => err);

		expect(error).toBeInstanceOf(NoDeploymentsError);
		expect(error.reason).toBe('no-records');
		expect(error.message).toContain(`'${ENV_NAME}'`);
		expect(error.message).toContain(path.join(deploymentsDir, ENV_NAME));
		expect(error.message).toContain('exists');
	});

	it('reports the deployments folder itself being absent, rather than only the environment', async () => {
		const missingRoot = path.join(tmpDir, 'not-a-deployments-folder');
		const configWithMissingRoot = resolveConfig({deployments: missingRoot, chains: {}});

		const error = await run(configWithMissingRoot, 'sepolia', {tots: [path.join(tmpDir, 'out.ts')]}).catch(
			(err) => err,
		);

		expect(error).toBeInstanceOf(NoDeploymentsError);
		expect(error.reason).toBe('missing-folder');
		expect(error.message).toContain(missingRoot);
		expect(error.message).toContain('does not exist');
	});

	it('leaves an existing output file byte-identical and writes nothing new', async () => {
		// The whole point of erroring is that the stale file is not trusted; half-writing it on
		// the way to erroring would be worse than the bug being fixed.
		const outFile = path.join(tmpDir, 'nested', 'deployments.ts');
		const jsFile = path.join(tmpDir, 'nested', 'deployments.js');
		fs.mkdirSync(path.dirname(outFile), {recursive: true});
		const previousExport = `export default {chain: {id: 31337}, contracts: {Token: {}}} as const;\n`;
		fs.writeFileSync(outFile, previousExport);
		const before = fs.readFileSync(outFile);
		const untouchedDir = path.join(tmpDir, 'never-created');

		await expect(
			run(config, 'nosuchnet', {
				tots: [outFile],
				tojs: [jsFile],
				tojson: [path.join(untouchedDir, 'deployments.json')],
			}),
		).rejects.toBeInstanceOf(NoDeploymentsError);

		expect(fs.readFileSync(outFile).equals(before)).toBe(true);
		expect(fs.existsSync(jsFile)).toBe(false);
		expect(fs.existsSync(jsFile.replace('.js', '.d.ts'))).toBe(false);
		// Not even the directory: the writers mkdir before writing, so a check placed after them
		// would still leave a trail.
		expect(fs.existsSync(untouchedDir)).toBe(false);
	});

	it('names the output files it did not write, since those still hold the previous export', async () => {
		const outFile = path.join(tmpDir, 'deployments.ts');
		const neverWritten = path.join(tmpDir, 'absent.json');
		fs.writeFileSync(outFile, 'previous export');

		const error = await run(config, 'nosuchnet', {tots: [outFile], tojson: [neverWritten]}).catch((err) => err);

		expect(error.message).toContain(outFile);
		// A file that is not there cannot be stale, so it is not reported as such.
		expect(error.message).not.toContain(neverWritten);
	});
});

/**
 * The CLI contract: exit code and stream.
 *
 * A `deploy && export && dev` chain only stops if the process exits non-zero, and a message on
 * stdout is invisible to anything reading the failure. Both were wrong before (exit 0, stdout),
 * and neither is observable from `run` alone, so this drives the real binary.
 */
describe('@rocketh/export - CLI exit code and streams', () => {
	const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
	/**
	 * Compiled here rather than reused from `dist/`, so the test observes the CURRENT source
	 * whether or not the package happens to have been built. It has to land inside the package
	 * for `@rocketh/node` to resolve from it.
	 *
	 * `tsconfig.build.json`, NOT `tsconfig.json`: the latter is the checking config, which sets
	 * `noEmit` and would silently produce no `cli.js` at all, and which also pulls in `test/`.
	 * This needs the emitting, src-only config that `pnpm build` uses.
	 */
	const cliBuildDir = path.join(packageDir, '.cli-build-for-test');
	const TSC = createRequire(import.meta.url).resolve('typescript/bin/tsc');

	beforeAll(() => {
		execFileSync(process.execPath, [TSC, '-p', path.join(packageDir, 'tsconfig.build.json'), '--outDir', cliBuildDir], {
			encoding: 'utf-8',
			stdio: 'pipe',
		});
	}, 120_000);

	afterAll(() => {
		fs.rmSync(cliBuildDir, {recursive: true, force: true});
	});

	function runCLI(args: string[]) {
		return spawnSync(process.execPath, [path.join(cliBuildDir, 'cli.js'), ...args], {
			cwd: tmpDir,
			encoding: 'utf-8',
		});
	}

	it('exits non-zero with the message on stderr, leaving the previous export untouched', () => {
		const outFile = path.join(tmpDir, 'deployments.ts');
		fs.writeFileSync(outFile, 'previous export');
		const before = fs.readFileSync(outFile);

		const result = runCLI(['-e', 'nosuchnet', '-d', deploymentsDir, '--ts', outFile]);

		expect(result.status).toBe(1);
		expect(result.stdout).toBe('');
		expect(result.stderr).toContain('nosuchnet');
		expect(result.stderr).toContain(path.join(deploymentsDir, 'nosuchnet'));
		// A message, not an unhandled-rejection stack trace.
		expect(result.stderr).not.toContain('at run (');
		expect(fs.readFileSync(outFile).equals(before)).toBe(true);
	});

	it('exits non-zero with the message on stderr when no output flag was passed', () => {
		writeDeployment('Token', {abi: [], address: '0x' + 'a'.repeat(40)});

		const result = runCLI(['-e', ENV_NAME, '-d', deploymentsDir]);

		expect(result.status).toBe(1);
		expect(result.stdout).toBe('');
		expect(result.stderr).toContain('--ts');
		expect(result.stderr).toContain(ENV_NAME);
	});

	it('still exits 0 and writes when the environment does have deployments', () => {
		// Without this, the assertion above could hold for a reason unrelated to the change.
		writeDeployment('Token', {abi: [], address: '0x' + 'a'.repeat(40)});
		const outFile = path.join(tmpDir, 'ok.json');

		const result = runCLI(['-e', ENV_NAME, '-d', deploymentsDir, '--json', outFile]);

		expect(result.stderr).toBe('');
		expect(result.status).toBe(0);
		expect(JSON.parse(fs.readFileSync(outFile, 'utf-8')).contracts.Token).toBeDefined();
	});
});

/**
 * The generated TypeScript has to COMPILE, and has to compile for the things a real consumer
 * does with it. String-containment assertions cannot see either.
 *
 * These tests were written because `jolly-roger` carries a hand-written cast to work around the
 * output (`web/src/lib/deployments-store.ts`): `as const` pinned `rpcUrls.default.http` to
 * `readonly []`, a type that accepts nothing, so injecting an RPC endpoint at run time did not
 * compile. Every consumer had to discover and re-solve that.
 */
/**
 * These four are the heaviest tests in the monorepo: each one COMPILES the generated TypeScript
 * with tsc in a spawned process, which is CPU-bound and orders of magnitude heavier than the
 * assertion-only tests around it. Idle they take about a second each; under the repo-wide
 * `pnpm test`, where they compete with 90-odd other test files immediately after a full build,
 * they have been measured at 6186ms and 6670ms and so overshoot vitest's 5s default.
 *
 * That made them bounce acceptance gates for tasks that never touched this package, six times in
 * one six-task drive alone, and the first reading is always "did my change break export?". The
 * cost is INHERENT and known rather than accidental, so the budget is pinned here, on the suite
 * that earns it, rather than by raising the global default (which is doing useful work for every
 * other test) or by reducing the parallelism around it.
 *
 * Generous on purpose: at roughly a second when idle, this is not a threshold these tests can
 * approach except when something is genuinely wrong, and it still bounds a hung compiler.
 */
describe('@rocketh/export - the generated TypeScript compiles for real consumers', {timeout: 60_000}, () => {
	/**
	 * Resolved from THIS FILE, never from `process.cwd()`.
	 *
	 * `path.resolve('node_modules/.bin/tsc')` passed locally and failed in CI: the root runner
	 * (`pnpm test`) and the per-package runner have different cwds, and this machine happened to
	 * have a hoisted `tsc` in the root `node_modules/.bin` that CI does not. Resolving through
	 * the module system finds the compiler this package actually depends on, from anywhere.
	 */
	const TSC = createRequire(import.meta.url).resolve('typescript/bin/tsc');

	/** Type-check `consumer.ts` against the generated file, returning tsc's own diagnostics. */
	function typecheck(consumerSource: string): {ok: boolean; output: string} {
		const consumerFile = path.join(tmpDir, 'consumer.ts');
		fs.writeFileSync(consumerFile, consumerSource);
		try {
			execFileSync(
				process.execPath,
				[
					TSC,
					'--noEmit',
					'--strict',
					'--target',
					'esnext',
					'--module',
					'preserve',
					'--moduleResolution',
					'bundler',
					// The package's own tsconfig.json would otherwise be refused (TS5112) and
					// nothing would be checked at all, which the negative test below caught.
					'--ignoreConfig',
					consumerFile,
				],
				{encoding: 'utf-8', stdio: 'pipe'},
			);
			return {ok: true, output: ''};
		} catch (err) {
			const e = err as {stdout?: string; stderr?: string; status?: number | null; code?: unknown};
			const output = `${e.stdout ?? ''}${e.stderr ?? ''}`;
			// A compiler that never RAN is not a type error, and must not be reported as one:
			// that is precisely how this suite failed in CI while passing here. tsc exits 1 or 2
			// with diagnostics on stdout; a spawn failure has no exit status at all.
			if (typeof e.status !== 'number') {
				throw new Error(`could not run tsc at ${TSC} (${String(e.code)}). Output: ${output || '<none>'}`);
			}
			return {ok: false, output};
		}
	}

	beforeEach(async () => {
		writeDeployment('Token', {
			abi: [{type: 'function', name: 'getValue', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'}],
			address: '0x' + 'a'.repeat(40),
			receipt: {blockNumber: '0x10'},
		});
		await run(config, ENV_NAME, {tots: [path.join(tmpDir, 'exported.ts')]});
	});

	it('lets a consumer build a chain of the exported type carrying an injected RPC endpoint', () => {
		/**
		 * The exact thing that was impossible, in the exact shape it bites.
		 *
		 * Note what does NOT test this: reading `http` into a `readonly string[]`, or spreading
		 * the chain and replacing `rpcUrls` with a fresh object. `readonly []` is perfectly
		 * assignable TO `readonly string[]`, and a wholesale replacement never checks the
		 * original field, so both pass with the bug fully present (verified). The failure only
		 * appears when a value must be assignable to the EXPORTED chain type, which is what a
		 * consumer holding `typeof deployments.chain` actually has to do.
		 */
		const result = typecheck(`
			import deployments from './exported.js';
			type Chain = typeof deployments.chain;
			const withEndpoint: Chain = {
				...deployments.chain,
				rpcUrls: {default: {http: ['https://example.com']}},
			};
			export const endpoint: string | undefined = withEndpoint.rpcUrls.default.http[0];
		`);

		expect(result.output).toBe('');
		expect(result.ok).toBe(true);
	});

	it('lets a consumer read a known chain property without casting', () => {
		// `properties` is usually `{}`; pinned to `{}` even `undefined` was unreachable.
		const result = typecheck(`
			import deployments from './exported.js';
			export const blockTime = deployments.chain.properties['averageBlockTimeMs'];
		`);

		expect(result.output).toBe('');
		expect(result.ok).toBe(true);
	});

	it('still infers literal contract addresses and ABIs, which is why the output is TypeScript', () => {
		/**
		 * The widening is deliberately surgical. If it had been done by dropping `as const`,
		 * this would fail, and the export would have lost the only thing that makes a
		 * TypeScript output better than a JSON one.
		 */
		const result = typecheck(`
			import deployments from './exported.js';
			const address: '0x${'a'.repeat(40)}' = deployments.contracts.Token.address;
			const fnName: 'getValue' = deployments.contracts.Token.abi[0].name;
			const chainId: 31337 = deployments.chain.id;
			export {address, fnName, chainId};
		`);

		expect(result.output).toBe('');
		expect(result.ok).toBe(true);
	});

	it('reports an error for a genuinely wrong usage, so the check above is not vacuous', () => {
		// If tsc were silently not running, or not resolving the generated file, every
		// assertion above would pass for the wrong reason.
		const result = typecheck(`
			import deployments from './exported.js';
			export const wrong: number = deployments.contracts.Token.address;
		`);

		expect(result.ok).toBe(false);
		expect(result.output).toContain('not assignable');
	});
});

/**
 * `--verify` asks the chain whether the deployments about to be exported are really there.
 *
 * The reason it is OPT-IN is the first test here: export reads files and writes files, so it
 * runs with no network at all, and a CI web build depends on that. A default that reached for
 * an RPC would break every offline build.
 *
 * What it catches is the failure export cannot otherwise see: the generated file is the app's
 * source of truth for addresses, and pointing it at an address that holds nothing on the
 * network the user connects to only surfaces when someone's transaction reverts.
 */
describe('@rocketh/export - run with --verify', () => {
	/** A provider that answers canned responses and records what it was asked. */
	function recordingProvider(responses: Record<string, unknown | ((params?: unknown[]) => unknown)>) {
		const calls: {method: string; params?: unknown[]}[] = [];
		const provider = {
			request: async (args: {method: string; params?: unknown[]}) => {
				calls.push(args);
				const response = responses[args.method];
				return typeof response === 'function' ? (response as (p?: unknown[]) => unknown)(args.params) : response;
			},
		} as never;
		return {provider, calls};
	}

	it('makes NO network request when --verify is not passed', async () => {
		// The property the flag exists to protect. A provider that throws on any call stands in
		// for "there is no network here at all", which is the CI web build case.
		const {provider, calls} = recordingProvider({
			eth_chainId: () => {
				throw new Error('the export must not touch the network');
			},
		});
		writeDeployment('Token', {abi: [], address: '0x' + 'a'.repeat(40)});

		const outFile = path.join(tmpDir, 'exported.json');
		await run(config, ENV_NAME, {tojson: [outFile], provider});

		expect(fs.existsSync(outFile)).toBe(true);
		expect(calls).toHaveLength(0);
	});

	it('writes the export when the chain agrees', async () => {
		const {provider, calls} = recordingProvider({
			eth_chainId: '0x7a69', // 31337, as hex: the recorded id is decimal
			eth_getCode: '0x6080604052',
		});
		writeDeployment('Token', {abi: [], address: '0x' + 'a'.repeat(40)});

		const outFile = path.join(tmpDir, 'exported.json');
		await run(config, ENV_NAME, {tojson: [outFile], verify: true, provider});

		expect(fs.existsSync(outFile)).toBe(true);
		expect(calls.map((c) => c.method)).toEqual(['eth_chainId', 'eth_getCode']);
	});

	it('refuses, and writes nothing, when an exported address holds no code', async () => {
		// The realistic case: a record kept from a chain that was reset, or a deployment that
		// never landed. Every offender is named, since fixing them one round-trip at a time is
		// how a five-contract export takes five runs.
		const {provider} = recordingProvider({
			eth_chainId: '0x7a69',
			eth_getCode: (params?: unknown[]) => ((params as string[])[0].endsWith('bbbb') ? '0x' : '0x6080604052'),
		});
		writeDeployment('Token', {abi: [], address: '0x' + 'a'.repeat(40)});
		writeDeployment('Vault', {abi: [], address: '0x' + 'b'.repeat(40)});

		const outFile = path.join(tmpDir, 'exported.json');
		const error = await run(config, ENV_NAME, {tojson: [outFile], verify: true, provider}).catch((err) => err);

		expect(error).toBeInstanceOf(OnChainVerificationError);
		expect(error).toBeInstanceOf(ExportError);
		expect(error.message).toContain('Vault');
		expect(error.message).toContain('holds no code');
		expect(error.message).not.toContain('Token is recorded');
		// The previous output must survive a failed verification: a half-verified file is worse
		// than an old one, because it looks current.
		expect(fs.existsSync(outFile)).toBe(false);
	});

	it('reports the wrong chain as ONE cause, not as every address failing', async () => {
		// On the wrong network every address also reports no code. Listing all of them buries
		// the single thing that is actually wrong.
		const {provider} = recordingProvider({
			eth_chainId: '0x1', // mainnet, while the environment holds 31337 deployments
			eth_getCode: '0x',
		});
		writeDeployment('Token', {abi: [], address: '0x' + 'a'.repeat(40)});
		writeDeployment('Vault', {abi: [], address: '0x' + 'b'.repeat(40)});

		const error = await run(config, ENV_NAME, {
			tojson: [path.join(tmpDir, 'exported.json')],
			verify: true,
			provider,
		}).catch((err) => err);

		expect(error).toBeInstanceOf(OnChainVerificationError);
		expect(error.problems).toHaveLength(1);
		expect(error.message).toContain('not the same network');
	});

	it('fails rather than silently skipping when the node cannot be reached', async () => {
		// `--verify` was asked for explicitly. "Could not check" is not "checked".
		const {provider} = recordingProvider({
			eth_chainId: () => {
				throw new Error('ECONNREFUSED');
			},
		});
		writeDeployment('Token', {abi: [], address: '0x' + 'a'.repeat(40)});

		const error = await run(config, ENV_NAME, {
			tojson: [path.join(tmpDir, 'exported.json')],
			verify: true,
			provider,
		}).catch((err) => err);

		expect(error).toBeInstanceOf(OnChainVerificationError);
		expect(error.message).toContain('could not reach the node');
	});

	it('says so when the chain has no RPC configured at all', async () => {
		// Exporting unverified output while the user believes it was checked is the one outcome
		// worth avoiding here. This config declares the chain but gives it nowhere to ask.
		const configWithoutRpc = resolveConfig({
			deployments: deploymentsDir,
			chains: {
				[31337]: {
					info: {
						id: 31337,
						name: 'hardhat',
						nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
						rpcUrls: {default: {http: []}},
					},
				},
			},
		});
		writeDeployment('Token', {abi: [], address: '0x' + 'a'.repeat(40)});

		const error = await run(configWithoutRpc, ENV_NAME, {
			tojson: [path.join(tmpDir, 'exported.json')],
			verify: true,
		}).catch((err) => err);

		expect(error).toBeInstanceOf(OnChainVerificationError);
		expect(error.message).toContain('no RPC endpoint is configured');
	});
});
