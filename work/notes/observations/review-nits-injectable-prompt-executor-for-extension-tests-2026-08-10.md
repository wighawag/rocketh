---
title: review-gate non-blocking nits for 'injectable-prompt-executor-for-extension-tests' (Gate 2 approve)
date: 2026-08-10
status: open
reviewOf: injectable-prompt-executor-for-extension-tests
needsAnswers: true
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'injectable-prompt-executor-for-extension-tests' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Ratify: the CAPABILITY-ABSENT shape is the builder's default (createMockPromptExecutor() with no options), while textAnswers: [] gives a capability-PRESENT but exhausted prompt. The module doc states this precisely, but the changeset (which becomes the published CHANGELOG) and TESTING.md both say 'calling it with no scripted answers' / 'with no answers' gives the capability-absent shape, which a reader will apply to the empty array too. Worth tightening the consumer-facing wording to omit-vs-empty.
  (.changeset/injectable-prompt-executor-for-extension-tests.md; TESTING.md line 77; packages/rocketh-test-utils/src/mock-prompt.ts module doc)
- Ratify: the confirm half is hardcoded to return {proceed: true} and is not scriptable, so a test cannot drive a declined confirm. The executor's reset and live-network confirms do call prompt() and check !proceed, so a future extension test of that path would have to hand-roll a double. Mirrors @rocketh/web deliberately, but it is an unspecified user-visible default.
  (packages/rocketh-test-utils/src/mock-prompt.ts:112; packages/rocketh/src/executor/index.ts:440-468)
- Ratify: an EXHAUSTED script throws, and the interactive resolver catches any promptText throw and defers (reason prompt-failed), so a mis-scripted test surfaces as an UnknownSignerError, not the mock's diagnostic message. The comment acknowledges it; confirm this is the wanted trade rather than, say, returning a sentinel.
  (mock-prompt.ts throw on empty script; packages/rocketh/src/environment/interactiveUnknownSigner.ts catch returns cannot-sign/prompt-failed)
- Ratify: MockTextAnswer additionally accepts an Error entry (a prompt with no terminal behind it) beyond the task's canned-hash / cannot-sign / capability-absent asks. Small but real added surface on a published package.
  (packages/rocketh-test-utils/src/mock-prompt.ts MockTextAnswer)
- No Decisions block was recorded anywhere for this build: the commit message is a single line and the task file moved to done unchanged, so the four decisions above had to be reconstructed from the source. Consider recording them at build time next run.
  (git show b246d23 stat: task file 0 insertions/0 deletions)
- The end-to-end example lives in packages/rocketh-unknown-signer/test/ but never calls catchUnknownSigner: it drives env.broadcastExecution directly. It satisfies the criterion (an extension-package test proving the shared pass-through route), yet the file's home implies coverage of that package's own API which it does not add.
  (packages/rocketh-unknown-signer/test/interactive-prompt.integration.test.ts upgradeCall)
- Vocabulary divergence across the two test homes: the shared double is createMockPromptExecutor, while packages/rocketh/test uses createScriptedPrompt and createConfirmOnlyPromptExecutor for the same two notions. The duplication is intended (dependency edge), but the naming split makes moving between homes harder than it needs to be.
  (packages/rocketh/test/interactive-unknown-signer.test.ts:164,188)
