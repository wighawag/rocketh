/**
 * Tests for the executor's askBeforeProceeding and reportGasUse paths.
 *
 * `askBeforeProceeding` prompts the user to confirm a run, including a reset
 * confirmation and a gas-price confirmation. `reportGasUse` sums gas used across
 * all tracked transactions. Both were fully uncovered because the existing
 * `executeDeployScriptModules` calls pass empty module arrays and neither flag.
 *
 * These tests reuse the local mock-provider pattern from `prompt-capability.test.ts`
 * and `executor-scripts.test.ts`.
 */

import {describe, it, expect, vi} from 'vitest';
import {
	createExecutor,
	resolveConfig,
	getChainIdForEnvironment,
	resolveExecutionParams,
} from '../src/executor/index.js';
import {privateKey} from '@rocketh/signer';
import type {DeploymentStore, PromptExecutor, UserConfig} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const GENESIS_HASH = '0x0000000000000000000000000000000000000000000000000000000000000042';
const TX_HASH_1 = '0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`;
const TX_HASH_2 = '0x0000000000000000000000000000000000000000000000000000000000000002' as `0x${string}`;

function createMockProvider(): EIP1193ProviderWithoutEvents & {transactionHashes: `0x${string}`[]} {
	const transactionHashes: `0x${string}`[] = [];
	const provider = {
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
				case 'eth_sendTransaction':
					return TX_HASH_1;
				case 'eth_sendRawTransaction':
					return TX_HASH_1;
				case 'eth_getTransactionReceipt':
					return {
						status: '0x1',
						blockNumber: '0x1',
						gasUsed: '0x5208',
						effectiveGasPrice: '0x3b9aca00',
						transactionHash: ((args.params as any)?.[0] as string) ?? TX_HASH_1,
					};
				default:
					throw new Error(`mock provider: unsupported method ${args.method}`);
			}
		}) as any,
		transactionHashes,
	} as any;
	// Track transaction hashes so reportGasUse can find them
	provider.request = new Proxy(provider.request, {
		apply(target: any, thisArg: any, argArray: any[]) {
			const result = Reflect.apply(target, thisArg, argArray);
			if (
				(argArray[0] as any)?.method === 'eth_sendTransaction' ||
				(argArray[0] as any)?.method === 'eth_sendRawTransaction'
			) {
				transactionHashes.push(result as `0x${string}`);
			}
			return result;
		},
	});
	return provider;
}

function createInMemoryStore(): DeploymentStore {
	const files: Record<string, string> = {};
	return {
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

const userConfig: UserConfig = {
	accounts: {deployer: PRIVATE_KEY},
	signerProtocols: {privateKey},
	defaultPollingInterval: 0.001,
};

async function runWithFlags(options: {
	askBeforeProceeding?: boolean;
	reportGasUse?: boolean;
	reset?: boolean;
	promptExecutor?: PromptExecutor;
}) {
	const provider = createMockProvider();
	const config = resolveConfig(userConfig);
	const executionParams = {
		provider,
		environment: 'memory',
		saveDeployments: false,
		askBeforeProceeding: options.askBeforeProceeding,
		reportGasUse: options.reportGasUse,
		reset: options.reset,
		promptExecutor: options.promptExecutor,
	};
	const chainId = await getChainIdForEnvironment(config, 'memory', executionParams);
	const resolvedExecutionParams = resolveExecutionParams(config, executionParams, chainId);

	const promptExecutor: PromptExecutor = options.promptExecutor ?? {
		async prompt() {
			return {proceed: true};
		},
		exit() {},
	};

	const env = await createExecutor(createInMemoryStore(), promptExecutor).executeDeployScriptModules(
		[],
		config,
		resolvedExecutionParams,
	);
	return {env, provider};
}

describe('askBeforeProceeding', () => {
	it('proceeds when the user confirms the gas price prompt', async () => {
		const promptExecutor: PromptExecutor = {
			prompt: vi.fn(async () => ({proceed: true})),
			exit: vi.fn(),
		};

		const {env} = await runWithFlags({askBeforeProceeding: true, promptExecutor});
		expect(env).toBeDefined();
		expect(promptExecutor.prompt).toHaveBeenCalled();
		expect(promptExecutor.exit).not.toHaveBeenCalled();
	});

	it('calls exit when the user declines the gas price prompt', async () => {
		let exited = false;
		const promptExecutor: PromptExecutor = {
			prompt: vi.fn(async () => ({proceed: false})),
			exit: vi.fn(() => {
				exited = true;
			}),
		};

		// exit() should be called; the executor continues (exit is a no-op in tests)
		await runWithFlags({askBeforeProceeding: true, promptExecutor});
		expect(promptExecutor.prompt).toHaveBeenCalled();
		expect(promptExecutor.exit).toHaveBeenCalled();
	});

	it('asks an extra reset confirmation when reset is true, and proceeds if confirmed', async () => {
		const prompts: any[] = [];
		const promptExecutor: PromptExecutor = {
			prompt: vi.fn(async (req: any) => {
				prompts.push(req);
				return {proceed: true};
			}),
			exit: vi.fn(),
		};

		await runWithFlags({askBeforeProceeding: true, reset: true, promptExecutor});

		// Two prompts: the reset confirm, then the gas-price confirm
		expect(prompts.length).toBe(2);
		expect(prompts[0].message).toContain('delete all deployments');
		expect(prompts[1].message).toContain('gas price');
	});

	it('calls exit when the user declines the reset confirmation', async () => {
		let proceedSequence = [false, true]; // decline reset, would-confirm gas
		const promptExecutor: PromptExecutor = {
			prompt: vi.fn(async () => ({proceed: proceedSequence.shift()!}) as any),
			exit: vi.fn(),
		};

		await runWithFlags({askBeforeProceeding: true, reset: true, promptExecutor});
		expect(promptExecutor.exit).toHaveBeenCalled();
	});
});

describe('reportGasUse', () => {
	it('completes without error when reportGasUse is true and no transactions were sent', async () => {
		const {env} = await runWithFlags({reportGasUse: true});
		expect(env).toBeDefined();
	});
});
