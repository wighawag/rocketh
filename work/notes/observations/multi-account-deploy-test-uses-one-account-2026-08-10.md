---
title: '"deploying with different named accounts" test deploys twice from `user1`'
slug: multi-account-deploy-test-uses-one-account-2026-08-10
needsAnswers: true
---

# A deploy test named for multiple accounts uses only one

Spotted 2026-08-10 while migrating `packages/rocketh-deploy/test/deploy.integration.test.ts` onto `createTestEnvironment` (task `migrate-deploy-and-read-tests`).

The test `should demonstrate deploying with different named accounts` documents `ContractByUser1` from `user1` and `ContractByUser2` from `user2`, but both `_deploy` calls pass `account: 'user1'`, so nothing distinguishes the two accounts and `user2` is never exercised. Pre-existing (it predates the harness swap) and left untouched, because changing what a test does was outside a harness-migration's scope. A one-word fix (`user1` -> `user2` on the second call) would make the test match its own doc comment, and could additionally assert each dispatched transaction's `from`, which is now observable through the real broadcast path.
