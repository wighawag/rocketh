---
needsAnswers: false
promotedFrom: observation:decisions-per-call-ask-override-and-deferral-precedence-2026-08-11
---

## What to build

A one-paragraph documentation correction in `documentation.md` around line 574, where the current text states flatly:

> `catchUnknownSigner` always takes the throw path, whatever the ambient policy

That sentence understates the now-ratified contract for the per-call override (`withUnknownSignerPolicy`, shipped in `@rocketh/unknown-signer`). The precedence rule is LIFO on the scoped policy-frame stack: an EXPLICIT `withUnknownSignerPolicy('ask', …)` written INSIDE a `catchUnknownSigner` block wins over the outer defer frame, because the innermost frame decides. This was ratified in the observation `decisions-per-call-ask-override-and-deferral-precedence-2026-08-11` (decision 3), pinned by the test named "lets an inner explicit override win over an outer one", and reflects the pre-existing stack semantics from `unknownSignerPolicy.test.ts` ("nests frames LIFO").

Edit the paragraph so the guarantee is stated as: `catchUnknownSigner` defers the throw path for the AMBIENT policy of its body — an inner explicit `withUnknownSignerPolicy` frame (which is itself the sanctioned per-call override) still wins, because frames nest LIFO. Keep the surrounding "Handling unknown signers" narrative intact; do not restructure the section.

Out of scope: any code change, any change to `@rocketh/unknown-signer` exports, any new ADR. Decisions 1 and 2 of the source observation were also ratified and require no artifact.

## Prompt

> Open `documentation.md` and locate the sentence near line 574 that reads "`catchUnknownSigner` always takes the throw path, whatever the ambient policy" (in the "Handling unknown signers" section). Rewrite that sentence — and only what is needed around it to keep the paragraph coherent — so it accurately reflects the LIFO precedence rule: `catchUnknownSigner` defers the throw path for its body's AMBIENT policy, but an EXPLICIT `withUnknownSignerPolicy(env)(policy, action)` frame written inside the block still wins, because the scoped policy-frame stack nests LIFO and the innermost frame decides. Cite the wrapper by name so a reader who wants the per-call override knows where it lives (`@rocketh/unknown-signer`, same package as `catchUnknownSigner`). Do not restructure the section, do not touch code, do not add a new ADR. When done: `pnpm format:check` and (if a docs build exists) `pnpm docs:build` to confirm the file still renders. Verify the corrected sentence against the ratified contract in `work/notes/observations/decisions-per-call-ask-override-and-deferral-precedence-2026-08-11.md` (decision 3) and against the test "lets an inner explicit override win over an outer one" in the `@rocketh/unknown-signer` test suite before committing.
