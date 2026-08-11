<!-- dorfl-sidecar: item=observation:review-nits-impersonation-unsupported-hint-and-web-guidance-2026-08-11 type=observation slug=review-nits-impersonation-unsupported-hint-and-web-guidance-2026-08-11 allAnswered=false -->

Item: [`observation:review-nits-impersonation-unsupported-hint-and-web-guidance-2026-08-11`](../notes/observations/review-nits-impersonation-unsupported-hint-and-web-guidance-2026-08-11.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratified - all findings in this note are accepted as-is; no reversal.** The task this reviews is in `work/tasks/done/`, so none of these block anything.

Decisions 1 (the typed `autoImpersonation?: 'attempted' | 'not-a-candidate'` field on `UnknownSignerErrorData`) and 2 (`'attempted'` inferred from the candidate set at the call site) were already conductor-ratified at the 2026-08-11 requeue; this confirms them and accepts their stated costs, including that a future third outcome widens a published union, and that the call-site inference is a second source of truth (the fix, if `impersonateAccounts` ever early-returns, is to have the helper return `{attempted, succeeded}`, not to patch the call site).

Live residue: the wording nit stands. The parenthetical in `packages/rocketh-core/src/errors.ts` implies only a fork or dev node implements that RPC, while the same value also covers a node that implements it and REFUSED, which the suite explicitly tests. The JSDoc already gets this right. Worth a one-line correction next time that file is touched.

Keep the note until the residue above is either acted on or judged not worth acting on; it is the only record of these choices outside the code.
