import {describe, it, expect, vi} from 'vitest';

import {
	createExecutor,
	resolveConfig,
	getChainIdForEnvironment,
	resolveExecutionParams,
	loadEnvironmentFromStore,
} from '../src/executor/index.js';
import {createEnvironment} from '../src/environment/index.js';
import {privateKey} from '@rocketh/signer';
import {UnknownSignerError} from '@rocketh/core';
import type {DeploymentStore, PromptExecutor, UserConfig} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

/**
 * Tests for the TEXT-PROMPT CAPABILITY the environment carries (ADR 0007).
 *
 * The capability rides `ExecutionParams.promptExecutor` (the same road
 * `autoImpersonate` travels), so it reaches the environment on every construction
 * path — including `loadEnvironmentFromStore`, which is how hardhat-deploy gets an
 * environment and which has no executor (and therefore no prompt) in scope.
 *
 * The check is per-CAPABILITY, never per-executor: `@rocketh/web` ships a
 * `PromptExecutor` whose confirm implementation returns `{proceed: true}` without
 * asking anyone, so the mere PRESENCE of a prompt object proves nothing. Absence of
 * the optional `promptText` method IS the signal.
 *
 * Like the other tests in this folder these build a REAL environment
 * (`resolveConfig` → `getChainIdForEnvironment` → `resolveExecutionParams` →
 * `createEnvironment`) against a small local mock provider, and deliberately do NOT
 * use `@rocketh/test-utils`: `rocketh` must not depend on it or the nx project graph
 * closes a cycle.
 */

const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
/** Stands in for the Safe/multisig owner: a named account the node does not hold. */
const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111';
const TARGET_CONTRACT = '0x0000000000000000000000000000000000000001';
const TX_HASH = '0x0000000000000000000000000000000000000000000000000000000000000011' as `0x${string}`;
const GENESIS_HASH = '0x0000000000000000000000000000000000000000000000000000000000000042';

function createMockProvider(options?: {accounts?: string[]}): EIP1193ProviderWithoutEvents {
	return {
		request: (async (args: {method: string; params?: unknown}) => {
			switch (args.method) {
				case 'eth_chainId':
					return '0x7a69'; // 31337
				case 'eth_accounts':
					return options?.accounts ?? [];
				case 'eth_getBlockByNumber':
					return {number: '0x0', hash: GENESIS_HASH};
				case 'hardhat_impersonateAccount':
					return null;
				case 'eth_sendTransaction':
				case 'eth_sendRawTransaction':
					return TX_HASH;
				// the executor asks for a gas-price estimate before it runs any script
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

function createInMemoryStore(): DeploymentStore {
	const files: Record<string, string> = {};
	return {
		listFiles: vi.fn(async () => []),
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
		readFile: vi.fn(async (_folder, _env, name) => files[name]),
		deleteFile: vi.fn(async (_folder, _env, name) => {
			delete files[name];
		}),
	};
}

/** What `@rocketh/web` ships: a prompt object with NO text ability (and a confirm that never asks). */
function createConfirmOnlyPromptExecutor(): PromptExecutor {
	return {
		async prompt() {
			return {proceed: true};
		},
		exit() {},
	};
}

/** What `@rocketh/node` ships: a prompt object that CAN ask a human for free text. */
function createTextCapablePromptExecutor(
	answer = '0xdeadbeef',
): PromptExecutor & {promptText: ReturnType<typeof vi.fn>} {
	const promptText = vi.fn(async (_request: {type: 'text'; name: string; message: string}) => ({value: answer}));
	return {
		async prompt() {
			return {proceed: true};
		},
		promptText,
		exit() {},
	};
}

const userConfigWith = (accounts: UserConfig['accounts']): UserConfig => ({
	accounts,
	signerProtocols: {privateKey},
	defaultPollingInterval: 0.001,
});

async function buildEnvironment(options: {
	accounts: UserConfig['accounts'];
	nodeAccounts?: string[];
	promptExecutor?: PromptExecutor;
}) {
	const provider = createMockProvider({accounts: options.nodeAccounts});
	const config = resolveConfig(userConfigWith(options.accounts));
	const executionParams = {
		provider,
		environment: 'memory',
		saveDeployments: false,
		promptExecutor: options.promptExecutor,
	};
	const chainId = await getChainIdForEnvironment(config, 'memory', executionParams);
	const resolvedExecutionParams = resolveExecutionParams(config, executionParams, chainId);
	const {external: env} = await createEnvironment(config, resolvedExecutionParams, createInMemoryStore());
	return {env, resolvedExecutionParams};
}

describe('text-prompt capability on the environment', () => {
	/**
	 * A run with no prompt at all (a script driving the environment directly, CI)
	 * cannot ask anyone anything.
	 */
	it('reports no capability when the run carries no prompt', async () => {
		const {env} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}});
		expect(env.canPromptForText()).toBe(false);
	});

	/**
	 * The load-bearing case: a prompt object EXISTS but cannot ask for text. This is
	 * exactly the shape `@rocketh/web` ships (its confirm auto-proceeds without asking
	 * a human), which is why the check is per-CAPABILITY and not "is a prompt present?".
	 */
	it('reports no capability for a web-shaped, confirm-only prompt', async () => {
		const {env} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY},
			promptExecutor: createConfirmOnlyPromptExecutor(),
		});
		expect(env.canPromptForText()).toBe(false);
	});

	it('reports the capability when the run carries a text-capable prompt', async () => {
		const {env} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY},
			promptExecutor: createTextCapablePromptExecutor(),
		});
		expect(env.canPromptForText()).toBe(true);
	});
});

describe('text-prompt capability - construction paths', () => {
	/**
	 * `resolveExecutionParams` is the single funnel every construction path goes
	 * through (it is what makes `autoImpersonate` reach both production paths), so the
	 * prompt must survive it by IDENTITY.
	 */
	it('survives resolveExecutionParams by identity', async () => {
		const promptExecutor = createTextCapablePromptExecutor();
		const {resolvedExecutionParams} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY},
			promptExecutor,
		});
		expect(resolvedExecutionParams.promptExecutor).toBe(promptExecutor);
	});

	/**
	 * The path hardhat-deploy takes: `@rocketh/node`'s `loadEnvironmentFromFiles` →
	 * `loadEnvironmentFromStore`. There is no executor here, so before this capability
	 * rode the run parameters a hardhat user could never have been interactive.
	 */
	/**
	 * The path a `rocketh` CLI run takes. The executor is handed a `PromptExecutor` at
	 * construction, and passes it on as a DEFAULT: run parameters carrying one still win,
	 * which is what lets a test (or an embedder with its own UI) substitute a fake.
	 */
	it('reaches the environment through the executor, which supplies its own as a default', async () => {
		const executorPrompt = createTextCapablePromptExecutor();
		const config = resolveConfig(userConfigWith({deployer: PRIVATE_KEY}));
		const executionParams = {provider: createMockProvider(), environment: 'memory', saveDeployments: false};
		const chainId = await getChainIdForEnvironment(config, 'memory', executionParams);
		const resolvedExecutionParams = resolveExecutionParams(config, executionParams, chainId);

		const env = await createExecutor(createInMemoryStore(), executorPrompt).executeDeployScriptModules(
			[],
			config,
			resolvedExecutionParams,
		);

		expect(env.canPromptForText()).toBe(true);
	});

	it('lets run parameters override the prompt the executor was constructed with', async () => {
		// a capability-LESS prompt on the run parameters must not be silently upgraded by the
		// executor's own (this is the direction that would make a CI run interactive by accident)
		const config = resolveConfig(userConfigWith({deployer: PRIVATE_KEY}));
		const executionParams = {
			provider: createMockProvider(),
			environment: 'memory',
			saveDeployments: false,
			promptExecutor: createConfirmOnlyPromptExecutor(),
		};
		const chainId = await getChainIdForEnvironment(config, 'memory', executionParams);
		const resolvedExecutionParams = resolveExecutionParams(config, executionParams, chainId);

		const env = await createExecutor(
			createInMemoryStore(),
			createTextCapablePromptExecutor(),
		).executeDeployScriptModules([], config, resolvedExecutionParams);

		expect(env.canPromptForText()).toBe(false);
	});

	it('reaches the environment through loadEnvironmentFromStore', async () => {
		const env = await loadEnvironmentFromStore(
			userConfigWith({deployer: PRIVATE_KEY}),
			{
				provider: createMockProvider(),
				environment: 'memory',
				saveDeployments: false,
				promptExecutor: createTextCapablePromptExecutor(),
			},
			createInMemoryStore(),
		);
		expect(env.canPromptForText()).toBe(true);
	});
});

describe('text-prompt capability - nothing branches on it yet', () => {
	/**
	 * The capability is INERT in this slice: an unsignable `from` still throws
	 * `UnknownSignerError` under the default `'auto'` policy even when a text prompt is
	 * available, and the prompt is never consulted. The interactive resolver lands in a
	 * later task; until then a run must behave EXACTLY as it did before.
	 */
	it('still throws UnknownSignerError under `auto`, without asking the prompt', async () => {
		const promptExecutor = createTextCapablePromptExecutor();
		const {env} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY, admin: SAFE_ADDRESS},
			nodeAccounts: [],
			promptExecutor,
		});

		const from = env.resolveAccount('admin');
		const error = await env
			.broadcastExecution({
				type: 'object',
				data: {type: '0x2', from, to: TARGET_CONTRACT, data: '0xdeadbeef', chainId: '0x7a69'},
			})
			.then(
				() => undefined,
				(e) => e,
			);

		expect(error).toBeInstanceOf(UnknownSignerError);
		expect(promptExecutor.promptText).not.toHaveBeenCalled();
	});
});
