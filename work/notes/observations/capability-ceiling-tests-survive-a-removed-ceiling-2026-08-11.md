---
title: 'The `ask`-degrades-to-`throw` tests still pass with the capability ceiling removed'
slug: capability-ceiling-tests-survive-a-removed-ceiling-2026-08-11
needsAnswers: true
---

# Two capability-ceiling tests are not discriminating

Spotted 2026-08-11 while building `per-call-ask-override-and-deferral-precedence`, by mutating `resolveUnknownSignerBehaviour` (`packages/rocketh/src/environment/unknownSignerPolicy.ts`) so `'ask'` returns `'ask'` regardless of `canPromptForText`.

With that ceiling removed, `packages/rocketh/test/interactive-unknown-signer.test.ts` still passes: "`ask` degrades to `throw` with no text capability, and never hangs" and "`ask` degrades to `throw` for a web-shaped, confirm-only prompt" both assert only `rejects.toBeInstanceOf(UnknownSignerError)`, and a run that ENTERS the interactive path with no `promptText` throws exactly that too (the resolver treats a prompt it cannot call as `prompt-failed` and degrades to the defer path). The user-visible difference is that the broken run first SHOWS the human the `... is PAUSED` presentation. Not fixed here (other task's tests, out of scope); the new tests in `packages/rocketh/test/unknown-signer-policy-precedence.test.ts` and `packages/rocketh-unknown-signer/test/per-call-policy.integration.test.ts` assert the absence of that message and do kill the mutant.
