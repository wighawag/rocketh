<!-- dorfl-sidecar: item=observation:review-nits-deploy-unsignable-deployer-reaches-seam-2026-08-09 type=observation slug=review-nits-deploy-unsignable-deployer-reaches-seam-2026-08-09 allAnswered=false -->

Item: [`observation:review-nits-deploy-unsignable-deployer-reaches-seam-2026-08-09`](../notes/observations/review-nits-deploy-unsignable-deployer-reaches-seam-2026-08-09.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratified - all findings in this note are accepted as-is; no reversal.** The task this reviews is in `work/tasks/done/`, so none of these block anything.

Two pieces of live residue recorded rather than fixed:

- With the pre-guard gone, a deterministic deploy from an unsignable deployer can cause on-chain side effects BEFORE the error surfaces (the create2-factory raw tx bypasses the seam entirely, and an under-funded factory deployer triggers a funding transfer from the Safe first). Accepted: the idempotent re-run loop absorbs it. It is user-visible and recorded nowhere else, so this note is that record.
- The funding-tx-first branch is untested because the harness answers `eth_getBalance` with 1000 ETH, so the balance is never short. Worth one test eventually; not blocking.

The ADR 0006 wording question is answered separately on `observation:deploy-preguard-never-fired-for-named-safe`.

Keep the note until the residue above is either acted on or judged not worth acting on; it is the only record of these choices outside the code.
