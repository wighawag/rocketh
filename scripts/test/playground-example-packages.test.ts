import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
	addDevDependencies,
	importedPackagesOf,
	missingPackages,
	packagesImportedBy,
} from '../playground-example-packages.js';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * A playground example declares a dependency by importing it: an example never carries a
 * `package.json`, so before `pnpm test:docs:playground-examples` installs the starting project
 * for an example, it adds to that project's `package.json` every package the example's files
 * import that it does not list. These tests pin which imports count, and that an example
 * importing only the starting project's packages leaves its `package.json` as it is.
 */
describe('playground examples: the packages an example imports', () => {
	it('reads static, side-effect, type, re-export and dynamic imports, by package name', () => {
		const source = [
			"import * as diamondExtension from '@rocketh/diamond';",
			"import type {UserConfig} from 'rocketh/types';",
			"import 'side-effect';",
			"export {thing} from 'reexported/sub/path';",
			"const lazy = await import('dynamic');",
			'import {',
			'\tparseEther,',
			"} from 'viem';",
		].join('\n');
		expect(importedPackagesOf(source)).toEqual([
			'@rocketh/diamond',
			'dynamic',
			'reexported',
			'rocketh',
			'side-effect',
			'viem',
		]);
	});

	it("ignores the project's own files and node's built-in modules", () => {
		const source = [
			"import {deployScript, artifacts} from '../rocketh/deploy.js';",
			"import {readFileSync} from 'node:fs';",
			"import path from 'path';",
			"import abs from '/abs/file.js';",
		].join('\n');
		expect(importedPackagesOf(source)).toEqual([]);
	});

	describe('in an example folder', () => {
		let root: string;
		function write(path: string, content: string) {
			const target = join(root, path);
			mkdirSync(dirname(target), {recursive: true});
			writeFileSync(target, content);
		}
		beforeEach(() => {
			root = mkdtempSync(join(tmpdir(), 'playground-example-packages-'));
		});
		afterEach(() => {
			rmSync(root, {recursive: true, force: true});
		});

		it("collects the TypeScript and JavaScript files' imports, not the contracts'", () => {
			write('rocketh/config.ts', "import * as diamondExtension from '@rocketh/diamond';\n");
			write(
				'deploy/001_deploy.ts',
				"import {deployScript} from '../rocketh/deploy.js';\nimport {parseEther} from 'viem';\n",
			);
			write('contracts/A.sol', 'import "@openzeppelin/contracts/token/ERC20/ERC20.sol";\n');
			expect(packagesImportedBy(root)).toEqual(['@rocketh/diamond', 'viem']);
		});

		it('lists the imported packages the starting project lacks, whatever kind of dependency lists them', () => {
			write(
				'rocketh/config.ts',
				"import * as d from '@rocketh/diamond';\nimport * as p from '@rocketh/proxy';\nimport 'a';\nimport 'b';\n",
			);
			const packageJson = JSON.stringify({
				dependencies: {a: '^1.0.0'},
				devDependencies: {'@rocketh/proxy': '^0.21.6'},
				peerDependencies: {b: '*'},
			});
			expect(missingPackages(root, packageJson)).toEqual(['@rocketh/diamond']);
		});

		it('lists nothing for an example importing only the starting project packages', () => {
			write(
				'deploy/001_deploy.ts',
				"import {deployScript} from '../rocketh/deploy.js';\nimport {parseEther} from 'viem';\n",
			);
			expect(missingPackages(root, JSON.stringify({devDependencies: {viem: '^2.43.0'}}))).toEqual([]);
		});
	});

	it("adds the packages to devDependencies, keeping the file's layout and sorting the keys", () => {
		const before =
			'{\n  "name": "x",\n  "devDependencies": {\n    "viem": "^2.43.0",\n    "@rocketh/deploy": "^0.22.5"\n  },\n  "scripts": {}\n}\n';
		expect(addDevDependencies(before, {'@rocketh/diamond': '^0.20.1'})).toBe(
			'{\n  "name": "x",\n  "devDependencies": {\n    "@rocketh/deploy": "^0.22.5",\n    "@rocketh/diamond": "^0.20.1",\n    "viem": "^2.43.0"\n  },\n  "scripts": {}\n}\n',
		);
	});
});

describe("this repository's examples", () => {
	const template = readFileSync(join(repo, 'packages/hardhat-deploy/templates/basic/package.json'), 'utf-8');
	const examples = join(repo, 'examples/playground');

	it('the diamond example imports @rocketh/diamond, which the starting project lacks', () => {
		expect(missingPackages(join(examples, 'counter-diamond'), template)).toEqual(['@rocketh/diamond']);
	});

	it('the router example imports @rocketh/router, which the starting project lacks', () => {
		expect(missingPackages(join(examples, 'game-router'), template)).toEqual(['@rocketh/router']);
	});

	it('every other example imports only the starting project packages', () => {
		const others = readdirSync(examples, {withFileTypes: true})
			.filter((entry) => entry.isDirectory() && !['counter-diamond', 'game-router'].includes(entry.name))
			.map((entry) => entry.name);
		expect(others.length).toBeGreaterThan(0);
		for (const name of others) expect([name, missingPackages(join(examples, name), template)]).toEqual([name, []]);
	});
});
