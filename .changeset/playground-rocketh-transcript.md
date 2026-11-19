---
'@rocketh/playground': minor
---

Show rocketh's own transcript (`- Executing ...`, `reusing "..."`) in the log stream. `LogSource` gains `'rocketh'`, and `createLogFactory(target, options?)` builds a `named-logs` factory that writes rocketh's lines into a `LogStream` (warnings as `'warning'`, errors as `'error'`, debug only on request), for a host to install before rocketh loads. A new `@rocketh/playground/log` entry exports the log plumbing without loading rocketh, so that install can be the first import. The `<rocketh-playground>` widget installs such a factory before it lazily loads the core, so its terminal now shows rocketh's lines too.
