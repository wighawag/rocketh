/**
 * Tests for environment functions: resolveAccount, resolveAccountOrUndefined,
 * save, recordMigration, and loadDeployments (reset path).
 *
 * These cover the user-facing account-resolution and deployment-management functions
 * that are exercised on every deploy. Like the other tests in this folder, these do
 * NOT use @rocketh/test-utils (nx cycle) and build a REAL environment locally.
 */

import {describe, it, expect, vi} from 'vitest';
import {createEnvironment} from '../src/environment/index.js';
import {resolveConfig, getChainIdForEnvironment, resolveExecutionParams} from '../src/executor/index.js';
import {privateKey} from '@rocketh/signer';
import type {DeploymentStore, PromptExecutor, UserConfig} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const NAMED_ADDR = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' as `0x${string}`;
const GENESIS_HASH = ('0x' + '0'.repeat(64)) as `0x${string}`;

function mockProvider(accounts: string[] = []): EIP1193ProviderWithoutEvents {
	return {
		request: (async (args: {method: string; params?: unknown}) => {
			switch (args.method) {
				case 'eth_chainId':
					return '0x7a69';
				case 'eth_accounts':
					return accounts;
				case 'eth_getBlockByNumber':
					return {number: '0x0', hash: GENESIS_HASH};
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

function createInMemoryStore(): DeploymentStore & {files: Record<string, string>} {
	const files: Record<string, string> = {};
	return {
		files,
		listFiles: vi.fn(async (_f: unknown, _e: unknown, filter?: (name: string) => boolean) =>
			Object.keys(files).filter((name) => (filter ? filter(name) : true)),
		),
		deleteAll: vi.fn(async () => {
			for (const key of Object.keys(files)) delete files[key];
		}),
		hasFile: vi.fn(async (_f, _e, name) => files[name] !== undefined),
		writeFile: vi.fn(async (_f, _e, name, content) => {
			files[name] = content;
		}),
		writeFileWithChainInfo: vi.fn(async (info, _f, _e, name, content) => {
			// Mirror the real store: the chain marker is written alongside, and
			//  `loadDeploymentsFromStore` refuses to load a folder without it.
			files['.chain'] = JSON.stringify(info);
			files[name] = content;
		}),
		readFile: vi.fn(async (_f, _e, name) => files[name] ?? ''),
		deleteFile: vi.fn(async (_f, _e, name) => {
			delete files[name];
		}),
	};
}

const promptExecutor: PromptExecutor = {
	async prompt() {
		return {proceed: true};
	},
	exit() {},
};

async function buildEnv(options: {
	accounts: UserConfig['accounts'];
	nodeAccounts?: string[];
	saveDeployments?: boolean;
	store?: DeploymentStore & {files: Record<string, string>};
}) {
	const provider = mockProvider(options.nodeAccounts);
	const config = resolveConfig({
		accounts: options.accounts,
		signerProtocols: {privateKey},
		defaultPollingInterval: 0.001,
	});
	const executionParams = {
		provider,
		environment: 'memory',
		saveDeployments: options.saveDeployments ?? false,
		promptExecutor,
	};
	const chainId = await getChainIdForEnvironment(config, 'memory', executionParams);
	const resolved = resolveExecutionParams(config, executionParams, chainId);
	const store = options.store ?? createInMemoryStore();
	const {external: env, internal} = await createEnvironment(config, resolved, store);
	return {env, internal, store};
}

describe('resolveAccount', () => {
	it('resolves a named account to its address', async () => {
		const {env} = await buildEnv({accounts: {deployer: NAMED_ADDR}, nodeAccounts: [NAMED_ADDR]});
		expect(env.resolveAccount('deployer')).toBe(NAMED_ADDR.toLowerCase());
	});

	it('resolves a raw address directly', async () => {
		const {env} = await buildEnv({accounts: {deployer: NAMED_ADDR}, nodeAccounts: [NAMED_ADDR]});
		expect(env.resolveAccount(NAMED_ADDR)).toBe(NAMED_ADDR.toLowerCase());
	});

	it('throws for an unknown named account', async () => {
		const {env} = await buildEnv({accounts: {deployer: NAMED_ADDR}, nodeAccounts: [NAMED_ADDR]});
		expect(() => env.resolveAccount('nonexistent')).toThrow(/no address for nonexistent/);
	});

	it('resolves a numeric-index account', async () => {
		const {env} = await buildEnv({accounts: {deployer: 0}, nodeAccounts: [NAMED_ADDR]});
		expect(env.resolveAccount('deployer')).toBe(NAMED_ADDR.toLowerCase());
	});

	it('resolves a private-key account', async () => {
		const {env} = await buildEnv({accounts: {deployer: PRIVATE_KEY}});
		// The resolved address should be the anvil key 1 address
		expect(env.resolveAccount('deployer')).toBe(NAMED_ADDR.toLowerCase());
	});
});

describe('resolveAccountOrUndefined', () => {
	it('returns the address for a known named account', async () => {
		const {env} = await buildEnv({accounts: {deployer: NAMED_ADDR}, nodeAccounts: [NAMED_ADDR]});
		expect(env.resolveAccountOrUndefined('deployer')).toBe(NAMED_ADDR.toLowerCase());
	});

	it('returns undefined for an unknown named account (does NOT throw)', async () => {
		const {env} = await buildEnv({accounts: {deployer: NAMED_ADDR}, nodeAccounts: [NAMED_ADDR]});
		expect(env.resolveAccountOrUndefined('nonexistent')).toBeUndefined();
	});

	it('returns undefined when no named accounts are set up', async () => {
		const {env} = await buildEnv({accounts: {}});
		expect(env.resolveAccountOrUndefined('any')).toBeUndefined();
	});
});

describe('save and get', () => {
	it('saves a deployment and retrieves it by name', async () => {
		const {env} = await buildEnv({accounts: {deployer: NAMED_ADDR}, nodeAccounts: [NAMED_ADDR]});
		const address = ('0x' + 'f'.repeat(40)) as `0x${string}`;
		await env.save('Token', {
			abi: [] as any,
			address,
			argsData: '0x',
			bytecode: '0x',
			deployedBytecode: '0x',
			linkReferences: {},
		} as any);
		expect(env.get('Token').address).toBe(address);
		expect(env.getOrNull('Token')?.address).toBe(address);
	});

	it('getOrNull returns null for a missing deployment', async () => {
		const {env} = await buildEnv({accounts: {deployer: NAMED_ADDR}, nodeAccounts: [NAMED_ADDR]});
		expect(env.getOrNull('NonExistent')).toBeNull();
	});

	it('get throws for a missing deployment', async () => {
		const {env} = await buildEnv({accounts: {deployer: NAMED_ADDR}, nodeAccounts: [NAMED_ADDR]});
		expect(() => env.get('NonExistent')).toThrow();
	});
});

/**
 * `numDeployments` counts how many times the RECORD changed, whether rocketh made the
 * change or merely observed it. `@rocketh/proxy`, `/diamond` and `/router` all rely on
 * that: each re-records when the chain (or the declared interface) has moved on
 * without them, and each such refresh is a real change worth counting.
 *
 * `considerItAsFreshDeployment` is the opt-out, and its name is load-bearing. It does
 * NOT mean "save without moving the counter": it ASSERTS the count is 1, which is a
 * different and stronger claim. Both callers want exactly that, and both reach it in
 * a state where 1 is already the answer:
 *
 *   - `@rocketh/deploy` recording a CREATE3 address that already holds the right code,
 *     where the deployment happened once and rocketh merely found it;
 *   - `@rocketh/diamond` on its fresh-diamond path, where it is passed only when the
 *     proxy was NOT newly deployed, i.e. the address already held the diamond.
 *
 * It was previously called `doNotCountAsNewDeployment`, which promised only "do not
 * increment" and silently delivered "reset to 1". Harmless for those two callers,
 * because neither can be holding a count above 1, but a trap for the third: the
 * record-refresh work above would have reached for it and quietly erased history.
 * Renamed so the name states the behaviour, and pinned here so it cannot drift back.
 */
describe('save and numDeployments', () => {
	const record = (address: `0x${string}`) =>
		({
			abi: [] as any,
			address,
			argsData: '0x',
			bytecode: '0x',
			deployedBytecode: '0x',
			linkReferences: {},
		}) as any;

	it('counts every save, so an observed change is counted like a performed one', async () => {
		const {env} = await buildEnv({accounts: {deployer: NAMED_ADDR}, nodeAccounts: [NAMED_ADDR]});
		const address = ('0x' + 'f'.repeat(40)) as `0x${string}`;

		await env.save('Token', record(address));
		expect(env.get('Token').numDeployments).toBe(1);

		await env.save('Token', record(address));
		expect(env.get('Token').numDeployments).toBe(2);

		await env.save('Token', record(address));
		expect(env.get('Token').numDeployments).toBe(3);
	});

	it('considerItAsFreshDeployment asserts a count of one, it does not merely skip the increment', async () => {
		const {env} = await buildEnv({accounts: {deployer: NAMED_ADDR}, nodeAccounts: [NAMED_ADDR]});
		const address = ('0x' + 'f'.repeat(40)) as `0x${string}`;

		await env.save('Token', record(address));
		await env.save('Token', record(address));
		expect(env.get('Token').numDeployments).toBe(2);

		// Not 2 (skip the increment) and not 3 (take it): ONE. That is the whole point
		//  of the name, and the reason a record refresh must not use this flag.
		await env.save('Token', record(address), {considerItAsFreshDeployment: true});
		expect(env.get('Token').numDeployments).toBe(1);
	});

	/**
	 * ...and the counter has to SURVIVE to the file, or it is a per-run number
	 * pretending to be history.
	 *
	 * `save()` counted into the in-memory map and then wrote the UNCOUNTED argument,
	 * so the field reached disk only when a caller happened to spread an object that
	 * already carried one. Every consumer that reads it across runs, `checkUpgradeIndex`
	 * most of all, was working from a number that restarts.
	 *
	 * OMITTED WHEN IT IS 1, deliberately. One is the overwhelmingly common case and
	 * carries no information, so writing it would add a line to essentially every
	 * deployment file every user has committed, for nothing. Absent already means one
	 * on the way back in, because the increment reads `(old.numDeployments || 1) + 1`,
	 * so omitting it is not a special case anyone has to remember downstream.
	 */
	describe('persisting it', () => {
		const stored = (store: {files: Record<string, string>}, name: string) => JSON.parse(store.files[`${name}.json`]);

		it('omits the field entirely while it is still one', async () => {
			const {env, store} = await buildEnv({
				accounts: {deployer: NAMED_ADDR},
				nodeAccounts: [NAMED_ADDR],
				saveDeployments: true,
			});
			await env.save('Token', record(('0x' + 'f'.repeat(40)) as `0x${string}`));

			expect(env.get('Token').numDeployments).toBe(1);
			expect('numDeployments' in stored(store, 'Token')).toBe(false);
		});

		it('writes the field once there is something to say', async () => {
			const {env, store} = await buildEnv({
				accounts: {deployer: NAMED_ADDR},
				nodeAccounts: [NAMED_ADDR],
				saveDeployments: true,
			});
			const address = ('0x' + 'f'.repeat(40)) as `0x${string}`;
			await env.save('Token', record(address));
			await env.save('Token', record(address));

			expect(stored(store, 'Token').numDeployments).toBe(2);
		});

		it('survives a reload, so the count is history rather than a per-run number', async () => {
			const address = ('0x' + 'f'.repeat(40)) as `0x${string}`;
			const store = createInMemoryStore();

			const first = await buildEnv({
				accounts: {deployer: NAMED_ADDR},
				nodeAccounts: [NAMED_ADDR],
				saveDeployments: true,
				store,
			});
			await first.env.save('Token', record(address));
			await first.env.save('Token', record(address));
			await first.env.save('Token', record(address));
			expect(first.env.get('Token').numDeployments).toBe(3);

			// A new run over the same store picks up where the last one left off.
			const second = await buildEnv({
				accounts: {deployer: NAMED_ADDR},
				nodeAccounts: [NAMED_ADDR],
				saveDeployments: true,
				store,
			});
			await second.internal.loadDeployments();
			expect(second.env.get('Token').numDeployments).toBe(3);

			await second.env.save('Token', record(address));
			expect(second.env.get('Token').numDeployments).toBe(4);
			expect(stored(store, 'Token').numDeployments).toBe(4);
		});

		it('reads an omitted field back as one, so a first-run record counts to two', async () => {
			const address = ('0x' + 'f'.repeat(40)) as `0x${string}`;
			const store = createInMemoryStore();

			const first = await buildEnv({
				accounts: {deployer: NAMED_ADDR},
				nodeAccounts: [NAMED_ADDR],
				saveDeployments: true,
				store,
			});
			await first.env.save('Token', record(address));
			expect('numDeployments' in stored(store, 'Token')).toBe(false);

			const second = await buildEnv({
				accounts: {deployer: NAMED_ADDR},
				nodeAccounts: [NAMED_ADDR],
				saveDeployments: true,
				store,
			});
			await second.internal.loadDeployments();
			await second.env.save('Token', record(address));

			expect(second.env.get('Token').numDeployments).toBe(2);
			expect(stored(store, 'Token').numDeployments).toBe(2);
		});

		it('drops the field again when a fresh-deployment save resets the count', async () => {
			const address = ('0x' + 'f'.repeat(40)) as `0x${string}`;
			const {env, store} = await buildEnv({
				accounts: {deployer: NAMED_ADDR},
				nodeAccounts: [NAMED_ADDR],
				saveDeployments: true,
			});
			await env.save('Token', record(address));
			await env.save('Token', record(address));
			expect(stored(store, 'Token').numDeployments).toBe(2);

			await env.save('Token', record(address), {considerItAsFreshDeployment: true});
			expect('numDeployments' in stored(store, 'Token')).toBe(false);
		});
	});
});

describe('fromAddressToNamedABIOrNull', () => {
	it('returns the names and merged ABI for an address with one deployment', async () => {
		const {env} = await buildEnv({accounts: {deployer: NAMED_ADDR}, nodeAccounts: [NAMED_ADDR]});
		const address = ('0x' + 'f'.repeat(40)) as `0x${string}`;
		await env.save('Token', {
			abi: [{type: 'function', name: 'getValue', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'}],
			address,
			argsData: '0x',
			bytecode: '0x',
			deployedBytecode: '0x',
			linkReferences: {},
		} as any);

		const result = env.fromAddressToNamedABIOrNull(address);
		expect(result).not.toBeNull();
		expect(result!.names).toContain('Token');
	});

	it('returns null for an address with no deployment', async () => {
		const {env} = await buildEnv({accounts: {deployer: NAMED_ADDR}, nodeAccounts: [NAMED_ADDR]});
		expect(env.fromAddressToNamedABIOrNull(('0x' + '0'.repeat(40)) as `0x${string}`)).toBeNull();
	});
});
