---
'@rocketh/core': minor
'rocketh': minor
'@rocketh/node': minor
'@rocketh/unknown-signer': patch
---

Add the `'ask'` unknown-signer policy and the interactive resolver at the broadcast seam.

`onUnknownSigner` is now `'throw' | 'ask' | 'auto'`, and `'auto'` (still the default) is CAPABILITY-AWARE: it resolves to `'ask'` where the run can ask a human for text (`env.canPromptForText()`, i.e. a `PromptExecutor` implementing `promptText`) and to `'throw'` where it cannot. Capability is a CEILING, so an explicit `'ask'` also degrades to `'throw'` without a prompt. `@rocketh/node` now supplies its `promptText` ONLY when stdin is a terminal, so a CI run (whose stdin is not) simply has no text capability and takes the throw path: it never prompts and never hangs. The gate lives in the runtime rather than in `canPromptForText()`, which stays pure method presence (ADR 0007), because `prompts` asked a question with no terminal behind it never settles and never rejects (measured in `docs/spikes/ask-policy-interactive-resolver/prompts-non-tty-behaviour.md`).

Under `'ask'`, a transaction whose `from` is unsignable PAUSES: rocketh presents the exact transaction (the undegraded `UnknownSignerError` message), the user executes it out-of-band on their Safe and pastes the resulting transaction hash, and the run CONTINUES through the same pending-transaction pipeline a normal broadcast uses, returning a real receipt with no send RPC attempted. Because the resolver resolves instead of throwing, a multi-step governed action pauses at each unsignable step and completes in ONE run. The pasted hash is registered with the transaction-hash tracker, so gas reporting does not omit an externally-executed transaction. A hash this node has never heard of is looked up for a bounded number of rounds and then reported as NOT FOUND rather than polled for ever, and a receipt without a successful status fails loudly, naming both the transaction and the pasted hash; neither saves anything. The receipt fetched to check that is handed to the pipeline, so one pasted transaction is waited for once.

Answering "cannot sign" (or pressing enter, aborting the prompt, or failing to paste a valid hash) degrades to the existing defer workflow: the full transaction is printed and the same `UnknownSignerError` is thrown, still caught by `catchUnknownSigner`. Signable accounts are entirely unaffected — the policy is still consulted only inside the `unsignable` branch, so `local`, `node` and `impersonated` accounts broadcast exactly as before, and a pre-signed `raw` transaction never reaches the seam. `@rocketh/unknown-signer` only gains doc-comment corrections now that `'ask'` exists.
