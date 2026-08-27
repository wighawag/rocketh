---
'@rocketh/read-execute': minor
---

A guard that cannot produce a verdict now fails the run instead of being mistaken for "not satisfied": a read that reverts, a target that returns no data once the inherited retry is exhausted, a slot that cannot be read or decoded, and a `satisfied` predicate that throws all abort before the transaction is built, so nothing is broadcast. The failure surfaces as a `GuardEvaluationError` (new, on the `@rocketh/read-execute/errors` subpath) naming the guard, the function or slot it reads and the target it reads it on, and keeping the underlying failure whole on `cause`.
