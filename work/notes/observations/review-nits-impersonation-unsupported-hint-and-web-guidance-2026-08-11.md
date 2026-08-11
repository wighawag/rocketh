---
title: review-gate non-blocking nits for 'impersonation-unsupported-hint-and-web-guidance' (Gate 2 approve)
date: 2026-08-11
status: open
reviewOf: impersonation-unsupported-hint-and-web-guidance
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'impersonation-unsupported-hint-and-web-guidance' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Ratify the public API choice: the hint is not just message text, it also adds an exported field autoImpersonation with the literal union 'attempted' | 'not-a-candidate' to UnknownSignerErrorData in @rocketh/core. The task asked only that the error MESSAGE say so. Once shipped, consumers can branch on data.autoImpersonation and adding a third variant later widens a published union. Keep the typed field, or keep the note message-only?
  (packages/rocketh-core/src/errors.ts:33-48 (new optional field) plus .changeset marks @rocketh/core minor)
- Ratify: 'attempted' is inferred from the candidate set at the call site (every address in unknownAccounts is recorded as attempted BEFORE impersonateAccounts runs), not reported back by the helper. It is accurate today because the helper loops over every address with a per-address try/catch, but it is a second source of truth: if the helper ever early-returns or filters, the message would claim a send that never happened. Should the helper return attempted-vs-succeeded instead?
  (packages/rocketh/src/environment/index.ts:497-512 vs impersonateAccounts at :112-142)
- No Decisions record was found for this task (no ## Decisions in the done record, no work/notes/observations/decisions-*.md, unlike sibling tasks in this chain). The two ratification items above are exactly what that block exists to surface. Worth adding one note so they are discoverable.
  (work/tasks/done/impersonation-unsupported-hint-and-web-guidance.md is byte-identical to the backlog version (R100 rename); CLAIM-PROTOCOL.md:154)
- Discoverability nit: the note line is appended AFTER the data: line in buildMessage. For a deployment the data field is the full creation bytecode, so the hint can sit thousands of characters below the point a user stops reading. Consider placing the note before from:/to:/data:.
  (packages/rocketh-core/src/errors.ts:73-92)
- Small accuracy gap in the not-a-candidate wording and the docs: candidacy also requires the resolved signer to be remote (needsImpersonationForRun excludes signerOnly/wallet), so 'only NAMED accounts absent from eth_accounts' is slightly broader than the real rule. Unreachable at the seam (a local signer classifies as local and never gets there), so text-only.
  (packages/rocketh/src/environment/index.ts:471-486; documentation.md constraint 1)
