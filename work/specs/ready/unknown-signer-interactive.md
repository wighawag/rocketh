---
title: Unknown Signer — Interactive resolver (pause + ask for tx hash)
slug: unknown-signer-interactive
taskedAfter: [unknown-signer-core]
needsAnswers: true
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked — they move into tasks/ADRs and this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

## Problem Statement

`catchUnknownSigner` (the core spec) is the non-interactive, defer-and-re-run primitive:
it prints the tx and continues, and the user must re-run the script after executing on the
Safe. That works but is not the friendliest experience — it abandons the rest of the wrapped
action (the throw unwinds it), saves no deployment state, and forces a full re-run cycle.

For a deployer at a keyboard doing real governance, a better native experience is: when an
unsignable `from` is hit, PAUSE, show the tx details, let the user execute it out-of-band on
their Safe (or hardware wallet, air-gap, etc.), paste back the resulting tx hash, and have
the run CONTINUE in the same execution with deployment state saved — no re-run dance, and
multi-step actions proceed step-by-step in one guided run. This mirrors v1's `external`
protocol behaviour but is opt-in at the call/policy site rather than tied to an account, and
reuses the same `UnknownSignerError` seam rather than a special signer.

## Solution

Add an `'ask'` value to the `onUnknownSigner` policy and an interactive resolver over the
existing core seam:

- `onUnknownSigner: 'throw' | 'ask' | 'auto'`; `'auto'` now resolves to `'ask'` when an
  interactive capability (a `PromptExecutor`/TTY) is present, else `'throw'` (never hang CI).
- When the seam hits an unsignable `from` under `'ask'`, it PAUSES and shows the tx details,
  then offers: **paste the executed tx hash** (the run fetches the receipt, applies
  receipt-invariant checks, saves state, continues) OR **"cannot sign"** (which prints the
  full details like `catchUnknownSigner` and THROWS `UnknownSignerError`, degrading gracefully
  to the defer path).
- Because the resolver RESOLVES (returns) instead of throwing, execution stays inside the
  wrapped action — so a multi-step action pauses at each unsignable step and continues, all
  in one run.

Correctness backbone is the RECEIPT's own invariants, not a bespoke verification layer:
require `status === 1`; for a deployment require an address (from `receipt.contractAddress`,
or code at the known address for deterministic deploys) and FAIL LOUDLY if absent. No
caller-provided extra details are required.

## User Stories

1. As a deployer at a keyboard doing a real Safe-governed upgrade, I want the run to pause,
   show me the exact tx, let me execute it on my Safe, paste the hash, and continue — with the
   deployment state saved — so I do not need to re-run the script.
2. As a deployer, I want a multi-step governed action to pause at EACH unsignable step and
   continue after each hash, completing all steps in ONE run (unlike `catchUnknownSigner`
   which captures only the first and needs re-runs).
3. As a deployer on a fork/dev, I want to REHEARSE the interactive flow (US2b) — override the
   fork's default toward `'ask'` for a call and drive it via an injected prompt — so I can see
   how production will play out before doing it for real.
4. As a deployer, I want to answer "cannot sign" at the prompt, which prints the tx details
   and throws `UnknownSignerError`, so the interactive path degrades to the defer/v1 path
   (catchable by `catchUnknownSigner`).
5. As a CI/non-interactive user, I want `'auto'` (or `'ask'` with no prompt capability) to
   NOT prompt — it must degrade to `throw`/defer so CI never hangs.
6. As a deployer deferring a DEPLOYMENT interactively, I want the deployed address recovered
   from the pasted tx's receipt (or verified at the deterministic address), and the run to
   FAIL if the receipt lacks a success status or the expected address — so a wrong/failed
   hash cannot silently save a bad deployment.
7. As a test author, I want to test the interactive resolver WITHOUT a TTY by injecting a
   `PromptExecutor` that returns a canned hash (or "cannot sign"), so US2/US2b are testable.
8. As a deployer, I want a per-call ability to force `'ask'` (or `'throw'`) via a call option,
   overriding the ambient policy within what the environment supports (no prompt ⇒ cannot
   become interactive; degrades to throw). This story ALSO absorbs what was `unknown-signer-core`
   story 9 (`catchUnknownSigner` takes the throw path regardless of the ambient policy): that
   guarantee is only observable once `'ask'` exists, since the core slice ships only `'throw'`
   and `'auto'`-degrading-to-`'throw'`. The policy-frame mechanism it relies on is built by the
   core spec's seam task; this spec is where it becomes assertable.

## Open questions

One remaining, found by a spike on 2026-08-09 (the spike code was thrown away; its answers are
in Implementation Decisions). The spike's other finding — how the prompt capability reaches the
seam — was ANSWERED: hardhat must support `'ask'`, so the capability has to reach the
environment on both construction paths. That decision is recorded in Implementation Decisions
and materially widens this spec's scope, so read it before tasking.

1. **`PromptExecutor` is confirm-only and must be widened.** It is
   `prompt({type: 'confirm', name, message}) => {proceed: boolean}`. Pasting a tx hash needs a
   text prompt returning a string, so this is an additive CORE type change plus a new
   implementation in `@rocketh/node` (which uses `prompts`), not the pure reuse this spec
   originally claimed. Confirm the widening is acceptable, and that the browser executor
   (`@rocketh/web`) may legitimately not implement the text variant — in which case the
   capability check must be per-CAPABILITY, not merely "is there a PromptExecutor?".

## Autonomy notes

Ordered `taskedAfter: [unknown-signer-core]` because it extends the core seam
(`onUnknownSigner`, the policy frame stack) and the `catchUnknownSigner` primitive. That
ordering constraint is now SATISFIED: `unknown-signer-core` lives in `work/specs/tasked/`.

Carries `needsAnswers: true` for the two questions below. They are plumbing decisions, not
design doubts — the spec's central mechanic was verified by spike — but each changes the shape
of the tasks, so answering them first is cheaper than discovering them mid-build. This is also
the honest state: the sibling spec bounced once precisely because a seam was assumed rather
than checked.

## Implementation Decisions

- **`'ask'` added to `onUnknownSigner`**; `'auto'` becomes capability-aware (ask if a text-capable
  prompt is available, else throw). Build on rocketh's existing `PromptExecutor` abstraction — no
  raw enquirer, keeps it browser/CI-safe — but note it must be WIDENED, not merely reused: it is
  confirm-only today (see Open questions).
- **HARDHAT MUST SUPPORT `'ask'`** (decided 2026-08-09). This is not a small detail: the prompt
  capability reaches the seam through `createExecutor` today, but the seam lives in
  `createEnvironment`, and there are TWO callers of it — the one inside `createExecutor`, where a
  prompt is in scope, and `loadEnvironmentFromStore`, where there is none. hardhat-deploy uses
  the second, via `loadEnvironmentFromFiles`. So threading the capability through the executor
  ALONE would silently leave hardhat users on `'throw'` forever. The capability must reach the
  environment on BOTH paths, which makes this a change to how the environment is constructed
  rather than a one-line addition to the executor. Design it as a capability the environment
  carries, not one the executor owns.
- **Interactive resolver over the core seam**: on unsignable `from` under `'ask'`, present tx
  details; accept a tx hash → `eth_getTransactionByHash`/receipt → apply receipt-invariant
  checks → route through the SAME state-saving path as a normal broadcast
  (`savePendingExecution`/`savePendingDeployment` + `waitForTransaction`) → continue. "Cannot
  sign" → print details + throw `UnknownSignerError`.
- **Receipt-invariant checks only** (no verification layer, no extra caller detail): require
  `status === 1`; deployment requires an address (`receipt.contractAddress`, or `eth_getCode`
  at the expected address for deterministic/factory deploys) else FAIL. Residual, documented,
  unavoidable-generically risk: for an `execute` (no address to anchor on) a user could paste
  a successful-but-wrong tx; we accept this (same trust boundary as v1, but stricter — we at
  least require success). Do not attempt to decode MultiSend/Timelock or match `to`/`data`.
- **Resolves instead of throws** ⇒ stays inside the action ⇒ multi-step proceeds in one run.
  **VERIFIED by spike (2026-08-09), so this is not an assumption:** the environment happily
  completes a transaction it never sent. Feeding a user-supplied hash back from the broadcast
  choke point flows through the normal pipeline (`savePendingExecution` →
  `eth_getTransactionByHash` → `waitForTransaction`) and returns a real receipt, with no send
  RPC attempted; and the DEPLOYMENT case recovers the address from `receipt.contractAddress`
  and saves the deployment under its name. Both halves of this spec's central mechanic work
  against the code as it stands.
  One consequence the spike surfaced: `TransactionHashTracker` only records hashes it sees on
  `eth_sendTransaction`/`eth_sendRawTransaction`, so an externally-executed tx is invisible to
  it, and `reportGasUse` (which iterates `provider.transactionHashes`) will silently omit it.
  Decide whether the resolver should register the pasted hash with the tracker; it is a
  one-line affordance, and omitting it is a small, quiet reporting hole.
- **Per-call/`catchUnknownSigner` override precedence** (reusing the core policy-override
  stack): per-call override may VARY the policy but only within environment capability — with
  no prompt available, `'ask'` degrades to `'throw'`. This keeps US2b working on forks (prompt
  injectable) and CI un-hangable.
- **Injectable `PromptExecutor`** in `@rocketh/test-utils` returning a canned hash or
  "cannot sign", so the interactive path is testable without a TTY.

## Testing Decisions

- Inject a fake `PromptExecutor`; drive: (a) paste-valid-hash → state saved, run continues;
  (b) "cannot sign" → prints + throws (catchable); (c) multi-step action → pauses per step,
  all complete in one run; (d) no prompt capability → `'auto'`/`'ask'` degrades to throw;
  (e) deployment with a receipt lacking address/success → FAILS; (f) deterministic deploy →
  address verified via code-at-address, not tx parsing.
- Test home follows the two-homes split this project settled on (see `CONTEXT.md` under _test environment_): work inside `packages/rocketh` (the seam, the policy, the resolver) is tested there with a locally-built real environment, because `rocketh` must not depend on `@rocketh/test-utils`; work in the extension packages uses the shared `createTestEnvironment` harness. Whoever tasks this spec should honour that split rather than re-deriving the dependency cycle. The mock provider returns crafted receipts either way.

## Out of Scope

- The `external`/`safe` ACCOUNT-level protocol (active wait-for-hash tied to an account, v1
  style) → `explore-unknown-signer-adapters`. This spec's interactivity is policy/call-level,
  not account-level.
- Any Safe API proposal / MultiSend batching → `explore-unknown-signer-adapters`.
- Per-call `autoImpersonate` → `work/notes/ideas/per-call-autoimpersonate.md`.

## Further Notes

- v1's `external` protocol (`../hardhat-deploy-v1/src/helpers.ts:1680-1697`) is the closest
  prior art (prompt for hash, `provider.getTransaction`, continue) — but it is account-scoped
  and overrides the signer; this spec instead reuses the `UnknownSignerError` seam and is
  policy/call-scoped, working for any unsignable `from` without pre-registration.
