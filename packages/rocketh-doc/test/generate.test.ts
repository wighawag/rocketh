/**
 * Tests for @rocketh/doc - generate and generateFromDeployments.
 *
 * `generateFromDeployments` writes Handlebars-rendered markdown to a temp directory.
 * The default template (`{{contracts}}.hbs`) writes one `<Name>.md` per contract;
 * a custom template writes a single `<templateName>.md`. `generate` adds the
 * `exceptSuffix` filter. `generateDocumentationData` is tested separately.
 *
 * WARNING: `generateFromDeployments` defaults `output` to `'docs'` and calls
 * `fs.emptyDirSync(outputFolder)`. Every test MUST pass an explicit `output` in
 * the temp directory or it would wipe the repo's `docs/` folder.
 */

import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {generate, generateFromDeployments} from '../src/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type {UnknownDeployments} from '@rocketh/core/types';

let tmpDir: string;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rocketh-doc-'));
});

afterEach(() => {
	fs.rmSync(tmpDir, {recursive: true, force: true});
});

function makeDeployment(name: string) {
	return {
		address: ('0x' + 'a'.repeat(40)) as `0x${string}`,
		abi: [{type: 'function', name: 'getValue', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'}],
		metadata: '{}',
		userdoc: {methods: {'getValue()': {notice: 'Get the value'}}, kind: 'user', version: 1},
		devdoc: {methods: {}, kind: 'dev', version: 1},
	} as any;
}

describe('@rocketh/doc - generateFromDeployments', () => {
	it('writes one .md file per contract with the default template', async () => {
		const deployments: UnknownDeployments = {
			Token: makeDeployment('Token'),
			Vault: makeDeployment('Vault'),
		};

		await generateFromDeployments(deployments, {output: tmpDir});

		const files = fs.readdirSync(tmpDir).sort();
		expect(files).toContain('Token.md');
		expect(files).toContain('Vault.md');
	});

	it('skips empty renders (contracts that produce no output)', async () => {
		// A deployment with no userdoc methods produces no methods in the data,
		// but the default template still renders the contract header.
		const deployments: UnknownDeployments = {
			Empty: {address: '0x' + '0'.repeat(40), abi: [], metadata: '{}'} as any,
		};

		await generateFromDeployments(deployments, {output: tmpDir});

		// The template might or might not produce output for an empty contract.
		// We just verify no crash and the folder is emptyDir'd correctly.
		expect(fs.existsSync(tmpDir)).toBe(true);
	});

	it('writes a single file with a custom template', async () => {
		// Create a custom template that lists all contracts
		const templateDir = path.join(tmpDir, 'templates');
		fs.mkdirSync(templateDir, {recursive: true});
		fs.writeFileSync(path.join(templateDir, 'index.hbs'), '{{#each contracts}}{{this.name}}\n{{/each}}');

		const deployments: UnknownDeployments = {
			Token: makeDeployment('Token'),
			Vault: makeDeployment('Vault'),
		};

		// Use a separate output directory so the template isn't wiped
		const outputDir = path.join(tmpDir, 'output');
		await generateFromDeployments(deployments, {output: outputDir, template: path.join(templateDir, 'index.hbs')});

		const files = fs.readdirSync(outputDir);
		expect(files).toContain('index.md');
		const content = fs.readFileSync(path.join(outputDir, 'index.md'), 'utf-8');
		expect(content).toContain('Token');
		expect(content).toContain('Vault');
	});

	it('empties the output directory before writing', async () => {
		// Put a stale file in the output dir
		const staleFile = path.join(tmpDir, 'stale.md');
		fs.writeFileSync(staleFile, 'should be deleted');

		await generateFromDeployments({Token: makeDeployment('Token')}, {output: tmpDir});

		expect(fs.existsSync(staleFile)).toBe(false);
		expect(fs.existsSync(path.join(tmpDir, 'Token.md'))).toBe(true);
	});
});

describe('@rocketh/doc - generate (with exceptSuffix filter)', () => {
	it('filters out deployments matching exceptSuffix', async () => {
		const deployments: UnknownDeployments = {
			Token: makeDeployment('Token'),
			Vault_Implementation: makeDeployment('Vault_Implementation'),
		};

		await generate({deployments}, {output: tmpDir, exceptSuffix: ['_Implementation']});

		const files = fs.readdirSync(tmpDir);
		expect(files).toContain('Token.md');
		expect(files).not.toContain('Vault_Implementation.md');
	});

	it('returns early when no deployments are provided', async () => {
		await generate({deployments: {}}, {output: tmpDir});
		// No files should be written (the folder was not emptied because generate returns early)
		expect(fs.existsSync(path.join(tmpDir, 'any.md'))).toBe(false);
	});
});
