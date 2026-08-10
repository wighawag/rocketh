<!-- dorfl-sidecar: item=observation:multi-account-deploy-test-uses-one-account-2026-08-10 type=observation slug=multi-account-deploy-test-uses-one-account-2026-08-10 allAnswered=false -->

Item: [`observation:multi-account-deploy-test-uses-one-account-2026-08-10`](../notes/observations/multi-account-deploy-test-uses-one-account-2026-08-10.md)

## Q1

**When the second _deploy call is switched to account: 'user2', should the test also assert each dispatched transaction's from address (now observable via createTestEnvironment's real broadcast path), or is the minimal one-word fix sufficient?**

> packages/rocketh-deploy/test/deploy.integration.test.ts:244-254 — both _deploy calls currently pass account: 'user1' despite the doc comment naming user1 and user2. The observation notes the fix could 'additionally assert each dispatched transaction's from'.

_Suggested default: Add the from-address assertions — they make the test actually enforce what its name and doc comment promise, and the real broadcast path already exposes them._

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):
