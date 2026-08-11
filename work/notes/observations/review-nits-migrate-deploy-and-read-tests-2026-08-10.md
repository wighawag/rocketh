---
title: review-gate non-blocking nits for 'migrate-deploy-and-read-tests' (Gate 2 approve)
date: 2026-08-10
status: open
reviewOf: migrate-deploy-and-read-tests
needsAnswers: true
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'migrate-deploy-and-read-tests' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- The new private-key test's 'Usage in real scenario' snippet shows a config with accounts.deployer = a privateKey:0x... string but omits signerProtocols: {privateKey}. In production nothing registers that protocol (only the harness does), so a user copying the snippet gets a thrown 'protocol: privateKey is not supported', and the bare-66-char-key form silently fails to resolve the account. Integration tests are documentation in this repo, so the snippet should show the signerProtocols registration (or say the harness pre-registers it).
  (packages/rocketh-deploy/test/deploy.integration.test.ts:537-556 vs packages/rocketh/src/environment/index.ts:289-312 (both forms read userConfig.signerProtocols.privateKey) and packages/rocketh-test-utils/src/test-environment.ts:305-315 (harness registers it itself))
- Acceptance criterion 2 requires each changed assertion to be noted in the done record, but the commit body is empty, the changeset does not mention it, and the done task file landed unchanged. Two deliberate changes are only explained by inline comments: the idempotency test now asserts newlyDeployed === false plus a stable address, and the retry test now sets retry through config instead of poking env.context. Please ratify these two as intended (both look like strengthenings, not weakenings).
  (deploy.integration.test.ts:125-131; read.integration.test.ts:141-146; git log -1 body is empty and no Decisions block exists anywhere in the diff)
- The 'signs locally and sends raw' test comments that signing never touches the node, but only asserts eth_sendRawTransaction present / eth_sendTransaction absent. Adding not.toContain('eth_signTransaction') on the recorded node requests would actually prove that claim (the harness does mock eth_signTransaction, so today nothing distinguishes local signing from node signing).
  (packages/rocketh-deploy/test/deploy.integration.test.ts:575-583)
- The create2/create3 deterministic tests now run through the real deploy path but still only assert toBeDefined(). Now that the dispatched transaction is observable via provider.getRequests(), asserting the factory 'to' would make them meaningful. Pre-existing weakness, correctly left alone by a harness swap; noting as a cheap follow-up.
  (packages/rocketh-deploy/test/deploy.integration.test.ts:352-425)

## Applied answers 2026-08-11

### q1: What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).

**Ratified - all findings in this note are accepted as-is; no reversal.** The task this reviews is in `work/tasks/done/`, so none of these block anything.

Both deliberate assertion changes ratified as strengthenings (the idempotency test asserting `newlyDeployed === false` plus a stable address, and the retry test setting retry through config instead of poking `env.context`).

Live residue, in priority order:

1. The private-key snippet at `packages/rocketh-deploy/test/deploy.integration.test.ts:537-556` omits `signerProtocols: {privateKey}`. Integration tests are documentation in this repo, so a user copying it gets a thrown "protocol: privateKey is not supported". Worth fixing.
2. The "signs locally and sends raw" test would actually prove its claim with `not.toContain('eth_signTransaction')`.
3. The create2/create3 tests still assert only `toBeDefined()` though the dispatched transaction is now observable.

The multi-account example flagged in the same family has already been fixed: it now deploys from `user1` and `user2` and asserts each sender.

Keep the note until the residue above is either acted on or judged not worth acting on; it is the only record of these choices outside the code.
