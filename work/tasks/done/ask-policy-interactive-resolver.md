---
title: "Add the 'ask' policy and the interactive resolver at the broadcast seam"
slug: ask-policy-interactive-resolver
spec: unknown-signer-interactive
blockedBy: [prompt-capability-on-the-environment]
covers: [1, 2, 4, 5]
---

## What to build

The heart of the spec: when a transaction's `from` is unsignable, PAUSE, show the user the transaction, let them execute it out-of-band, accept the resulting transaction hash, and CONTINUE in the same run with state saved. Because the resolver RESOLVES instead of throwing, execution stays inside the wrapped action, so a multi-step governed action pauses at each step and completes in ONE run.

Scope of THIS task is the EXECUTION path. The deployment path (recovering a deployed address) is the next task; do not build it here.

Three pieces:

1. **A third policy value, `ask`.** The policy union is `'throw' | 'auto'` today. Add `'ask'`, and make `'auto'` CAPABILITY-AWARE: it resolves to `ask` when a text prompt is available for this run, else `throw`. CI must never hang.
2. **The resolver at the seam.** Under `ask`, present the transaction details, then offer two answers: paste the executed transaction hash, or "cannot sign". A pasted hash routes through the SAME state-saving path a normal broadcast uses, so nothing bespoke reimplements the pipeline. "Cannot sign" prints the full details and throws, degrading gracefully to the existing defer workflow.
3. **Receipt invariants, not a verification layer.** Require a successful status. Do NOT attempt to decode MultiSend or Timelock payloads, and do NOT try to match `to`/`data`. The residual, accepted risk for an execution (which has no address to anchor on) is that a user could paste a successful-but-wrong transaction: same trust boundary as v1, but stricter, since we at least require success. Document it rather than engineering around it.

Also register the pasted hash with the transaction-hash tracker, so gas reporting does not silently omit an externally-executed transaction.

## Acceptance criteria

- [ ] The policy union gains `ask`. `auto` resolves to `ask` when a text prompt is available and to `throw` when it is not, and a test pins BOTH directions.
- [ ] With NO text capability, `ask` itself degrades to `throw`. It never prompts and never hangs, so a CI run cannot block (covers story 5). Tested explicitly.
- [ ] Under `ask` with a capability, an unsignable `from` on an execution PAUSES, presents the transaction, accepts a pasted hash, saves state through the normal pending-execution path, and RETURNS a real receipt with NO send RPC attempted. Assert the absence of `eth_sendTransaction` and `eth_sendRawTransaction` in the recorded traffic: that absence is the whole point.
- [ ] Answering "cannot sign" prints the full transaction details and throws the existing unknown-signer error, catchable by `catchUnknownSigner` (covers story 4).
- [ ] A multi-step action containing TWO unsignable steps pauses at each and completes BOTH in one run, with state saved for each (covers story 2). This is the test that proves resolving beats throwing.
- [ ] A receipt whose status is not success FAILS LOUDLY, names the transaction and the pasted hash, and saves NO state. Tested.
- [ ] The pasted hash is registered with the transaction-hash tracker, so gas reporting includes it. Tested by asserting the hash appears in the tracker's list after an interactive resolution.
- [ ] The policy is still consulted ONLY inside the `unsignable` branch of the broadcast choke point. A `local`, `node` or `impersonated` account with an `ask` policy in force broadcasts EXACTLY as before, and a test pins that (this invariant has drifted through three documents before, see ADR 0006).
- [ ] A pre-signed `raw` transaction still returns before any signer lookup and can never reach the resolver. Tested.
- [ ] Documentation extends the EXISTING "Handling unknown signers" section rather than creating a new one, and states the accepted residual risk for executions.
- [ ] Tests live in `packages/rocketh/test/`, build a real environment locally with a mock provider, and drive `env.broadcastExecution` rather than importing `@rocketh/deploy` (that import would close an nx project-graph cycle).
- [ ] A changeset accompanies the change.
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass.

## Blocked by

- `prompt-capability-on-the-environment`: supplies the text-prompt capability and the per-capability predicate that `auto` branches on. It also edits the core types this task extends, so the ordering serialises those edits.

## Prompt

> Goal: make an unsignable transaction PAUSE and resolve interactively instead of throwing, so a deployer at a keyboard executes it on their Safe, pastes the hash, and the run continues in the same execution with state saved.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Confirm the capability predicate from the blocking task landed with the shape this task assumes, and confirm the policy union is still what you expect before extending it. If either differs, route to needs-attention rather than adapting silently.
>
> The central mechanic is VERIFIED, not assumed. A 2026-08-09 spike (code thrown away, findings recorded in the spec) established that the environment happily completes a transaction it never sent: feeding a user-supplied hash back from the broadcast choke point flows through the normal pipeline, `savePendingExecution` then `eth_getTransactionByHash` then `waitForTransaction`, and returns a real receipt with no send attempted. Build ON that pipeline. Do NOT reimplement pending-state saving or receipt waiting.
>
> Where to look. The seam is the single `broadcastTransaction` choke point in `packages/rocketh/src/environment/index.ts`, which consults the policy ONLY inside its `unsignable` branch. The state-saving funnels are `savePendingExecution` and `savePendingDeployment` in the same module; `broadcastExecution` returns via the former. The policy union and the policy FRAME live in `@rocketh/core`'s types: the frame is deliberately an OBJECT rather than a bare string precisely so this slice can carry per-scope prompt-answer information without re-cutting the seam, so use it rather than adding a parallel channel.
>
> Invariants you must not violate, all of them already landed and pinned by tests:
>
> - The policy frame forces `throw` over `ask`, NEVER over impersonation. It is consulted only in the `unsignable` branch. `autoImpersonate` is a NODE CAPABILITY resolved BEFORE the seam; `onUnknownSigner` is the POLICY afterwards. They are orthogonal and there is no `impersonate` policy value. ADR 0006 is the durable record; read it.
> - A `TransactionToBroadcast` with `type: 'raw'` is pre-signed and returns before any signer lookup, so it can never produce an unknown-signer error. The plain-transaction path that can is the `tx()` helper.
> - `catchUnknownSigner` takes a THUNK, not v1's promise-or-thunk, because a promise has already started before the frame can be pushed.
> - The unwrapped throw is the PRIMARY deferral workflow, so the error MESSAGE is the deliverable, not a summary. Do not degrade it on the "cannot sign" path.
>
> The tracker detail. The transaction-hash tracker only records hashes it observes on `eth_sendTransaction` and `eth_sendRawTransaction`, so an externally-executed transaction is invisible to it and gas reporting (which iterates the tracker's list) would silently omit it. The tracker type exposes its list as a mutable array, so registering the pasted hash is a one-liner. Do it; the spec decided this deliberately rather than accepting the quiet hole.
>
> Testing. Inject a fake prompt returning a canned hash or "cannot sign" so the interactive path is drivable without a TTY. Tests belong in `packages/rocketh/test/` with a locally-built real environment and a mock provider returning crafted receipts, because `rocketh` must not depend on `@rocketh/test-utils` (see `CONTEXT.md` under _test environment_). A sibling task adds a shared injectable fake for EXTENSION-package tests; you do not need it and must not depend on it.
>
> Watch the tautology trap. A test that "passes" because both policy values resolve to the same behaviour proves nothing; a previous slice shipped exactly such a test and flagged it honestly. Make sure each assertion can actually FAIL if the behaviour regresses, and say in the done record how you checked.
>
> Done means: `ask` exists, `auto` is capability-aware in both directions, a pasted hash resolves an execution through the real pipeline with no send attempted, "cannot sign" degrades to the throw path, a two-step action completes in one run, and no signable account's behaviour changed at all.

## Requeue 2026-08-10

Gate-3 BLOCK (conductor), 2026-08-10. BLOCKING: this task covers story 5 (CI never hangs) and for the realistic CI case it does not hold. canPromptForText() is pure method-presence with no TTY probe and @rocketh/node injects promptText on BOTH the CLI and loader paths, so a CI job running the rocketh CLI or hardhat-deploy now takes the ask path where it previously threw, and whether it hangs depends on unverified prompts-library behaviour against a non-TTY stdin. The new documentation.md section also asserts CI never blocks on a prompt, which is currently false. FIX: do NOT put a TTY probe inside canPromptForText() (pure method-presence is ADR 0007's recorded decision and three later tasks depend on it); instead have @rocketh/node supply promptText ONLY when stdin is a TTY, so a non-TTY run simply has no capability and falls through the already-tested degrade path. Verify and RECORD what prompts actually does against a non-TTY stdin. ALSO FIX (cheap, same module): a pasted hash unknown to this node hangs forever, because requireSuccessfulExecutedTransaction calls waitForTransaction whose polling has no deadline, and savePendingExecution then waits on the SAME hash a second time. Bound the pasted-hash wait with a message naming the hash as not found, and stop waiting twice. ALSO: add one doc sentence saying a DEPLOYMENT also pauses and asks today, with address verification arriving in interactive-deployment-address-recovery. RATIFIED, do NOT churn: decision 5 (resolver not gated to executions, ship the intermediate state), decision 3's prompt contract (empty=defer, cannot-sign matching, 3 attempts), decisions 2/4/6, the doc-only @rocketh/unknown-signer change, the unchanged pending-state pipeline, tracker registration, and every signable-class and raw-transaction test. The mutation table is good work; keep it and extend it to the new TTY behaviour.

## Decisions

_Transcribed from `work/notes/observations/decisions-ask-policy-interactive-resolver-2026-08-10.md`, deleted in the same commit. That note predated the protocol rule (synced 2026-08-11) that gives a builder's rationale exactly ONE home: a `## Decisions` block in the done record. The rationale is reproduced unchanged below, followed by the human's ratification._

_Decisions taken while building `ask-policy-interactive-resolver` (2026-08-10)_

> **Correction (2026-08-11).** Decision 2 below named `requireSuccessfulExecutedTransaction`, which is not a symbol that exists: the function that landed is `waitForPastedTransaction` (the name decision 8 already uses), and it absorbed the successful-status check during the same requeue that added the unknown-hash bound. Corrected in place rather than as an appended note, because a decision record whose cited symbol cannot be grepped is worse than useless to the reader it exists for; the substance of the decision is unchanged.

Recorded here because each is user-visible, introduces a refusal, or touches another task, and the task body (which the runner moves) is not mine to edit. Each also carries a JSDoc at its choice site.

### 1. USER-VISIBLE DEFAULT: `'auto'` now becomes interactive wherever a text prompt exists

`resolveUnknownSignerBehaviour` (`packages/rocketh/src/environment/unknownSignerPolicy.ts`) resolves `'auto'` to `'ask'` when `env.canPromptForText()` is true. Because `@rocketh/node` supplies its prompt on both the CLI and the hardhat-deploy loader path (ratified as item 4 of the `prompt-capability-on-the-environment` decisions note), an unsignable `from` on a `rocketh`/hardhat-deploy run now PAUSES and asks by default where it previously threw. That is the point of the task and of ADR 0007, and it is the consequence that note flagged in advance. What it touches: anyone relying on `'auto'` meaning "throw" must now say `'throw'` explicitly.

RESOLVED on the 2026-08-10 requeue (see decision 7): the missing TTY probe is now handled in `@rocketh/node`, which supplies `promptText` only when stdin is a terminal, so a non-TTY CI run has no capability at all and `'auto'` still resolves to `'throw'` there. `canPromptForText()` is untouched and stays pure method presence (ADR 0007). What changed by default is therefore narrower than first recorded: a run WITH A TERMINAL now pauses and asks where it previously threw; a run without one behaves exactly as before.

### 2. NEW REFUSAL: a pasted transaction whose receipt is not successful fails the run

`waitForPastedTransaction` (`packages/rocketh/src/environment/index.ts`) throws a plain `Error` naming the pasted hash, the receipt's status and the whole transaction that still needs executing. It runs BEFORE any state is saved and before the tracker is touched, so a failed paste leaves nothing behind. Alternatives considered: a new exported error class (rejected: new public surface for a message that already IS the deliverable, and nothing programmatic needs to branch on it), and checking after `savePendingExecution` (rejected: the pending-transaction file would already have been written, breaking "saves NO state"). What it touches: `interactive-deployment-address-recovery` extends this same check with the address invariants.

### 3. USER-VISIBLE: what the prompt accepts, and that re-asking is BOUNDED

`askForExecutedTransactionHash` (`packages/rocketh/src/environment/interactiveUnknownSigner.ts`) accepts `0x` + 64 hex characters (trimmed, lowercased on the way in). An EMPTY answer or `cannot sign` (case/dash/underscore insensitive) means DEFER, and a cancelled prompt (Ctrl-C) means the same. Anything else is a typo: it is re-asked, at most `MAX_HASH_PROMPT_ATTEMPTS` (3) times in total, after which the run defers rather than looping. Alternatives considered: re-asking forever (rejected: a mis-wired or unattended prompt could spin a run indefinitely, which is the CI failure mode the whole capability ceiling exists to prevent), and treating an empty answer as a typo to re-ask (rejected: pressing enter is the natural "not now", and the `TextPromptAnswer` contract explicitly leaves the meaning of `''` to the caller — see item 6 of the `prompt-capability-on-the-environment` decisions note). What it touches: `per-call-ask-override-and-deferral-precedence` drives the same prompt for its rehearsal scenario.

### 4. A prompt that THROWS degrades to the defer path rather than surfacing its own error

(Still true, but note it is no longer load-bearing for the CI case: `prompts` on a non-TTY stdin never rejects at all, so nothing would be caught. Decision 7 is what makes CI safe.)

If `promptText` rejects (a runtime that cannot really reach a human, e.g. no TTY behind it), the resolver shows the failure and returns "cannot sign", so the user gets the transaction and the familiar `UnknownSignerError` instead of a readline stack trace. Alternative considered: letting the prompt's error propagate (rejected: it would replace the very information the workflow needs, and the repo convention is that this message is the deliverable). Consequence: a broken prompt is visible in the message rather than as the run's failure mode.

### 5. The resolver is NOT gated to executions, so DEPLOYMENTS resolve interactively too

It lives at the shared `broadcastTransaction` choke point, so a deployment from an unsignable `from` also pauses, and inherits the successful-status invariant (decision 2). It does NOT yet get deployment-specific address verification (code at the expected address for a deterministic deploy) — that is the next task, `interactive-deployment-address-recovery`, which extends this same point and whose prompt anticipates exactly this ("if the blocking task solved the deployment case too, or solved it differently, do NOT duplicate or fight it"). What was NOT done: this task adds no deployment-path test, because its acceptance scopes tests to `env.broadcastExecution` and the address rules are the next task's to specify. Alternative considered: gating deployments to `throw` (rejected: it needs a "which funnel am I in?" flag threaded through the choke point purely to ship behaviour the next change removes, and half-interactive is a surprising thing to hand a user who asked for `'ask'`).

### 6. Doc-comment corrections in `@rocketh/unknown-signer` (patch, no behaviour change)

Two comments there said the dynamic-scope frame leak was "harmless while every policy value resolves to `throw`" and called `'ask'` "the interactive policy that ships later". My change is what makes both stale, so they are corrected in the same change rather than left to read as reassurance that no longer holds. This is why the changeset lists `@rocketh/unknown-signer` as a patch.

### 7. NEW REFUSAL (requeue): `@rocketh/node` withholds `promptText` unless stdin is a TTY

`createNodePromptExecutor` (`packages/rocketh-node/src/environment/prompt.ts`) supplies the text ability only when `process.stdin.isTTY`, so a non-TTY run carries no capability and the policy degrades through the already-tested path. The gate is in the RUNTIME, not in `canPromptForText()`: ADR 0007 records that the predicate is pure method presence, and three later tasks depend on that. The behaviour it prevents was MEASURED, not assumed: `prompts@2.4.2` against a non-TTY stdin never settles and never rejects (`/dev/null` makes node exit silently, an open pipe hangs), recorded with a reproducible probe in `docs/spikes/ask-policy-interactive-resolver/prompts-non-tty-behaviour.md`. Alternatives considered: probing inside `canPromptForText()` (rejected: re-cuts ADR 0007 and re-means the predicate), and relying on the prompt rejecting (rejected: it does not reject, as measured). What it touches: the loader path now builds its prompt PER CALL rather than reusing a module-level one, so the ability reflects the run's stdin rather than stdin at import time; `injectable-prompt-executor-for-extension-tests` and `per-call-ask-override-and-deferral-precedence` inherit "a test injects its own prompt", which is unaffected. Also noted, not fixed: the CONFIRM prompt has the same non-TTY failure mode (`work/notes/observations/confirm-prompt-non-tty-2026-08-10.md`).

### 8. NEW REFUSAL (requeue): a pasted hash this node does not know is reported as NOT FOUND

`waitForPastedTransaction` (`packages/rocketh/src/environment/index.ts`) polls `eth_getTransactionByHash` for at most `PASTED_TRANSACTION_LOOKUP_ROUNDS` (10) rounds at the run's own polling interval before failing with a message naming the hash as not found and reprinting the transaction still to execute. The bound is on "this node has never heard of it" (a typo, a hash from another chain) and NOT on mining: once the node knows the transaction the wait is the ordinary unbounded one, confirmations included, because a Safe execution can legitimately take a while. Alternatives considered: a wall-clock timeout covering the whole wait (rejected: it would fail a legitimately slow mine, and the failure users actually hit is the unknown hash), and leaving it unbounded (rejected: that is the hang the requeue flagged). The receipt fetched here is then handed to `savePendingExecution`/`savePendingDeployment` through a one-shot map, so one pasted transaction is waited for once instead of twice. What it touches: `interactive-deployment-address-recovery` extends this same function with the address invariants and inherits both the bound and the handed-over receipt.

### Ratification (2026-08-11 observation triage)

**Ratified - all eight decisions accepted as-is; keep the note.** Nothing here is reopened, including the four with real user-visible weight: `'auto'` becoming interactive wherever a text prompt exists (narrowed by decision 7's TTY gate, so a run WITHOUT a terminal behaves exactly as before); the refusal on a pasted transaction whose receipt is not successful; the bounded re-ask (`MAX_HASH_PROMPT_ATTEMPTS` = 3, then defer); and the resolver NOT being gated to executions, so deployments resolve interactively too.

One factual correction was applied to the note rather than ratified: decision 2 named `requireSuccessfulExecutedTransaction`, a symbol that does not exist. The function that landed is `waitForPastedTransaction` (the name decision 8 already used), which absorbed the successful-status check during the same requeue that added the unknown-hash bound. Corrected in place, with a dated note saying so, because a decision record whose cited symbol cannot be grepped fails the one reader it exists for.

Live residue, not decided here: whether the runtime should ALSO withhold the text ability when `process.env.CI` is set (a CI runner that allocates a pty still gets `promptText`), and whether `PASTED_TRANSACTION_LOOKUP_ROUNDS` = 10 rounds at the polling interval is long enough for a hash pasted straight after a Safe execution against a load-balanced public RPC. Both are recorded on the matching review-nits note.
