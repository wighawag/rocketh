---
title: "Stale comment: the executor still says `'auto'` degrades to `'throw'` because no interactive resolver exists"
slug: executor-comment-says-no-interactive-resolver-exists-2026-08-11
needsAnswers: true
---

# `resolveExecutionParams` comment predates the `'ask'` resolver

Spotted 2026-08-11 while checking the `onUnknownSigner` precedence chain for `per-call-ask-override-and-deferral-precedence`.

`packages/rocketh/src/executor/index.ts` (the `onUnknownSigner` resolution block, around line 260) still reads "`'auto'` degrades to `'throw'` at the seam while no interactive resolver exists, so a CI run never prompts". The resolver landed with `ask-policy-interactive-resolver`: `'auto'` now resolves to `'ask'` wherever the run can ask a human for text, and it is the CAPABILITY (no `promptText` on a non-TTY run), not the absence of a resolver, that keeps CI from prompting. The resolution logic itself is correct and unchanged; only the comment's reason is stale. Not fixed here (outside this task's scope).
