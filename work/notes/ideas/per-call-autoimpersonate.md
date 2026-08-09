# Idea: per-call `autoImpersonate` on deploy/execute

Status: incubating (do NOT promote until both directions below are resolved together).

## What

Allow `autoImpersonate` to be overridden per extension call, e.g.
`deploy(name, args, {autoImpersonate: false})` / `execute(deployment, {autoImpersonate: ...})`,
instead of only the run/chain-level global flag.

## Why (use cases)

- **Mixed test (US5 mixed):** global `autoImpersonate: true` (impersonate whales/other
  named accounts) BUT throw for a specific Safe call so the unknown-signer path can be
  asserted — in the same run, without wrapping. Not expressible today with a single
  global boolean.
- Symmetric: global off, but impersonate for one call in a test.

## Two directions, must be resolved TOGETHER before promoting

1. **`autoImpersonate: false` per call (de-impersonate this call).** Global eagerly
   impersonates at env init (`environment/index.ts:414`); a per-call `false` means the
   broadcast seam must, for THIS call, skip the impersonated signer and route to the
   `onUnknownSigner` policy. This is the SAME "opt this call out of its resolved signer →
   apply unknown-signer policy" override mechanism that `catchUnknownSigner` uses
   (the env policy-override stack). Relatively cheap.
2. **`autoImpersonate: true` per call (lazy-impersonate this call).** Requires deferring
   impersonation from eager env-init to broadcast time (impersonate the account NOW, for
   this tx). More work; changes when impersonation happens. Unresolved.

## Why parked (not in Spec 1)

Committing only direction (1) would leave a lopsided API (`false` works, `true` doesn't).
Resolving (2) needs a decision on eager-vs-lazy impersonation timing. Until both are
designed together this stays an idea so it doesn't force `needsAnswers` onto the clean M1
core spec.

## For now

Mixed-case US5 is covered WITHOUT this by run-level `autoImpersonate: false`.
The truly-mixed unwrapped case waits for this idea to resolve.

CORRECTION (2026-08-09): this note previously also claimed a `catchUnknownSigner`-wrapped
call forces the throw "even under global impersonate" via the policy-override stack. That is
FALSE, and it is the drift that bounced the first `unknown-signer-core` task set. The frame
forces `throw` over `ask`; it never overrides impersonation, because an impersonated account
is signable and the seam consults the frame only for genuinely unsignable accounts. See
`docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md`.

## Related

- `work/notes/ideas/simulate-high-friction-signers.md` — an adjacent idea (let the node stand in
  for a genuine but high-friction signer, e.g. a hardware wallet, on a fork). It looks like a
  third direction of this note but is deliberately kept separate: its account set is known at
  CONFIG time, so it does not need the eager-vs-lazy impersonation decision that parks
  direction 2 here.
- Spec `unknown-signer-core` (the policy-override stack this would reuse).
- The orthogonality decision: `autoImpersonate` (node capability) ⟂ `onUnknownSigner`
  (throw/ask policy).
