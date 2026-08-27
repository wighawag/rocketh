---
title: 'The loop closes: a deferred Safe upgrade is skipped on the re-run, and is never handed over twice'
slug: execute-guard-convergence-scenario
spec: execute-state-guard
blockedBy: [execute-guard-storage-kind]
covers: [2, 3]
---

## What to build

The story the entire feature exists for, written end to end as a deploy script, in the package where a v1 migrant will look for it.

The loop, in two runs against one persistent set of deployment records:

1. **Run 1.** A deploy script performs a privileged call from an account that is UNSIGNABLE for this run, which is what a Safe is as far as rocketh is concerned. The call carries a guard, and the chain does not yet satisfy it. rocketh evaluates the guard, finds the step still needed, builds the transaction, hits the unknown-signer seam and defers: it surfaces the exact transaction to execute out of band.
2. **Out of band.** The operator executes that transaction on their Safe. In the test, that is a storage slot moving, which is how the existing scenario suite simulates it.
3. **Run 2.** The same script runs again, unedited. The guard now reads the new state, is satisfied, and the step is SKIPPED. No transaction is built, the seam is never reached, and the operator is not handed the same privileged transaction a second time. The run completes.

Step 3 is the whole point, and it is the property that nothing in rocketh has today: under a deferral rocketh observes nothing, records nothing, and therefore surfaces the identical transaction on every subsequent run until the chain itself says otherwise. For an idempotent setter that is a wasted round trip. For a mint, a transfer, an increment or a governance action carrying its own nonce, following the instructions a second time is a loss.

Use the canonical topology rather than a toy: a proxy upgrade observed through the EIP-1967 implementation slot, since that is both the commonest real shape and the one requiring the storage guard kind.

The test must also pin what did NOT happen: nothing is persisted by this mechanism. No new file appears between the runs and the deployment records are unchanged by the guard, mirroring the no-side-effects assertions the existing unknown-signer scenarios already make. Idempotency here is chain-derived, and a test that would still pass if a state file appeared is not testing the guarantee.

Written as documentation, not merely as coverage: a hardhat-deploy v1 user should be able to read this file and see how their Safe-governed upgrade script converges.

## Acceptance criteria

- [ ] Run 1 defers the privileged call, surfacing the transaction to execute out of band
- [ ] Between the runs the simulated Safe execution moves the observed state, with no rocketh involvement
- [ ] Run 2 SKIPS the step: no transaction is built and the unknown-signer seam is never reached. Assert both from the recorded provider requests, not from the return value alone
- [ ] Run 2 completes rather than aborting, and the operator is not handed the deferred transaction a second time
- [ ] The script is byte-identical between the two runs, since the convergence must not require the author to edit anything
- [ ] No file is written by the guard, and the deployment records are unchanged across the two runs
- [ ] A mixed run is demonstrated: a signable step in the same script broadcasts normally in both runs while the unsignable guarded step defers then skips
- [ ] The test reads as documentation, in the style of the existing unknown-signer scenario suite, with the narrative in the file
- [ ] A changeset accompanies the change, empty if nothing shipped changes
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass

## Blocked by

- `execute-guard-storage-kind`: the scenario is a proxy upgrade observed through the EIP-1967 implementation slot, so the storage kind and the comparison rule beneath it must exist. This task writes in a different package's test folder from the guard tasks, so it does not contend with them for files.

## Prompt

> Goal: prove, end to end and readably, that a privileged step deferred to a Safe is skipped on the next run, so the operator cannot execute it twice by following the instructions twice.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Confirm the guard's option shape, the storage kind and the skip result landed as assumed here.
>
> READ FIRST: `docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md`. It establishes why this cannot be solved by remembering: under `throw` rocketh observed nothing, so it may record nothing, and the chain-derived guard is the correctness mechanism rather than an optimisation. `docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md` defines the seam and what an unsignable account is. `docs/adr/0013-the-execute-guard-is-a-declared-read.md` covers the guard itself.
>
> Where to look, and this is the important pointer: `@rocketh/unknown-signer`'s scenario suite already tells exactly this story WITHOUT a guard, using a proxy upgrade whose skip comes from `@rocketh/proxy`'s own hard-coded implementation comparison. Read it first. It establishes the vocabulary (a Safe is simply an address that is unsignable for the run: no local signing material, absent from the node's accounts, and not impersonated, built as a named account declared as a bare address with auto-impersonation off), the technique for simulating out-of-band execution (move the storage slot by hand between runs), and the assertions that nothing is persisted. Your scenario is the same loop for a call the USER guards, rather than one rocketh happens to guard internally.
>
> The distinction worth keeping straight while you write it: auto-impersonation is a node capability resolved BEFORE the seam, and the unknown-signer policy is what happens afterwards. Your scenario needs the account to remain genuinely unsignable, so impersonation stays off. The guard is orthogonal to both: it answers "is this needed", never "can we sign it", and an unsatisfied guard on an unsignable account must still defer exactly as it does today.
>
> Test harness notes. `createTestEnvironment` builds a real environment against a mock provider that is not an EVM, so chain state is whatever you can; a persistent deployment store can be reused across two environments, which is how you get two runs that share records. The provider records every request, which is how you prove run 2 sent nothing and never reached the seam.
>
> Done means: two runs, one unedited script, a deferral then a skip, nothing persisted, and a file a v1 migrant can read as the answer to "how does my Safe-governed upgrade script converge".
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT. Do not write the done record, the commit message or the PR body, and do not edit this task file.
>
> Write any markdown emphasis in that block with UNDERSCORES (`_like this_`), not asterisks. The runner transcribes the block verbatim into the done record, `pnpm format:check` covers `work/` and is the FIRST link of the acceptance gate, and prettier normalises asterisk emphasis. `execute-guard-seam-and-call-kind` lost a whole cycle to exactly that: the build was green and the gate red before build, typecheck or test ever ran (`work/notes/observations/decisions-block-formatting-reds-the-gate-after-a-green-build.md`).
