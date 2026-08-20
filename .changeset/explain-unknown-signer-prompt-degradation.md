---
'rocketh': minor
---

Explain why an unknown-signer error did not resolve interactively. The documented main path for an account rocketh cannot sign for is that it PAUSES, prints the transaction, and takes back the hash you pasted after executing it out-of-band. The capability ceiling silently turns that into a plain throw wherever no human can be reached, which is exactly CI and `--skip-prompts`, and therefore the first place most people meet the error at all. `UnknownSignerError` now carries a note saying what would have happened with a terminal attached and which of the three conditions applies.

The note is added only when the run WANTED to ask and could not. An explicit `onUnknownSigner: 'throw'` is silent, which includes every `catchUnknownSigner` action (that wrapper scopes `'throw'`), so the defer workflow keeps the message it always had.
