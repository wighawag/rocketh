---
'@rocketh/core': minor
'@rocketh/read-execute': minor
'@rocketh/unknown-signer': minor
'rocketh': minor
---

Unknown-signer ergonomics for a Safe-owned call executed through the Safe app.

- The called function's ABI is printed with an unsignable contract call, as one JSON line (`abi: [...]`) next to `contract:`, ready to paste into a Safe's Transaction Builder when it cannot fetch the target's ABI. `execute` takes it from the deployment it was given (for an overloaded function, the overload actually encoded) and passes it on the new optional `UnknownSignerContractCall.abi`. The thrown `UnknownSignerError`, the interactive pause and `catchUnknownSigner`'s printed block show it; `catchUnknownSigner`'s returned value is unchanged (v1's four keys) and captured transactions do not carry it.
- The deployment named in the unknown-signer message is found without merging ABIs, so a proxy address (whose main and `_Proxy` records share functions such as `owner()`) no longer logs a "could not resolve a deployment name ... ABI conflict" warning. When several records share the address, the main record is named rather than a `_Proxy` / `_Implementation` one.
- A pasted transaction sent to the account rocketh could not sign for is no longer accepted on that basis alone. A Safe `execTransaction` is decoded: one whose inner call is exactly the request (same `to`, `value`, `data`, operation CALL) is accepted as "the Safe executed exactly this call"; one that executed something else goes to the confirmation prompt, which says what the Safe executed instead. A transaction to the account that carries the requested calldata verbatim (a MultiSend through the Safe, a timelock) is still accepted; one that shows nothing of what it executed is now confirmed by the user rather than accepted silently.
