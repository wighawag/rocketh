import {describe, it, expect, vi} from 'vitest';

import {resolveConfig, getChainIdForEnvironment, resolveExecutionParams} from '../src/executor/index.js';
import {createEnvironment, PASTED_TRANSACTION_LOOKUP_ROUNDS} from '../src/environment/index.js';
import {privateKey} from '@rocketh/signer';
import {UnknownSignerError} from '@rocketh/core';
import type {
	DeploymentStore,
	PromptExecutor,
	TextPromptAnswer,
	UnknownSignerPolicy,
	UserConfig,
} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

/**
 * Tests for the INTERACTIVE unknown-signer resolver at the broadcast choke point.
 *
 * The mechanic under test: when a transaction's `from` is unsignable and the run
 * can ask a human for text, the seam PAUSES, shows the transaction, takes back the
 * hash of the transaction the human executed out-of-band (on their Safe), and lets
 * the run CONTINUE through the very same pending-execution pipeline a normal
 * broadcast uses — `savePendingExecution` → `eth_getTransactionByHash` →
 * `waitForTransaction` → a real receipt — with NO send RPC ever attempted. That
 * absence is the whole point, so it is asserted explicitly.
 *
 * Like the other tests in this folder these build a REAL environment
 * (`resolveConfig` → `getChainIdForEnvironment` → `resolveExecutionParams` →
 * `createEnvironment`) against a small local mock provider, and deliberately do NOT
 * use `@rocketh/test-utils`: `rocketh` must not depend on it or the nx project graph
 * closes a cycle.
 */

const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
/** An address the node lists in `eth_accounts`. */
const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
/** Stands in for the Safe/multisig owner: a named account the node does not hold. */
const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111';
const TARGET_CONTRACT = '0x0000000000000000000000000000000000000001';

/** What the node would have returned had rocketh sent the transaction itself. */
const SENT_TX_HASH = '0x0000000000000000000000000000000000000000000000000000000000000011' as `0x${string}`;
/** What the human pastes back after executing on their Safe. */
const PASTED_HASH = '0x00000000000000000000000000000000000000000000000000000000000000aa' as `0x${string}`;
const SECOND_PASTED_HASH = '0x00000000000000000000000000000000000000000000000000000000000000bb' as `0x${string}`;
const GENESIS_HASH = '0x0000000000000000000000000000000000000000000000000000000000000042';

type Call = {method: string; params?: unknown};

function successReceipt(hash: string, overrides?: Record<string, unknown>) {
	return {
		transactionHash: hash,
		blockHash: '0x0000000000000000000000000000000000000000000000000000000000000001',
		blockNumber: '0x1',
		transactionIndex: '0x0',
		from: SAFE_ADDRESS,
		to: TARGET_CONTRACT,
		gasUsed: '0x5208',
		status: '0x1',
		logs: [],
		...overrides,
	};
}

function createMockProvider(options?: {
	accounts?: string[];
	/** Per-hash receipt overrides, e.g. a reverted status for the pasted hash. */
	receipts?: Record<string, Record<string, unknown>>;
	/** Hashes this node has never heard of: no transaction and no receipt, ever. */
	unknownHashes?: string[];
	/** Hashes the node knows but has not mined yet: no receipt for the first N asks. */
	pendingReceiptRounds?: Record<string, number>;
}): {provider: EIP1193ProviderWithoutEvents; calls: Call[]} {
	const calls: Call[] = [];
	const unknownHashes = new Set((options?.unknownHashes ?? []).map((h) => h.toLowerCase()));
	const pendingRoundsLeft: Record<string, number> = {...options?.pendingReceiptRounds};
	const provider = {
		request: (async (args: {method: string; params?: unknown}) => {
			calls.push({method: args.method, params: args.params});
			switch (args.method) {
				case 'eth_chainId':
					return '0x7a69'; // 31337
				case 'eth_accounts':
					return options?.accounts ?? [];
				case 'eth_getBlockByNumber':
					return {number: '0x0', hash: GENESIS_HASH};
				case 'hardhat_impersonateAccount':
					return null;
				case 'eth_signTransaction':
					return '0xf86b';
				case 'eth_sendRawTransaction':
				case 'eth_sendTransaction':
					return SENT_TX_HASH;
				case 'eth_getTransactionByHash': {
					const hash = (args.params as string[])[0];
					if (unknownHashes.has(hash.toLowerCase())) {
						return null;
					}
					return {hash, nonce: '0x3', from: SAFE_ADDRESS, gasPrice: '0x1', type: '0x0'};
				}
				case 'eth_getTransactionReceipt': {
					const hash = (args.params as string[])[0];
					if (unknownHashes.has(hash.toLowerCase())) {
						return null;
					}
					if (pendingRoundsLeft[hash] > 0) {
						pendingRoundsLeft[hash]--;
						return null;
					}
					return successReceipt(hash, options?.receipts?.[hash]);
				}
				case 'eth_blockNumber':
					return '0x1';
				default:
					throw new Error(`mock provider: unsupported method ${args.method}`);
			}
		}) as EIP1193ProviderWithoutEvents['request'],
	};
	return {provider: provider as EIP1193ProviderWithoutEvents, calls};
}

function createInMemoryStore(): {
	store: DeploymentStore;
	writes: {name: string; content: string}[];
	deletes: string[];
} {
	const files: Record<string, string> = {};
	const writes: {name: string; content: string}[] = [];
	const deletes: string[] = [];
	const store: DeploymentStore = {
		listFiles: vi.fn(async () => []),
		deleteAll: vi.fn(async () => {
			for (const key of Object.keys(files)) delete files[key];
		}),
		hasFile: vi.fn(async (_folder, _env, name) => files[name] !== undefined),
		writeFile: vi.fn(async (_folder, _env, name, content) => {
			files[name] = content;
			writes.push({name, content});
		}),
		writeFileWithChainInfo: vi.fn(async (_info, _folder, _env, name, content) => {
			files[name] = content;
			writes.push({name, content});
		}),
		readFile: vi.fn(async (_folder, _env, name) => files[name]),
		deleteFile: vi.fn(async (_folder, _env, name) => {
			delete files[name];
			deletes.push(name);
		}),
	};
	return {store, writes, deletes};
}

type ScriptedPrompt = PromptExecutor & {
	promptText: ReturnType<typeof vi.fn>;
	requests: {type: 'text'; name: string; message: string}[];
};

/**
 * A prompt driven by a SCRIPT of answers, so the interactive path is exercised with
 * no TTY. An entry that is an `Error` is THROWN by `promptText` (a runtime that
 * cannot really reach a human); running past the end of the script fails loudly
 * rather than looping forever.
 */
function createScriptedPrompt(answers: (TextPromptAnswer | Error)[]): ScriptedPrompt {
	const requests: {type: 'text'; name: string; message: string}[] = [];
	const promptText = vi.fn(async (request: {type: 'text'; name: string; message: string}) => {
		requests.push(request);
		const next = answers.shift();
		if (next === undefined) {
			throw new Error('scripted prompt: asked more times than the test scripted answers for');
		}
		if (next instanceof Error) {
			throw next;
		}
		return next;
	});
	return {
		async prompt() {
			return {proceed: true};
		},
		promptText,
		exit() {},
		requests,
	};
}

/** What `@rocketh/web` ships: a prompt object with NO text ability at all. */
function createConfirmOnlyPromptExecutor(): PromptExecutor {
	return {
		async prompt() {
			return {proceed: true};
		},
		exit() {},
	};
}

async function buildEnvironment(options: {
	accounts: UserConfig['accounts'];
	nodeAccounts?: string[];
	autoImpersonate?: boolean;
	onUnknownSigner?: UnknownSignerPolicy;
	promptExecutor?: PromptExecutor;
	saveDeployments?: boolean;
	receipts?: Record<string, Record<string, unknown>>;
	unknownHashes?: string[];
	pendingReceiptRounds?: Record<string, number>;
}) {
	const {provider, calls} = createMockProvider({
		accounts: options.nodeAccounts,
		receipts: options.receipts,
		unknownHashes: options.unknownHashes,
		pendingReceiptRounds: options.pendingReceiptRounds,
	});
	const {store, writes, deletes} = createInMemoryStore();
	const config = resolveConfig({
		accounts: options.accounts,
		signerProtocols: {privateKey},
		defaultPollingInterval: 0.001,
	});
	const executionParams = {
		provider,
		environment: 'memory',
		saveDeployments: options.saveDeployments ?? false,
		autoImpersonate: options.autoImpersonate ?? false,
		onUnknownSigner: options.onUnknownSigner,
		promptExecutor: options.promptExecutor,
	};
	const chainId = await getChainIdForEnvironment(config, 'memory', executionParams);
	const resolvedExecutionParams = resolveExecutionParams(config, executionParams, chainId);
	const {external: env} = await createEnvironment(config, resolvedExecutionParams, store);
	return {env, calls, writes, deletes};
}

/** The transaction a Safe owner would have to execute out-of-band. */
function safeTransaction(from: `0x${string}`) {
	return {
		type: 'object' as const,
		data: {
			type: '0x2' as const,
			from,
			to: TARGET_CONTRACT,
			data: '0xdeadbeef' as `0x${string}`,
			value: '0x1f4' as `0x${string}`,
			chainId: '0x7a69' as `0x${string}`,
		},
	};
}

const sendMethods = ['eth_sendTransaction', 'eth_sendRawTransaction'];

/**
 * The bound is expressed in LOOKUP rounds, and one round is one `eth_getTransactionByHash`,
 * so this is how many times a hash the node does not know can be asked about at most.
 */
const MAX_LOOKUPS_FOR_AN_UNKNOWN_HASH = PASTED_TRANSACTION_LOOKUP_ROUNDS;

describe('interactive resolver - capability decides whether `auto` and `ask` prompt', () => {
	/**
	 * `'auto'` is CAPABILITY-AWARE: with a text prompt available it resolves to the
	 * interactive path. This direction and the next one are the two halves of the same
	 * predicate and are asserted with OPPOSITE observable outcomes (a receipt and a
	 * consulted prompt, versus an error and an untouched prompt), so neither can pass
	 * by accident.
	 */
	it('`auto` resolves to `ask` when a text prompt is available', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'auto',
			promptExecutor,
		});

		const receipt = await env.broadcastExecution(safeTransaction(env.resolveAccount('admin')));

		expect(receipt.transactionHash).toBe(PASTED_HASH);
		expect(promptExecutor.promptText).toHaveBeenCalledTimes(1);
	});

	/** The CI half: no prompt at all, so `'auto'` degrades to `'throw'`. */
	it('`auto` resolves to `throw` when no text prompt is available', async () => {
		const {env} = await buildEnvironment({accounts: {admin: SAFE_ADDRESS}, onUnknownSigner: 'auto'});

		await expect(env.broadcastExecution(safeTransaction(env.resolveAccount('admin')))).rejects.toBeInstanceOf(
			UnknownSignerError,
		);
	});

	/**
	 * Capability is a CEILING, not a default: an EXPLICIT `'ask'` cannot conjure a
	 * prompt where the run has none. It degrades to `'throw'` — it never prompts and
	 * never hangs, so CI cannot block (story 5).
	 */
	it('`ask` degrades to `throw` with no text capability, and never hangs', async () => {
		const {env} = await buildEnvironment({accounts: {admin: SAFE_ADDRESS}, onUnknownSigner: 'ask'});

		await expect(env.broadcastExecution(safeTransaction(env.resolveAccount('admin')))).rejects.toBeInstanceOf(
			UnknownSignerError,
		);
	});

	/**
	 * The load-bearing capability case (ADR 0007): a prompt object EXISTS but cannot
	 * ask for text — exactly the shape `@rocketh/web` ships. `'ask'` still degrades.
	 */
	it('`ask` degrades to `throw` for a web-shaped, confirm-only prompt', async () => {
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor: createConfirmOnlyPromptExecutor(),
		});

		await expect(env.broadcastExecution(safeTransaction(env.resolveAccount('admin')))).rejects.toBeInstanceOf(
			UnknownSignerError,
		);
	});
});

describe('interactive resolver - a pasted hash resolves the execution', () => {
	/**
	 * Story 1. The run pauses, presents the transaction, takes the hash of the
	 * transaction the human executed on their Safe, and returns a REAL receipt for it
	 * — through the normal pending-execution pipeline, with no send attempted.
	 */
	it('presents the transaction, accepts a pasted hash and returns its receipt with NO send', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}]);
		const {env, calls} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
		});
		const shown: string[] = [];
		vi.spyOn(env, 'showMessage').mockImplementation((message: string) => {
			shown.push(message);
		});

		const from = env.resolveAccount('admin');
		const receipt = await env.broadcastExecution(safeTransaction(from));

		// the transaction was PRESENTED before the prompt: every field the human needs
		const presented = shown.join('\n');
		expect(presented).toContain(from);
		expect(presented).toContain(TARGET_CONTRACT);
		expect(presented).toContain('0xdeadbeef');
		expect(presented).toContain('0x1f4');

		// it went through the normal pipeline: tx lookup, then receipt
		expect(receipt.transactionHash).toBe(PASTED_HASH);
		expect(
			calls.some((c) => c.method === 'eth_getTransactionByHash' && (c.params as string[])[0] === PASTED_HASH),
		).toBe(true);
		expect(
			calls.some((c) => c.method === 'eth_getTransactionReceipt' && (c.params as string[])[0] === PASTED_HASH),
		).toBe(true);

		// THE POINT: nothing was ever sent
		expect(calls.map((c) => c.method).filter((m) => sendMethods.includes(m))).toEqual([]);
	});

	/** The pending-execution state file is written, then cleared once mined — the normal path. */
	it('saves state through the normal pending-execution path', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}]);
		const {env, writes, deletes} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
			saveDeployments: true,
		});

		await env.broadcastExecution(safeTransaction(env.resolveAccount('admin')));

		const pendingWrite = writes.find((w) => w.name === '.pending_transactions.json');
		expect(pendingWrite).toBeDefined();
		expect(pendingWrite?.content).toContain(PASTED_HASH);
		expect(JSON.parse(pendingWrite!.content)[0].type).toBe('execution');
		expect(deletes).toContain('.pending_transactions.json');
	});

	/**
	 * The transaction-hash tracker only records hashes it SEES on `eth_sendTransaction`
	 * / `eth_sendRawTransaction`, so an externally-executed transaction would be
	 * invisible to it and gas reporting (which iterates that list) would silently omit
	 * it. The resolver registers the pasted hash itself.
	 */
	it('registers the pasted hash with the transaction-hash tracker', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
		});

		expect(env.network.provider.transactionHashes).toEqual([]);
		await env.broadcastExecution(safeTransaction(env.resolveAccount('admin')));
		expect(env.network.provider.transactionHashes).toEqual([PASTED_HASH]);
	});

	/**
	 * Story 2, and the reason RESOLVING beats THROWING: because the resolver returns
	 * instead of unwinding, a governed action with TWO unsignable steps pauses at each
	 * and completes BOTH in one run. With the throw path this action would stop at
	 * step one and need a re-run.
	 */
	it('completes a two-step governed action in ONE run', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}, {value: SECOND_PASTED_HASH}]);
		const {env, writes} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
			saveDeployments: true,
		});
		const from = env.resolveAccount('admin');

		const steps: string[] = [];
		async function governedUpgrade() {
			const first = await env.broadcastExecution(safeTransaction(from));
			steps.push(first.transactionHash);
			const second = await env.broadcastExecution({
				type: 'object',
				data: {type: '0x2', from, to: TARGET_CONTRACT, data: '0xfeedface', chainId: '0x7a69'},
			});
			steps.push(second.transactionHash);
			return 'completed';
		}

		await expect(governedUpgrade()).resolves.toBe('completed');
		expect(steps).toEqual([PASTED_HASH, SECOND_PASTED_HASH]);
		expect(promptExecutor.promptText).toHaveBeenCalledTimes(2);
		// state saved for EACH step
		const pendingWrites = writes.filter((w) => w.name === '.pending_transactions.json');
		expect(pendingWrites.some((w) => w.content.includes(PASTED_HASH))).toBe(true);
		expect(pendingWrites.some((w) => w.content.includes(SECOND_PASTED_HASH))).toBe(true);
		expect(env.network.provider.transactionHashes).toEqual([PASTED_HASH, SECOND_PASTED_HASH]);
	});

	/** A hash pasted with the odd character upper-cased is still the same transaction. */
	it('accepts a mixed-case hash and normalises it', async () => {
		const mixedCase = ('0x' + 'Ab'.repeat(32)) as `0x${string}`;
		const promptExecutor = createScriptedPrompt([{value: `  ${mixedCase}  `}]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
		});

		const receipt = await env.broadcastExecution(safeTransaction(env.resolveAccount('admin')));

		expect(receipt.transactionHash).toBe(mixedCase.toLowerCase());
		expect(env.network.provider.transactionHashes).toEqual([mixedCase.toLowerCase()]);
	});
});

describe('interactive resolver - "cannot sign" degrades to the defer path', () => {
	/**
	 * Story 4. Answering "cannot sign" throws the SAME `UnknownSignerError` the
	 * non-interactive path throws, with its message undegraded: the unwrapped throw is
	 * the primary deferral workflow, so that message IS the deliverable.
	 */
	it('throws the full UnknownSignerError when the user answers "cannot sign"', async () => {
		const promptExecutor = createScriptedPrompt([{value: 'cannot sign'}]);
		const {env, calls} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
		});

		const from = env.resolveAccount('admin');
		const error = await env.broadcastExecution(safeTransaction(from)).then(
			() => undefined,
			(e) => e,
		);

		expect(error).toBeInstanceOf(UnknownSignerError);
		expect((error as UnknownSignerError).data).toMatchObject({
			from,
			to: TARGET_CONTRACT,
			data: '0xdeadbeef',
			value: '0x1f4',
		});
		// the message is the deliverable, not a summary
		const message = (error as UnknownSignerError).message;
		expect(message).toContain(from);
		expect(message).toContain(TARGET_CONTRACT);
		expect(message).toContain('0xdeadbeef');
		expect(calls.map((c) => c.method).filter((m) => sendMethods.includes(m))).toEqual([]);
		expect(env.network.provider.transactionHashes).toEqual([]);
	});

	/** Pressing enter on an empty line means the same thing: defer. */
	it('treats an empty answer as "cannot sign"', async () => {
		const promptExecutor = createScriptedPrompt([{value: '   '}]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
		});

		await expect(env.broadcastExecution(safeTransaction(env.resolveAccount('admin')))).rejects.toBeInstanceOf(
			UnknownSignerError,
		);
		expect(promptExecutor.promptText).toHaveBeenCalledTimes(1);
	});

	/** Aborting the prompt (Ctrl-C) defers rather than surfacing an opaque failure. */
	it('treats a cancelled prompt as "cannot sign"', async () => {
		const promptExecutor = createScriptedPrompt([{cancelled: true}]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
		});

		await expect(env.broadcastExecution(safeTransaction(env.resolveAccount('admin')))).rejects.toBeInstanceOf(
			UnknownSignerError,
		);
	});

	/**
	 * A prompt that cannot really reach a human (no TTY behind a `promptText` that
	 * throws) must not replace the transaction the user needs with a readline error:
	 * it degrades to the defer path.
	 */
	it('degrades to the defer path when the prompt itself fails', async () => {
		const promptExecutor = createScriptedPrompt([new Error('stdin is not a TTY')]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
		});

		const error = await env.broadcastExecution(safeTransaction(env.resolveAccount('admin'))).then(
			() => undefined,
			(e) => e,
		);
		expect(error).toBeInstanceOf(UnknownSignerError);
	});

	/** A malformed paste is re-asked (typos happen), and a good hash still resolves. */
	it('re-asks after a malformed answer', async () => {
		const promptExecutor = createScriptedPrompt([{value: '0xnot-a-hash'}, {value: PASTED_HASH}]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
		});

		const receipt = await env.broadcastExecution(safeTransaction(env.resolveAccount('admin')));

		expect(receipt.transactionHash).toBe(PASTED_HASH);
		expect(promptExecutor.promptText).toHaveBeenCalledTimes(2);
	});

	/** Re-asking is BOUNDED, so a mis-wired prompt cannot loop a run forever. */
	it('gives up after a bounded number of malformed answers and defers', async () => {
		const promptExecutor = createScriptedPrompt([
			{value: 'nope'},
			{value: '0x123'},
			{value: 'still not a hash'},
			{value: PASTED_HASH},
		]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
		});

		await expect(env.broadcastExecution(safeTransaction(env.resolveAccount('admin')))).rejects.toBeInstanceOf(
			UnknownSignerError,
		);
		expect(promptExecutor.promptText).toHaveBeenCalledTimes(3);
	});
});

describe('interactive resolver - receipt invariants', () => {
	/**
	 * The correctness backbone is the receipt's own status, not a bespoke verification
	 * layer. A pasted transaction that REVERTED fails loudly, naming both the
	 * transaction rocketh needed executed and the hash that was pasted, and saves
	 * NOTHING (the pending-execution file is never written).
	 */
	it('fails loudly on a non-success receipt and saves no state', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}]);
		const {env, writes} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
			saveDeployments: true,
			receipts: {[PASTED_HASH]: {status: '0x0'}},
		});

		const from = env.resolveAccount('admin');
		const error = await env.broadcastExecution(safeTransaction(from)).then(
			() => undefined,
			(e) => e,
		);

		expect(error).toBeInstanceOf(Error);
		expect((error as Error).message).toContain(PASTED_HASH);
		expect((error as Error).message).toContain(from);
		expect((error as Error).message).toContain('0xdeadbeef');
		expect(writes.filter((w) => w.name === '.pending_transactions.json')).toEqual([]);
		// a reverted transaction must not be reported as gas the run spent either
		expect(env.network.provider.transactionHashes).toEqual([]);
	});

	/** A receipt with no status at all cannot be proven successful, so it fails too. */
	it('fails when the receipt carries no status', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
			receipts: {[PASTED_HASH]: {status: undefined}},
		});

		await expect(env.broadcastExecution(safeTransaction(env.resolveAccount('admin')))).rejects.toThrow(PASTED_HASH);
	});

	/**
	 * A hash this node has NEVER heard of (pasted from the wrong chain, or a plausible
	 * typo that is still 64 hex characters) must not park the run behind a spinner for
	 * ever: the lookup is BOUNDED, and giving up names the hash as not found and hands
	 * back the transaction that still needs executing. The test finishing at all is half
	 * the assertion: an unbounded poll would hang it until the suite timeout.
	 */
	it('gives up on a hash this node has never seen, naming it as not found', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}]);
		const {env, calls, writes} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
			saveDeployments: true,
			unknownHashes: [PASTED_HASH],
		});

		const from = env.resolveAccount('admin');
		const error = await env.broadcastExecution(safeTransaction(from)).then(
			() => undefined,
			(e) => e,
		);

		expect(error).toBeInstanceOf(Error);
		expect((error as Error).message).toContain(PASTED_HASH);
		expect((error as Error).message).toContain('not found');
		// the transaction that still needs executing comes back with it
		expect((error as Error).message).toContain('0xdeadbeef');
		// bounded: it stopped asking rather than polling for ever
		expect(calls.filter((c) => c.method === 'eth_getTransactionByHash').length).toBeLessThanOrEqual(
			MAX_LOOKUPS_FOR_AN_UNKNOWN_HASH,
		);
		// and it never got as far as waiting for a receipt
		expect(calls.filter((c) => c.method === 'eth_getTransactionReceipt')).toEqual([]);
		// and nothing was recorded for a transaction that does not exist
		expect(writes.filter((w) => w.name === '.pending_transactions.json')).toEqual([]);
		expect(env.network.provider.transactionHashes).toEqual([]);
	});

	/**
	 * The bound is on "this node has never heard of it", NOT on mining: a transaction the
	 * node knows but has not mined yet is waited for exactly like one rocketh sent
	 * itself, so a slow Safe execution still resolves.
	 */
	it('keeps waiting for a known-but-unmined pasted transaction', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
			// more rounds than an unknown hash is ever given, so this can only pass by
			// distinguishing "unknown" from "not mined yet"
			pendingReceiptRounds: {[PASTED_HASH]: MAX_LOOKUPS_FOR_AN_UNKNOWN_HASH + 5},
		});

		const receipt = await env.broadcastExecution(safeTransaction(env.resolveAccount('admin')));

		expect(receipt.transactionHash).toBe(PASTED_HASH);
	});

	/**
	 * ONE transaction, ONE wait. The resolver has to fetch the receipt before anything is
	 * saved (that is what makes the status check able to save nothing), and the pipeline
	 * then waits for the same hash, so the receipt it already has is handed over instead
	 * of being polled for a second time, which is what the user sees as two waits for one
	 * transaction.
	 */
	it('does not wait for the same pasted transaction twice', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}]);
		const {env, calls} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
			saveDeployments: true,
		});

		const receipt = await env.broadcastExecution(safeTransaction(env.resolveAccount('admin')));

		expect(receipt.transactionHash).toBe(PASTED_HASH);
		expect(
			calls.filter((c) => c.method === 'eth_getTransactionReceipt' && (c.params as string[])[0] === PASTED_HASH),
		).toHaveLength(1);
	});

	/**
	 * The handed-over receipt is consumed, not left behind: a SECOND transaction that
	 * happens to be pasted with the same hash goes through its own lookup rather than
	 * silently reusing a stale receipt.
	 */
	it('does not reuse a handed-over receipt for a later transaction', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}, {value: PASTED_HASH}]);
		const {env, calls} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
		});
		const from = env.resolveAccount('admin');

		await env.broadcastExecution(safeTransaction(from));
		await env.broadcastExecution(safeTransaction(from));

		expect(
			calls.filter((c) => c.method === 'eth_getTransactionReceipt' && (c.params as string[])[0] === PASTED_HASH),
		).toHaveLength(2);
	});
});

describe('interactive resolver - signable accounts are untouched', () => {
	/**
	 * ANTI-REGRESSION (ADR 0006): the policy is consulted ONLY inside the `unsignable`
	 * branch. With `'ask'` in force AND a prompt available, a `local`, a `node` and an
	 * `impersonated` account must broadcast EXACTLY as before, without the prompt ever
	 * being consulted. If the policy were read before the signability check, every
	 * ordinary deploy would start asking a human for a hash.
	 */
	it('broadcasts a local (signerOnly) account unchanged, without prompting', async () => {
		const promptExecutor = createScriptedPrompt([]);
		const {env, calls} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY},
			onUnknownSigner: 'ask',
			promptExecutor,
		});

		const receipt = await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: env.resolveAccount('deployer'), to: TARGET_CONTRACT, chainId: '0x7a69'},
		});

		expect(receipt.transactionHash).toBe(SENT_TX_HASH);
		expect(calls.map((c) => c.method)).toContain('eth_sendRawTransaction');
		expect(promptExecutor.promptText).not.toHaveBeenCalled();
	});

	/**
	 * The one most easily lost (ADR 0006): `autoImpersonate` is a NODE CAPABILITY that
	 * runs BEFORE the seam, `onUnknownSigner` is the POLICY afterwards. An impersonated
	 * account is SIGNABLE, so it broadcasts — an ambient `'ask'` must not turn a fork
	 * test into an interactive session.
	 */
	it('broadcasts an impersonated account unchanged, without prompting', async () => {
		const promptExecutor = createScriptedPrompt([]);
		const {env, calls} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			autoImpersonate: true,
			onUnknownSigner: 'ask',
			promptExecutor,
		});
		expect(env.addressSignability[SAFE_ADDRESS.toLowerCase() as `0x${string}`]).toBe('impersonated');

		const receipt = await env.broadcastExecution(safeTransaction(env.resolveAccount('admin')));

		expect(receipt.transactionHash).toBe(SENT_TX_HASH);
		expect(calls.map((c) => c.method)).toContain('eth_sendTransaction');
		expect(promptExecutor.promptText).not.toHaveBeenCalled();
	});

	it('broadcasts a node account unchanged, without prompting', async () => {
		const promptExecutor = createScriptedPrompt([]);
		const {env, calls} = await buildEnvironment({
			accounts: {deployer: NODE_ACCOUNT},
			nodeAccounts: [NODE_ACCOUNT],
			onUnknownSigner: 'ask',
			promptExecutor,
		});

		const receipt = await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: env.resolveAccount('deployer'), to: TARGET_CONTRACT, chainId: '0x7a69'},
		});

		expect(receipt.transactionHash).toBe(SENT_TX_HASH);
		expect(calls.map((c) => c.method)).toContain('eth_sendTransaction');
		expect(promptExecutor.promptText).not.toHaveBeenCalled();
	});

	/**
	 * A pre-signed (`type: 'raw'`) transaction returns before any signer lookup, so it
	 * can never reach the resolver even though its `from` is unsignable — pinned
	 * because "raw tx" reads like the plain-transaction path but is not it (that path
	 * is `tx()`, which builds `type: 'object'`).
	 */
	it('never reaches the resolver for an already-signed raw transaction', async () => {
		const promptExecutor = createScriptedPrompt([]);
		const {env, calls} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
		});

		const receipt = await env.broadcastExecution({
			type: 'raw',
			from: env.resolveAccount('admin'),
			raw: '0xf86b',
		});

		expect(receipt.transactionHash).toBe(SENT_TX_HASH);
		expect(calls.map((c) => c.method)).toContain('eth_sendRawTransaction');
		expect(promptExecutor.promptText).not.toHaveBeenCalled();
	});

	/**
	 * The MIXED run under the interactive policy: the signable deployer broadcasts
	 * normally and only the unsignable Safe pauses for a hash — and the run carries on
	 * afterwards.
	 */
	it('mixes a normal broadcast and an interactive resolution in one run', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}]);
		const {env} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY, admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
		});

		const sent = await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: env.resolveAccount('deployer'), to: TARGET_CONTRACT, chainId: '0x7a69'},
		});
		expect(sent.transactionHash).toBe(SENT_TX_HASH);

		const resolved = await env.broadcastExecution(safeTransaction(env.resolveAccount('admin')));
		expect(resolved.transactionHash).toBe(PASTED_HASH);

		const after = await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: env.resolveAccount('deployer'), to: TARGET_CONTRACT, chainId: '0x7a69'},
		});
		expect(after.transactionHash).toBe(SENT_TX_HASH);
		expect(promptExecutor.promptText).toHaveBeenCalledTimes(1);
	});

	/**
	 * A `'throw'` frame (what `catchUnknownSigner` pushes) beats an ambient `'ask'`:
	 * the wrapped action gets the error, NOT a prompt. This is the assertion the core
	 * slice could not write, since both of its policy values behaved identically.
	 */
	it('lets a pushed `throw` frame beat an ambient `ask`, without prompting', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
		});

		env.pushUnknownSignerPolicy({policy: 'throw'});
		try {
			await expect(env.broadcastExecution(safeTransaction(env.resolveAccount('admin')))).rejects.toBeInstanceOf(
				UnknownSignerError,
			);
		} finally {
			env.popUnknownSignerPolicy();
		}
		expect(promptExecutor.promptText).not.toHaveBeenCalled();

		// and with the frame popped, the ambient `ask` is back in force
		const receipt = await env.broadcastExecution(safeTransaction(env.resolveAccount('admin')));
		expect(receipt.transactionHash).toBe(PASTED_HASH);
	});
});
