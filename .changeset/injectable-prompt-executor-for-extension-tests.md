---
'@rocketh/test-utils': minor
---

Export `createMockPromptExecutor`, a fake prompt so extension-package tests can drive the INTERACTIVE unknown-signer path (`onUnknownSigner: 'ask'`) with no TTY. It answers scripted text prompts in order — a canned transaction hash to continue the run, `'cannot sign'` to defer, `{cancelled: true}` for an aborted prompt, an `Error` for a prompt with no terminal behind it — and RECORDS every request it received (`requests`, `textRequests`), so a test can assert what the human was asked, or that nobody was asked at all. OMITTING `textAnswers` entirely returns the CAPABILITY-ABSENT shape (no `promptText` method), which is what makes `'ask'` degrade to `'throw'` (ADR 0007); passing an EMPTY array is different, giving a text-capable prompt whose script is already exhausted.

It is injected through `createTestEnvironment`'s existing run-parameter pass-through (`executionParams.promptExecutor`); no harness option was added, and no environment is fabricated — this is a prompt double only.
