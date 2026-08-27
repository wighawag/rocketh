---
title: 'A skipped step explains itself: what was read, from where, and what it was compared against'
slug: execute-guard-evaluation-is-legible
spec: execute-state-guard
blockedBy: [execute-guard-failure-is-fatal]
covers: [6]
---

## What to build

The user-facing half of the evaluation. The record already exists as a value returned to the caller; this task makes it VISIBLE to the person watching the run, so a skipped step is legible rather than mysterious.

Silence is the failure mode here. A guarded step that is satisfied produces no transaction, no receipt and no output, so a run where a guard is subtly wrong looks exactly like a run where the work was genuinely already done. Anyone debugging "why did my upgrade not happen" is looking at the run output, and the answer needs to be there.

So when a guard decides, say so through the environment's existing user-facing message channel: which contract was read and how (a function call, or a slot), the value that came back, the selected value where a selection was made, what it was compared against where there was an expected value, and the verdict. Say it for a SKIP, because that is the case with no other evidence. Whether a proceed is also worth announcing is a judgement call: it already produces a transaction, so lean quiet, and if you do announce it, keep it to one line.

Two constraints on the wording. Keep it short: this is a deploy script that may perform dozens of guarded steps, and a paragraph per step buries the run. And no em dashes anywhere in message text, which is a repo rule that existing message code already calls out.

Where a value is a raw 32-byte word from a slot, show the decoded value, since the word on its own is not what the author wrote in their script.

## Acceptance criteria

- [ ] A skipped guarded step reports, through the environment's user-facing message channel, the target read, how it was read, the value, the selection where there was one, the expected value where there was one, and the verdict
- [ ] Both guard kinds are covered, and a storage read reports the decoded value rather than only the raw word
- [ ] The message goes through the environment's existing channel, not to the console directly (see ADR 0009 on where user-facing notices go)
- [ ] The reported content comes from the evaluation record produced by the evaluator, not re-derived at the message site, so the two cannot disagree
- [ ] Message text contains no em dashes
- [ ] Tests assert what the user is told, not merely that something was said
- [ ] A changeset accompanies the change
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass

## Blocked by

- `execute-guard-failure-is-fatal`: this task reports on both kinds and on selections, so all of that must exist, and it edits the same module as the tasks before it, which serialises the edits.

## Prompt

> Goal: make a skipped step explain itself, so that "nothing happened" and "nothing needed to happen" are distinguishable from the run output alone.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Confirm the evaluation record's shape and that both guard kinds and the selection feature landed; if an earlier task already reports the evaluation to the user, verify the content against the criteria here rather than adding a second message.
>
> READ FIRST: `docs/adr/0009-user-facing-notices-stay-on-console.md` for where a user-facing notice belongs, and `docs/adr/0013-the-execute-guard-is-a-declared-read.md` for why there is anything to report at all. That second point is the whole argument: had the guard been an opaque predicate, there would be no read to name, no expected value to show, and this task could not exist. What you are building is the payoff of that decision, so take the content from the evaluation record rather than reconstructing it at the message site.
>
> Where to look. The environment exposes a message channel that the unknown-signer deferral path already uses for its own user-facing output; follow that, and look at how the deferral message is composed and tested for the house style. The guard module from the seam task owns the evaluation record.
>
> Judgement you are expected to exercise: how loud to be. A skip must be visible, because it is the case with no other trace. A proceed already leaves a transaction behind. Dozens of guarded steps in one script is a normal shape, so a verbose format is a real cost. Prefer one line, and record what you chose.
>
> Done means: a reader of a run's output can tell that a step was skipped, what rocketh looked at to decide that, and what it expected, without reading the script.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT, in particular the message format and whether you say anything on the proceed path. Do not write the done record, the commit message or the PR body, and do not edit this task file.
