---
title: "A needs-attention sidecar is prettier-dirty by construction, so one bounce reds the NEXT task's gate, which writes another dirty sidecar"
type: observation
status: spotted
spotted: 2026-08-27
---

# The cascade

Observed live while driving the `execute-guard-*` series, and it is a loop rather than an incident:

1. A task bounces for any reason. The runner writes `work/questions/task-<slug>.md`, quoting the gate's raw output inside a blockquote.
2. That raw output is program output: vitest's indented tree, pnpm's banners, nested `>` levels. Prettier reflows blockquote content and normalises the leading whitespace, so **the sidecar it just wrote does not satisfy `prettier --check`**.
3. `pnpm format:check` covers `.`, which includes `work/`, and it is the FIRST link of the acceptance-gate chain.
4. So the NEXT task's gate fails on a file it has never touched, before its own build, typecheck or tests ever run.
5. That failure surfaces a NEW sidecar, containing THIS failure's raw output, which is also dirty.

Step 5 closes the loop: one genuine failure becomes an unbounded series of unrelated failures, each blaming a different task. Concretely: `execute-guard-storage-kind` bounced on a flaky `@rocketh/export` test, and the sidecar written for it then bounced `execute-guard-failure-is-fatal`, whose diff touches neither package.

The exact diff prettier wants is the giveaway that nothing is wrong with the content:

```
< > ❯ |@rocketh/export| test/export.test.ts (35 tests | 1 failed) 21244ms
---
> >  ❯ |@rocketh/export| test/export.test.ts (35 tests | 1 failed) 21244ms
```

One leading space inside a quoted program transcript.

# Why this is the same finding as two others

This is the third instance this drive of ONE underlying shape: **`format:check` covers `work/`, and several things that write into `work/` are machines that do not format their output.**

- `work/notes/observations/decisions-block-formatting-reds-the-gate-after-a-green-build.md`: the transcribed `## Decisions` block, dirty via markdown emphasis.
- This note: the bounce sidecar, dirty via quoted program output.
- Both then red the gate at its first link, so the code is never even reached.

The sidecar case is strictly worse than the Decisions case, because a Decisions block reds only its own task, whereas a sidecar reds every task that follows it until somebody deletes it.

# Where a fix would go

- **The writer formats what it writes.** The runner already owns the sidecar's content and knows it is entering a formatted tree. Prettier-formatting the file it just generated ends the cascade at the source, and equally for the transcribed Decisions block.
- **Or fence the raw output** instead of quoting it. A fenced code block is opaque to prettier's reflowing, which is also a better rendering of a program transcript than a blockquote.
- **Or exclude machine-written paths** (`work/questions/`) from `format:check` via `.prettierignore`. Narrowest, and it leaves the Decisions half unsolved.

The second is probably the cheapest correct one, and it improves the artifact independently of the gate.

# Also worth fixing separately: a sidecar outlives its task

`work/questions/task-execute-guard-storage-kind.md` was still on `main` after that task reached `work/tasks/done/`. A question about how to proceed with a task that has since landed is answered by definition, and nothing collects it. That is the same sidecar-versus-state disagreement that failed the `advance-lifecycle` run earlier today for `spec:explore-unknown-signer-adapters`, in a different direction: there the answers were applied and the sidecar was left, here the task completed and the sidecar was left. Both leave the repo asserting an open question that is not open.
