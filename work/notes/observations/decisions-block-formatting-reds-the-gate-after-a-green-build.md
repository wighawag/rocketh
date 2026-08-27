---
title: 'A builder Decisions block is transcribed into a format-gated file, so ordinary markdown emphasis reds the acceptance gate after a good build'
type: observation
status: spotted
spotted: 2026-08-27
---

# What happened

`execute-guard-seam-and-call-kind` built cleanly (a new guard module, an extracted read module, a 587-line integration test, a changeset, README updates) and then FAILED its acceptance gate. The failure had nothing to do with the code:

```
[warn] work/tasks/done/execute-guard-seam-and-call-kind.md
[warn] Code style issues found in the above file. Run Prettier with --write to fix.
```

The builder's `## Decisions` block, transcribed verbatim into the done record by the runner, used asterisk emphasis in three places (`*through*`, `*exactly*`, `*possibly*`). Prettier normalises markdown emphasis to underscores, `pnpm format:check` runs over `.` (which includes `work/`), and the whole gate is one `&&` chain whose FIRST link is `format:check`. Reproduced against a clean clone of the branch tip, so it is not an artifact of the job worktree.

# Why it is worth writing down

**The failure is silent about what actually matters.** Because `format:check` is the first link in the chain, `pnpm build`, `pnpm typecheck`, `pnpm test` and `pnpm test:getting-started` never ran. The needs-attention reason therefore says "acceptance gate failed" for a task whose code was never gated at all, which is the opposite of the impression it gives. Anyone reading the bounce would reasonably assume the implementation was judged and found wanting.

**It is reachable by writing correct markdown.** `*emphasis*` is not a mistake; it is one of the two spellings CommonMark defines, and prettier merely has a preference. So this is not a builder that did something wrong, it is a shape the system makes wrong. Every future task carrying a Decisions block with an asterisk span, a non-canonical list marker, or a long line prettier would reflow will hit the same wall, and the repo asks EVERY task to record its decisions that way (`work/protocol/task-template.md`).

**It costs a full cycle.** The recovery is a claim, an agent run, a rebase and a re-gate, for a change of two characters in a file the runner itself generated.

# The three places it could be fixed

Recorded without picking one, since this is somebody's design decision rather than a bug with an obvious owner.

1. **The runner formats what it transcribes.** It already owns the done-move and the transcription, so it is the one component that knows the text is about to enter a formatted tree. This is the only fix that cannot be forgotten by a future builder.
2. **The repo's `verify` runs `format:check` LAST**, or at least after the tests. That would not prevent the red, but it would mean the gate reports what the code did before it reports what the prose looked like, which is the more useful failure.
3. **Builders are told to write underscores.** Cheapest, and the least reliable, since it depends on every agent remembering a formatting convention that is invisible until it fails.

A related, milder version of the same shape: `format:check` covering `work/` means any hand-written protocol artifact can red a code gate. That is arguably correct (the repo does want its prose formatted) and is not being questioned here; the objection is only that a generated artifact is subject to it without anything generating it correctly.
