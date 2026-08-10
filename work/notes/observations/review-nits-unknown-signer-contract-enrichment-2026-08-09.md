---
title: review-gate non-blocking nits for 'unknown-signer-contract-enrichment' (Gate 2 approve)
date: 2026-08-09
status: open
reviewOf: unknown-signer-contract-enrichment
needsAnswers: true
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'unknown-signer-contract-enrichment' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Ratify the mechanism choice: metadata is THREADED into the private broadcastTransaction (new second parameter origin) rather than caught-and-rethrown in broadcastExecution. Rationale is recorded in a JSDoc at the choice site, which CLAIM-PROTOCOL accepts, but the done record (the task file) moved with zero content changes and the commit body is one line, so nothing links to it.
  (packages/rocketh/src/environment/index.ts:918-938; git show --stat shows work/tasks/{ready to done}/unknown-signer-contract-enrichment.md changed 0 lines. Task acceptance criterion says 'recorded in the done record with its rationale'.)
- Ratify a new, unspecified refusal-avoidance behaviour: when fromAddressToNamedABIOrNull throws (ABI selector conflict across two deployments at one address) the enrichment swallows it and emits logger.warn, leaving name absent. The task only specified the null case. Users on a conflicting address now see a new warning line on every unknown-signer throw.
  (packages/rocketh/src/environment/index.ts:988-995, covered by the test 'still surfaces the UnknownSignerError when the name lookup cannot resolve' and by work/notes/observations/fromaddresstonamedabiornull-can-throw-2026-08-09.md.)
- Ratify a cross-task/user-visible surface decision: execute now sends contract metadata on EVERY broadcastExecution call, not only on the error path, and contract is a public option on the Environment interface that is never validated against the calldata. Any caller (including @rocketh/proxy and @rocketh/diamond, which route through execute) can declare a method/args pair that does not match data, and the error message would name it.
  (packages/rocketh-read-execute/src/index.ts:167-183; packages/rocketh-core/src/types.ts:713-727. Impact is presentation-only (to and data are still printed verbatim), which is why this is a ratification and not a block.)
- Coherence nit: the new private parameter is named origin, but origin already means something else in this same module, the originating ADDRESS of a pending transaction. Consider callOrigin, or pin the second meaning.
  (packages/rocketh/src/environment/index.ts:938 (origin?: {contract?}) vs 879 / 1084 / 1140 / 1173 (transaction.origin = from address).)
- The observation note flags a sibling unguarded call site (read's retry path calls fromAddressToNamedABIOrNull inside a catch, where a throw would mask the original decode error) and correctly fences it out of scope, but no follow-up task exists for it. Confirm the note is the intended resting place.
  (work/notes/observations/fromaddresstonamedabiornull-can-throw-2026-08-09.md; packages/rocketh-read-execute/src/index.ts:~284.)
- Second instance of the shape 'acceptance criterion asks for the done record, agent records it only in code'. The same nit was raised on unknown-signer-broadcast-seam. Worth generalising (make the done-move append the rationale) rather than re-flagging per task.
  (work/notes/observations/review-nits-unknown-signer-broadcast-seam-2026-08-09.md line 22.)
