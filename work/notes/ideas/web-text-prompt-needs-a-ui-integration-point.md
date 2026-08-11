---
title: '`@rocketh/web` could supply `promptText`, but it needs a UI integration point'
slug: web-text-prompt-needs-a-ui-integration-point
---

# A browser text prompt is wanted eventually, not refused

`@rocketh/web` ships a `PromptExecutor` whose confirm auto-proceeds and which implements no `promptText` (`packages/rocketh-web/src/index.ts`). Its ABSENCE is what `env.canPromptForText()` reads (ADR 0007), so `'ask'` and `'auto'` take the `throw` path in a browser exactly as they do in CI.

That absence is currently described in a few places as "by design". The more accurate position, recorded here so nobody hardens it into a permanent rule: **we may well want a browser text prompt**, and the reason there isn't one is that asking a human something in a browser needs a UI INTEGRATION POINT — a modal, a form, some way for the answer to travel back — which is a different kind of thing from reading a line of stdin. Nothing has forced that design yet.

Two consequences worth knowing before anyone builds it:

- **Do not fence the absence with a test.** A review nit proposed asserting that `@rocketh/web` has no `promptText`, so the deliberate absence could not drift. That fence was deliberately NOT added: it would pin down exactly the thing we might want to change, and it would require exporting a module-private const purely to be asserted on.
- **The capability predicate does not need to change.** `canPromptForText()` is pure method presence, and the runtime decides whether to supply the ability (this is how `@rocketh/node` gates on a TTY). A web runtime that gains a real UI can supply `promptText` the same way, and the whole interactive path works with no core change.

Related: `docs/adr/0007-prompt-capability-on-the-environment-not-the-executor.md`.
