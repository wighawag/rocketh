<!-- dorfl-sidecar: item=observation:review-nits-unknown-signer-integration-scenarios-2026-08-10 type=observation slug=review-nits-unknown-signer-integration-scenarios-2026-08-10 allAnswered=false -->

Item: [`observation:review-nits-unknown-signer-integration-scenarios-2026-08-10`](../notes/observations/review-nits-unknown-signer-integration-scenarios-2026-08-10.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratified - all findings in this note are accepted as-is; no reversal.** The task this reviews is in `work/tasks/done/`, so none of these block anything.

Ratified: `viem` as a test-only devDependency of `@rocketh/unknown-signer` (post-hoc, but it is test-only and already ubiquitous here), and the lockfile importer cleanup.

Live residue, both cheap, and both about a file whose job is to be documentation:

1. Story 7's JSDoc claims the re-run's idempotency comes entirely from on-chain state, "not from anything rocketh wrote down". Only the UPGRADE skip is chain-derived; the v2 implementation DEPLOY is skipped because of the persisted deployment record. Narrow the claim.
2. The README's "Worked examples" points at `test/scenarios.integration.test.ts` "in this package", but `package.json` `files` is `[dist, src]`, so an npm reader does not have it. Use a GitHub link.

Keep the note until the residue above is either acted on or judged not worth acting on; it is the only record of these choices outside the code.
