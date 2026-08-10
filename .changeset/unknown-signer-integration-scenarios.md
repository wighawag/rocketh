---
---

Test-only: add the headline unknown-signer scenarios to `@rocketh/unknown-signer` as integration-tests-as-documentation: a Safe-governed proxy upgrade, the transaction-agnostic cases (`tx`, deploy, `execute`, value transfer), a mixed signable/unsignable run, the execute-out-of-band-then-re-run loop (including the assertion that nothing is persisted between the runs), and the `autoImpersonate: false` recipe for exercising the path yourself. Adds `@rocketh/deploy`, `@rocketh/proxy`, `@rocketh/read-execute` and `viem` as devDependencies of that package; its runtime dependency stays `@rocketh/core` alone. No published behaviour changes.
