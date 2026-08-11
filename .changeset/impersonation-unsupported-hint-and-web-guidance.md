---
'@rocketh/core': minor
'rocketh': minor
---

Tell the user when auto-impersonation was enabled but did not resolve the account.

The impersonation attempt deliberately SWALLOWS an unsupported or refused `hardhat_impersonateAccount`, which is what lets `autoImpersonate` be harmless on a provider that is not a dev node. The cost was silence: a user who switched it on against the wrong kind of node got an unknown-signer error later with nothing saying impersonation had ever been tried. `UnknownSignerErrorData` now carries an optional `autoImpersonation` outcome, and the error message says which of two things happened: `'attempted'` (this account WAS a candidate, `hardhat_impersonateAccount` was sent and the node did not accept it) or `'not-a-candidate'` (never attempted for this account, because the candidates are the NAMED accounts the node would otherwise have to sign for). The two shapes have different fixes, so they do not collapse into one message, and the note is printed directly under the error's header rather than after `data:`, which for a deployment is the whole creation bytecode.

With `autoImpersonate` off, the message is byte-for-byte unchanged: no new noise on the common path, where the user never asked for impersonation at all.

It is a MESSAGE detail and nothing more (ADR 0006). `autoImpersonate` remains a NODE CAPABILITY resolved BEFORE the seam and `onUnknownSigner` remains the POLICY afterwards: the outcome is recorded at setup and read only where the error is built, inside the `unsignable` branch, so no control flow, no signability classification and no policy decision changed. Documentation gains the browser/fork route: `@rocketh/web` implements no text prompt by design, so `'ask'` degrades to `throw` there, and the fork answer is impersonation rather than interactivity, with its three real constraints (naming the addresses is mandatory, it needs a node implementing the impersonation RPC, and it is run-level rather than per-transaction).
