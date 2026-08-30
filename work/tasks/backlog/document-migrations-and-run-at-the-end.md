---
title: 'Document the script id / migrations contract and runAtTheEnd, including what they do around a deferral'
slug: document-migrations-and-run-at-the-end
blockedBy: []
covers: []
---

## What to build

> **FORWARD-POINTER (added after tasking, READ THIS FIRST).** Three things landed after this task was written, and each one changes what you should write. Confirm each against the code and the shipped pages before drafting.
>
> 1. **The `throw` path already has SHIPPED user-facing prose about this exact mechanism, and you must not contradict it.** Point 3 below calls the plain `throw` path "safe by accident: the run aborts before the executor reaches its record site, so nothing is written and the re-run converges". That is TRUE, and it is one half of the story. The other half now ships in the deferral message itself (`describeDeferralRepeatExecution` in `packages/rocketh/src/environment/unknownSignerPolicy.ts`, plus `documentation/unknown-signers/index.md`): because nothing was recorded, the re-run surfaces the SAME transaction again, so an operator who already executed it out of band can execute it TWICE. Same mechanism, two consequences: no silent skip (safe), but a real double-execution exposure (hazardous). Write both, and reuse the shipped wording rather than coining a second description of the migration contract. Read that function's JSDoc first; it explains why the cause is the abort preceding the record and NOT a missing guard, which is the framing this page must also avoid.
> 2. **`captured-transactions` HAS landed**, so the conditional in the `runAtTheEnd` section below resolves: show `env.capturedTransactions` and the `--write-transactions <file>` flag as the primary answer, and mention that the hand-rolled `catchUnknownSigner` collection still works. Do NOT reach for `deferred-transaction-collector`, which is dropped. There is a whole page at `documentation/captured-transactions/index.md`; link it rather than restating it, and note the boundary it already documents (a DEFERRED transaction produces no captured entry, which is precisely the interaction a reader of this page will wonder about).
> 3. **The interactive section of `documentation/unknown-signers/index.md` was just rewritten** (a not-found pasted hash is now re-asked with the previous answer pre-filled, bounded to three attempts shared across both re-ask kinds, instead of failing the run). Point 3's clarification that the `ask` path does NOT defer is still correct, but check the current page before adding the cross-reference so you extend what is there rather than duplicating or contradicting it.

Two executor features are shipped, used, and documented nowhere: `documentation/` mentions neither `migrations` nor `runAtTheEnd`.

**The `id` / `return true` contract.** A deploy script that carries an `id` and returns `true` has that id written to `.migrations.json`, and is then skipped entirely on every later run. Users need to be told four things about it, only the first of which is obvious:

1. what it does, and that the unit is the WHOLE script, not a step within it
2. that it is a fast-path skip layered ON TOP of chain-derived idempotency, never a replacement for it. It self-heals only because the steps under it are chain-guarded: without a guard, run 2 does the work again, `return true` is never reached, and the id is never recorded
3. that `return true` asserts everything in this script is done, so it must not be returned on a path where a step was deferred to a Safe and caught. That combination silently and permanently skips a step that never happened: the operator executes the transaction on their Safe, re-runs, and the script never runs again, so nothing reconciles. **This is documentation's job alone: rocketh does NOT police it**, because `catchUnknownSigner` is a try/catch and a hand-written `try {} catch {}` produces the same outcome, so enforcement would only reach the user who used the supported tool (cancelled with reasoning in `work/tasks/cancelled/refuse-migration-record-when-a-script-deferred.md`, and in the 2026-08-27 amendment to ADR 0012). That makes this the single most important paragraph in the page, and it should be written as a warning the reader cannot skim past.

   Two clarifications belong with it. The interactive `ask` path does NOT defer, since it verifies that a real transaction landed, so a script that resolved interactively legitimately returns `true`. And the plain `throw` path is safe by accident: the run aborts before the executor reaches its record site, so nothing is written and the re-run converges.

4. that `.migrations.json` is per environment and lives with the deployment records, so wiping or not committing them re-runs the scripts

**`runAtTheEnd`.** A script marked `runAtTheEnd` runs after the normal scripts. It is worth documenting on its own, and it is worth documenting for the reason production teams actually use it: it is the hook where a deferred-transaction consumer lives (collect the transactions rocketh could not sign for during the run, then propose them as one Safe batch at the end). Two teams described building exactly that on hardhat-deploy v1, and everything needed to rebuild it on v2 already exists, but nothing says so.

Show the hand-rolled version, since it works today with no new API: wrap each privileged call in `catchUnknownSigner`, collect what it returns, and have a `runAtTheEnd` script propose the batch. If `captured-transactions` has landed by the time this is written, show that instead and mention that the hand-rolled form still works. (`deferred-transaction-collector` was dropped and superseded by it; do not reach for that spec.)

The unknown-signers page also needs the cross-reference in the other direction: the migrations feature exists, and here is how it interacts with a deferral.

Constrained by ADR 0012 (`docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md`), which is the reasoning behind points 2 and 3 and should be linked rather than restated at length.

## Acceptance criteria

- [ ] The docs site documents `id` / `return true` / `.migrations.json`, covering all four points above
- [ ] The docs site documents `runAtTheEnd`, including the deferred-transaction-consumer pattern as its motivating example
- [ ] The unknown-signers page cross-references the migrations interaction, extending the interactive and deferral sections as they now stand rather than duplicating them
- [ ] The page states BOTH consequences of the plain `throw` path (nothing is recorded, so no step is silently skipped, AND the same transaction is surfaced again on the re-run, so it can be executed twice) and does not contradict the wording already shipped in the deferral message
- [ ] The `runAtTheEnd` example uses the shipped captured-transactions feature and links its page, noting that a deferred transaction produces no captured entry
- [ ] Every claim is verified against the executor rather than against this task's description of it (the recording happens in the executor's script loop; `hasMigrationBeenDone` is on the public `Environment`, `recordMigration` is internal to `rocketh`, and that asymmetry is deliberate)
- [ ] Prose is not hard-wrapped (one line per paragraph) and contains no em dashes, per the repo's output rules
- [ ] Any code sample compiles against the current API (do not paste a v1 sample)

## Blocked by

- None, can start immediately. Best written after `refuse-migration-record-when-a-script-deferred` lands, so the docs describe the error the user will actually hit, but not blocked on it: write it to describe the hazard, and tighten to describe the error if it has landed by then.

## Prompt

> Document two shipped-but-undocumented executor features in rocketh's documentation site: the script `id` / `return true` / `.migrations.json` mechanism, and `runAtTheEnd`.
>
> Read first: `docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md`, then the script-running loop in `packages/rocketh/src/executor/index.ts` (where it consults `hasMigrationBeenDone` and calls `recordMigration`), then the migrations load/save code in `packages/rocketh/src/environment/index.ts`, then the existing `documentation/unknown-signers/index.md` for the house voice and for where the cross-reference belongs.
>
> The non-obvious content, and the reason this task exists rather than being a stub: the migrations record is a fast-path skip on top of chain-derived idempotency, not a replacement for it, and `return true` is an assertion that everything in the script is done. A script that deferred a privileged call to a Safe and caught it can reach that `return true` having skipped a step that never happened, which silently and permanently skips it forever. Explain the mechanism so the user can reason about it, and link ADR 0012 for the underlying rule rather than restating the whole argument.
>
> For `runAtTheEnd`, lead with the motivating use case: it is where a consumer of deferred transactions lives, collecting the calls rocketh could not sign for during the run and proposing them as one multisig batch at the end. Two production teams built exactly this on hardhat-deploy v1. Everything needed already exists in v2; nothing currently says so.
>
> Verify every claim against the code before writing it. Do not describe behaviour from this task's summary of it, and do not carry over a hardhat-deploy v1 code sample.
>
> Repo output rules apply to the prose you write: no em dashes anywhere, and do not hard-wrap paragraphs (one line per paragraph, let the editor soft-wrap).
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). If the executor has moved on, route to needs-attention rather than documenting a stale premise.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT. Do not write the done record, the commit message or the PR body, and do not edit this task body.
