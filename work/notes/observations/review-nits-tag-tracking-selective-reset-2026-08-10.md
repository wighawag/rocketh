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
