import {describe, it, expect, vi, beforeEach} from 'vitest';

/**
 * `@rocketh/node`'s `PromptExecutor` is the one runtime in this repo where a human is
 * actually reachable, so it is where the optional text ability is implemented (the
 * browser deliberately has none — ADR 0007).
 *
 * The `prompts` library keys its answer object BY the request's `name`. BOTH abilities
 * therefore read the answer by name: the confirm used to read a fixed `.proceed` key and
 * worked only because both of its call sites happen to pass `name: 'proceed'`, so a
 * confirm named anything else silently received `undefined` and was treated as "do not
 * proceed" (i.e. it exited the run). These tests drive both abilities with a name that is
 * NOT `proceed` precisely so that mistake cannot come back.
 *
 * The ability is also GATED ON A TTY here rather than in `canPromptForText()`, because
 * `prompts` against a non-TTY stdin never settles at all (measured in
 * `docs/spikes/ask-policy-interactive-resolver/prompts-non-tty-behaviour.md`), so no
 * amount of error handling downstream could rescue such a run. The gate is driven from
 * both sides below through the injected probe, since the test process's own stdin is
 * not a terminal.
 */

const promptsMock = vi.hoisted(() => vi.fn());
vi.mock('prompts', () => ({default: promptsMock}));

import {createNodePromptExecutor} from '../src/environment/prompt.js';

/** The executor as a run with a real terminal gets it: the text ability is supplied. */
function interactiveExecutor() {
	return createNodePromptExecutor({isStdinInteractive: () => true});
}

describe('@rocketh/node - prompt executor', () => {
	beforeEach(() => {
		promptsMock.mockReset();
	});

	describe('the TTY gate on the text ability', () => {
		/**
		 * THE CI CASE. With stdin not a terminal the text ability is ABSENT, which is the
		 * capability signal (ADR 0007): `env.canPromptForText()` answers false and the
		 * unknown-signer policy degrades to `throw`. `prompts` is never called, which is
		 * the whole point: calling it would hang the run for ever.
		 */
		it('does NOT supply promptText when stdin is not a TTY', () => {
			const executor = createNodePromptExecutor({isStdinInteractive: () => false});

			expect(executor.promptText).toBeUndefined();
			expect(promptsMock).not.toHaveBeenCalled();
		});

		it('supplies promptText when stdin IS a TTY', () => {
			expect(interactiveExecutor().promptText).toBeTypeOf('function');
		});

		/**
		 * The confirm is still SUPPLIED either way — its presence is not a capability signal,
		 * nothing branches on it, and every runtime has one. What changes without a terminal
		 * is that calling it REFUSES (see the `prompt (confirm)` block below) rather than
		 * hanging on a `prompts` promise that never settles.
		 */
		it('still supplies the confirm prompt either way', () => {
			expect(createNodePromptExecutor({isStdinInteractive: () => false}).prompt).toBeTypeOf('function');
			expect(interactiveExecutor().prompt).toBeTypeOf('function');
		});

		/** Production reads the real stdin, and the test process's stdin is not a terminal. */
		it('defaults to the process stdin, which in a non-interactive run has no text ability', () => {
			const wasTTY = process.stdin.isTTY;
			try {
				(process.stdin as {isTTY?: boolean}).isTTY = false;
				expect(createNodePromptExecutor().promptText).toBeUndefined();
				(process.stdin as {isTTY?: boolean}).isTTY = true;
				expect(createNodePromptExecutor().promptText).toBeTypeOf('function');
			} finally {
				(process.stdin as {isTTY?: boolean}).isTTY = wasTTY;
			}
		});
	});

	describe('promptText', () => {
		it('reads the answer keyed by the request name, not by a fixed key', async () => {
			// what `prompts` really returns for `{type: 'text', name: 'txHash'}`
			promptsMock.mockResolvedValue({txHash: '0xdeadbeef'});

			const answer = await interactiveExecutor().promptText!({
				type: 'text',
				name: 'txHash',
				message: 'paste the transaction hash',
			});

			expect(answer).toEqual({value: '0xdeadbeef'});
		});

		it('passes the request through to the prompts library verbatim', async () => {
			promptsMock.mockResolvedValue({txHash: '0x1'});
			const request = {type: 'text', name: 'txHash', message: 'paste the transaction hash'} as const;

			await interactiveExecutor().promptText!(request);

			expect(promptsMock).toHaveBeenCalledWith(request);
		});

		/**
		 * THE PRE-FILL. A re-ask ("that hash is not one this node knows — try again") offers
		 * the previous answer back, and `prompts` has native support for exactly that: an
		 * `initial` on a text prompt renders greyed and becomes the answer when the human
		 * submits an untouched line, so pressing enter means "try that same hash again".
		 * Reaching the library is all this runtime has to do, and all it does.
		 */
		it('passes a pre-filled initial value through to the prompts library', async () => {
			promptsMock.mockResolvedValue({txHash: '0xdeadbeef'});

			const answer = await interactiveExecutor().promptText!({
				type: 'text',
				name: 'txHash',
				message: 'paste the transaction hash',
				initial: '0xdeadbeef',
			});

			expect(promptsMock).toHaveBeenCalledWith({
				type: 'text',
				name: 'txHash',
				message: 'paste the transaction hash',
				initial: '0xdeadbeef',
			});
			expect(answer).toEqual({value: '0xdeadbeef'});
		});

		it('reports cancellation when the user aborts (prompts answers nothing)', async () => {
			// Ctrl-C: `prompts` resolves with the key absent rather than rejecting.
			promptsMock.mockResolvedValue({});

			const answer = await interactiveExecutor().promptText!({
				type: 'text',
				name: 'txHash',
				message: 'paste the transaction hash',
			});

			expect(answer).toEqual({cancelled: true});
		});

		it('treats an empty answer as a value, leaving validation to the caller', async () => {
			promptsMock.mockResolvedValue({txHash: ''});

			const answer = await interactiveExecutor().promptText!({
				type: 'text',
				name: 'txHash',
				message: 'paste the transaction hash',
			});

			expect(answer).toEqual({value: ''});
		});
	});

	describe('prompt (confirm)', () => {
		it('still answers a confirm exactly as before', async () => {
			promptsMock.mockResolvedValue({proceed: false});

			const answer = await interactiveExecutor().prompt({
				type: 'confirm',
				name: 'proceed',
				message: 'Do you want to proceed?',
			});

			expect(answer).toEqual({proceed: false});
		});

		/**
		 * THE DEFECT THIS PINS: a confirm named anything other than `proceed` used to read
		 * `undefined` from the answer object and be treated as a refusal, so the run exited
		 * without the human ever having declined anything. Both current call sites pass
		 * `proceed`, which is why it was invisible.
		 */
		it('reads the answer keyed by the request name, not by a fixed key', async () => {
			promptsMock.mockResolvedValue({overwrite: true});

			const answer = await interactiveExecutor().prompt({
				type: 'confirm',
				name: 'overwrite',
				message: 'Overwrite?',
			});

			expect(answer).toEqual({proceed: true});
		});

		/**
		 * THE NON-TTY CASE. `prompts` against a non-TTY stdin never settles, so asking is not
		 * an option; and both call sites read "not confirmed" as `exit()`, so silently
		 * answering for the user is not one either. It therefore fails loudly, naming the
		 * question it could not ask and the flag that skips it. `prompts` is never called —
		 * that is what makes the run terminate instead of hanging.
		 */
		it('REFUSES to confirm when stdin is not a terminal, instead of hanging', async () => {
			const executor = createNodePromptExecutor({isStdinInteractive: () => false});

			await expect(
				executor.prompt({type: 'confirm', name: 'proceed', message: 'This will delete all deployments'}),
			).rejects.toThrow(/stdin is not a terminal/);
			await expect(
				executor.prompt({type: 'confirm', name: 'proceed', message: 'This will delete all deployments'}),
			).rejects.toThrow(/--skip-prompts/);
			// the question itself is reprinted, so the operator knows WHAT was being asked
			await expect(
				executor.prompt({type: 'confirm', name: 'proceed', message: 'This will delete all deployments'}),
			).rejects.toThrow(/This will delete all deployments/);

			expect(promptsMock).not.toHaveBeenCalled();
		});

		/** Ctrl-C: `prompts` resolves with the key absent, which must read as "do not proceed". */
		it('treats an aborted confirm as a refusal rather than as undefined', async () => {
			promptsMock.mockResolvedValue({});

			const answer = await interactiveExecutor().prompt({
				type: 'confirm',
				name: 'proceed',
				message: 'Do you want to proceed?',
			});

			expect(answer).toEqual({proceed: false});
		});
	});
});
