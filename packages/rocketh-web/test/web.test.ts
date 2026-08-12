/**
 * Characterization tests for @rocketh/web - the browser runtime adapter.
 *
 * `@rocketh/web` is a runtime adapter that re-exports `rocketh`'s pipeline bound to a
 * no-op store (every method body is commented out — writes are swallowed, reads return
 * empty) and a text-less prompt (confirm auto-proceeds, `promptText` is absent, so
 * `canPromptForText()` is always false).
 *
 * These tests document that behavior so a refactor that changes it is caught. They are
 * not asserting the behavior is CORRECT — they are pinning what IS, because the store
 * has no injection seam (module-level singleton).
 */

import {describe, it, expect} from 'vitest';
import {createEmptyDeploymentStore} from '../src/deployment-store.js';
import {loadDeploymentsFromIndexedDB, setupEnvironment} from '../src/index.js';
import {createMockProvider} from '@rocketh/test-utils';
import type {UserConfig} from '@rocketh/core/types';

describe('@rocketh/web - createEmptyDeploymentStore (no-op store)', () => {
	it('listFiles always returns an empty array', async () => {
		const store = createEmptyDeploymentStore();
		expect(await store.listFiles('any', 'env')).toEqual([]);
	});

	it('hasFile always returns false', async () => {
		const store = createEmptyDeploymentStore();
		expect(await store.hasFile('any', 'env', 'anything.json')).toBe(false);
	});

	it('readFile always returns an empty string', async () => {
		const store = createEmptyDeploymentStore();
		expect(await store.readFile('any', 'env', 'anything.json')).toBe('');
	});

	it('writeFile and writeFileWithChainInfo are no-ops (writes are swallowed)', async () => {
		const store = createEmptyDeploymentStore();
		await store.writeFile('any', 'env', 'file.json', 'content');
		await store.writeFileWithChainInfo({chainId: '1'}, 'any', 'env', 'file.json', 'content');
		// Nothing was written
		expect(await store.hasFile('any', 'env', 'file.json')).toBe(false);
		expect(await store.readFile('any', 'env', 'file.json')).toBe('');
	});

	it('deleteFile and deleteAll are no-ops', async () => {
		const store = createEmptyDeploymentStore();
		await expect(store.deleteFile('any', 'env', 'file.json')).resolves.not.toThrow();
		await expect(store.deleteAll('any', 'env')).resolves.not.toThrow();
	});
});

describe('@rocketh/web - loadDeploymentsFromIndexedDB', () => {
	it('always returns empty deployments despite the name', async () => {
		// Despite the name, this function never touches IndexedDB — it delegates to the
		// no-op store which always returns empty.
		const result = await loadDeploymentsFromIndexedDB('deployments', 'mainnet');
		expect(result.deployments).toEqual({});
		expect(result.migrations).toEqual({});
	});
});

describe('@rocketh/web - setupEnvironment', () => {
	it('produces a loadEnvironment function that returns an environment without text-prompt capability', async () => {
		const config: UserConfig = {
			accounts: {deployer: '0xf39Fd6e51AAD88F6F4ce6aB8827279cffFb92266'},
		};
		const {loadEnvironment} = setupEnvironment(config, {});

		const provider = createMockProvider({
			responses: {
				eth_chainId: () => '0x7a69',
				eth_accounts: () => ['0xf39Fd6e51AAD88F6F4ce6aB8827279cffFb92266'],
				eth_getBlockByNumber: () => ({number: '0x0', hash: '0x' + '0'.repeat(64)}),
				eth_feeHistory: () => ({
					oldestBlock: '0x1',
					baseFeePerGas: ['0x1', '0x1'],
					gasUsedRatio: [0.5],
					reward: [['0x1', '0x1', '0x1']],
				}),
			},
		});

		const env = await loadEnvironment({provider, environment: 'memory', saveDeployments: false});

		// The web prompt has no promptText method, so text capability is false
		expect(env.canPromptForText()).toBe(false);
	});
});
