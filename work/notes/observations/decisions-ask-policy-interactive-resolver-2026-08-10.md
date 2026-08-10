# Decisions taken while building `ask-policy-interactive-resolver` (2026-08-10)

Recorded here because each is user-visible, introduces a refusal, or touches another task, and the task body (which the runner moves) is not mine to edit. Each also carries a JSDoc at its choice site.

## 1. USER-VISIBLE DEFAULT: `'auto'` now becomes interactive wherever a text prompt exists

`resolveUnknownSignerBehaviour` (`packages/rocketh/src/environment/unknownSignerPolicy.ts`) resolves `'auto'` to `'ask'` when `env.canPromptForText()` is true. Because `@rocketh/node` supplies its prompt on both the CLI and the hardhat-deploy loader path (ratified as item 4 of the `prompt-capability-on-the-environment` decisions note), an unsignable `from` on a `rocketh`/hardhat-deploy run now PAUSES and asks by default where it previously threw. That is the point of the task and of ADR 0007, and it is the consequence that note flagged in advance. What it touches: anyone relying on `'auto'` meaning "throw" must now say `'throw'` explicitly.

OPEN, and deliberately NOT resolved here: the capability predicate has no TTY probe, so `canPromptForText()` is true in a non-TTY CI run of `@rocketh/node` (the open review nit `review-nits-prompt-capability-on-the-environment-2026-08-10`, first bullet). I did not add a probe: it belongs to the capability, which is another task's surface, and changing it here would silently re-cut ADR 0007's per-capability rule. Decision 4 below is the mitigation that keeps such a run from hanging or dying opaquely, but it is a mitigation, not an answer. The nit still needs a human.

## 2. NEW REFUSAL: a pasted transaction whose receipt is not successful fails the run

`requireSuccessfulExecutedTransaction` (`packages/rocketh/src/environment/index.ts`) throws a plain `Error` naming the pasted hash, the receipt's status and the whole transaction that still needs executing. It runs BEFORE any state is saved and before the tracker is touched, so a failed paste leaves nothing behind. Alternatives considered: a new exported error class (rejected: new public surface for a message that already IS the deliverable, and nothing programmatic needs to branch on it), and checking after `savePendingExecution` (rejected: the pending-transaction file would already have been written, breaking "saves NO state"). What it touches: `interactive-deployment-address-recovery` extends this same check with the address invariants.

## 3. USER-VISIBLE: what the prompt accepts, and that re-asking is BOUNDED

`askForExecutedTransactionHash` (`packages/rocketh/src/environment/interactiveUnknownSigner.ts`) accepts `0x` + 64 hex characters (trimmed, lowercased on the way in). An EMPTY answer or `cannot sign` (case/dash/underscore insensitive) means DEFER, and a cancelled prompt (Ctrl-C) means the same. Anything else is a typo: it is re-asked, at most `MAX_HASH_PROMPT_ATTEMPTS` (3) times in total, after which the run defers rather than looping. Alternatives considered: re-asking forever (rejected: a mis-wired or unattended prompt could spin a run indefinitely, which is the CI failure mode the whole capability ceiling exists to prevent), and treating an empty answer as a typo to re-ask (rejected: pressing enter is the natural "not now", and the `TextPromptAnswer` contract explicitly leaves the meaning of `''` to the caller — see item 6 of the `prompt-capability-on-the-environment` decisions note). What it touches: `per-call-ask-override-and-deferral-precedence` drives the same prompt for its rehearsal scenario.

## 4. A prompt that THROWS degrades to the defer path rather than surfacing its own error

If `promptText` rejects (a runtime that cannot really reach a human, e.g. no TTY behind it), the resolver shows the failure and returns "cannot sign", so the user gets the transaction and the familiar `UnknownSignerError` instead of a readline stack trace. Alternative considered: letting the prompt's error propagate (rejected: it would replace the very information the workflow needs, and the repo convention is that this message is the deliverable). Consequence: a broken prompt is visible in the message rather than as the run's failure mode.

## 5. The resolver is NOT gated to executions, so DEPLOYMENTS resolve interactively too

It lives at the shared `broadcastTransaction` choke point, so a deployment from an unsignable `from` also pauses, and inherits the successful-status invariant (decision 2). It does NOT yet get deployment-specific address verification (code at the expected address for a deterministic deploy) — that is the next task, `interactive-deployment-address-recovery`, which extends this same point and whose prompt anticipates exactly this ("if the blocking task solved the deployment case too, or solved it differently, do NOT duplicate or fight it"). What was NOT done: this task adds no deployment-path test, because its acceptance scopes tests to `env.broadcastExecution` and the address rules are the next task's to specify. Alternative considered: gating deployments to `throw` (rejected: it needs a "which funnel am I in?" flag threaded through the choke point purely to ship behaviour the next change removes, and half-interactive is a surprising thing to hand a user who asked for `'ask'`).

## 6. Doc-comment corrections in `@rocketh/unknown-signer` (patch, no behaviour change)

Two comments there said the dynamic-scope frame leak was "harmless while every policy value resolves to `throw`" and called `'ask'` "the interactive policy that ships later". My change is what makes both stale, so they are corrected in the same change rather than left to read as reassurance that no longer holds. This is why the changeset lists `@rocketh/unknown-signer` as a patch.
