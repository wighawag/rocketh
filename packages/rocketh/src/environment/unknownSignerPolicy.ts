import type {UnknownSignerPolicy, UnknownSignerPolicyFrame} from '@rocketh/core/types';

/**
 * The unknown-signer POLICY FRAME STACK.
 *
 * The effective policy at the broadcast seam is `top-of-stack?.policy ?? resolvedGlobal`,
 * where the global comes from `onUnknownSigner` (execution param > chain config > `'auto'`).
 * A frame is pushed by a scoped wrapper (`catchUnknownSigner` in
 * `@rocketh/unknown-signer`) so its wrapped action reliably receives the error instead of,
 * once `'ask'` lands, popping an interactive prompt at a user who already said they would
 * handle it.
 *
 * WHAT A FRAME DOES NOT DO: it never turns a signable account into a throw. The seam
 * consults this stack only INSIDE its `unsignable` branch, so a `local` / `node` /
 * `impersonated` account broadcasts identically whether or not a frame is pushed
 * (ADR 0006 — this is the distinction that bounced an earlier task set).
 *
 * DYNAMIC SCOPE INVARIANT: this is a single stack per environment, not a per-action
 * context, which is sound because rocketh runs deploy scripts SEQUENTIALLY (one await at
 * a time), so at most one scoped action is in flight. A user who runs `Promise.all` of
 * two actions inside one wrapper leaks the frame to the concurrent action. That is
 * harmless while every policy value resolves to `throw`, and is recorded as a known
 * limitation in ADR 0006 rather than enforced here.
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
