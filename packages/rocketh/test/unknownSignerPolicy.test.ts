import {describe, it, expect} from 'vitest';

import {
	createUnknownSignerPolicyStack,
	describeDeferralRepeatExecution,
	describeUnknownSignerCapabilityDegradation,
	resolveUnknownSignerBehaviour,
} from '../src/environment/unknownSignerPolicy.js';

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

	/**
	 * `scopedPolicy()` answers the one question `effective()` cannot: did a WRAPPER ask
	 * for this, or is it the run's own policy? A run-level `'throw'` and a
	 * `catchUnknownSigner`-scoped `'throw'` are indistinguishable through `effective()`
	 * and mean opposite things about whether the run stops.
	 */
	it('distinguishes a scoped policy from the resolved global', () => {
		const stack = createUnknownSignerPolicyStack('throw');
		expect(stack.scopedPolicy()).toBeUndefined();
		expect(stack.effective()).toBe('throw');

		stack.push({policy: 'throw'});
		expect(stack.scopedPolicy()).toBe('throw');

		stack.pop();
		expect(stack.scopedPolicy()).toBeUndefined();
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

/**
 * The note that explains a DEGRADATION. Same truth table as above, read for the
 * question "did this run want to ask and find it could not?", which is the only
 * case worth explaining to a user.
 */
describe('describeUnknownSignerCapabilityDegradation', () => {
	it('explains the degradation when `auto` or `ask` cannot reach a human', () => {
		for (const policy of ['auto', 'ask'] as const) {
			const note = describeUnknownSignerCapabilityDegradation(policy, {canPromptForText: false});
			expect(note).toBeDefined();
			// names what WOULD have happened, and the three ways to be in this situation
			expect(note).toContain('PAUSED');
			expect(note).toContain('--skip-prompts');
			expect(note).toContain('terminal');
		}
	});

	/** Nothing degraded: the interactive path is about to run, so there is nothing to explain. */
	it('says nothing when the run can ask', () => {
		for (const policy of ['auto', 'ask', 'throw'] as const) {
			expect(describeUnknownSignerCapabilityDegradation(policy, {canPromptForText: true})).toBeUndefined();
		}
	});

	/**
	 * The quiet path. An explicit `'throw'` is what `catchUnknownSigner` scopes, and a
	 * user who chose the defer workflow is not surprised by getting it: advertising a
	 * prompt they turned off would be noise on the one path meant to stay silent.
	 */
	it('says nothing for an explicit `throw`, capability or not', () => {
		expect(describeUnknownSignerCapabilityDegradation('throw', {canPromptForText: false})).toBeUndefined();
		expect(describeUnknownSignerCapabilityDegradation('throw', {canPromptForText: true})).toBeUndefined();
	});
});

/**
 * The note warning that the SAME transaction comes back on the next run. Its content
 * is pinned here rather than only at the seam because the exact diagnosis is the whole
 * point of the note: "the run stopped before the completion was recorded" is
 * deferral-specific, while "you forgot a guard" is true of every unguarded call and
 * would misdiagnose the run-once script that did everything right.
 */
describe('describeDeferralRepeatExecution', () => {
	const unscoped = {scopedPolicy: undefined};

	it('warns on a run-level throw, naming the abort rather than a missing guard', () => {
		const note = describeDeferralRepeatExecution('throw', unscoped);
		expect(note).toBeDefined();
		// the CAUSE: the run stopped before the script's completion could be recorded
		expect(note).toContain('STOPPED');
		expect(note).toContain('return true');
		expect(note).toContain('migration');
		// the CONSEQUENCE: the same transaction again, and twice may not be harmless
		expect(note).toContain('SAME transaction again');
		expect(note).toContain('twice');
		// it must NOT blame the author for not guarding the step
		expect(note).not.toMatch(/guard/i);
	});

	/** The two sentences are ONE story: the note ends by pointing at the way out. */
	it('points at the stale-hash paste as the remedy', () => {
		const note = describeDeferralRepeatExecution('throw', unscoped)!;
		expect(note).toContain('paste the hash');
		expect(note).toContain('freshness check');
		expect(note).toContain('EARLIER run');
	});

	/** Repo rule, and this text is user-visible output. */
	it('contains no em dash', () => {
		expect(describeDeferralRepeatExecution('throw', unscoped)).not.toContain('\u2014');
	});

	/**
	 * THE QUIET PATH, and the asymmetry this note inherits from the degradation one: a
	 * SCOPED `'throw'` is what `catchUnknownSigner` pushes, and that script keeps running,
	 * so telling it the run stopped would be both noise and false.
	 */
	it('says nothing when a scoped frame asked for `throw`', () => {
		expect(describeDeferralRepeatExecution('throw', {scopedPolicy: 'throw'})).toBeUndefined();
	});

	/**
	 * A scoped `'ask'` or `'auto'` degraded to a throw by the capability ceiling is NOT
	 * that: nobody opted into handling the deferral, and the run halts like any other.
	 */
	it('still warns when a scoped `ask` or `auto` was degraded to a throw', () => {
		expect(describeDeferralRepeatExecution('throw', {scopedPolicy: 'ask'})).toBeDefined();
		expect(describeDeferralRepeatExecution('throw', {scopedPolicy: 'auto'})).toBeDefined();
	});

	/** Nothing stops on the interactive path: it pauses, and the prompt says the rest. */
	it('says nothing when the run is about to ask', () => {
		for (const scopedPolicy of [undefined, 'throw', 'ask', 'auto'] as const) {
			expect(describeDeferralRepeatExecution('ask', {scopedPolicy})).toBeUndefined();
		}
	});
});
