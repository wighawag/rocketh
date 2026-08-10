---
needsAnswers: true
---

# Decisions taken while building `per-call-ask-override-and-deferral-precedence` (2026-08-11)

Recorded here because each is user-visible, adds public API surface, or shapes how a later slice reads the policy precedence, and the task body (which the runner moves) is not mine to edit. Decisions 1-4 also carry a JSDoc at their choice site in `packages/rocketh-unknown-signer/src/index.ts`.

## 1. NEW PUBLIC API: the per-call override is a WRAPPER, `withUnknownSignerPolicy`, in `@rocketh/unknown-signer`

`withUnknownSignerPolicy(env)(policy, action)` pushes a policy frame for the duration of one action, returns what the action returned and propagates what it threw. The spec's story 8 asked for "a call option"; this is a call-SITE option rather than a field in an options bag, and the task pinned the mechanism ("the existing scoped policy-frame stack rather than a new mechanism"), which a wrapper is and an options field is not. Alternatives considered: (a) an `onUnknownSigner` option on `deploy` / `execute` / `executeByName` / `tx` — rejected because the same decision would then live in four packages, each threading it separately down to the single choke point, and "which of the four wins" would become a second precedence rule beside the frame stack; (b) a method on the `Environment` interface (`env.withUnknownSignerPolicy(...)`) — rejected because `pushUnknownSignerPolicy` / `popUnknownSignerPolicy` are already on that interface, so a wrapper needs no core type change, and `@rocketh/core` types are the surface every package depends on. What it touches: `@rocketh/unknown-signer`'s public exports (a `minor`), the package README, and the "Handling unknown signers" section of `documentation.md`. Cost accepted: the override is written AROUND a call rather than inside it, and a user who wants only the override installs the package named after `catchUnknownSigner`.

## 2. It accepts the WHOLE `UnknownSignerPolicy` union, `'auto'` included

The task says "force the interactive policy or the throw policy"; the signature takes `UnknownSignerPolicy`, i.e. `'throw' | 'ask' | 'auto'`, because that is what a frame carries (`UnknownSignerPolicyFrame.policy`) and narrowing it here would be a second, smaller vocabulary for the same concept. `'auto'` scoped to one call means "use the capability-aware default for this call", which is the only way to opt one call back OUT of a run-level `'throw'` without deciding for it. Alternative considered: restricting the parameter to `'throw' | 'ask'` (rejected: an arbitrary refusal that would have to be re-litigated the moment anyone wants the default back for one call, and it would make the wrapper's vocabulary differ from the config key's). What it touches: nothing else today; a future policy value is automatically accepted here, which is the intent.

## 3. USER-VISIBLE: frames nest LIFO, so an EXPLICIT override written inside `catchUnknownSigner` wins over the wrapper's frame

The deferral guarantee (a wrapped action never prompts) is about the AMBIENT policy. A script that writes `catchUnknownSigner(env)(() => withUnknownSignerPolicy(env)('ask', ...))` gets a prompt, because the innermost frame decides — the pre-existing stack semantics, pinned since the core slice by `unknownSignerPolicy.test.ts` ("nests frames LIFO"), and now reachable from user code for the first time. Alternative considered: making the `catchUnknownSigner` frame sticky/absolute (rejected: it would fork the one precedence rule into "some frames are stronger than others", and it would silence an override the same author deliberately wrote one line down). Recorded because a reader could reasonably expect `catchUnknownSigner` to be inviolable. Documented in the module JSDoc and pinned by the test "lets an inner explicit override win over an outer one".

## 4. The thunk guard is shared, and its message now names the wrapper you actually called

`assertIsThunk` takes the wrapper's name and the corrected call shape, so a promise passed to `withUnknownSignerPolicy` is told to write `withUnknownSignerPolicy(env)('ask', () => execute(...))` rather than being pointed at `catchUnknownSigner`. Same refusal as before, same reason (a promise has already started before the frame can be pushed), no loosening: the type rejects the promise form and the runtime guard names the fix. Both wrappers now also share ONE push/pop site (`runUnderPolicyFrame`), so the two cannot drift into different scoping rules and the `finally` that keeps the throw path balanced exists once.

## 5. Test technique worth reusing: asserting the ABSENCE of the pause, not just the error

For the capability ceiling, "it threw `UnknownSignerError`" is NOT a discriminating assertion: a run that enters the interactive path and then fails there also throws `UnknownSignerError`, because the resolver degrades a prompt it cannot use to the defer path. The new tests therefore assert that the run never showed the human the `... is PAUSED` presentation. Verified by mutation: removing the capability check from `resolveUnknownSignerBehaviour` leaves the older ceiling tests green and turns these red. The same gap in the sibling tests written by `ask-policy-interactive-resolver` is captured separately in `work/notes/observations/capability-ceiling-tests-survive-a-removed-ceiling-2026-08-11.md`.
