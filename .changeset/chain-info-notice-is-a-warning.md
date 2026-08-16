---
'rocketh': patch
---

Report a chain with no public info as a warning, not an error.

`getChainConfigFromUserConfig` wrote `chain with id <id> has no public info` to `console.error`, then immediately substituted placeholder chain metadata and carried on. The condition is handled and expected (`info` is optional in `ChainUserConfig`), so anything classifying rocketh's output by severity saw a failure during a completely healthy run: the docs playground, which captures the console, painted a red error line through the middle of a successful deploy.

It is now `console.warn`, and the message says what it fell back to. A double space in the text (`chain with id 31337  has no public info`, from an empty conditional clause between two spaces) is fixed at the same time.

`console.warn` and `console.error` both go to stderr in Node, and the substring `has no public info` is unchanged, so redirects and greps keep matching. Tooling that classifies rocketh's stderr BY SEVERITY will see this line move from error to warn, which is the point of the change. The notice deliberately stays on `console` rather than moving to the `named-logs` logger used elsewhere in the package, because `named-logs` returns a no-op unless a factory has been hooked first and only the `@rocketh/node` CLI does that; see `docs/adr/0009-user-facing-notices-stay-on-console.md`.
