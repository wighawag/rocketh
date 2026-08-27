---
title: 'equals sugar, selecting one output, and the comparison rule keyed off the ABI type'
slug: execute-guard-equals-and-output-selection
spec: execute-state-guard
blockedBy: [execute-guard-seam-and-call-kind]
covers: [9, 10]
---

## What to build

The common case, which is comparing one value against one expected value, without making the author write a predicate for it, and comparing it the way the value MEANS rather than the way JavaScript compares it.

**`equals`, sugar over `satisfied`.** The guard is satisfied when the value read equals the value given. It does not replace `satisfied`, which remains the primary form for anything that is not an equality.

**Selecting ONE output.** A guard often cares about one component of what a getter returns, and asserting the whole return would force the author to also state a value they do not care about. So the guard may select one of the read function's declared OUTPUTS, by name or by position, and the comparison (or the `satisfied` predicate) then applies to the SELECTED value. Note how viem already behaves, since it decides what "the value" is before you get to it: a function with ONE output decodes to that value unwrapped, a function with SEVERAL decodes to an array, and a function with none decodes to `undefined`. Selection is therefore meaningful exactly when there are several. Reaching INSIDE a struct is not part of this: that is what `satisfied` is for, and the boundary keeps the selector typed against the ABI rather than becoming a path language.

**The comparison rule, keyed off the ABI TYPE and never the JavaScript type.** This is possible only because the read is declared against a typed ABI, which is the whole argument for the guard's shape (ADR 0013).

- `address` and `bytes32` fold case. Addresses differ only by checksum casing and must match across it; a `bytes32` is a hex value whose casing carries no meaning, which covers the role identifiers, salts and operation ids a governance guard reads most.
- `string` is case SENSITIVE. It is user data where casing is meaningful, and folding it would make two different names compare equal.
- A bigint never coerces against a number.
- Arrays and struct returns compare deeply, with the same per-type rule applied elementwise.

**The evaluation record grows accordingly**: it carries the whole value read, the selected value if a selection was made, and what it was compared against. A user reading a skip must be able to see all three.

## Acceptance criteria

- [ ] `equals` satisfies the guard when the read (or selected) value matches, and leaves it unsatisfied when it does not
- [ ] An output can be selected by name and by position, typed against the read function's ABI outputs, so naming an output that does not exist is a compile error
- [ ] A selected output is what both `equals` and `satisfied` receive
- [ ] A checksummed expected address matches a lowercase read value, AND a lowercase expected address matches a checksummed read value (both directions)
- [ ] An upper-case `bytes32` role identifier matches a lower-case read value
- [ ] Two `string` values differing only in case do NOT match. This is the assertion a naive "lowercase everything" implementation passes wrongly, so it must exist
- [ ] A bigint does not match a number of the same magnitude
- [ ] A multi-output return compares elementwise under the per-type rule
- [ ] The evaluation record reports the value read, the selected value where there was one, and the expected value
- [ ] The tuple topology from the spec's paper validation exists as a test: a getter returning membership plus a delay, where only membership is asserted. VERIFY the exact return shape against OpenZeppelin's `AccessManager` source rather than trusting any prose about it, including this task's
- [ ] A changeset accompanies the change
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass

## Blocked by

- `execute-guard-seam-and-call-kind`: this task adds the comparison and selection layer to the guard that task creates, and edits the same module.

## Prompt

> Goal: make the commonest guard, "the value on chain is already the value I want", writable as one line, and make the comparison mean what the VALUE means rather than what JavaScript's `===` means.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). In particular, confirm the guard option, its evaluator and its evaluation record landed with the shape assumed here; if the seam task solved comparison already, route to needs-attention rather than building it twice.
>
> READ FIRST: `docs/adr/0013-the-execute-guard-is-a-declared-read.md`, which records why the comparison can be keyed off the ABI type at all (because the read is DECLARED, not closed over) and why `satisfied` stays the primary form.
>
> Why the casing rule is not a detail. `@rocketh/proxy` already lowercases both sides before comparing an implementation address, and it does so because an address that came back from a node and an address that came out of a deployment record routinely differ by checksum casing alone. Get this wrong in the guard and a re-run re-sends an upgrade that already happened, which is exactly the double-execution loss the guard exists to prevent (ADR 0012). Get it wrong in the other direction, by folding everything, and two different contract names compare equal.
>
> The rule is keyed off the ABI type, not off `typeof`. Both an address and a `bytes32` arrive as a JavaScript string, and so does a Solidity `string`, so a JavaScript-type-keyed implementation cannot tell them apart and will be wrong for one of them. The ABI you are reading against is right there, and the whole design exists to make it available at this point.
>
> Where to look. The guard module from the seam task, and `read` in the same package for how the ABI and the decoded value are obtained. viem's `decodeFunctionResult` is what decides the shape of the value you are comparing: one output unwraps, several become an array, none is `undefined`. Read it rather than assuming, since the selection feature depends on that behaviour.
>
> On the tuple test: the spec's paper validation names OpenZeppelin's `AccessManager.hasRole` as the topology where an equality cannot express the question, because the return carries both membership and an execution delay. The findings note in this repo does NOT verify that return shape, so verify it against OZ's source before you encode it in a fixture, and if it differs, use what you find and say so in your report.
>
> Done means: `equals` works, one output can be selected and typed, the four comparison behaviours are pinned by tests that can actually fail, and the evaluation says what was read, what was selected and what it was compared against.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT, in particular the selector's spelling and how you treated a single-output function under selection. Do not write the done record, the commit message or the PR body, and do not edit this task file.
>
> Write any markdown emphasis in that block with UNDERSCORES (`_like this_`), not asterisks. The runner transcribes the block verbatim into the done record, `pnpm format:check` covers `work/` and is the FIRST link of the acceptance gate, and prettier normalises asterisk emphasis. `execute-guard-seam-and-call-kind` lost a whole cycle to exactly that: the build was green and the gate red before build, typecheck or test ever ran (`work/notes/observations/decisions-block-formatting-reds-the-gate-after-a-green-build.md`).
