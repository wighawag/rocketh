---
title: review-gate non-blocking nits for 'prompt-capability-on-the-environment' (Gate 2 approve)
date: 2026-08-10
status: open
reviewOf: prompt-capability-on-the-environment
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'prompt-capability-on-the-environment' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Ratify recorded decision 4: @rocketh/node's loadEnvironmentFromFilesWithSpecificConfig now injects the Node PromptExecutor into the run parameters when the caller supplied none, so every hardhat-deploy environment reports canPromptForText() true by default. Inert today (nothing branches on it), but it is the default that makes auto resolve to ask once ask-policy-interactive-resolver lands. Confirm that default is wanted.
  (packages/rocketh-node/src/executor/index.ts:281-289; decisions note item 4; ADR 0007)
- Ratify recorded decision 3: the executor's constructor-supplied prompt is applied as a DEFAULT inside executeDeployScriptModules, and run parameters WIN. Consequence asserted by test: a confirm-only prompt on the run parameters DOWNGRADES a text-capable executor prompt to canPromptForText() false. This is the precedence injectable-prompt-executor-for-extension-tests will rely on, so it is cross-task load-bearing.
  (packages/rocketh/src/executor/index.ts:414-420; packages/rocketh/test/prompt-capability.test.ts, the override test)
- Ratify recorded decision 2: the predicate is a METHOD env.canPromptForText() on the Environment interface, not a readonly boolean. It is a required member of a public interface (0.x minor bump), and three later tasks branch on this exact name/shape, so renaming later is costly.
  (packages/rocketh-core/src/types.ts Environment; packages/rocketh/src/environment/index.ts:511-521)
- UNRECORDED decision: an empty answer is treated as a VALUE, not a cancellation, but the TextPromptAnswer JSDoc lists 'an empty non-answer' as one of the things cancelled covers. The type doc and the only implementation now disagree, and the interactive resolver task will read that doc. Either drop the empty-answer clause from the JSDoc or map '' to cancelled in Node.
  (packages/rocketh-core/src/types.ts TextPromptAnswer doc vs packages/rocketh-node/src/environment/prompt.ts (typeof value !== 'string') and the test 'treats an empty answer as a value')
- Ratify recorded decisions 1 and 5: the run-parameter field is named promptExecutor (not prompt, which is already the method name and a local answer variable), and @rocketh/web is left entirely untouched with the web-shaped case covered by a fabricated confirm-only prompt in rocketh's tests rather than by importing web's real object. Both look right; note nothing fails if web later gains promptText.
  (decisions note items 1 and 5; packages/rocketh-web/src/index.ts:29-38 confirmed confirm-only)
- Stray JSDoc in the new test file: the block describing the hardhat-deploy / loadEnvironmentFromStore path sits immediately above the doc block for the executor test, so it documents a test that is not there, while the actual loadEnvironmentFromStore test further down has no doc. Tests are documentation in this repo, so this misleads a reader.
  (packages/rocketh/test/prompt-capability.test.ts, the two adjacent doc comments before the executor test)
