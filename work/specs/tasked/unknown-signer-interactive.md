---
title: Unknown Signer — Interactive resolver (pause + ask for tx hash)
slug: unknown-signer-interactive
taskedAfter: [unknown-signer-core]
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks.
>
> TASKED 2026-08-10 (human path). The technical detail that used to live here has been RELOCATED, not deleted: _what to build_ now lives in the six emitted tasks (`prompt-capability-on-the-environment`, `ask-policy-interactive-resolver`, `interactive-deployment-address-recovery`, `per-call-ask-override-and-deferral-precedence`, `injectable-prompt-executor-for-extension-tests`, `impersonation-unsupported-hint-and-web-guidance`), and the durable _why_ of the capability-delivery decision lives in `docs/adr/0007-prompt-capability-on-the-environment-not-the-executor.md`. This spec has settled to its durable framing.

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
