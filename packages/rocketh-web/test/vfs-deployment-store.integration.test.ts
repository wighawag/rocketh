/**
 * Integration tests for `createVFSDeploymentStore` - the browser counterpart of
 * `@rocketh/node`'s `createFSDeploymentStore()`.
 *
 * These run the store through rocketh's REAL loader (`loadDeploymentsFromStore`) rather
 * than only asserting on the store's own methods, because the point of the store is that
 * rocketh can read back what it wrote. `createEmptyDeploymentStore()`, the discarding store
 * this replaced as the default, passes every method-level assertion you could write about it
 * and still loses all state.
 */

import {describe, it, expect} from 'vitest';
import {loadDeploymentsFromStore} from 'rocketh';
import {createMockProvider} from '@rocketh/test-utils';
import type {UserConfig} from '@rocketh/core/types';
import {createVFSDeploymentStore} from '../src/vfs-deployment-store.js';
import {createMemoryVFS} from '../src/vfs.js';
import {setupEnvironment} from '../src/index.js';

const DEPLOYMENTS = 'deployments';
const ENV = 'localhost';

function deploymentJSON(address: string) {
	return JSON.stringify({address, abi: [], bytecode: '0x', argsData: '0x'});
}

describe('@rocketh/web - createVFSDeploymentStore', () => {
	describe('fs-mirroring semantics', () => {
		it('listFiles throws for an environment that was never deployed to', async () => {
			const store = createVFSDeploymentStore();
			await expect(store.listFiles(DEPLOYMENTS, ENV)).rejects.toThrow(/no such directory/);
		});

		it('readFile throws for a missing file, mirroring readFileSync', async () => {
			const store = createVFSDeploymentStore();
			await expect(store.readFile(DEPLOYMENTS, ENV, 'Missing.json')).rejects.toThrow(/no such file/);
		});

		it('deleteAll is forgiving, mirroring rmSync({force: true})', async () => {
			const store = createVFSDeploymentStore();
			await expect(store.deleteAll(DEPLOYMENTS, ENV)).resolves.not.toThrow();
		});

		it('listFiles applies the filter it is given', async () => {
			const store = createVFSDeploymentStore();
			await store.writeFile(DEPLOYMENTS, ENV, 'Foo.json', deploymentJSON('0x1'));
			await store.writeFile(DEPLOYMENTS, ENV, '.chain', '{}');

			expect(await store.listFiles(DEPLOYMENTS, ENV)).toEqual(['.chain', 'Foo.json']);
			expect(await store.listFiles(DEPLOYMENTS, ENV, (name) => !name.startsWith('.'))).toEqual(['Foo.json']);
		});

		it('writeFileWithChainInfo records .chain once and does not overwrite it', async () => {
			const store = createVFSDeploymentStore();

			await store.writeFileWithChainInfo({chainId: '31337', genesisHash: '0xabc'}, DEPLOYMENTS, ENV, 'Foo.json', '{}');
			await store.writeFileWithChainInfo({chainId: '999', genesisHash: '0xdef'}, DEPLOYMENTS, ENV, 'Bar.json', '{}');

			expect(JSON.parse(await store.readFile(DEPLOYMENTS, ENV, '.chain'))).toEqual({
				chainId: '31337',
				genesisHash: '0xabc',
			});
		});
	});

	describe('round-tripping through rocketh', () => {
		it('deployments written to the store are read back by loadDeploymentsFromStore', async () => {
			const store = createVFSDeploymentStore();

			await store.writeFileWithChainInfo(
				{chainId: '31337', genesisHash: '0xabc'},
				DEPLOYMENTS,
				ENV,
				'GreetingsRegistry.json',
				deploymentJSON('0x0000000000000000000000000000000000000001'),
			);
			await store.writeFile(DEPLOYMENTS, ENV, '.migrations.json', JSON.stringify({'001_deploy': 1}));

			const loaded = await loadDeploymentsFromStore(store, DEPLOYMENTS, ENV);

			expect(Object.keys(loaded.deployments)).toEqual(['GreetingsRegistry']);
			expect(loaded.deployments.GreetingsRegistry.address).toBe('0x0000000000000000000000000000000000000001');
			expect(loaded.migrations).toEqual({'001_deploy': 1});
			expect(loaded.chainId).toBe('31337');
			expect(loaded.genesisHash).toBe('0xabc');
		});

		it('reports no deployments for an environment that was never written to', async () => {
			const store = createVFSDeploymentStore();

			const loaded = await loadDeploymentsFromStore(store, DEPLOYMENTS, ENV);

			expect(loaded.deployments).toEqual({});
			expect(loaded.migrations).toEqual({});
		});

		it('deleteAll clears an environment without touching its siblings', async () => {
			const store = createVFSDeploymentStore();
			const chain = {chainId: '31337'};
			await store.writeFileWithChainInfo(chain, DEPLOYMENTS, 'localhost', 'Foo.json', deploymentJSON('0x1'));
			await store.writeFileWithChainInfo(chain, DEPLOYMENTS, 'sepolia', 'Foo.json', deploymentJSON('0x2'));

			await store.deleteAll(DEPLOYMENTS, 'localhost');

			expect((await loadDeploymentsFromStore(store, DEPLOYMENTS, 'localhost')).deployments).toEqual({});
			expect(Object.keys((await loadDeploymentsFromStore(store, DEPLOYMENTS, 'sepolia')).deployments)).toEqual(['Foo']);
		});
	});

	describe('injected into setupEnvironment', () => {
		/**
		 * The seam that lets an environment own its storage. Without it `setupEnvironment` binds
		 * the SHARED module-level default, so this asserts the third argument is honoured: an
		 * environment loaded through the given store sees the deployments that store already
		 * holds, and no others.
		 */
		it('loadEnvironment reads deployments from the injected store', async () => {
			const GENESIS_HASH = ('0x' + '0'.repeat(64)) as `0x${string}`;
			const store = createVFSDeploymentStore();
			await store.writeFileWithChainInfo(
				{chainId: '31337', genesisHash: GENESIS_HASH},
				DEPLOYMENTS,
				'memory',
				'GreetingsRegistry.json',
				deploymentJSON('0x0000000000000000000000000000000000000001'),
			);

			const config: UserConfig = {accounts: {deployer: '0xf39Fd6e51AAD88F6F4ce6aB8827279cffFb92266'}};
			const {loadEnvironment} = setupEnvironment(config, {}, {deploymentStore: store});

			const provider = createMockProvider({
				responses: {
					eth_chainId: () => '0x7a69',
					eth_accounts: () => ['0xf39Fd6e51AAD88F6F4ce6aB8827279cffFb92266'],
					eth_getBlockByNumber: () => ({number: '0x0', hash: GENESIS_HASH}),
					eth_feeHistory: () => ({
						oldestBlock: '0x1',
						baseFeePerGas: ['0x1', '0x1'],
						gasUsedRatio: [0.5],
						reward: [['0x1', '0x1', '0x1']],
					}),
				},
			});

			const env = await loadEnvironment({provider, environment: 'memory'});

			expect(env.get('GreetingsRegistry').address).toBe('0x0000000000000000000000000000000000000001');
		});
	});

	describe('observability (what a docs playground renders)', () => {
		it('exposes the vfs so a UI can watch deployment files appear', async () => {
			const vfs = createMemoryVFS();
			const store = createVFSDeploymentStore(vfs);
			const seen: string[] = [];
			vfs.subscribe((change) => {
				if (change.type === 'write') {
					seen.push(change.path);
				}
			});

			await store.writeFileWithChainInfo({chainId: '31337'}, DEPLOYMENTS, ENV, 'GreetingsRegistry.json', '{}');

			expect(seen).toEqual(['deployments/localhost/.chain', 'deployments/localhost/GreetingsRegistry.json']);
			expect(store.vfs).toBe(vfs);
		});
	});
});
