---
"rocketh": patch
"@rocketh/core": patch
---

Expose `env.addressSignability`, a four-state (`local` / `node` / `impersonated` / `unsignable`) classification of whether rocketh can sign for a given address. Computed after auto-impersonation runs, keyed by lowercased address (like `addressSigners`), returns `'unsignable'` for an address never seen during setup. Additive — no existing behaviour changes and no transaction routing changes.

Also narrows the auto-impersonation candidate set to named accounts whose resolved signer is `remote` (matching the helper's own doc comment). Before, `hardhat_impersonateAccount` was also sent for `signerOnly` accounts (privateKey, hardware, protocol) that already sign locally, wasting RPC. Dev/fork-only, since `autoImpersonate` is enabled only on simulated networks; the accepted risk is that a script calling `eth_sendTransaction` directly from a privateKey-derived named account on a dev node (which worked by accident) will stop working — those calls should now go through `broadcastExecution`.
