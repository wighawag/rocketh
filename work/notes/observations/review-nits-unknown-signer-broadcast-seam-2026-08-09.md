---
title: review-gate non-blocking nits for 'unknown-signer-broadcast-seam' (Gate 2 approve)
date: 2026-08-09
status: open
reviewOf: unknown-signer-broadcast-seam
needsAnswers: false
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'unknown-signer-broadcast-seam' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Ratify: an unbalanced pop (more pops than pushes) is a silent no-op rather than a throw. The task did not specify this; the rationale given is that a mis-nested wrapper must not abort a run from inside a finally where it would mask the real error. Reasonable, but it is a new refusal-vs-tolerate choice and it means a leaked/duplicated pop in the future catchUnknownSigner is undetectable.
  (packages/rocketh/src/environment/unknownSignerPolicy.ts pop() + its JSDoc; unit-tested in packages/rocketh/test/unknownSignerPolicy.test.ts (treats an unbalanced pop as a no-op))
- Ratify: onUnknownSigner is left OPTIONAL on the RESOLVED ChainConfig type, unlike its sibling autoImpersonate which is required there. The stated reason (keep exactly one home for the 'auto' default, in resolveExecutionParams, so absent is distinguishable from an explicit chain-level 'auto') is sound, but it makes the resolved chain-config type inconsistent with how every neighbouring switch is modelled and it is a core-type shape all packages see.
  (packages/rocketh-core/src/types.ts ChainConfig.onUnknownSigner (with its comment) vs ChainConfig.autoImpersonate; passthrough in packages/rocketh/src/environment/chains.ts)
- Ratify the out-of-fence edit and its cross-task fallout: the diff also edits packages/rocketh-test-utils/test/createTestEnvironment.test.ts (six tests) and ships a @rocketh/test-utils patch changeset for a test-only change. The fix itself looks right (those tests broadcast from a bare-address named account the mock node never listed in eth_accounts, i.e. genuinely unsignable), but the underlying interaction is recorded only as an observation note, not in a Decisions block: createTestEnvironment defaults nodeAccounts to [], so every later harness-using task (unknown-signer-integration-scenarios, deploy-unsignable-deployer-reaches-seam, the migrate-\* chores) must now declare nodeAccounts or hit UnknownSignerError.
  (work/notes/observations/harness-tests-broadcast-from-non-node-accounts.md; .changeset/unknown-signer-broadcast-seam.md; task fence in work/tasks/done/unknown-signer-broadcast-seam.md (Files this task owns))
- Heads-up for the next task in the chain: pushUnknownSignerPolicy / popUnknownSignerPolicy are now REQUIRED members of the core Environment interface, but the legacy createMockEnvironment returns its object literal via an 'as unknown as Environment' cast, so it typechecks while lacking both methods at runtime. unknown-signer-package's catchUnknownSigner calls them, so a test written against the legacy mock would fail with a runtime not-a-function rather than a compile error.
  (packages/rocketh-core/src/types.ts (Environment interface additions) vs packages/rocketh-test-utils/src/index.ts:618 (as unknown as Environment))
- Acceptance criterion asks that the Signer union's members be enumerated where the seam branches AND named in the PR/done record. The code side is done well (an exhaustive switch over signerOnly/wallet/remote with the meanings spelled out), but the done record was moved with zero content changes and the commit body is a single line, so the union enumeration exists only as a code comment.
  (packages/rocketh/src/environment/index.ts signer.type switch; git diff shows work/tasks/{ready to done}/unknown-signer-broadcast-seam.md changed 0 lines)

## Applied answers 2026-08-11

### q1: What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).

**Ratified - all findings in this note are accepted as-is; no reversal.** The task this reviews is in `work/tasks/done/`, so none of these block anything.

Ratified: the unbalanced pop as a silent no-op (a mis-nested wrapper must not abort a run from inside a `finally`, where it would mask the real error), and `onUnknownSigner` staying OPTIONAL on the resolved `ChainConfig` so "absent" remains distinguishable from an explicit chain-level `'auto'`.

The fourth finding is now DEAD: the legacy `createMockEnvironment` it warns about (typechecking through `as unknown as Environment` while lacking the two new required methods at runtime) has been removed from `@rocketh/test-utils`. The `nodeAccounts` interaction it flags is likewise spent, since every downstream harness-using task has landed.

Keep the note until the residue above is either acted on or judged not worth acting on; it is the only record of these choices outside the code.
