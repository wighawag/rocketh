import {describe, it, expect, vi} from 'vitest';
import {UnknownSignerError} from '@rocketh/core';
import type {Environment, PromptExecutor} from '@rocketh/core/types';
import {createMockPromptExecutor, createTestEnvironment} from '@rocketh/test-utils';

import {catchUnknownSigner, withUnknownSignerPolicy} from '../src/index.js';

/**
 * WHO DECIDES THE UNKNOWN-SIGNER POLICY, for one action.
 *
 * Two behaviours that belong together, because they are the two ends of the same
 * precedence chain:
 *
 * 1. `withUnknownSignerPolicy` — a PER-CALL override. It pushes a policy frame for the
 *    duration of one action (the same mechanism `catchUnknownSigner` uses), so a script
 *    can rehearse the interactive flow for a single call on a fork whose run-level
 *    policy is `'throw'`. The override may VARY the policy but never exceeds what the
 *    run can actually do: with no way to ask a human for text, an overridden `'ask'`
 *    degrades to `'throw'` (capability is a CEILING, ADR 0007), which is what keeps a
 *    CI run un-hangable even when a script hardcodes the override.
 * 2. `catchUnknownSigner` — the DEFERRAL GUARANTEE. It takes the throw path whatever the
 *    ambient policy is, so a wrapped action never pops a prompt at a user who already
 *    said they would execute the transaction themselves.
 *
 * Every test here is DISCRIMINATING: each one would fail if precedence regressed,
 * because `'ask'` and `'throw'` are observably different (a receipt for the pasted hash
 * with the prompt consulted, versus an `UnknownSignerError` with the prompt untouched).
 * The core slice could not write these: both of its policy values resolved to `'throw'`,
 * so any such test was a tautology.
 */

/** Stands in for the Safe/multisig owner: a named account the node does not hold. */
const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111';
/** An address the mock node lists in `eth_accounts`, so it is signable. */
const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
const TARGET_CONTRACT = '0x0000000000000000000000000000000000000001';

/** What the human pastes back after executing the transaction on their Safe. */
const PASTED_HASH = '0x00000000000000000000000000000000000000000000000000000000000000aa' as `0x${string}`;
const SECOND_PASTED_HASH = '0x00000000000000000000000000000000000000000000000000000000000000bb' as `0x${string}`;

/** A privileged call from the Safe: the tx a human has to execute out-of-band. */
function upgradeCall(env: Environment, from: `0x${string}`) {
	return env.broadcastExecution({
		type: 'object',
		data: {
			type: '0x2',
			from,
			to: TARGET_CONTRACT,
			data: '0xdeadbeef',
			value: '0x1f4',
			chainId: `0x${env.network.chain.id.toString(16)}` as `0x${string}`,
		},
	});
}

/**
 * Collect what the run SHOWED the user. The interactive path announces the pause
 * (`... is PAUSED`) before it asks anything, so this is how a test tells "never went
 * interactive" apart from "went interactive and failed": both end in an
 * `UnknownSignerError`.
 */
function captureMessages(env: Environment): string[] {
	const messages: string[] = [];
	vi.spyOn(env, 'showMessage').mockImplementation((message: string) => {
		messages.push(message);
	});
	return messages;
}

/**
 * An environment whose named `admin` is unsignable (no signer material, no
 * impersonation), under a caller-chosen run-level policy.
 *
 * The mock node must KNOW a pasted hash, since the interactive path looks the pasted
 * transaction up (`eth_getTransactionByHash`) before it records anything; the harness
 * default answers `null` (nothing has been sent).
 */
async function safeOwnerEnvironment(options: {
	/** The run-level `onUnknownSigner`, i.e. what the per-call override has to beat. */
	onUnknownSigner: 'throw' | 'ask' | 'auto';
	promptExecutor?: PromptExecutor;
	/** Make the run FORK-shaped (`env.network.fork === true`), as a rehearsal is. */
	fork?: boolean;
}) {
	return createTestEnvironment({
		accounts: {deployer: NODE_ACCOUNT, admin: SAFE_ADDRESS},
		nodeAccounts: [NODE_ACCOUNT],
		executionParams: {
			autoImpersonate: false,
			onUnknownSigner: options.onUnknownSigner,
			promptExecutor: options.promptExecutor,
			...(options.fork ? {environment: {fork: 'sepolia'}} : {}),
		},
		providerConfig: {
			responses: {
				eth_getTransactionByHash: (params?: unknown[]) => ({
					hash: params?.[0] as `0x${string}`,
					nonce: '0x3',
					from: SAFE_ADDRESS,
					gasPrice: '0x1',
					type: '0x0',
				}),
			},
		},
	});
}

describe('@rocketh/unknown-signer - per-call policy override', () => {
	/**
	 * Story 8, the `'ask'` direction. The run says `'throw'` (what a CI-shaped or a
	 * cautious fork run says); ONE call asks to be resolved interactively instead.
	 *
	 * The baseline half of the assertion is what makes this discriminating: the very
	 * same call OUTSIDE the override throws and never reaches for the prompt.
	 */
	it('forces the interactive policy for one action, beating a run-level `throw`', async () => {
		const promptExecutor = createMockPromptExecutor({textAnswers: [PASTED_HASH]});
		const {env} = await safeOwnerEnvironment({onUnknownSigner: 'throw', promptExecutor});
		const admin = env.resolveAccount('admin');

		// baseline: under the run-level policy this call throws, unprompted
		await expect(upgradeCall(env, admin)).rejects.toBeInstanceOf(UnknownSignerError);
		expect(promptExecutor.requests).toEqual([]);

		// the same call, overridden for this ONE action, pauses and takes the pasted hash
		const receipt = await withUnknownSignerPolicy(env)('ask', () => upgradeCall(env, admin));

		expect(receipt.transactionHash).toBe(PASTED_HASH);
		expect(promptExecutor.textRequests).toHaveLength(1);
		expect(promptExecutor.textRequests[0].message).toContain(SAFE_ADDRESS);
	});

	/**
	 * Story 8, the `'throw'` direction, and the frame is popped afterwards: the ambient
	 * `'ask'` is back in force for the next call, which is what makes the override
	 * PER-CALL rather than a run-level switch in disguise.
	 */
	it('forces the throw policy for one action, beating a run-level `ask`', async () => {
		const promptExecutor = createMockPromptExecutor({textAnswers: [PASTED_HASH]});
		const {env} = await safeOwnerEnvironment({onUnknownSigner: 'ask', promptExecutor});
		const admin = env.resolveAccount('admin');

		await expect(withUnknownSignerPolicy(env)('throw', () => upgradeCall(env, admin))).rejects.toBeInstanceOf(
			UnknownSignerError,
		);
		expect(promptExecutor.requests).toEqual([]);

		// outside the override, the run's own policy decides again
		const receipt = await upgradeCall(env, admin);
		expect(receipt.transactionHash).toBe(PASTED_HASH);
		expect(promptExecutor.textRequests).toHaveLength(1);
	});

	/** The action's own result is handed back, so an override wraps a call transparently. */
	it('returns what the action returned', async () => {
		const {env} = await safeOwnerEnvironment({onUnknownSigner: 'throw'});

		const result = await withUnknownSignerPolicy(env)('throw', async () => {
			await upgradeCall(env, env.resolveAccount('deployer'));
			return 'the action ran';
		});

		expect(result).toBe('the action ran');
	});

	/**
	 * CAPABILITY IS A CEILING, NOT A DEFAULT (ADR 0007). An override may vary the
	 * policy, but it can never GRANT the run an ability it does not have. A prompt
	 * built with no scripted answers is the capability-absent shape (no `promptText`
	 * method at all), which is what `@rocketh/web` and a non-TTY `@rocketh/node` run
	 * look like: the overridden `'ask'` degrades to `'throw'`, and nobody is asked.
	 *
	 * What the run SHOWED is asserted too, because a run that ENTERED the interactive
	 * path and failed there also ends in an `UnknownSignerError` (a prompt that cannot
	 * run degrades to the defer path). Never having announced the pause is what
	 * distinguishes a ceiling from a crash.
	 */
	it('degrades an overridden `ask` to throw when the run cannot ask a human', async () => {
		const promptExecutor = createMockPromptExecutor();
		const {env} = await safeOwnerEnvironment({onUnknownSigner: 'throw', promptExecutor});
		expect(env.canPromptForText()).toBe(false);
		const messages = captureMessages(env);

		await expect(
			withUnknownSignerPolicy(env)('ask', () => upgradeCall(env, env.resolveAccount('admin'))),
		).rejects.toBeInstanceOf(UnknownSignerError);

		expect(promptExecutor.requests).toEqual([]);
		expect(messages.join('\n')).not.toContain('PAUSED');
	});

	/** The same ceiling with no prompt object at all — a plain CI run. It cannot hang. */
	it('degrades an overridden `ask` to throw when the run carries no prompt at all', async () => {
		const {env} = await safeOwnerEnvironment({onUnknownSigner: 'throw'});
		expect(env.canPromptForText()).toBe(false);
		const messages = captureMessages(env);

		await expect(
			withUnknownSignerPolicy(env)('ask', () => upgradeCall(env, env.resolveAccount('admin'))),
		).rejects.toBeInstanceOf(UnknownSignerError);

		expect(messages.join('\n')).not.toContain('PAUSED');
	});

	/**
	 * A THROWN action must not strand its frame on the stack. Asserted BEHAVIOURALLY
	 * (the next call gets the ambient policy back, prompting where the stranded frame
	 * would have thrown), not merely by counting `pop` calls — a stranded `'throw'`
	 * frame would silently disable the interactive policy for the rest of the run.
	 */
	it('pops the frame when the action throws, leaving the ambient policy in force', async () => {
		const promptExecutor = createMockPromptExecutor({textAnswers: [PASTED_HASH]});
		const {env} = await safeOwnerEnvironment({onUnknownSigner: 'ask', promptExecutor});
		const pop = vi.spyOn(env, 'popUnknownSignerPolicy');

		// the deferral throw itself: the scoped `'throw'` policy is what raised it
		await expect(
			withUnknownSignerPolicy(env)('throw', () => upgradeCall(env, env.resolveAccount('admin'))),
		).rejects.toBeInstanceOf(UnknownSignerError);

		// and any OTHER error the action raises (a script bug, a failed RPC)
		await expect(
			withUnknownSignerPolicy(env)('throw', () => {
				throw new Error('something else went wrong');
			}),
		).rejects.toThrow('something else went wrong');

		expect(pop).toHaveBeenCalledTimes(2);

		const receipt = await upgradeCall(env, env.resolveAccount('admin'));
		expect(receipt.transactionHash).toBe(PASTED_HASH);
	});

	/**
	 * Frames nest LIFO, so the INNERMOST explicit scope decides. Documented here
	 * because it is the one way a wrapped action can still become interactive: the
	 * deferral guarantee below is about the AMBIENT policy, not about an override the
	 * same script deliberately wrote INSIDE the wrapper.
	 */
	it('lets an inner explicit override win over an outer one', async () => {
		const promptExecutor = createMockPromptExecutor({textAnswers: [PASTED_HASH]});
		const {env} = await safeOwnerEnvironment({onUnknownSigner: 'throw', promptExecutor});
		const admin = env.resolveAccount('admin');

		const receipt = await withUnknownSignerPolicy(env)('throw', () =>
			withUnknownSignerPolicy(env)('ask', () => upgradeCall(env, admin)),
		);

		expect(receipt.transactionHash).toBe(PASTED_HASH);
	});

	/**
	 * The action is a THUNK only, for exactly the reason `catchUnknownSigner`'s is: a
	 * promise argument has ALREADY started before the frame can be pushed, so the
	 * override would silently not apply. The type rejects it (`@ts-expect-error`
	 * below); the runtime rejects it too, naming the fix, because JavaScript callers
	 * and `as any` exist.
	 */
	it('rejects a promise-form call with an actionable error', async () => {
		const {env} = await safeOwnerEnvironment({onUnknownSigner: 'throw'});
		const alreadyStarted = upgradeCall(env, env.resolveAccount('admin')).catch(() => undefined);

		await expect(
			// @ts-expect-error the promise form is deliberately not accepted
			withUnknownSignerPolicy(env)('ask', alreadyStarted),
		).rejects.toThrow(/\(\) =>/);

		await expect(withUnknownSignerPolicy(env)('ask', alreadyStarted as any)).rejects.toThrow(
			/@rocketh\/unknown-signer/,
		);

		await alreadyStarted;
	});
});

describe('@rocketh/unknown-signer - rehearsing the interactive flow on a fork', () => {
	/**
	 * Story 3, end to end. A fork run whose policy is `'throw'`, a prompt injected by
	 * the test (a TTY on a real rehearsal), ONE call overridden toward `'ask'`, a hash
	 * pasted back — and the run CARRIES ON, which is the whole point of rehearsing:
	 * you see how production will play out before doing it for real.
	 */
	it('overrides one call toward `ask`, takes a pasted hash and continues the run', async () => {
		const promptExecutor = createMockPromptExecutor({textAnswers: [PASTED_HASH]});
		const {env, provider} = await safeOwnerEnvironment({
			onUnknownSigner: 'throw',
			promptExecutor,
			fork: true,
		});
		expect(env.network.fork).toBe(true);

		const steps: string[] = [];
		const receipt = await withUnknownSignerPolicy(env)('ask', async () => {
			steps.push('governed-upgrade');
			return upgradeCall(env, env.resolveAccount('admin'));
		});
		steps.push('next-step');

		expect(receipt.transactionHash).toBe(PASTED_HASH);
		expect(steps).toEqual(['governed-upgrade', 'next-step']);

		// the human was shown the transaction, once
		expect(promptExecutor.textRequests).toHaveLength(1);
		expect(promptExecutor.textRequests[0].message).toContain(SAFE_ADDRESS);

		// and rocketh sent nothing itself: the transaction was executed out-of-band
		const sends = provider
			.getRequests()
			.filter((request) => request.method === 'eth_sendTransaction' || request.method === 'eth_sendRawTransaction');
		expect(sends).toEqual([]);
	});
});

describe('@rocketh/unknown-signer - the deferral guarantee', () => {
	/**
	 * Story 9. `catchUnknownSigner` takes the THROW path whatever the ambient policy
	 * is — here an ambient `'ask'` WITH a working prompt, the one configuration in
	 * which the guarantee can be observed at all.
	 *
	 * The assertion is that NO prompt was consulted, not merely that an error was
	 * thrown: an `UnknownSignerError` is what the interactive path throws for "cannot
	 * sign" too, so "it threw" cannot tell the two apart. The scripted answer is a
	 * VALID hash, so if the wrapper ever let the prompt run, this test would see a
	 * receipt instead of a deferral.
	 */
	it('defers under an ambient `ask` WITHOUT consulting the prompt', async () => {
		const promptExecutor = createMockPromptExecutor({textAnswers: [PASTED_HASH]});
		const {env, provider} = await safeOwnerEnvironment({onUnknownSigner: 'ask', promptExecutor});
		const admin = env.resolveAccount('admin');

		const deferred = await catchUnknownSigner(env)(() => upgradeCall(env, admin), {log: false});

		expect(deferred).toEqual({from: admin, to: TARGET_CONTRACT, value: '0x1f4', data: '0xdeadbeef'});
		// nobody was asked anything — the guarantee
		expect(promptExecutor.requests).toEqual([]);
		// and no transaction was sent either
		expect(provider.getRequests().filter((request) => request.method === 'eth_sendTransaction')).toEqual([]);
	});

	/**
	 * The deferral MESSAGE is the deliverable of this workflow (it is what the user
	 * reads before opening their Safe), so an ambient `'ask'` must not degrade it. The
	 * two runs are compared byte for byte, which is stronger than checking that the
	 * message merely mentions the transaction.
	 */
	it('prints the full, undegraded deferral message under an ambient `ask`', async () => {
		async function messageFor(onUnknownSigner: 'throw' | 'ask') {
			const promptExecutor = createMockPromptExecutor({textAnswers: [PASTED_HASH]});
			const {env} = await safeOwnerEnvironment({onUnknownSigner, promptExecutor});
			const messages: string[] = [];
			vi.spyOn(env, 'showMessage').mockImplementation((message: string) => {
				messages.push(message);
			});

			await catchUnknownSigner(env)(() => upgradeCall(env, env.resolveAccount('admin')));

			expect(promptExecutor.requests).toEqual([]);
			return messages.join('\n');
		}

		const underAsk = await messageFor('ask');
		const underThrow = await messageFor('throw');

		expect(underAsk).toBe(underThrow);
		expect(underAsk).toContain(`no signer for ${SAFE_ADDRESS}`);
		expect(underAsk).toContain(`to: ${TARGET_CONTRACT}`);
		expect(underAsk).toContain('data: 0xdeadbeef');
		expect(underAsk).toContain('value: 0x1f4');
	});

	/**
	 * The guarantee is SCOPED to the wrapped action: once the wrapper returns, the
	 * run's own `'ask'` policy is in force again. A wrapper that leaked its frame
	 * would silently turn the rest of the run non-interactive.
	 */
	it('restores the ambient `ask` once the wrapper returns', async () => {
		const promptExecutor = createMockPromptExecutor({textAnswers: [PASTED_HASH, SECOND_PASTED_HASH]});
		const {env} = await safeOwnerEnvironment({onUnknownSigner: 'ask', promptExecutor});
		const admin = env.resolveAccount('admin');

		const deferred = await catchUnknownSigner(env)(() => upgradeCall(env, admin), {log: false});
		expect(deferred?.from).toBe(admin);
		expect(promptExecutor.requests).toEqual([]);

		const receipt = await upgradeCall(env, admin);
		expect(receipt.transactionHash).toBe(PASTED_HASH);
		expect(promptExecutor.textRequests).toHaveLength(1);
	});
});
