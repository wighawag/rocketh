---
'rocketh': patch
---

Recover and verify the deployed address when a DEPLOYMENT is resolved interactively.

A deployment from an unsignable `from` under `onUnknownSigner: 'ask'` already paused, took the hash of the transaction the user executed out-of-band, and inherited the successful-status check. It now also has to prove that the pasted transaction actually deployed something before anything is recorded: an ordinary deployment is saved at the address that transaction's OWN receipt reports as created, while a deterministic or factory deployment — whose address is computed from bytecode and salt before broadcast and is preferred over the receipt's — is saved only once there is CODE at that expected address. The confirmation is code-at-address, never transaction parsing, so the wrapper a multisig executed the deployment inside is irrelevant.

A receipt with no usable contract address (absent OR the zero address, which is truthy and so slipped through every `if (!contractAddress)` check), an expected address holding no code, or an unanswerable `eth_getCode`, all now FAIL LOUDLY and save nothing at all: no deployment record, no pending-transaction state, no gas-report entry. Each error names the deployment, the pasted hash and the transaction that still needs executing.

Normal broadcasts are untouched and gain NO new failure mode — in particular a deterministic deploy that rocketh sends itself is still recorded at its expected address without a code check. The invariants run at the shared broadcast choke point, which now requires each funnel to state whether it is broadcasting an execution or a deployment, so a future funnel cannot reach the seam without the deployment checks applying.
