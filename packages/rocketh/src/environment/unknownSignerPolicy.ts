import type {UnknownSignerPolicy, UnknownSignerPolicyFrame} from '@rocketh/core/types';

/**
 * The unknown-signer POLICY FRAME STACK.
 *
 * The effective policy at the broadcast seam is `top-of-stack?.policy ?? resolvedGlobal`,
 * where the global comes from `onUnknownSigner` (execution param > chain config > `'auto'`).
 * A frame comes from a scoped wrapper in `@rocketh/unknown-signer`: `catchUnknownSigner`
 * scopes `'throw'`, so its wrapped action reliably receives the error instead of popping an
 * interactive prompt at a user who already said they would handle it, and
 * `withUnknownSignerPolicy` scopes whatever policy the caller chose for one action. Both go
 * through this one stack, so precedence is a single rule (innermost frame, else the
 * resolved global) rather than one rule per wrapper.
 *
 * THIS STACK IS PRIVATE. Wrappers reach it through the environment's single
 * `runUnderUnknownSignerPolicy(frame, action)`, never through a push and a pop of their own,
 * so no caller can strand a frame and no caller depends on the storage being a stack. That
 * is what leaves room to replace it with a per-async-task context (`AsyncLocalStorage`,
 * `AsyncContext`) without changing `@rocketh/core`'s `Environment`. What a frame ASKS for is still bounded
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
 *
 * The fix is a scope that follows the ASYNC CAUSAL CHAIN instead of wall-clock time, so
 * that work started inside the wrapper inherits the frame and work started outside it does
 * not: `AsyncLocalStorage` on Node, `AsyncContext` when it ships for browsers. What used to
 * stand in the way was not the storage but the API, since `Environment` published a `push`
 * and a `pop`, and two independent verbs can only be backed by ambient state. It publishes
 * one scoping verb now, so that swap is a change to this file and its caller in
 * `environment/index.ts`, with no further change to `@rocketh/core`.
 */
export type UnknownSignerPolicyStack = {
	/**
	 * Push a scoped override. ALWAYS pair with `pop` in a `finally`.
	 *
	 * Module-internal: the only caller is the environment's `runUnderUnknownSignerPolicy`,
	 * which owns both ends of the pair. Nothing outside `rocketh` can reach this.
	 */
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

/**
 * The note explaining that this run WANTED to resolve interactively and could not.
 *
 * WHY THIS EXISTS. The documented main path for an unsignable `from` is that rocketh PAUSES
 * and lets you paste the hash of the transaction you executed out-of-band, and that is the
 * default. But the capability ceiling silently turns it into a plain throw wherever no human
 * can be reached, which is exactly CI and `--skip-prompts`, i.e. the first place most people
 * meet this error at all. Without this note the message describes a transaction to execute
 * and says nothing about the interactive resolution they read about, so the degradation looks
 * like the feature not existing.
 *
 * (No em dash in the message text: this repo forbids them in any output, source included.)
 *
 * Returns `undefined` when there is nothing to explain:
 * - the run CAN ask, so no degradation happened (the interactive path is taken instead); or
 * - the policy is an explicit `'throw'`, which includes every `catchUnknownSigner` action,
 *   since that wrapper scopes `'throw'`. Someone who asked for the defer workflow is not
 *   surprised to get it, and telling them about a prompt they deliberately turned off is
 *   noise on the one path that is meant to be quiet.
 *
 * Pure, for the same reason {@link resolveUnknownSignerBehaviour} is: both directions are
 * testable without building an environment.
 */
export function describeUnknownSignerCapabilityDegradation(
	policy: UnknownSignerPolicy,
	capabilities: {canPromptForText: boolean},
): string | undefined {
	if (capabilities.canPromptForText) return undefined;
	if (policy === 'throw') return undefined;
	return (
		`Note: with a terminal attached, rocketh would have PAUSED here rather than failing: it prints the ` +
		`transaction above, waits while you execute it under its own authority (a Safe, a hardware wallet, ` +
		`a governance contract), then takes back the transaction hash so this same run can continue. That ` +
		`is the default behaviour of 'onUnknownSigner'.\n` +
		`This run has no way to ask a human for text, so it threw instead. That is the case when stdin is not ` +
		`a terminal (CI, a piped shell), when '--skip-prompts' was passed, or in a runtime with no text prompt ` +
		`(the browser). Re-run it from a terminal to resolve it interactively, or keep this behaviour and ` +
		`execute the transaction above out-of-band.`
	);
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
