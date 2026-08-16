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

	/**
	 * `readConfig` REPLACES `config.chains` with a map it builds from viem's chain registry.
	 * A chain id viem does not know must still come through, or a user who declared a private
	 * chain loses the whole entry: `rpcUrl` included, which then fails the run with
	 * `chain with id X has no rpc url provided nor any provider to use`.
	 */
	it('keeps a user-declared chain id that viem does not know', async () => {
		fs.writeFileSync(
			path.join(tmpDir, 'rocketh.js'),
			`export const config = {
				data: {},
				chains: {
					424242: {
						rpcUrl: 'http://localhost:9999',
						tags: ['private'],
						info: {
							id: 424242,
							name: 'My Private Chain',
							nativeCurrency: {name: 'Custom', symbol: 'CUS', decimals: 18},
							rpcUrls: {default: {http: ['http://localhost:9999']}},
						},
					},
				},
			};`,
		);
		process.chdir(tmpDir);

		const resolved = await readAndResolveConfig();
		const custom = (resolved.chains as any)?.[424242];
		expect(custom).toBeDefined();
		expect(custom.rpcUrl).toBe('http://localhost:9999');
		expect(custom.tags).toEqual(['private']);
		expect(custom.info.name).toBe('My Private Chain');
		// and viem's chains are still there alongside it
		expect((resolved.chains as any)?.[1]?.info?.name).toBe('Ethereum');
	});

	/**
	 * For an id viem DOES know, viem supplies the metadata and the user's entry is layered on
	 * top field by field, so an override wins without having to restate the whole chain.
	 */
	it('lets a user override win over viem metadata for a known chain id', async () => {
		fs.writeFileSync(
			path.join(tmpDir, 'rocketh.js'),
			`export const config = {
				data: {},
				chains: {
					1: {rpcUrl: 'http://my-mainnet-node', info: {name: 'My Renamed Mainnet'}},
				},
			};`,
		);
		process.chdir(tmpDir);

		const resolved = await readAndResolveConfig();
		const mainnet = (resolved.chains as any)?.[1];
		expect(mainnet.rpcUrl).toBe('http://my-mainnet-node');
		expect(mainnet.info.name).toBe('My Renamed Mainnet');
		// untouched fields still come from viem
		expect(mainnet.info.nativeCurrency.symbol).toBe('ETH');
		expect(mainnet.info.id).toBe(1);
	});

	it('throws when both TS and JS config files exist', async () => {
		fs.writeFileSync(path.join(tmpDir, 'rocketh.ts'), `export const config = { data: {} };`);
		fs.writeFileSync(path.join(tmpDir, 'rocketh.js'), `export const config = { data: {} };`);
		process.chdir(tmpDir);

		await expect(readAndResolveConfig()).rejects.toThrow(/Multiple configuration files found/);
	});
});
