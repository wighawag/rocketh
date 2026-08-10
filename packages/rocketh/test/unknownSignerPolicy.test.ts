import {describe, it, expect} from 'vitest';

import {createUnknownSignerPolicyStack, resolveUnknownSignerBehaviour} from '../src/environment/unknownSignerPolicy.js';

/**
 * Unit tests for the unknown-signer POLICY FRAME STACK and for turning a policy
 * into the behaviour a run can actually carry out.
 *
 * Precedence between frames is unit-tested HERE, at the stack itself; what it
 * MEANS at the seam (a `'throw'` frame beating an ambient `'ask'` without ever
 * consulting the prompt) is pinned in `interactive-unknown-signer.test.ts`, which
 * is where the two policy values became observably different.
 */
describe('createUnknownSignerPolicyStack', () => {
	/** With no frame pushed, the effective policy is the run/chain-resolved global. */
	it('falls back to the resolved global policy when no frame is pushed', () => {
		expect(createUnknownSignerPolicyStack('auto').effective()).toBe('auto');
		expect(createUnknownSignerPolicyStack('throw').effective()).toBe('throw');
	});

	/** `top-of-frame ?? resolved-global`: a pushed frame wins over the global. */
	it('lets a pushed frame win over the resolved global', () => {
		const stack = createUnknownSignerPolicyStack('auto');
		stack.push({policy: 'throw'});
		expect(stack.effective()).toBe('throw');
	});

	/** Popping restores whatever was in effect before the push. */
	it('restores the previous policy on pop', () => {
		const stack = createUnknownSignerPolicyStack('auto');
		stack.push({policy: 'throw'});
		stack.pop();
		expect(stack.effective()).toBe('auto');
	});

	/** Frames nest LIFO, so a wrapper inside a wrapper sees the innermost policy. */
	it('nests frames LIFO', () => {
		const stack = createUnknownSignerPolicyStack('auto');
		stack.push({policy: 'auto'});
		stack.push({policy: 'throw'});
		expect(stack.effective()).toBe('throw');
		stack.pop();
		expect(stack.effective()).toBe('auto');
		stack.pop();
		expect(stack.effective()).toBe('auto');
	});

	/**
	 * The shape `catchUnknownSigner` will use: push on enter, pop in `finally`. The
	 * pop must NOT be skipped when the wrapped action throws — otherwise the frame
	 * leaks into every later deploy script of the run.
	 */
	it('does not leak a frame when the wrapped action throws (pop in finally)', () => {
		const stack = createUnknownSignerPolicyStack('auto');
		const runWrapped = (action: () => void) => {
			stack.push({policy: 'throw'});
			try {
				action();
			} finally {
				stack.pop();
			}
		};

		expect(() =>
			runWrapped(() => {
				expect(stack.effective()).toBe('throw');
				throw new Error('action failed');
			}),
		).toThrow('action failed');

		expect(stack.effective()).toBe('auto');
	});

	/**
	 * An unbalanced `pop` (more pops than pushes) is a caller bug, but it must not
	 * be able to abort a deploy run: it is a no-op that leaves the global in
	 * effect. See the module JSDoc for why this is a no-op rather than a throw.
	 */
	it('treats an unbalanced pop as a no-op', () => {
		const stack = createUnknownSignerPolicyStack('auto');
		expect(() => stack.pop()).not.toThrow();
		expect(stack.effective()).toBe('auto');
		stack.push({policy: 'throw'});
		expect(stack.effective()).toBe('throw');
	});
});

/**
 * CAPABILITY IS A CEILING, NOT A DEFAULT (ADR 0007). These four cases are the whole
 * truth table, and both directions of each capability-dependent value are asserted
 * with DIFFERENT expected results, so none of them can pass by coincidence.
 */
describe('resolveUnknownSignerBehaviour', () => {
	it('keeps `throw` a throw, capability or not', () => {
		expect(resolveUnknownSignerBehaviour('throw', {canPromptForText: true})).toBe('throw');
		expect(resolveUnknownSignerBehaviour('throw', {canPromptForText: false})).toBe('throw');
	});

	/** `'auto'` is CAPABILITY-AWARE in both directions: this is the CI guarantee. */
	it('resolves `auto` to `ask` with a text prompt and to `throw` without one', () => {
		expect(resolveUnknownSignerBehaviour('auto', {canPromptForText: true})).toBe('ask');
		expect(resolveUnknownSignerBehaviour('auto', {canPromptForText: false})).toBe('throw');
	});

	/**
	 * An EXPLICIT `'ask'` cannot exceed the ceiling: with no way to reach a human it
	 * degrades to `'throw'` rather than hanging. A script that hardcodes `'ask'`
	 * therefore still runs in CI.
	 */
	it('degrades an explicit `ask` to `throw` without a text prompt', () => {
		expect(resolveUnknownSignerBehaviour('ask', {canPromptForText: true})).toBe('ask');
		expect(resolveUnknownSignerBehaviour('ask', {canPromptForText: false})).toBe('throw');
	});
});
