---
title: review-gate non-blocking nits for 'ask-policy-interactive-resolver' (Gate 2 approve)
date: 2026-08-10
status: open
reviewOf: ask-policy-interactive-resolver
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'ask-policy-interactive-resolver' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Ratify decision 5: the resolver sits at the shared broadcast choke point and is NOT gated to executions, so a DEPLOYMENT from an unsignable from now pauses and asks too, while the address invariants spec story 6 requires (recover/verify the deployed address) are deferred to interactive-deployment-address-recovery. Concretely: for a deterministic deploy, waitForDeploymentTransactionAndSave takes pendingDeployment.expectedAddress verbatim, so a successful-but-unrelated pasted hash saves a deployment record at an address that may hold no code. Ship this intermediate state, or require the follow-up task to land before any release?
  (packages/rocketh/src/environment/index.ts:860 (expectedAddress || receipt.contractAddress); decisions note item 5; task scope says the deployment path is the next task)
- The new documentation.md section and the changeset describe the interactive flow only for executions, and the ACCEPTED RESIDUAL RISK paragraph is explicitly scoped to an EXECUTION. Nothing tells a reader that a DEPLOYMENT also pauses and asks today, nor that no address check runs on it yet. Should the doc gain one sentence covering the deployment case while it is uncovered?
  (documentation.md new section Resolving it interactively instead; no deployment-path test exists either (decision 5 says so))
- CI-hang risk now materialises: canPromptForText() is pure method-presence with no TTY probe, and @rocketh/node injects promptText on both the CLI and loader paths, so the default auto policy now takes the ask path in a non-TTY CI run where it previously threw. Decision 4 saves the run only if the prompts library REJECTS; if it blocks on an open stdin the run hangs, which contradicts the doc sentence saying CI never blocks on a prompt. Was the non-TTY behaviour of prompts actually verified, and should the TTY probe land before release?
  (packages/rocketh/src/environment/index.ts:521; packages/rocketh-node/src/environment/prompt.ts; already open as work/notes/observations/review-nits-prompt-capability-on-the-environment-2026-08-10.md bullet 1; this diff is what makes it live)
- requireSuccessfulExecutedTransaction calls waitForTransaction, whose waitForTransactionReceipt polls FOREVER with no timeout. A hash that is well-formed but unknown to this node (pasted from the wrong chain, or a plausible typo) hangs the run indefinitely behind a spinner, with Ctrl-C the only exit. The same receipt is then fetched and waited on a SECOND time inside savePendingExecution, so the user sees two waits for one transaction. Worth a bounded wait plus a clearer message, or at least reusing the first receipt?
  (packages/rocketh/src/environment/index.ts requireSuccessfulExecutedTransaction then savePendingExecution both call waitForTransaction on the same hash)
- Ratify the user-visible prompt contract in decision 3: an empty answer means DEFER (not a re-ask), cannot sign is matched case/dash/underscore insensitively, and a malformed paste is re-asked at most MAX_HASH_PROMPT_ATTEMPTS (3) times before deferring. These are defaults users will feel and that per-call-ask-override-and-deferral-precedence will inherit.
  (packages/rocketh/src/environment/interactiveUnknownSigner.ts; tested at test lines 460 and 524)
