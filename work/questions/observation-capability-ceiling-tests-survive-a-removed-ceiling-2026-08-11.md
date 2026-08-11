<!-- dorfl-sidecar: item=observation:capability-ceiling-tests-survive-a-removed-ceiling-2026-08-11 type=observation slug=capability-ceiling-tests-survive-a-removed-ceiling-2026-08-11 allAnswered=false -->

Item: [`observation:capability-ceiling-tests-survive-a-removed-ceiling-2026-08-11`](../notes/observations/capability-ceiling-tests-survive-a-removed-ceiling-2026-08-11.md)

## Q1

**Should the two non-discriminating assertions in packages/rocketh/test/interactive-unknown-signer.test.ts ('ask degrades to throw with no text capability, and never hangs' and 'ask degrades to throw for a web-shaped, confirm-only prompt') be strengthened to also assert the absence of the '... is PAUSED' presentation, so they kill the ceiling-removed mutant on their own — or is it enough that the newer tests in unknown-signer-policy-precedence.test.ts and per-call-policy.integration.test.ts already cover that mutant?**

> The observation notes both interactive tests assert only rejects.toBeInstanceOf(UnknownSignerError). With resolveUnknownSignerBehaviour mutated so 'ask' returns 'ask' regardless of canPromptForText, the resolver still ends up in the defer/throw path (prompt-cannot-be-called ⇒ prompt-failed) and throws UnknownSignerError anyway — the only user-visible regression is that the human first sees the PAUSED message. The observation body flags this as out of scope for the task that spotted it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):
