---
'rocketh': patch
---

Weigh whether a pasted transaction is actually the one rocketh asked for, instead of accepting any successful hash.

When rocketh cannot sign, the interactive path prints the transaction, the user executes it out-of-band and pastes back a hash. For an EXECUTION, the whole of the check was that the hash existed on this network and its receipt reported success. Pasting the hash of an unrelated successful transaction therefore recorded that transaction as the requested proxy upgrade, diamond cut or ownership transfer. A deployment was already held to a stricter standard (`requireDeployedContract` proves code exists at the expected address); an execution had no anchor at all.

**Equality is not the fix.** A Safe execution is not the transaction rocketh described: it goes to the Safe, carries rocketh's call as an inner payload, and is signed by an owner who is not the `from` at all. A timelock adds another layer. So a mismatch cannot be refused and a match cannot be required.

The evidence is ranked instead, and the transaction is already in hand (it is fetched before waiting for the receipt), so this costs no extra RPC:

- **direct**: same `to`, `data` and `value`. It IS the transaction. Values compare numerically, since `0x0`, `0x00` and `0` are the same amount written by different tools.
- **account**: sent TO the account rocketh needed to act as, which is what every Safe execution looks like from outside. Deliberately outranks `embedded`: it names the executing account rather than merely finding bytes.
- **embedded**: rocketh's calldata appears verbatim inside the transaction's input, which is what a Safe `execTransaction`, a MultiSend batch or an OpenZeppelin `TimelockController.execute` payload looks like. Wallet-agnostic: no ABI is decoded and no wallet is recognised. Empty calldata is excluded, since `0x` is a substring of everything and a plain ETH transfer would otherwise match every transaction ever mined.
- **none**: nothing links the two.

The first three are accepted and the run now says WHICH one matched, because it is about to record a privileged operation as done on the strength of it.

**`none` asks rather than refuses**, and that is the load-bearing decision. Governance executed by identifier, such as Governor Bravo's `execute(uint256 proposalId)` where the payload was queued in an earlier transaction, carries no trace of the calldata: refusing would break a legitimate workflow. It is also exactly what pasting the wrong hash looks like, and rocketh cannot tell them apart, so it stops and says so. Only an explicit `yes` records it; anything else, including an empty line, a cancelled prompt or a prompt that cannot reach a human, defers the transaction with the same `UnknownSignerError` any other deferral raises, so `catchUnknownSigner` handles it identically and nothing is saved.

This narrows, but does not remove, the residual risk documented in "Handling unknown signers": a user who deliberately confirms the wrong transaction is still believed. What it removes is the silent case.

Two test mocks returned an `eth_getTransactionByHash` result with no `to`, `input` or `value`, which no node does; they now return the Safe-execution shape they were always meant to model.
