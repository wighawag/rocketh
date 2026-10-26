---
'@rocketh/proxy': patch
---

`deployViaProxy` now refuses an `execute` that mixes the flat form (`{methodName, args}`) with `init` / `onUpgrade`, before deploying anything. Such a value used to run the flat call and silently ignore `init` / `onUpgrade`.
