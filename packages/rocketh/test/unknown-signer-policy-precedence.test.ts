import {describe, it, expect, vi} from 'vitest';

import {resolveConfig, getChainIdForEnvironment, resolveExecutionParams} from '../src/executor/index.js';
import {createEnvironment} from '../src/environment/index.js';
import {privateKey} from '@rocketh/signer';
import {UnknownSignerError} from '@rocketh/core';
import type {DeploymentStore, PromptExecutor, UnknownSignerPolicy, UserConfig} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

/**
 * PRECEDENCE of the unknown-signer policy at the broadcast seam: pushed frame >
 * run-level `onUnknownSigner` > chain config > the default `'auto'`.
 *
 * Every case here is DISCRIMINATING: the two policy values are chosen so they differ
 * in OBSERVABLE behaviour (a receipt for the hash the human pasted, with the prompt
 * consulted, versus an `UnknownSignerError` with the prompt untouched), so each test
 * fails if the precedence regresses. That is what the core slice could not do, since
 * both of its policy values resolved to `'throw'` and every such test was a tautology.
 *
 * The PER-CALL override is the frame, pushed here through the environment's own
 * `pushUnknownSignerPolicy` / `popUnknownSignerPolicy`. `@rocketh/unknown-signer`'s
 * `withUnknownSignerPolicy` is the user-facing wrapper over exactly this pair, and is
 * tested there — `rocketh` cannot import it (nor `@rocketh/test-utils`) without closing
 * a cycle in the nx project graph, so these build a REAL environment
 * (`resolveConfig` → `getChainIdForEnvironment` → `resolveExecutionParams` →
 * `createEnvironment`) against a small local mock provider, as the sibling files do.
 *
 * The reverse direction of the innermost case (a `'throw'` frame beating an ambient
 * `'ask'`, which is what `catchUnknownSigner` pushes) is pinned in
 * `interactive-unknown-signer.test.ts` and deliberately not duplicated here.
 */

const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
/** An address the node lists in `eth_accounts`. */
const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
/** Stands in for the Safe/multisig owner: a named account the node does not hold. */
const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111';
const TARGET_CONTRACT = '0x0000000000000000000000000000000000000001' as `0x${string}`;

/** What the node would have returned had rocketh sent the transaction itself. */
const SENT_TX_HASH = '0x0000000000000000000000000000000000000000000000000000000000000011' as `0x${string}`;
/** What the human pastes back after executing on their Safe. */
const PASTED_HASH = '0x00000000000000000000000000000000000000000000000000000000000000aa' as `0x${string}`;
const GENESIS_HASH = '0x0000000000000000000000000000000000000000000000000000000000000042';

type Call = {method: string; params?: unknown};

function createMockProvider(options?: {accounts?: string[]}): {
	provider: EIP1193ProviderWithoutEvents;
	calls: Call[];
} {
	const calls: Call[] = [];
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
					return {hash, nonce: '0x3', from: SAFE_ADDRESS, gasPrice: '0x1', type: '0x0'};
				}
				case 'eth_getTransactionReceipt': {
					const hash = (args.params as string[])[0];
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
					};
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

type ScriptedPrompt = PromptExecutor & {promptText: ReturnType<typeof vi.fn>};

/** A prompt that answers with a canned hash, so `'ask'` is observably different. */
function createScriptedPrompt(answers: string[]): ScriptedPrompt {
	const remaining = [...answers];
	const promptText = vi.fn(async () => {
		const next = remaining.shift();
		if (next === undefined) {
			throw new Error('scripted prompt: asked more times than the test scripted answers for');
		}
		return {value: next};
	});
	return {
		async prompt() {
			return {proceed: true};
		},
		promptText,
		exit() {},
	};
}

/** What `@rocketh/web` ships, and what a non-TTY run has: NO text ability at all. */
function createConfirmOnlyPrompt(): PromptExecutor {
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
	/** The RUN-level policy (an execution parameter). */
	onUnknownSigner?: UnknownSignerPolicy;
	/** The CHAIN-level policy (`chains[31337].onUnknownSigner` in the config). */
	chainOnUnknownSigner?: UnknownSignerPolicy;
	/** The TOP-LEVEL config default (`onUnknownSigner` beside `accounts`), lowest of the three. */
	configOnUnknownSigner?: UnknownSignerPolicy;
	promptExecutor?: PromptExecutor;
}) {
	const {provider, calls} = createMockProvider({accounts: options.nodeAccounts});
	const config = resolveConfig({
		accounts: options.accounts,
		signerProtocols: {privateKey},
		defaultPollingInterval: 0.001,
		chains: options.chainOnUnknownSigner ? {31337: {onUnknownSigner: options.chainOnUnknownSigner}} : undefined,
		onUnknownSigner: options.configOnUnknownSigner,
	});
	const executionParams = {
		provider,
		environment: 'memory',
		saveDeployments: false,
		autoImpersonate: options.autoImpersonate ?? false,
		onUnknownSigner: options.onUnknownSigner,
		promptExecutor: options.promptExecutor,
	};
	const chainId = await getChainIdForEnvironment(config, 'memory', executionParams);
	const resolvedExecutionParams = resolveExecutionParams(config, executionParams, chainId);
	const {external: env} = await createEnvironment(config, resolvedExecutionParams, createInMemoryStore());
	return {env, calls};
}

/**
 * Collect what the run SHOWED the user. The interactive path announces the pause
 * (`... is PAUSED`) before it asks anything, so this is how a test tells "never went
 * interactive" apart from "went interactive and failed", which both end in an
 * `UnknownSignerError`.
 */
function captureMessages(env: {showMessage: (message: string) => void}): string[] {
	const messages: string[] = [];
	vi.spyOn(env, 'showMessage').mockImplementation((message: string) => {
		messages.push(message);
	});
	return messages;
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

describe('unknown-signer policy precedence - a pushed frame beats the run-level policy', () => {
	/**
	 * The PER-CALL override, in the direction the core slice could never observe: a
	 * frame asking for the INTERACTIVE policy while the run says `'throw'`. The
	 * baseline half (the same call, unframed, throws and never reaches for the prompt)
	 * is what makes this fail if the frame stopped being consulted.
	 */
	it('lets an `ask` frame beat a run-level `throw`', async () => {
		const promptExecutor = createScriptedPrompt([PASTED_HASH]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'throw',
			promptExecutor,
		});
		const admin = env.resolveAccount('admin');

		await expect(env.broadcastExecution(safeTransaction(admin))).rejects.toBeInstanceOf(UnknownSignerError);
		expect(promptExecutor.promptText).not.toHaveBeenCalled();

		env.pushUnknownSignerPolicy({policy: 'ask'});
		try {
			const receipt = await env.broadcastExecution(safeTransaction(admin));
			expect(receipt.transactionHash).toBe(PASTED_HASH);
		} finally {
			env.popUnknownSignerPolicy();
		}
		expect(promptExecutor.promptText).toHaveBeenCalledTimes(1);

		// popped: the run-level policy decides again
		await expect(env.broadcastExecution(safeTransaction(admin))).rejects.toBeInstanceOf(UnknownSignerError);
		expect(promptExecutor.promptText).toHaveBeenCalledTimes(1);
	});

	/**
	 * CAPABILITY IS A CEILING, NOT A DEFAULT (ADR 0007). A frame may VARY the policy
	 * but can never grant an ability the run lacks: with a confirm-only prompt (what
	 * `@rocketh/web` ships, and what a non-TTY run has) an `'ask'` frame degrades to
	 * `'throw'`. This is what keeps CI un-hangable even when a script hardcodes the
	 * override, and it is why the check is per-CAPABILITY rather than "is a prompt
	 * object present" — one IS present here.
	 *
	 * The messages are asserted, not just the error: a run that ENTERED the interactive
	 * path with a missing `promptText` would fail inside it and still end in an
	 * `UnknownSignerError` (the resolver degrades a broken prompt to the defer path), so
	 * "it threw" alone cannot tell a ceiling from a crash. Having shown the human
	 * `PAUSED` is the difference, and it is the user-visible half.
	 */
	it('degrades an `ask` frame to throw when the run cannot ask for text', async () => {
		const promptExecutor = createConfirmOnlyPrompt();
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'throw',
			promptExecutor,
		});
		expect(env.canPromptForText()).toBe(false);
		const messages = captureMessages(env);

		env.pushUnknownSignerPolicy({policy: 'ask'});
		try {
			await expect(env.broadcastExecution(safeTransaction(env.resolveAccount('admin')))).rejects.toBeInstanceOf(
				UnknownSignerError,
			);
		} finally {
			env.popUnknownSignerPolicy();
		}

		// the run never even started pausing
		expect(messages.join('\n')).not.toContain('PAUSED');
	});

	/**
	 * A frame pushed for an action that THROWS must still be popped, or the rest of the
	 * run silently inherits a policy nobody asked for. Asserted behaviourally: after the
	 * throwing action, the ambient `'ask'` is back in force and the next call pauses.
	 * (An unbalanced pop is a documented no-op, so a stranded frame would not announce
	 * itself — only the changed behaviour would.)
	 */
	it('leaves no frame stranded when the framed action throws', async () => {
		const promptExecutor = createScriptedPrompt([PASTED_HASH]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
		});
		const admin = env.resolveAccount('admin');

		const runFramed = async (action: () => Promise<unknown>) => {
			env.pushUnknownSignerPolicy({policy: 'throw'});
			try {
				return await action();
			} finally {
				env.popUnknownSignerPolicy();
			}
		};

		await expect(runFramed(() => env.broadcastExecution(safeTransaction(admin)))).rejects.toBeInstanceOf(
			UnknownSignerError,
		);
		expect(promptExecutor.promptText).not.toHaveBeenCalled();

		const receipt = await env.broadcastExecution(safeTransaction(admin));
		expect(receipt.transactionHash).toBe(PASTED_HASH);
	});
});

describe('unknown-signer policy precedence - the run-level policy beats the chain config', () => {
	/** The run asks for the interactive policy; the chain said `'throw'`. The run wins. */
	it('lets a run-level `ask` beat a chain-level `throw`', async () => {
		const promptExecutor = createScriptedPrompt([PASTED_HASH]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			chainOnUnknownSigner: 'throw',
			promptExecutor,
		});

		const receipt = await env.broadcastExecution(safeTransaction(env.resolveAccount('admin')));

		expect(receipt.transactionHash).toBe(PASTED_HASH);
		expect(promptExecutor.promptText).toHaveBeenCalledTimes(1);
	});

	/** And the other way round, so neither direction can pass by coincidence. */
	it('lets a run-level `throw` beat a chain-level `ask`', async () => {
		const promptExecutor = createScriptedPrompt([PASTED_HASH]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'throw',
			chainOnUnknownSigner: 'ask',
			promptExecutor,
		});

		await expect(env.broadcastExecution(safeTransaction(env.resolveAccount('admin')))).rejects.toBeInstanceOf(
			UnknownSignerError,
		);
		expect(promptExecutor.promptText).not.toHaveBeenCalled();
	});

	/**
	 * With no run-level policy the CHAIN's applies. Chosen as `'throw'` WITH a working
	 * text prompt on purpose: the default `'auto'` would have resolved to `'ask'` and
	 * prompted here, so this fails if the chain config stopped being read.
	 */
	it('falls back to the chain config when the run sets no policy', async () => {
		const promptExecutor = createScriptedPrompt([PASTED_HASH]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			chainOnUnknownSigner: 'throw',
			promptExecutor,
		});

		await expect(env.broadcastExecution(safeTransaction(env.resolveAccount('admin')))).rejects.toBeInstanceOf(
			UnknownSignerError,
		);
		expect(promptExecutor.promptText).not.toHaveBeenCalled();
	});

	/** ... and with neither set, the capability-aware default does: a prompt means `'ask'`. */
	it('falls back to the capability-aware default when neither is set', async () => {
		const promptExecutor = createScriptedPrompt([PASTED_HASH]);
		const {env} = await buildEnvironment({accounts: {admin: SAFE_ADDRESS}, promptExecutor});

		const receipt = await env.broadcastExecution(safeTransaction(env.resolveAccount('admin')));

		expect(receipt.transactionHash).toBe(PASTED_HASH);
	});
});

describe('unknown-signer policy precedence - the policy is read only in the unsignable branch', () => {
	/**
	 * ANTI-REGRESSION (ADR 0006), re-pinned here because this file is about the
	 * precedence logic: whichever policy is in force, and whatever frame is pushed, a
	 * SIGNABLE account broadcasts exactly as before and nobody is prompted. Here with
	 * an `'ask'` frame in force, the direction the sibling tests do not cover (they push
	 * `'throw'`).
	 */
	it('broadcasts a local (signerOnly) account with an `ask` frame in force', async () => {
		const promptExecutor = createScriptedPrompt([PASTED_HASH]);
		const {env, calls} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY},
			onUnknownSigner: 'throw',
			promptExecutor,
		});

		env.pushUnknownSignerPolicy({policy: 'ask'});
		try {
			const receipt = await env.broadcastExecution({
				type: 'object',
				data: {type: '0x2', from: env.resolveAccount('deployer'), to: TARGET_CONTRACT, chainId: '0x7a69'},
			});
			expect(receipt.transactionHash).toBe(SENT_TX_HASH);
		} finally {
			env.popUnknownSignerPolicy();
		}

		expect(calls.map((c) => c.method)).toContain('eth_sendRawTransaction');
		expect(promptExecutor.promptText).not.toHaveBeenCalled();
	});

	/**
	 * The one most easily lost: `autoImpersonate` is a NODE CAPABILITY resolved BEFORE
	 * the seam, so an impersonated account is signable, full stop — an `'ask'` frame
	 * does not turn it into a prompt any more than a `'throw'` frame turns it into an
	 * error.
	 */
	it('broadcasts an impersonated account with an `ask` frame in force', async () => {
		const promptExecutor = createScriptedPrompt([PASTED_HASH]);
		const {env, calls} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			autoImpersonate: true,
			onUnknownSigner: 'throw',
			promptExecutor,
		});
		expect(env.addressSignability[SAFE_ADDRESS.toLowerCase() as `0x${string}`]).toBe('impersonated');

		env.pushUnknownSignerPolicy({policy: 'ask'});
		try {
			const receipt = await env.broadcastExecution(safeTransaction(env.resolveAccount('admin')));
			expect(receipt.transactionHash).toBe(SENT_TX_HASH);
		} finally {
			env.popUnknownSignerPolicy();
		}

		expect(calls.map((c) => c.method)).toContain('eth_sendTransaction');
		expect(promptExecutor.promptText).not.toHaveBeenCalled();
	});

	/**
	 * A node-held account, same story, and with the frame asking for the policy that
	 * WOULD have prompted had the account been unsignable.
	 */
	it('broadcasts a node account with an `ask` frame in force', async () => {
		const promptExecutor = createScriptedPrompt([PASTED_HASH]);
		const {env, calls} = await buildEnvironment({
			accounts: {deployer: NODE_ACCOUNT},
			nodeAccounts: [NODE_ACCOUNT],
			onUnknownSigner: 'throw',
			promptExecutor,
		});

		env.pushUnknownSignerPolicy({policy: 'ask'});
		try {
			const receipt = await env.broadcastExecution({
				type: 'object',
				data: {type: '0x2', from: env.resolveAccount('deployer'), to: TARGET_CONTRACT, chainId: '0x7a69'},
			});
			expect(receipt.transactionHash).toBe(SENT_TX_HASH);
		} finally {
			env.popUnknownSignerPolicy();
		}

		expect(calls.map((c) => c.method)).toContain('eth_sendTransaction');
		expect(promptExecutor.promptText).not.toHaveBeenCalled();
	});

	/**
	 * A pre-signed `raw` transaction returns before any signer lookup, so it never
	 * reaches the seam at all — no policy, no frame, no prompt, even though its `from`
	 * is unsignable.
	 */
	it('never consults the policy for an already-signed raw transaction', async () => {
		const promptExecutor = createScriptedPrompt([PASTED_HASH]);
		const {env, calls} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'throw',
			promptExecutor,
		});

		env.pushUnknownSignerPolicy({policy: 'ask'});
		try {
			const receipt = await env.broadcastExecution({
				type: 'raw',
				from: env.resolveAccount('admin'),
				raw: '0xf86b',
			});
			expect(receipt.transactionHash).toBe(SENT_TX_HASH);
		} finally {
			env.popUnknownSignerPolicy();
		}

		expect(calls.map((c) => c.method)).toContain('eth_sendRawTransaction');
		expect(promptExecutor.promptText).not.toHaveBeenCalled();
	});
});

describe('unknown-signer policy precedence - the chain config beats the top-level config default', () => {
	/**
	 * The TOP-LEVEL `onUnknownSigner` exists so "never prompt me anywhere" is ONE line
	 * rather than one per chain entry, which is what the per-chain-only shape forced.
	 * It is the LOWEST-priority declared source: run parameter > chain config >
	 * top-level config > the built-in `'auto'`.
	 *
	 * Asserted through observable behaviour rather than by reading the resolved value,
	 * and the messages are checked as well as the error: a run that ENTERED the
	 * interactive path and failed inside it also ends in an `UnknownSignerError`, so
	 * having shown the human `PAUSED` is what separates "never asked" from "asked and
	 * broke" (the same trap the capability-ceiling tests fell into).
	 */
	it('applies the top-level default when neither the run nor the chain sets one', async () => {
		const promptExecutor = createScriptedPrompt([PASTED_HASH]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			configOnUnknownSigner: 'throw',
			promptExecutor,
		});
		// the run CAN ask, so a bare default of `'auto'` would have gone interactive here
		expect(env.canPromptForText()).toBe(true);
		const messages = captureMessages(env);
		const admin = env.resolveAccount('admin');

		await expect(env.broadcastExecution(safeTransaction(admin))).rejects.toBeInstanceOf(UnknownSignerError);
		expect(promptExecutor.promptText).not.toHaveBeenCalled();
		expect(messages.join('\n')).not.toContain('PAUSED');
	});

	/** A chain entry is more specific, so it overrides the top-level default. */
	it('lets the chain config override the top-level default', async () => {
		const promptExecutor = createScriptedPrompt([PASTED_HASH]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			configOnUnknownSigner: 'throw',
			chainOnUnknownSigner: 'ask',
			promptExecutor,
		});
		const admin = env.resolveAccount('admin');

		const receipt = await env.broadcastExecution(safeTransaction(admin));
		expect(receipt.transactionHash).toBe(PASTED_HASH);
		expect(promptExecutor.promptText).toHaveBeenCalledTimes(1);
	});

	/** And the run parameter still beats both, which is what the CLI flag rides on. */
	it('lets the run-level policy override both the chain and the top-level default', async () => {
		const promptExecutor = createScriptedPrompt([PASTED_HASH]);
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			configOnUnknownSigner: 'ask',
			chainOnUnknownSigner: 'ask',
			onUnknownSigner: 'throw',
			promptExecutor,
		});
		const messages = captureMessages(env);
		const admin = env.resolveAccount('admin');

		await expect(env.broadcastExecution(safeTransaction(admin))).rejects.toBeInstanceOf(UnknownSignerError);
		expect(promptExecutor.promptText).not.toHaveBeenCalled();
		expect(messages.join('\n')).not.toContain('PAUSED');
	});
});
