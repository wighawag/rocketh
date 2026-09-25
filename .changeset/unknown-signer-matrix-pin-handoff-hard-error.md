---
---

Test-only: `@rocketh/unknown-signer` scenarios now pin that the deployer-to-governance handoff (script names the multisig while the deployer still owns the ProxyAdmin) throws a plain `Error` that `catchUnknownSigner` rethrows, and that a wrapped signable `transferOwnership` broadcasts and returns `null`.
