---
'@rocketh/core': minor
'@rocketh/node': minor
'@rocketh/test-utils': minor
'rocketh': minor
---

A transaction hash pasted at the interactive unknown-signer prompt that this node has never heard of no longer ends the run: the question is asked again with that hash offered back as the starting value, so a truncated paste, a dropped character or an RPC that had not caught up costs an edit rather than a re-run. Pressing enter on the offered value looks for the same hash again. The re-asking is bounded and shares ONE budget of three questions per pause with the existing malformed-paste re-ask, so alternating the two cannot loop; when it runs out the transaction defers exactly as `cannot sign` does, saving nothing. `PromptExecutor.promptText` requests gain an optional `initial` (the new `TextPromptRequest` type), honoured by `@rocketh/node` through the prompt library's own initial-value support, recorded by the `@rocketh/test-utils` double, and safely ignorable elsewhere; `@rocketh/web` still supplies no text ability.
