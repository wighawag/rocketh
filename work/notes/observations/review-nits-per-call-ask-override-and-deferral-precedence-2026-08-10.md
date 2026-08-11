---
title: review-gate non-blocking nits for 'per-call-ask-override-and-deferral-precedence' (Gate 2 approve)
date: 2026-08-10
status: open
reviewOf: per-call-ask-override-and-deferral-precedence
needsAnswers: true
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'per-call-ask-override-and-deferral-precedence' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- The stack doc still asserts an invariant this commit falsified: unknownSignerPolicy.ts says the Promise.all frame leak can only make a concurrent action throw where it would have prompted, never the other way round, since a frame only ever forces throw. withUnknownSignerPolicy can now push 'ask' or 'auto', so the leak can now make a concurrent action PROMPT where it would have thrown. Should the paragraph (and the matching one in the package module JSDoc / ADR 0006) be corrected?
  (packages/rocketh/src/environment/unknownSignerPolicy.ts:28 - the JSDoc immediately above it was updated in this same commit, the invariant paragraph below was not)
- Ratify decision 1: the per-call override shipped as a WRAPPER exported from @rocketh/unknown-signer (withUnknownSignerPolicy) rather than an onUnknownSigner field on deploy/execute/tx, which spec story 8 phrased as a call option. Consequence: a user who wants only the override installs the package named after catchUnknownSigner, and the override is written around the call rather than inside it. Accept, or move it to core later?
  (work/notes/observations/decisions-per-call-ask-override-and-deferral-precedence-2026-08-11.md decision 1; spec story 8 says via a call option; task acceptance said via the existing scoped policy-frame stack, which the wrapper satisfies)
- Ratify decision 3, and consider documenting it for users: an override written INSIDE catchUnknownSigner wins (frames are LIFO), yet documentation.md still states flatly that catchUnknownSigner always takes the throw path whatever the ambient policy, with no nesting caveat. The caveat currently lives only in the module JSDoc and the decisions note.
  (documentation.md line ~524; packages/rocketh-unknown-signer/src/index.ts module JSDoc; test 'lets an inner explicit override win over an outer one')
- Ratify decision 2: the wrapper's parameter is the whole UnknownSignerPolicy union, so 'auto' is accepted per call, while the README, documentation.md and the changeset only ever show 'ask' and 'throw'. Is the 'auto' per-call meaning (use this run's capability-aware default for one call) intended public surface, and should it be documented?
  (WithUnknownSignerPolicyFunction takes UnknownSignerPolicy; decisions note item 2)
- The new documentation.md subsection was inserted mid-narrative, so the deployment address-recovery paragraphs delivered by the previous task now render UNDER the heading 'Choosing the policy for ONE call' rather than under the interactive-policy section they belong to. Should the new subsection move after that block?
  (documentation.md: new #### heading sits between the pause-answers list and 'A DEPLOYMENT from an unsignable from pauses and asks in exactly the same way')
