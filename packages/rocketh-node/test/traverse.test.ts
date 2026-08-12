/**
 * Tests for @rocketh/node - filesystem traversal utilities.
 *
 * `traverse` and `traverseMultipleDirectory` are used by the node executor to discover
 * deploy scripts in directories. They were at 3.5% coverage. These tests exercise them
 * against real temp directories: recursion into subdirectories, dotfile exclusion, custom
 * filters, and the `traverseMultipleDirectory` output format (relative paths joined to
 * the base dir, directories excluded from the result).
 */

import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {traverse, traverseMultipleDirectory} from '../src/utils/fs.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

let tmpDir: string;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rocketh-traverse-'));
});

afterEach(() => {
	fs.rmSync(tmpDir, {recursive: true, force: true});
});

function makeFile(...segments: string[]) {
	const filePath = path.join(tmpDir, ...segments);
	fs.mkdirSync(path.dirname(filePath), {recursive: true});
	fs.writeFileSync(filePath, 'content');
}

describe('traverse', () => {
	it('returns all non-dotfile entries including directories', () => {
		makeFile('01_a.ts');
		makeFile('02_b.ts');
		makeFile('sub', 'c.ts');

		const result = traverse(tmpDir);
		const names = result.map((r) => r.name).sort();
		expect(names).toContain('01_a.ts');
		expect(names).toContain('02_b.ts');
		expect(names).toContain('sub');
		expect(names).toContain('c.ts');
	});

	it('excludes dotfiles by default', () => {
		makeFile('visible.ts');
		fs.writeFileSync(path.join(tmpDir, '.hidden'), 'content');

		const result = traverse(tmpDir);
		const names = result.map((r) => r.name);
		expect(names).toContain('visible.ts');
		expect(names).not.toContain('.hidden');
	});

	it('computes relativePath against the topDir', () => {
		makeFile('sub', 'nested.ts');

		const result = traverse(tmpDir);
		const nested = result.find((r) => r.name === 'nested.ts');
		expect(nested).toBeDefined();
		expect(nested!.relativePath).toBe(path.join('sub', 'nested.ts'));
	});

	it('marks directories with directory: true', () => {
		makeFile('sub', 'file.ts');

		const result = traverse(tmpDir);
		const dir = result.find((r) => r.name === 'sub');
		expect(dir!.directory).toBe(true);
		const file = result.find((r) => r.name === 'file.ts');
		expect(file!.directory).toBe(false);
	});

	it('accepts a custom filter that overrides the dotfile default', () => {
		makeFile('visible.ts');
		fs.writeFileSync(path.join(tmpDir, '.hidden'), 'content');

		const result = traverse(tmpDir, [], undefined, (name) => name.startsWith('.'));
		const names = result.map((r) => r.name);
		expect(names).toContain('.hidden');
		expect(names).not.toContain('visible.ts');
	});
});

describe('traverseMultipleDirectory', () => {
	it('returns file paths (not directories) relative to each base dir', () => {
		makeFile('01_a.ts');
		makeFile('02_b.ts');
		makeFile('sub', 'c.ts');

		const result = traverseMultipleDirectory([tmpDir]);
		const basenames = result.map((p) => path.basename(p)).sort();
		expect(basenames).toEqual(['01_a.ts', '02_b.ts', 'c.ts']);
		// Directories should be excluded
		expect(basenames).not.toContain('sub');
	});

	it('concatates results from multiple directories in argument order', () => {
		const dirA = path.join(tmpDir, 'dirA');
		const dirB = path.join(tmpDir, 'dirB');
		makeFile('dirA', 'a.ts');
		makeFile('dirB', 'b.ts');

		const result = traverseMultipleDirectory([dirA, dirB]);
		expect(result.length).toBe(2);
		expect(path.basename(result[0])).toBe('a.ts');
		expect(path.basename(result[1])).toBe('b.ts');
	});
});
