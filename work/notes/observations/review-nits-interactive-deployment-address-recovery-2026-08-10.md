---
title: review-gate non-blocking nits for 'interactive-deployment-address-recovery' (Gate 2 approve)
date: 2026-08-10
status: open
reviewOf: interactive-deployment-address-recovery
needsAnswers: true
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'interactive-deployment-address-recovery' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Ratify: the private choke point's second parameter changed from an optional bag to a REQUIRED discriminated union (BroadcastOrigin, execution|deployment). Intentional so a future funnel cannot reach the seam without declaring what it broadcasts. Confirmed no public surface change: broadcastTransaction is a module-private closure absent from the Environment interface, with exactly the two callers broadcastExecution/broadcastDeployment (grep across packages/*/src confirms).
  (packages/rocketh/src/environment/index.ts:80-85, 1011-1014, 1355, 1408; decisions note item 1)
- Ratify the new refusal on an unanswerable eth_getCode: an RPC error during the code check fails the deployment rather than being treated as no-code or as fine. It is the only one of the new refusals with NO test, and documentation.md lists the three other failure shapes but not this one. Worth a test plus one clause in the docs list.
  (requireDeployedContract catch branch, packages/rocketh/src/environment/index.ts:1319-1327; decisions note item 4; test file covers no-code, absent, zero-address, reverted only)
- Ratify: when an expectedAddress exists, the receipt's own contractAddress is ignored entirely, even when present and even if it is the zero address. Rationale (a factory receipt names the factory call, and the expected address is the one recorded) is sound and pinned by a test giving the receipt a different address, but it is a deliberate asymmetry a future reader could mistake for an oversight.
  (packages/rocketh/src/environment/index.ts:1315-1340; test 'confirms a deterministic deployment by code at the EXPECTED address'; decisions note item 3)
- Coherence: 'origin' now carries two meanings in the same module, the choke point's what-produced-this bag (new BroadcastOrigin) and PendingTransaction.transaction.origin, which is the SENDER address. Both predate/extend prior work and neither is pinned in CONTEXT.md. Consider adding a glossary entry before a third meaning appears.
  (BroadcastOrigin at index.ts:80-85 vs pendingDeployment.transaction.origin at index.ts:1418; self-flagged in decisions note item 6)
