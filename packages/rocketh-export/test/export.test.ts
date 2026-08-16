/**
 * Tests for @rocketh/export - deployment export to TS/JS/JSON.
 *
 * `run` reads deployments from the filesystem (via `@rocketh/node`'s
 * `loadDeploymentsFromFiles`), builds an `ExportedDeployments` object, and writes it to
 * one or more output files. These tests use a real temp directory laid out as
 * `<deployments>/<env>/<Name>.json` plus a `.chain` file.
 */

import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {run} from '../src/index.js';
import {resolveConfig} from 'rocketh';
import type {ResolvedUserConfig} from '@rocketh/core/types';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';

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
	it('returns early when no output paths are specified', async () => {
		writeDeployment('Token', {abi: [], address: '0x' + 'a'.repeat(40)});
		await run(config, ENV_NAME, {});
		// No output files should exist
		expect(fs.readdirSync(tmpDir)).not.toContain('exported');
	});

	it('returns early when there are no deployments', async () => {
		// Remove the deployment file — only .chain exists, but listFiles returns ['.chain']
		// which is > 0, so it checks .chain. No .json files means deployments is empty.
		await run(config, ENV_NAME, {tots: [path.join(tmpDir, 'out.ts')]});
		// Should not have written the output
		expect(fs.existsSync(path.join(tmpDir, 'out.ts'))).toBe(false);
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

	it('accepts a string instead of an array for output paths', async () => {
		writeDeployment('Token', {abi: [], address: '0x' + 'a'.repeat(40)});

		const outFile = path.join(tmpDir, 'exported.json');
		await run(config, ENV_NAME, {tojson: outFile as any});

		expect(fs.existsSync(outFile)).toBe(true);
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
describe('@rocketh/export - the generated TypeScript compiles for real consumers', () => {
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
