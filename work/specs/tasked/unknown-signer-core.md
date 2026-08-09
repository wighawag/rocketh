---
title: Unknown Signer — Core (catchUnknownSigner + throw seam)
slug: unknown-signer-core
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked — they move into tasks/ADRs and this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

## Problem Statement

During a deploy, a privileged call (typically a proxy upgrade or admin action, but also a
raw tx or a deploy) can target an account the deployer key cannot sign for — e.g. an owner
that is a Safe multisig, a hardware wallet left unplugged, an air-gapped or cold key, or
any governance account signed out-of-band. Today rocketh has no first-class notion of an
"unsignable `from`": every leftover address is silently treated as `{type:'remote',
signer: provider}`, so such a tx just fails at `eth_sendTransaction` with an opaque error.

Users (matching the grant request) need the v1 `catchUnknownSigner` behaviour: when a
privileged call cannot be signed locally, the framework should surface the exact tx to be
executed out-of-band, let the deploy continue, and rely on script idempotency so a later
re-run recognises the new on-chain state and proceeds. hardhat-deploy v1 has this; rocketh
does not.

## Solution

Introduce a single "unsignable `from`" seam and the v1-parity `catchUnknownSigner`:

- A shared `UnknownSignerError` (in `@rocketh/core`) carrying the tx a human/multisig must
  execute (`from`, `to?`, `data?`, `value?`, and `contract?: {name, method, args}` when the
  call originated from an `execute`).
- The error is thrown at the SINGLE transaction choke point (`broadcastTransaction`) when
  `from` has no available signer — so `deploy`, `execute`, `tx`, and the proxy upgrade path
  need no changes (they all funnel through it). This is where rocketh is cleaner than v1,
  which repeats the check in five places.
- A run/chain-level policy `onUnknownSigner: 'throw' | 'auto'` that decides what the seam
  does. This is ORTHOGONAL to `autoImpersonate` (see ADR 0006) and does NOT
  replace or absorb it. In this spec only `'throw'` (and `'auto'` degrading to throw, since
  no interactive resolver exists yet) is delivered; the `'ask'` interactive value ships in
  the `unknown-signer-interactive` spec.
- A new package `@rocketh/unknown-signer` exporting the curried `catchUnknownSigner(env)`
  that wraps an action, catches `UnknownSignerError`, prints the tx to execute, and returns
  its description — with EXACT v1 parity: it persists nothing.

  **It is deliberately OPTIONAL, and exists mainly for v1 migration.** It has to be written
  INTO the deploy script, so requiring it would tax every user; the defer-and-re-run loop must
  therefore work WITHOUT it (story 4). What wrapping adds is continuing past the deferred step
  within the SAME run, which only matters when later steps are independent of it. The direction
  of travel is `onUnknownSigner` doing the right thing by default — `'auto'` becoming
  interactive wherever a prompt exists (`unknown-signer-interactive`) — not more script-level
  wrapping.

The Safe/multisig workflow this enables is exactly v1's, minus the need to edit your script:
the tx is surfaced with everything needed to execute it → user executes it in their Safe (or
wherever) out-of-band → user re-runs the idempotent script → on-chain state check sees the
change and skips the step. No Safe-specific code exists in this spec (none
existed in v1 either); Safe is just one instance of an unsignable `from`.

## User Stories

1. As a deployer whose proxy owner is a Safe, I want a proxy upgrade whose `from` is that
   Safe to surface the exact upgrade tx instead of failing, so I can execute it on my Safe.
2. As a deployer, I want to wrap such a call in `catchUnknownSigner(...)` so the run does not
   halt on the unknown signer, and I get the tx description returned to me.
3. As a deployer, I want `catchUnknownSigner` to return `{from, to?, value?, data?}` on a
   caught unknown signer (and `null` when the action succeeded), identical to v1, so porting a
   v1 script is the import plus ONE mechanical call-shape change: the action is passed as a
   function (`() => execute(...)`) rather than an already-started promise, because a promise has
   begun executing before the wrapper can establish its policy scope. The RETURN is unchanged.
4. As a deployer, I want an UNWRAPPED privileged call to an unsignable `from` to HALT the run
   with a clear `UnknownSignerError` (not a raw RPC failure), so I notice and can wrap it.
5. As a deployer, I want the mechanism to be transaction-agnostic — it fires for a raw tx, a
   deploy, an execute, or a value transfer from an unsignable `from`, not only proxy upgrades.
6. As a deployer with a MIXED run (deployer-signable deploys + Safe-only calls), I want the
   signable ones to broadcast normally and only the unsignable ones to be caught/deferred.
7. As a deployer, I want to "do governance later": print the tx, continue past it (when
   wrapped), execute on the Safe on my own time, then re-run the idempotent script which
   recognises the new on-chain state and skips the completed step. (Idempotency comes from
   on-chain state, NOT from any persisted file — nothing is persisted by this spec.)
8. As a test author, I want to assert the unknown-signer path in a simple test: set
   `autoImpersonate: false` for the run (so the unsignable account is not impersonated) and
   assert `catchUnknownSigner` returns the expected tx / that an unwrapped call throws.
9. MOVED to `unknown-signer-interactive` (its story 8). "A wrapped call takes the throw path
   regardless of the ambient policy" is only observable once `'ask'` exists: this spec ships
   `'throw'` and `'auto'`, and `'auto'` degrades to `'throw'`, so the guarantee cannot be
   asserted by value here. The policy-frame MECHANISM is still built by this spec's seam task,
   as declared forward-compat. The number is retained rather than renumbered so that existing
   `covers:` references and the review history stay meaningful.
10. As a v1 user migrating, I want a wrapped call to BEHAVE like v1 (throw → catch → print →
    return, no waiting, no persistence) regardless of the new default, so migration is safe. The
    only intentional divergence is the call shape named in story 3, and it surfaces as a compile
    error rather than a silent behaviour change, so no migrated script can fail quietly.
11. As a CI/non-interactive user, I want `onUnknownSigner: 'auto'` to resolve to `throw`
    (never prompt/hang), because no interactive resolver is available.

### Autonomy notes

Agent-taskable; omitting `humanOnly` and `needsAnswers`. This is the committed M1 slice: one
confidence tier, fully taskable. The first tasking attempt was bounced by the acceptance gate
over the seam predicate, the `contract.name` source, and the original wording of story 9. Those
were answered (story 9 above is the corrected wording) and the resolutions live in
`docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md` and in the tasks.

`autoImpersonate` is deliberately UNTOUCHED by this spec (kept as the existing standalone
boolean). Per-call `autoImpersonate` override is explicitly out of scope (see
`work/notes/ideas/per-call-autoimpersonate.md`).

## Where the detail went

This spec has been tasked; its technical detail was trimmed one-time into the tasks and the
durable rationale into an ADR (nothing was lost).

- Decisions and their WHY: `docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md`.
- What to build: `test-env-harness` (chore), `unknown-signer-error-type`,
  `account-signability-classification`, `unknown-signer-broadcast-seam`,
  `deploy-unsignable-deployer-reaches-seam`, `unknown-signer-contract-enrichment`,
  `unknown-signer-package`, `unknown-signer-integration-scenarios`.

Test homes are split BY DESIGN, and the split shapes the task graph. `rocketh` must not depend on
`@rocketh/test-utils` (that closes an nx project-graph cycle once the harness makes test-utils
depend on `rocketh`), so tests for `rocketh` internals build a real environment locally, as
`packages/rocketh/test/addressSigners-casing.test.ts` does, while tests needing the extension
packages use the shared `createTestEnvironment` harness. Consequently `account-signability-classification`
and `unknown-signer-broadcast-seam` do NOT depend on `test-env-harness`; the set has three roots.
Migrating the existing tests onto the harness and removing the old fake are separate chores
(`migrate-deploy-and-read-tests`, `migrate-proxy-diamond-tests`, `remove-legacy-mock-environment`)
deliberately kept OFF this spec's critical path. See `CONTEXT.md` under _test environment_.

## Out of Scope

- The interactive "pause and ask for tx hash" resolver and the `'ask'` policy value →
  `unknown-signer-interactive`.
- v1→v2 migration validation against real Aave V3 / Marcelo patterns, Timelock-in-path,
  return-shape/`{persist}` migration guarantees → `unknown-signer-migration-and-patterns`.
- Safe proposal emitter, MultiSend batching, `external`/`safe` signer protocol, a persisted
  unsigned-tx batch file, signing-page launcher → `explore-unknown-signer-adapters`.
- Per-call `autoImpersonate` override (both `false`/`true` directions) →
  `work/notes/ideas/per-call-autoimpersonate.md` (parked until both directions resolve).
