import {describe, it, expect, vi, beforeEach} from 'vitest';

/**
 * `@rocketh/node`'s `PromptExecutor` is the one runtime in this repo where a human is
 * actually reachable, so it is where the optional text ability is implemented (the
 * browser deliberately has none — ADR 0007).
 *
 * The `prompts` library keys its answer object BY the request's `name`. The confirm
 * implementation reads `.proceed` unconditionally and works only because both of its
 * call sites happen to pass `name: 'proceed'`; a text prompt named `txHash` written the
 * same way would silently receive `undefined`. These tests drive the text ability with a
 * name that is NOT `proceed` precisely so that mistake cannot come back.
 */

const promptsMock = vi.hoisted(() => vi.fn());
vi.mock('prompts', () => ({default: promptsMock}));

import {createNodePromptExecutor} from '../src/environment/prompt.js';

describe('@rocketh/node - prompt executor', () => {
	beforeEach(() => {
		promptsMock.mockReset();
	});

	describe('promptText', () => {
		it('reads the answer keyed by the request name, not by a fixed key', async () => {
			// what `prompts` really returns for `{type: 'text', name: 'txHash'}`
			promptsMock.mockResolvedValue({txHash: '0xdeadbeef'});

			const answer = await createNodePromptExecutor().promptText!({
				type: 'text',
				name: 'txHash',
				message: 'paste the transaction hash',
			});

			expect(answer).toEqual({value: '0xdeadbeef'});
		});

		it('passes the request through to the prompts library verbatim', async () => {
			promptsMock.mockResolvedValue({txHash: '0x1'});
			const request = {type: 'text', name: 'txHash', message: 'paste the transaction hash'} as const;

			await createNodePromptExecutor().promptText!(request);

			expect(promptsMock).toHaveBeenCalledWith(request);
		});

		it('reports cancellation when the user aborts (prompts answers nothing)', async () => {
			// Ctrl-C: `prompts` resolves with the key absent rather than rejecting.
			promptsMock.mockResolvedValue({});

			const answer = await createNodePromptExecutor().promptText!({
				type: 'text',
				name: 'txHash',
				message: 'paste the transaction hash',
			});

			expect(answer).toEqual({cancelled: true});
		});

		it('treats an empty answer as a value, leaving validation to the caller', async () => {
			promptsMock.mockResolvedValue({txHash: ''});

			const answer = await createNodePromptExecutor().promptText!({
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

			const answer = await createNodePromptExecutor().prompt({
				type: 'confirm',
				name: 'proceed',
				message: 'Do you want to proceed?',
			});

			expect(answer).toEqual({proceed: false});
		});
	});
});
