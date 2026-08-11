<!-- dorfl-sidecar: item=observation:review-nits-migrate-deploy-and-read-tests-2026-08-10 type=observation slug=review-nits-migrate-deploy-and-read-tests-2026-08-10 allAnswered=false -->

Item: [`observation:review-nits-migrate-deploy-and-read-tests-2026-08-10`](../notes/observations/review-nits-migrate-deploy-and-read-tests-2026-08-10.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratified - all findings in this note are accepted as-is; no reversal.** The task this reviews is in `work/tasks/done/`, so none of these block anything.

Both deliberate assertion changes ratified as strengthenings (the idempotency test asserting `newlyDeployed === false` plus a stable address, and the retry test setting retry through config instead of poking `env.context`).

Live residue, in priority order:

1. The private-key snippet at `packages/rocketh-deploy/test/deploy.integration.test.ts:537-556` omits `signerProtocols: {privateKey}`. Integration tests are documentation in this repo, so a user copying it gets a thrown "protocol: privateKey is not supported". Worth fixing.
2. The "signs locally and sends raw" test would actually prove its claim with `not.toContain('eth_signTransaction')`.
3. The create2/create3 tests still assert only `toBeDefined()` though the dispatched transaction is now observable.

The multi-account example flagged in the same family has already been fixed: it now deploys from `user1` and `user2` and asserts each sender.

Keep the note until the residue above is either acted on or judged not worth acting on; it is the only record of these choices outside the code.
