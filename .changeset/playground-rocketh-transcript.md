---
'@rocketh/playground': minor
---

Let a host show rocketh's own transcript (`- Executing ...`, `reusing "..."`) in the log stream. `LogSource` gains `'rocketh'`, and `createLogFactory(target, options?)` builds a `named-logs` factory that writes rocketh's lines into a `LogStream` (warnings as `'warning'`, errors as `'error'`, debug only on request), for a host to install in a realm it owns, such as the worker that runs the deploy scripts, before rocketh loads. A new `@rocketh/playground/log` entry exports the log plumbing without loading rocketh, so that install can be the first import. The terminal renders the new source.
