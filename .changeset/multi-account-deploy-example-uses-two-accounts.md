---
---

Test-only: the `@rocketh/deploy` "deploying with different named accounts" example now actually deploys from two accounts (the second call passed `user1`, so `user2` was never exercised) and asserts each dispatched transaction's `from`, which the real broadcast path makes observable.
