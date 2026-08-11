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
