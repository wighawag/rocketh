---
title: 'Document the execute guard: how to declare it, how the comparison works, and the two traps'
slug: document-execute-state-guard
spec: execute-state-guard
blockedBy: [execute-guard-evaluation-is-legible, execute-guard-convergence-scenario]
covers: []
---

## What to build

The user-facing documentation for the guard, on the documentation site, plus the two cross-references that make it findable from where the problem is actually felt.

**The page itself** covers: what the guard answers and why `execute` is the only primitive that needed it; the two kinds, with the storage kind shown on the topology that requires it (a proxy upgrade through a ProxyAdmin, where no getter exists); reading a DIFFERENT contract from the one being called, which is the common case rather than the exception; `satisfied` as the primary form with `equals` as sugar; selecting one output; the comparison rule and WHY it differs per type; and what a skipped step looks like in the run output.

**Three things that will otherwise be learned the hard way**, and which the page must state plainly:

1. **A guard that throws fails the run.** It is never treated as "not satisfied". Say what that means in practice: a guard against a contract that is not deployed yet aborts rather than executing.
2. **`satisfied` hands you the value raw**, so a predicate comparing addresses with `===` will be wrong the moment one side is checksummed and the other is not. This is the one trap the `equals` sugar protects against and the predicate does not. Show the correct form.
3. **A guard is not a substitute for the operator's own care under a deferral**, but it IS what makes the re-run converge. Tie it to the deferral warning, which is the other half of the same story.

**The cross-references.** The unknown-signers page is where a Safe-governed team lands, and the guard is what closes their loop, so it needs a pointer both ways. If `deferral-message-warns-about-repeat-execution` has landed, its warning should point at the guard as the remedy rather than merely naming the hazard.

**What the page must NOT claim.** The guard persists nothing, records nothing, and is not consulted on a later run from any stored state. Idempotency is chain-derived, and the page should say so, because a reader who assumes the guard remembers its verdict will build on a guarantee that does not exist. There is also no mandatory mode and no way to require guards project-wide; absence of a guard is how a call says it has no observable effect.

Repo rules apply to prose as much as to code: no em dashes, and no hard wrapping inside a paragraph.

## Acceptance criteria

- [ ] A documentation page covers both kinds, the cross-contract read, `satisfied` and `equals`, output selection, and the comparison rule with its per-type reasoning
- [ ] The proxy topology is the worked example for the storage kind, since it is the case that motivated it
- [ ] The three traps above each appear, with the address-casing one showing the correct predicate form
- [ ] The page states that nothing is persisted and that idempotency is chain-derived
- [ ] The unknown-signers page links to the guard as what closes the deferral loop, and the guard page links back
- [ ] Every code sample in the page type-checks against the shipped API rather than being written from memory
- [ ] No em dashes, and paragraphs are not hard-wrapped
- [ ] An empty changeset accompanies the change if no package code is touched
- [ ] `pnpm format:check` passes, and `pnpm typecheck` and `pnpm test` still pass

## Blocked by

- `execute-guard-evaluation-is-legible` and `execute-guard-convergence-scenario`: the page documents shipped behaviour including the run output and the convergence loop, so both must exist first. These two transitively depend on every other guard task.

## Prompt

> Goal: document the guard for the person who has to use it, including the parts that will bite them.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Read the shipped API and the tests before writing a line of prose: this task was written before the feature existed, so where it and the code disagree, the CODE is right and you should say so in your report.
>
> READ FIRST: `docs/adr/0013-the-execute-guard-is-a-declared-read.md` for the shape and the reasoning, and `docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md` for why the guard is the correctness mechanism rather than an optimisation. Do not restate an ADR at length in the documentation: link it, and write for someone trying to get a deploy script working.
>
> Where to look. The documentation site lives in `documentation/`, organised as directories with an `index.md`, and there is already an unknown-signers section which is where a Safe-governed team lands. Follow the existing page style. The integration tests for the guard are written as documentation and are the most reliable source for correct sample code; the convergence scenario in `@rocketh/unknown-signer`'s tests is the story to summarise for the deferral loop.
>
> The most valuable paragraph in the page is the one about `satisfied` handing you the value raw. `equals` applies a comparison rule keyed off the ABI type, so an address folds case and a string does not, and a user who writes their own predicate silently opts out of all of that. An address comparison with `===` between a checksummed literal and a lowercase node response is wrong in a way that looks right, and the consequence is a privileged transaction being handed over a second time. Show the fix in a sample.
>
> Done means: someone with a ProxyAdmin, a Safe and a script can read the page and write a correct guard, including one that reads a slot on a different contract, without reading the source.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT, including any place where the shipped API differed from what this task assumed. Do not write the done record, the commit message or the PR body, and do not edit this task file.
