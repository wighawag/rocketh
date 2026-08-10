---
title: 'Per-call policy override within capability, and the catchUnknownSigner deferral guarantee'
slug: per-call-ask-override-and-deferral-precedence
spec: unknown-signer-interactive
blockedBy: [interactive-deployment-address-recovery]
covers: [3, 8]
---

## What to build

Make the policy controllable AT THE CALL SITE, bounded by what the environment can actually do, and make the deferral guarantee assertable now that an interactive value exists.

Two closely-related behaviours, which is why they share a task:

1. **Per-call override.** A caller may force the interactive policy or the throw policy for one action, overriding the ambient run/chain policy, using the EXISTING scoped policy-frame mechanism rather than a new channel. The override may VARY the policy but only WITHIN environment capability: with no text prompt available, a request for the interactive policy degrades to throw. This is what keeps a rehearsal on a fork working (a prompt can be injected there) while CI stays un-hangable.
2. **The deferral guarantee.** `catchUnknownSigner` takes the THROW path regardless of the ambient policy. This was specified in the core spec (its story 9) but was NOT assertable then, because the core slice shipped only `throw` and `auto`-degrading-to-`throw`, so both values behaved identically and any test of it was necessarily tautological. With an interactive value in existence, the guarantee finally discriminates: an ambient interactive policy must NOT turn a wrapped `catchUnknownSigner` action into a prompt.

Together these deliver the rehearsal story: on a fork or dev environment, override toward the interactive policy for one call and drive it via an injected prompt, to see how production will play out before doing it for real.

## Acceptance criteria

- [ ] A per-call option can force the interactive policy or the throw policy for the duration of one action, implemented via the existing scoped policy-frame stack rather than a new mechanism.
- [ ] The override is bounded by capability: requesting the interactive policy with NO text prompt available degrades to throw, and never prompts or hangs. Tested.
- [ ] Precedence is tested with DISCRIMINATING cases, not merely present ones. Each test must be able to fail if the precedence regresses: assert a per-call override beating a run-level policy, and a run-level policy beating a chain-level policy, choosing values that actually differ in observable behaviour.
- [ ] `catchUnknownSigner` takes the THROW path even when the ambient policy is the interactive one, and the test proves it by asserting NO prompt was consulted (not merely that an error was thrown). This is the assertion the core slice could not write.
- [ ] The wrapped action's error is still the full, unwrapped deferral message, undegraded. The unwrapped throw is the PRIMARY deferral workflow, so the message is the deliverable.
- [ ] A rehearsal scenario is demonstrated end to end: a fork-shaped environment, an injected prompt, a per-call override toward the interactive policy, and the run continuing after a pasted hash (covers story 3).
- [ ] The policy is still consulted ONLY inside the `unsignable` branch of the choke point, and a signable account with any frame in force broadcasts exactly as before. Re-pin it here, since this task edits the precedence logic.
- [ ] Frame push and pop remain balanced across the throw path, so a thrown action cannot leave a frame stranded on the stack. Tested.
- [ ] Tests live in `packages/rocketh/test/` for the seam and precedence work, building a real environment locally with a mock provider. `catchUnknownSigner` tests belong with `@rocketh/unknown-signer`, which may use the shared harness.
- [ ] A changeset accompanies the change.
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass.

## Blocked by

- `interactive-deployment-address-recovery`: this task edits the same environment module and the same documentation section, so the ordering serialises those edits. It also depends transitively on the interactive policy value existing, since the deferral guarantee is only assertable once the two policy values differ observably.

## Prompt

> Goal: let a caller choose the unknown-signer policy for ONE action, within what the environment can actually do, and finally prove the guarantee that `catchUnknownSigner` always defers rather than prompting.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Confirm the scoped policy-frame stack still exists with the shape this task assumes, and confirm the interactive policy value and the capability predicate landed. If the earlier tasks solved per-call override already, route to needs-attention rather than building it twice.
>
> Why this task exists at all. The core spec's story 9 said `catchUnknownSigner` takes the throw path regardless of the ambient policy. That guarantee was UNTESTABLE in the core slice: both policy values resolved to throw, so the test written then could not fail, and the reviewer flagged it honestly as tautological in the recorded review nits. Your job includes replacing that tautology with a real assertion. Assert that no prompt was consulted, not merely that an error was thrown, because an error is thrown either way.
>
> Where to look. The scoped override mechanism is the policy FRAME stack pushed and popped on the environment (declared on the core `Environment` interface). The frame is deliberately an OBJECT rather than a bare policy string, specifically so a slice like this one can carry per-scope information without re-cutting the seam. `catchUnknownSigner` lives in `@rocketh/unknown-signer` and takes a THUNK, not v1's promise-or-thunk, because a promise has already started before the frame can be pushed; there is a compile error plus a runtime guard naming the fix, so do not loosen it.
>
> Capability is a CEILING, not a default. A per-call override may vary the policy, but it can never grant a capability the environment lacks: with no text prompt, the interactive policy degrades to throw. This is what keeps CI un-hangable even when a script author hardcodes an override, and it is the reason the check is per-CAPABILITY rather than "is a prompt object present" (the browser runtime ships a confirm stub that auto-confirms without asking anyone, so mere presence proves nothing).
>
> Invariants that still bind you, all landed and pinned by tests: the frame forces `throw` over the interactive value, NEVER over impersonation, and is consulted only inside the `unsignable` branch; `autoImpersonate` is a node capability resolved BEFORE the seam while `onUnknownSigner` is the policy afterwards, orthogonal, with no `impersonate` policy value; a pre-signed `raw` transaction returns before any signer lookup and never reaches the seam. ADR 0006 is the durable record, and this distinction drifted through three documents and bounced an entire task set once already, so do not re-derive it.
>
> Watch for unbalanced frames. A frame pushed for an action that then throws must still be popped. There is a prior note about an unbalanced pop being a documented no-op; make sure the throw path cannot strand a frame, and test it.
>
> Done means: a per-call override works and is capability-bounded, precedence is proven with cases that can actually fail, and `catchUnknownSigner` demonstrably defers without consulting a prompt even under an ambient interactive policy.
