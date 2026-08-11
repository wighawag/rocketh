import {describe, it, expect, vi} from 'vitest';

import {
	createExecutor,
	resolveConfig,
	getChainIdForEnvironment,
	resolveExecutionParams,
	setupDeployScripts,
} from '../src/executor/index.js';
import {withEnvironment} from '@rocketh/core/environment';
import {privateKey} from '@rocketh/signer';
import type {DeploymentStore, PromptExecutor, UserConfig} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

/**
 * `executeDeployScriptModules` is the part of the executor that decides WHICH scripts
 * run, in WHICH ORDER, and what happens when one fails or completes. Before this file
 * the only two calls to it passed an empty module array, so everything downstream of
 * module selection — tag filtering, dependency resolution, the run loop, migrations —
 * had zero coverage.
 *
 * Like `prompt-capability.test.ts` these build a REAL environment against a local mock
 * provider and deliberately do NOT use `@rocketh/test-utils` (rocketh must not depend
 * on it). Modules are plain `{id, module}` objects, so no filesystem is needed.
 */

const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const GENESIS_HASH = '0x0000000000000000000000000000000000000000000000000000000000000042';

function createMockProvider(): EIP1193ProviderWithoutEvents {
	return {
		request: (async (args: {method: string; params?: unknown}) => {
			switch (args.method) {
				case 'eth_chainId':
					return '0x7a69';
				case 'eth_accounts':
					return [];
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
					throw new Error(`mock provider: unsupported method ${args.method}`);
			}
		}) as EIP1193ProviderWithoutEvents['request'],
	} as EIP1193ProviderWithoutEvents;
}

function createInMemoryStore(): DeploymentStore & {files: Record<string, string>} {
	const files: Record<string, string> = {};
	return {
		files,
		listFiles: vi.fn(async () => Object.keys(files)),
		deleteAll: vi.fn(async () => {
			for (const key of Object.keys(files)) delete files[key];
		}),
		hasFile: vi.fn(async (_folder, _env, name) => files[name] !== undefined),
		writeFile: vi.fn(async (_folder, _env, name, content) => {
			files[name] = content;
		}),
		writeFileWithChainInfo: vi.fn(async (_info, _folder, _env, name, content) => {
			files[name] = content;
		}),
		readFile: vi.fn(async (_folder, _env, name) => files[name] ?? ''),
		deleteFile: vi.fn(async (_folder, _env, name) => {
			delete files[name];
		}),
	};
}

function createConfirmOnlyPromptExecutor(): PromptExecutor {
	return {
		async prompt() {
			return {proceed: true};
		},
		exit() {},
	};
}

const userConfig: UserConfig = {
	accounts: {deployer: PRIVATE_KEY},
	signerProtocols: {privateKey},
	defaultPollingInterval: 0.001,
};

/** A module factory that records its execution in `log`. */
function module(
	id: string,
	log: string[],
	options: {
		tags?: string[];
		dependencies?: string[];
		runAtTheEnd?: boolean;
		idField?: string;
		body?: () => Promise<void | boolean>;
	} = {},
) {
	const fn = (async () => {
		log.push(id);
		return options.body?.() ?? undefined;
	}) as any;
	fn.tags = options.tags;
	fn.dependencies = options.dependencies;
	fn.runAtTheEnd = options.runAtTheEnd;
	fn.id = options.idField ?? id;
	return {id, module: fn};
}

async function runModules(
	modules: ReturnType<typeof module>[],
	executionParamsOverrides: Record<string, unknown> = {},
	store?: ReturnType<typeof createInMemoryStore>,
	args?: unknown,
) {
	const provider = createMockProvider();
	const config = resolveConfig(userConfig);
	const executionParams = {
		provider,
		environment: 'memory',
		saveDeployments: false,
		promptExecutor: createConfirmOnlyPromptExecutor(),
		...executionParamsOverrides,
	};
	const chainId = await getChainIdForEnvironment(config, 'memory', executionParams);
	const resolvedExecutionParams = resolveExecutionParams(config, executionParams, chainId);
	const theStore = store ?? createInMemoryStore();
	const env = await createExecutor(theStore, createConfirmOnlyPromptExecutor()).executeDeployScriptModules(
		modules,
		config,
		resolvedExecutionParams,
		args,
	);
	return {env, store: theStore};
}

describe('executeDeployScriptModules - tag filtering', () => {
	it('runs every module in array order when no tags are requested', async () => {
		const log: string[] = [];
		await runModules([module('a', log), module('b', log), module('c', log)]);

		expect(log).toEqual(['a', 'b', 'c']);
	});

	it('runs only modules carrying a requested tag', async () => {
		const log: string[] = [];
		await runModules(
			[module('a', log, {tags: ['x']}), module('b', log, {tags: ['y']}), module('c', log, {tags: ['x']})],
			{tags: ['x']},
		);

		expect(log).toEqual(['a', 'c']);
	});

	it('skips an untagged module when tags are requested', async () => {
		const log: string[] = [];
		await runModules([module('a', log, {tags: ['x']}), module('b', log)], {tags: ['x']});

		expect(log).toEqual(['a']);
	});

	it('normalises a tag given as a string into a single-element array', async () => {
		const log: string[] = [];
		await runModules([module('a', log, {tags: 'x' as any}), module('b', log, {tags: 'y' as any})], {tags: ['x']});

		expect(log).toEqual(['a']);
	});

	it('throws when a tag contains a comma', async () => {
		const log: string[] = [];
		await expect(runModules([module('a', log, {tags: ['x,y']})], {tags: ['x,y']})).rejects.toThrow(
			'Tag cannot contains commas',
		);
	});
});

describe('executeDeployScriptModules - dependency resolution', () => {
	it('runs a dependency tag before the dependent module', async () => {
		const log: string[] = [];
		await runModules(
			[module('dep', log, {tags: ['foundation']}), module('main', log, {tags: ['app'], dependencies: ['foundation']})],
			{tags: ['app']},
		);

		// 'dep' is pulled in by the 'foundation' dependency and runs first
		expect(log).toEqual(['dep', 'main']);
	});

	it('runs a shared dependency only once even if two modules depend on it', async () => {
		const log: string[] = [];
		await runModules(
			[
				module('shared', log, {tags: ['base']}),
				module('a', log, {tags: ['x'], dependencies: ['base']}),
				module('b', log, {tags: ['x'], dependencies: ['base']}),
			],
			{tags: ['x']},
		);

		expect(log).toEqual(['shared', 'a', 'b']);
	});

	it('silently ignores a dependency naming an unknown tag', async () => {
		const log: string[] = [];
		await runModules([module('main', log, {tags: ['app'], dependencies: ['nonexistent']})], {tags: ['app']});

		expect(log).toEqual(['main']);
	});

	it('runs runAtTheEnd modules after all normal modules', async () => {
		const log: string[] = [];
		await runModules([
			module('first', log, {tags: ['a']}),
			module('last', log, {runAtTheEnd: true, tags: ['a']}),
			module('middle', log, {tags: ['a']}),
		]);

		expect(log).toEqual(['first', 'middle', 'last']);
	});
});

describe('executeDeployScriptModules - run loop', () => {
	it('forwards args to each module', async () => {
		const received: unknown[] = [];
		const fn = (async (_env: unknown, args?: unknown) => {
			received.push(args);
		}) as any;
		fn.id = 'a';
		await runModules([{id: 'a', module: fn}], {}, undefined, 'hello-args');

		expect(received).toEqual(['hello-args']);
	});

	it('records a migration when a module returns true and has an id', async () => {
		const log: string[] = [];
		const store = createInMemoryStore();
		const fn = (async () => {
			log.push('ran');
			return true;
		}) as any;
		fn.id = 'script-a';
		const {env} = await runModules([{id: 'script-a', module: fn}], {}, store);

		expect(log).toEqual(['ran']);
		// With saveDeployments: false the migration is recorded in-memory, not persisted to the store.
		expect(env.hasMigrationBeenDone('script-a')).toBe(true);
	});

	it('skips a module whose migration is already recorded', async () => {
		const log: string[] = [];
		const store = createInMemoryStore();
		// loadDeployments requires a .chain file when any file is present in the store.
		store.files['.chain'] = JSON.stringify({chainId: '31337', genesisHash: GENESIS_HASH});
		store.files['.migrations.json'] = JSON.stringify({'script-a': 1});

		const fn = (async () => {
			log.push('ran');
			return true;
		}) as any;
		fn.id = 'script-a';
		await runModules([{id: 'script-a', module: fn}], {}, store);

		expect(log).toEqual([]);
	});

	it('throws when a module returns true without an id', async () => {
		const fn = (async () => true) as any;
		// no .id set on the module
		await expect(runModules([{id: 'no-id', module: fn}])).rejects.toThrow('does not provide an id');
	});

	it('does not record a migration when a module returns undefined', async () => {
		const store = createInMemoryStore();
		const fn = (async () => undefined) as any;
		fn.id = 'script-a';
		const {env} = await runModules([{id: 'script-a', module: fn}], {}, store);

		expect(env.hasMigrationBeenDone('script-a')).toBe(false);
	});

	it('propagates a throwing module and aborts remaining modules', async () => {
		const log: string[] = [];
		const boom = (async () => {
			log.push('boom');
			throw new Error('script failed');
		}) as any;
		boom.id = 'boom';
		const after = (async () => {
			log.push('after');
		}) as any;
		after.id = 'after';

		await expect(
			runModules([
				{id: 'boom', module: boom},
				{id: 'after', module: after},
			]),
		).rejects.toThrow('script failed');
		expect(log).toEqual(['boom']);
		expect(log).not.toContain('after');
	});
});

describe('setupDeployScripts', () => {
	it('copies tags, dependencies, id and runAtTheEnd onto the returned module', () => {
		const {deployScript} = setupDeployScripts({});
		const mod = deployScript(async () => {}, {tags: ['x'], dependencies: ['y'], id: 'my-id', runAtTheEnd: true});

		expect(mod.tags).toEqual(['x']);
		expect(mod.dependencies).toEqual(['y']);
		expect(mod.id).toBe('my-id');
		expect(mod.runAtTheEnd).toBe(true);
	});

	it('receives an enhanced environment carrying curried extensions', async () => {
		const {deployScript} = setupDeployScripts({
			double: () => (x: number) => x * 2,
		});

		let captured: number | undefined;
		const mod = deployScript(async (env: any) => {
			captured = env.double(21);
		}, {});

		const env = {network: {chain: {id: 1}}} as any;
		await mod(env);

		expect(captured).toBe(42);
	});

	it('forwards args to the callback', async () => {
		const {deployScript} = setupDeployScripts({});
		let received: unknown;
		const mod = deployScript(async (_env: any, args?: unknown) => {
			received = args;
		}, {});

		await mod({network: {chain: {id: 1}}} as any, 'payload');

		expect(received).toBe('payload');
	});

	it('preserves the env prototype on the enhanced environment', async () => {
		const {deployScript} = setupDeployScripts({});
		const proto = {originalMethod: () => 'original'};
		const env = Object.create(proto) as any;
		env.network = {chain: {id: 1}};

		let protoPreserved = false;
		const mod = deployScript(async (e: any) => {
			protoPreserved = Object.getPrototypeOf(e) === proto && typeof e.originalMethod === 'function';
		}, {});

		await mod(env);

		expect(protoPreserved).toBe(true);
	});
});
