---
title: Unknown Signer — Interactive resolver (pause + ask for tx hash)
slug: unknown-signer-interactive
taskedAfter: [unknown-signer-core]
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

None remaining. The spike's two findings (2026-08-09) are both ANSWERED by the maintainer
(2026-08-10) and recorded in Implementation Decisions: how the prompt capability reaches the
seam (hardhat must support `'ask'`, so it reaches the environment on every construction path),
and the `PromptExecutor` widening (additive `promptText?`, per-CAPABILITY checking, with web
deliberately opting out and reaching for impersonation instead). Both materially shape the
tasks, so read Implementation Decisions before tasking.

## Autonomy notes

Ordered `taskedAfter: [unknown-signer-core]` because it extends the core seam
(`onUnknownSigner`, the policy frame stack) and the `catchUnknownSigner` primitive. That
ordering constraint is now SATISFIED: `unknown-signer-core` lives in `work/specs/tasked/`.

`needsAnswers` was CLEARED on 2026-08-10: both plumbing questions are answered (see
Implementation Decisions). They were never design doubts — the central mechanic was verified by
spike — but each changed the shape of the tasks, so answering them first was cheaper than
discovering them mid-build. This is also the honest state: the sibling spec bounced once
precisely because a seam was assumed rather than checked, which is why every claim carried
here now cites the file and line it was verified at.

## Implementation Decisions

- **`'ask'` added to `onUnknownSigner`**; `'auto'` becomes capability-aware (ask if a text-capable
  prompt is available, else throw). Build on rocketh's existing `PromptExecutor` abstraction — no
  raw enquirer, keeps it browser/CI-safe — but it must be WIDENED, not merely reused: it is
  confirm-only today. The union is `UnknownSignerPolicy = 'throw' | 'auto'`
  (`packages/rocketh-core/src/types.ts:604`), so `'ask'` is the third member; the frame type
  `UnknownSignerPolicyFrame` (`:615`) is already an OBJECT specifically so this slice can carry
  "what to do with a prompt's answer" without re-cutting the seam.

- **DECIDED 2026-08-10 — widen `PromptExecutor` with an OPTIONAL `promptText?`, and check
  PER-CAPABILITY (method presence), never "is a PromptExecutor present?".** Verified shape today
  (`packages/rocketh-core/src/types.ts:805-810`): `PromptAnswer = {proceed: boolean}` and
  `PromptExecutor { prompt(request: {type:'confirm'; name; message}): Promise<PromptAnswer>; exit(): void }`.
  The agreed widening is additive:

  ```ts
  export type TextPromptAnswer = {value: string} | {cancelled: true};

  export interface PromptExecutor {
  	prompt(request: {type: 'confirm'; name: string; message: string}): Promise<PromptAnswer>;
  	/** OPTIONAL. Absence IS the capability signal: this runtime cannot ask for free text. */
  	promptText?(request: {type: 'text'; name: string; message: string}): Promise<TextPromptAnswer>;
  	exit(): void;
  }
  ```

  A SEPARATE optional method rather than widening `prompt`'s request union, for three reasons.
  (1) It is purely additive: no existing implementation breaks. (2) The capability check becomes
  the single honest predicate `typeof prompt?.promptText === 'function'` — no parallel
  `capabilities` descriptor that can drift from reality. (3) It sidesteps a LIVE trap:
  `@rocketh/node`'s implementation (`packages/rocketh-node/src/executor/index.ts:246-252`) does
  `return {proceed: answer.proceed}`, reading `.proceed` UNCONDITIONALLY and ignoring
  `request.name`, while `prompts` keys its answer object BY `request.name`. Both existing call
  sites pass `name: 'proceed'` (`packages/rocketh/src/executor/index.ts:426`, `:437`), so it works
  only by coincidence of naming — a text prompt named `txHash` would silently receive `undefined`.
  A distinct method with its own return shape makes that class of bug unrepresentable. The node
  implementation of `promptText` MUST key off `request.name`.

- **DECIDED 2026-08-10 — deliver the capability on `ExecutionParams`, not as a new
  `createEnvironment` positional.** `ExecutionParams`
  (`packages/rocketh-core/src/types.ts:339-354`) already carries exactly this class of run-level
  thing: `provider`, `autoImpersonate`, and `onUnknownSigner` itself. Add `prompt?: PromptExecutor`
  there (and to `ResolvedExecutionParams`). This is the seam that makes the hardhat decision below
  actually work, because `autoImpersonate` ALREADY travels this exact road to both construction
  paths (resolved inside `resolveExecutionParams`,
  `packages/rocketh/src/executor/index.ts:255-257`, which `loadEnvironmentFromStore` also calls) —
  whereas the prompt is today a runtime object only `createExecutor` holds. Make the prompt ride
  the road that already works instead of cutting a new one.

- **CORRECTION to the "two callers" claim below: there are now THREE call sites of
  `createEnvironment`**, because `test-env-harness` landed a fourth construction path after the
  spike. Enumerated in full (do not re-derive from a grep):
  `packages/rocketh/src/executor/index.ts:318` (inside `loadEnvironmentFromStore`, NO prompt in
  scope), `packages/rocketh/src/executor/index.ts:408` (inside `createExecutor`'s
  `resolveConfigAndExecuteDeployScriptModules`, prompt in scope), and
  `packages/rocketh-test-utils/src/test-environment.ts:337` (the shared harness). The third is a
  GIFT, not a burden: `createTestEnvironment` already accepts
  `executionParams?: Partial<Omit<ExecutionParams, 'provider'>>`, so once the prompt lives on
  `ExecutionParams`, **US7's injectable fake prompt needs ZERO new harness API**.
- **HARDHAT MUST SUPPORT `'ask'`** (decided 2026-08-09). This is not a small detail: the prompt
  capability reaches the seam through `createExecutor` today, but the seam lives in
  `createEnvironment`, and the caller that hardhat uses has no prompt in scope. hardhat-deploy
  reaches it through `loadEnvironmentFromStore`, via the chain
  `packages/hardhat-deploy/src/helpers.ts:124` → `@rocketh/node`'s `loadEnvironmentFromFiles`
  (`packages/rocketh-node/src/executor/index.ts:275`) → `loadEnvironmentFromFilesWithSpecificConfig`
  (`:284`) → `loadEnvironmentFromStore` (`packages/rocketh/src/executor/index.ts:292`, `:304`) —
  verified 2026-08-10. So threading the capability through the executor ALONE would silently leave
  hardhat users on `'throw'` forever. The capability must reach the environment on EVERY
  construction path (see the caller enumeration below — there are THREE, not two), which makes this
  a change to how the environment is constructed rather than a one-line addition to the executor.
  Design it as a capability the environment carries, not one the executor owns. `@rocketh/node`
  should DEFAULT that capability to its own `prompts`-backed executor, which is what actually
  delivers `'ask'` to hardhat users.
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
  **DECIDED 2026-08-10: the resolver REGISTERS the pasted hash with the tracker.** Verified: the
  push happens only in those two branches
  (`packages/rocketh-core/src/providers/TransactionHashTracker.ts:17`), `reportGasUse` iterates
  `provider.transactionHashes` (`packages/rocketh/src/executor/index.ts:546`), and the
  `TransactionHashTracker` type exposes `transactionHashes` as a MUTABLE array (`:25`), so this is
  genuinely a one-liner. Rationale: a silently under-reported gas total in exactly the
  governed-upgrade runs this feature exists for is not an acceptable quiet hole.
- **Per-call/`catchUnknownSigner` override precedence** (reusing the core policy-override
  stack): per-call override may VARY the policy but only within environment capability — with
  no prompt available, `'ask'` degrades to `'throw'`. This keeps US2b working on forks (prompt
  injectable) and CI un-hangable.
- **Injectable `PromptExecutor`** in `@rocketh/test-utils` returning a canned hash or
  "cannot sign", so the interactive path is testable without a TTY. Per the correction above this
  needs no new harness API — it rides `createTestEnvironment`'s existing `executionParams`
  pass-through.

- **DECIDED 2026-08-10 (maintainer) — `@rocketh/web` does NOT implement `promptText`; the browser
  answer is IMPERSONATION, not interactivity.** A browser cannot sensibly ask a user to paste a tx
  hash, so web omits `promptText`, the per-capability check reports "no text capability", and
  `'auto'` resolves to `'throw'` there. That is not a gap to apologise for, because a web user on a
  FORK or dev node has a better route: **declare the unsignable addresses as NAMED accounts and
  turn on `autoImpersonate`**, and the accounts are resolved BEFORE the seam so no policy is ever
  consulted. Three points a tasker must carry, each verified:
  - **Declaring them as NAMED accounts is MANDATORY, not merely convenient.** The candidate set is
    `Object.values(namedAccounts).filter(needsImpersonationForRun)`
    (`packages/rocketh/src/environment/index.ts:448`), and `needsImpersonationForRun` (`:441-447`)
    admits an address iff its signer is `remote` AND it is absent from `eth_accounts`. So
    `unnamedAccounts`, and a bare `from` on a call, are NEVER impersonated even with
    `autoImpersonate: true`. A bare-address named account resolves to `remote` (`:423-427`), which
    is exactly what qualifies.
  - **This works only against a node implementing `hardhat_impersonateAccount`** — a fork or dev
    node. `impersonateAccounts` swallows the failure BY DESIGN
    (`packages/rocketh/src/environment/index.ts:93-99`, commented so the feature "works gracefully
    with non-hardhat/anvil providers"), so against a real chain the account simply stays
    `unsignable` and the run lands on `throw` + `catchUnknownSigner`. That is the correct outcome,
    and it is why web still needs `'throw'` to be good.
  - **`autoImpersonate` is RUN-level, not per-transaction.** It resolves once in
    `resolveExecutionParams` (`packages/rocketh/src/executor/index.ts:255-257`) and is applied to
    every candidate at environment construction. Per-transaction impersonation is a separate,
    OUT-OF-SCOPE idea (`work/notes/ideas/per-call-autoimpersonate.md`). Do not design as if a
    per-call knob exists.

  Documentation consequence a task must cover: state the fork recipe explicitly, so "web cannot do
  `'ask'`" is never read as "web is crippled".

- **The silent impersonation failure needs a HINT in `UnknownSignerError`.** Because
  `impersonateAccounts` swallows an unsupported-RPC failure silently (cited above), a user who
  sets `autoImpersonate: true` against a node that does not support it gets NO signal — only an
  `UnknownSignerError` later, with nothing saying impersonation was attempted and unsupported.
  Given this project's standing invariant that the unwrapped throw is the PRIMARY deferral
  workflow and the error MESSAGE is the deliverable (not a summary), the error should say so when
  `autoImpersonate` was on but impersonation did not resolve the account. Small, and it belongs
  with this slice.

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
