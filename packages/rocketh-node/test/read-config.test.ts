/**
 * Tests for @rocketh/node - readAndResolveConfig (config file discovery).
 *
 * `readConfig` (called by `readAndResolveConfig`) discovers config files in
 * `process.cwd()`: it tries `rocketh.ts` then `rocketh/config.ts`, then `rocketh.js`
 * then `rocketh/config.js`, and throws if both a TS and JS config exist. These
 * tests use temp directories and `process.chdir` to exercise the discovery logic.
 */

import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {readAndResolveConfig} from '../src/executor/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

let tmpDir: string;
let originalCwd: string;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rocketh-config-'));
	originalCwd = process.cwd();
});

afterEach(() => {
	process.chdir(originalCwd);
	fs.rmSync(tmpDir, {recursive: true, force: true});
});

describe('@rocketh/node - readAndResolveConfig', () => {
	it('loads config from rocketh.js', async () => {
		fs.writeFileSync(
			path.join(tmpDir, 'rocketh.js'),
			`export const config = { accounts: { deployer: '0x' + 'a'.repeat(40) }, data: {} };`,
		);
		process.chdir(tmpDir);

		const resolved = await readAndResolveConfig();
		expect(resolved.accounts).toBeDefined();
		expect((resolved.accounts as any).deployer).toBe('0x' + 'a'.repeat(40));
	});

	it('loads config from rocketh/config.js', async () => {
		fs.mkdirSync(path.join(tmpDir, 'rocketh'));
		fs.writeFileSync(
			path.join(tmpDir, 'rocketh', 'config.js'),
			`export const config = { accounts: { deployer: '0x' + 'b'.repeat(40) }, data: {} };`,
		);
		process.chdir(tmpDir);

		const resolved = await readAndResolveConfig();
		expect((resolved.accounts as any).deployer).toBe('0x' + 'b'.repeat(40));
	});

	it('returns a default config when no config file exists', async () => {
		// Empty temp dir — no config file
		process.chdir(tmpDir);

		const resolved = await readAndResolveConfig();
		// Should have chains from viem defaults but no custom accounts
		expect(resolved.chains).toBeDefined();
		expect(resolved.accounts).toBeUndefined();
	});

	it('throws when both TS and JS config files exist', async () => {
		fs.writeFileSync(path.join(tmpDir, 'rocketh.ts'), `export const config = { data: {} };`);
		fs.writeFileSync(path.join(tmpDir, 'rocketh.js'), `export const config = { data: {} };`);
		process.chdir(tmpDir);

		await expect(readAndResolveConfig()).rejects.toThrow(/Multiple configuration files found/);
	});
});
