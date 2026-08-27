---
title: 'A runner-generated question sidecar quoting gate output is not prettier-clean, so `format:check` is red on main'
type: observation
status: spotted
spotted: 2026-08-27
---

`work/questions/task-execute-guard-storage-kind.md` (written by the runner's surface verb at `2c6984b7`) quotes the failing gate's terminal output inside a markdown blockquote, and prettier reflows blockquote bodies: `pnpm format:check` at `e5e14bd6` reports `[warn] work/questions/task-execute-guard-storage-kind.md` and exits 1, so the FIRST link of the acceptance gate is already red on `main` before any task's own change is applied.

Not fixed here: `prettier --write` on that file strips the column alignment out of a verbatim log, and the file is an unanswered question sidecar (`allAnswered=false`) belonging to another item. This is the `work/questions/` variant of `decisions-block-formatting-reds-the-gate-after-a-green-build.md`, which recorded the same shape for a `work/tasks/done/` record: a generated artifact lands in a format-gated tree with nothing generating it prettier-clean.
