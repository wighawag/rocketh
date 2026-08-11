---
title: review-gate non-blocking nits for 'deploy-unsignable-deployer-reaches-seam' (Gate 2 approve)
date: 2026-08-09
status: open
reviewOf: deploy-unsignable-deployer-reaches-seam
needsAnswers: false
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'deploy-unsignable-deployer-reaches-seam' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Ratify: a deterministic deploy from an UNSIGNABLE deployer can now cause on-chain side effects before the error surfaces. With the pre-guard gone, getCreate2Factory runs first: if the factory is missing it broadcasts the pre-signed factory-deployment raw tx (type raw, which bypasses the seam entirely), and if the factory deployer is under-funded it first tries a 21000-gas value transfer FROM the Safe, so the first UnknownSignerError the user sees is a funding transfer, not their deployment. Previously the guard stopped all of this. This looks correct and the idempotent re-run loop absorbs it, but it is a user-visible consequence recorded nowhere (not in the changeset, the JSDoc, or the observation note).
  (packages/rocketh-deploy/src/index.ts:150-186 (funding tx via env.broadcastExecution from params.address, then the raw factory tx) reached from the deterministic branch at :430-437; the seam only throws for type object, packages/rocketh/src/environment/index.ts:939-947.)
- Coverage: the funding-tx-first branch above is untested because the harness answers eth_getBalance with 1000 ETH, so balance is never short. Both deterministic unsignable tests therefore always land on the create2 factory call. Worth one test pinning what a user sees when the factory deployer needs funding?
  (packages/rocketh-test-utils/src/test-environment.ts:258 (eth_getBalance default) vs packages/rocketh-deploy/test/unknown-signer-deployer.integration.test.ts asserting error.data.to is the create2 factory.)
- Ratify the semver choice: the changeset marks @rocketh/deploy minor, but for a deployer passed as a LITERAL address the thrown value changes type (plain Error with 'cannot get signer' to UnknownSignerError). Anyone matching on that message breaks. Minor matches the seam's own changeset, so this is consistency rather than an error, but it is a user-visible error contract change.
  (.changeset/deploy-unsignable-deployer-reaches-seam.md frontmatter '@rocketh/deploy': minor.)
- The observation note states ADR 0006 overstates the old blast radius (the pre-guard never fired for a NAMED bare-address Safe, only for a literal address). Verified as accurate against the code. The ADR sentence itself is left uncorrected, so the next reader of ADR 0006 still gets the wrong picture. Human decision: correct the ADR line or leave the note as the record?
  (work/notes/observations/deploy-preguard-never-fired-for-named-safe.md; confirmed at packages/rocketh/src/environment/index.ts:414-427 (named bare-address accounts always get an addressSigners entry) and :475-486 (classifySigner).)

## Applied answers 2026-08-11

### q1: What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).

**Ratified - all findings in this note are accepted as-is; no reversal.** The task this reviews is in `work/tasks/done/`, so none of these block anything.

Two pieces of live residue recorded rather than fixed:

- With the pre-guard gone, a deterministic deploy from an unsignable deployer can cause on-chain side effects BEFORE the error surfaces (the create2-factory raw tx bypasses the seam entirely, and an under-funded factory deployer triggers a funding transfer from the Safe first). Accepted: the idempotent re-run loop absorbs it. It is user-visible and recorded nowhere else, so this note is that record.
- The funding-tx-first branch is untested because the harness answers `eth_getBalance` with 1000 ETH, so the balance is never short. Worth one test eventually; not blocking.

The ADR 0006 wording question is answered separately on `observation:deploy-preguard-never-fired-for-named-safe`.

Keep the note until the residue above is either acted on or judged not worth acting on; it is the only record of these choices outside the code.
