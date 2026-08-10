---
title: dorfl's tasker-review leg truncates at the model output cap, discarding a good task set
slug: dorfl-tasker-review-truncates-at-output-cap-2026-08-10
date: 2026-08-10
---

# `dorfl do spec:<slug>` cannot task a large spec (dorfl 0.11.2)

Attempting to task `unknown-signer-interactive` failed **twice, identically**:

```
>> LOCKED 'unknown-signer-interactive' for tasking on origin (unified lock).
review agent produced no parseable {verdict, findings} result
```

Then the process died. No task branch, no PR, nothing emitted; the spec correctly stayed in `work/specs/ready/`, but the tasking lock was left HELD both times and had to be cleared by hand with `dorfl release-lock spec:unknown-signer-interactive`.

**This is deterministic, not a flake.** Two runs, ~35 min apart, same failure.

## Root cause (verified, not inferred)

The TASKER itself worked fine — it produced a good decomposition (slugs including `ask-policy-interactive-resolver` plus a downstream deployment task, each with well-formed acceptance criteria, `blockedBy` and prompts). The **review** leg is what breaks, and the whole run is discarded with it.

Evidence from the two review sessions (`~/.pi/agent/sessions/--home-wighawag-.dorfl-claim-github-com__wighawag__rocketh__spec_unknown-signer-interactive--/task-review-*.jsonl`), reading the last record of each:

| review session        | `usage.output` | `stop_reason` |
| --------------------- | -------------- | ------------- |
| attempt 1 (`msnag5h`) | **16384**      | `None`        |
| attempt 2 (`msnem6p`) | **16384**      | `None`        |

Both hit the 16,384 output-token cap EXACTLY and truncated mid-word, in the middle of a task body's `## Prompt` section. So the response never contains a complete JSON object, `extractJsonObjectSpan` returns `undefined`, and `parseReviewVerdict` throws `ReviewParseError` (`packages/dorfl/src/review-verdict.ts:109`).

The parser is NOT the bug — it is behaving correctly by refusing to invent a verdict (its comment is explicit that a throw must never become a silent approve). The bug is structural, upstream:

- `verdictContractPrompt()` (`packages/dorfl/src/review-verdict.ts:317`) asks for
  `"edits": [ {"path": "work/tasks/backlog/<slug>.md", "content": "<full replacement>"} ]`
  — i.e. the **FULL replacement body of every edited task file**, in the SAME single JSON object as the verdict.
- `buildTaskReviewPrompt()` (`packages/dorfl/src/tasker-review-loop.ts:600-666`) leans on that channel by design: "you EMIT the edits to apply as FULL replacement content and the runner applies them".

For a spec that fans out several substantial tasks, the `edits` payload ALONE exceeds the output cap. So the failure scales with decomposition size: the richer the spec, the more certain the tasker-review is to fail. It will fail every time on this spec, and on any spec of comparable size.

Aggravating details worth fixing alongside:

- **The verdict is lost with the edits.** Because `verdict` shares one object with the unbounded `edits`, truncation destroys the routable decision too. Had the verdict been emitted separately/first, a truncated edits payload could still have been routed (block/needs-attention) instead of aborting opaquely.
- **Truncation is not detected, though it is trivially detectable.** `output === cap` with `stop_reason: None` is a distinguishable signal. Reporting it as "produced no parseable result" sends the operator hunting for a malformed-JSON or flaky-model problem; the first response to this was to assume a flake and retry, which cost a second full tasking run.
- **`launched.ok` was true**, so nothing before the parse flagged a problem.
- **The lock was not released and no needs-attention sidecar was written** (`work/questions/spec-unknown-signer-interactive.md` does not exist on `main`), so the documented bounce transition did not complete on this abort path.

## Impact on this repo

Spec auto-tasking is effectively unavailable for any non-trivial spec here, including the three still resting in `work/specs/ready/` (`unknown-signer-interactive`, `explore-unknown-signer-adapters`, `unknown-signer-migration-and-patterns`, plus `tag-tracking-selective-reset`). Each attempt burns a full tasker run and leaves a lock to clear by hand.

`unknown-signer-interactive` was therefore tasked on the HUMAN path instead (the work contract makes the tasking lock optional for a human), with the decomposition reviewed as a PR diff rather than by the broken review agent.

## Where the fix belongs

Not in this repo — in `dorfl` (`../dorfl`, `packages/dorfl/src/`), around `tasker-review-loop.ts` + `review-verdict.ts`. Shape of the fix: get the unbounded full-file `edits` payload out of the same capped response as the verdict (emit edits to files, or one task per response, or a patch/verdict-first split), and make cap-truncation a named, distinguishable failure rather than an opaque parse error.
