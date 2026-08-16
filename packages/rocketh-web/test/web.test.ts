/**
 * Characterization tests for @rocketh/web - the browser runtime adapter.
 *
 * `@rocketh/web` re-exports `rocketh`'s pipeline bound to a default deployment store and a
 * text-less prompt (confirm auto-proceeds, `promptText` is absent, so `canPromptForText()`
 * is always false).
 *
 * The default store is now `createVFSDeploymentStore()`, which retains what a deploy script
 * saves for the lifetime of the page. `createEmptyDeploymentStore()` remains available as the
 * explicit opt-out (writes discarded, reads empty) and is still pinned below, because it is
 * exactly the behaviour a caller might now choose on purpose.
 */

import {describe, it, expect} from 'vitest';
import {createEmptyDeploymentStore} from '../src/deployment-store.js';
import {
	createVFSDeploymentStore,
	getDefaultDeploymentStore,
	loadDeploymentsFromIndexedDB,
	setupEnvironment,
} from '../src/index.js';
import {createMockProvider} from '@rocketh/test-utils';
import type {UserConfig} from '@rocketh/core/types';

describe('@rocketh/web - the default deployment store', () => {
	it('is a retaining store, not the discarding one it replaced', async () => {
		// Identity only. Writing into the default would mutate a module-level singleton that
		// outlives this file within a module registry, which is precisely the cross-contamination
		// its own doc comment warns about. The retaining BEHAVIOUR is asserted below against a
		// private store, which is what the same constructor produces.
		const store = getDefaultDeploymentStore();

		expect(store.vfs).toBeDefined();
		expect(await store.listFiles('deployments', 'never-written-to').catch(() => 'threw')).toBe('threw');
	});

	it('retains what is written to it, unlike the discarding store it replaced', async () => {
		const store = createVFSDeploymentStore();
		await store.writeFileWithChainInfo({chainId: '31337'}, 'deployments', 'default-store-test', 'Foo.json', '{}');

		expect(await store.hasFile('deployments', 'default-store-test', 'Foo.json')).toBe(true);
		expect(await store.readFile('deployments', 'default-store-test', 'Foo.json')).toBe('{}');
		expect(store.vfs.paths()).toContain('deployments/default-store-test/Foo.json');
	});
});

describe('@rocketh/web - createEmptyDeploymentStore (explicit opt-out, discards writes)', () => {
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
	it('reads the default store, not IndexedDB (hence deprecated)', async () => {
		// The name has always been wrong: it delegates to whatever store this module binds.
		// For real IndexedDB, build `createIndexedDBDeploymentStore()` and load through
		// `loadDeploymentsFromStore`.
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
