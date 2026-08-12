/**
 * Tests for @rocketh/node - loadEnvironmentFromFiles and setupEnvironmentFromFiles entry points.
 *
 * These are the user-facing entry points that hardhat-deploy and the CLI use.
 * `loadEnvironmentFromFiles` reads config from cwd and loads an environment without
 * executing scripts. `setupEnvironmentFromFiles` returns the four loader functions
 * and applies extensions to the returned environment.
 */

import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {loadEnvironmentFromFiles, setupEnvironmentFromFiles} from '../src/executor/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

let tmpDir: string;
let originalCwd: string;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rocketh-loadenv-'));
	originalCwd = process.cwd();
});

afterEach(() => {
	process.chdir(originalCwd);
	fs.rmSync(tmpDir, {recursive: true, force: true});
});

function mockProvider(): EIP1193ProviderWithoutEvents {
	return {
		request: (async (args: {method: string; params?: unknown}) => {
			switch (args.method) {
				case 'eth_chainId':
					return '0x7a69';
				case 'eth_accounts':
					return ['0xf39Fd6e51AAD88F6F4ce6aB8827279cffFb92266'];
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

function writeConfig(dir: string, accounts: Record<string, unknown>) {
	fs.writeFileSync(
		path.join(dir, 'rocketh.js'),
		`export const config = { accounts: ${JSON.stringify(accounts)}, data: {}, deployments: ${JSON.stringify(path.join(dir, 'deployments'))} };`,
	);
	fs.mkdirSync(path.join(dir, 'deployments', 'memory'), {recursive: true});
	fs.writeFileSync(
		path.join(dir, 'deployments', 'memory', '.chain'),
		JSON.stringify({chainId: '31337', genesisHash: '0x' + '0'.repeat(64)}),
	);
}

describe('@rocketh/node - loadEnvironmentFromFiles', () => {
	it('loads an environment from a rocketh.js config in cwd', async () => {
		writeConfig(tmpDir, {deployer: '0xf39Fd6e51AAD88F6F4ce6aB8827279cffFb92266'});
		process.chdir(tmpDir);

		const env = await loadEnvironmentFromFiles({
			provider: mockProvider(),
			environment: 'memory',
			saveDeployments: false,
		});

		expect(env).toBeDefined();
		expect(env.network.chain.id).toBe(31337);
		expect(env.namedAccounts).toBeDefined();
		expect(env.namedAccounts!['deployer']).toBe('0xf39Fd6e51AAD88F6F4ce6aB8827279cffFb92266');
	});

	it('produces an environment without text-prompt capability in non-TTY CI', async () => {
		writeConfig(tmpDir, {deployer: '0xf39Fd6e51AAD88F6F4ce6aB8827279cffFb92266'});
		process.chdir(tmpDir);

		// process.stdin.isTTY is undefined in vitest — this is the CI shape
		const env = await loadEnvironmentFromFiles({
			provider: mockProvider(),
			environment: 'memory',
			saveDeployments: false,
		});

		expect(env.canPromptForText()).toBe(false);
	});

	it('lets a caller-supplied promptExecutor override the node default', async () => {
		writeConfig(tmpDir, {deployer: '0xf39Fd6e51AAD88F6F4ce6aB8827279cffFb92266'});
		process.chdir(tmpDir);

		const textPrompt = {
			prompt: vi.fn(async () => ({proceed: true})),
			promptText: vi.fn(async () => ({value: '0xabc'})),
			exit: vi.fn(),
		};

		const env = await loadEnvironmentFromFiles({
			provider: mockProvider(),
			environment: 'memory',
			saveDeployments: false,
			promptExecutor: textPrompt as any,
		});

		expect(env.canPromptForText()).toBe(true);
	});
});

describe('@rocketh/node - setupEnvironmentFromFiles extensions', () => {
	it('applies extensions to the loaded environment', async () => {
		writeConfig(tmpDir, {deployer: '0xf39Fd6e51AAD88F6F4ce6aB8827279cffFb92266'});
		process.chdir(tmpDir);

		const extensions = {
			customFn: () => (x: number) => x * 2,
		};

		const {loadEnvironmentFromFiles: load} = setupEnvironmentFromFiles(extensions);
		const env = await load({
			provider: mockProvider(),
			environment: 'memory',
			saveDeployments: false,
		});

		expect((env as any).customFn).toBeDefined();
		expect((env as any).customFn(21)).toBe(42);
	});

	it('returns all four entry points', () => {
		const result = setupEnvironmentFromFiles({});
		expect(result.loadAndExecuteDeploymentsFromFiles).toBeDefined();
		expect(result.loadEnvironmentFromFiles).toBeDefined();
		expect(result.loadEnvironmentFromFilesWithConfig).toBeDefined();
		expect(result.loadAndExecuteDeploymentsFromFilesWithConfig).toBeDefined();
	});
});
