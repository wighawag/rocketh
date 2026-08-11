---
'rocketh': patch
---

Docs/comments only: correct a documented invariant that `withUnknownSignerPolicy` falsified. `unknownSignerPolicy.ts` (and ADR 0006) claimed the `Promise.all` frame leak could only make a concurrent action throw where it would have prompted, "never the other way round, since a frame only ever forces `throw`" — true only while `catchUnknownSigner` was the sole thing pushing a frame. A per-call override can push `'ask'` or `'auto'`, so the leak now runs in both directions; the capability ceiling still applies to a leaked frame. `documentation.md` also gains the missing nesting caveat on `catchUnknownSigner` (an explicit override written inside it wins), documents the per-call `'auto'` meaning, and moves the `withUnknownSignerPolicy` subsection after the deployment paragraphs it had orphaned.
