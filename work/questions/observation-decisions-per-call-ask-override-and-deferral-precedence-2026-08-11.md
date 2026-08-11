<!-- dorfl-sidecar: item=observation:decisions-per-call-ask-override-and-deferral-precedence-2026-08-11 type=observation slug=decisions-per-call-ask-override-and-deferral-precedence-2026-08-11 allAnswered=false -->

Item: [`observation:decisions-per-call-ask-override-and-deferral-precedence-2026-08-11`](../notes/observations/decisions-per-call-ask-override-and-deferral-precedence-2026-08-11.md)

## Q1

**Ratify decision 1: is adding a new public export `withUnknownSignerPolicy` in `@rocketh/unknown-signer` (wrapper form, minor bump) the accepted shape for the per-call override — rather than an `onUnknownSigner` option threaded through deploy/execute/executeByName/tx or a method on `Environment`?**

> Decision 1 in the note. User-visible new API surface; alternatives (a) options-field in four packages, (b) `env.withUnknownSignerPolicy` method were rejected on the grounds that a wrapper reuses the existing `push/popUnknownSignerPolicy` frame stack and requires no `@rocketh/core` type change. Landing this decision commits the package to a wrapper-shaped override permanently.

_Suggested default: Accept as-is: wrapper in `@rocketh/unknown-signer`, minor bump, README + `documentation.md` updated._

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Accept as-is.** The wrapper form (`withUnknownSignerPolicy` exported from `@rocketh/unknown-signer`, minor bump) is the ratified shape for the per-call override. It reuses the existing `push/popUnknownSignerPolicy` frame stack and needs no `@rocketh/core` type change, which the alternatives (an `onUnknownSigner` field threaded through four packages, or a method on `Environment`) both would. The accepted cost stands as recorded: the override is written AROUND a call, and a user who wants only the override installs the package named after `catchUnknownSigner`.

## Q2

**Ratify decision 2: should `withUnknownSignerPolicy` accept the full `UnknownSignerPolicy` union including `'auto'`, rather than the narrower `'throw' | 'ask'` the task text literally names?**

> Decision 2. Rationale: frames carry `UnknownSignerPolicyFrame.policy` (the full union), and `'auto'` scoped to one call is the only way to opt one call back to the capability-aware default under a run-level `'throw'`. Narrowing here would fork the vocabulary from the config key's.

_Suggested default: Accept the full union; keep parity with the frame type and the config key._

<!-- q2 fields: id=q2 -->

**Your answer** (write below this line):

**Accept the full union**, `'auto'` included. A frame carries `UnknownSignerPolicyFrame.policy`, which is the whole union, and narrowing here would fork the vocabulary from the config key's for no gain. `'auto'` scoped to one call ("use this run's capability-aware default for this call") is the only way to opt one call back out of a run-level `'throw'` without deciding for it.

## Q3

**Ratify decision 3 (precedence): an EXPLICIT `withUnknownSignerPolicy('ask', ...)` written inside a `catchUnknownSigner` block WINS over the outer defer frame (innermost frame decides) — is this the intended user-facing contract, and is documenting it in module JSDoc + the LIFO test sufficient, or does it warrant an ADR?**

> Decision 3. The deferral guarantee is about the AMBIENT policy only; a reader might reasonably expect `catchUnknownSigner` to be inviolable. Alternative (sticky/absolute catch frame) was rejected because it forks the single precedence rule.

_Suggested default: Accept LIFO-wins; keep documentation in module JSDoc + the 'inner explicit override wins' test; no separate ADR required._

<!-- q3 fields: id=q3 -->

**Your answer** (write below this line):

**Accept LIFO-wins**; module JSDoc plus the "lets an inner explicit override win over an outer one" test is sufficient documentation, and no separate ADR is needed. One correction to make while this is fresh, since it is user-facing: `documentation.md:574` still states flatly that "`catchUnknownSigner` always takes the throw path, whatever the ambient policy", with no nesting caveat — that sentence now understates the contract being ratified here and should gain the caveat.
