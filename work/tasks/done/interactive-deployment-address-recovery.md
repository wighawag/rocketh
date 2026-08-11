---
title: 'Recover and verify the deployed address on an interactively-deferred deployment'
slug: interactive-deployment-address-recovery
spec: unknown-signer-interactive
blockedBy: [ask-policy-interactive-resolver]
covers: [6]
---

## What to build

Extend the interactive resolver to the DEPLOYMENT path, and make it trustworthy. When a user pastes the hash of a deploy transaction they executed out-of-band, the deployed address must come from that transaction's own receipt, or, for a deterministic or factory deploy where the address is known in advance, be confirmed by code existing at that address. A wrong or failed hash must FAIL rather than silently save a bad deployment record.

The asymmetry that makes this its own task: an execution has no address to anchor on (its residual risk was accepted in the previous task), whereas a deployment DOES, so a deployment can and must be held to a stricter standard.

Rules:

- Ordinary deploy: take the address from the receipt's contract address, and save the deployment under its name through the same state-saving path a normal broadcast uses.
- Deterministic or factory deploy: the expected address is already known before broadcast, and the environment already PREFERS that expected address over the receipt's. Confirm the contract is really there by checking for code at it. Do not parse the transaction to derive the address.
- Fail loudly, saving nothing, when: the receipt reports a non-success status; or there is no usable contract address (absent OR the zero address) and no code at the expected address.

## Acceptance criteria

- [ ] Under the interactive policy, a deploy from an unsignable `from` pauses, accepts a pasted hash, and saves the deployment under its name with the address taken from the receipt.
- [ ] For a deploy with an EXPECTED address (deterministic or factory), the address is accepted only when there is CODE at it. The check is code-at-address based, never transaction parsing. Tested.
- [ ] A receipt with no usable contract address FAILS LOUDLY, names the deployment and the pasted hash, and saves NO deployment record. Cover BOTH shapes explicitly: absent, and the zero address. The zero-address case matters because the existing mock receipt default falls back to the zero address, so an "absent" test alone would not catch it.
- [ ] A reverted receipt on the deployment path fails loudly and saves nothing, tested here rather than assumed from the execution path, so the deployment path cannot bypass the shared receipt invariant.
- [ ] The execution path from the blocking task is UNCHANGED and its tests still pass untouched.
- [ ] A normally-broadcast deployment from a signable account is completely unaffected, and in particular a normal deterministic deploy gains NO new failure mode. If you decide to tighten the code-at-address check for normal deploys too, that is a deliberate behaviour change: say so in the done record and cover it with a test.
- [ ] Tests live in `packages/rocketh/test/`, build a real environment locally with a mock provider, and drive `env.broadcastDeployment` (the funnel `@rocketh/deploy` itself uses) rather than importing `@rocketh/deploy`, which would close an nx project-graph cycle.
- [ ] Documentation states what the interactive deployment path guarantees: the address comes from the receipt or is verified on-chain, and a bad hash fails instead of saving. It extends the existing "Handling unknown signers" section established by the blocking task, not a new section.
- [ ] A changeset accompanies the change.
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass.

## Blocked by

- `ask-policy-interactive-resolver`: supplies the policy value, the resolver, and the shared receipt-invariant checks this task extends. It also edits the same environment module and the same documentation section, so the ordering serialises those edits.

## Prompt

> Goal: make an interactively-deferred DEPLOYMENT trustworthy. When a user pastes the hash of a deploy transaction they executed on their Safe, the deployed address must be recovered from that transaction's receipt, or confirmed on-chain at the expected address for a deterministic deploy, and a bad hash must fail loudly instead of saving a wrong deployment.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Confirm the resolver and the shared receipt-invariant checks landed with the shape this task assumes.
>
> FORWARD-POINTER, added by the conductor after reviewing `ask-policy-interactive-resolver` (2026-08-10). That task deliberately did NOT gate the resolver to executions, and this was RATIFIED at review. The resolver sits at the shared broadcast choke point, so a DEPLOYMENT from an unsignable `from` ALREADY pauses, asks, accepts a pasted hash, and inherits the receipt STATUS check. What it does NOT yet do is the address work, which is exactly this task: recovering the address from the receipt, verifying code at the expected address for a deterministic deploy, and failing loudly on an absent or zero address. Concretely, the deployed address is currently taken as `expectedAddress || receipt.contractAddress`, so a successful-but-unrelated pasted hash can still save a deployment record at an address that may hold no code. That is the hole you are closing.
>
> So: finding that deployments already resolve interactively is EXPECTED and is NOT drift. Do NOT route to needs-attention for that reason, and do NOT re-gate the resolver to executions. Build ON the existing resolution path and add the address invariants to it. Route to needs-attention only if something OTHER than this differs from what the task assumes, for example if the address verification itself already landed, or if the shared status check is absent.
>
> The mechanic is VERIFIED, not assumed. The 2026-08-09 spike established that the DEPLOYMENT half works against the code as it stands: feeding a user-supplied hash back from the broadcast choke point recovers the address from the receipt's contract address and saves the deployment under its name, with no send attempted.
>
> The fact that shapes this task. The environment already computes a deployment's address as "the expected address if there is one, otherwise the receipt's contract address" (in `packages/rocketh/src/environment/index.ts`, in the pending-deployment wait path). Deterministic deploys therefore already carry an expected address computed from bytecode and salt before broadcast, which is exactly why the on-chain code check, not transaction parsing, is the right confirmation for them. Read that line before designing, and cite it in the done record.
>
> Where to look. The state-saving funnel for deployments is `savePendingDeployment` in the same module; `broadcastDeployment` returns via it. Build ON that pipeline rather than reimplementing it.
>
> Placement note, not a prescription. The choke point already accepts an `origin` bag for exactly this class of "what produced this transaction" information: it carries the contract enrichment today, and its doc comment explains why widening a private closure's parameters was chosen over catch-and-rethrow. `broadcastDeployment` currently passes no such bag while it DOES hold the expected address, so extending from there is the cheapest honest route. Any placement is acceptable as long as the invariants hold and the check cannot be skipped by a future caller.
>
> Do not weaken the failure. The point of this task is that a wrong hash CANNOT silently produce a deployment record. When in doubt, fail and name what was wrong. Remember the repo convention that the error message is the deliverable.
>
> Invariants from the landed unknown-signer work still bind you: the policy frame forces `throw` over `ask` and never over impersonation, it is consulted only in the `unsignable` branch, `autoImpersonate` is a node capability resolved before the seam, and a pre-signed `raw` transaction never reaches the seam at all. ADR 0006 is the durable record.
>
> Done means: an interactively-deferred deployment saves the right address or fails loudly, deterministic deploys are confirmed by code at the expected address, normal deploys are untouched, and the execution path from the previous task still passes unchanged.

## Decisions

_Transcribed from `work/notes/observations/decisions-interactive-deployment-address-recovery-2026-08-10.md`, deleted in the same commit. That note predated the protocol rule (synced 2026-08-11) that gives a builder's rationale exactly ONE home: a `## Decisions` block in the done record. The rationale is reproduced unchanged below, followed by the human's ratification._

_Decisions taken while building `interactive-deployment-address-recovery` (2026-08-10)_

Recorded here because each is user-visible, introduces a refusal, or shapes a shared seam other tasks reach, and the task body (which the runner moves) is not mine to edit. Each also carries a JSDoc at its choice site in `packages/rocketh/src/environment/index.ts`.

### 1. The choke point's `origin` bag became REQUIRED and DISCRIMINATED

`broadcastTransaction`'s second parameter was `origin?: {contract?}`; it is now a required `BroadcastOrigin`, either `{type: 'execution', contract?}` or `{type: 'deployment', name, expectedAddress?}`. The task asked that the new invariants "cannot be skipped by a future caller", and an optional bag cannot deliver that: a future funnel could reach the seam without saying what it was broadcasting and would silently skip the deployment checks. Required, the compiler asks the question. Alternative considered: keep it optional and infer "deployment" from the presence of a `name` (rejected: absence would then mean "execution" AND "caller forgot", which is the hole again). What it touches: nothing exported. `broadcastTransaction` is a private closure with exactly two callers, both in this module, and is deliberately absent from the `Environment` interface, so this widens no public surface.

### 2. NEW REFUSAL: an interactively-pasted hash that deployed nothing fails the run

`requireDeployedContract` throws a plain `Error` naming the deployment, the pasted hash and the whole transaction that still needs executing. It runs immediately after the shared status check and BEFORE the pending-transaction file is written, before the hash is registered with the gas tracker, and before `save`, so a bad paste leaves nothing at all behind. Three shapes fail: no code at a known expected address; a receipt whose `contractAddress` is absent; and a receipt whose `contractAddress` is the ZERO address. The zero address is called out because it is truthy, so the pre-existing `if (!contractAddress)` in `waitForDeploymentTransactionAndSave` (`packages/rocketh/src/environment/index.ts`, the `expectedAddress || receipt.contractAddress` line this task was told to read) waves it straight through into a saved deployment record. Alternative considered: a new exported error class (rejected on the same grounds as decision 2 of the `ask-policy-interactive-resolver` note: the message IS the deliverable and nothing needs to branch on it programmatically).

### 3. When an expected address exists, the receipt's own contract address is IGNORED

For a deterministic or factory deploy the check is code at the EXPECTED address only, even when the receipt also reports a `contractAddress`. Rationale: the expected address is the one that gets recorded (the environment prefers it), so it is the only one worth confirming, and a factory deploy's receipt names the factory call rather than the contract created inside it, so cross-checking the two would fail every legitimate create2/create3 deployment. This is pinned by a test that gives the receipt a DIFFERENT address from the expected one. Alternative considered: require both (rejected: would break the factory case outright).

### 4. NEW REFUSAL: an unanswerable `eth_getCode` fails the deployment rather than being ignored

If the node errors on the code lookup, the run fails naming the deployment, the address and the RPC error. Unable to confirm is not the same as confirmed, and this whole path exists so an unconfirmed deployment is never recorded. Alternative considered: treat an RPC error as "no code" (rejected: the message would blame the user's hash for the node's outage) or as "assume fine" (rejected: it silently reopens the hole).

### 5. Normal broadcasts deliberately gain NO code check

The acceptance criteria allowed tightening the code-at-address check for normally-broadcast deterministic deploys too, explicitly as a deliberate behaviour change. I did NOT: rocketh sent those transactions itself, so there is nothing to distrust, and a code check there would be a new failure mode for every existing deterministic deploy (a node lagging a block behind the receipt it just returned). The invariants live inside the `unsignable` + interactive branch only, and an anti-regression test asserts the ABSENCE of `eth_getCode` on a signable-account deterministic deploy. What it touches: if a later task wants that tightening it is a separate, deliberate change with its own changeset.

### 6. Coherence check on `origin` (noted, NOT introduced by this task)

`origin` now means two things in this module: the choke point's "what produced this transaction" bag (named by `unknown-signer-contract-enrichment`, extended here), and `PendingTransaction.transaction.origin`, which is the SENDER ADDRESS of a pending transaction. Both predate this task and neither is in `CONTEXT.md`'s glossary. I reused the existing parameter name rather than forking a third term, and named the type `BroadcastOrigin` to keep it locally unambiguous. Flagged so the collision is visible before a third meaning appears; renaming either is out of scope here.

### Ratification (2026-08-11 observation triage)

**Rename now.** Done: the choke point's "what produced this transaction" bag is now `BroadcastSource` (parameter `source`), and `PendingTransaction.transaction.origin` keeps the name and its meaning, the SENDER ADDRESS. A glossary note alone was the cheaper option but leaves the ambiguity in place; both names are module-private (`broadcastTransaction` is a closure absent from the `Environment` interface, with exactly two callers), so renaming is cheap TODAY and gets expensive the moment a third meaning appears. Landed with an empty changeset, since nothing exported moves.
