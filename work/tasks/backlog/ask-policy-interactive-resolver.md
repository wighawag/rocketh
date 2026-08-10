---
title: "Add the 'ask' policy and the interactive resolver at the broadcast seam"
slug: ask-policy-interactive-resolver
spec: unknown-signer-interactive
blockedBy: [prompt-capability-on-the-environment]
covers: [1, 2, 4, 5]
---

## What to build

The heart of the spec: when a transaction's `from` is unsignable, PAUSE, show the user the transaction, let them execute it out-of-band, accept the resulting transaction hash, and CONTINUE in the same run with state saved. Because the resolver RESOLVES instead of throwing, execution stays inside the wrapped action, so a multi-step governed action pauses at each step and completes in ONE run.

Scope of THIS task is the EXECUTION path. The deployment path (recovering a deployed address) is the next task; do not build it here.

Three pieces:

1. **A third policy value, `ask`.** The policy union is `'throw' | 'auto'` today. Add `'ask'`, and make `'auto'` CAPABILITY-AWARE: it resolves to `ask` when a text prompt is available for this run, else `throw`. CI must never hang.
2. **The resolver at the seam.** Under `ask`, present the transaction details, then offer two answers: paste the executed transaction hash, or "cannot sign". A pasted hash routes through the SAME state-saving path a normal broadcast uses, so nothing bespoke reimplements the pipeline. "Cannot sign" prints the full details and throws, degrading gracefully to the existing defer workflow.
3. **Receipt invariants, not a verification layer.** Require a successful status. Do NOT attempt to decode MultiSend or Timelock payloads, and do NOT try to match `to`/`data`. The residual, accepted risk for an execution (which has no address to anchor on) is that a user could paste a successful-but-wrong transaction: same trust boundary as v1, but stricter, since we at least require success. Document it rather than engineering around it.

Also register the pasted hash with the transaction-hash tracker, so gas reporting does not silently omit an externally-executed transaction.

## Acceptance criteria

- [ ] The policy union gains `ask`. `auto` resolves to `ask` when a text prompt is available and to `throw` when it is not, and a test pins BOTH directions.
- [ ] With NO text capability, `ask` itself degrades to `throw`. It never prompts and never hangs, so a CI run cannot block (covers story 5). Tested explicitly.
- [ ] Under `ask` with a capability, an unsignable `from` on an execution PAUSES, presents the transaction, accepts a pasted hash, saves state through the normal pending-execution path, and RETURNS a real receipt with NO send RPC attempted. Assert the absence of `eth_sendTransaction` and `eth_sendRawTransaction` in the recorded traffic: that absence is the whole point.
- [ ] Answering "cannot sign" prints the full transaction details and throws the existing unknown-signer error, catchable by `catchUnknownSigner` (covers story 4).
- [ ] A multi-step action containing TWO unsignable steps pauses at each and completes BOTH in one run, with state saved for each (covers story 2). This is the test that proves resolving beats throwing.
- [ ] A receipt whose status is not success FAILS LOUDLY, names the transaction and the pasted hash, and saves NO state. Tested.
- [ ] The pasted hash is registered with the transaction-hash tracker, so gas reporting includes it. Tested by asserting the hash appears in the tracker's list after an interactive resolution.
- [ ] The policy is still consulted ONLY inside the `unsignable` branch of the broadcast choke point. A `local`, `node` or `impersonated` account with an `ask` policy in force broadcasts EXACTLY as before, and a test pins that (this invariant has drifted through three documents before, see ADR 0006).
- [ ] A pre-signed `raw` transaction still returns before any signer lookup and can never reach the resolver. Tested.
- [ ] Documentation extends the EXISTING "Handling unknown signers" section rather than creating a new one, and states the accepted residual risk for executions.
- [ ] Tests live in `packages/rocketh/test/`, build a real environment locally with a mock provider, and drive `env.broadcastExecution` rather than importing `@rocketh/deploy` (that import would close an nx project-graph cycle).
- [ ] A changeset accompanies the change.
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass.

## Blocked by

- `prompt-capability-on-the-environment`: supplies the text-prompt capability and the per-capability predicate that `auto` branches on. It also edits the core types this task extends, so the ordering serialises those edits.

## Prompt

> Goal: make an unsignable transaction PAUSE and resolve interactively instead of throwing, so a deployer at a keyboard executes it on their Safe, pastes the hash, and the run continues in the same execution with state saved.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Confirm the capability predicate from the blocking task landed with the shape this task assumes, and confirm the policy union is still what you expect before extending it. If either differs, route to needs-attention rather than adapting silently.
>
> The central mechanic is VERIFIED, not assumed. A 2026-08-09 spike (code thrown away, findings recorded in the spec) established that the environment happily completes a transaction it never sent: feeding a user-supplied hash back from the broadcast choke point flows through the normal pipeline, `savePendingExecution` then `eth_getTransactionByHash` then `waitForTransaction`, and returns a real receipt with no send attempted. Build ON that pipeline. Do NOT reimplement pending-state saving or receipt waiting.
>
> Where to look. The seam is the single `broadcastTransaction` choke point in `packages/rocketh/src/environment/index.ts`, which consults the policy ONLY inside its `unsignable` branch. The state-saving funnels are `savePendingExecution` and `savePendingDeployment` in the same module; `broadcastExecution` returns via the former. The policy union and the policy FRAME live in `@rocketh/core`'s types: the frame is deliberately an OBJECT rather than a bare string precisely so this slice can carry per-scope prompt-answer information without re-cutting the seam, so use it rather than adding a parallel channel.
>
> Invariants you must not violate, all of them already landed and pinned by tests:
>
> - The policy frame forces `throw` over `ask`, NEVER over impersonation. It is consulted only in the `unsignable` branch. `autoImpersonate` is a NODE CAPABILITY resolved BEFORE the seam; `onUnknownSigner` is the POLICY afterwards. They are orthogonal and there is no `impersonate` policy value. ADR 0006 is the durable record; read it.
> - A `TransactionToBroadcast` with `type: 'raw'` is pre-signed and returns before any signer lookup, so it can never produce an unknown-signer error. The plain-transaction path that can is the `tx()` helper.
> - `catchUnknownSigner` takes a THUNK, not v1's promise-or-thunk, because a promise has already started before the frame can be pushed.
> - The unwrapped throw is the PRIMARY deferral workflow, so the error MESSAGE is the deliverable, not a summary. Do not degrade it on the "cannot sign" path.
>
> The tracker detail. The transaction-hash tracker only records hashes it observes on `eth_sendTransaction` and `eth_sendRawTransaction`, so an externally-executed transaction is invisible to it and gas reporting (which iterates the tracker's list) would silently omit it. The tracker type exposes its list as a mutable array, so registering the pasted hash is a one-liner. Do it; the spec decided this deliberately rather than accepting the quiet hole.
>
> Testing. Inject a fake prompt returning a canned hash or "cannot sign" so the interactive path is drivable without a TTY. Tests belong in `packages/rocketh/test/` with a locally-built real environment and a mock provider returning crafted receipts, because `rocketh` must not depend on `@rocketh/test-utils` (see `CONTEXT.md` under _test environment_). A sibling task adds a shared injectable fake for EXTENSION-package tests; you do not need it and must not depend on it.
>
> Watch the tautology trap. A test that "passes" because both policy values resolve to the same behaviour proves nothing; a previous slice shipped exactly such a test and flagged it honestly. Make sure each assertion can actually FAIL if the behaviour regresses, and say in the done record how you checked.
>
> Done means: `ask` exists, `auto` is capability-aware in both directions, a pasted hash resolves an execution through the real pipeline with no send attempted, "cannot sign" degrades to the throw path, a two-step action completes in one run, and no signable account's behaviour changed at all.
