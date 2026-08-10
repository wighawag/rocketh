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
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Confirm the resolver and the shared receipt-invariant checks landed with the shape this task assumes. If the blocking task solved the deployment case too, or solved it differently, do NOT duplicate or fight it: route to needs-attention with what you found.
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
