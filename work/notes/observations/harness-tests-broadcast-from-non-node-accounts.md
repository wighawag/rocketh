---
date: 2026-08-09
needsAnswers: true
---

While landing `unknown-signer-broadcast-seam`, six tests in `packages/rocketh-test-utils/test/createTestEnvironment.test.ts` broke: they broadcast from `{deployer: NODE_ACCOUNT_LOWER}` without declaring `nodeAccounts`, so the account is a `remote` signer the mock node does not list in `eth_accounts` — i.e. `unsignable` — and the new seam now throws instead of letting `eth_sendTransaction` be called on a mock that answers everything. Fixed in place by declaring `nodeAccounts` (and by updating the one test that asserted the old `cannot get signer` message to assert `UnknownSignerError`), which is what those tests meant all along. Worth knowing for other harness users: `createTestEnvironment` defaults `nodeAccounts` to `[]`, so a bare-address named account is unsignable unless `nodeAccounts` or `autoImpersonate` says otherwise.
