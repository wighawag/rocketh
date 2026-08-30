/**
 * Tests for `createMockPromptExecutor` — the fake human extension packages inject
 * through `createTestEnvironment`'s run-parameter pass-through
 * (`executionParams.promptExecutor`).
 *
 * These cover the DOUBLE's own contract: what it answers, what it records, and the
 * capability-absent shape. The end-to-end proof that it drives the real interactive
 * seam lives where it belongs, in an extension package that may depend on this one:
 * `packages/rocketh-unknown-signer/test/interactive-prompt.integration.test.ts`.
 */

import {describe, it, expect} from 'vitest';

import {createMockPromptExecutor} from '../src/index.js';

const A_HASH = '0x00000000000000000000000000000000000000000000000000000000000000aa';

describe('createMockPromptExecutor', () => {
	it('answers scripted text answers in order, as {value}', async () => {
		const promptExecutor = createMockPromptExecutor({textAnswers: [A_HASH, 'cannot sign']});

		expect(await promptExecutor.promptText!({type: 'text', name: 'transactionHash', message: 'hash?'})).toEqual({
			value: A_HASH,
		});
		expect(await promptExecutor.promptText!({type: 'text', name: 'transactionHash', message: 'hash?'})).toEqual({
			value: 'cannot sign',
		});
	});

	it('passes a TextPromptAnswer through and THROWS an Error entry', async () => {
		/**
		 * `{cancelled: true}` is a human who aborted; an `Error` is a prompt with no
		 * terminal behind it. Both are things the interactive resolver has to handle,
		 * so both are expressible.
		 */
		const promptExecutor = createMockPromptExecutor({
			textAnswers: [{cancelled: true}, new Error('no tty')],
		});

		expect(await promptExecutor.promptText!({type: 'text', name: 'transactionHash', message: 'hash?'})).toEqual({
			cancelled: true,
		});
		await expect(promptExecutor.promptText!({type: 'text', name: 'transactionHash', message: 'hash?'})).rejects.toThrow(
			'no tty',
		);
	});

	it('records every request it received, in order', async () => {
		/**
		 * Recording is what lets a test assert WHETHER a prompt was consulted and with
		 * what message — including the negative, which `catchUnknownSigner` needs.
		 */
		const promptExecutor = createMockPromptExecutor({textAnswers: [A_HASH]});
		expect(promptExecutor.requests).toEqual([]);
		expect(promptExecutor.textRequests).toEqual([]);

		await promptExecutor.prompt({type: 'confirm', name: 'proceed', message: 'proceed?'});
		await promptExecutor.promptText!({type: 'text', name: 'transactionHash', message: 'hash executed for 0x11?'});

		expect(promptExecutor.requests).toEqual([
			{type: 'confirm', name: 'proceed', message: 'proceed?'},
			{type: 'text', name: 'transactionHash', message: 'hash executed for 0x11?'},
		]);
		expect(promptExecutor.textRequests).toEqual([
			{type: 'text', name: 'transactionHash', message: 'hash executed for 0x11?'},
		]);
	});

	it('has NO promptText at all when no answers are scripted (the capability-absent shape)', async () => {
		/**
		 * The absence of the method IS the capability signal (ADR 0007), so the fake for
		 * a run that cannot reach a human is simply one without it. Its confirm half
		 * still works, like `@rocketh/web`'s.
		 */
		const promptExecutor = createMockPromptExecutor();

		expect(promptExecutor.promptText).toBeUndefined();
		expect('promptText' in promptExecutor).toBe(false);
		expect(await promptExecutor.prompt({type: 'confirm', name: 'proceed', message: 'proceed?'})).toEqual({
			proceed: true,
		});
	});

	it('keeps the capability but fails loudly when the script runs out', async () => {
		/**
		 * An EMPTY script is a prompt that CAN be asked and has nothing to say, which is
		 * how a test gets the capability without an answer. Running past the end names
		 * the question rather than looping or inventing an answer.
		 */
		const promptExecutor = createMockPromptExecutor({textAnswers: []});

		expect(typeof promptExecutor.promptText).toBe('function');
		await expect(promptExecutor.promptText!({type: 'text', name: 'transactionHash', message: 'hash?'})).rejects.toThrow(
			/only 0 answer\(s\) were scripted/,
		);
	});

	it('records the value a RE-ASK offered back as the starting point', async () => {
		/**
		 * `initial` is how the interactive unknown-signer resolver re-asks for a hash this
		 * node could not find without throwing away what the human already typed. Recording
		 * it is what lets a test prove the previous answer was CARRIED OVER, rather than the
		 * question being asked again from scratch — which looks identical if all a test can
		 * count is how many times the prompt was consulted.
		 *
		 * The double answers from its script whatever it was offered, exactly as a human is
		 * free to type over the value in front of them.
		 */
		const promptExecutor = createMockPromptExecutor({textAnswers: [A_HASH, A_HASH]});

		await promptExecutor.promptText!({type: 'text', name: 'transactionHash', message: 'hash?'});
		await promptExecutor.promptText!({
			type: 'text',
			name: 'transactionHash',
			message: 'hash?',
			initial: A_HASH,
		});

		expect(promptExecutor.textRequests[0].initial).toBeUndefined();
		expect(promptExecutor.textRequests[1].initial).toBe(A_HASH);
	});

	it('does not consume a caller-owned answers array', async () => {
		const answers = [A_HASH];
		const first = createMockPromptExecutor({textAnswers: answers});
		const second = createMockPromptExecutor({textAnswers: answers});

		await first.promptText!({type: 'text', name: 'transactionHash', message: 'hash?'});
		expect(await second.promptText!({type: 'text', name: 'transactionHash', message: 'hash?'})).toEqual({
			value: A_HASH,
		});
		expect(answers).toEqual([A_HASH]);
	});

	it('records exit()', () => {
		const promptExecutor = createMockPromptExecutor();
		expect(promptExecutor.exited).toBe(false);
		promptExecutor.exit();
		expect(promptExecutor.exited).toBe(true);
	});
});
