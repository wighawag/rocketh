/**
 * Tests for @rocketh/node - script discovery and execution from files.
 *
 * `_executeDeployScriptsFromFiles` discovers script files in directories, filters
 * out `_`-prefixed files, sorts lexicographically, dynamic-imports them, and passes
 * them to `executeDeployScriptModules`. These tests create real script files in a
 * temp directory and verify ordering, filtering, and execution.
 */

import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {loadAndExecuteDeploymentsFromFiles} from '../src/executor/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

let tmpDir: string;
let scriptDir: string;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rocketh-scripts-'));
	scriptDir = path.join(tmpDir, 'deploy');
	fs.mkdirSync(scriptDir, {recursive: true});
});

afterEach(() => {
	fs.rmSync(tmpDir, {recursive: true, force: true});
});

function writeScript(name: string, body: string) {
	fs.writeFileSync(path.join(scriptDir, name), body);
}

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

/** A script that records its execution in a shared log file. */
function loggingScript(tag: string) {
	return `export default async function(env, args) {
	const fs = await import('node:fs');
	const logFile = ${JSON.stringify(path.join(tmpDir, 'execution-log.txt'))};
	let log = '';
	try { log = fs.readFileSync(logFile, 'utf-8'); } catch {}
	log += ${JSON.stringify(tag)} + '\\n';
	fs.writeFileSync(logFile, log);
};`;
}

async function runScripts(extraConfig?: Record<string, unknown>) {
	await loadAndExecuteDeploymentsFromFiles({
		provider: mockProvider(),
		environment: 'memory',
		saveDeployments: false,
		config: {scripts: [scriptDir], ...extraConfig} as any,
	});
}

function readLog(): string[] {
	try {
		return fs.readFileSync(path.join(tmpDir, 'execution-log.txt'), 'utf-8').trim().split('\n').filter(Boolean);
	} catch {
		return [];
	}
}

describe('@rocketh/node - script discovery and execution', () => {
	it('runs scripts in lexicographic filename order', async () => {
		writeScript('02_second.js', loggingScript('second'));
		writeScript('01_first.js', loggingScript('first'));
		writeScript('03_third.js', loggingScript('third'));

		await runScripts();

		expect(readLog()).toEqual(['first', 'second', 'third']);
	});

	it('excludes files whose basename starts with _', async () => {
		writeScript('01_run.js', loggingScript('run'));
		writeScript('_helper.js', loggingScript('should-not-run'));

		await runScripts();

		expect(readLog()).toEqual(['run']);
	});

	it('runs a script with a default export that is a function', async () => {
		writeScript('single.js', loggingScript('single'));

		await runScripts();

		expect(readLog()).toEqual(['single']);
	});

	it('passes args to the scripts', async () => {
		writeScript(
			'with-args.js',
			`export default async function(env, args) {
				const fs = await import('node:fs');
				fs.writeFileSync(${JSON.stringify(path.join(tmpDir, 'args.txt'))}, JSON.stringify(args));
			};`,
		);

		await loadAndExecuteDeploymentsFromFiles(
			{
				provider: mockProvider(),
				environment: 'memory',
				saveDeployments: false,
				config: {scripts: [scriptDir]} as any,
			},
			'my-arg',
		);

		const argsContent = fs.readFileSync(path.join(tmpDir, 'args.txt'), 'utf-8');
		expect(argsContent).toBe('"my-arg"');
	});

	it('propagates an error from a failing script import', async () => {
		// A file that throws on import
		writeScript('boom.js', `throw new Error('import failed');`);

		await expect(
			loadAndExecuteDeploymentsFromFiles({
				provider: mockProvider(),
				environment: 'memory',
				saveDeployments: false,
				config: {scripts: [scriptDir]} as any,
			}),
		).rejects.toThrow('import failed');
	});

	it('handles a double-default export (CJS interop)', async () => {
		writeScript(
			'double-default.js',
			`const fn = async function(env, args) {
				const fs = await import('node:fs');
				fs.writeFileSync(${JSON.stringify(path.join(tmpDir, 'double-default.txt'))}, 'ran');
			};
			fn.default = fn;
			export default fn;`,
		);

		await runScripts();

		expect(fs.existsSync(path.join(tmpDir, 'double-default.txt'))).toBe(true);
	});
});
