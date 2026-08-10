---
needsAnswers: true
---

# Decisions taken while building `interactive-deployment-address-recovery` (2026-08-10)

Recorded here because each is user-visible, introduces a refusal, or shapes a shared seam other tasks reach, and the task body (which the runner moves) is not mine to edit. Each also carries a JSDoc at its choice site in `packages/rocketh/src/environment/index.ts`.

## 1. The choke point's `origin` bag became REQUIRED and DISCRIMINATED

`broadcastTransaction`'s second parameter was `origin?: {contract?}`; it is now a required `BroadcastOrigin`, either `{type: 'execution', contract?}` or `{type: 'deployment', name, expectedAddress?}`. The task asked that the new invariants "cannot be skipped by a future caller", and an optional bag cannot deliver that: a future funnel could reach the seam without saying what it was broadcasting and would silently skip the deployment checks. Required, the compiler asks the question. Alternative considered: keep it optional and infer "deployment" from the presence of a `name` (rejected: absence would then mean "execution" AND "caller forgot", which is the hole again). What it touches: nothing exported. `broadcastTransaction` is a private closure with exactly two callers, both in this module, and is deliberately absent from the `Environment` interface, so this widens no public surface.

## 2. NEW REFUSAL: an interactively-pasted hash that deployed nothing fails the run

`requireDeployedContract` throws a plain `Error` naming the deployment, the pasted hash and the whole transaction that still needs executing. It runs immediately after the shared status check and BEFORE the pending-transaction file is written, before the hash is registered with the gas tracker, and before `save`, so a bad paste leaves nothing at all behind. Three shapes fail: no code at a known expected address; a receipt whose `contractAddress` is absent; and a receipt whose `contractAddress` is the ZERO address. The zero address is called out because it is truthy, so the pre-existing `if (!contractAddress)` in `waitForDeploymentTransactionAndSave` (`packages/rocketh/src/environment/index.ts`, the `expectedAddress || receipt.contractAddress` line this task was told to read) waves it straight through into a saved deployment record. Alternative considered: a new exported error class (rejected on the same grounds as decision 2 of the `ask-policy-interactive-resolver` note: the message IS the deliverable and nothing needs to branch on it programmatically).

## 3. When an expected address exists, the receipt's own contract address is IGNORED

For a deterministic or factory deploy the check is code at the EXPECTED address only, even when the receipt also reports a `contractAddress`. Rationale: the expected address is the one that gets recorded (the environment prefers it), so it is the only one worth confirming, and a factory deploy's receipt names the factory call rather than the contract created inside it, so cross-checking the two would fail every legitimate create2/create3 deployment. This is pinned by a test that gives the receipt a DIFFERENT address from the expected one. Alternative considered: require both (rejected: would break the factory case outright).

## 4. NEW REFUSAL: an unanswerable `eth_getCode` fails the deployment rather than being ignored

If the node errors on the code lookup, the run fails naming the deployment, the address and the RPC error. Unable to confirm is not the same as confirmed, and this whole path exists so an unconfirmed deployment is never recorded. Alternative considered: treat an RPC error as "no code" (rejected: the message would blame the user's hash for the node's outage) or as "assume fine" (rejected: it silently reopens the hole).

## 5. Normal broadcasts deliberately gain NO code check

The acceptance criteria allowed tightening the code-at-address check for normally-broadcast deterministic deploys too, explicitly as a deliberate behaviour change. I did NOT: rocketh sent those transactions itself, so there is nothing to distrust, and a code check there would be a new failure mode for every existing deterministic deploy (a node lagging a block behind the receipt it just returned). The invariants live inside the `unsignable` + interactive branch only, and an anti-regression test asserts the ABSENCE of `eth_getCode` on a signable-account deterministic deploy. What it touches: if a later task wants that tightening it is a separate, deliberate change with its own changeset.

## 6. Coherence check on `origin` (noted, NOT introduced by this task)

`origin` now means two things in this module: the choke point's "what produced this transaction" bag (named by `unknown-signer-contract-enrichment`, extended here), and `PendingTransaction.transaction.origin`, which is the SENDER ADDRESS of a pending transaction. Both predate this task and neither is in `CONTEXT.md`'s glossary. I reused the existing parameter name rather than forking a third term, and named the type `BroadcastOrigin` to keep it locally unambiguous. Flagged so the collision is visible before a third meaning appears; renaming either is out of scope here.
