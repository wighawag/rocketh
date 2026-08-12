/**
 * Tests for @rocketh/node - the filesystem-backed DeploymentStore.
 *
 * The FS store was at 20% coverage. These tests exercise every operation against a real
 * temp directory: write/read round-trip, chain info recording, listFiles with a filter
 * (previously the filter argument was silently ignored — a bug fixed alongside these
 * tests), hasFile, deleteAll, and the throw-on-missing-file paths.
 */

import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {createFSDeploymentStore} from '../src/environment/deployment-store.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

let tmpDir: string;
let store: ReturnType<typeof createFSDeploymentStore>;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rocketh-fs-store-'));
	store = createFSDeploymentStore();
});

afterEach(() => {
	fs.rmSync(tmpDir, {recursive: true, force: true});
});

describe('@rocketh/node - FS DeploymentStore', () => {
	describe('writeFile / readFile', () => {
		it('creates nested folders and round-trips content', async () => {
			await store.writeFile(tmpDir, 'testenv', 'Token.json', '{"abi":[]}');
			const content = await store.readFile(tmpDir, 'testenv', 'Token.json');
			expect(content).toBe('{"abi":[]}');
		});

		it('throws on a missing file', async () => {
			await expect(store.readFile(tmpDir, 'testenv', 'NonExistent.json')).rejects.toThrow();
		});
	});

	describe('writeFileWithChainInfo', () => {
		it('writes a .chain file on first use', async () => {
			await store.writeFileWithChainInfo(
				{chainId: '31337', genesisHash: '0xabc'},
				tmpDir,
				'testenv',
				'Token.json',
				'{}',
			);
			expect(await store.hasFile(tmpDir, 'testenv', '.chain')).toBe(true);
			const chainContent = await store.readFile(tmpDir, 'testenv', '.chain');
			expect(JSON.parse(chainContent).chainId).toBe('31337');
		});

		it('does NOT overwrite an existing .chain file', async () => {
			await store.writeFileWithChainInfo(
				{chainId: '31337', genesisHash: '0xaaa'},
				tmpDir,
				'testenv',
				'Token.json',
				'{}',
			);
			// Second call with different chainId — should not overwrite
			await store.writeFileWithChainInfo(
				{chainId: '99999', genesisHash: '0xbbb'},
				tmpDir,
				'testenv',
				'Other.json',
				'{}',
			);
			const chainContent = await store.readFile(tmpDir, 'testenv', '.chain');
			expect(JSON.parse(chainContent).chainId).toBe('31337');
		});
	});

	describe('hasFile', () => {
		it('returns true for an existing file and false for a missing one', async () => {
			await store.writeFile(tmpDir, 'testenv', 'Token.json', '{}');
			expect(await store.hasFile(tmpDir, 'testenv', 'Token.json')).toBe(true);
			expect(await store.hasFile(tmpDir, 'testenv', 'Missing.json')).toBe(false);
		});
	});

	describe('listFiles', () => {
		it('returns all files when no filter is provided', async () => {
			await store.writeFileWithChainInfo({chainId: '1'}, tmpDir, 'testenv', 'Token.json', '{}');
			await store.writeFile(tmpDir, 'testenv', 'Vault.json', '{}');

			const files = await store.listFiles(tmpDir, 'testenv');
			expect(files).toContain('Token.json');
			expect(files).toContain('Vault.json');
			expect(files).toContain('.chain');
		});

		it('honors the filter argument (excludes dotfiles, includes .migrations.json)', async () => {
			await store.writeFileWithChainInfo({chainId: '1'}, tmpDir, 'testenv', 'Token.json', '{}');
			await store.writeFile(tmpDir, 'testenv', '.migrations.json', '{}');

			// The filter that loadDeploymentsFromStore uses
			const filter = (name: string) => !(name.startsWith('.') && name !== '.migrations.json') && name !== 'solcInputs';
			const files = await store.listFiles(tmpDir, 'testenv', filter);

			expect(files).toContain('Token.json');
			expect(files).toContain('.migrations.json');
			expect(files).not.toContain('.chain');
		});

		it('throws on a missing folder', async () => {
			await expect(store.listFiles(tmpDir, 'nonexistent')).rejects.toThrow();
		});
	});

	describe('deleteFile', () => {
		it('deletes a file', async () => {
			await store.writeFile(tmpDir, 'testenv', 'Token.json', '{}');
			await store.deleteFile(tmpDir, 'testenv', 'Token.json');
			expect(await store.hasFile(tmpDir, 'testenv', 'Token.json')).toBe(false);
		});

		it('throws on a missing file', async () => {
			await expect(store.deleteFile(tmpDir, 'testenv', 'Missing.json')).rejects.toThrow();
		});
	});

	describe('deleteAll', () => {
		it('removes the entire environment folder', async () => {
			await store.writeFileWithChainInfo({chainId: '1'}, tmpDir, 'testenv', 'Token.json', '{}');
			await store.deleteAll(tmpDir, 'testenv');
			expect(await store.hasFile(tmpDir, 'testenv', 'Token.json')).toBe(false);
			expect(await store.hasFile(tmpDir, 'testenv', '.chain')).toBe(false);
		});

		it('is a no-op on a missing folder', async () => {
			await expect(store.deleteAll(tmpDir, 'nonexistent')).resolves.not.toThrow();
		});

		it('allows re-creating files after deleteAll', async () => {
			await store.writeFileWithChainInfo({chainId: '1'}, tmpDir, 'testenv', 'Token.json', '{}');
			await store.deleteAll(tmpDir, 'testenv');
			await store.writeFile(tmpDir, 'testenv', 'NewToken.json', '{}');
			expect(await store.hasFile(tmpDir, 'testenv', 'NewToken.json')).toBe(true);
		});
	});
});
