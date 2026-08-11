---
title: review-gate non-blocking nits for 'impersonation-unsupported-hint-and-web-guidance' (Gate 2 approve)
date: 2026-08-11
status: open
reviewOf: impersonation-unsupported-hint-and-web-guidance
needsAnswers: true
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'impersonation-unsupported-hint-and-web-guidance' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Ratify (already conductor-ratified at the 2026-08-11 requeue, recorded as Decision 1): the hint is not message-only. It adds an exported optional field autoImpersonation with the literal union 'attempted' | 'not-a-candidate' to UnknownSignerErrorData in @rocketh/core, so a third outcome later widens a published union a strict downstream switch may already be exhaustive over. Keep the typed field?
  (packages/rocketh-core/src/errors.ts:31-51; decisions note section 1; changeset marks @rocketh/core minor)
- Ratify (already conductor-ratified, recorded as Decision 2): 'attempted' is inferred from the candidate set at the call site rather than reported back by impersonateAccounts. Verified accurate today (the helper loops every address with a per-address try/catch and never early-returns), but it is a second source of truth. Accept the staleness risk, or make the helper return attempted-vs-succeeded?
  (packages/rocketh/src/environment/index.ts:495-512 populates impersonationAttemptedLower before the call; helper at :112-142)
- Un-recorded cross-task interaction worth ratifying: the note now also appears in the INTERACTIVE prompt, because the 'ask' resolver passes unknownSignerError.message verbatim as details. That looks right (it explains why the human is being asked, and matches the standing invariant that the interactive path shows the message rather than a summary), but it is a user-visible change to another task's surface that no decisions entry mentions.
  (packages/rocketh/src/environment/index.ts:1140-1148 details: unknownSignerError.message)
- Wording nit in the 'attempted' note: the parenthetical says only a fork or dev node such as anvil or hardhat implements that RPC, but this same value also covers a node that DOES implement it and REFUSED the account, which the suite explicitly tests. The leading clause (the node did not accept it) is true; the parenthetical could mislead a user who is already on a fork. The JSDoc gets this right (does not implement that RPC, or refused).
  (packages/rocketh-core/src/errors.ts:72-76 vs test 'says impersonation was attempted when the node refused it' in packages/rocketh/test/impersonation-hint.test.ts)

## Applied answers 2026-08-11

### q1: What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).

**Ratified - all findings in this note are accepted as-is; no reversal.** The task this reviews is in `work/tasks/done/`, so none of these block anything.

Decisions 1 (the typed `autoImpersonation?: 'attempted' | 'not-a-candidate'` field on `UnknownSignerErrorData`) and 2 (`'attempted'` inferred from the candidate set at the call site) were already conductor-ratified at the 2026-08-11 requeue; this confirms them and accepts their stated costs, including that a future third outcome widens a published union, and that the call-site inference is a second source of truth (the fix, if `impersonateAccounts` ever early-returns, is to have the helper return `{attempted, succeeded}`, not to patch the call site).

Live residue: the wording nit stands. The parenthetical in `packages/rocketh-core/src/errors.ts` implies only a fork or dev node implements that RPC, while the same value also covers a node that implements it and REFUSED, which the suite explicitly tests. The JSDoc already gets this right. Worth a one-line correction next time that file is touched.

Keep the note until the residue above is either acted on or judged not worth acting on; it is the only record of these choices outside the code.
