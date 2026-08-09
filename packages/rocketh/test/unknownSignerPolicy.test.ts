import {describe, it, expect} from 'vitest';

import {createUnknownSignerPolicyStack} from '../src/environment/unknownSignerPolicy.js';

/**
 * Unit tests for the unknown-signer POLICY FRAME STACK.
 *
 * This mechanism delivers no user story in this slice: with only `'throw'` and
 * `'auto'` (which degrades to `'throw'`) shipping, every policy value resolves to
 * the same behaviour, so precedence is not observable from the seam yet. It is
 * built as declared forward-compat for `unknown-signer-interactive`, which adds
 * `'ask'`. The plumbing is therefore unit-tested HERE, at the stack itself,
 * rather than claimed as behaviour at the seam.
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
