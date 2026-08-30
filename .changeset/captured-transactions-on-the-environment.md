---
'@rocketh/core': minor
'rocketh': minor
---

A run now remembers what it sent: `env.capturedTransactions` holds every transaction the run broadcast, in order, each carrying the intent (or the raw payload it relayed) and the sender's signability.
