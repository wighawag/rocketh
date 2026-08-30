---
title: review-gate non-blocking nits for 'tag-tracking-selective-reset' (Gate 2 approve)
date: 2026-08-10
status: open
reviewOf: tag-tracking-selective-reset
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'tag-tracking-selective-reset' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Task 2 leaves the confirmation-prompt UX (auto-approve flag, non-interactive/CI stdin, exit code on abort) as an in-scope decision for the implementer — worth watching that it does not collide with the concurrent ask-policy work in this backlog.
  (dependency-aware-selective-reset-via-reset-and-tags.md 'RECORD non-obvious in-scope decisions' block; sibling tasks ask-policy-interactive-resolver and per-call-ask-override-and-deferral-precedence also touch prompt behaviour.)
- US9 (legacy deployments never surprise-deleted) is listed under 'covers' on BOTH tasks. That is defensible (task 1 preserves absent-vs-empty distinction; task 2 enforces the non-match rule), but a reader scanning 'covers' may read it as duplication.
  (record-…-on-deployments.md covers:[1,2,3,9] and dependency-aware-…-tags.md covers:[4,5,6,7,8,9].)

## Update (2026-08-30, at tasking-merge)

The first finding above has gone STALE in the direction that resolves it. The ask-policy work it called "concurrent" is no longer concurrent: `ask-policy-interactive-resolver` and `per-call-ask-override-and-deferral-precedence` have both landed, so the prompt behaviour the implementer would have collided with is now settled and shipped. The finding is therefore no longer a thing to WATCH but a thing to FOLLOW, and the task body now carries a forward-pointer saying so and naming what shipped (`PromptExecutor`, capability by method presence per ADR 0007, `--skip-prompts`, and the existing reset confirmation in the executor as the thing to extend).

The second finding (US9 on both `covers:` lists) stands as written, and is still defensible for the reason given.
