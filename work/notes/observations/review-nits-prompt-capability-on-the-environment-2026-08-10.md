---
title: review-gate non-blocking nits for 'prompt-capability-on-the-environment' (Gate 2 approve)
date: 2026-08-10
status: open
reviewOf: prompt-capability-on-the-environment
needsAnswers: true
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'prompt-capability-on-the-environment' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Capability is derived purely from 'does the run PromptExecutor implement promptText', with no TTY probe, while @rocketh/node injects its prompt on EVERY path (loader default plus executor default). So canPromptForText() returns true in a non-TTY CI run of hardhat-deploy or the rocketh CLI. ADR 0007 states as a consequence that auto resolves to ask only where a prompt genuinely exists so CI can never hang, and ask-policy-interactive-resolver's acceptance says CI must never hang while branching on exactly this predicate. Should the ceiling gain a TTY/interactivity probe (the method shape was chosen to allow it), or should the next task carry that check explicitly? Worth deciding now so the follow-up task is not built on a predicate that is true in CI.
  (packages/rocketh/src/environment/index.ts:514-521 (typeof promptExecutor?.promptText === 'function'); packages/rocketh-node/src/executor/index.ts:287; docs/adr/0007 Consequences; work/tasks/backlog/ask-policy-interactive-resolver.md:17,26)
- The run-params-beat-executor-prompt precedence (ratified) applies only to what the ENVIRONMENT receives. The askBeforeProceeding confirm calls inside executeDeployScriptModules still use the constructor-supplied promptExecutor unconditionally, so a caller injecting a prompt via ExecutionParams overrides the capability but not the confirm prompts. Behaviour-preserving and probably fine, but decisions note item 3 reads broader than what landed, and injectable-prompt-executor-for-extension-tests may expect the injected fake to receive confirms too. Ratify the narrower scope (and tighten the note), or extend the precedence to the confirm sites.
  (packages/rocketh/src/executor/index.ts:418-420 builds executionParamsWithPrompt for createEnvironment, but lines 440 and 451 call promptExecutor.prompt / promptExecutor.exit on the constructor value)
- The web-shaped case is covered by a locally fabricated confirm-only prompt rather than @rocketh/web's real object (unavoidable, since rocketh must not depend on web). Nothing therefore fails if @rocketh/web later gains promptText. Acceptable today; worth a note in impersonation-unsupported-hint-and-web-guidance so the deliberate absence stays deliberate.
  (packages/rocketh/test/prompt-capability.test.ts createConfirmOnlyPromptExecutor; packages/rocketh-web/src/index.ts:29-38)
