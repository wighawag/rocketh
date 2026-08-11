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

## Decisions

_Transcribed from `work/notes/observations/decisions-per-call-ask-override-and-deferral-precedence-2026-08-11.md`, deleted in the same commit. That note predated the protocol rule (synced 2026-08-11) that gives a builder's rationale exactly ONE home: a `## Decisions` block in the done record. The rationale is reproduced unchanged below, followed by the human's ratification._

_Decisions taken while building `per-call-ask-override-and-deferral-precedence` (2026-08-11)_

Recorded here because each is user-visible, adds public API surface, or shapes how a later slice reads the policy precedence, and the task body (which the runner moves) is not mine to edit. Decisions 1-4 also carry a JSDoc at their choice site in `packages/rocketh-unknown-signer/src/index.ts`.

### 1. NEW PUBLIC API: the per-call override is a WRAPPER, `withUnknownSignerPolicy`, in `@rocketh/unknown-signer`

`withUnknownSignerPolicy(env)(policy, action)` pushes a policy frame for the duration of one action, returns what the action returned and propagates what it threw. The spec's story 8 asked for "a call option"; this is a call-SITE option rather than a field in an options bag, and the task pinned the mechanism ("the existing scoped policy-frame stack rather than a new mechanism"), which a wrapper is and an options field is not. Alternatives considered: (a) an `onUnknownSigner` option on `deploy` / `execute` / `executeByName` / `tx` — rejected because the same decision would then live in four packages, each threading it separately down to the single choke point, and "which of the four wins" would become a second precedence rule beside the frame stack; (b) a method on the `Environment` interface (`env.withUnknownSignerPolicy(...)`) — rejected because `pushUnknownSignerPolicy` / `popUnknownSignerPolicy` are already on that interface, so a wrapper needs no core type change, and `@rocketh/core` types are the surface every package depends on. What it touches: `@rocketh/unknown-signer`'s public exports (a `minor`), the package README, and the "Handling unknown signers" section of `documentation.md`. Cost accepted: the override is written AROUND a call rather than inside it, and a user who wants only the override installs the package named after `catchUnknownSigner`.

### 2. It accepts the WHOLE `UnknownSignerPolicy` union, `'auto'` included

The task says "force the interactive policy or the throw policy"; the signature takes `UnknownSignerPolicy`, i.e. `'throw' | 'ask' | 'auto'`, because that is what a frame carries (`UnknownSignerPolicyFrame.policy`) and narrowing it here would be a second, smaller vocabulary for the same concept. `'auto'` scoped to one call means "use the capability-aware default for this call", which is the only way to opt one call back OUT of a run-level `'throw'` without deciding for it. Alternative considered: restricting the parameter to `'throw' | 'ask'` (rejected: an arbitrary refusal that would have to be re-litigated the moment anyone wants the default back for one call, and it would make the wrapper's vocabulary differ from the config key's). What it touches: nothing else today; a future policy value is automatically accepted here, which is the intent.

### 3. USER-VISIBLE: frames nest LIFO, so an EXPLICIT override written inside `catchUnknownSigner` wins over the wrapper's frame

The deferral guarantee (a wrapped action never prompts) is about the AMBIENT policy. A script that writes `catchUnknownSigner(env)(() => withUnknownSignerPolicy(env)('ask', ...))` gets a prompt, because the innermost frame decides — the pre-existing stack semantics, pinned since the core slice by `unknownSignerPolicy.test.ts` ("nests frames LIFO"), and now reachable from user code for the first time. Alternative considered: making the `catchUnknownSigner` frame sticky/absolute (rejected: it would fork the one precedence rule into "some frames are stronger than others", and it would silence an override the same author deliberately wrote one line down). Recorded because a reader could reasonably expect `catchUnknownSigner` to be inviolable. Documented in the module JSDoc and pinned by the test "lets an inner explicit override win over an outer one".

### 4. The thunk guard is shared, and its message now names the wrapper you actually called

`assertIsThunk` takes the wrapper's name and the corrected call shape, so a promise passed to `withUnknownSignerPolicy` is told to write `withUnknownSignerPolicy(env)('ask', () => execute(...))` rather than being pointed at `catchUnknownSigner`. Same refusal as before, same reason (a promise has already started before the frame can be pushed), no loosening: the type rejects the promise form and the runtime guard names the fix. Both wrappers now also share ONE push/pop site (`runUnderPolicyFrame`), so the two cannot drift into different scoping rules and the `finally` that keeps the throw path balanced exists once.

### 5. Test technique worth reusing: asserting the ABSENCE of the pause, not just the error

For the capability ceiling, "it threw `UnknownSignerError`" is NOT a discriminating assertion: a run that enters the interactive path and then fails there also throws `UnknownSignerError`, because the resolver degrades a prompt it cannot use to the defer path. The new tests therefore assert that the run never showed the human the `... is PAUSED` presentation. Verified by mutation: removing the capability check from `resolveUnknownSignerBehaviour` leaves the older ceiling tests green and turns these red. The same gap in the sibling tests written by `ask-policy-interactive-resolver` is captured separately in `work/notes/observations/capability-ceiling-tests-survive-a-removed-ceiling-2026-08-11.md`.

### Ratification (2026-08-11 observation triage)

**Accept as-is.** The wrapper form (`withUnknownSignerPolicy` exported from `@rocketh/unknown-signer`, minor bump) is the ratified shape for the per-call override. It reuses the existing `push/popUnknownSignerPolicy` frame stack and needs no `@rocketh/core` type change, which the alternatives (an `onUnknownSigner` field threaded through four packages, or a method on `Environment`) both would. The accepted cost stands as recorded: the override is written AROUND a call, and a user who wants only the override installs the package named after `catchUnknownSigner`.

**Accept the full union**, `'auto'` included. A frame carries `UnknownSignerPolicyFrame.policy`, which is the whole union, and narrowing here would fork the vocabulary from the config key's for no gain. `'auto'` scoped to one call ("use this run's capability-aware default for this call") is the only way to opt one call back out of a run-level `'throw'` without deciding for it.

**Accept LIFO-wins**; module JSDoc plus the "lets an inner explicit override win over an outer one" test is sufficient documentation, and no separate ADR is needed. One correction to make while this is fresh, since it is user-facing: `documentation.md:574` still states flatly that "`catchUnknownSigner` always takes the throw path, whatever the ambient policy", with no nesting caveat — that sentence now understates the contract being ratified here and should gain the caveat.
