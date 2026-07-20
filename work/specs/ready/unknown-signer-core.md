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
  does. This is ORTHOGONAL to `autoImpersonate` (see Implementation Decisions) and does NOT
  replace or absorb it. In this spec only `'throw'` (and `'auto'` degrading to throw, since
  no interactive resolver exists yet) is delivered; the `'ask'` interactive value ships in
  the `unknown-signer-interactive` spec.
- A new package `@rocketh/unknown-signer` exporting the curried `catchUnknownSigner(env)`
  that wraps an action, catches `UnknownSignerError`, prints the tx to execute, and returns
  its description — with EXACT v1 parity: it persists nothing.

The Safe/multisig workflow this enables is exactly v1's: print the tx → user executes it in
their Safe (or wherever) out-of-band → user re-runs the idempotent script → on-chain state
check sees the change and skips the step. No Safe-specific code exists in this spec (none
existed in v1 either); Safe is just one instance of an unsignable `from`.

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

### Autonomy notes

No open questions — every story is resolved and agent-taskable. Omitting `humanOnly` and
`needsAnswers`. This is the committed M1 slice: one confidence tier, fully taskable.

`autoImpersonate` is deliberately UNTOUCHED by this spec (kept as the existing standalone
boolean). Per-call `autoImpersonate` override is explicitly out of scope (see
`work/notes/ideas/per-call-autoimpersonate.md`).

## Implementation Decisions

- **`UnknownSignerError` in `@rocketh/core`** (small, additive core change): payload
  `{from, to?, data?, value?, contract?: {name, method, args}}`, mirroring v1's `errors.ts`.
- **Throw site = the single `broadcastTransaction` choke point** in `rocketh/environment`.
  When the resolved `from` has no real signer AND the effective policy is `throw`, throw
  `UnknownSignerError` populated from the tx object (enrich with `contract{name,method,args}`
  when the call came via `execute`). No changes to deploy/execute/proxy code.
- **`autoImpersonate` and `onUnknownSigner` are ORTHOGONAL.** `autoImpersonate` is a NODE
  CAPABILITY switch (impersonate unsignable named accounts IF the node supports it) resolved
  as today (execution-param > chain config > default false), and impersonation happens BEFORE
  the unknown-signer seam. If impersonation resolves the account, the seam never fires. Only
  when the account is genuinely unsignable (no local signer AND not impersonated) does
  `onUnknownSigner` apply. `onUnknownSigner` NEVER has an `impersonate` value; keep the two
  settings separate. `autoImpersonate` is unchanged by this spec.
- **`onUnknownSigner: 'throw' | 'auto'`** at run/chain level. `'auto'` = throw while no
  interactive resolver exists (interactive is a separate spec). Default `'auto'`.
- **`@rocketh/unknown-signer` package**, curried extension consistent with deploy/execute:
  `catchUnknownSigner(env)(action, options?) => Promise<null | {from,to?,value?,data?}>`.
  Catch `UnknownSignerError` → print v1-style details → return `{from,to,value,data}`; any
  other error rethrows; `null` when the action succeeds. PERSISTS NOTHING (exact v1 parity).
- **`catchUnknownSigner` forces `throw` for its wrapped action** via an env-level policy
  override consulted by the broadcast seam. Implement as a PUSH/POP STACK on the environment
  (e.g. `_unknownSignerPolicyStack`): push `'throw'` on enter, pop in `finally`; the seam
  reads top-of-stack (override) before falling back to the global `onUnknownSigner`. This is
  dynamic-scope and safe because rocketh executes deploy scripts sequentially (single-await),
  so no concurrent conflicting scopes. This same mechanism will later back a per-call override.
- **Throw semantics**: the throw unwinds the wrapped action, so ONE `catchUnknownSigner` call
  captures exactly ONE deferred tx (the first unsignable one). Multi-step deferral = one
  `catchUnknownSigner` per step (as Aave-style scripts already do). Document this.
- **NO `.unsigned_transactions.json`** in this spec. Nothing is persisted; idempotency is
  purely on-chain-state-driven (as in v1). A persisted batch, if ever built, belongs with a
  CONSUMER in `explore-unknown-signer-adapters`, not here.

## Testing Decisions

- Seam: `createMockEnvironment` (`@rocketh/test-utils`) + a Safe-governed proxy upgrade flow
  as the headline test (impl deploys signed by deployer; upgrade `from = Safe` is caught).
- Assert: (a) unwrapped unsignable call throws `UnknownSignerError`; (b) wrapped call returns
  `{from,to,value,data}` and continues the surrounding script; (c) return is `null` on
  success; (d) transaction-agnostic — same behaviour for raw tx / deploy / execute / value
  transfer from an unsignable `from`; (e) mixed run: signable broadcast, unsignable caught;
  (f) idempotent re-run: after on-chain state changes (simulate the Safe executing), the
  re-run skips the completed step and does not re-throw; (g) `autoImpersonate: false` routes
  a named unsignable account to the seam; (h) `catchUnknownSigner` forces throw even under a
  global impersonate/auto default (the push/pop override).
- Nothing about persistence to assert (there is none). Integration tests double as docs.

## Out of Scope

- The interactive "pause and ask for tx hash" resolver and the `'ask'` policy value →
  `unknown-signer-interactive`.
- v1→v2 migration validation against real Aave V3 / Marcelo patterns, Timelock-in-path,
  return-shape/`{persist}` migration guarantees → `unknown-signer-migration-and-patterns`.
- Safe proposal emitter, MultiSend batching, `external`/`safe` signer protocol, a persisted
  unsigned-tx batch file, signing-page launcher → `explore-unknown-signer-adapters`.
- Per-call `autoImpersonate` override (both `false`/`true` directions) →
  `work/notes/ideas/per-call-autoimpersonate.md` (parked until both directions resolve).

## Further Notes

- v1 reference: `../hardhat-deploy-v1/src/helpers.ts:2556` (`catchUnknownSigner`),
  `:1797` (the `unknown` fallback), `errors.ts:4` (`UnknownSignerError`).
- rocketh seam: `packages/rocketh/src/environment/index.ts:825` (`broadcastTransaction`),
  `:401-406` (where leftover addresses currently become `remote`).
- v1 has NO Safe handler: its `gnosis` "protocol" (`helpers.ts:1789`) is just a private-key
  wallet, identical to `privatekey`. The Safe workflow in v1 is entirely
  print-execute-manually + idempotent re-run. This spec ports exactly that.
