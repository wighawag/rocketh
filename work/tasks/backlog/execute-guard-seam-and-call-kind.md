---
title: 'The execute guard seam: a declared call-kind read, evaluated before the transaction is built'
slug: execute-guard-seam-and-call-kind
spec: execute-state-guard
blockedBy: []
covers: [1, 4, 5, 9, 11, 12, 13]
needsAnswers: true
---

## What to build

The tracer bullet for the whole feature: one new option on `execute` that declares the on-chain condition under which the call is still needed, evaluated before anything is broadcast, with the evaluation exposed rather than reduced to a boolean.

**The option.** A `guard` on the execution arguments, a DISCRIMINATED union carrying `kind` from this first commit so the second kind (a storage read, a sibling task) and any later third are additive rather than a re-cut. This task ships `kind: 'call'` only.

**The read is declared, not closed over.** The guard names a target, a function and its arguments; rocketh performs the read. It must be able to read a contract OTHER than the one being executed, and that is the COMMON case rather than the exception: you call `upgrade` on a ProxyAdmin and observe the implementation on the proxy, you call `setPoolImpl` on a registry and observe the proxy behind it. So the guard's target accepts the same shape `read` already accepts and DEFAULTS to the contract being executed. Reuse the existing read path rather than reinventing target resolution, ABI typing or decoding; the guard must not be able to drift from what `read` does.

**The verdict.** `satisfied`, a predicate over the DECODED value. It is the primary form, not an escape hatch: two of the four real topologies the spec was validated against cannot be written as an equality at all (a tuple where only one component matters, an enum compared by negation). The `equals` sugar and the comparison rule are a separate task; do not build them here.

**What happens when it is satisfied.** No transaction is built, nothing is broadcast, the unknown-signer seam is never consulted, and the call reports that it was skipped. When it is not satisfied, the call proceeds exactly as it does today.

**The return type is CONDITIONAL on the presence of `guard`.** With no guard, `execute` returns what it returns today, unchanged, so no existing call site and no existing user script is touched. With a guard, it returns a result that distinguishes "skipped, here is the evaluation" from "sent, here is the receipt and the evaluation". This is the question `work/notes/ideas/fork-based-discovery-of-pending-privileged-work.md` flagged as unanswered; the answer is recorded in ADR 0013.

**The evaluation is a first-class value, and evaluable on its own.** Export the evaluator as a curried function in its own right, so the guard can be evaluated WITHOUT executing the call. That is what a later collector needs in order to compute the pending set before proposing a batch, and what `state-change-provenance` consumes later. Getting this seam right now is what keeps both of those additive. The record carries what was read, the target it was read from, and the verdict. Remember the extension rule: an extension package's ROOT may export only curried `(env) => …` functions, and every entry is called as `value(env)` at setup, so the evaluator must be curried like everything else in this package.

**While you are here, three stale public type aliases.** `ExecuteFunction`, `ExecuteFunctionByName` and `TxFunction` in this package declare a return of `EIP1193DATA` while the functions they describe return `EIP1193TransactionReceipt`. They are exported, so they are published API, and they are referenced nowhere in this repo. Correct them to match reality, and extend the two execute ones to the new conditional shape.

## Acceptance criteria

- [ ] `execute` and `executeByName` accept a `guard`, discriminated on `kind`, with `kind: 'call'` implemented
- [ ] The guard reads a target OTHER than the contract being executed when one is given, and defaults to the executed contract when none is
- [ ] The guard's function name and arguments are typed against the ABI of the contract it READS, so a renamed getter is a compile error. Pinned by a type-level assertion in the test suite, which the repo's checking tsconfig actually enforces
- [ ] A satisfied guard sends NO transaction. Assert it from the recorded provider requests (no `eth_sendTransaction` and no `eth_sendRawTransaction`), not merely from the return value
- [ ] An unsatisfied guard executes exactly as today, same transaction, same receipt
- [ ] An unguarded `execute` call's return type is UNCHANGED, pinned by a type-level assertion so a later widening cannot land silently
- [ ] The evaluator is exported as a curried function and can be called standalone, without executing anything, returning the evaluation record
- [ ] The evaluation record is returned from a guarded `execute` on both paths (skipped and sent)
- [ ] A NEGATION is expressible and exists as a test: a getter returning an enum where the step is needed unless the state is the terminal one. This is one of the two topologies that proves `satisfied` cannot be reduced to an equality, and the four-state operation enum of OpenZeppelin's `TimelockController` is verified in `work/notes/findings/governance-upgrade-topologies-in-the-wild.md` and is the intended fixture
- [ ] `ExecuteFunction`, `ExecuteFunctionByName` and `TxFunction` describe what their functions actually return
- [ ] Tests mirror the repo's integration-test-as-documentation style, using `createTestEnvironment` and `createMockArtifact` from `@rocketh/test-utils`
- [ ] A changeset accompanies the change
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass

## Blocked by

- None, can start immediately.

## Prompt

> Goal: give `execute` an answer to "is this call still needed?", as a DECLARED read that rocketh performs, evaluates before building any transaction, and reports on. Every other primitive already has one: `deploy` compares bytecode, `deployViaProxy` compares the current implementation address, `execute` compares nothing and runs whatever it is handed.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code, the relevant ADRs, and anything since landed in `work/tasks/done/`? If an assumption here is stale, route the task to needs-attention with the discrepancy rather than building on it.
>
> READ FIRST: `docs/adr/0013-the-execute-guard-is-a-declared-read.md` is the governing decision for this task and explains the shape you are building AND the shape you are not. `docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md` is why the guard exists at all: rocketh cannot REMEMBER that a privileged step is done, because under a deferral it observed nothing, so the chain-derived guard is the correctness mechanism and nothing may be persisted here. `docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md` pins the seam you must not disturb.
>
> Where to look. `execute`, `executeByName`, `read` and `readByName` are curried functions in `@rocketh/read-execute`, and they are small. `execute` encodes calldata with viem, builds an EIP-1193 transaction object and hands it to the environment's single broadcast entry point for a non-deployment transaction, which is where the unknown-signer seam lives one level down. `read` encodes the same way and does an `eth_call`, plus a retry loop for the empty-return case. Your guard's `call` kind should go THROUGH that read path, not beside it, so the two cannot drift; note that this means the guard inherits the empty-return retry, which is intended and is pinned by a sibling task on fatal guards.
>
> The domain vocabulary: a guard's TARGET is a `MinimalDeployment`, which is `{address, abi}` and nothing else; the guard is EVALUATED to produce an EVALUATION record; a guard that is SATISFIED means the call is no longer needed and is SKIPPED. Do not name the skipped state after a transaction, since no transaction exists on that path.
>
> The conditional return type is the interesting part of the design and the reason story 13 (this stays additive) holds. Without a `guard` the signature must be IDENTICAL to today's, so that the five internal call sites in `@rocketh/proxy` and `@rocketh/diamond`, and every user script in the wild, are untouched and no user has to start handling an `undefined` receipt. Prove that with a type-level assertion, not by inspection.
>
> The evaluator must stand alone. Two features that do not exist yet consume it: a collector that computes the set of pending privileged actions WITHOUT executing them, and state-change provenance which records what changed. If you find yourself writing the evaluation inline inside `execute` and returning only a boolean, stop, because that is the shape both of those cannot use and the shape ADR 0013 rejects.
>
> Extension surface rule, from `AGENTS.md` and `CONTEXT.md`: this package's ROOT export surface may contain only curried `(env) => …` functions plus types, because `withEnvironment` calls EVERY entry as `value(env)` at setup and refuses a class or a constant BY NAME at deploy-script run time. A new exported evaluator must therefore be curried too.
>
> Test harness notes that will save you an hour. `createTestEnvironment` builds a REAL environment against a mock provider; it is not an EVM, so you can the RPC responses your test needs. Its default `eth_call` answers `0x`, which decodes to viem's zero-data error rather than to a value, so every guard test must set an `eth_call` response explicitly. The provider records every request and exposes them, which is how you assert that a skipped call broadcast nothing. A test that needs "unsatisfied on run 1, satisfied on run 2" holds the state in a closure over the canned response.
>
> Why `satisfied` rather than an equality: two of the four topologies the spec was validated against cannot be written as one. A getter returning a tuple where only one component matters is handled by a sibling task; the other is a NEGATION, where the step is needed unless an enum has reached its terminal state, and that one is yours. Use the timelock operation enum from the findings note as the fixture, and note that driving a timelock is explicitly NOT the guard's job (that belongs to `unsignable-routes`); you are only observing whether the effect landed.
>
> Done means: a guarded `execute` skips when the chain already says so, executes when it does not, never sends a transaction on the skip path, reports what it read on both paths, and an unguarded call is bit-for-bit the same API it was before.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT: the exact option and result type names, where the evaluator lives, and anything you had to choose that this task did not specify. Do not write the done record, the commit message or the PR body, and do not edit this task file.
