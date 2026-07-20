---
title: Unknown Signer — Core (catchUnknownSigner + throw seam)
slug: unknown-signer-core
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. Technical detail has been tasked and relocated: build detail lives in the tasks under `work/tasks/` for slug `unknown-signer-core`; durable rationale lives in `docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md`.

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
  does. This is ORTHOGONAL to `autoImpersonate` and does NOT replace or absorb it. In this
  spec only `'throw'` (and `'auto'` degrading to throw, since no interactive resolver exists
  yet) is delivered; the `'ask'` interactive value ships in the `unknown-signer-interactive`
  spec.
- A new package `@rocketh/unknown-signer` exporting the curried `catchUnknownSigner(env)`
  that wraps an action, catches `UnknownSignerError`, prints the tx to execute, and returns
  its description — with EXACT v1 parity: it persists nothing.

The Safe/multisig workflow this enables is exactly v1's: print the tx → user executes it in
their Safe (or wherever) out-of-band → user re-runs the idempotent script → on-chain state
check sees the change and skips the step. No Safe-specific code exists in this spec (none
existed in v1 either); Safe is just one instance of an unsignable `from`.

See `docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md` for the durable
rationale on the single-choke-point seam, the orthogonality of `autoImpersonate` and
`onUnknownSigner`, and the no-persistence stance.

## User Stories

1. As a deployer whose proxy owner is a Safe, I want a proxy upgrade whose `from` is that
   Safe to surface the exact upgrade tx instead of failing, so I can execute it on my Safe.
2. As a deployer, I want to wrap such a call in `catchUnknownSigner(...)` so the run does not
   halt on the unknown signer, and I get the tx description returned to me.
3. As a deployer, I want `catchUnknownSigner` to return `{from, to?, value?, data?}` on a
   caught unknown signer (and `null` when the action succeeded), identical to v1, so my v1
   scripts port with only the import changing.
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
9. As a test author in a fork/dev where impersonation is ON, I want to force the throw for a
   specific wrapped call: wrapping in `catchUnknownSigner` forces the `throw` policy for that
   action even under a global `auto`/impersonate default, so I can assert the deferred tx.
10. As a v1 user migrating, I want a wrapped call to behave like v1 (throw → catch → print →
    return, no waiting, no persistence) regardless of the new default, so migration is safe.
11. As a CI/non-interactive user, I want `onUnknownSigner: 'auto'` to resolve to `throw`
    (never prompt/hang), because no interactive resolver is available.

## Out of Scope

- The interactive "pause and ask for tx hash" resolver and the `'ask'` policy value →
  `unknown-signer-interactive`.
- v1→v2 migration validation against real Aave V3 / Marcelo patterns, Timelock-in-path,
  return-shape/`{persist}` migration guarantees → `unknown-signer-migration-and-patterns`.
- Safe proposal emitter, MultiSend batching, `external`/`safe` signer protocol, a persisted
  unsigned-tx batch file, signing-page launcher → `explore-unknown-signer-adapters`.
- Per-call `autoImpersonate` override (both `false`/`true` directions) →
  `work/notes/ideas/per-call-autoimpersonate.md` (parked until both directions resolve).
- `autoImpersonate` is deliberately UNTOUCHED by this spec (kept as the existing standalone
  boolean); the two settings stay orthogonal.
