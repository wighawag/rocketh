---
'@rocketh/node': minor
---

`rocketh --write-transactions <file>` writes the transactions a run broadcast, in order, as JSON. Written once, atomically, at the end of a successful run: a run that throws writes nothing and leaves any previous file untouched, and a run without the flag writes no new file at all.
