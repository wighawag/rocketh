---
title: Unknown Signer — v1 Migration & Real-Pattern Validation (Aave V3 / Marcelo)
slug: unknown-signer-migration-and-patterns
taskedAfter: [unknown-signer-core]
needsAnswers: true
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked — they move into tasks/ADRs and this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

<!-- open-questions -->
## Open questions

These block auto-tasking. They require deployment-pattern specifics from the external teams
(Aave V3 and the Marcelo cohort: Odyssey / Metronome / Vesper) that are NOT derivable from
either the rocketh or hardhat-deploy-v1 codebases. Answer, then clear `needsAnswers`.

1. **Governance shape.** For each team's upgrades: is the proxy owned directly by a Safe, or
   by a ProxyAdmin owned by a Safe, or does a Timelock sit between Safe and ProxyAdmin
   (Safe → Timelock → ProxyAdmin → proxy)? This determines WHO the deferred tx is addressed
   to (raw upgrade vs `Timelock.schedule`/`execute`).
2. **Proxy type.** Transparent-via-ProxyAdmin, UUPS, or EIP173/other? Determines the exact
   upgrade call caught (`upgrade`/`upgradeAndCall` on admin vs `upgradeTo(AndCall)` on proxy).
3. **Batching expectation.** Do they execute multiple upgrades as one Safe MultiSend tx, or
   one Safe tx per upgrade? (Affects only validation here; the MultiSend EMITTER itself is in
   `explore-unknown-signer-adapters`.)
4. **Post-upgrade init/migration ordering.** Are there init/migration calls that must be in
   the same batch as the upgrade, with ordering constraints between them?
5. **Reference scripts.** Links or snapshots of the actual Aave V3 / Marcelo deploy scripts
   (or the minimal above facts) so the validation tests reflect real patterns, not plausible
   ones. Validation means testing against the PATTERNS these teams use (tested directly by us),
   not their participation.
<!-- /open-questions -->

## Problem Statement

M2: stabilise the v1→v2 path around the new unknown-signer implementation and validate it
against the real deployment patterns of the Aave V3 and Marcelo cohorts. Two needs:

1. A team using `deployments.catchUnknownSigner` on v1 must be able to move to v2 with
   minimal, well-documented change — and where behaviour differs, an explicit path.
2. The implementation must be proven against the multi-step, Safe-governed upgrade patterns
   these teams actually use (potentially including a Timelock in the governance path), via
   tests we run directly.

## Solution

- **Migration guarantees**: v1 return-shape parity for `catchUnknownSigner`
  (`{from,to?,value?,data?}` | `null`); documented mapping of v1 named "owner" accounts to
  rocketh accounts; and — if any new side effect is ever introduced downstream — a v1-exact
  mode to opt out of it. (The core spec already persists nothing, so v1 parity is the
  DEFAULT today; this spec formalises and tests the guarantee and documents the migration.)
- **Timelock-in-path support** (confirmed a logical requirement even absent team specifics):
  when governance routes Safe → Timelock → admin, the deferred/surfaced tx must target the
  Timelock's `schedule`/`execute` appropriately rather than the raw upgrade.
- **Real-pattern validation test matrix** encoding the multi-step Safe-governed upgrade flows
  (see Testing Decisions), gated on the open-question specifics.

## User Stories

1. As a team on v1, I want my `await catchUnknownSigner(deploy(...))` scripts to behave
   identically on v2 (throw → print → return the same shape, no waiting), changing only the
   import, so migration is low-risk.
2. As a migrating team, I want documentation mapping how my v1 named owner accounts and proxy
   `{owner, methodName/execute}` options translate to rocketh, and what (if anything) differs.
3. As a team using a Safe → ProxyAdmin governance path, I want a multi-proxy upgrade run (many
   proxies behind one Safe-owned admin) to surface exactly N deferred upgrade txs, all
   `from = safe`, correctly, so I can execute them.
4. As a team using a Safe → Timelock → admin path, I want the surfaced tx to target the
   Timelock (schedule/execute) so my governance flow is honoured.
5. As a team with a mixed run, I want signable deploys to broadcast and only the Safe/Timelock
   calls to be surfaced, with deployment state consistent.
6. As a team, I want an idempotent re-run BEFORE governance executes to re-produce the same
   surfaced set without double-broadcasting the signable deploys.
7. As a team, I want an idempotent re-run AFTER governance executes to detect the on-chain
   change and skip the completed upgrade with no throw.
8. As a team transferring ProxyAdmin ownership to a Safe (governance handoff), I want the
   `transferOwnership` step and all subsequent upgrades to defer correctly to the Safe.

## Autonomy notes

`needsAnswers: true` — the open questions above must be answered (they need external-team
pattern specifics) before tasking, so the validation tests reflect real patterns. Ordered
`taskedAfter: [unknown-signer-core]`. Omitting `humanOnly`.

## Implementation Decisions

- **Return-shape parity** for `catchUnknownSigner` is a hard compatibility promise: the four
  fields (`from,to,value,data`) and the `null`-on-success behaviour are byte-identical in
  meaning to v1; any additional fields are strictly additive.
- **v1-exact opt-out**: only meaningful if a downstream feature adds a side effect (e.g. the
  batch emitter in the adapters spec). Since core persists nothing, the DEFAULT is already
  v1-exact; formalise this so the adapters spec's persistence remains opt-in.
- **Timelock support**: detect/allow a Timelock in the governance path so the surfaced tx is
  the Timelock operation, not the raw upgrade. Exact shape depends on open-question answers.

## Testing Decisions

Pattern matrix (integration tests = docs), gated on the open-question answers:
1. Single Safe-governed proxy upgrade (impl signed; upgrade deferred).
2. Multi-step upgrade in one run (N proxies, one Safe-owned admin → N deferred txs, ordered,
   deduped).
3. Mixed run (signable + Safe-only interleaved).
4. Idempotent re-run before governance executes (same set, no double-broadcast).
5. Idempotent re-run after governance executes (on-chain change detected, batch/step empties).
6. ProxyAdmin ownership handoff (transferOwnership → subsequent upgrades defer).
7. Timelock-in-path (Safe → Timelock → admin) surfaces the Timelock operation.
8. A ported v1 script asserted to behave identically (return shape, no waiting).

## Out of Scope

- The interactive resolver → `unknown-signer-interactive`.
- Safe API proposal, MultiSend batch EMITTER, `external`/`safe` protocol, persisted batch
  file → `explore-unknown-signer-adapters`.
- The core seam/`catchUnknownSigner` itself → `unknown-signer-core`.

## Further Notes

- The rocketh proxy upgrade path already routes through the owner account
  (`packages/rocketh-proxy/src/index.ts:288`, `:519-545`) exactly as v1 does — so the
  unknown-signer seam covers it without proxy changes. Timelock support is the main new
  surface area here.
