import type {UnknownSignerPolicy, UnknownSignerPolicyFrame} from '@rocketh/core/types';

/**
 * The unknown-signer POLICY FRAME STACK.
 *
 * The effective policy at the broadcast seam is `top-of-stack?.policy ?? resolvedGlobal`,
 * where the global comes from `onUnknownSigner` (execution param > chain config > `'auto'`).
 * A frame is pushed by a scoped wrapper in `@rocketh/unknown-signer`: `catchUnknownSigner`
 * pushes `'throw'`, so its wrapped action reliably receives the error instead of popping an
 * interactive prompt at a user who already said they would handle it, and
 * `withUnknownSignerPolicy` pushes whatever policy the caller chose for one action. Both go
 * through this one stack, so precedence is a single rule (innermost frame, else the
 * resolved global) rather than one rule per wrapper. What a frame ASKS for is still bounded
 * by capability: {@link resolveUnknownSignerBehaviour} degrades `'ask'` to `'throw'` where
 * the run cannot reach a human, so an override can never make a run interactive that has no
 * way to be.
 *
 * WHAT A FRAME DOES NOT DO: it never turns a signable account into a throw. The seam
 * consults this stack only INSIDE its `unsignable` branch, so a `local` / `node` /
 * `impersonated` account broadcasts identically whether or not a frame is pushed
 * (ADR 0006 — this is the distinction that bounced an earlier task set).
 *
 * DYNAMIC SCOPE INVARIANT: this is a single stack per environment, not a per-action
 * context, which is sound because rocketh runs deploy scripts SEQUENTIALLY (one await at
 * a time), so at most one scoped action is in flight. A user who runs `Promise.all` of
 * two actions inside one wrapper leaks the frame to the concurrent action. Now that
 * `'ask'` exists that leak is REAL rather than theoretical, and it leaks in BOTH
 * DIRECTIONS: `catchUnknownSigner` pushes `'throw'`, so a concurrent action can get a
 * throw where it would have prompted, and `withUnknownSignerPolicy` can push `'ask'` or
 * `'auto'`, so a concurrent action can equally be PROMPTED where it would have thrown.
 * (An earlier version of this paragraph claimed the second direction was impossible
 * "since a frame only ever forces `throw`" — true only while `catchUnknownSigner` was
 * the sole thing that pushed a frame.) The capability ceiling still applies to the
 * leaked frame, so a run that cannot reach a human cannot be made to prompt by one.
 * It remains a known limitation recorded in ADR 0006 rather than enforced here.
 */
export type UnknownSignerPolicyStack = {
	/** Push a scoped override. ALWAYS pair with `pop` in a `finally`. */
	push(frame: UnknownSignerPolicyFrame): void;
	/**
	 * Pop the innermost frame. An unbalanced pop (more pops than pushes) is a caller
	 * bug, but it is a NO-OP rather than a throw: a mis-nested wrapper must not be able
	 * to abort a deploy run from inside a `finally`, where it would also mask the real
	 * error being propagated.
	 */
	pop(): void;
	/** `top-of-stack?.policy ?? resolvedGlobal`. */
	effective(): UnknownSignerPolicy;
};

/**
 * What the seam actually DOES once a policy is in force. `'auto'` is not one of
 * these: it is a request to pick, and picking is what
 * {@link resolveUnknownSignerBehaviour} does.
 */
export type UnknownSignerBehaviour = 'throw' | 'ask';

/**
 * Turn a policy into the behaviour this RUN can actually carry out.
 *
 * CAPABILITY IS A CEILING, NOT A DEFAULT (ADR 0007). `'auto'` picks `'ask'` where a
 * text prompt genuinely exists and `'throw'` where it does not, and an EXPLICIT
 * `'ask'` is bounded by the same ceiling: it degrades to `'throw'` rather than
 * hanging a run that has no way to reach a human. That is what makes a CI run
 * un-hangable even when a script hardcodes `'ask'`.
 *
 * The capability is passed IN rather than read here so this stays a pure function of
 * (policy, capability) — the two directions of the `'auto'` branch are then testable
 * without building an environment, and the seam keeps exactly one place that asks
 * `env.canPromptForText()`.
 */
export function resolveUnknownSignerBehaviour(
	policy: UnknownSignerPolicy,
	capabilities: {canPromptForText: boolean},
): UnknownSignerBehaviour {
	switch (policy) {
		case 'throw':
			return 'throw';
		case 'ask':
			return capabilities.canPromptForText ? 'ask' : 'throw';
		case 'auto':
			return capabilities.canPromptForText ? 'ask' : 'throw';
	}
	// Exhaustive over `UnknownSignerPolicy`: adding a value without a case fails to
	// compile here rather than silently resolving to `undefined` at the seam.
	const exhaustive: never = policy;
	throw new Error(`unhandled onUnknownSigner policy: ${exhaustive}`);
}

export function createUnknownSignerPolicyStack(resolvedGlobal: UnknownSignerPolicy): UnknownSignerPolicyStack {
	const frames: UnknownSignerPolicyFrame[] = [];
	return {
		push(frame: UnknownSignerPolicyFrame) {
			frames.push(frame);
		},
		pop() {
			frames.pop();
		},
		effective() {
			return frames[frames.length - 1]?.policy ?? resolvedGlobal;
		},
	};
}
